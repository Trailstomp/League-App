import React, { useState, useEffect } from 'react';

const PasswordResetPage = ({ onComplete }) => {
    const [token, setToken] = useState('');
    const [validating, setValidating] = useState(true);
    const [tokenInfo, setTokenInfo] = useState(null);
    const [error, setError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        
        if (tokenParam) {
            setToken(tokenParam);
            validateToken(tokenParam);
        } else {
            setValidating(false);
            setError('No reset token provided');
        }
    }, []);

    const validateToken = async (token) => {
        try {
            const response = await fetch(`${backendUrl}/api/password-reset/validate/${token}`);
            const data = await response.json();
            
            if (response.ok) {
                setTokenInfo(data);
            } else {
                setError(data.detail || 'Invalid or expired token');
            }
        } catch (err) {
            setError('Error validating token. Please try again.');
        } finally {
            setValidating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(`${backendUrl}/api/password-reset/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
            } else {
                setError(data.detail || 'Failed to set password');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (validating) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Validating your link...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Set!</h1>
                    <p className="text-gray-600 mb-6">
                        Your password has been set successfully. You can now log in with your new password.
                    </p>
                    <button
                        onClick={() => {
                            // Clear URL params and navigate to home
                            window.history.replaceState({}, document.title, '/');
                            if (onComplete) onComplete();
                            window.location.href = '/';
                        }}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (!tokenInfo) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Link</h1>
                    <p className="text-gray-600 mb-6">{error || 'This password reset link is invalid or has expired.'}</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-2">🔐</div>
                    <h1 className="text-2xl font-bold text-gray-800">Set Your Password</h1>
                    <p className="text-gray-600">Welcome, {tokenInfo.name}!</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={tokenInfo.email}
                            disabled
                            className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
                            submitting 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                                Setting Password...
                            </span>
                        ) : (
                            'Set Password & Continue'
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-500 mt-6">
                    By setting your password, you agree to the terms and conditions.
                </p>
            </div>
        </div>
    );
};

export default PasswordResetPage;
