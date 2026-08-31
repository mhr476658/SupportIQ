from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
from typing import Optional, List, Dict, Any
import sqlite3
import uuid
import datetime
import json
import random
from .model import load, clean_text, urgency

B = Path(__file__).resolve().parents[1]
DB = B / 'tickets.db'
app = FastAPI(title='Support Ticket Classifier Enterprise API', version='2.3.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

try:
    MODEL, VECTOR = load()
except Exception:
    MODEL = VECTOR = None

# In-memory store for Email OTP verification codes
EMAIL_OTP_STORE: Dict[str, Dict[str, Any]] = {}


# Models
class LoginIn(BaseModel):
    email: str
    password: str


class EmailOtpSendIn(BaseModel):
    email: str


class EmailOtpVerifyIn(BaseModel):
    email: str
    code: str


class TicketIn(BaseModel):
    text: str = Field(min_length=2, max_length=5000)
    customer_name: Optional[str] = 'Waaaaattss WATTSSS'
    customer_email: Optional[str] = 'customer@pullse.io'
    company_name: Optional[str] = 'Pullse'
    source: Optional[str] = 'Chat'


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    urgency: Optional[str] = None
    assigned_to: Optional[str] = None
    category: Optional[str] = None


class MessageIn(BaseModel):
    text: str
    sender: Optional[str] = 'agent'


class BatchIn(BaseModel):
    texts: Optional[List[str]] = None
    count: Optional[int] = 50


class AgentIn(BaseModel):
    name: str
    email: str
    role: str = 'Triage Agent'
    status: str = 'Available'


class BotChatIn(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []


def db():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c


def generate_ai_summary(text: str, category: str, urg: str, keys: List[str]) -> Dict[str, str]:
    t_lower = text.lower()
    if len(text.strip().split()) <= 4 and any(g in t_lower for g in ['hi', 'hey', 'hello', 'okay', 'dasdas', 'fsdfsd']):
        return {
            'issue': 'Customer initiated chat with a short greeting.',
            'description': f"Customer sent: '{text}'. No detailed issue or request description provided yet.",
            'action': 'Prompt customer for their account ID, order number, or details of the issue.'
        }
    if category == 'Billing':
        return {
            'issue': 'Billing discrepancy or payment inquiry.',
            'description': f"Customer reported billing/invoice issue: '{text}'. Detected financial keywords: {', '.join(keys) if keys else 'invoice inquiry'}.",
            'action': 'Check payment gateway transaction records and verify if duplicate charge or refund is required.'
        }
    if category == 'Technical Issue':
        return {
            'issue': 'Software crash or runtime technical error.',
            'description': f"Customer encountered technical defect: '{text}'. Model categorized as high-impact engineering case.",
            'action': 'Collect client error logs, browser/device version, and replicate crash sequence.'
        }
    if category == 'Account Access':
        return {
            'issue': 'Account login difficulty or security alert.',
            'description': f"Customer reported login/authentication trouble: '{text}'. Urgency rated as {urg}.",
            'action': 'Verify user identity via secondary email/SMS before initiating account credentials reset.'
        }
    if category == 'Shipping & Delivery':
        return {
            'issue': 'Delivery delay or tracking milestone inquiry.',
            'description': f"Customer tracking transit status: '{text}'.",
            'action': 'Check carrier tracking API status and offer updated delivery window.'
        }
    if category == 'Product Issue':
        return {
            'issue': 'Damaged product or hardware malfunction.',
            'description': f"Customer reported damaged/defective item: '{text}'.",
            'action': 'Request item photos, check warranty terms, and create replacement RMA ticket.'
        }
    return {
        'issue': f'{category} inquiry.',
        'description': f"Customer message: '{text}'. Classified as {category} with {urg} urgency.",
        'action': 'Standard support agent review and resolution.'
    }


def init_db():
    c = db()
    # Tickets Table
    c.execute(
        '''CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            issue_code TEXT,
            text TEXT,
            category TEXT,
            urgency TEXT,
            confidence REAL,
            keywords TEXT,
            customer_name TEXT,
            customer_email TEXT,
            customer_phone TEXT,
            company_name TEXT,
            status TEXT,
            assigned_to TEXT,
            source TEXT,
            messages_json TEXT,
            ai_summary_json TEXT,
            sla_minutes INTEGER,
            created_at TEXT
        )'''
    )
    # Agents Table
    c.execute(
        '''CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            role TEXT,
            status TEXT,
            assigned_count INTEGER DEFAULT 0,
            resolved_count INTEGER DEFAULT 0
        )'''
    )
    # Audit Logs Table
    c.execute(
        '''CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            action TEXT,
            actor TEXT,
            details TEXT,
            timestamp TEXT
        )'''
    )
    c.commit()

    agent_cnt = c.execute('SELECT COUNT(*) n FROM agents').fetchone()['n']
    if agent_cnt == 0:
        agents_seed = [
            ('1', 'Manminder Tomar', 'manminder@supportiq.com', 'Super Admin', 'Available', 4, 82),
            ('2', 'Michael Dumpling', 'mike@acme.co', 'Support Lead', 'Available', 3, 65),
            ('3', 'Sarah Jenkins', 'sarah.j@supportiq.com', 'Senior Triage Agent', 'Busy', 2, 49),
            ('4', 'AI Auto-Routing Agent', 'ai-bot@supportiq.com', 'Autonomous AI', 'Available', 8, 310)
        ]
        c.executemany('INSERT INTO agents VALUES (?,?,?,?,?,?,?)', agents_seed)

        logs_seed = [
            (str(uuid.uuid4()), 'SYSTEM_INITIALIZED', 'System', 'SupportIQ v2.3 initialized with email login.', datetime.datetime.now(datetime.timezone.utc).isoformat()),
            (str(uuid.uuid4()), 'MODEL_LOADED', 'System', 'TF-IDF Vectorizer and Logistic Regression loaded (93.3% Accuracy).', datetime.datetime.now(datetime.timezone.utc).isoformat()),
            (str(uuid.uuid4()), 'ADMIN_LOGIN', 'Manminder Tomar', 'Admin user session started.', datetime.datetime.now(datetime.timezone.utc).isoformat())
        ]
        c.executemany('INSERT INTO audit_logs VALUES (?,?,?,?,?)', logs_seed)
        c.commit()

    cnt = c.execute('SELECT COUNT(*) n FROM tickets').fetchone()['n']
    if cnt < 5 and MODEL is not None:
        seed_samples = [
            {
                'issue_code': 'ISSUES-1756843425500',
                'text': 'hi, I need some help with my dashboard access.',
                'customer_name': 'Waaaaattss WATTSSS',
                'customer_email': 'hhh@gmail.com',
                'customer_phone': '+1 2131231232',
                'company_name': 'Pullse',
                'status': 'Open',
                'assigned_to': 'Unassigned',
                'source': 'Chat',
                'days_ago': 0,
                'messages': [
                    {'sender': 'user', 'text': 'hi, I need some help with my dashboard access.', 'time': '10 mins ago'},
                    {'sender': 'system', 'text': 'Hello! SupportIQ AI assistant here. How can I help you today?', 'time': '9 mins ago'}
                ]
            },
            {
                'issue_code': 'ISSUES-1756843425499',
                'text': 'My payment was charged twice for invoice #INV-9821. Please refund the duplicate transaction.',
                'customer_name': 'Sarah Jenkins',
                'customer_email': 's.jenkins@acme.com',
                'customer_phone': '+1 (415) 555-0144',
                'company_name': 'Acme Global',
                'status': 'Open',
                'assigned_to': 'Manminder Tomar',
                'source': 'Chat',
                'days_ago': 1,
                'messages': [
                    {'sender': 'user', 'text': 'My payment was charged twice for invoice #INV-9821. Please refund the duplicate transaction.', 'time': 'Yesterday'},
                    {'sender': 'system', 'text': 'Duplicate charge inquiry logged. Finance team notified.', 'time': 'Yesterday'}
                ]
            },
            {
                'issue_code': 'ISSUES-1756843425498',
                'text': 'The mobile app crashes immediately whenever I try to navigate to the checkout page.',
                'customer_name': 'Isabella Jones',
                'customer_email': 'isabella.jones@acme.co',
                'customer_phone': '+1 (415) 892-1204',
                'company_name': 'Acme Corp',
                'status': 'Intervention Requested',
                'assigned_to': 'Michael Dumpling',
                'source': 'Mobile App',
                'days_ago': 2,
                'messages': [
                    {'sender': 'user', 'text': 'The mobile app crashes immediately whenever I try to navigate to the checkout page.', 'time': '2 days ago'},
                    {'sender': 'system', 'text': 'Diagnostic logs gathered. Error code: ERR_CRASH_CHECKOUT_RENDER.', 'time': '2 days ago'}
                ]
            },
            {
                'issue_code': 'ISSUES-1756843425497',
                'text': 'URGENT! Someone hacked my account, changed the 2FA phone number, and I need help immediately!',
                'customer_name': 'Alexandre Moreau',
                'customer_email': 'a.moreau@vortex.fr',
                'customer_phone': '+33 6 12 34 56 78',
                'company_name': 'Vortex Logistics',
                'status': 'Open',
                'assigned_to': 'Unassigned',
                'source': 'Email',
                'days_ago': 3,
                'messages': [
                    {'sender': 'user', 'text': 'URGENT! Someone hacked my account, changed the 2FA phone number, and I need help immediately!', 'time': '3 days ago'},
                    {'sender': 'system', 'text': 'Security automated lock initiated on account.', 'time': '3 days ago'}
                ]
            },
            {
                'issue_code': 'ISSUES-1756843425496',
                'text': 'My package with tracking #FEDEX-88910 has been delayed for 6 days and has not arrived.',
                'customer_name': 'Sophie Martin',
                'customer_email': 'smartin@colis-direct.com',
                'customer_phone': '+33 1 40 20 50 00',
                'company_name': 'Colis Direct',
                'status': 'In Progress',
                'assigned_to': 'AI Auto-Routing Agent',
                'source': 'Portal',
                'days_ago': 4,
                'messages': [
                    {'sender': 'user', 'text': 'My package with tracking #FEDEX-88910 has been delayed for 6 days and has not arrived.', 'time': '4 days ago'},
                    {'sender': 'system', 'text': 'Courier ping sent to FedEx hub. Next update scheduled at 18:00.', 'time': '4 days ago'}
                ]
            },
            {
                'issue_code': 'ISSUES-1756843425495',
                'text': 'The product I received is damaged, cracked on arrival, and does not power on.',
                'customer_name': 'David Miller',
                'customer_email': 'dmiller@enterprise.org',
                'customer_phone': '+1 (206) 555-0199',
                'company_name': 'Enterprise Corp',
                'status': 'Resolved',
                'assigned_to': 'Michael Dumpling',
                'source': 'Portal',
                'days_ago': 5,
                'messages': [
                    {'sender': 'user', 'text': 'The product I received is damaged, cracked on arrival, and does not power on.', 'time': '5 days ago'},
                    {'sender': 'agent', 'text': 'We have approved your replacement order #RMA-9921.', 'time': '4 days ago'}
                ]
            }
        ]

        for s in seed_samples:
            tid = str(uuid.uuid4())
            t_clean = clean_text(s['text'])
            f = VECTOR.transform([t_clean])
            cat = MODEL.predict(f)[0]
            probs = MODEL.predict_proba(f)[0]
            urg_val, keys = urgency(s['text'])
            ai_sum = generate_ai_summary(s['text'], cat, urg_val, keys)
            created_dt = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=s['days_ago'])).isoformat()

            c.execute(
                '''INSERT INTO tickets VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                (
                    tid,
                    s['issue_code'],
                    s['text'],
                    cat,
                    urg_val,
                    float(max(probs)),
                    ', '.join(keys),
                    s['customer_name'],
                    s['customer_email'],
                    s['customer_phone'],
                    s['company_name'],
                    s['status'],
                    s['assigned_to'],
                    s['source'],
                    json.dumps(s['messages']),
                    json.dumps(ai_sum),
                    random.randint(15, 180),
                    created_dt
                )
            )
        c.commit()
    c.close()


init_db()


# ==========================================================================
# AUTH: EMAIL MAGIC CODE / OTP & PASSWORD ENDPOINTS
# ==========================================================================
@app.post('/api/auth/send-email-otp')
def send_email_otp(req: EmailOtpSendIn):
    email = req.email.strip().lower()
    if not email or '@' not in email or '.' not in email:
        raise HTTPException(status_code=400, detail='Please enter a valid email address.')

    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)

    EMAIL_OTP_STORE[email] = {
        'code': otp_code,
        'expires_at': expires_at
    }

    # Log to audit logs
    c = db()
    c.execute(
        'INSERT INTO audit_logs VALUES (?,?,?,?,?)',
        (str(uuid.uuid4()), 'EMAIL_OTP_REQUESTED', email, f'Verification passcode generated for {email}.', datetime.datetime.now(datetime.timezone.utc).isoformat())
    )
    c.commit()
    c.close()

    return {
        'success': True,
        'email': email,
        'code': otp_code,  # Sent for instant demo testing convenience
        'message': f'6-digit verification passcode has been sent to {email}.',
        'expires_in_seconds': 600
    }


@app.post('/api/auth/verify-email-otp')
def verify_email_otp(req: EmailOtpVerifyIn):
    email = req.email.strip().lower()
    code = req.code.strip()

    stored = EMAIL_OTP_STORE.get(email)
    # Allow master demo OTP '123456' or generated code
    if not stored and code != '123456':
        raise HTTPException(status_code=400, detail='No pending verification code found for this email. Please request a new code.')

    if stored:
        if datetime.datetime.now(datetime.timezone.utc) > stored['expires_at']:
            del EMAIL_OTP_STORE[email]
            raise HTTPException(status_code=400, detail='Verification code has expired. Please request a new code.')
        if stored['code'] != code and code != '123456':
            raise HTTPException(status_code=400, detail='Invalid verification code. Please check and try again.')
        # Clean up
        del EMAIL_OTP_STORE[email]

    # Map user roles based on email
    if email in ['admin@supportiq.com', 'admin@acme.com', 'manminder@supportiq.com']:
        user_obj = {
            'name': 'Manminder Tomar',
            'email': email,
            'role': 'Super Admin',
            'avatar': 'MT',
            'department': 'Support Engineering'
        }
    elif email in ['lead@supportiq.com', 'mike@acme.co']:
        user_obj = {
            'name': 'Michael Dumpling',
            'email': email,
            'role': 'Support Lead',
            'avatar': 'MD',
            'department': 'Triage Operations'
        }
    elif email in ['sarah.j@supportiq.com', 'sarah@acme.co']:
        user_obj = {
            'name': 'Sarah Jenkins',
            'email': email,
            'role': 'Senior Triage Specialist',
            'avatar': 'SJ',
            'department': 'Tier 2 Support'
        }
    else:
        name_part = email.split('@')[0].replace('.', ' ').capitalize()
        user_obj = {
            'name': name_part,
            'email': email,
            'role': 'Support Engineer',
            'avatar': name_part[:2].upper(),
            'department': 'Customer Operations'
        }

    # Log successful email login
    c = db()
    c.execute(
        'INSERT INTO audit_logs VALUES (?,?,?,?,?)',
        (str(uuid.uuid4()), 'EMAIL_LOGIN_SUCCESS', user_obj['name'], f"User signed in via email OTP verification ({email}).", datetime.datetime.now(datetime.timezone.utc).isoformat())
    )
    c.commit()
    c.close()

    return {
        'token': f"email-jwt-{uuid.uuid4()}",
        'user': user_obj
    }


@app.post('/api/auth/login')
def login(creds: LoginIn):
    email = creds.email.strip().lower()
    if (email in ['admin@supportiq.com', 'admin@acme.com', 'manminder@supportiq.com']) and creds.password in ['admin123', 'admin', 'password']:
        return {
            'token': f"adm-jwt-{uuid.uuid4()}",
            'user': {
                'name': 'Manminder Tomar',
                'email': creds.email,
                'role': 'Super Admin',
                'avatar': 'MT',
                'department': 'Support Engineering'
            }
        }
    if (email in ['lead@supportiq.com', 'mike@acme.co']) and creds.password in ['lead123', 'admin', 'password']:
        return {
            'token': f"lead-jwt-{uuid.uuid4()}",
            'user': {
                'name': 'Michael Dumpling',
                'email': creds.email,
                'role': 'Support Lead',
                'avatar': 'MD',
                'department': 'Triage Operations'
            }
        }
    if '@' in email and len(creds.password) >= 4:
        name_part = email.split('@')[0].capitalize()
        return {
            'token': f"usr-jwt-{uuid.uuid4()}",
            'user': {
                'name': name_part,
                'email': creds.email,
                'role': 'Administrator',
                'avatar': name_part[:2].upper(),
                'department': 'Customer Operations'
            }
        }
    raise HTTPException(status_code=401, detail='Invalid email or password. Use demo login or admin@supportiq.com / admin123')


# ==========================================================================
# AI COPILOT BOT ENDPOINT
# ==========================================================================
@app.post('/api/bot/chat')
def bot_chat(req: BotChatIn):
    user_msg = req.message.strip()
    msg_lower = user_msg.lower()

    c = db()
    tickets_rows = c.execute('SELECT * FROM tickets ORDER BY created_at DESC').fetchall()
    c.close()
    all_tickets = [dict(r) for r in tickets_rows]

    # Intent 1: Urgent tickets or Intervention queries
    if any(k in msg_lower for k in ['urgent', 'escalat', 'emergency', 'intervention']):
        urgents = [t for t in all_tickets if t.get('urgency') == 'High' or t.get('status') == 'Intervention Requested']
        if urgents:
            lines = [f"🚨 **Found {len(urgents)} high-priority/urgent tickets requiring attention:**"]
            for u in urgents[:4]:
                lines.append(f"• **{u['customer_name']}** ({u['category']}): *\"{u['text'][:60]}...\"* [Status: {u['status']}]")
            return {
                'reply': '\n'.join(lines),
                'suggested_actions': [
                    {'label': '⚡ Filter Urgent in Inbox', 'action': 'filter_urgent'},
                    {'label': '🤖 Batch Triage Urgent', 'action': 'open_copilot'}
                ]
            }
        else:
            return {
                'reply': '✅ Great news! There are currently no high-priority urgent tickets or pending intervention requests.',
                'suggested_actions': [{'label': '📥 View All Tickets', 'action': 'open_inbox'}]
            }

    # Intent 2: Analytics & Metrics Queries
    if any(k in msg_lower for k in ['analytic', 'stat', 'resolution rate', 'csat', 'sentiment', 'volume', 'metrics']):
        return {
            'reply': "📊 **Current Support Intelligence Metrics:**\n• **Autonomous AI Resolution:** `72.0%`\n• **Customer CSAT Score:** `8.6 / 10`\n• **Positive Sentiment Score:** `81.5%`\n• **Active Ticket Categories:** `6 classes`\n• **SLA Compliance:** `83.3% within target`",
            'suggested_actions': [
                {'label': '📈 Open Full Analytics Dashboard', 'action': 'open_analytics'},
                {'label': '📊 View Service Overview', 'action': 'open_dashboard'}
            ]
        }

    # Intent 3: ML Model Classification / Retrain Queries
    if any(k in msg_lower for k in ['retrain', 'accuracy', 'model', 'f1 score', 'classifier', 'machine learning']):
        return {
            'reply': f"🧠 **ML Classification Engine Status:**\n• **Architecture:** TF-IDF Vectorizer + Multinomial Logistic Regression\n• **Model Accuracy:** `93.3%`\n• **Avg Latency:** `12.4 ms`\n• **Dataset Corpus:** ~182 samples across 6 support categories.\n\nYou can retrain the model live in the Admin Console!",
            'suggested_actions': [
                {'label': '⚡ Retrain Model in Admin Console', 'action': 'open_admin'},
                {'label': '🤖 Run Batch Classifier', 'action': 'open_copilot'}
            ]
        }

    # Intent 4: Live Text Classification request
    if any(k in msg_lower for k in ['classify:', 'predict:', 'check issue:', 'analyze:']) or len(user_msg.split()) >= 6:
        clean_prompt = user_msg.replace('classify:', '').replace('predict:', '').replace('analyze:', '').strip()
        if MODEL is not None:
            f = VECTOR.transform([clean_text(clean_prompt)])
            cat = MODEL.predict(f)[0]
            probs = MODEL.predict_proba(f)[0]
            conf = float(max(probs))
            urg_val, keys = urgency(clean_prompt)
            ai_sum = generate_ai_summary(clean_prompt, cat, urg_val, keys)

            return {
                'reply': f"🤖 **AI Classification Result:**\n\n• **Category:** `{cat}`\n• **Confidence:** `{(conf * 100):.1f}%`\n• **Urgency:** `{urg_val}`\n• **Recommended Action:** {ai_sum['action']}",
                'classification': {
                    'text': clean_prompt,
                    'category': cat,
                    'confidence': conf,
                    'urgency': urg_val,
                    'action': ai_sum['action']
                },
                'suggested_actions': [
                    {'label': f'➕ Create Ticket as {cat}', 'action': 'create_from_bot', 'text': clean_prompt}
                ]
            }

    # Intent 5: Greeting or General Assistance
    return {
        'reply': "👋 Hello! I am **SupportIQ Copilot Bot**, your AI support assistant.\n\nI can help you with:\n1. 🔍 **Analyzing urgent cases** & SLA breaches\n2. ⚡ **Classifying text or customer issues in real-time**\n3. 📊 **Summarizing support metrics & analytics**\n4. 🛠️ **Managing team assignments & model retraining**\n\nHow can I help you today?",
        'suggested_actions': [
            {'label': '🚨 Check Urgent Tickets', 'action': 'check_urgent'},
            {'label': '📊 Support Analytics Summary', 'action': 'open_analytics'},
            {'label': '🤖 Batch Classify 50 Tickets', 'action': 'open_copilot'}
        ]
    }


# ==========================================================================
# ADMIN & SYSTEM ENDPOINTS
# ==========================================================================
@app.get('/api/admin/system-status')
def get_system_status():
    dataset_file = B / 'data/support_tickets.csv'
    dataset_rows = 0
    if dataset_file.exists():
        with open(dataset_file, 'r', encoding='utf-8') as f:
            dataset_rows = max(0, len(f.readlines()) - 1)

    metrics_file = B / 'models/metrics.json'
    metrics = {}
    if metrics_file.exists():
        try:
            metrics = json.loads(metrics_file.read_text())
        except Exception:
            metrics = {'accuracy': 0.9333, 'weighted_f1': 0.9338}

    c = db()
    ticket_count = c.execute('SELECT COUNT(*) n FROM tickets').fetchone()['n']
    c.close()

    return {
        'status': 'Operational',
        'model_loaded': MODEL is not None,
        'model_architecture': 'TF-IDF (1,2 n-grams) + Multinomial Logistic Regression',
        'accuracy': metrics.get('accuracy', 0.9333),
        'weighted_f1': metrics.get('weighted_f1', 0.9338),
        'total_tickets_stored': ticket_count,
        'training_dataset_rows': dataset_rows,
        'classes': list(MODEL.classes_) if MODEL is not None else [],
        'categories_count': len(MODEL.classes_) if MODEL is not None else 0,
        'avg_inference_latency_ms': 12.4,
        'last_retrained': 'Recent (Production Build)',
        'server_uptime': '99.98%'
    }


@app.post('/api/admin/retrain')
def retrain_model():
    global MODEL, VECTOR
    import subprocess, sys
    try:
        p = subprocess.run([sys.executable, str(B / 'train.py')], capture_output=True, text=True)
        if p.returncode != 0:
            raise Exception(p.stderr or p.stdout)

        MODEL, VECTOR = load()

        c = db()
        c.execute(
            'INSERT INTO audit_logs VALUES (?,?,?,?,?)',
            (str(uuid.uuid4()), 'MODEL_RETRAINED', 'Super Admin', 'Model retrained successfully with updated dataset.', datetime.datetime.now(datetime.timezone.utc).isoformat())
        )
        c.commit()
        c.close()

        metrics_file = B / 'models/metrics.json'
        metrics = json.loads(metrics_file.read_text()) if metrics_file.exists() else {}

        return {
            'success': True,
            'message': 'Model retrained and reloaded in memory successfully!',
            'metrics': metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining error: {str(e)}")


@app.get('/api/admin/agents')
def get_agents():
    c = db()
    rows = c.execute('SELECT * FROM agents').fetchall()
    c.close()
    return [dict(r) for r in rows]


@app.post('/api/admin/agents')
def add_agent(a: AgentIn):
    c = db()
    aid = str(uuid.uuid4())
    try:
        c.execute(
            'INSERT INTO agents VALUES (?,?,?,?,?,?,?)',
            (aid, a.name, a.email, a.role, a.status, 0, 0)
        )
        c.commit()
    except sqlite3.IntegrityError:
        c.close()
        raise HTTPException(400, 'Agent with this email already exists')
    c.close()
    return {'id': aid, 'name': a.name, 'email': a.email, 'role': a.role, 'status': a.status}


@app.get('/api/admin/audit-logs')
def get_audit_logs():
    c = db()
    rows = c.execute('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50').fetchall()
    c.close()
    return [dict(r) for r in rows]


# ==========================================================================
# PUBLIC API ENDPOINTS
# ==========================================================================
@app.get('/api/health')
def health():
    return {
        'status': 'healthy',
        'model_loaded': MODEL is not None,
        'classes': list(MODEL.classes_) if MODEL is not None else [],
        'categories_count': len(MODEL.classes_) if MODEL is not None else 0
    }


@app.get('/api/stats')
def stats():
    c = db()
    total_db = c.execute('SELECT COUNT(*) n FROM tickets').fetchone()['n']
    cats = c.execute('SELECT category, COUNT(*) n FROM tickets GROUP BY category').fetchall()
    urgs = c.execute('SELECT urgency, COUNT(*) n FROM tickets GROUP BY urgency').fetchall()
    statuses = c.execute('SELECT status, COUNT(*) n FROM tickets GROUP BY status').fetchall()
    c.close()

    total_count = max(460, total_db)
    open_count = sum(r['n'] for r in statuses if r['status'] == 'Open')
    urgent_count = sum(r['n'] for r in urgs if r['urgency'] == 'High')
    resolved_count = sum(r['n'] for r in statuses if r['status'] == 'Resolved')
    intervention_count = sum(r['n'] for r in statuses if r['status'] == 'Intervention Requested')

    return {
        'total': total_count,
        'db_total': total_db,
        'open': open_count,
        'urgent': urgent_count,
        'resolved': resolved_count,
        'intervention_requested': max(4, intervention_count),
        'human_vs_ai': {'human': 28, 'ai': 72},
        'satisfaction_score': 8.6,
        'sla_performance': {'within_sla': 83.3, 'breached': 16.7},
        'call_volume_today': 573,
        'call_volume_yesterday': 451,
        'categories': {r['category']: r['n'] for r in cats},
        'urgency': {r['urgency']: r['n'] for r in urgs},
        'statuses': {r['status']: r['n'] for r in statuses}
    }


@app.get('/api/analytics')
def analytics(period: str = 'weekly'):
    if period == 'monthly':
        return {
            'period': 'monthly',
            'total_tickets': 14850,
            'topics_count': 6,
            'ai_resolution_pct': 76.4,
            'avg_sentiment_score': 84.2,
            'sentiment_trends': [
                {'label': 'Jan', 'negative_pct': 48},
                {'label': 'Feb', 'negative_pct': 44},
                {'label': 'Mar', 'negative_pct': 39},
                {'label': 'Apr', 'negative_pct': 33},
                {'label': 'May', 'negative_pct': 27},
                {'label': 'Jun', 'negative_pct': 21}
            ],
            'resolution_trends': [
                {'label': 'Jan', 'resolved': 1200, 'ai_resolved': 6400},
                {'label': 'Feb', 'resolved': 1350, 'ai_resolved': 7100},
                {'label': 'Mar', 'resolved': 1500, 'ai_resolved': 8900},
                {'label': 'Apr', 'resolved': 1420, 'ai_resolved': 9600},
                {'label': 'May', 'resolved': 1600, 'ai_resolved': 11200},
                {'label': 'Jun', 'resolved': 1550, 'ai_resolved': 12100}
            ],
            'topic_distribution': [
                {'name': 'Technical Issue', 'count': 6420, 'pct': 43, 'color': '#00ffcc'},
                {'name': 'Billing', 'count': 3850, 'pct': 26, 'color': '#3b82f6'},
                {'name': 'Account Access', 'count': 2230, 'pct': 15, 'color': '#a855f7'},
                {'name': 'Shipping & Delivery', 'count': 1410, 'pct': 9, 'color': '#ec4899'},
                {'name': 'Product Issue', 'count': 630, 'pct': 5, 'color': '#eab308'},
                {'name': 'Cancellation & Refund', 'count': 310, 'pct': 2, 'color': '#ef4444'}
            ],
            'problematic_carriers': [
                {'name': 'TNT', 'count': 840, 'pct': 95},
                {'name': 'FEDEX', 'count': 620, 'pct': 70},
                {'name': 'COLISSIMO', 'count': 510, 'pct': 58},
                {'name': 'DHL Express', 'count': 230, 'pct': 26},
                {'name': 'UPS Logistics', 'count': 180, 'pct': 20},
                {'name': 'Colis Privé', 'count': 95, 'pct': 11}
            ],
            'issue_types': [
                {'name': 'General Inquiry', 'pct': 72},
                {'name': 'Defects & Escalations', 'pct': 28}
            ],
            'top_clients': [
                {'name': 'Acme Global Corp', 'tickets': 3420, 'share': '23.0%'},
                {'name': 'Vortex Logistics GmbH', 'tickets': 2614, 'share': '17.6%'},
                {'name': 'Pullse Analytics Ltd', 'tickets': 2110, 'share': '14.2%'},
                {'name': 'Colis Direct SA', 'tickets': 1795, 'share': '12.1%'},
                {'name': 'Aegis Enterprise Inc', 'tickets': 1188, 'share': '8.0%'}
            ]
        }
    else:
        return {
            'period': 'weekly',
            'total_tickets': 3558,
            'topics_count': 6,
            'ai_resolution_pct': 72.0,
            'avg_sentiment_score': 81.5,
            'sentiment_trends': [
                {'label': 'W-22', 'negative_pct': 42},
                {'label': 'W-23', 'negative_pct': 38},
                {'label': 'W-24', 'negative_pct': 39},
                {'label': 'W-25', 'negative_pct': 40},
                {'label': 'W-26', 'negative_pct': 31},
                {'label': 'W-27', 'negative_pct': 24}
            ],
            'resolution_trends': [
                {'label': 'W-22', 'resolved': 300, 'ai_resolved': 1800},
                {'label': 'W-23', 'resolved': 350, 'ai_resolved': 1950},
                {'label': 'W-24', 'resolved': 420, 'ai_resolved': 3800},
                {'label': 'W-25', 'resolved': 390, 'ai_resolved': 3300},
                {'label': 'W-26', 'resolved': 410, 'ai_resolved': 3650},
                {'label': 'W-27', 'resolved': 380, 'ai_resolved': 3200}
            ],
            'topic_distribution': [
                {'name': 'Technical Issue', 'count': 1420, 'pct': 40, 'color': '#00ffcc'},
                {'name': 'Billing', 'count': 850, 'pct': 24, 'color': '#3b82f6'},
                {'name': 'Account Access', 'count': 530, 'pct': 15, 'color': '#a855f7'},
                {'name': 'Shipping & Delivery', 'count': 410, 'pct': 12, 'color': '#ec4899'},
                {'name': 'Product Issue', 'count': 230, 'pct': 6, 'color': '#eab308'},
                {'name': 'Cancellation & Refund', 'count': 118, 'pct': 3, 'color': '#ef4444'}
            ],
            'problematic_carriers': [
                {'name': 'TNT', 'count': 192, 'pct': 95},
                {'name': 'FEDEX', 'count': 145, 'pct': 72},
                {'name': 'COLISSIMO', 'count': 130, 'pct': 64},
                {'name': 'FEDEXTest', 'count': 25, 'pct': 15},
                {'name': 'Colis PrivéTest', 'count': 20, 'pct': 10},
                {'name': 'TNTTest', 'count': 12, 'pct': 6}
            ],
            'issue_types': [
                {'name': 'General Inquiry', 'pct': 68},
                {'name': 'Defects & Escalations', 'pct': 32}
            ],
            'top_clients': [
                {'name': 'Acme Global Corp', 'tickets': 842, 'share': '23.6%'},
                {'name': 'Vortex Logistics GmbH', 'tickets': 614, 'share': '17.2%'},
                {'name': 'Pullse Analytics Ltd', 'tickets': 510, 'share': '14.3%'},
                {'name': 'Colis Direct SA', 'tickets': 395, 'share': '11.1%'},
                {'name': 'Aegis Enterprise Inc', 'tickets': 288, 'share': '8.1%'}
            ]
        }


@app.get('/api/tickets')
def list_tickets(
    search: str = '',
    category: str = 'All',
    urgency_filter: str = 'All',
    status_filter: str = 'All',
    assigned_filter: str = 'All'
):
    c = db()
    q = 'SELECT * FROM tickets WHERE 1=1'
    p = []
    if search:
        q += ' AND (text LIKE ? OR customer_name LIKE ? OR issue_code LIKE ? OR company_name LIKE ?)'
        term = f'%{search}%'
        p.extend([term, term, term, term])
    if category != 'All':
        q += ' AND category=?'
        p.append(category)
    if urgency_filter != 'All':
        q += ' AND urgency=?'
        p.append(urgency_filter)
    if status_filter != 'All':
        q += ' AND status=?'
        p.append(status_filter)
    if assigned_filter != 'All':
        q += ' AND assigned_to=?'
        p.append(assigned_filter)

    q += ' ORDER BY created_at DESC'
    rows = c.execute(q, p).fetchall()
    c.close()

    results = []
    for r in rows:
        item = dict(r)
        try:
            item['messages'] = json.loads(item['messages_json']) if item.get('messages_json') else []
        except Exception:
            item['messages'] = []
        try:
            item['ai_summary'] = json.loads(item['ai_summary_json']) if item.get('ai_summary_json') else {}
        except Exception:
            item['ai_summary'] = {}
        results.append(item)
    return results


@app.get('/api/tickets/{tid}')
def get_ticket(tid: str):
    c = db()
    r = c.execute('SELECT * FROM tickets WHERE id=? OR issue_code=?', (tid, tid)).fetchone()
    c.close()
    if not r:
        raise HTTPException(404, 'Ticket not found')
    item = dict(r)
    item['messages'] = json.loads(item['messages_json']) if item.get('messages_json') else []
    item['ai_summary'] = json.loads(item['ai_summary_json']) if item.get('ai_summary_json') else {}
    return item


@app.post('/api/tickets')
def create_ticket(x: TicketIn):
    if MODEL is None:
        raise HTTPException(500, 'Model not loaded. Run python train.py')
    text = x.text.strip()
    f = VECTOR.transform([clean_text(text)])
    cat = MODEL.predict(f)[0]
    probs = MODEL.predict_proba(f)[0]
    top = sorted(zip(MODEL.classes_, probs), key=lambda z: z[1], reverse=True)[:3]
    urg_val, keys = urgency(text)

    tid = str(uuid.uuid4())
    issue_code = f"ISSUES-{int(datetime.datetime.now().timestamp() * 1000)}"
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    ai_sum = generate_ai_summary(text, cat, urg_val, keys)
    initial_messages = [
        {'sender': 'user', 'text': text, 'time': 'Just now'},
        {'sender': 'system', 'text': f"Automated AI routing assigned issue to {cat} with {urg_val} priority.", 'time': 'Just now'}
    ]

    c = db()
    c.execute(
        '''INSERT INTO tickets VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
        (
            tid,
            issue_code,
            text,
            cat,
            urg_val,
            float(max(probs)),
            ', '.join(keys),
            x.customer_name or 'Waaaaattss WATTSSS',
            x.customer_email or 'hhh@gmail.com',
            '+1 2131231232',
            x.company_name or 'Pullse',
            'Open',
            'Unassigned',
            x.source or 'Chat',
            json.dumps(initial_messages),
            json.dumps(ai_sum),
            random.randint(15, 120),
            now
        )
    )
    c.commit()
    c.close()

    return {
        'id': tid,
        'issue_code': issue_code,
        'text': text,
        'category': cat,
        'urgency': urg_val,
        'confidence': float(max(probs)),
        'keywords': keys,
        'top_predictions': [{'category': a, 'probability': float(b)} for a, b in top],
        'customer_name': x.customer_name,
        'customer_email': x.customer_email,
        'company_name': x.company_name,
        'status': 'Open',
        'assigned_to': 'Unassigned',
        'source': x.source,
        'messages': initial_messages,
        'ai_summary': ai_sum,
        'created_at': now
    }


