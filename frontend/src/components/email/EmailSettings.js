import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Trash2, TestTube, CheckCircle, XCircle, Mail, Eye, EyeOff, Info } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const PROVIDERS = {
    gmail: { name: 'Gmail', icon: '📧', color: '#EA4335' },
    office365: { name: 'Office 365', icon: '📬', color: '#0078D4' },
    custom: { name: 'Custom SMTP/IMAP', icon: '⚙️', color: '#6B7280' }
};

const EmailSettings = ({ currentUser, accounts = [], onBack, onSaved }) => {
    const [presets, setPresets] = useState({});
    const [editing, setEditing] = useState(null); // null = list, 'new' = new account, or account id
    const [form, setForm] = useState({
        provider: 'gmail', email: '', password: '', display_name: '',
        imap_host: '', imap_port: 993, smtp_host: '', smtp_port: 587,
        use_ssl: true, use_tls: true
    });
    const [showPassword, setShowPassword] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`${BACKEND_URL}/api/email-client/providers`)
            .then(r => r.json())
            .then(d => setPresets(d.providers || {}))
            .catch(() => {});
    }, []);

    const handleProviderChange = (provider) => {
        const preset = presets[provider] || {};
        setForm(prev => ({
            ...prev,
            provider,
            imap_host: preset.imap_host || '',
            imap_port: preset.imap_port || 993,
            smtp_host: preset.smtp_host || '',
            smtp_port: preset.smtp_port || 587,
            use_ssl: preset.use_ssl ?? true,
            use_tls: preset.use_tls ?? true
        }));
    };

    const startNewAccount = (provider) => {
        handleProviderChange(provider);
        setForm(prev => ({ ...prev, provider, email: '', password: '', display_name: '' }));
        setEditing('new');
        setTestResult(null);
        setError('');
    };

    const startEditAccount = (account) => {
        setForm({
            provider: account.provider || 'custom',
            email: account.email || '',
            password: '', // Don't pre-fill password
            display_name: account.display_name || '',
            imap_host: account.imap_host || '',
            imap_port: account.imap_port || 993,
            smtp_host: account.smtp_host || '',
            smtp_port: account.smtp_port || 587,
            use_ssl: account.use_ssl ?? true,
            use_tls: account.use_tls ?? true
        });
        setEditing(account.id);
        setTestResult(null);
        setError('');
    };

    const handleTest = async () => {
        if (!form.email || !form.password) {
            setError('Email and password are required to test');
            return;
        }
        setTesting(true);
        setTestResult(null);
        try {
            // Save first if new, then test
            let accountId = editing;
            if (editing === 'new') {
                const saveRes = await fetch(`${BACKEND_URL}/api/email-client/accounts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...form, user_id: currentUser.id })
                });
                const saveData = await saveRes.json();
                if (saveData.account) {
                    accountId = saveData.account.id;
                    setEditing(accountId);
                }
            } else {
                // Update existing
                await fetch(`${BACKEND_URL}/api/email-client/accounts/${accountId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
            }
            
            const res = await fetch(`${BACKEND_URL}/api/email-client/accounts/${accountId}/test`, { method: 'POST' });
            const data = await res.json();
            setTestResult(data);
        } catch (e) {
            setTestResult({ imap: false, smtp: false, imap_error: e.message, smtp_error: e.message });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!form.email) { setError('Email is required'); return; }
        setSaving(true);
        setError('');
        try {
            if (editing === 'new') {
                if (!form.password) { setError('Password is required for new accounts'); setSaving(false); return; }
                const res = await fetch(`${BACKEND_URL}/api/email-client/accounts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...form, user_id: currentUser.id })
                });
                if (!res.ok) throw new Error('Failed to save');
            } else {
                const res = await fetch(`${BACKEND_URL}/api/email-client/accounts/${editing}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
                if (!res.ok) throw new Error('Failed to update');
            }
            onSaved();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (accountId) => {
        if (!window.confirm('Delete this email account? This only removes it from the app, not your actual email account.')) return;
        try {
            await fetch(`${BACKEND_URL}/api/email-client/accounts/${accountId}`, { method: 'DELETE' });
            onSaved();
        } catch (e) {
            console.error('Error deleting account:', e);
        }
    };

    const providerInstructions = presets[form.provider]?.instructions || '';

    // ─── ACCOUNT FORM ───
    if (editing) {
        return (
            <div className="max-w-2xl mx-auto p-4">
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3 px-6 py-4 border-b">
                        <button onClick={() => setEditing(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
                        <h2 className="text-lg font-bold text-gray-800">{editing === 'new' ? 'Add Email Account' : 'Edit Email Account'}</h2>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Provider selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Provider</label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(PROVIDERS).map(([key, p]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleProviderChange(key)}
                                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${form.provider === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <span className="text-2xl mb-1">{p.icon}</span>
                                        <span className="text-xs font-medium">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Instructions */}
                        {providerInstructions && (
                            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                                <Info size={16} className="flex-shrink-0 mt-0.5" />
                                <p>{providerInstructions}</p>
                            </div>
                        )}

                        {/* Basic fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="you@example.com" data-testid="email-input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                <input type="text" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Your Name" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password / App Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm pr-10"
                                    placeholder={editing !== 'new' ? '(leave blank to keep current)' : 'App password or email password'}
                                    data-testid="password-input"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Server settings (expanded for custom) */}
                        {form.provider === 'custom' && (
                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-sm font-semibold text-gray-700">Server Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">IMAP Host</label>
                                        <input type="text" value={form.imap_host} onChange={e => setForm(f => ({ ...f, imap_host: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="imap.example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">IMAP Port</label>
                                        <input type="number" value={form.imap_port} onChange={e => setForm(f => ({ ...f, imap_port: parseInt(e.target.value) }))}
                                            className="w-full px-3 py-2 border rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">SMTP Host</label>
                                        <input type="text" value={form.smtp_host} onChange={e => setForm(f => ({ ...f, smtp_host: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="smtp.example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">SMTP Port</label>
                                        <input type="number" value={form.smtp_port} onChange={e => setForm(f => ({ ...f, smtp_port: parseInt(e.target.value) }))}
                                            className="w-full px-3 py-2 border rounded-lg text-sm" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={form.use_ssl} onChange={e => setForm(f => ({ ...f, use_ssl: e.target.checked }))} />
                                        SSL (IMAP)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={form.use_tls} onChange={e => setForm(f => ({ ...f, use_tls: e.target.checked }))} />
                                        TLS (SMTP)
                                    </label>
                                </div>
                            </div>
                        )}

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        {/* Test results */}
                        {testResult && (
                            <div className="p-3 rounded-lg border space-y-2">
                                <div className="flex items-center gap-2">
                                    {testResult.imap ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                                    <span className="text-sm">IMAP (Receiving): {testResult.imap ? 'Connected' : testResult.imap_error || 'Failed'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {testResult.smtp ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                                    <span className="text-sm">SMTP (Sending): {testResult.smtp ? 'Connected' : testResult.smtp_error || 'Failed'}</span>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 pt-2">
                            <button onClick={handleTest} disabled={testing} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1.5">
                                {testing ? <span className="animate-spin">⏳</span> : <TestTube size={16} />}
                                Test Connection
                            </button>
                            <button onClick={handleSave} disabled={saving} data-testid="save-email-account" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Account'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── ACCOUNTS LIST ───
    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
                        <h2 className="text-lg font-bold text-gray-800">Email Settings</h2>
                    </div>
                </div>

                <div className="p-6">
                    {/* Existing accounts */}
                    {accounts.length > 0 && (
                        <div className="space-y-3 mb-6">
                            <h3 className="text-sm font-semibold text-gray-700">Your Email Accounts</h3>
                            {accounts.map(acc => (
                                <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{PROVIDERS[acc.provider]?.icon || '📧'}</span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{acc.email}</p>
                                            <p className="text-xs text-gray-500">{PROVIDERS[acc.provider]?.name || 'Custom'} {acc.display_name && `- ${acc.display_name}`}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => startEditAccount(acc)} className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">Edit</button>
                                        <button onClick={() => handleDelete(acc.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add new account */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Email Account</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {Object.entries(PROVIDERS).map(([key, p]) => (
                                <button
                                    key={key}
                                    onClick={() => startNewAccount(key)}
                                    data-testid={`add-${key}-btn`}
                                    className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                >
                                    <span className="text-3xl mb-2">{p.icon}</span>
                                    <span className="text-sm font-medium text-gray-700">{p.name}</span>
                                    <Plus size={14} className="mt-1 text-gray-400" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Setup Instructions */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Setup Instructions</h4>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div>
                                <strong>Gmail:</strong> Enable 2-Step Verification, then go to{' '}
                                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                    Google App Passwords
                                </a>
                                {' '}to generate an App Password. Use that instead of your regular password.
                            </div>
                            <div>
                                <strong>Office 365:</strong> Use your email and password. If MFA is enabled, create an App Password in your{' '}
                                <a href="https://account.live.com/proofs/AppPassword" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                    Microsoft security settings
                                </a>.
                            </div>
                            <div>
                                <strong>Custom SMTP/IMAP:</strong> Enter your mail server details. Contact your email provider for IMAP/SMTP host and port information.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailSettings;
