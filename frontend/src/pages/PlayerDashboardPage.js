import React, { useState, useEffect } from 'react';
import { PlayerFeeDashboard } from '../components/fees';

const PlayerDashboardPage = ({ currentUser }) => {
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

// Player Profile Component
const PlayerProfile = ({ player, team }) => {
    const assignment = player.teamAssignments?.[0];
    const emergencyContact = player.emergencyContact || {};
    
    return (
        <div className="space-y-6">
            {/* Profile Info */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">👤 My Profile</h2>
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
                        <div className="mt-1 text-lg text-gray-900">{player.phone || 'Not provided'}</div>
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
                        <div className="mt-1 text-lg text-gray-900">{player.jerseySize || 'Not provided'}</div>
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

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">🚨 Emergency Contact</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Contact Name</label>
                        <div className="mt-1 text-lg text-gray-900">
                            {typeof emergencyContact === 'object' 
                                ? emergencyContact.name || 'Not provided'
                                : emergencyContact || 'Not provided'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Contact Phone</label>
                        <div className="mt-1 text-lg text-gray-900">
                            {emergencyContact.phone || 'Not provided'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Relationship</label>
                        <div className="mt-1 text-lg text-gray-900">
                            {emergencyContact.relationship || 'Not provided'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerDashboardPage;