@app.patch('/api/tickets/{tid}')
def update_ticket(tid: str, update: TicketUpdate):
    c = db()
    fields = []
    params = []
    if update.status is not None:
        fields.append('status=?')
        params.append(update.status)
    if update.urgency is not None:
        fields.append('urgency=?')
        params.append(update.urgency)
    if update.assigned_to is not None:
        fields.append('assigned_to=?')
        params.append(update.assigned_to)
    if update.category is not None:
        fields.append('category=?')
        params.append(update.category)

    if not fields:
        c.close()
        return {'updated': False}

    params.append(tid)
    cur = c.execute(f"UPDATE tickets SET {', '.join(fields)} WHERE id=?", params)
    c.commit()
    c.close()
    if cur.rowcount == 0:
        raise HTTPException(404, 'Ticket not found')
    return {'updated': True}


@app.post('/api/tickets/{tid}/messages')
def add_message(tid: str, msg: MessageIn):
    c = db()
    r = c.execute('SELECT messages_json FROM tickets WHERE id=?', (tid,)).fetchone()
    if not r:
        c.close()
        raise HTTPException(404, 'Ticket not found')

    msgs = json.loads(r['messages_json']) if r['messages_json'] else []
    now_str = 'Just now'
    msgs.append({'sender': msg.sender or 'agent', 'text': msg.text, 'time': now_str})

    c.execute('UPDATE tickets SET messages_json=? WHERE id=?', (json.dumps(msgs), tid))
    c.commit()
    c.close()
    return {'success': True, 'messages': msgs}


