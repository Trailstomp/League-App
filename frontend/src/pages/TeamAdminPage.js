import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Note: Manager components don't exist yet in the expected locations
// Using placeholder components for now until managers are properly set up
// import GalleryManager from '../components/managers/GalleryManager';
// import NewsManager from '../components/managers/NewsManager';
// import LocationManager from '../components/managers/LocationManager';
// import PlayerManager from '../components/managers/PlayerManager';
// import UserManager from '../components/managers/UserManager';
// import GroupMeChatUnified from '../components/GroupMeChatUnified';

const TeamAdminPage = ({ currentUser }) => {
    const { teamId } = useParams();
    const [activeTab, setActiveTab] = useState('gallery');
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadTeamData();
    }, [teamId]);

    const loadTeamData = async () => {
        try {
            setLoading(true);
            // Get team info from league data
            const response = await fetch(`${BACKEND_URL}/api/league-data`);
            if (response.ok) {
                const data = await response.json();
                const team = data.teams?.find(t => t.id === teamId);
                setTeamData(team);
            }
        } catch (error) {
            console.error('Error loading team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'gallery', label: 'Media Gallery', icon: '📸' },
        { id: 'news', label: 'News', icon: '📰' },
        { id: 'locations', label: 'Locations', icon: '📍' },
        { id: 'players', label: 'Players', icon: '👥' },
        { id: 'users', label: 'Users & Security', icon: '👤' },
        { id: 'chat', label: 'Team Chat', icon: '💬' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading team admin...</p>
                </div>
            </div>
        );
    }

    if (!teamData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-xl text-red-600">Team not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Team Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center space-x-4">
                        {teamData.logoUrl && (
                            <img 
                                src={teamData.logoUrl} 
                                alt={teamData.name}
                                className="w-16 h-16 rounded-full bg-white p-1"
                            />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold">{teamData.name}</h1>
                            <p className="text-blue-200">Team Administration</p>
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
                                        ? 'border-b-2 border-blue-600 text-blue-600'
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
                {activeTab === 'gallery' && (
                    <TeamGalleryManager teamId={teamId} teamName={teamData.name} />
                )}
                {activeTab === 'news' && (
                    <TeamNewsManager teamId={teamId} teamName={teamData.name} />
                )}
                {activeTab === 'locations' && (
                    <TeamLocationManager teamId={teamId} teamName={teamData.name} />
                )}
                {activeTab === 'players' && (
                    <TeamPlayerManager teamId={teamId} teamName={teamData.name} />
                )}
                {activeTab === 'users' && (
                    <TeamUserManager teamId={teamId} teamName={teamData.name} />
                )}
                {activeTab === 'chat' && (
                    <TeamChatManager teamId={teamId} teamName={teamData.name} currentUser={currentUser} />
                )}
            </div>
        </div>
    );
};

// Team-specific wrapper components that fetch filtered data
// Placeholder components until managers are properly integrated
const TeamGalleryManager = ({ teamId, teamName }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{teamName} - Media Gallery</h2>
            <p className="text-gray-600 mb-4">Manage your team's photo galleries and media</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-blue-800">📸 Gallery management coming soon!</p>
                <p className="text-sm text-gray-600 mt-2">Team ID: {teamId}</p>
            </div>
        </div>
    );
};

const TeamNewsManager = ({ teamId, teamName }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{teamName} - News</h2>
            <p className="text-gray-600 mb-4">Post team announcements and updates</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-blue-800">📰 News management coming soon!</p>
                <p className="text-sm text-gray-600 mt-2">Team ID: {teamId}</p>
            </div>
        </div>
    );
};

const TeamLocationManager = ({ teamId, teamName }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{teamName} - Locations</h2>
            <p className="text-gray-600 mb-4">Manage practice and game locations</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-blue-800">📍 Location management coming soon!</p>
                <p className="text-sm text-gray-600 mt-2">Team ID: {teamId}</p>
            </div>
        </div>
    );
};

const TeamPlayerManager = ({ teamId, teamName }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{teamName} - Roster</h2>
            <p className="text-gray-600 mb-4">Manage your team's player roster</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-blue-800">👥 Player management coming soon!</p>
                <p className="text-sm text-gray-600 mt-2">Team ID: {teamId}</p>
            </div>
        </div>
    );
};

const TeamUserManager = ({ teamId, teamName }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{teamName} - Users & Security</h2>
            <p className="text-gray-600 mb-4">Manage team coaches, parents, and user access</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-blue-800">👤 User management coming soon!</p>
                <p className="text-sm text-gray-600 mt-2">Team ID: {teamId}</p>
            </div>
        </div>
    );
};

const TeamChatManager = ({ teamId, teamName, currentUser }) => {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadChannels();
    }, [teamId]);

    const loadChannels = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BACKEND_URL}/api/team/${teamId}/channels`);
            if (response.ok) {
                const data = await response.json();
                setChannels(data.channels || []);
            }
        } catch (error) {
            console.error('Error loading team channels:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-8">Loading chat...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{teamName} - Team Chat</h2>
            <p className="text-gray-600 mb-4">Team and league chat channels</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-blue-800">💬 Chat interface coming soon!</p>
                <p className="text-sm text-gray-600 mt-2">
                    Found {channels.length} channel(s) for this team
                </p>
                {channels.map(ch => (
                    <div key={ch.id} className="text-sm text-gray-700 mt-1">
                        • {ch.name} ({ch.channel_type})
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamAdminPage;
