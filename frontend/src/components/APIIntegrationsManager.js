import React, { useState, useEffect } from 'react';

const APIIntegrationsManager = () => {
    const [integrations, setIntegrations] = useState({
        groupme: { enabled: false, apiKey: '', botId: '' },
        twilio: { enabled: false, accountSid: '', authToken: '', phoneNumber: '' },
        stripe: { enabled: false, publishableKey: '', secretKey: '' },
        mailgun: { enabled: false, apiKey: '', domain: '' },
        slack: { enabled: false, webhookUrl: '', botToken: '' }
    });
    const [activeTab, setActiveTab] = useState('groupme');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/integrations`);
            if (response.ok) {
                const data = await response.json();
                setIntegrations(data);
            }
        } catch (error) {
            console.error('Error loading integrations:', error);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setMessage('');

            const response = await fetch(`${backendUrl}/api/integrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(integrations)
            });

            if (response.ok) {
                setMessage('✅ Integrations saved successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('❌ Failed to save integrations');
            }
        } catch (error) {
            setMessage('❌ Error saving integrations');
        } finally {
            setLoading(false);
        }
    };

    const handleIntegrationChange = (integration, field, value) => {
        setIntegrations(prev => ({
            ...prev,
            [integration]: {
                ...prev[integration],
                [field]: value
            }
        }));
    };

    const integrationsList = [
        { id: 'groupme', name: 'GroupMe', icon: '💬', description: 'Team communication and polls' },
        { id: 'twilio', name: 'Twilio', icon: '📱', description: 'SMS notifications and reminders' },
        { id: 'stripe', name: 'Stripe', icon: '💳', description: 'Payment processing for fees' },
        { id: 'mailgun', name: 'Mailgun', icon: '📧', description: 'Email delivery service' },
        { id: 'slack', name: 'Slack', icon: '💬', description: 'Team workspace integration' }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">API Integrations</h2>
                    <p className="text-slate-600 mt-1">Configure third-party service integrations</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : '💾 Save All'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${
                    message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-5 gap-2 mb-6">
                {integrationsList.map(int => (
                    <button
                        key={int.id}
                        onClick={() => setActiveTab(int.id)}
                        className={`p-4 rounded-lg text-center transition ${
                            activeTab === int.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                        }`}
                    >
                        <div className="text-2xl mb-1">{int.icon}</div>
                        <div className="text-sm font-medium">{int.name}</div>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
                {activeTab === 'groupme' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">GroupMe Configuration</h3>
                        <p className="text-sm text-gray-600">Configure GroupMe for team communication</p>
                        <div>
                            <label className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    checked={integrations.groupme.enabled}
                                    onChange={(e) => handleIntegrationChange('groupme', 'enabled', e.target.checked)}
                                    className="rounded"
                                />
                                <span className="font-medium">Enable GroupMe Integration</span>
                            </label>
                        </div>
                        {integrations.groupme.enabled && (
                            <div className="space-y-3 pl-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">API Key</label>
                                    <input
                                        type="text"
                                        value={integrations.groupme.apiKey}
                                        onChange={(e) => handleIntegrationChange('groupme', 'apiKey', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="Enter GroupMe API key"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bot ID</label>
                                    <input
                                        type="text"
                                        value={integrations.groupme.botId}
                                        onChange={(e) => handleIntegrationChange('groupme', 'botId', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="Enter Bot ID"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Add similar blocks for other integrations */}
                {activeTab !== 'groupme' && (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-2">{integrationsList.find(i => i.id === activeTab)?.icon}</div>
                        <h3 className="text-lg font-medium mb-1">{integrationsList.find(i => i.id === activeTab)?.name}</h3>
                        <p className="text-sm">{integrationsList.find(i => i.id === activeTab)?.description}</p>
                        <p className="text-xs mt-4">Configuration coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default APIIntegrationsManager;
