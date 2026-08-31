# 🚀 Support Ticket Category Classifier & Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.3%2B-F7931E?logo=scikit-learn)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Problem
Support teams receive a constant stream of incoming tickets that need to be routed to the right team and prioritized correctly. Doing this manually is slow and inconsistent. 

This project builds an explainable, local NLP system that reads the free-text body of a support ticket and:
1. **Predicts which support category it belongs to** (a machine learning text classification model).
2. **Predicts an urgency level (`Low` / `Medium` / `High`)** using transparent keyword rules — no ML, fully explainable.
3. **Serves through an enterprise React + FastAPI web application** with an interactive 2-pane inbox, real-time analytics, an AI Copilot Bot, and an Administrator Portal with Email OTP authentication.

> ⚡ **Zero External Cost**: No paid APIs, no GPU required, no cloud inference — everything runs 100% locally.

---

## 🎥 Application Output & Live Demo

<div align="center">
  <img src="docs/demo.gif" alt="SupportIQ Live Application Demo" width="100%" style="border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.25);" />
  <p align="center">
    <b><a href="https://github.com/mhr476658/SupportIQ/raw/main/docs/demo.mp4">▶️ Click here to watch / download the full high-resolution MP4 video (3 mins)</a></b>
  </p>
</div>

---

## 📊 Dataset

