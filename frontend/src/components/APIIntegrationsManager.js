import React, { useState, useEffect } from 'react';
import GroupMeManager from './GroupMeManager';

const APIIntegrationsManager = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [testResults, setTestResults] = useState({});

    // Form states
    const [groupMeForm, setGroupMeForm] = useState({
        display_name: 'GroupMe Integration',
        access_token: '',
        webhook_secret: ''
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/api-integrations`);
            const data = await response.json();
            setIntegrations(data.integrations || []);
        } catch (error) {
            console.error('Failed to load integrations:', error);
            setError('Failed to load API integrations');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroupMe = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('integration_name', 'groupme');
            formData.append('display_name', groupMeForm.display_name);
            formData.append('credentials', JSON.stringify({
                access_token: groupMeForm.access_token,
                webhook_secret: groupMeForm.webhook_secret || ''
            }));
            formData.append('settings', JSON.stringify({}));
            formData.append('is_active', 'true');

            const response = await fetch(`${backendUrl}/api/api-integrations`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                alert('GroupMe integration configured successfully!');
                setGroupMeForm({
                    display_name: 'GroupMe Integration',
                    access_token: '',
                    webhook_secret: ''
                });
                await loadIntegrations();
                setActiveView('dashboard');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create integration');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTestIntegration = async (integrationName) => {
        try {
            setTestResults({...testResults, [integrationName]: {loading: true}});
            
            const response = await fetch(`${backendUrl}/api/api-integrations/${integrationName}/test`, {
                method: 'POST'
            });
            
            const result = await response.json();
            setTestResults({
                ...testResults, 
                [integrationName]: {
                    loading: false,
                    success: result.success,
                    message: result.success 
                        ? `Connected! Found ${result.groups_count || 0} GroupMe groups` 
                        : result.error,
                    details: result.success ? result : null
                }
            });
        } catch (error) {
            setTestResults({
                ...testResults, 
                [integrationName]: {
                    loading: false,
                    success: false,
                    message: `Test failed: ${error.message}`
                }
            });
        }
    };

    const handleDeleteIntegration = async (integrationName) => {
        if (!confirm(`Are you sure you want to delete the ${integrationName} integration?`)) {
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/api-integrations/${integrationName}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Integration deleted successfully');
                await loadIntegrations();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete integration');
            }
        } catch (error) {
            alert(`Error deleting integration: ${error.message}`);
        }
    };

    const renderDashboard = () => {
        const groupmeIntegration = integrations.find(i => i.integration_name === 'groupme');
        
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">API Integrations</h2>
                    <button
                        onClick={() => setActiveView('create-groupme')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        disabled={groupmeIntegration && groupmeIntegration.is_active}
                    >
                        {groupmeIntegration ? 'Update GroupMe' : 'Configure GroupMe'}
                    </button>
                </div>

                {/* GroupMe Integration Status */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                                <span className="text-2xl">💬</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">GroupMe Integration</h3>
                                <p className="text-sm text-gray-600">Chat and RSVP management</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {groupmeIntegration && (
                                <>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        groupmeIntegration.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {groupmeIntegration.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <button
                                        onClick={() => handleTestIntegration('groupme')}
                                        disabled={testResults.groupme?.loading}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
                                    >
                                        {testResults.groupme?.loading ? 'Testing...' : 'Test Connection'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteIntegration('groupme')}
                                        className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Test Results */}
                    {testResults.groupme && (
                        <div className={`mt-4 p-3 rounded-lg ${
                            testResults.groupme.success 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                        }`}>
                            <div className="flex items-start">
                                <span className={`mr-2 ${
                                    testResults.groupme.success ? 'text-green-500' : 'text-red-500'
                                }`}>
                                    {testResults.groupme.success ? '✅' : '❌'}
                                </span>
                                <div>
                                    <p className={`text-sm font-medium ${
                                        testResults.groupme.success ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                        {testResults.groupme.success ? 'Connection Successful' : 'Connection Failed'}
                                    </p>
                                    <p className={`text-sm ${
                                        testResults.groupme.success ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                        {testResults.groupme.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Configuration Status */}
                    {!groupmeIntegration && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start">
                                <span className="text-yellow-500 mr-2">⚠️</span>
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">GroupMe Not Configured</p>
                                    <p className="text-sm text-yellow-700">Configure GroupMe integration to enable team chat and RSVP features.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Integration Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-blue-900 mb-3">Available Integrations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded p-4 border">
                            <div className="flex items-center mb-2">
                                <span className="text-xl mr-2">💬</span>
                                <h5 className="font-medium">GroupMe</h5>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">Team chat, event RSVPs, and automated notifications</p>
                            <div className="text-xs text-gray-500">
                                Status: {groupmeIntegration ? 'Configured' : 'Not configured'}
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded p-4 border border-dashed">
                            <div className="flex items-center mb-2">
                                <span className="text-xl mr-2 opacity-50">💳</span>
                                <h5 className="font-medium text-gray-500">Payment Processing</h5>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">Stripe, PayPal integration (coming soon)</p>
                            <div className="text-xs text-gray-400">
                                Status: Coming soon
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCreateGroupMe = () => (
        <div className="space-y-6">
            <div className="flex items-center">
                <button
                    onClick={() => setActiveView('dashboard')}
                    className="mr-4 text-gray-600 hover:text-gray-900"
                >
                    ← Back
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Configure GroupMe Integration</h2>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                {/* Instructions */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Setup Instructions</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                        <li>Go to <a href="https://dev.groupme.com/" target="_blank" rel="noopener noreferrer" className="underline">https://dev.groupme.com/</a></li>
                        <li>Sign in with your GroupMe account</li>
                        <li>Click "Create Application"</li>
                        <li>Fill in application details (name: "Lacrosse League Bot")</li>
                        <li>Copy your Access Token from the application page</li>
                        <li>Paste it below and save</li>
                    </ol>
                </div>

                <form onSubmit={handleCreateGroupMe} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={groupMeForm.display_name}
                            onChange={(e) => setGroupMeForm({...groupMeForm, display_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="GroupMe Integration"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            GroupMe Access Token *
                        </label>
                        <input
                            type="password"
                            value={groupMeForm.access_token}
                            onChange={(e) => setGroupMeForm({...groupMeForm, access_token: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Your GroupMe Access Token from dev.groupme.com"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This token will be encrypted and stored securely
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Webhook Secret (Optional)
                        </label>
                        <input
                            type="password"
                            value={groupMeForm.webhook_secret}
                            onChange={(e) => setGroupMeForm({...groupMeForm, webhook_secret: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Optional webhook secret for enhanced security"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Leave blank if you don't have a webhook secret configured
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setActiveView('dashboard')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Configuring...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderGroupMeChannels = () => {
        const groupmeIntegration = integrations.find(i => i.integration_name === 'groupme');
        
        if (!groupmeIntegration || !groupmeIntegration.is_active) {
            return (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">GroupMe Not Configured</h3>
                    <p className="text-gray-600 mb-4">You need to configure GroupMe integration first.</p>
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go to API Integrations
                    </button>
                </div>
            );
        }

        return (
            <div>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">GroupMe Channels</h2>
                    <p className="text-gray-600">Manage your GroupMe channel connections and settings.</p>
                </div>
                <GroupMeManager />
            </div>
        );
    };

    if (loading && integrations.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Navigation Tabs */}
            <div className="mb-8">
                <nav className="flex space-x-8">
                    {[
                        { id: 'dashboard', label: 'API Integrations' },
                        { id: 'groupme-channels', label: 'GroupMe Channels' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeView === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            {activeView === 'dashboard' && renderDashboard()}
            {activeView === 'create-groupme' && renderCreateGroupMe()}
            {activeView === 'groupme-channels' && renderGroupMeChannels()}
        </div>
    );
};

export default APIIntegrationsManager;