import React, { useState } from 'react';
import { LacrosseIcon } from './LacrosseIcons';

// X Icon for close button
const X = ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

// Initial Mock Users from App.full.js
const initialMockUsers = [
    { id: 1, name: 'Admin Ali', roleIds: ['super_admin'], teamId: null, email: 'admin@mlbl.org', role: 'admin', roles: ['admin'], status: 'active', createdAt: '2024-01-01' },
    { id: 2, name: 'Coach Chandler (OH10)', roleIds: ['team_coach'], teamId: 'oh10-lacrosse', email: 'cschrudder23@gmail.com', roles: ['coach'], status: 'active', createdAt: '2024-01-15' },
    { id: 3, name: 'Player Pat (Dayton)', roleIds: ['player'], teamId: 'dayton-eagles', email: 'pat@test.com', roles: ['player'], status: 'active', createdAt: '2024-02-01' },
    { id: 4, name: 'Coach Dave (Dads)', roleIds: ['team_coach'], teamId: 'american-dads', email: 'dave@test.com', roles: ['coach'], status: 'active', createdAt: '2024-02-15' },
    // Pending users (for testing)
    { id: 5, name: 'New Player John', roleIds: [], teamId: 'indiana-lacers', email: 'john.new@test.com', roles: [], status: 'pending', createdAt: '2025-06-15', preferredRole: 'player', phone: '555-1234', reasonForJoining: 'Want to join the league and play competitive lacrosse' },
    { id: 6, name: 'Sarah Coach', roleIds: [], teamId: 'columbus-ball-hawgs', email: 'sarah.coach@test.com', roles: [], status: 'pending', createdAt: '2025-06-20', preferredRole: 'coach', phone: '555-5678', reasonForJoining: 'Experienced player looking to coach and help develop the team' },
];

