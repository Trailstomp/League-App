import React, { useState, useEffect } from 'react';
import { Send, Users, Search, X, ChevronDown, Clock, Settings, Mail, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * EmailComposer - Full email module for league admins and team coaches
 * Supports compose, recipient picking, history, and SMTP settings
 */
const EmailComposer = ({ currentUser, teams = [], teamId = null, teamName = null }) => {
    const [activeView, setActiveView] = useState('compose');
    const [recipients, setRecipients] = useState([]);
    const [teamGroups, setTeamGroups] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [smtpStatus, setSmtpStatus] = useState(null);
    const [result, setResult] = useState(null);
    
    // Compose state
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [customEmail, setCustomEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showRecipientPicker, setShowRecipientPicker] = useState(false);
    
    // SMTP settings state (for team-level)
    const [smtpConfig, setSmtpConfig] = useState({ email: '', password: '', sender_name: '', host: '', port: 587 });
    const [savingSmtp, setSavingSmtp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const isTeamLevel = !!teamId;
    
    useEffect(() => {
        loadRecipients();
        loadHistory();
        loadSmtpStatus();
    }, [teamId]);
    
    const loadRecipients = async () => {
        try {
            const url = teamId 
                ? `${backendUrl}/api/email/recipients?team_id=${teamId}`
                : `${backendUrl}/api/email/recipients`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setRecipients(data.recipients || []);
                setTeamGroups(data.teams || []);
            }
        } catch (e) { console.error('Error loading recipients:', e); }
    };
    
    const loadHistory = async () => {
        try {
            const url = teamId 
                ? `${backendUrl}/api/email/history?team_id=${teamId}`
                : `${backendUrl}/api/email/history`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || []);
            }
        } catch (e) { console.error('Error loading history:', e); }
    };
    
    const loadSmtpStatus = async () => {
        try {
            const url = teamId 
                ? `${backendUrl}/api/teams/${teamId}/smtp-config`
                : `${backendUrl}/api/smtp-config/status`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setSmtpStatus(data);
                if (data.configured) {
                    setSmtpConfig(prev => ({ ...prev, email: data.email || '', sender_name: data.sender_name || '', host: data.host || '', port: data.port || 587 }));
                }
            }
        } catch (e) { console.error('Error loading SMTP status:', e); }
    };
    
    const handleSaveSmtp = async () => {
        setSavingSmtp(true);
        try {
            const url = teamId 
                ? `${backendUrl}/api/teams/${teamId}/smtp-config`
                : `${backendUrl}/api/smtp-config/save`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(smtpConfig)
            });
            if (res.ok) {
                setResult({ type: 'success', message: 'Email settings saved!' });
                loadSmtpStatus();
            } else {
                const err = await res.json();
                setResult({ type: 'error', message: err.detail || 'Failed to save' });
            }
        } catch (e) {
            setResult({ type: 'error', message: e.message });
        } finally {
            setSavingSmtp(false);
            setTimeout(() => setResult(null), 4000);
        }
    };
    
    const addCustomEmail = () => {
        const email = customEmail.trim().toLowerCase();
        if (email && email.includes('@') && !selectedEmails.includes(email)) {
            setSelectedEmails(prev => [...prev, email]);
            setCustomEmail('');
        }
    };
    
    const toggleRecipient = (email) => {
        setSelectedEmails(prev => 
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };
    
    const selectTeamGroup = (teamGroup) => {
        const emails = teamGroup.members.map(m => m.email).filter(Boolean);
        setSelectedEmails(prev => {
            const combined = new Set([...prev, ...emails]);
            return [...combined];
        });
    };
    
    const selectAll = () => {
        const allEmails = recipients.map(r => r.email).filter(Boolean);
        setSelectedEmails([...new Set(allEmails)]);
    };
    
    const applyTemplate = (template) => {
        const templates = {
            announcement: { subject: 'League Announcement', body: 'Hello everyone,\n\nWe have an important announcement to share with you.\n\n[Your announcement here]\n\nThank you,\nLeague Admin' },
            practice: { subject: 'Practice Update', body: 'Hi team,\n\nJust a quick update about upcoming practice:\n\n- Date: \n- Time: \n- Location: \n\nPlease confirm your attendance.\n\nSee you there!' },
            game_reminder: { subject: 'Game Day Reminder', body: 'Game day is here!\n\n- Opponent: \n- Date: \n- Time: \n- Location: \n\nPlease arrive 30 minutes early for warm-ups.\n\nLet\'s go!' },
            welcome: { subject: `Welcome to ${teamName || 'the League'}!`, body: `Welcome!\n\nWe're excited to have you join ${teamName || 'our league'}.\n\nHere are some important things to know:\n\n1. \n2. \n3. \n\nIf you have any questions, don't hesitate to reach out.\n\nSee you on the field!` }
        };
        const t = templates[template];
        if (t) { setSubject(t.subject); setBody(t.body); }
    };
    
    const handleSend = async () => {
        if (!selectedEmails.length || !subject.trim() || !body.trim()) return;
        
        setSending(true);
        setResult(null);
        try {
            const res = await fetch(`${backendUrl}/api/email/compose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to_emails: selectedEmails,
                    subject: subject.trim(),
                    body: body.trim(),
                    team_id: teamId,
                    sender_name: currentUser?.name || 'League Admin'
                })
            });
            const data = await res.json();
            if (res.ok) {
                setResult({ type: 'success', message: `Email sent to ${data.sent_count} recipient(s)!` });
                setSelectedEmails([]);
                setSubject('');
                setBody('');
                loadHistory();
            } else {
                setResult({ type: 'error', message: data.detail || 'Failed to send' });
            }
        } catch (e) {
            setResult({ type: 'error', message: e.message });
        } finally {
            setSending(false);
        }
    };
    
    const filteredRecipients = recipients.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
    });
    
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    
    return (
        <div className="space-y-6" data-testid="email-composer">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {isTeamLevel ? `${teamName || 'Team'} Email` : 'Email'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {smtpStatus?.configured 
                            ? <span className="text-green-600">Sending from: {smtpStatus.email}</span>
                            : <span className="text-amber-600">Email not configured — set up in Settings tab</span>
                        }
                    </p>
                </div>
            </div>
            
            {/* Result Banner */}
            {result && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {result.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">{result.message}</span>
                </div>
            )}
            
            {/* View Tabs */}
            <div className="flex border-b border-slate-200">
                {[
                    { id: 'compose', label: 'Compose', icon: <Mail className="w-4 h-4" /> },
                    { id: 'history', label: `Sent (${history.length})`, icon: <Clock className="w-4 h-4" /> },
                    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveView(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                            activeView === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                        data-testid={`email-tab-${tab.id}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>
            
            {/* COMPOSE VIEW */}
            {activeView === 'compose' && (
                <div className="space-y-4">
                    {/* Recipients */}
                    <div className="bg-white rounded-lg border p-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">To:</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {selectedEmails.map(email => (
                                <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    {email}
                                    <button onClick={() => toggleRecipient(email)} className="hover:text-blue-600">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </span>
                            ))}
                            {selectedEmails.length === 0 && (
                                <span className="text-sm text-slate-400">No recipients selected</span>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="email"
                                    value={customEmail}
                                    onChange={e => setCustomEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomEmail())}
                                    placeholder="Add email address..."
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    data-testid="email-custom-input"
                                />
                                <button onClick={addCustomEmail} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200">Add</button>
                            </div>
                            <button
                                onClick={() => setShowRecipientPicker(!showRecipientPicker)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                                data-testid="email-pick-recipients"
                            >
                                <Users className="w-4 h-4" /> Pick
                                <ChevronDown className={`w-3 h-3 transition-transform ${showRecipientPicker ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                        
                        {/* Recipient Picker Panel */}
                        {showRecipientPicker && (
                            <div className="mt-3 border rounded-lg bg-slate-50 p-3 max-h-64 overflow-y-auto" data-testid="recipient-picker">
                                {/* Quick Actions */}
                                <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b">
                                    <button onClick={selectAll} className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">All Members</button>
                                    {teamGroups.map(tg => (
                                        <button key={tg.team_id} onClick={() => selectTeamGroup(tg)} className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs hover:bg-slate-300">
                                            {tg.team_name} ({tg.members.length})
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Search */}
                                <div className="relative mb-2">
                                    <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or email..."
                                        className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-sm"
                                    />
                                </div>
                                
                                {/* Individual Recipients */}
                                <div className="space-y-1">
                                    {filteredRecipients.map(r => (
                                        <label key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedEmails.includes(r.email)}
                                                onChange={() => toggleRecipient(r.email)}
                                                className="rounded text-blue-600"
                                            />
                                            <span className="text-sm font-medium text-slate-700">{r.name}</span>
                                            <span className="text-xs text-slate-400">{r.email}</span>
                                            {r.teamName && <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded ml-auto">{r.teamName}</span>}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Quick Templates */}
                    <div className="flex gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 self-center">Templates:</span>
                        {[
                            { id: 'announcement', label: 'Announcement' },
                            { id: 'practice', label: 'Practice Update' },
                            { id: 'game_reminder', label: 'Game Reminder' },
                            { id: 'welcome', label: 'Welcome' }
                        ].map(t => (
                            <button key={t.id} onClick={() => applyTemplate(t.id)} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200">
                                {t.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Subject */}
                    <div>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Subject line..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            data-testid="email-subject"
                        />
                    </div>
                    
                    {/* Body */}
                    <div>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            placeholder="Write your message..."
                            rows={10}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                            data-testid="email-body"
                        />
                    </div>
                    
                    {/* Send Button */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            {selectedEmails.length} recipient{selectedEmails.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={handleSend}
                            disabled={sending || !selectedEmails.length || !subject.trim() || !body.trim() || !smtpStatus?.configured}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            data-testid="email-send-btn"
                        >
                            {sending ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                            ) : (
                                <><Send className="w-4 h-4" /> Send Email</>
                            )}
                        </button>
                    </div>
                </div>
            )}
            
            {/* HISTORY VIEW */}
            {activeView === 'history' && (
                <div className="bg-white rounded-lg border overflow-hidden">
                    {history.length > 0 ? (
                        <div className="divide-y">
                            {history.map(item => (
                                <div key={item.id} className="p-4 hover:bg-slate-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-slate-800">{item.subject}</h4>
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{item.body_preview}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                                <span>{formatDate(item.sent_at)}</span>
                                                <span>From: {item.from_email}</span>
                                                <span>{item.sent_count} sent{item.failed_count > 0 ? `, ${item.failed_count} failed` : ''}</span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            item.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-500">
                            <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">No emails sent yet</p>
                            <p className="text-sm mt-1">Sent emails will appear here</p>
                        </div>
                    )}
                </div>
            )}
            
            {/* SETTINGS VIEW */}
            {activeView === 'settings' && (
                <div className="bg-white rounded-lg border p-6 space-y-5">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                            {isTeamLevel ? 'Team Email Settings' : 'League Email Settings'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {isTeamLevel 
                                ? 'Configure your team\'s email. Emails will be sent from this address.' 
                                : 'Configure the league email for sending notifications. Teams can override with their own settings.'}
                        </p>
                    </div>
                    
                    {smtpStatus?.configured && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                            <CheckCircle className="w-4 h-4" />
                            Currently configured: <strong>{smtpStatus.email}</strong>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={smtpConfig.email}
                                onChange={e => setSmtpConfig(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="team@example.com"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                data-testid="smtp-email-input"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">App Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={smtpConfig.password}
                                    onChange={e => setSmtpConfig(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="App-specific password"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 pr-20"
                                    data-testid="smtp-password-input"
                                />
                                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700">
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">For Gmail: use an App Password (Google Account → Security → App Passwords)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sender Name</label>
                            <input
                                type="text"
                                value={smtpConfig.sender_name}
                                onChange={e => setSmtpConfig(prev => ({ ...prev, sender_name: e.target.value }))}
                                placeholder="e.g. Metro Lacrosse League"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host (auto-detected)</label>
                            <input
                                type="text"
                                value={smtpConfig.host}
                                onChange={e => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                                placeholder="smtp.gmail.com"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveSmtp}
                            disabled={savingSmtp || !smtpConfig.email || !smtpConfig.password}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                            data-testid="smtp-save-btn"
                        >
                            {savingSmtp ? 'Saving...' : 'Save Email Settings'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailComposer;
