import React, { useState } from 'react';
import { LacrosseIcon } from './LacrosseIcons';

// User Check Icon (from App.full.js)
const UserCheck = ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="m22 21-2-2m2 2-2-2m2 2-2-2"/>
        <path d="M16 11h6"/>
    </svg>
);

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
            <div className="mb-6">
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