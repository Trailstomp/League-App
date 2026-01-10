import React, { useState, useEffect } from 'react';

/**
 * HealthAlertSettings - Configure email alerts for database health issues
 */
const HealthAlertSettings = () => {
    const [settings, setSettings] = useState({
        enabled: false,
        recipient_emails: [],
        orphaned_threshold: 5,
        pending_users_threshold: 10,
        legacy_players_threshold: 5
    });
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState('');
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/cleanup/health-alerts/settings`);
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage('❌ Error loading settings');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            setMessage('');
            
            const response = await fetch(`${backendUrl}/api/cleanup/health-alerts/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            
            if (response.ok) {
                setMessage('✅ Settings saved successfully');
            } else {
                setMessage('❌ Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage('❌ Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const sendTestAlert = async () => {
        if (settings.recipient_emails.length === 0) {
            setMessage('❌ Please add at least one recipient email first');
            return;
        }
        
        try {
            setTesting(true);
            setMessage('');
            
            const response = await fetch(`${backendUrl}/api/cleanup/health-alerts/test`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.status === 'sent') {
                setMessage(`✅ Test alert sent to ${data.recipients.join(', ')}`);
            } else if (data.status === 'error') {
                setMessage(`❌ ${data.message}`);
            } else {
                setMessage(`⚠️ ${data.message}`);
            }
        } catch (error) {
            console.error('Error sending test:', error);
            setMessage('❌ Error sending test alert');
        } finally {
            setTesting(false);
        }
    };

    const addEmail = () => {
        const email = newEmail.trim().toLowerCase();
        if (email && !settings.recipient_emails.includes(email)) {
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setSettings({
                    ...settings,
                    recipient_emails: [...settings.recipient_emails, email]
                });
                setNewEmail('');
            } else {
                setMessage('❌ Please enter a valid email address');
            }
        }
    };

    const removeEmail = (emailToRemove) => {
        setSettings({
            ...settings,
            recipient_emails: settings.recipient_emails.filter(e => e !== emailToRemove)
        });
    };

    if (loading) {
        return (
            <div className="bg-white border rounded-lg p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-10 bg-slate-200 rounded"></div>
                        <div className="h-10 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Health Alert Notifications</h3>
                        <p className="text-sm text-slate-600">Get email alerts when database issues exceed thresholds</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                        <div className="font-medium text-slate-800">Enable Health Alerts</div>
                        <div className="text-sm text-slate-600">Send email notifications when thresholds are exceeded</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Recipient Emails */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Recipient Email Addresses
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                            placeholder="admin@example.com"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            onClick={addEmail}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                    
                    {settings.recipient_emails.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {settings.recipient_emails.map((email, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                >
                                    {email}
                                    <button
                                        onClick={() => removeEmail(email)}
                                        className="ml-1 hover:text-blue-600"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">No recipients added yet</p>
                    )}
                </div>

                {/* Thresholds */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        Alert Thresholds
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Orphaned Records</label>
                            <input
                                type="number"
                                min="1"
                                value={settings.orphaned_threshold}
                                onChange={(e) => setSettings({ ...settings, orphaned_threshold: parseInt(e.target.value) || 5 })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                            <p className="text-xs text-slate-500 mt-1">Alert if ≥ this many orphaned records</p>
                        </div>
                        
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Pending Users</label>
                            <input
                                type="number"
                                min="1"
                                value={settings.pending_users_threshold}
                                onChange={(e) => setSettings({ ...settings, pending_users_threshold: parseInt(e.target.value) || 10 })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                            <p className="text-xs text-slate-500 mt-1">Alert if ≥ this many pending approvals</p>
                        </div>
                        
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Legacy Players</label>
                            <input
                                type="number"
                                min="1"
                                value={settings.legacy_players_threshold}
                                onChange={(e) => setSettings({ ...settings, legacy_players_threshold: parseInt(e.target.value) || 5 })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                            <p className="text-xs text-slate-500 mt-1">Alert if ≥ this many legacy records</p>
                        </div>
                    </div>
                </div>

                {/* Last Alert Info */}
                {settings.last_alert_sent && (
                    <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                        <span className="font-medium">Last alert sent:</span> {new Date(settings.last_alert_sent).toLocaleString()}
                    </div>
                )}

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-lg ${
                        message.includes('✅') ? 'bg-green-50 text-green-800' : 
                        message.includes('⚠️') ? 'bg-yellow-50 text-yellow-800' : 
                        'bg-red-50 text-red-800'
                    }`}>
                        {message}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? '⏳ Saving...' : '💾 Save Settings'}
                    </button>
                    
                    <button
                        onClick={sendTestAlert}
                        disabled={testing || settings.recipient_emails.length === 0}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                    >
                        {testing ? '⏳ Sending...' : '📧 Send Test Alert'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HealthAlertSettings;
