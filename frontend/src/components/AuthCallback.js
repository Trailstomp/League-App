import React, { useEffect, useRef, useState } from 'react';

/**
 * AuthCallback - Handles Google OAuth callback
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 * 
 * This component:
 * 1. Extracts session_id from URL fragment
 * 2. Exchanges it for user data via backend
 * 3. Stores session and redirects to dashboard
 */
const AuthCallback = ({ onLogin }) => {
    const hasProcessed = useRef(false);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(true);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        // Prevent double processing in StrictMode
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const processAuth = async () => {
            try {
                // Extract session_id from URL fragment
                const hash = window.location.hash;
                const sessionIdMatch = hash.match(/session_id=([^&]+)/);
                
                if (!sessionIdMatch) {
                    setError('No session ID found in callback URL');
                    setProcessing(false);
                    return;
                }

                const sessionId = sessionIdMatch[1];
                console.log('🔐 Processing OAuth callback with session_id');

                // Exchange session_id for user data
                const response = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
                    method: 'GET',
                    headers: {
                        'X-Session-ID': sessionId
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to exchange session token');
                }

                const userData = await response.json();
                console.log('✅ OAuth user data received:', userData.email);

                // Now create or update user in our backend
                const backendResponse = await fetch(`${backendUrl}/api/auth/google-login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        email: userData.email,
                        name: userData.name,
                        picture: userData.picture,
                        session_token: userData.session_token,
                        google_id: userData.id
                    })
                });

                if (!backendResponse.ok) {
                    const errorData = await backendResponse.json();
                    throw new Error(errorData.detail || 'Failed to authenticate with backend');
                }

                const loginData = await backendResponse.json();
                console.log('✅ Backend login successful');

                // Store session
                localStorage.setItem('authToken', loginData.session_token || userData.session_token);
                localStorage.setItem('currentUser', JSON.stringify(loginData.user));

                // Call onLogin callback if provided
                if (onLogin) {
                    onLogin(loginData.user);
                }

                // Clean URL and redirect to home
                window.history.replaceState({}, document.title, '/');
                window.location.href = '/';

            } catch (err) {
                console.error('❌ OAuth callback error:', err);
                setError(err.message);
                setProcessing(false);
            }
        };

        processAuth();
    }, [backendUrl, onLogin]);

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Failed</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    if (processing) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Signing you in...</h2>
                    <p className="text-gray-600">Please wait while we complete your authentication.</p>
                </div>
            </div>
        );
    }

    return null;
};

export default AuthCallback;
