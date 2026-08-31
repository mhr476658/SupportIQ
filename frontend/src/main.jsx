import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Inbox,
  LayoutDashboard,
  BarChart3,
  Bot,
  Plus,
  Search,
  RefreshCw,
  Send,
  Trash2,
  Sparkles,
  ShieldCheck,
  Moon,
  Sun,
  User,
  CheckCircle2,
  Clock,
  PieChart,
  Activity,
  Layers,
  Shield,
  KeyRound,
  Cpu,
  Database,
  Users,
  FileText,
  LogOut,
  Sliders,
  Download,
  AlertCircle,
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  ArrowRight
} from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

async function fetchApi(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'API request failed');
  }
  return res.json();
}

export default function App() {
  const [theme, setTheme] = useState('light');
  const [currentNav, setCurrentNav] = useState('inbox'); // 'inbox', 'dashboard', 'analytics', 'copilot', 'admin'
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [stats, setStats] = useState({
    total: 460,
    open: 4,
    urgent: 4,
    resolved: 2,
    intervention_requested: 4,
    human_vs_ai: { human: 28, ai: 72 },
    satisfaction_score: 8.6,
    sla_performance: { within_sla: 83.3, breached: 16.7 },
    categories: {},
    urgency: {}
  });

  // Admin Auth State
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('supportiq_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Floating AI Bot State
  const [isBotOpen, setIsBotOpen] = useState(false);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load all core data
  const loadCoreData = async () => {
    try {
      setIsLoading(true);
      const [tData, sData] = await Promise.all([
        fetchApi('/tickets'),
        fetchApi('/stats')
      ]);
      setTickets(tData);
      setStats(sData);
      if (tData.length > 0 && !selectedTicket) {
        setSelectedTicket(tData[0]);
      } else if (selectedTicket) {
        const updated = tData.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoreData();
  }, []);

  const handleAdminLogin = (userData) => {
    setAdminUser(userData);
    localStorage.setItem('supportiq_admin_user', JSON.stringify(userData));
    setIsLoginModalOpen(false);
    setCurrentNav('admin');
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('supportiq_admin_user');
    setCurrentNav('inbox');
  };

  const handleNavToAdmin = () => {
    if (adminUser) {
      setCurrentNav('admin');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleUpdateStatus = async (tid, newStatus) => {
    try {
      await fetchApi(`/tickets/${tid}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      loadCoreData();
      if (selectedTicket && selectedTicket.id === tid) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleUpdateUrgency = async (tid, newUrgency) => {
    try {
      await fetchApi(`/tickets/${tid}`, {
        method: 'PATCH',
        body: JSON.stringify({ urgency: newUrgency })
      });
      loadCoreData();
      if (selectedTicket && selectedTicket.id === tid) {
        setSelectedTicket(prev => ({ ...prev, urgency: newUrgency }));
      }
    } catch (err) {
      alert('Error updating urgency: ' + err.message);
    }
  };

  const handleSendMessage = async (tid, text) => {
    if (!text.trim()) return;
    try {
      const res = await fetchApi(`/tickets/${tid}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text, sender: 'agent' })
      });
      if (res.messages && selectedTicket) {
        setSelectedTicket(prev => ({ ...prev, messages: res.messages }));
      }
      loadCoreData();
    } catch (err) {
      alert('Error sending message: ' + err.message);
    }
  };

  const handleDeleteTicket = async (tid) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await fetchApi(`/tickets/${tid}`, { method: 'DELETE' });
      loadCoreData();
      setSelectedTicket(null);
    } catch (err) {
      alert('Error deleting ticket: ' + err.message);
    }
  };

  return (
    <div className="app-layout">
      {/* 1. Left Navigation Sidebar */}
      <aside className="main-sidebar">
        <div className="sidebar-brand-header">
          <div className="brand-icon-box">
            <Sparkles size={20} />
          </div>
          <div className="brand-text-group">
            <h2>SupportIQ</h2>
            <p>AI Support Intelligence</p>
          </div>
        </div>

        <nav className="sidebar-nav-list">
          <button
            className={`nav-link-btn ${currentNav === 'inbox' ? 'active' : ''}`}
            onClick={() => setCurrentNav('inbox')}
          >
            <div>
              <Inbox size={18} />
              <span>Support Inbox</span>
            </div>
            <span className="nav-badge-pill">{tickets.length}</span>
          </button>

          <button
            className={`nav-link-btn ${currentNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentNav('dashboard')}
          >
            <div>
              <LayoutDashboard size={18} />
              <span>Service Overview</span>
            </div>
          </button>

          <button
            className={`nav-link-btn ${currentNav === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentNav('analytics')}
          >
            <div>
              <BarChart3 size={18} />
              <span>Statistics & Analytics</span>
            </div>
          </button>

          <button
            className={`nav-link-btn ${currentNav === 'copilot' ? 'active' : ''}`}
            onClick={() => setCurrentNav('copilot')}
          >
            <div>
              <Bot size={18} />
              <span>AI Batch Classifier</span>
            </div>
          </button>

          {/* Admin Navigation Button */}
          <button
            className={`nav-link-btn ${currentNav === 'admin' ? 'active' : ''}`}
            onClick={handleNavToAdmin}
            style={{ marginTop: 8, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}
          >
            <div>
              <Shield size={18} color="var(--accent-purple)" />
              <span style={{ color: 'var(--accent-purple)' }}>Admin Portal</span>
            </div>
            {adminUser ? (
              <span className="nav-badge-pill" style={{ background: '#10b981' }}>Active</span>
            ) : (
              <KeyRound size={14} color="var(--text-muted)" />
            )}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="theme-toggle-row">
            <span>Theme Mode</span>
            <button
              className="theme-switch-btn"
              onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>

          <div className="agent-profile-card">
            <div className="agent-avatar-group">
              <div className="agent-avatar">
                {adminUser ? adminUser.avatar || 'AD' : 'MT'}
                <div className="online-dot" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                  {adminUser ? adminUser.name : 'Manminder Tomar'}
                </div>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                  ● {adminUser ? adminUser.role : 'Available'}
                </div>
              </div>
            </div>
            {adminUser && (
              <button
                className="theme-switch-btn"
                style={{ padding: '4px 8px', color: '#ef4444' }}
                onClick={handleAdminLogout}
                title="Log Out Admin Session"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="main-wrapper">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <div>
              <div className="page-title-heading">
                {currentNav === 'inbox' && 'Support Tickets Inbox'}
                {currentNav === 'dashboard' && 'Service Tickets Overview'}
                {currentNav === 'analytics' && 'Statistics & Topic Analytics'}
                {currentNav === 'copilot' && 'AI Ticket Classification Copilot'}
                {currentNav === 'admin' && 'Enterprise Administration Console'}
                <span className="badge-count">{stats.total} Total</span>
              </div>
              <div className="page-subheading">
                {currentNav === 'inbox' && 'View, classify, and respond to incoming customer support requests'}
                {currentNav === 'dashboard' && 'Real-time monitoring of support volume, SLAs, and resolution ratios'}
                {currentNav === 'analytics' && 'Interactive analytics: sentiment trends, resolution volume, and carrier breakdowns'}
                {currentNav === 'copilot' && 'Batch classifier and automated routing engine for support engineers'}
                {currentNav === 'admin' && 'System health, model retraining, agent management, and audit logs'}
              </div>
            </div>
          </div>

          <div className="top-bar-right">
            <div className="kpi-quick-pills">
              <span><i className="dot-indicator" style={{ background: '#3b82f6' }} /> Open: <b>{stats.open}</b></span>
              <span><i className="dot-indicator" style={{ background: '#ef4444' }} /> Urgent: <b>{stats.urgent}</b></span>
              <span><i className="dot-indicator" style={{ background: '#10b981' }} /> Resolved: <b>{stats.resolved}</b></span>
            </div>

            <button className="theme-switch-btn" onClick={loadCoreData} title="Refresh Live Data">
              <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
              <span>Refresh</span>
            </button>

            <button className="btn-primary-action" onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} /> New Ticket
            </button>
          </div>
        </header>

        {/* View Routing */}
        {currentNav === 'inbox' && (
          <UserFriendlyInboxView
            tickets={tickets}
            selectedTicket={selectedTicket}
            onSelectTicket={setSelectedTicket}
            onUpdateStatus={handleUpdateStatus}
            onUpdateUrgency={handleUpdateUrgency}
            onSendMessage={handleSendMessage}
            onDeleteTicket={handleDeleteTicket}
          />
        )}

        {currentNav === 'dashboard' && (
          <ExecutiveDashboardView
            stats={stats}
            tickets={tickets}
            onOpenTicket={(t) => {
              setSelectedTicket(t);
              setCurrentNav('inbox');
            }}
          />
        )}

        {currentNav === 'analytics' && (
          <InteractiveAnalyticsView />
        )}

        {currentNav === 'copilot' && (
          <AICopilotAgentView onTicketCreated={loadCoreData} />
        )}

        {currentNav === 'admin' && (
          <AdminDashboardView
            adminUser={adminUser}
            onLogout={handleAdminLogout}
            onDataChange={loadCoreData}
          />
        )}
      </main>

      {/* 3. Floating AI Bot Trigger & Window */}
      {!isBotOpen && (
        <button
          className="floating-bot-trigger"
          onClick={() => setIsBotOpen(true)}
          title="Open SupportIQ AI Bot"
        >
          <Bot size={26} />
          <div className="bot-badge-pulse" />
        </button>
      )}

      {isBotOpen && (
        <FloatingAIBotWindow
          onClose={() => setIsBotOpen(false)}
          onNavigate={(nav) => {
            setCurrentNav(nav);
          }}
          onCreateTicketModal={() => setIsCreateOpen(true)}
          onDataReload={loadCoreData}
        />
      )}

      {/* 4. Admin Login Modal */}
      {isLoginModalOpen && (
        <AdminLoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={handleAdminLogin}
        />
      )}

      {/* 5. Create Ticket Modal */}
      {isCreateOpen && (
        <CreateTicketModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={(newTicket) => {
            setIsCreateOpen(false);
            loadCoreData();
            setSelectedTicket(newTicket);
            setCurrentNav('inbox');
          }}
        />
      )}
    </div>
  );
}

/* ==========================================================================
   FLOATING AI COPILOT BOT COMPONENT
   ========================================================================== */
function FloatingAIBotWindow({ onClose, onNavigate, onCreateTicketModal, onDataReload }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "👋 Hi! I am **SupportIQ Copilot Bot**, your AI intelligence assistant.\n\nAsk me anything about ticket urgency, real-time issue classification, analytics, or system health!",
      actions: [
        { label: '🚨 Check Urgent Tickets', action: 'check_urgent' },
        { label: '📊 Summarize Support KPIs', action: 'open_analytics' },
        { label: '🤖 Batch Classify 50 Tickets', action: 'open_copilot' }
      ]
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'Check urgent tickets',
    'Show analytics & resolution rate',
    'Classify: My payment was double billed',
    'Retrain ML model'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      const res = await fetchApi('/bot/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text })
      });
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: res.reply,
          actions: res.suggested_actions || []
        }
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: '⚠️ Sorry, I could not process your query: ' + e.message,
          actions: []
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (actionObj) => {
    if (actionObj.action === 'filter_urgent' || actionObj.action === 'open_inbox') {
      onNavigate('inbox');
    } else if (actionObj.action === 'open_analytics') {
      onNavigate('analytics');
    } else if (actionObj.action === 'open_dashboard') {
      onNavigate('dashboard');
    } else if (actionObj.action === 'open_copilot') {
      onNavigate('copilot');
    } else if (actionObj.action === 'open_admin') {
      onNavigate('admin');
    } else if (actionObj.action === 'check_urgent') {
      handleSend('Show me all urgent tickets');
    } else if (actionObj.action === 'create_from_bot') {
      onCreateTicketModal();
    }
  };

  return (
    <div className="floating-bot-window">
      {/* Bot Header */}
      <div className="bot-header">
        <div className="bot-header-left">
          <div className="bot-avatar-icon">
            <Bot size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>SupportIQ Bot</div>
            <div style={{ fontSize: 10.5, color: '#10b981', fontWeight: 600 }}>● Online · ML Copilot</div>
          </div>
        </div>

        <button className="theme-switch-btn" style={{ padding: 4 }} onClick={onClose} title="Close Bot">
          <X size={15} />
        </button>
      </div>

      {/* Message Stream */}
      <div className="bot-messages-body">
        {messages.map((m, idx) => (
          <div key={idx} className={`bot-msg-row ${m.sender}`}>
            <div className="bot-bubble">
              {m.text}
            </div>

            {m.actions && m.actions.length > 0 && (
              <div className="bot-chip-actions">
                {m.actions.map((act, aIdx) => (
                  <button
                    key={aIdx}
                    className="bot-chip-btn"
                    onClick={() => handleActionClick(act)}
                  >
                    {act.label} →
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="bot-msg-row bot">
            <div className="bot-bubble" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              🤖 AI Copilot is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="bot-quick-prompts">
        {quickPrompts.map((qp, i) => (
          <button key={i} className="bot-quick-pill" onClick={() => handleSend(qp)}>
            {qp}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="bot-input-footer">
        <input
          type="text"
          placeholder="Ask AI bot or paste an issue to classify..."
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button className="btn-primary-action" style={{ padding: '8px 12px' }} onClick={() => handleSend()}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 5: ADMIN DASHBOARD VIEW & MANAGEMENT
   ========================================================================== */
function AdminDashboardView({ adminUser, onLogout, onDataChange }) {
  const [adminTab, setAdminTab] = useState('overview'); // 'overview', 'agents', 'audit'
  const [sysStatus, setSysStatus] = useState(null);
  const [agents, setAgents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('Senior Triage Agent');

  const loadAdminData = async () => {
    try {
      const [sData, aData, lData] = await Promise.all([
        fetchApi('/admin/system-status'),
        fetchApi('/admin/agents'),
        fetchApi('/admin/audit-logs')
      ]);
      setSysStatus(sData);
      setAgents(aData);
      setAuditLogs(lData);
    } catch (e) {
      console.error('Error loading admin status:', e);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRetrain = async () => {
    if (!confirm('Run ML model retraining now with the latest training dataset?')) return;
    try {
      setIsRetraining(true);
      setRetrainMsg('');
      const res = await fetchApi('/admin/retrain', { method: 'POST' });
      setRetrainMsg(res.message);
      loadAdminData();
      onDataChange();
    } catch (err) {
      alert('Retraining failed: ' + err.message);
    } finally {
      setIsRetraining(false);
    }
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentEmail.trim()) return;
    try {
      await fetchApi('/admin/agents', {
        method: 'POST',
        body: JSON.stringify({
          name: newAgentName,
          email: newAgentEmail,
          role: newAgentRole,
          status: 'Available'
        })
      });
      setNewAgentName('');
      setNewAgentEmail('');
      loadAdminData();
      alert('New agent added successfully!');
    } catch (err) {
      alert('Failed to add agent: ' + err.message);
    }
  };

  return (
    <div className="admin-portal-wrapper">
      <div className="admin-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>
              Administrator Console
            </h2>
            <span className="badge-count" style={{ background: '#ecfdf5', color: '#10b981', borderColor: '#a7f3d0' }}>
              ● System Status: {sysStatus?.status || 'Operational'}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Logged in as: <b>{adminUser?.name || 'Administrator'}</b> ({adminUser?.role || 'Super Admin'}) · {adminUser?.email}
          </p>
        </div>

        <div className="admin-tabs-bar">
          <button
            className={`admin-tab-btn ${adminTab === 'overview' ? 'active' : ''}`}
            onClick={() => setAdminTab('overview')}
          >
            <Cpu size={15} /> System & Model
          </button>
          <button
            className={`admin-tab-btn ${adminTab === 'agents' ? 'active' : ''}`}
            onClick={() => setAdminTab('agents')}
          >
            <Users size={15} /> Agent Team ({agents.length})
          </button>
          <button
            className={`admin-tab-btn ${adminTab === 'audit' ? 'active' : ''}`}
            onClick={() => setAdminTab('audit')}
          >
            <FileText size={15} /> Audit Logs
          </button>
        </div>
      </div>

      {adminTab === 'overview' && sysStatus && (
        <div className="admin-grid-2col">
          <div className="admin-card">
            <div className="admin-card-title">
              <Cpu size={18} color="var(--primary)" />
              <span>ML Classifier Architecture & Inference</span>
            </div>

            <div className="admin-metric-row">
              <span>Model Pipeline</span>
              <b>{sysStatus.model_architecture}</b>
            </div>
            <div className="admin-metric-row">
              <span>Classification Accuracy</span>
              <b style={{ color: '#10b981' }}>{((sysStatus.accuracy || 0.93) * 100).toFixed(1)}%</b>
            </div>
            <div className="admin-metric-row">
              <span>Weighted F1 Score</span>
              <b style={{ color: '#3b82f6' }}>{((sysStatus.weighted_f1 || 0.93) * 100).toFixed(1)}%</b>
            </div>
            <div className="admin-metric-row">
              <span>Average Inference Latency</span>
              <b>{sysStatus.avg_inference_latency_ms} ms</b>
            </div>
            <div className="admin-metric-row">
              <span>Active Target Categories</span>
              <b>{sysStatus.categories_count} Classes ({sysStatus.classes.join(', ')})</b>
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                className="btn-primary-action"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleRetrain}
                disabled={isRetraining}
              >
                <RefreshCw size={15} className={isRetraining ? 'spin-animation' : ''} />
                {isRetraining ? 'Retraining Model...' : '⚡ Retrain Model Pipeline Live'}
              </button>
              {retrainMsg && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#10b981', fontWeight: 600, textAlign: 'center' }}>
                  ✓ {retrainMsg}
                </div>
              )}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-title">
              <Database size={18} color="var(--accent-purple)" />
              <span>Database & Infrastructure Health</span>
            </div>

            <div className="admin-metric-row">
              <span>Database Engine</span>
              <b>SQLite 3 (tickets.db)</b>
            </div>
            <div className="admin-metric-row">
              <span>Stored Support Tickets</span>
              <b>{sysStatus.total_tickets_stored} live tickets</b>
            </div>
            <div className="admin-metric-row">
              <span>Training Dataset Corpus</span>
              <b>{sysStatus.training_dataset_rows} curated samples</b>
            </div>
            <div className="admin-metric-row">
              <span>Server Uptime</span>
              <b style={{ color: '#10b981' }}>{sysStatus.server_uptime}</b>
            </div>
            <div className="admin-metric-row">
              <span>Model Artifacts Status</span>
              <b>joblib vectors synchronized</b>
            </div>

            <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
              <button
                className="theme-switch-btn"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => alert('Exporting full tickets database as JSON...')}
              >
                <Download size={14} /> Export Tickets JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'agents' && (
        <div className="admin-grid-2col">
          <div className="admin-card">
            <div className="admin-card-title">
              <Users size={18} color="var(--primary)" />
              <span>Active Support Agents Roster</span>
            </div>

            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Resolved</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{a.name}</div>
                      <small style={{ color: 'var(--text-muted)' }}>{a.email}</small>
                    </td>
                    <td>{a.role}</td>
                    <td>
                      <span className="badge-count" style={{ background: '#ecfdf5', color: '#10b981', borderColor: '#a7f3d0' }}>
                        {a.status}
                      </span>
                    </td>
                    <td><b>{a.resolved_count}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-card">
            <div className="admin-card-title">
              <Plus size={18} color="var(--accent-purple)" />
              <span>Add Support Specialist</span>
            </div>

            <form onSubmit={handleAddAgent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-field-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={newAgentName}
                  onChange={e => setNewAgentName(e.target.value)}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. alex.m@supportiq.com"
                  value={newAgentEmail}
                  onChange={e => setNewAgentEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Role Assignment</label>
                <select
                  value={newAgentRole}
                  onChange={e => setNewAgentRole(e.target.value)}
                >
                  <option value="Senior Triage Agent">Senior Triage Agent</option>
                  <option value="Technical Support Tier 2">Technical Support Tier 2</option>
                  <option value="Billing Specialist">Billing Specialist</option>
                  <option value="Support Lead">Support Lead</option>
                </select>
              </div>

              <button type="submit" className="btn-primary-action" style={{ marginTop: 8, justifyContent: 'center' }}>
                <Plus size={16} /> Register Agent
              </button>
            </form>
          </div>
        </div>
      )}

      {adminTab === 'audit' && (
        <div className="admin-card">
          <div className="admin-card-title">
            <FileText size={18} color="var(--accent-purple)" />
            <span>System Audit Trail & Security Events</span>
          </div>

          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action Event</th>
                <th>Actor</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge-count" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', borderColor: 'var(--primary-border)' }}>
                      {l.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{l.actor}</td>
                  <td>{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   ADMIN LOGIN MODAL (EMAIL OTP & PASSWORD AUTHENTICATION)
   ========================================================================== */
function AdminLoginModal({ onClose, onSuccess }) {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'password'
  const [email, setEmail] = useState('admin@supportiq.com');
  const [password, setPassword] = useState('admin123');
  const [otpStep, setOtpStep] = useState(1); // 1 = enter email, 2 = enter otp
  const [otpCode, setOtpCode] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Send Email OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetchApi('/auth/send-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setOtpStep(2);
      setOtpHint(res.code);
      setSuccessMsg(`A 6-digit verification code was sent to ${email}`);
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Verify Email OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (!otpCode.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetchApi('/auth/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code: otpCode })
      });
      onSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      onSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    const targetEmail = role === 'admin' ? 'admin@supportiq.com' : 'lead@supportiq.com';
    const targetPass = role === 'admin' ? 'admin123' : 'lead123';
    try {
      setLoading(true);
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, password: targetPass })
      });
      onSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800 }}>Portal Authentication</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Secure authentication for SupportIQ platform</p>
            </div>
          </div>
          <button className="theme-switch-btn" onClick={onClose}>✕</button>
        </div>

        {/* Method Switcher Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'var(--bg-subtle)', padding: 4, borderRadius: 10, border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className="theme-switch-btn"
            style={{
              justifyContent: 'center',
              border: 'none',
              background: loginMethod === 'email' ? 'var(--primary)' : 'transparent',
              color: loginMethod === 'email' ? 'white' : 'var(--text-muted)',
              fontWeight: 700
            }}
            onClick={() => {
              setLoginMethod('email');
              setError('');
              setSuccessMsg('');
            }}
          >
            ✉️ Sign in via Email
          </button>
          <button
            type="button"
            className="theme-switch-btn"
            style={{
              justifyContent: 'center',
              border: 'none',
              background: loginMethod === 'password' ? 'var(--primary)' : 'transparent',
              color: loginMethod === 'password' ? 'white' : 'var(--text-muted)',
              fontWeight: 700
            }}
            onClick={() => {
              setLoginMethod('password');
              setError('');
              setSuccessMsg('');
            }}
          >
            🔑 Password
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ background: 'var(--danger-subtle)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'var(--success-subtle)', color: '#10b981', padding: '10px 14px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <CheckCircle2 size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Email OTP Flow */}
        {loginMethod === 'email' && (
          <>
            {otpStep === 1 ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-field-group">
                  <label>Your Work Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com or admin@supportiq.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    We will generate and send a 6-digit authentication passcode to this email.
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn-primary-action"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                  disabled={loading}
                >
                  {loading ? 'Sending Verification Code...' : 'Send Verification Code via Email →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Enter 6-Digit Passcode</label>
                    <button
                      type="button"
                      style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setOtpStep(1)}
                    >
                      Change email
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code (e.g. 849201)"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    style={{ fontSize: 18, letterSpacing: 4, textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                    required
                    autoFocus
                  />

                  {otpHint && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 11.5 }}>
                      <span>Simulated Incoming Code: <b style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{otpHint}</b></span>
                      <button
                        type="button"
                        className="theme-switch-btn"
                        style={{ padding: '2px 8px', fontSize: 10.5 }}
                        onClick={() => setOtpCode(otpHint)}
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="btn-secondary-action"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-action"
                    style={{ flex: 2, justifyContent: 'center' }}
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* 2. Password Flow */}
        {loginMethod === 'password' && (
          <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-field-group">
              <label>Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary-action"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>
          </form>
        )}

        {/* 3. Demo Quick Login */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
          <small style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Quick Demo One-Click Sign In:
          </small>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="theme-switch-btn"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => handleQuickDemo('admin')}
            >
              👑 Super Admin
            </button>
            <button
              type="button"
              className="theme-switch-btn"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => handleQuickDemo('lead')}
            >
              👔 Support Lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 1: CLEAN & USER-FRIENDLY SUPPORT INBOX
   ========================================================================== */
function UserFriendlyInboxView({
  tickets,
  selectedTicket,
  onSelectTicket,
  onUpdateStatus,
  onUpdateUrgency,
  onSendMessage,
  onDeleteTicket
}) {
  const [filterTab, setFilterTab] = useState('All');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [replyText, setReplyText] = useState('');

  const cannedSuggestions = [
    { label: '👋 Acknowledge & Request Details', text: 'Hello! Thank you for reaching out. Could you please provide your order ID or account details so we can investigate this right away?' },
    { label: '💳 Confirm Billing Check', text: 'We have initiated a transaction audit with our billing department and will update you shortly.' },
    { label: '⚡ Escalate to Tier 2 Tech', text: 'Your technical issue has been prioritized and routed to our engineering escalation team.' },
    { label: '📦 Check Carrier Tracking', text: 'We are contacting the logistics carrier regarding your shipment status and will share the tracking milestone.' }
  ];

  const displayedTickets = tickets.filter(t => {
    const term = search.toLowerCase();
    const matchesSearch = search === '' ||
      t.text?.toLowerCase().includes(term) ||
      t.customer_name?.toLowerCase().includes(term) ||
      t.issue_code?.toLowerCase().includes(term);

    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;

    if (filterTab === 'Urgent') return matchesSearch && matchesCategory && (t.urgency === 'High' || t.status === 'Intervention Requested');
    if (filterTab === 'Open') return matchesSearch && matchesCategory && t.status === 'Open';
    if (filterTab === 'In Progress') return matchesSearch && matchesCategory && t.status === 'In Progress';
    if (filterTab === 'Resolved') return matchesSearch && matchesCategory && t.status === 'Resolved';
    return matchesSearch && matchesCategory;
  });

  const handleSend = () => {
    if (!selectedTicket || !replyText.trim()) return;
    onSendMessage(selectedTicket.id, replyText);
    setReplyText('');
  };

  return (
    <div className="inbox-view-container">
      <div className="inbox-list-pane">
        <div className="inbox-search-header">
          <div className="search-input-field">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by keyword, customer, or ticket ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-tab-pills">
            {['All', 'Urgent', 'Open', 'In Progress', 'Resolved'].map(tab => (
              <button
                key={tab}
                className={`tab-pill ${filterTab === tab ? 'active' : ''}`}
                onClick={() => setFilterTab(tab)}
              >
                {tab === 'Urgent' ? '⚡ Urgent' : tab}
              </button>
            ))}
          </div>

          <select
            className="header-dropdown-pill"
            style={{ width: '100%' }}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories (6 Categories)</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Billing">Billing & Payments</option>
            <option value="Account Access">Account Access</option>
            <option value="Shipping & Delivery">Shipping & Delivery</option>
            <option value="Product Issue">Product Issue</option>
            <option value="Cancellation & Refund">Cancellation & Refund</option>
          </select>
        </div>

        <div className="tickets-scroll-queue">
          {displayedTickets.map(t => {
            const isSelected = selectedTicket && selectedTicket.id === t.id;
            const priorityClass = (t.urgency || 'low').toLowerCase();
            return (
              <div
                key={t.id}
                className={`ticket-item-row ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectTicket(t)}
              >
                <div className="ticket-row-top">
                  <span className="ticket-code-badge">{t.issue_code || 'ISSUES-' + t.id.slice(0, 8)}</span>
                  <span className={`ticket-priority-tag priority-${priorityClass}`}>
                    <i className="dot-indicator" style={{ width: 6, height: 6, margin: 0 }} />
                    {t.urgency || 'Low'}
                  </span>
                </div>

                <div className="ticket-row-title">{t.customer_name || 'Customer'}</div>
                <div className="ticket-row-snippet">{t.text}</div>

                <div className="ticket-row-meta">
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.category || 'General'}</span>
                  <span>{formatTimeAgo(t.created_at)}</span>
                </div>
              </div>
            );
          })}

          {displayedTickets.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No support tickets found matching your filter.
            </div>
          )}
        </div>
      </div>

      <div className="inbox-detail-pane">
        {selectedTicket ? (
          <>
            <div className="detail-pane-header">
              <div className="customer-header-title">
                <div className="customer-avatar-large">
                  {selectedTicket.customer_name ? selectedTicket.customer_name.slice(0, 2).toUpperCase() : 'WW'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>
                    {selectedTicket.customer_name || 'Waaaaattss WATTSSS'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {selectedTicket.issue_code} · {selectedTicket.company_name || 'Pullse'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select
                  className="header-dropdown-pill"
                  value={selectedTicket.status || 'Open'}
                  onChange={e => onUpdateStatus(selectedTicket.id, e.target.value)}
                >
                  <option value="Open">Status: Open</option>
                  <option value="In Progress">Status: In Progress</option>
                  <option value="Resolved">Status: Resolved</option>
                  <option value="Intervention Requested">Status: Intervention Requested</option>
                </select>

                <select
                  className="header-dropdown-pill"
                  value={selectedTicket.urgency || 'Low'}
                  onChange={e => onUpdateUrgency(selectedTicket.id, e.target.value)}
                >
                  <option value="Low">Priority: Low</option>
                  <option value="Medium">Priority: Medium</option>
                  <option value="High">Priority: High</option>
                </select>

                <button
                  className="theme-switch-btn"
                  style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                  onClick={() => onDeleteTicket(selectedTicket.id)}
                  title="Delete Ticket"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="detail-scroll-body">
              <div className="ai-intelligence-card">
                <div className="ai-card-title-row">
                  <div className="ai-card-badge">
                    <Sparkles size={16} /> AI Ticket Intelligence & Routing
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>
                    ✓ Model Confidence: {((selectedTicket.confidence || 0.92) * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="ai-metrics-grid">
                  <div className="ai-metric-item">
                    <small>Predicted Category</small>
                    <strong>{selectedTicket.category || 'Technical Issue'}</strong>
                  </div>
                  <div className="ai-metric-item">
                    <small>Assessed Urgency</small>
                    <strong style={{ color: selectedTicket.urgency === 'High' ? '#ef4444' : 'var(--text-main)' }}>
                      {selectedTicket.urgency || 'Low'}
                    </strong>
                  </div>
                  <div className="ai-metric-item">
                    <small>Detected Triggers</small>
                    <strong style={{ fontSize: 12 }}>
                      {selectedTicket.keywords || 'None (Standard)'}
                    </strong>
                  </div>
                </div>

                <div className="ai-insights-block">
                  <div className="insight-row">
                    <strong>• Issue Analysis:</strong>
                    <span>{selectedTicket.ai_summary?.issue || 'Customer inquiry.'}</span>
                  </div>
                  <div className="insight-row">
                    <strong>• Description & Summary:</strong>
                    <span>{selectedTicket.ai_summary?.description || selectedTicket.text}</span>
                  </div>
                  <div className="insight-row">
                    <strong>• Recommended Next Step:</strong>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {selectedTicket.ai_summary?.action || 'Review details and reply to customer.'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="metadata-strip">
                <div className="meta-item">
                  <span>Customer Email</span>
                  <b>{selectedTicket.customer_email || 'hhh@gmail.com'}</b>
                </div>
                <div className="meta-item">
                  <span>Phone Number</span>
                  <b>{selectedTicket.customer_phone || '+1 2131231232'}</b>
                </div>
                <div className="meta-item">
                  <span>Company</span>
                  <b>{selectedTicket.company_name || 'Pullse Inc'}</b>
                </div>
                <div className="meta-item">
                  <span>Assigned Agent</span>
                  <b>{selectedTicket.assigned_to || 'Unassigned'}</b>
                </div>
              </div>

              <div className="messages-container">
                {(selectedTicket.messages || []).map((msg, i) => (
                  <div key={i} className={`chat-bubble-row ${msg.sender || 'user'}`}>
                    <div className="chat-bubble-content">
                      {msg.text}
                    </div>
                    <span className="bubble-time">{msg.time || 'Just now'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="reply-composer-card">
              <div className="quick-response-pills">
                {cannedSuggestions.map((c, idx) => (
                  <button
                    key={idx}
                    className="quick-pill-btn"
                    onClick={() => setReplyText(c.text)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="reply-input-bar">
                <input
                  type="text"
                  placeholder="Type a response to the customer (or select an AI canned reply)..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSend();
                  }}
                />
                <button className="btn-primary-action" onClick={handleSend}>
                  <Send size={15} /> Send Reply
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a support ticket to review AI predictions and message history.
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 3: INTERACTIVE STATISTIQUES ANALYTICS
   ========================================================================== */
function InteractiveAnalyticsView() {
  const [period, setPeriod] = useState('weekly');
  const [data, setData] = useState(null);
  const [hoverPoint, setHoverPoint] = useState(null);

  const fetchAnalytics = async (p) => {
    try {
      const res = await fetchApi(`/analytics?period=${p}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading analytics data...</div>;
  }

  return (
    <div className="analytics-page-wrapper">
      <div className="analytics-top-header">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>
            Statistiques & Performance Analytics
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Live tracking of sentiment trends, resolution throughput, and topic distributions
          </p>
        </div>

        <div className="time-tab-switcher">
          <button
            className={`time-tab-btn ${period === 'weekly' ? 'active' : ''}`}
            onClick={() => setPeriod('weekly')}
          >
            Weekly Breakdown
          </button>
          <button
            className={`time-tab-btn ${period === 'monthly' ? 'active' : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            Monthly Aggregate
          </button>
        </div>
      </div>

      <div className="analytics-kpi-summary-cards">
        <div className="stat-kpi-card">
          <small>Total Tickets Analyzed</small>
          <strong>{data.total_tickets.toLocaleString()}</strong>
        </div>
        <div className="stat-kpi-card">
          <small>AI Resolution Rate</small>
          <strong style={{ color: '#10b981' }}>{data.ai_resolution_pct}%</strong>
        </div>
        <div className="stat-kpi-card">
          <small>Positive Sentiment Score</small>
          <strong style={{ color: '#3b82f6' }}>{data.avg_sentiment_score}%</strong>
        </div>
        <div className="stat-kpi-card">
          <small>Monitored Categories</small>
          <strong style={{ color: '#8b5cf6' }}>{data.topics_count}</strong>
        </div>
      </div>

      <div className="charts-main-grid">
        <div className="chart-card-box">
          <div className="chart-card-title">
            <Activity size={16} color="#00ffcc" />
            <span>Sentiment Trends (% Negative Dropping)</span>
          </div>
          <div className="chart-svg-container">
            <svg viewBox="0 0 300 120" style={{ width: '100%', height: '100%' }}>
              <path
                d={`M 20 ${100 - data.sentiment_trends[0].negative_pct * 1.5} ` +
                  data.sentiment_trends.map((pt, i) => `L ${20 + i * 50} ${100 - pt.negative_pct * 1.5}`).join(' ')}
                fill="none"
                stroke="#00ffcc"
                strokeWidth="3"
              />
              {data.sentiment_trends.map((pt, i) => (
                <g key={i} onMouseEnter={() => setHoverPoint(pt)} onMouseLeave={() => setHoverPoint(null)}>
                  <circle
                    cx={20 + i * 50}
                    cy={100 - pt.negative_pct * 1.5}
                    r="5"
                    fill="var(--bg-surface)"
                    stroke="#00ffcc"
                    strokeWidth="2.5"
                    style={{ cursor: 'pointer' }}
                  />
                  <text x={20 + i * 50} y="115" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#00ffcc', fontWeight: 600 }}>
            {hoverPoint ? `${hoverPoint.label}: ${hoverPoint.negative_pct}% Negative` : 'Hover on data points to view metrics'}
          </div>
        </div>

        <div className="chart-card-box">
          <div className="chart-card-title">
            <Layers size={16} color="#c084fc" />
            <span>Resolution Trends (AI vs Human)</span>
          </div>
          <div className="chart-svg-container">
            <svg viewBox="0 0 300 120" style={{ width: '100%', height: '100%' }}>
              <path
                d="M 20 85 L 70 80 L 120 30 L 170 45 L 220 35 L 270 25"
                fill="none"
                stroke="#c084fc"
                strokeWidth="3"
              />
              <path
                d="M 20 105 L 70 102 L 120 98 L 170 100 L 220 95 L 270 96"
                fill="none"
                stroke="#00ffcc"
                strokeWidth="2.5"
              />
              {[20, 70, 120, 170, 220, 270].map((x, i) => (
                <circle key={i} cx={x} cy={30 + (i % 3) * 15} r="3" fill="#c084fc" />
              ))}
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, fontWeight: 700 }}>
            <span style={{ color: '#c084fc' }}>● AI Resolved Volume</span>
            <span style={{ color: '#00ffcc' }}>● Human Resolved</span>
          </div>
        </div>

        <div className="chart-card-box">
          <div className="chart-card-title">
            <PieChart size={16} color="#ec4899" />
            <span>Category & Topic Distribution</span>
          </div>
          <div className="donut-layout">
            <div style={{ width: 100, height: 100, position: 'relative' }}>
              <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#00ffcc" strokeWidth="5.5" strokeDasharray="43 57" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#3b82f6" strokeWidth="5.5" strokeDasharray="26 74" strokeDashoffset="-43" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#a855f7" strokeWidth="5.5" strokeDasharray="15 85" strokeDashoffset="-69" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#facc15" strokeWidth="5.5" strokeDasharray="16 84" strokeDashoffset="-84" />
              </svg>
            </div>
            <div className="donut-legend-col">
              {data.topic_distribution.slice(0, 4).map((t, i) => (
                <span key={i} style={{ color: t.color, fontWeight: 600 }}>
                  ■ {t.name} ({t.pct}%)
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card-box">
          <div className="chart-card-title">
            <Clock size={16} color="#00ffcc" />
            <span>Problematic Logistics Carriers</span>
          </div>
          <div style={{ marginTop: 6 }}>
            {data.problematic_carriers.map((c, i) => (
              <div key={i} className="bar-progress-row">
                <span className="bar-carrier-name">{c.name}</span>
                <div className="bar-progress-track">
                  <div className="bar-progress-fill" style={{ width: `${c.pct}%` }} />
                </div>
                <span style={{ width: 34, textAlign: 'right', fontWeight: 700 }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card-box">
          <div className="chart-card-title">
            <CheckCircle2 size={16} color="#3b82f6" />
            <span>Inquiry vs Defects Breakdown</span>
          </div>
          <div className="donut-layout" style={{ marginTop: 20 }}>
            <div style={{ width: 100, height: 100, position: 'relative' }}>
              <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#00ffcc" strokeWidth="6" strokeDasharray="72 28" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#3b82f6" strokeWidth="6" strokeDasharray="28 72" strokeDashoffset="-72" />
              </svg>
            </div>
            <div className="donut-legend-col">
              <span style={{ color: '#00ffcc', fontWeight: 700 }}>● General Inquiries (72%)</span>
              <span style={{ color: '#3b82f6', fontWeight: 700 }}>● Defects & Bugs (28%)</span>
            </div>
          </div>
        </div>

        <div className="chart-card-box">
          <div className="chart-card-title">
            <User size={16} color="#facc15" />
            <span>Top Enterprise Clients by Volume</span>
          </div>
          <table className="enterprise-table" style={{ marginTop: 6 }}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Tickets</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {data.top_clients.map((cl, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cl.name}</td>
                  <td>{cl.tickets}</td>
                  <td style={{ color: '#00ffcc', fontWeight: 800 }}>{cl.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 2: EXECUTIVE SERVICE DASHBOARD
   ========================================================================== */
function ExecutiveDashboardView({ stats, tickets, onOpenTicket }) {
  const [periodTab, setPeriodTab] = useState('Last 7 days');
  const urgentTickets = tickets.filter(t => t.urgency === 'High' || t.status === 'Intervention Requested').slice(0, 4);

  return (
    <div className="dashboard-content-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>Service Tickets Overview</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>High-level KPI distribution and human escalation queue</p>
        </div>

        <div className="time-tab-switcher">
          {['Today', 'Last 7 days', 'Last 30 days', 'Last year'].map(p => (
            <button
              key={p}
              className={`time-tab-btn ${periodTab === p ? 'active' : ''}`}
              onClick={() => setPeriodTab(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-top-metrics-grid">
        <div className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>All tickets</span>
            <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>See archived →</span>
          </div>
          <div className="dash-big-num">127</div>
          <div className="multi-seg-bar">
            <div style={{ width: '84%', background: '#10b981' }} />
            <div style={{ width: '13%', background: '#3b82f6' }} />
            <div style={{ width: '3%', background: '#ef4444' }} />
          </div>
          <div className="dash-legend-row">
            <div>
              <span><i className="dot-indicator" style={{ background: '#10b981' }} /> Ended (84%)</span>
              <strong>106</strong>
            </div>
            <div>
              <span><i className="dot-indicator" style={{ background: '#3b82f6' }} /> Opened (13%)</span>
              <strong>17</strong>
            </div>
            <div>
              <span><i className="dot-indicator" style={{ background: '#ef4444' }} /> Intervention (3%)</span>
              <strong>4</strong>
            </div>
          </div>
        </div>

        <div className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Resolved tickets ratio</span>
            <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>See evaluation →</span>
          </div>
          <div className="dash-big-num" style={{ fontSize: 26, fontWeight: 700 }}>Human vs AI</div>
          <div className="multi-seg-bar">
            <div style={{ width: '28%', background: '#f59e0b' }} />
            <div style={{ width: '72%', background: '#a855f7' }} />
          </div>
          <div className="dash-legend-row">
            <div>
              <span><i className="dot-indicator" style={{ background: '#f59e0b' }} /> Human Handled</span>
              <strong>28%</strong>
            </div>
            <div>
              <span><i className="dot-indicator" style={{ background: '#a855f7' }} /> AI Autonomous</span>
              <strong>72%</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>Human intervention requested (4)</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>All requests requiring immediate specialist triage</p>
          </div>
        </div>

        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Issued</th>
              <th>Customer</th>
              <th>Step-In ETA</th>
              <th>Category</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {urgentTickets.map((t, idx) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                  #{t.issue_code ? t.issue_code.split('-')[1]?.slice(-4) : '306' + idx}
                </td>
                <td>{new Date(t.created_at || Date.now()).toLocaleDateString()}</td>
                <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.customer_name || 'Isabella Jones'}</td>
                <td>
                  <span className="timer-tag-urgent">02:3{idx + 1}</span>
                </td>
                <td>{t.category || 'Extrusion Inconsistency'}</td>
                <td>
                  <button
                    className="theme-switch-btn"
                    onClick={() => onOpenTicket(t)}
                  >
                    Open Ticket →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 4: AI COPILOT BATCH CLASSIFIER
   ========================================================================== */
function AICopilotAgentView({ onTicketCreated }) {
  const [batchCount, setBatchCount] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState({
    total_classified: 50,
    accuracy: 0.93,
    avg_saved_per_case: '3m per case',
    breakdown: [
      { category: 'Technical Issues', cases: 28, percentage: 56 },
      { category: 'Billing & Payments', cases: 12, percentage: 24 },
      { category: 'Account Management', cases: 6, percentage: 12 },
      { category: 'Other Categories', cases: 4, percentage: 8 }
    ]
  });

  const handleRunBatch = async (count = 50) => {
    try {
      setIsProcessing(true);
      const res = await fetchApi('/classify-batch', {
        method: 'POST',
        body: JSON.stringify({ count })
      });
      setBatchResult(res);
      setBatchCount(count);
    } catch (e) {
      alert('Batch classification error: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="copilot-center-pane">
      <div className="engineer-prompt-card">
        <div className="engineer-avatar-circle">SE</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
            Support Engineer
          </div>
          <div className="engineer-bubble-text">
            Classify these {batchCount} new support tickets
          </div>
        </div>
      </div>

      <div className="agent-result-box">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
          Case Classification Agent
        </div>

        <div className="copilot-breakdown-card">
          <h3>Classification complete:</h3>
          {batchResult.breakdown.map((item, i) => (
            <div key={i} className="bullet-stat-row">
              <span>•</span>
              <b>{item.category}:</b>
              <span>{item.cases} cases ({item.percentage}%)</span>
            </div>
          ))}
        </div>

        <div className="copilot-stats-row">
          <div className="copilot-mini-card">
            <small>Classification Accuracy</small>
            <strong>{((batchResult.accuracy || 0.93) * 100).toFixed(0)}%</strong>
          </div>
          <div className="copilot-mini-card">
            <small>Avg. Handling Time Saved</small>
            <strong>{batchResult.avg_saved_per_case || '3m per case'}</strong>
          </div>
        </div>

        <div className="copilot-action-buttons">
          <button
            className="btn-secondary-action"
            onClick={() => handleRunBatch(50)}
            disabled={isProcessing}
          >
            {isProcessing ? 'Analyzing Batch...' : 'Classify Next Batch (50)'}
          </button>
          <button
            className="btn-primary-action"
            onClick={() => alert(`Successfully auto-assigned ${batchResult.total_classified} tickets to specialist queues!`)}
          >
            Auto-Assign All
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MODAL: CREATE TICKET
   ========================================================================== */
function CreateTicketModal({ onClose, onCreated }) {
  const [text, setText] = useState('');
  const [customerName, setCustomerName] = useState('Waaaaattss WATTSSS');
  const [customerEmail, setCustomerEmail] = useState('hhh@gmail.com');
  const [companyName, setCompanyName] = useState('Pullse');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const samplePrompts = [
    'My payment was charged twice for the same order.',
    'The mobile app crashes whenever I open the checkout tab.',
    'URGENT! Someone hacked my account and I need help immediately.',
    'The product I received is damaged and cracked.'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await fetchApi('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          text,
          customer_name: customerName,
          customer_email: customerEmail,
          company_name: companyName,
          source: 'Chat'
        })
      });
      onCreated(res);
    } catch (err) {
      alert('Error creating ticket: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header-row">
          <h2>Create & Classify Support Ticket</h2>
          <button className="theme-switch-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-field-group">
            <label>Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field-group">
              <label>Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-field-group">
              <label>Company</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-field-group">
            <label>Ticket Message / Customer Request</label>
            <textarea
              placeholder="Paste customer issue or message..."
              value={text}
              onChange={e => setText(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-pill-btn"
                onClick={() => setText(p)}
              >
                {p.slice(0, 30)}…
              </button>
            ))}
          </div>

          <div className="modal-footer-actions">
            <button type="button" className="btn-secondary-action" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" disabled={isSubmitting}>
              {isSubmitting ? 'Classifying with ML...' : 'Classify & Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

createRoot(document.getElementById('root')).render(<App />);
