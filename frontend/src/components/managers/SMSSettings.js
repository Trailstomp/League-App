import React, { useState, useEffect } from 'react';

const SMSSettings = () => {
    const [config, setConfig] = useState({
        enabled: false,
        account_sid: '',
        auth_token: '',
        phone_number: '',
        production_domain: '',
        event_reminder_template: '📅 Reminder: {event_title} on {event_date} at {event_time}. Location: {location}. RSVP: {rsvp_link}',
        rsvp_confirmation_template: '✅ Your RSVP for {event_title} has been recorded as: {response}',
        custom_template: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [message, setMessage] = useState(null);
    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(null);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Generate webhook URLs based on production domain
    const getWebhookUrls = () => {
        const domain = config.production_domain?.trim();
        if (!domain) return null;
        
        // Ensure domain has https:// prefix
        let baseUrl = domain;
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
            baseUrl = 'https://' + baseUrl;
        }
        // Remove trailing slash
        baseUrl = baseUrl.replace(/\/$/, '');
        
        return {
            webhook: `${baseUrl}/api/sms/webhook`,
            fallback: `${baseUrl}/api/sms/webhook/fallback`,
            status: `${baseUrl}/api/sms/status`
        };
    };

    const webhookUrls = getWebhookUrls();

    const copyToClipboard = (url, name) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(name);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/sms-config`);
            if (response.ok) {
                const data = await response.json();
                setConfig({
                    enabled: data.enabled || false,
                    account_sid: data.account_sid || '',
                    auth_token: '', // Don't show actual token
                    auth_token_configured: data.auth_token_configured || false,
                    auth_token_masked: data.auth_token_masked || '',
                    phone_number: data.phone_number || '',
                    event_reminder_template: data.event_reminder_template || config.event_reminder_template,
                    rsvp_confirmation_template: data.rsvp_confirmation_template || config.rsvp_confirmation_template,
                    custom_template: data.custom_template || ''
                });
            }
        } catch (error) {
            console.error('Error loading SMS config:', error);
            setMessage({ type: 'error', text: 'Failed to load SMS configuration' });
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/sms-logs?limit=20`);
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Error loading SMS logs:', error);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage(null);

            const response = await fetch(`${backendUrl}/api/sms-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'SMS configuration saved successfully!' });
                loadConfig(); // Reload to get masked token
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to save configuration' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error saving configuration' });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!testPhone) {
            setMessage({ type: 'error', text: 'Please enter a test phone number' });
            return;
        }

        try {
            setTesting(true);
            setMessage(null);

            // Format phone number
            let formattedPhone = testPhone.trim();
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+1' + formattedPhone.replace(/[-\s()]/g, '');
            }

            const response = await fetch(`${backendUrl}/api/sms-config/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to_number: formattedPhone })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: `Test SMS sent successfully to ${formattedPhone}!` });
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.detail || 'Test failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error sending test SMS' });
        } finally {
            setTesting(false);
        }
    };

    const handleInputChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading SMS settings...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        📱 SMS Notifications
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Configure Twilio SMS to send event reminders and notifications to players
                    </p>
                </div>
                <button
                    onClick={() => { setShowLogs(!showLogs); if (!showLogs) loadLogs(); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                    {showLogs ? '📋 Hide Logs' : '📋 View Logs'}
                </button>
            </div>

            {/* Status Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Enable Toggle */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Enable SMS Notifications</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Turn on to allow sending SMS messages via Twilio
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => handleInputChange('enabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            {/* Twilio Credentials */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    🔐 Twilio Credentials
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Get your credentials from the <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Twilio Console</a>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account SID
                        </label>
                        <input
                            type="text"
                            value={config.account_sid}
                            onChange={(e) => handleInputChange('account_sid', e.target.value)}
                            placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Auth Token
                            {config.auth_token_configured && (
                                <span className="ml-2 text-green-600 text-xs">✓ Configured ({config.auth_token_masked})</span>
                            )}
                        </label>
                        <input
                            type="password"
                            value={config.auth_token}
                            onChange={(e) => handleInputChange('auth_token', e.target.value)}
                            placeholder={config.auth_token_configured ? "Leave empty to keep existing" : "Enter Auth Token"}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Twilio Phone Number
                        </label>
                        <input
                            type="text"
                            value={config.phone_number}
                            onChange={(e) => handleInputChange('phone_number', e.target.value)}
                            placeholder="+1234567890"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This is the Twilio phone number that will appear as the sender
                        </p>
                    </div>
                </div>
            </div>

            {/* Message Templates */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    📝 Message Templates
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Customize your SMS templates. Available variables: <code className="bg-gray-100 px-1 rounded">{'{event_title}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{event_date}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{event_time}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{location}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{rsvp_link}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{response}'}</code>
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Reminder Template
                        </label>
                        <textarea
                            value={config.event_reminder_template}
                            onChange={(e) => handleInputChange('event_reminder_template', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Character count: {config.event_reminder_template.length}/160 (SMS limit)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            RSVP Confirmation Template
                        </label>
                        <textarea
                            value={config.rsvp_confirmation_template}
                            onChange={(e) => handleInputChange('rsvp_confirmation_template', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Custom Template (Optional)
                        </label>
                        <textarea
                            value={config.custom_template}
                            onChange={(e) => handleInputChange('custom_template', e.target.value)}
                            rows={3}
                            placeholder="Use this for custom messages"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Test SMS */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    🧪 Test SMS
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Send a test message to verify your configuration is working
                </p>

                <div className="flex gap-4">
                    <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="+1234567890 or 1234567890"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleTest}
                        disabled={testing || !config.account_sid}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {testing ? '⏳ Sending...' : '📤 Send Test'}
                    </button>
                </div>
            </div>

            {/* SMS Logs */}
            {showLogs && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        📋 Recent SMS Logs
                    </h3>
                    
                    {logs.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No SMS logs yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Recipients</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {logs.map((log, index) => (
                                        <tr key={log.id || index} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">
                                                {new Date(log.sent_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2">
                                                {log.notification_type || 'Custom'}
                                            </td>
                                            <td className="px-4 py-2">
                                                {log.recipients || 0}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded text-xs ${log.failed > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                    {log.sent || 0} sent, {log.failed || 0} failed
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                    {saving ? '⏳ Saving...' : '💾 Save Configuration'}
                </button>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">💡 Getting Started with Twilio</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Sign up for a free <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="underline">Twilio account</a></li>
                    <li>Get your Account SID and Auth Token from the <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="underline">Twilio Console</a></li>
                    <li>Purchase or use a trial Twilio phone number</li>
                    <li>Enter your credentials above and test the integration</li>
                </ol>
            </div>
        </div>
    );
};

export default SMSSettings;
