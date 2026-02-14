import React, { useState, useEffect } from 'react';
import { PlayerFeeDashboard } from '../components/fees';
import AccountSettings from '../components/AccountSettings';

const PlayerDashboardPage = ({ currentUser, onUserUpdate }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [playerData, setPlayerData] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        if (currentUser) {
            loadPlayerData();
        }
    }, [currentUser]);

    const loadPlayerData = async () => {
        try {
            setLoading(true);
            
            // Load league data for team info and events
            const response = await fetch(`${BACKEND_URL}/api/league-data`);
            if (response.ok) {
                const data = await response.json();
                
                // Get player's team
                const teamId = currentUser.teamAssignments?.[0]?.teamId || currentUser.teamId;
                if (teamId) {
                    const team = data.teams?.find(t => t.id === teamId);
                    setTeamData(team);
                }
                
                // Get upcoming events
                const now = new Date();
                const upcoming = (data.leagueSchedule || [])
                    .filter(e => {
                        const eventDate = new Date(e.date);
                        return eventDate >= now;
                    })
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(0, 5);
                setUpcomingEvents(upcoming);
            }
            
            setPlayerData(currentUser);
        } catch (error) {
            console.error('Error loading player data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '🏠' },
        { id: 'fees', label: 'My Fees', icon: '💰' },
        { id: 'schedule', label: 'Schedule', icon: '📅' },
        { id: 'profile', label: 'My Profile', icon: '👤' }
    ];

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-xl text-gray-600">Please log in to view your dashboard</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const playerName = currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Player';
    const assignment = currentUser.teamAssignments?.[0];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Player Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center space-x-4">
                        {currentUser.photoUrl ? (
                            <img 
                                src={currentUser.photoUrl} 
                                alt={playerName}
                                className="w-16 h-16 rounded-full bg-white p-1 object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                {playerName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold">{playerName}</h1>
                            <p className="text-green-200">
                                {teamData?.name || 'No team assigned'}
                                {assignment?.jerseyNumber && ` • #${assignment.jerseyNumber}`}
                                {assignment?.position && ` • ${assignment.position}`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-1 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-b-2 border-green-600 text-green-600'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <PlayerOverview 
                        player={currentUser}
                        team={teamData}
                        upcomingEvents={upcomingEvents}
                    />
                )}
                {activeTab === 'fees' && (
                    <div className="bg-white rounded-lg shadow">
                        <PlayerFeeDashboard currentUser={currentUser} />
                    </div>
                )}
                {activeTab === 'schedule' && (
                    <PlayerSchedule 
                        events={upcomingEvents}
                        team={teamData}
                    />
                )}
                {activeTab === 'profile' && (
                    <PlayerProfile 
                        player={currentUser}
                        team={teamData}
                    />
                )}
            </div>
        </div>
    );
};

// Player Overview Component
const PlayerOverview = ({ player, team, upcomingEvents }) => {
    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-green-600">
                        {team?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Current Team</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-blue-600">
                        {upcomingEvents.length}
                    </div>
                    <div className="text-sm text-gray-600">Upcoming Events</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-purple-600">
                        {player.status === 'active' ? '✓' : '○'}
                    </div>
                    <div className="text-sm text-gray-600">
                        Status: {player.status || 'Unknown'}
                    </div>
                </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">📅 Upcoming Events</h2>
                </div>
                <div className="divide-y">
                    {upcomingEvents.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            No upcoming events
                        </div>
                    ) : (
                        upcomingEvents.map(event => (
                            <div key={event.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {event.title || 'Untitled Event'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {event.date} {event.time && `at ${event.time}`}
                                            {event.location && ` • ${event.location}`}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        event.type === 'game' ? 'bg-green-100 text-green-700' :
                                        event.type === 'practice' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {event.type || 'event'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Player Schedule Component
const PlayerSchedule = ({ events, team }) => {
    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">📅 My Schedule</h2>
                <p className="text-gray-600">Upcoming games, practices, and events</p>
            </div>
            <div className="divide-y">
                {events.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No upcoming events on your schedule
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 text-xs rounded ${
                                            event.type === 'game' ? 'bg-green-100 text-green-700' :
                                            event.type === 'practice' ? 'bg-blue-100 text-blue-700' :
                                            event.type === 'tournament' ? 'bg-purple-100 text-purple-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {event.type || 'event'}
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {event.title}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-sm text-gray-500">
                                        📅 {event.date} {event.time && `⏰ ${event.time}`}
                                    </div>
                                    {event.location && (
                                        <div className="text-sm text-gray-500">
                                            📍 {event.location}
                                        </div>
                                    )}
                                </div>
                                {event.rsvp_enabled && (
                                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                                        RSVP
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Player Profile Component with Editing
const PlayerProfile = ({ player, team }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        phone: player.phone || '',
        jerseySize: player.jerseySize || '',
        emergencyContactName: player.emergencyContact?.name || (typeof player.emergencyContact === 'string' ? player.emergencyContact : ''),
        emergencyContactPhone: player.emergencyContact?.phone || '',
        emergencyContactRelationship: player.emergencyContact?.relationship || '',
        lacrosseHistory: {
            highSchool: {
                teamName: player.lacrosseHistory?.highSchool?.teamName || '',
                graduationYear: player.lacrosseHistory?.highSchool?.graduationYear || ''
            },
            college: {
                teamName: player.lacrosseHistory?.college?.teamName || '',
                graduationYear: player.lacrosseHistory?.college?.graduationYear || ''
            },
            postGrad: player.lacrosseHistory?.postGrad || []
        },
        funFacts: player.funFacts || '',
        socialMedia: {
            instagram: player.socialMedia?.instagram || '',
            twitter: player.socialMedia?.twitter || '',
            tiktok: player.socialMedia?.tiktok || '',
            facebook: player.socialMedia?.facebook || ''
        }
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    const assignment = player.teamAssignments?.[0];
    
    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/${player.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.phone,
                    jerseySize: formData.jerseySize,
                    emergencyContact: {
                        name: formData.emergencyContactName,
                        phone: formData.emergencyContactPhone,
                        relationship: formData.emergencyContactRelationship
                    },
                    lacrosseHistory: formData.lacrosseHistory,
                    funFacts: formData.funFacts,
                    socialMedia: formData.socialMedia
                })
            });
            
            if (response.ok) {
                setMessage('Profile updated successfully!');
                setIsEditing(false);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to save changes');
            }
        } catch (error) {
            setMessage('Error saving profile');
        }
        setSaving(false);
    };

    const addPostGradTeam = () => {
        setFormData(prev => ({
            ...prev,
            lacrosseHistory: {
                ...prev.lacrosseHistory,
                postGrad: [...prev.lacrosseHistory.postGrad, { teamName: '', years: '' }]
            }
        }));
    };

    const updatePostGradTeam = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            lacrosseHistory: {
                ...prev.lacrosseHistory,
                postGrad: prev.lacrosseHistory.postGrad.map((t, i) => 
                    i === index ? { ...t, [field]: value } : t
                )
            }
        }));
    };

    const removePostGradTeam = (index) => {
        setFormData(prev => ({
            ...prev,
            lacrosseHistory: {
                ...prev.lacrosseHistory,
                postGrad: prev.lacrosseHistory.postGrad.filter((_, i) => i !== index)
            }
        }));
    };
    
    return (
        <div className="space-y-6">
            {/* Success/Error Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                </div>
            )}

            {/* Basic Profile Info */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">👤 My Profile</h2>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            isEditing ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Name</label>
                        <div className="mt-1 text-lg text-gray-900">
                            {player.name || `${player.firstName} ${player.lastName}`}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <div className="mt-1 text-lg text-gray-900">{player.email}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 border rounded-lg"
                                placeholder="(555) 123-4567"
                            />
                        ) : (
                            <div className="mt-1 text-lg text-gray-900">{player.phone || 'Not provided'}</div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Team</label>
                        <div className="mt-1 text-lg text-gray-900">{team?.name || 'Not assigned'}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Jersey Number</label>
                        <div className="mt-1 text-lg text-gray-900">
                            {assignment?.jerseyNumber || player.playerNumber || 'Not assigned'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Position</label>
                        <div className="mt-1 text-lg text-gray-900">
                            {assignment?.position || player.position || 'Not assigned'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Jersey Size</label>
                        {isEditing ? (
                            <select
                                value={formData.jerseySize}
                                onChange={(e) => setFormData(prev => ({ ...prev, jerseySize: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="">Select size</option>
                                <option value="YS">Youth Small</option>
                                <option value="YM">Youth Medium</option>
                                <option value="YL">Youth Large</option>
                                <option value="S">Adult Small</option>
                                <option value="M">Adult Medium</option>
                                <option value="L">Adult Large</option>
                                <option value="XL">Adult XL</option>
                                <option value="XXL">Adult XXL</option>
                            </select>
                        ) : (
                            <div className="mt-1 text-lg text-gray-900">{player.jerseySize || 'Not provided'}</div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Status</label>
                        <div className="mt-1">
                            <span className={`px-2 py-1 rounded-full text-sm ${
                                player.status === 'active' ? 'bg-green-100 text-green-700' :
                                player.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {player.status || 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lacrosse History */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">🏒 Lacrosse History</h2>
                </div>
                <div className="p-6 space-y-6">
                    {/* High School */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">🏫 High School</h3>
                        {isEditing ? (
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={formData.lacrosseHistory.highSchool.teamName}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        lacrosseHistory: {
                                            ...prev.lacrosseHistory,
                                            highSchool: { ...prev.lacrosseHistory.highSchool, teamName: e.target.value }
                                        }
                                    }))}
                                    placeholder="School/Team name"
                                    className="px-3 py-2 border rounded-lg"
                                />
                                <input
                                    type="text"
                                    value={formData.lacrosseHistory.highSchool.graduationYear}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        lacrosseHistory: {
                                            ...prev.lacrosseHistory,
                                            highSchool: { ...prev.lacrosseHistory.highSchool, graduationYear: e.target.value }
                                        }
                                    }))}
                                    placeholder="Graduation year"
                                    className="px-3 py-2 border rounded-lg"
                                />
                            </div>
                        ) : (
                            <div className="text-gray-600">
                                {player.lacrosseHistory?.highSchool?.teamName 
                                    ? `${player.lacrosseHistory.highSchool.teamName} (${player.lacrosseHistory.highSchool.graduationYear || 'N/A'})`
                                    : 'Not provided'}
                            </div>
                        )}
                    </div>

                    {/* College */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">🎓 College</h3>
                        {isEditing ? (
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={formData.lacrosseHistory.college.teamName}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        lacrosseHistory: {
                                            ...prev.lacrosseHistory,
                                            college: { ...prev.lacrosseHistory.college, teamName: e.target.value }
                                        }
                                    }))}
                                    placeholder="College/Team name"
                                    className="px-3 py-2 border rounded-lg"
                                />
                                <input
                                    type="text"
                                    value={formData.lacrosseHistory.college.graduationYear}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        lacrosseHistory: {
                                            ...prev.lacrosseHistory,
                                            college: { ...prev.lacrosseHistory.college, graduationYear: e.target.value }
                                        }
                                    }))}
                                    placeholder="Graduation year"
                                    className="px-3 py-2 border rounded-lg"
                                />
                            </div>
                        ) : (
                            <div className="text-gray-600">
                                {player.lacrosseHistory?.college?.teamName 
                                    ? `${player.lacrosseHistory.college.teamName} (${player.lacrosseHistory.college.graduationYear || 'N/A'})`
                                    : 'Not provided'}
                            </div>
                        )}
                    </div>

                    {/* Post-Grad Teams */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-700">🏆 Post-Graduation Teams</h3>
                            {isEditing && (
                                <button
                                    onClick={addPostGradTeam}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    + Add Team
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <div className="space-y-2">
                                {formData.lacrosseHistory.postGrad.map((team, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={team.teamName}
                                            onChange={(e) => updatePostGradTeam(index, 'teamName', e.target.value)}
                                            placeholder="Team name"
                                            className="flex-1 px-3 py-2 border rounded-lg"
                                        />
                                        <input
                                            type="text"
                                            value={team.years}
                                            onChange={(e) => updatePostGradTeam(index, 'years', e.target.value)}
                                            placeholder="Years"
                                            className="w-32 px-3 py-2 border rounded-lg"
                                        />
                                        <button
                                            onClick={() => removePostGradTeam(index)}
                                            className="px-2 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                {formData.lacrosseHistory.postGrad.length === 0 && (
                                    <p className="text-gray-400 text-sm">No teams added</p>
                                )}
                            </div>
                        ) : (
                            <div className="text-gray-600">
                                {player.lacrosseHistory?.postGrad?.length > 0 
                                    ? player.lacrosseHistory.postGrad.map((t, i) => (
                                        <div key={i}>{t.teamName} ({t.years})</div>
                                      ))
                                    : 'Not provided'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Fun Facts & Social */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">✨ Fun Facts & Social</h2>
                </div>
                <div className="p-6 space-y-6">
                    {/* Fun Facts */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Fun Facts</label>
                        {isEditing ? (
                            <textarea
                                value={formData.funFacts}
                                onChange={(e) => setFormData(prev => ({ ...prev, funFacts: e.target.value }))}
                                placeholder="Share something interesting about yourself..."
                                rows={3}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        ) : (
                            <div className="text-gray-600">{player.funFacts || 'Not provided'}</div>
                        )}
                    </div>

                    {/* Social Media */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">Social Media</label>
                        {isEditing ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Instagram</label>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-1">@</span>
                                        <input
                                            type="text"
                                            value={formData.socialMedia.instagram}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                                            }))}
                                            placeholder="username"
                                            className="flex-1 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Twitter/X</label>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-1">@</span>
                                        <input
                                            type="text"
                                            value={formData.socialMedia.twitter}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                                            }))}
                                            placeholder="username"
                                            className="flex-1 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">TikTok</label>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-1">@</span>
                                        <input
                                            type="text"
                                            value={formData.socialMedia.tiktok}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                socialMedia: { ...prev.socialMedia, tiktok: e.target.value }
                                            }))}
                                            placeholder="username"
                                            className="flex-1 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Facebook</label>
                                    <input
                                        type="text"
                                        value={formData.socialMedia.facebook}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                                        }))}
                                        placeholder="profile name"
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {player.socialMedia?.instagram && (
                                    <a href={`https://instagram.com/${player.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm hover:bg-pink-200">
                                        @{player.socialMedia.instagram}
                                    </a>
                                )}
                                {player.socialMedia?.twitter && (
                                    <a href={`https://twitter.com/${player.socialMedia.twitter}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200">
                                        @{player.socialMedia.twitter}
                                    </a>
                                )}
                                {player.socialMedia?.tiktok && (
                                    <a href={`https://tiktok.com/@${player.socialMedia.tiktok}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm hover:bg-slate-200">
                                        @{player.socialMedia.tiktok}
                                    </a>
                                )}
                                {!player.socialMedia?.instagram && !player.socialMedia?.twitter && !player.socialMedia?.tiktok && (
                                    <span className="text-gray-400">No social media linked</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">🚨 Emergency Contact</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Contact Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.emergencyContactName}
                                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 border rounded-lg"
                                placeholder="Jane Smith"
                            />
                        ) : (
                            <div className="mt-1 text-lg text-gray-900">
                                {player.emergencyContact?.name || (typeof player.emergencyContact === 'string' ? player.emergencyContact : 'Not provided')}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Contact Phone</label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={formData.emergencyContactPhone}
                                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 border rounded-lg"
                                placeholder="(555) 987-6543"
                            />
                        ) : (
                            <div className="mt-1 text-lg text-gray-900">
                                {player.emergencyContact?.phone || 'Not provided'}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Relationship</label>
                        {isEditing ? (
                            <select
                                value={formData.emergencyContactRelationship}
                                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelationship: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="">Select...</option>
                                <option value="Parent">Parent</option>
                                <option value="Guardian">Guardian</option>
                                <option value="Spouse">Spouse</option>
                                <option value="Sibling">Sibling</option>
                                <option value="Other Family">Other Family</option>
                                <option value="Friend">Friend</option>
                                <option value="Other">Other</option>
                            </select>
                        ) : (
                            <div className="mt-1 text-lg text-gray-900">
                                {player.emergencyContact?.relationship || 'Not provided'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Button */}
            {isEditing && (
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PlayerDashboardPage;
