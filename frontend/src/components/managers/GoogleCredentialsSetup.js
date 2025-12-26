import React, { useState, useEffect } from 'react';

const GoogleCredentialsSetup = () => {
    const [credentials, setCredentials] = useState({
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        folderId: ''
    });
    const [existingConfig, setExistingConfig] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [showSecret, setShowSecret] = useState(false);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        checkExistingConfig();
    }, []);

    const checkExistingConfig = async () => {
        try {
            console.log('🔍 Checking existing config...');
            const response = await fetch(`${backendUrl}/api/google-credentials/status`);
            const data = await response.json();
            
            console.log('📥 Config status:', data);
            
            if (data.configured) {
                setExistingConfig(data);
                setCredentials({
                    clientId: data.clientId || '',
                    clientSecret: '', // Don't display secret for security
                    refreshToken: '', // Don't display token for security
                    folderId: data.folderId || ''
                });
                setMessage('✅ Credentials already configured. Update them below if needed.');
            } else {
                setMessage('');
            }
        } catch (error) {
            console.error('Error checking config:', error);
            setMessage('⚠️ Could not load existing configuration');
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage('');

            // Validation
            if (!credentials.clientId || !credentials.clientSecret) {
                setMessage('❌ Client ID and Client Secret are required');
                setSaving(false);
                return;
            }
            
            // Note: refreshToken is optional - can be added later via OAuth Playground

            console.log('🔄 Saving credentials to:', `${backendUrl}/api/google-credentials/save`);
            console.log('📤 Payload:', { 
                clientId: credentials.clientId.substring(0, 20) + '...', 
                clientSecret: '***',
                folderId: credentials.folderId 
            });

            const response = await fetch(`${backendUrl}/api/google-credentials/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            console.log('📥 Response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Save successful:', result);
                setMessage('✅ Credentials saved! Click "Re-Authorization" button above to continue.');
                
                // Force reload the config
                setTimeout(async () => {
                    await checkExistingConfig();
                }, 500);
                
                // Keep message for longer
                setTimeout(() => {
                    setMessage('');
                }, 8000);
            } else {
                const error = await response.json();
                console.error('❌ Save failed:', error);
                setMessage(`❌ Failed to save: ${error.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error saving credentials:', error);
            setMessage(`❌ Error saving credentials: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    🔑 Google OAuth Credentials Setup
                </h2>
                <p className="text-gray-600">
                    Configure your Google Cloud OAuth credentials for Calendar, Gmail, and Drive integration
                </p>
            </div>

            {/* Status Card */}
            {existingConfig && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <span className="text-2xl mr-3">✅</span>
                        <div>
                            <h3 className="font-semibold text-green-800">Credentials Configured</h3>
                            <p className="text-sm text-green-600">
                                You can update the credentials below or proceed to Re-Authorization
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <span className="text-2xl mr-2">📋</span>
                    How to Get Your Credentials
                </h3>
                <ol className="list-decimal list-inside space-y-3 text-sm text-blue-800">
                    <li>
                        Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google Cloud Console</a>
                    </li>
                    <li>Select your project: <strong>"mlbl photo storage"</strong> (or your project name)</li>
                    <li>Navigate to: <strong>APIs & Services → Credentials</strong></li>
                    <li>Find your <strong>OAuth 2.0 Client ID</strong> in the list</li>
                    <li>Click on the client name to view details</li>
                    <li>Copy the <strong>Client ID</strong> (ends with .apps.googleusercontent.com)</li>
                    <li>Copy the <strong>Client Secret</strong> (starts with GOCSPX-)</li>
                    <li>Paste them below and save</li>
                </ol>
            </div>

            {/* Credentials Form */}
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">OAuth Credentials</h3>

                {/* Client ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client ID <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={credentials.clientId}
                        onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                        placeholder="xxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Found in Google Cloud Console → Credentials → OAuth 2.0 Client ID
                    </p>
                </div>

                {/* Client Secret */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client Secret <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showSecret ? "text" : "password"}
                            value={credentials.clientSecret}
                            onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                            placeholder={existingConfig ? "Enter new secret to update" : "GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm pr-24"
                        />
                        <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                        >
                            {showSecret ? '👁️ Hide' : '👁️ Show'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Found in the same location as Client ID
                    </p>
                </div>

                {/* Refresh Token (Manual Entry) */}
                <div className="border-t pt-6 mt-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">🔑 Manual Refresh Token Entry</h4>
                        <p className="text-sm text-yellow-800">
                            If you're having trouble with automatic authorization, you can get a refresh token from <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google OAuth Playground</a> and paste it here.
                        </p>
                    </div>
                    
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Refresh Token <span className="text-gray-400">(Optional - via OAuth Playground)</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showSecret ? "text" : "password"}
                            value={credentials.refreshToken}
                            onChange={(e) => setCredentials(prev => ({ ...prev, refreshToken: e.target.value }))}
                            placeholder="1//0abc123def456ghi789..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm pr-24"
                        />
                        <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                        >
                            {showSecret ? '👁️ Hide' : '👁️ Show'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Get this from OAuth Playground (see instructions below)
                    </p>
                </div>

                {/* Folder ID (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Drive Folder ID <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        value={credentials.folderId}
                        onChange={(e) => setCredentials(prev => ({ ...prev, folderId: e.target.value }))}
                        placeholder="1A2B3C4D5E6F7G8H9I0J..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        For photo storage: Right-click folder in Google Drive → Get link → Copy folder ID from URL
                    </p>
                </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
                    <span className="text-2xl mr-2">⚠️</span>
                    Important Security Notes
                </h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-yellow-800">
                    <li>Keep your Client Secret private - don't share it publicly</li>
                    <li>These credentials are stored securely in your database</li>
                    <li>After saving, you must complete Re-Authorization to get the refresh token</li>
                    <li>The refresh token allows your app to access Google services on your behalf</li>
                </ul>
            </div>

            {/* Required APIs */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                    <span className="text-2xl mr-2">🔧</span>
                    Make Sure These APIs Are Enabled
                </h3>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center text-purple-800">
                        <span className="mr-2">✓</span>
                        <span><strong>Google Drive API</strong> - For photo storage</span>
                    </div>
                    <div className="flex items-center text-purple-800">
                        <span className="mr-2">✓</span>
                        <span><strong>Google Calendar API</strong> - For event invites</span>
                    </div>
                    <div className="flex items-center text-purple-800">
                        <span className="mr-2">✓</span>
                        <span><strong>Gmail API</strong> - For email notifications</span>
                    </div>
                </div>
                <p className="text-xs text-purple-600 mt-3">
                    Enable these in: Google Cloud Console → APIs & Services → Library
                </p>
            </div>

            {/* OAuth Playground Instructions */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                    <span className="text-2xl mr-2">🎮</span>
                    How to Get Refresh Token (OAuth Playground)
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-purple-800">
                    <li>
                        Open: <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-blue-600">OAuth Playground</a> (in new tab)
                    </li>
                    <li>Click the <strong>⚙️ gear icon</strong> (top-right)</li>
                    <li>Check: <strong>"Use your own OAuth credentials"</strong></li>
                    <li>Paste your <strong>Client ID</strong> and <strong>Client Secret</strong> (from above)</li>
                    <li>Click <strong>"Close"</strong></li>
                    <li>On the left, select these scopes:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                            <li><code className="bg-white px-1 rounded">calendar.events</code> (Calendar API v3)</li>
                            <li><code className="bg-white px-1 rounded">gmail.send</code> (Gmail API v1)</li>
                            <li><code className="bg-white px-1 rounded">drive.file</code> (Drive API v3)</li>
                        </ul>
                    </li>
                    <li>Click <strong>"Authorize APIs"</strong> button</li>
                    <li>Sign in with <strong>admin@mlbl.org</strong></li>
                    <li>Click <strong>"Allow"</strong></li>
                    <li>Click <strong>"Exchange authorization code for tokens"</strong> button</li>
                    <li>Copy the <strong>"Refresh token"</strong> (starts with <code className="bg-white px-1 rounded">1//</code>)</li>
                    <li>Paste it in the field above and click Save!</li>
                </ol>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between">
                <div>
                    {message && (
                        <p className={`text-sm font-medium ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                            {message}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !credentials.clientId || !credentials.clientSecret}
                    className={`px-8 py-3 rounded-lg font-medium text-white transition ${
                        saving || !credentials.clientId || !credentials.clientSecret
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {saving ? 'Saving...' : '💾 Save Credentials'}
                </button>
            </div>

            {/* Next Steps */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                    <span className="text-2xl mr-2">🚀</span>
                    After Saving Credentials
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-green-800">
                    <li>Click "Save Credentials" button above</li>
                    <li>Go to <strong>Admin Portal → Google Re-Authorization</strong> tab</li>
                    <li>Click "Re-Authorize Google" button</li>
                    <li>Complete the Google authorization flow</li>
                    <li>Go to <strong>Admin Portal → Google Integration</strong> tab</li>
                    <li>Enable Calendar, Gmail, and/or GroupMe as desired</li>
                    <li>Test with an event!</li>
                </ol>
            </div>
        </div>
    );
};

export default GoogleCredentialsSetup;
