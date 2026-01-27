import React, { useState, useEffect } from 'react';
import { getFullImageUrl } from '../utils/imageUtils';

/**
 * JoinTeamPage - Public page for prospective players to request joining a team
 * Accessed via /join/{team_id}
 */
const JoinTeamPage = () => {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: '',
        experience: '',
        message: ''
    });
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Extract team ID from URL path
    const getTeamIdFromUrl = () => {
        const path = window.location.pathname;
        const match = path.match(/\/join\/([^/]+)/);
        return match ? match[1] : null;
    };
    
    const teamId = getTeamIdFromUrl();
    
    // Fetch team details
    useEffect(() => {
        const fetchTeamDetails = async () => {
            if (!teamId) {
                setError('Invalid team link. Please check the URL and try again.');
                setLoading(false);
                return;
            }
            
            try {
                const response = await fetch(`${backendUrl}/api/teams/${teamId}/public`);
                if (response.ok) {
                    const data = await response.json();
                    setTeam(data);
                } else if (response.status === 404) {
                    setError('Team not found. This link may be invalid or the team no longer exists.');
                } else {
                    setError('Unable to load team information. Please try again later.');
                }
            } catch (err) {
                console.error('Error fetching team:', err);
                setError('Unable to connect to the server. Please check your connection and try again.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchTeamDetails();
    }, [teamId, backendUrl]);
    
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.name.trim()) {
            setError('Please enter your name.');
            return;
        }
        if (!formData.email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        
        setSubmitting(true);
        setError('');
        
        try {
            const response = await fetch(`${backendUrl}/api/teams/${teamId}/join-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    teamId,
                    requestedAt: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                setSubmitted(true);
            } else {
                const data = await response.json();
                setError(data.detail || 'Failed to submit request. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting join request:', err);
            setError('Unable to submit request. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };
    
    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading team information...</p>
                </div>
            </div>
        );
    }
    
    // Error state (no team found or invalid link)
    if (error && !team) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        data-testid="go-home-btn"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }
    
    // Success state (request submitted)
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Request Submitted!</h1>
                    <p className="text-gray-600 mb-6">
                        Your request to join <strong>{team?.name}</strong> has been sent to the team admin.
                        They will review your request and get back to you soon.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Check your email at <strong>{formData.email}</strong> for updates.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        data-testid="go-home-after-submit-btn"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }
    
    // Get team colors for styling
    const primaryColor = team?.style?.primaryColor || team?.primaryColor || '#1e40af';
    const logoUrl = team?.style?.logoUrl || team?.logoUrl;
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Team Header */}
                <div 
                    className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
                    data-testid="join-team-header"
                >
                    <div 
                        className="h-32 relative"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {team?.style?.bannerUrl && (
                            <img 
                                src={getFullImageUrl(team.style.bannerUrl)}
                                alt="Team banner"
                                className="w-full h-full object-cover opacity-50"
                            />
                        )}
                    </div>
                    <div className="px-6 pb-6 -mt-12 relative">
                        <div className="flex items-end gap-4">
                            {logoUrl ? (
                                <img 
                                    src={getFullImageUrl(logoUrl)}
                                    alt={team?.name}
                                    className="w-24 h-24 rounded-xl border-4 border-white shadow-lg object-contain bg-white"
                                    data-testid="team-logo"
                                />
                            ) : (
                                <div 
                                    className="w-24 h-24 rounded-xl border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-white"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {team?.name?.charAt(0) || '?'}
                                </div>
                            )}
                            <div className="flex-1 min-w-0 pb-2">
                                <h1 className="text-2xl font-bold text-gray-800 truncate" data-testid="team-name">
                                    {team?.name}
                                </h1>
                                {team?.division && (
                                    <p className="text-gray-600">{team.division}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Join Request Form */}
                <div className="bg-white rounded-2xl shadow-xl p-6" data-testid="join-request-form">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Request to Join Team</h2>
                    <p className="text-gray-600 mb-6">
                        Fill out the form below and the team admin will review your request.
                    </p>
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" data-testid="form-error">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="Enter your full name"
                                required
                                data-testid="input-name"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="your@email.com"
                                required
                                data-testid="input-email"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="(555) 123-4567"
                                data-testid="input-phone"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Preferred Position
                            </label>
                            <input
                                type="text"
                                value={formData.position}
                                onChange={(e) => handleInputChange('position', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="e.g., Attack, Midfield, Defense, Goalie"
                                data-testid="input-position"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Experience Level
                            </label>
                            <select
                                value={formData.experience}
                                onChange={(e) => handleInputChange('experience', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                data-testid="input-experience"
                            >
                                <option value="">Select your experience...</option>
                                <option value="beginner">Beginner (New to the sport)</option>
                                <option value="intermediate">Intermediate (1-3 years)</option>
                                <option value="advanced">Advanced (3-5 years)</option>
                                <option value="expert">Expert (5+ years)</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message to Team Admin
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => handleInputChange('message', e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                                placeholder="Tell us a bit about yourself and why you'd like to join the team..."
                                data-testid="input-message"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            style={{ backgroundColor: primaryColor }}
                            data-testid="submit-join-request-btn"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Join Request'
                            )}
                        </button>
                    </form>
                    
                    <p className="text-center text-sm text-gray-500 mt-6">
                        By submitting this form, you agree to be contacted by the team admin regarding your request.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default JoinTeamPage;
