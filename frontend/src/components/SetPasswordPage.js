import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';

const SetPasswordPage = ({ token, onComplete }) => {
    const [tokenData, setTokenData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    useEffect(() => {
        validateToken();
    }, [token]);
    
    const validateToken = async () => {
        try {
            const res = await fetch(`${backendUrl}/api/join-us/set-password/${token}`);
            if (res.ok) {
                const data = await res.json();
                setTokenData(data);
            } else {
                setError('This link is invalid or has already been used.');
            }
        } catch (e) {
            setError('Unable to validate link. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirm) { setError('Passwords do not match'); return; }
        
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`${backendUrl}/api/join-us/set-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
            } else {
                setError(data.detail || 'Failed to set password');
            }
        } catch (e) {
            setError('An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }
    
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">You're All Set!</h2>
                    <p className="text-slate-600 mb-4">
                        Your password has been created. You can now log in with your email and password.
                    </p>
                    <button onClick={() => onComplete ? onComplete() : window.location.href = '/'} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <Shield className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-slate-800">Set Your Password</h2>
                    {tokenData && (
                        <div className="mt-2 text-sm text-slate-600">
                            <p>Welcome, <strong>{tokenData.name}</strong>!</p>
                            <p>You've been approved as <strong>{tokenData.role}</strong>
                                {tokenData.teamName && <> for <strong>{tokenData.teamName}</strong></>}
                            </p>
                        </div>
                    )}
                </div>
                
                {error && (
                    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
                )}
                
                {tokenData ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Create Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg pr-10"
                                    required
                                    data-testid="set-password-input"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                placeholder="Re-enter password"
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg"
                                required
                                data-testid="set-password-confirm"
                            />
                        </div>
                        <button type="submit" disabled={saving} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50" data-testid="set-password-submit">
                            {saving ? 'Setting Password...' : 'Set Password & Activate Account'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center text-slate-500">
                        <p>{error || 'Invalid link'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SetPasswordPage;