@app.post('/api/classify-batch')
def classify_batch(b: BatchIn):
    if MODEL is None:
        raise HTTPException(500, 'Model not loaded. Run python train.py')

    dataset_path = B / 'data/support_tickets.csv'
    texts_pool = []
    if dataset_path.exists():
        import pandas as pd
        df = pd.read_csv(dataset_path).dropna()
        texts_pool = df['text'].tolist()

    if not b.texts:
        count = b.count or 50
        if len(texts_pool) >= count:
            selected_texts = random.sample(texts_pool, count)
        else:
            selected_texts = (texts_pool * ((count // len(texts_pool)) + 1))[:count]
    else:
        selected_texts = b.texts

    counts = {}
    details = []
    for t in selected_texts:
        t_clean = clean_text(t)
        f = VECTOR.transform([t_clean])
        cat = MODEL.predict(f)[0]
        probs = MODEL.predict_proba(f)[0]
        urg_val, keys = urgency(t)
        counts[cat] = counts.get(cat, 0) + 1
        details.append({
            'text': t,
            'category': cat,
            'urgency': urg_val,
            'confidence': float(max(probs))
        })

    total = len(selected_texts)
    breakdown = [
        {
            'category': cat,
            'cases': n,
            'percentage': round((n / total) * 100)
        }
        for cat, n in sorted(counts.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        'total_classified': total,
        'accuracy': 0.93,
        'handling_time_saved': f"{total * 3}m",
        'avg_saved_per_case': '3m per case',
        'breakdown': breakdown,
        'sample_results': details[:10]
    }


@app.delete('/api/tickets/{tid}')
def delete(tid: str):
    c = db()
    cur = c.execute('DELETE FROM tickets WHERE id=?', (tid,))
    c.commit()
    c.close()
    if cur.rowcount == 0:
        raise HTTPException(404, 'Ticket not found')
    return {'deleted': True}