// Login Form Component
const LoginForm = ({ users, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resetMode, setResetMode] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1: enter email, 2: enter code, 3: new password
    const [resetMethod, setResetMethod] = useState('email');
    const [resetToken, setResetToken] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        try {
            setLoading(true);

            // Call the API login endpoint
            const response = await fetch(`${backendUrl}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                onLogin(data.user);
                setEmail('');
                setPassword('');
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        
        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/password-reset/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, method: resetMethod })
            });

            const data = await response.json();
            
            if (response.ok) {
                setResetToken(data.token);
                setResetStep(2);
                setSuccessMessage(`Reset code sent via ${resetMethod}. Check your ${resetMethod === 'sms' ? 'phone' : 'inbox'}.`);
            } else {
                setError(data.detail || 'Failed to send reset code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        
        if (!resetCode || resetCode.length !== 6) {
            setError('Please enter the 6-digit code.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/password-reset/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetToken, code: resetCode })
            });

            const data = await response.json();
            
            if (response.ok) {
                setResetStep(3);
                setSuccessMessage('Code verified! Enter your new password.');
            } else {
                setError(data.detail || 'Invalid code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteReset = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/password-reset/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetToken, code: resetCode, newPassword })
            });

            const data = await response.json();
            
            if (response.ok) {
                setSuccessMessage('Password reset successful! You can now log in.');
                // Reset all states and go back to login
                setTimeout(() => {
                    setResetMode(false);
                    setResetStep(1);
                    setResetToken('');
                    setResetCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setSuccessMessage('');
                }, 2000);
            } else {
                setError(data.detail || 'Failed to reset password');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const cancelReset = () => {
        setResetMode(false);
        setResetStep(1);
        setResetToken('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccessMessage('');
    };

    // Password Reset Flow
    if (resetMode) {
        return (
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">Reset Password</h3>
                
                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">{successMessage}</p>
                    </div>
                )}
                
                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Step 1: Enter Email */}
                {resetStep === 1 && (
                    <form onSubmit={handleRequestReset}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Send code via</label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="resetMethod"
                                        value="email"
                                        checked={resetMethod === 'email'}
                                        onChange={() => setResetMethod('email')}
                                        className="mr-2"
                                    />
                                    Email
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="resetMethod"
                                        value="sms"
                                        checked={resetMethod === 'sms'}
                                        onChange={() => setResetMethod('sms')}
                                        className="mr-2"
                                    />
                                    Text Message (SMS)
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={cancelReset}
                                className="flex-1 bg-slate-200 text-slate-700 p-3 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                            >
                                Back to Login
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
                            >
                                {loading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 2: Enter Code */}
                {resetStep === 2 && (
                    <form onSubmit={handleVerifyCode}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Enter 6-Digit Code</label>
                            <input
                                type="text"
                                value={resetCode}
                                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                            <p className="text-xs text-slate-500 mt-2">Code expires in 15 minutes</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={cancelReset}
                                className="flex-1 bg-slate-200 text-slate-700 p-3 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || resetCode.length !== 6}
                                className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: New Password */}
                {resetStep === 3 && (
                    <form onSubmit={handleCompleteReset}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter new password (min 6 characters)"
                                minLength={6}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Confirm new password"
                                minLength={6}
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={cancelReset}
                                className="flex-1 bg-slate-200 text-slate-700 p-3 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        );
    }

    // Handle Google OAuth login
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const handleGoogleLogin = () => {
        const redirectUrl = window.location.origin + '/auth/callback';
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    };

    // Normal Login Form
    return (
        <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                    required
                />
            </div>
            <div className="mb-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    required
                />
            </div>
            
            {/* Forgot Password Link */}
            <div className="mb-4 text-right">
                <button
                    type="button"
                    onClick={() => setResetMode(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                    Forgot password?
                </button>
            </div>
            
            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}
            
            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
            >
                {loading ? 'Logging in...' : 'Login'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">or continue with</span>
                </div>
            </div>

            {/* Google OAuth Button */}
            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 p-3 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
            </button>
        </form>
    );
};

// Main Authentication Modal Component
const AuthModal = ({ 
    isOpen, 
    onClose, 
    users = [], 
    teams = [], 
    onLogin, 
    onRegister 
}) => {
    const [authMode, setAuthMode] = useState('login'); // 'login', 'register'
    const [registrationData, setRegistrationData] = useState({
        name: '',
        email: '',
        phone: '',
        preferredRole: 'player',
        teamId: '',
        reasonForJoining: ''
    });

    if (!isOpen) return null;

    const handleRegistration = () => {
        if (!registrationData.name || !registrationData.email || !registrationData.reasonForJoining) {
            alert('Please fill in all required fields.');
            return;
        }

        const newUser = {
            id: Date.now(), // Simple ID generation
            name: registrationData.name,
            email: registrationData.email,
            teamId: registrationData.teamId || null,
            preferredRole: registrationData.preferredRole,
            phone: registrationData.phone,
            reasonForJoining: registrationData.reasonForJoining,
            status: 'pending',
            roles: [],
            roleIds: [],
            createdAt: new Date().toISOString()
        };

        onRegister(newUser);
        
        // Reset form
        setRegistrationData({
            name: '',
            email: '',
            phone: '',
            preferredRole: 'player',
            teamId: '',
            reasonForJoining: ''
        });
        setAuthMode('login');
        alert('Registration submitted! Your request will be reviewed by an administrator.');
    };

    const handleClose = () => {
        setAuthMode('login');
        setRegistrationData({
            name: '',
            email: '',
            phone: '',
            preferredRole: 'player',
            teamId: '',
            reasonForJoining: ''
        });
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={handleClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {authMode === 'login' ? (
                    // Login View
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-center mb-6">Welcome to MLBL</h2>
                        
                        {/* Email/Password Login Form */}
                        <LoginForm users={users} onLogin={onLogin} />
                        
                        {/* Registration Option */}
                        <div className="border-t pt-4">
                            <p className="text-center text-slate-600 mb-3">New to the league?</p>
                            <button 
                                onClick={() => setAuthMode('register')}
                                className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition-colors font-semibold"
                            >
                                Request Access
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleClose} 
                            className="w-full mt-4 bg-slate-200 text-slate-700 p-2 rounded hover:bg-slate-300 transition-colors"
                        >
                            Continue as Guest
                        </button>
                    </div>
                ) : (
                    // Registration View
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Request Access</h2>
                            <button 
                                onClick={() => setAuthMode('login')}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>
                        
                        <form onSubmit={(e) => { e.preventDefault(); handleRegistration(); }} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={registrationData.name}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            
                            {/* Email */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={registrationData.email}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            
                            {/* Phone */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={registrationData.phone}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            {/* Preferred Role */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Preferred Role *</label>
                                <select
                                    value={registrationData.preferredRole}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, preferredRole: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="player">Player</option>
                                    <option value="coach">Coach</option>
                                </select>
                            </div>
                            
                            {/* Interested Team */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Interested Team</label>
                                <select
                                    value={registrationData.teamId}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, teamId: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">No preference</option>
                                    {teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Reason for Joining */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Why do you want to join? *</label>
                                <textarea
                                    value={registrationData.reasonForJoining}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, reasonForJoining: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
                                    placeholder="Tell us about your experience and why you want to join our league..."
                                    required
                                />
                            </div>
                            
                            {/* Submit Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('login')}
                                    className="flex-1 bg-slate-200 text-slate-700 p-2 rounded hover:bg-slate-300 transition-colors"
                                >
                                    Back to Login
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors font-semibold"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
export { initialMockUsers };