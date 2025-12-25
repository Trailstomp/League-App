import React, { useState, useEffect } from 'react';

const GoogleReauthorization = () => {
    const [status, setStatus] = useState('loading');
    const [config, setConfig] = useState(null);
    const [message, setMessage] = useState('');
    const [authUrl, setAuthUrl] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/google-reauth/status`);
            const data = await response.json();
            
            setConfig(data.config);
            setStatus(data.status);
            
            if (data.status === 'needs_reauth') {
                setMessage('⚠️ New scopes need authorization. Click the button below to re-authorize.');
            } else if (data.status === 'ready') {
                setMessage('✅ Google is fully configured with all required scopes!');
            } else {
                setMessage('❌ Google OAuth is not configured. Please set up credentials first.');
            }
        } catch (error) {
            console.error('Error checking status:', error);
            setStatus('error');
            setMessage('❌ Error checking Google configuration');
        }
    };

    const startReauthorization = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/google-reauth/start`);
            const data = await response.json();
            
            if (data.auth_url) {
                setAuthUrl(data.auth_url);
                // Open in new window
                window.open(data.auth_url, '_blank', 'width=600,height=800');
                setMessage('🔄 Authorization window opened. Complete the authorization and return here.');
                
                // Start polling for completion
                pollForCompletion();
            }
        } catch (error) {
            console.error('Error starting reauth:', error);
            setMessage('❌ Error starting authorization');
        }
    };

    const pollForCompletion = () => {
        const interval = setInterval(async () => {
            const response = await fetch(`${backendUrl}/api/google-reauth/status`);
            const data = await response.json();
            
            if (data.status === 'ready') {
                clearInterval(interval);
                setStatus('ready');
                setMessage('✅ Authorization complete! Google Calendar and Gmail are now active.');
            }
        }, 2000); // Check every 2 seconds
        
        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(interval), 300000);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    🔐 Google Re-Authorization
                </h2>
                <p className="text-gray-600">
                    Grant access to Google Calendar and Gmail for event notifications
                </p>
            </div>

            {/* Status Card */}
            <div className={`p-6 rounded-lg border-2 ${
                status === 'ready' 
                    ? 'bg-green-50 border-green-300' 
                    : status === 'needs_reauth'
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-red-50 border-red-300'
            }`}>
                <div className="flex items-start">
                    <div className="text-3xl mr-4">
                        {status === 'ready' ? '✅' : status === 'needs_reauth' ? '⚠️' : '❌'}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                            {status === 'ready' && 'Authorization Complete'}
                            {status === 'needs_reauth' && 'Authorization Required'}
                            {status === 'not_configured' && 'Not Configured'}
                            {status === 'error' && 'Error'}
                        </h3>
                        <p className="text-sm mb-4">{message}</p>
                        
                        {config && (
                            <div className="text-xs space-y-1 bg-white bg-opacity-50 p-3 rounded">
                                <p><strong>Client ID:</strong> {config.clientId?.substring(0, 20)}...</p>
                                <p><strong>Project:</strong> mlbl photo storage</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Required Scopes Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3">📋 Required Google Scopes:</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                        <span className="text-green-600 mr-2">✅</span>
                        <span className="text-blue-800"><code>drive.file</code> - Google Drive (already authorized)</span>
                    </div>
                    <div className="flex items-center">
                        <span className={status === 'ready' ? 'text-green-600' : 'text-gray-400'}>
                            {status === 'ready' ? '✅' : '⏳'}
                        </span>
                        <span className="ml-2 text-blue-800"><code>calendar.events</code> - Google Calendar (create events & invites)</span>
                    </div>
                    <div className="flex items-center">
                        <span className={status === 'ready' ? 'text-green-600' : 'text-gray-400'}>
                            {status === 'ready' ? '✅' : '⏳'}
                        </span>
                        <span className="ml-2 text-blue-800"><code>gmail.send</code> - Gmail (send notification emails)</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                {status === 'needs_reauth' && (
                    <button
                        onClick={startReauthorization}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                    >
                        🔓 Re-Authorize Google
                    </button>
                )}
                
                <button
                    onClick={checkStatus}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                    🔄 Refresh Status
                </button>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">📖 What happens when you click "Re-Authorize":</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>A new window opens with Google's authorization page</li>
                    <li>Sign in with <strong>admin@mlbl.org</strong> (if not already signed in)</li>
                    <li>Review the permissions requested (Drive, Calendar, Gmail)</li>
                    <li>Click <strong>"Allow"</strong> to grant access</li>
                    <li>The window closes and your new token is automatically saved</li>
                    <li>Calendar and Gmail features are immediately available!</li>
                </ol>
            </div>

            {/* Security Note */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start">
                    <span className="text-2xl mr-3">🔒</span>
                    <div>
                        <h4 className="font-semibold text-purple-900 mb-1">Security Note</h4>
                        <p className="text-sm text-purple-800">
                            Your existing Google Drive authorization will remain active. This process only adds Calendar and Gmail permissions to the same credentials. Your refresh token is securely stored in your database.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleReauthorization;
