import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';

const PlayerApplicationForm = ({ teamId, onBack, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        team_id: teamId || '',
        position: '',
        experience_level: '',
        age: '',
        previous_teams: '',
        comments: ''
    });
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingTeams, setLoadingTeams] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Load teams
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/dashboard-data`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter out external teams
                    const internalTeams = (data.teams || []).filter(t => !t.isExternal);
                    setTeams(internalTeams);
                    
                    // If teamId provided, find and select that team
                    if (teamId) {
                        const team = internalTeams.find(t => t.id === teamId);
                        if (team) {
                            setSelectedTeam(team);
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading teams:', e);
            } finally {
                setLoadingTeams(false);
            }
        };
        fetchTeams();
    }, [backendUrl, teamId]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        
        // Update selected team when team_id changes
        if (name === 'team_id') {
            const team = teams.find(t => t.id === value);
            setSelectedTeam(team || null);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        // Validation
        if (!formData.name || !formData.email || !formData.team_id) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }
        
        try {
            const res = await fetch(`${backendUrl}/api/join-us/player-application`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    age: formData.age ? parseInt(formData.age) : null
                })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.detail || 'Failed to submit application');
            }
            
            setSuccess(true);
            if (onSuccess) onSuccess(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const positions = ['Attack', 'Midfield', 'Defense', 'Goalie', 'FOGO', 'LSM', 'Flexible'];
    const experienceLevels = [
        { value: 'beginner', label: 'Beginner (0-1 years)' },
        { value: 'intermediate', label: 'Intermediate (2-4 years)' },
        { value: 'advanced', label: 'Advanced (5+ years)' },
        { value: 'pro', label: 'Professional/College' }
    ];
    
    if (success) {
        return (
            <div className="max-w-2xl mx-auto p-6" data-testid="player-application-success">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🎉</span>
                    </div>
                    <h2 className="text-2xl font-bold text-blue-800 mb-2">Application Submitted!</h2>
                    <p className="text-blue-700 mb-6">
                        Thank you for applying to {selectedTeam?.name || 'the team'}! We've sent a confirmation email to {formData.email}.
                    </p>
                    <p className="text-sm text-blue-600 mb-6">
                        The team coach will review your application and get back to you soon.
                    </p>
                    <button
                        onClick={onBack}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Join Us
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-2xl mx-auto p-6" data-testid="player-application-form">
            {/* Back Button */}
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
            >
                <ChevronLeft className="w-5 h-5" />
                Back to Join Us
            </button>
            
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🏃</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Apply to Join a Team</h1>
                <p className="text-slate-600">Fill out the form below to apply for a spot on a team</p>
            </div>
            
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Team Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Select Team <span className="text-red-500">*</span>
                    </label>
                    {loadingTeams ? (
                        <div className="flex items-center gap-2 text-slate-500 py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading teams...
                        </div>
                    ) : (
                        <select
                            name="team_id"
                            value={formData.team_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            data-testid="team-select"
                        >
                            <option value="">Choose a team...</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.name} {team.division ? `(${team.division})` : ''}
                                </option>
                            ))}
                        </select>
                    )}
                    {selectedTeam && (
                        <div 
                            className="mt-3 p-3 border rounded-lg flex items-center gap-3"
                            style={{ borderColor: selectedTeam.color || '#e2e8f0' }}
                        >
                            {selectedTeam.style?.logoUrl ? (
                                <img 
                                    src={selectedTeam.style.logoUrl} 
                                    alt={selectedTeam.name} 
                                    className="w-12 h-12 object-contain"
                                />
                            ) : (
                                <div 
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                                    style={{ backgroundColor: selectedTeam.color || '#3b82f6' }}
                                >
                                    {selectedTeam.name?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <div className="font-medium">{selectedTeam.name}</div>
                                <div className="text-sm text-slate-500">{selectedTeam.division}</div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Your Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Your full name"
                            required
                            data-testid="player-name-input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="you@example.com"
                            required
                            data-testid="player-email-input"
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="(555) 123-4567"
                            data-testid="player-phone-input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Age
                        </label>
                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 25"
                            min="10"
                            max="99"
                            data-testid="player-age-input"
                        />
                    </div>
                </div>
                
                {/* Position */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Preferred Position
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {positions.map(pos => (
                            <button
                                key={pos}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, position: pos }))}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    formData.position === pos
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                                data-testid={`position-${pos.toLowerCase()}`}
                            >
                                {pos}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Experience Level */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Experience Level
                    </label>
                    <select
                        name="experience_level"
                        value={formData.experience_level}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="experience-select"
                    >
                        <option value="">Select your experience...</option>
                        {experienceLevels.map(level => (
                            <option key={level.value} value={level.value}>
                                {level.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Previous Teams */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Previous Teams/Clubs
                    </label>
                    <input
                        type="text"
                        name="previous_teams"
                        value={formData.previous_teams}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., High School Team, Club LAX, etc."
                        data-testid="previous-teams-input"
                    />
                </div>
                
                {/* Comments */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Additional Comments
                    </label>
                    <textarea
                        name="comments"
                        value={formData.comments}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tell us about yourself, why you want to join this team..."
                        data-testid="player-comments-input"
                    />
                </div>
                
                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    data-testid="submit-player-application"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        'Submit Application'
                    )}
                </button>
            </form>
        </div>
    );
};

export default PlayerApplicationForm;
