import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FeeManager, PlayerImporter } from '../components/fees';
import UserManager from '../components/managers/UserManager';

const TeamAdminPage = ({ currentUser, teams = [], users = [] }) => {
    const { teamId } = useParams();
    const [activeTab, setActiveTab] = useState('roster');
    const [teamData, setTeamData] = useState(null);
    const [teamPlayers, setTeamPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadTeamData();
    }, [teamId]);

    const loadTeamData = async () => {
        try {
            setLoading(true);
            // Get team info and players
            const [leagueRes, usersRes] = await Promise.all([
                fetch(`${BACKEND_URL}/api/league-data`),
                fetch(`${BACKEND_URL}/api/users`)
            ]);
            
            if (leagueRes.ok) {
                const data = await leagueRes.json();
                const team = data.teams?.find(t => t.id === teamId);
                setTeamData(team);
            }
            
            if (usersRes.ok) {
                const data = await usersRes.json();
                // Filter users who are on this team
                const players = (data.users || []).filter(u => {
                    // Check teamAssignments
                    const hasTeamAssignment = u.teamAssignments?.some(a => a.teamId === teamId);
                    // Check legacy teamId
                    const hasLegacyTeam = u.teamId === teamId;
                    return hasTeamAssignment || hasLegacyTeam;
                });
                setTeamPlayers(players);
            }
        } catch (error) {
            console.error('Error loading team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'roster', label: 'Roster', icon: '👥', description: 'Manage team players' },
        { id: 'fees', label: 'Fees & Payments', icon: '💰', description: 'Player fees and payments' },
        { id: 'import', label: 'Import Players', icon: '📥', description: 'Bulk import players' },
        { id: 'gallery', label: 'Media', icon: '📸', description: 'Team photos and videos' },
        { id: 'chat', label: 'Team Chat', icon: '💬', description: 'GroupMe channels' }
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
                    <p className="text-gray-600 mt-2">Team ID: {teamId}</p>
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
                        {teamData.logoUrl || teamData.style?.logoUrl ? (
                            <img 
                                src={teamData.logoUrl || teamData.style?.logoUrl} 
                                alt={teamData.name}
                                className="w-16 h-16 rounded-full bg-white p-1 object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                                🏆
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold">{teamData.name}</h1>
                            <p className="text-blue-200">Team Administration • {teamPlayers.length} Players</p>
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
                {activeTab === 'roster' && (
                    <TeamRosterManager 
                        teamId={teamId} 
                        teamName={teamData.name} 
                        players={teamPlayers}
                        onRefresh={loadTeamData}
                        currentUser={currentUser}
                    />
                )}
                {activeTab === 'fees' && (
                    <div className="bg-white rounded-lg shadow">
                        <FeeManager 
                            teams={[teamData]} 
                            players={teamPlayers}
                            currentUser={currentUser}
                            scope="team"
                            teamId={teamId}
                        />
                    </div>
                )}
                {activeTab === 'import' && (
                    <TeamPlayerImporter 
                        teamId={teamId} 
                        teamName={teamData.name}
                        onImportComplete={loadTeamData}
                    />
                )}
                {activeTab === 'gallery' && (
                    <TeamGalleryManager teamId={teamId} teamName={teamData.name} />
                )}
                {activeTab === 'chat' && (
                    <TeamChatManager teamId={teamId} teamName={teamData.name} currentUser={currentUser} />
                )}
            </div>
        </div>
    );
};

// Team Roster Manager - View and manage team players
const TeamRosterManager = ({ teamId, teamName, players, onRefresh, currentUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [editingPlayer, setEditingPlayer] = useState(null);
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    const filteredPlayers = players.filter(p => {
        const name = p.name || `${p.firstName || ''} ${p.lastName || ''}`;
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               p.email?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleUpdatePlayer = async (playerId, updates) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/${playerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            
            if (response.ok) {
                setEditingPlayer(null);
                onRefresh();
            }
        } catch (error) {
            console.error('Error updating player:', error);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">👥 {teamName} Roster</h2>
                        <p className="text-gray-600">{players.length} players on the team</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search players..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Player List */}
            <div className="divide-y">
                {filteredPlayers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {searchQuery ? 'No players match your search' : 'No players on this team yet'}
                    </div>
                ) : (
                    filteredPlayers.map(player => {
                        const assignment = player.teamAssignments?.find(a => a.teamId === teamId);
                        const name = player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim();
                        
                        return (
                            <div key={player.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {player.photoUrl ? (
                                        <img 
                                            src={player.photoUrl} 
                                            alt={name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium text-gray-900 flex items-center gap-2">
                                            {name}
                                            {assignment?.jerseyNumber && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded">
                                                    #{assignment.jerseyNumber}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {assignment?.position || player.position || 'No position'} • {player.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        player.status === 'active' ? 'bg-green-100 text-green-700' :
                                        player.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {player.status || 'unknown'}
                                    </span>
                                    <button
                                        onClick={() => setEditingPlayer(player)}
                                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Edit Player Modal */}
            {editingPlayer && (
                <PlayerEditModal
                    player={editingPlayer}
                    teamId={teamId}
                    onSave={handleUpdatePlayer}
                    onClose={() => setEditingPlayer(null)}
                />
            )}
        </div>
    );
};

// Simple Player Edit Modal
const PlayerEditModal = ({ player, teamId, onSave, onClose }) => {
    const assignment = player.teamAssignments?.find(a => a.teamId === teamId) || {};
    const [formData, setFormData] = useState({
        jerseyNumber: assignment.jerseyNumber || player.playerNumber || '',
        position: assignment.position || player.position || '',
        status: player.status || 'active'
    });

    const handleSubmit = () => {
        // Update the team assignment
        const updatedAssignments = (player.teamAssignments || []).map(a => 
            a.teamId === teamId 
                ? { ...a, jerseyNumber: formData.jerseyNumber, position: formData.position }
                : a
        );
        
        // If no assignment exists for this team, add one
        if (!player.teamAssignments?.some(a => a.teamId === teamId)) {
            updatedAssignments.push({
                teamId,
                jerseyNumber: formData.jerseyNumber,
                position: formData.position,
                isPrimary: true
            });
        }

        onSave(player.id, {
            status: formData.status,
            teamAssignments: updatedAssignments,
            playerNumber: formData.jerseyNumber,
            position: formData.position
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold">Edit Player</h3>
                    <p className="text-gray-600 text-sm">{player.name || `${player.firstName} ${player.lastName}`}</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Number</label>
                        <input
                            type="text"
                            value={formData.jerseyNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="e.g., 12"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                        <select
                            value={formData.position}
                            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="">Select position</option>
                            <option value="Attack">Attack</option>
                            <option value="Midfield">Midfield</option>
                            <option value="Defense">Defense</option>
                            <option value="Goalie">Goalie</option>
                            <option value="LSM">LSM</option>
                            <option value="FOGO">FOGO</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="injured">Injured</option>
                        </select>
                    </div>
                </div>
                <div className="p-6 border-t flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// Team Player Importer wrapper
const TeamPlayerImporter = ({ teamId, teamName, onImportComplete }) => {
    const [teams, setTeams] = useState([]);
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        // Load team data for the importer
        const loadTeam = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/league-data`);
                if (response.ok) {
                    const data = await response.json();
                    const team = data.teams?.find(t => t.id === teamId);
                    if (team) setTeams([team]);
                }
            } catch (error) {
                console.error('Error loading team:', error);
            }
        };
        loadTeam();
    }, [teamId, BACKEND_URL]);

    // Import the PlayerImporter component dynamically
    const PlayerImporter = require('../components/managers/PlayerImporter').default;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📥 Import Players to {teamName}</h2>
                <p className="text-gray-600">Bulk import players using a CSV file</p>
            </div>
            <PlayerImporter 
                teams={teams} 
                onImportComplete={onImportComplete}
            />
        </div>
    );
};

// Placeholder components
const TeamGalleryManager = ({ teamId, teamName }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📸 {teamName} - Media Gallery</h2>
            <p className="text-gray-600 mb-4">Manage your team&apos;s photo galleries and media</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-blue-800">Gallery management coming soon!</p>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-2">💬 {teamName} - Team Chat</h2>
            <p className="text-gray-600 mb-4">Team communication channels</p>
            {channels.length > 0 ? (
                <div className="space-y-2">
                    {channels.map(channel => (
                        <div key={channel.id} className="p-3 border rounded-lg hover:bg-gray-50">
                            <div className="font-medium">{channel.name}</div>
                            <div className="text-sm text-gray-500">{channel.description}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-blue-800">No chat channels configured yet.</p>
                </div>
            )}
        </div>
    );
};

export default TeamAdminPage;