- **Source (for reproducing this project)**: Kaggle — [venkatasubramanian/automatic-ticket-classification](https://www.kaggle.com/datasets/venkatasubramanian/automatic-ticket-classification), file `complaints-2021-05-14_08_16_.json`.
- **Underlying origin**: The records are real consumer complaint narratives originally published by the U.S. Consumer Financial Protection Bureau (CFPB) in its public [Consumer Complaint Database](https://www.consumerfinance.gov/data-research/consumer-complaints/).
- **Records used**: 20,899 complaints with real, non-empty narrative text (from 78,313 raw records — complaints without optional free-text narratives are dropped).
- **Text column**: `complaint_what_happened` (a ticket's free-text body).
- **Target column**: `product`, mapped down from ~17 overlapping/renamed raw values to 6 clear categories:
  1. `Credit card` (7,094)
  2. `Bank account services` (5,935)
  3. `Mortgages and loans` (4,069)
  4. `Credit reporting` (2,020)
  5. `Debt collection` (928)
  6. `Money transfers` (853)
- **Class distribution**: Imbalanced — representative of real-world complaint-routing data. Duplicate (text, label) pairs removed with no missing text/labels after cleaning.
- **Why this dataset**: Evaluated over synthetic alternatives because it contains real, labeled free-text narratives rather than template-driven text, making it a fair test of a TF-IDF + Logistic Regression approach to ticket routing.
- **Note on redacted text**: CFPB redacts personal information (names, account numbers, dates) as literal `XXXX` tokens before publishing. This is part of the original data and is left as-is.

---

## ⚙️ Method

```
Raw Ticket Text 
  └──> Light cleaning (whitespace normalization; numbers, company names, punctuation preserved)
        └──> Stratified 80/20 train/test split (random_state=42)
              └──> TF-IDF (unigrams + bigrams, English stop words, min_df=3, max_df=0.9, sublinear_tf)
                    └──> Logistic Regression (class_weight="balanced", C=5)
                          └──> Predicted Category (+ confidence via predict_proba)

Ticket Text 
  └──> Keyword/phrase rules (High -> Medium -> Low) 
        └──> Urgency Level & Reason
```

- **Leakage Prevention**: The TF-IDF vectorizer is fit only on the training split inside a single `sklearn.Pipeline`, preventing test-set leakage, and the same fitted vectorizer is reused automatically at inference time.
- **Urgency Engine**: A completely separate, non-ML module using transparent keyword matching for 100% explainability.
- **Tech Stack**: Python 3.11 · FastAPI · React 18 · Vite · scikit-learn (`TfidfVectorizer`, `LogisticRegression`, `Pipeline`) · pandas / NumPy · joblib · Lucide Icons.

---

## 📈 Results & Performance

Measured on the held-out 20% test set (4,180 complaints), `random_state=42`:

| Model | Accuracy | Macro F1 | Weighted F1 |
| :--- | :---: | :---: | :---: |
| **Majority-class baseline** | 33.9% | 0.084 | 0.172 |
| **Multinomial Naive Bayes** | 72.7% | 0.432 | 0.669 |
| **TF-IDF + Logistic Regression (Final)** | **83.1%** | **0.752** | **0.831** |

- **Macro F1 Evaluation**: Because the 6 categories are imbalanced, macro F1 is reported alongside accuracy to weight every category equally.
- **Best-performing categories**: Mortgages and loans (F1 = 0.90), Bank account services (F1 = 0.88), Credit card (F1 = 0.86).
- **Weakest categories**: Debt collection (F1 = 0.57) and Credit reporting (F1 = 0.64) due to fewer training examples and vocabulary overlap with Credit card complaints.
- **Most common confusions**: Credit card → Credit reporting (87 cases) and Credit card → Bank account services (74 cases) where customer disputes genuinely overlap.

---

## ✨ Key Application Features

### 1. 📥 Streamlined 2-Pane Support Inbox
- **Real-Time Ticket Queue**: Instant keyword search, category dropdowns, and quick status filters (`All`, `⚡ Urgent`, `Open`, `In Progress`, `Resolved`).
- **AI Intelligence Card**: Real-time ML category classification, confidence score, urgency triggers, key issue summary, and **recommended step-by-step next action**.
- **Customer Context & Messages**: View conversation history, metadata, and send one-click canned AI responses (*Acknowledge*, *Billing Check*, *Escalate*, *Tracking*).

### 2. 📊 Interactive Statistiques & Analytics Dashboard
- **Live Weekly & Monthly Switcher**: Dynamically loads real-time aggregations (3,558 weekly vs. 14,850 monthly tickets).
- **Interactive SVG Charts**: Sentiment Trends Curve with hover tooltips, Resolution Trends (AI vs. Human), Category Topic Donut, and Carrier Breakdowns.

### 3. 🤖 Floating AI Support Bot ("SupportIQ Copilot Bot")
- Floating action widget with live `AI Online` pulse indicator.
- **Real-Time Text Classification**: Paste any text to run inference live.
- **Urgent Case Triage**: Scans active tickets and highlights SLA breach risks.
- **KPI Summaries**: Instant stats on AI resolution rates, CSAT score (8.6/10), and SLAs.

### 4. 🛡️ Dedicated Admin Console & Email Authentication
- **Multi-Method Authentication**:
  - ✉️ **Sign in via Email (6-Digit OTP / Magic Code)** with auto-fill code simulator.
  - 🔑 **Password Login** (`admin@supportiq.com` / `admin123`).
  - ⚡ **One-Click Quick Sign In** for Super Admin and Support Lead.
- **⚡ Live Model Retraining**: Retrain the model on the latest dataset live with memory reload (`POST /api/admin/retrain`).
- **Support Team & Workloads**: Roster of agents, active assigned tickets, and registration form for new specialists.

---

## 🎯 Sample Input / Output

> **Sample Customer Message**:  
> *"I noticed two duplicate charges on my credit card statement this month and I urgently need this refunded immediately."*

- **Predicted Category**: `Credit card`
- **Model Confidence**: `88.0%`
- **Urgency Level**: `HIGH`
- **Detected Keyword(s)**: `"urgent"`, `"immediately"`
- **Recommended Action**: *"Check payment gateway transaction records and verify if duplicate charge or refund is required."*

---

## 🚀 How to Run

### 1. Start the Backend API

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train / verify ML model (models/ are pre-committed and ready to use immediately)
python train.py

# Start FastAPI server
uvicorn app.main:app --port 8000 --host 127.0.0.1
```

Backend will run at: **`http://127.0.0.1:8000`**  
Interactive API Docs (Swagger): **`http://127.0.0.1:8000/docs`**

---

### 2. Start the Frontend Application

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend application will open at: **`http://127.0.0.1:5173`**

---

## 🔑 Default Login Credentials

| Role | Email | Password / OTP |
| :--- | :--- | :--- |
| **👑 Super Admin** | `admin@supportiq.com` | `admin123` or OTP |
| **👔 Support Lead** | `lead@supportiq.com` | `lead123` or OTP |
| **⚡ Master Demo OTP** | Any Email | `123456` |

---

## 📁 Project Structure

```
support-ticket-fullstack/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application (Tickets, Analytics, Auth, Bot, Admin)
│   │   └── model.py             # TF-IDF loader, regex cleaning & keyword urgency rules
│   ├── data/
│   │   └── support_tickets.csv  # Curated training dataset
│   ├── models/
│   │   ├── ticket_classifier.joblib  # Trained Multinomial Logistic Regression model
│   │   ├── tfidf_vectorizer.joblib   # Fitted TF-IDF Vectorizer
│   │   └── metrics.json              # Model evaluation metrics
│   ├── train.py                 # Training & validation script
│   └── requirements.txt         # Python dependencies
├── docs/
│   ├── demo.gif                 # Animated demo preview for README
│   ├── demo.mp4                 # Full high-res walkthrough video
│   └── TESTING.md               # Testing documentation
├── frontend/
│   ├── src/
│   │   ├── main.jsx             # React application (Inbox, Analytics, Admin, Bot)
│   │   └── styles.css           # Design system (Light & Dark theme)
│   ├── index.html               # HTML shell
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite build configuration
├── .gitignore
├── README.md
└── LICENSE
```

---

## ⚠️ Limitations

- **Category Overlap**: 83.1% accuracy is strong for a 6-class problem, but categories that genuinely overlap in subject matter (e.g. *Credit card* vs. *Credit reporting* vs. *Bank account services*) are occasionally confused due to real-world ambiguity in complaint narratives.
- **Class Imbalance**: *Debt collection* and *Money transfers* have fewer training examples than larger categories.
- **Single-Label Scope**: A ticket spanning multiple issues can only be assigned one primary category label.
- **Rule-Based Urgency**: The urgency classifier relies on keyword matching; it may miss urgency expressed with novel phrasing or be triggered by non-urgent mentions.
- **Confidence Scores**: Probabilities reflect model confidence distribution, not an absolute correctness guarantee.

---

## 🔮 Future Improvements

- **Transformer-based Models**: Fine-tuning lightweight transformer models (e.g. DistilBERT / RoBERTa) for higher contextual classification accuracy.
- **Learned Urgency Model**: Training a supervised urgency classifier alongside keyword heuristics.
- **Named Entity Recognition (NER)**: Extracting account numbers, invoice references, and carrier tracking IDs automatically.
- **Active Learning**: Routing low-confidence predictions to human specialists to continuously enrich the training set.

---

## 📄 License
This project is licensed under the MIT License.
