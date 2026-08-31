# 🚀 SupportIQ — Enterprise AI Support Ticket Classifier & Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.3%2B-F7931E?logo=scikit-learn)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**SupportIQ** is an enterprise-grade AI customer support platform that autonomously classifies incoming support tickets, assesses urgency, provides smart agent suggestions, visualizes real-time performance analytics, and includes an interactive AI Copilot Bot and a secure Administrator Console with Email OTP authentication.

---

## 🎥 Application Output & Demo Video

<div align="center">
  <video src="docs/demo.mp4" controls="controls" width="100%" style="max-height: 480px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);"></video>
</div>

> 💡 **Walkthrough Highlights**:
> - 📥 **2-Pane Support Inbox**: Real-time ticket classification and AI recommended next actions.
> - 📊 **Statistiques Dashboard**: Dynamic weekly/monthly sentiment and resolution analytics.
> - 🤖 **Floating AI Copilot Bot**: Instant ticket triage and text classification.
> - 🛡️ **Admin Portal**: Email OTP / Magic Code authentication, live model retraining, and agent management.

---

## ✨ Key Features

### 1. 📥 Streamlined 2-Pane Support Inbox
- **Real-Time Ticket Queue**: Instant keyword search, category dropdowns, and quick status filters (`All`, `⚡ Urgent`, `Open`, `In Progress`, `Resolved`).
- **AI Intelligence Card**: Real-time ML category classification, confidence score, urgency triggers, key issue summary, and **recommended step-by-step next action**.
- **Customer Context & Messages**: View conversation history, metadata, and send one-click canned AI responses (*Acknowledge*, *Billing Check*, *Escalate*, *Tracking*).

### 2. 📊 Interactive Statistiques & Analytics Dashboard
- **Live Weekly & Monthly Switcher**: Dynamically loads real-time aggregations (3,558 weekly vs. 14,850 monthly tickets).
- **Interactive SVG Charts**:
  - **Sentiment Trends Curve** with interactive hover data points.
  - **Resolution Trends (AI Autonomous vs. Human Specialist)**.
  - **Topic & Category Distribution Donut Chart**.
  - **Problematic Logistics Carriers** progress bars.
  - **Top Enterprise Clients Table**.

### 3. 🤖 Floating AI Support Bot ("SupportIQ Copilot Bot")
- Floating action button at the bottom-right of the screen with a live `AI Online` pulse indicator.
- **Real-Time Text Classification**: Paste any text (e.g. *"Classify: My payment was charged twice"*) to run inference live.
- **Urgent Case Triage**: Scans active tickets and highlights SLA breach risks.
- **KPI Summaries**: Instant stats on AI resolution rates, CSAT score (8.6/10), and SLAs.

### 4. 🛡️ Dedicated Admin Console & Email Authentication
- **Multi-Method Authentication**:
  - ✉️ **Sign in via Email (6-Digit OTP / Magic Code)** with instant auto-fill code simulator.
  - 🔑 **Password Login** (`admin@supportiq.com` / `admin123`).
  - ⚡ **One-Click Quick Sign In** for Super Admin and Support Lead.
- **System & Model Management**:
  - Live model accuracy (**93.3%**), weighted F1 score, and inference latency (~12ms).
  - **⚡ Live Model Retraining**: Retrain the model on the latest dataset live with memory reload (`POST /api/admin/retrain`).
- **Support Team & Workloads**: Roster of agents, active assigned tickets, and registration form for new specialists.
- **System Audit Trail**: Complete security & event timeline.

---

## 🏗️ Architecture & ML Pipeline

```
support-ticket-fullstack/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI server (Tickets, Analytics, Auth, Bot, Admin APIs)
│   │   └── model.py         # TF-IDF loader, regex cleaning & keyword urgency rules
│   ├── data/
│   │   └── support_tickets.csv  # Curated training dataset
│   ├── models/
│   │   ├── ticket_classifier.joblib  # Trained Multinomial Logistic Regression model
│   │   ├── tfidf_vectorizer.joblib   # Fitted TF-IDF Vectorizer
│   │   └── metrics.json              # Model evaluation metrics
│   ├── train.py             # Model training & validation script
│   └── requirements.txt     # Python dependencies
├── docs/
│   ├── demo.mp4             # Output application walkthrough video
│   └── TESTING.md           # Testing instructions
├── frontend/
│   ├── src/
│   │   ├── main.jsx         # Full React application (Inbox, Analytics, Admin, Bot)
│   │   └── styles.css       # Unified design system (Light & Dark theme)
│   ├── index.html           # HTML shell with Google Fonts
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### 1. Start the Backend API

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train the ML model
python train.py

# Start FastAPI server
uvicorn app.main:app --port 8000 --host 127.0.0.1
```

Backend will be live at: **`http://127.0.0.1:8000`**  
Interactive API Docs (Swagger): **`http://127.0.0.1:8000/docs`**

---

### 2. Start the Frontend UI

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
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

## 📡 API Reference Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tickets` | List, search, and filter all support tickets |
| `POST` | `/api/tickets` | Classify and create a new support ticket |
| `PATCH` | `/api/tickets/{id}` | Update ticket status, urgency, or assigned agent |
| `POST` | `/api/tickets/{id}/messages` | Append messages / agent replies |
| `POST` | `/api/classify-batch` | Batch evaluate up to 50+ tickets with breakdown |
| `GET` | `/api/analytics` | Retrieve dynamic Weekly or Monthly analytics data |
| `POST` | `/api/bot/chat` | AI Copilot conversational queries & live classification |
| `POST` | `/api/auth/send-email-otp` | Send 6-digit verification code to email |
| `POST` | `/api/auth/verify-email-otp` | Verify code and generate authenticated user session |
| `POST` | `/api/auth/login` | Password-based authentication |
| `GET` | `/api/admin/system-status` | ML architecture, dataset metrics, and latency |
| `POST` | `/api/admin/retrain` | Live dynamic ML model retraining |
| `GET` | `/api/admin/agents` | Support specialist roster & workloads |
| `GET` | `/api/admin/audit-logs` | Chronological administrative audit logs |

---

## 📄 License
This project is licensed under the MIT License.



## OUTPUT


WhatsApp Video 2026-08-31 at 6.26
