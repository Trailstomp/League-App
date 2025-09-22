import React, { useEffect, useState } from 'react';

// OAuth Callback Handler - Extracts authorization code from URL
const OAuthCallback = ({ onCodeReceived }) => {
    const [authCode, setAuthCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if we're in an OAuth callback by looking for 'code' or 'error' in URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (code) {
            console.log('🔑 OAuth authorization code received:', code);
            setAuthCode(code);
            if (onCodeReceived) {
                onCodeReceived(code);
            }
        } else if (error) {
            console.error('🚨 OAuth error:', error, errorDescription);
            setError(`OAuth Error: ${error} - ${errorDescription || 'Unknown error'}`);
        }
    }, [onCodeReceived]);

    // If we have an auth code, display it prominently
    if (authCode) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="text-green-600 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">
                            🎉 Authorization Successful!
                        </h2>
                        
                        <p className="text-slate-600 mb-6">
                            Copy this authorization code and paste it into the Google Drive setup form:
                        </p>
                        
                        <div className="bg-slate-50 border-2 border-green-500 rounded-lg p-4 mb-6">
                            <div className="text-xs text-slate-500 mb-2">Authorization Code:</div>
                            <div className="text-sm font-mono bg-white p-3 rounded border break-all">
                                {authCode}
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(authCode);
                                    alert('Authorization code copied to clipboard!');
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                📋 Copy Code
                            </button>
                            
                            <button
                                onClick={() => window.close()}
                                className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                            >
                                ✅ Close Window
                            </button>
                        </div>
                        
                        <p className="text-xs text-slate-500 mt-4">
                            Return to the main window and paste this code to complete the setup.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // If we have an error, display it
    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="text-red-600 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">
                            Authorization Failed
                        </h2>
                        
                        <p className="text-slate-600 mb-6">
                            {error}
                        </p>
                        
                        <button
                            onClick={() => window.close()}
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                        >
                            Close Window
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default state - checking for OAuth parameters
    return null;
};

export default OAuthCallback;