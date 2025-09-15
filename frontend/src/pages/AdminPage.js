import React, { useState } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import UserManager from '../components/managers/UserManager';
import RoleManager from '../components/managers/RoleManager';
import TeamManager from '../components/managers/TeamManager';
import LocationManager from '../components/managers/LocationManager';
import NewsManager from '../components/managers/NewsManager';
import MediaManager from '../components/managers/MediaManager';
import APIIntegrationsManager from '../components/managers/APIIntegrationsManager';
import WebsiteDesignManager from '../components/managers/WebsiteDesignManager';
import SeasonManager from '../components/managers/SeasonManager';

const AdminPage = ({ teams, setTeams, players, setPlayers, users, setUsers, currentUser, websiteStyle, setWebsiteStyle, events, setEvents }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Protected teams update function that saves to API
    const handleTeamsChange = async (newTeams) => {
        try {
            // CRITICAL FIX: Ensure newTeams is always an array
            const teamsArray = Array.isArray(newTeams) ? newTeams : [newTeams];
            
            console.log('🏆 AdminPage: Saving teams changes:', teamsArray.length, 'teams');
            console.log('🏆 Team data type check:', {
                'isArray': Array.isArray(newTeams),
                'originalData': typeof newTeams,
                'processedArray': Array.isArray(teamsArray)
            });
            
            if (teamsArray.length > 0) {
                console.log('🏆 Team names and logos:', teamsArray.map(t => ({
                    name: t.name || 'Unnamed',
                    hasLogo: !!(t.style?.logoUrl),
                    logoLength: t.style?.logoUrl?.length || 0
                })));
            }
            
            // Update local state immediately
            setTeams(teamsArray);
            
            // Save to backend API to prevent overwrites  
            if (!process.env.REACT_APP_BACKEND_URL) {
                console.error('❌ REACT_APP_BACKEND_URL not configured - cannot save teams');
                alert('Error: Backend URL not configured. Teams cannot be saved.');
                return;
            }
            
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
            
            // Save to league-data endpoint
            const response = await fetch(`${backendUrl}/api/league-data/teams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(teamsArray)
            });
            
            if (response.ok) {
                console.log('✅ Teams with logos saved to API successfully');
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to save teams to API:', response.status, errorText);
                alert(`Failed to save teams: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Error saving teams:', error);
            alert(`Error saving teams: ${error.message}`);
        }
    };

    // Protected players update function that saves to API 
    const handlePlayersChange = async (newPlayers) => {
        try {
            console.log('👥 AdminPage: Saving players changes:', newPlayers.length, 'players');
            
            // Update local state immediately
            setPlayers(newPlayers);
            
            // Save to backend API - sync with both individual and league-data endpoints
            if (!process.env.REACT_APP_BACKEND_URL) {
                console.error('❌ REACT_APP_BACKEND_URL not configured - cannot save players');
                alert('Error: Backend URL not configured. Players cannot be saved.');
                return;
            }
            
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
            
            // Save to league-data endpoint to prevent data loss
            const response = await fetch(`${backendUrl}/api/league-data/players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newPlayers)
            });
            
            if (response.ok) {
                console.log('✅ Players saved to API successfully');
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to save players to API:', response.status, errorText);
                alert(`Failed to save players: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Error saving players:', error);
            alert(`Error saving players: ${error.message}`);
        }
    };

    // Admin tabs configuration
    const adminTabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'venue' },
        { id: 'seasons', label: 'Seasons & Leagues', icon: 'trophy' },
        { id: 'teams', label: 'Teams', icon: 'teams' },
        { id: 'players', label: 'Players', icon: 'players' },
        { id: 'locations', label: 'Locations', icon: 'location' },
        { id: 'news', label: 'News', icon: '📰' },
        { id: 'users', label: 'Users & Security', icon: 'admin' },
        { id: 'roles', label: 'Roles & Permissions', icon: 'settings' },
        { id: 'communications', label: 'Communications', icon: 'email' },
        { id: 'media', label: 'Media Gallery', icon: 'view' },
        { id: 'social', label: 'Social Media', icon: 'social' },
        { id: 'friends', label: 'Friends & Sponsors', icon: 'players' },
        { id: 'website', label: 'Website Design', icon: 'view' },
        { id: 'api', label: 'API & Integrations', icon: 'settings' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <AdminDashboard teams={teams} players={players} users={users} />;
            case 'teams':
                return <TeamManager teams={teams} setTeams={handleTeamsChange} websiteStyle={{}} seasons={[]} currentSeason={null} />;
            case 'players':
                return <PlayersManager teams={teams} players={players} setPlayers={handlePlayersChange} />;
            case 'locations':
                return <LocationManager teams={teams} currentUser={currentUser} />;
            case 'news':
                return <NewsManager teams={teams} currentUser={currentUser} />;
            case 'media':
                return <MediaManager teams={teams} setTeams={setTeams} currentUser={currentUser} />;
            case 'users':
                return <UserManager users={users} setUsers={setUsers} teams={teams} />;
            case 'roles':
                return <RoleManager users={users} setUsers={setUsers} />;
            case 'website':
                return <WebsiteDesignManager websiteStyle={websiteStyle} setWebsiteStyle={setWebsiteStyle} teams={teams} events={events} />;
            case 'api':
                return <APIIntegrationsManager />;
            case 'seasons':
                return <SeasonManager teams={teams} events={events} websiteStyle={websiteStyle} currentUser={currentUser} />;
            default:
                return (
                    <div className="text-center py-16">
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                            {adminTabs.find(tab => tab.id === activeTab)?.label}
                        </h3>
                        <p className="text-slate-600">Coming soon in future phases...</p>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Admin Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Portal</h1>
                <p className="text-slate-600">Manage your lacrosse league</p>
            </div>

            {/* Admin Tabs */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                        {adminTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <LacrosseIcon name={tab.icon} className="mr-2" style={{fontSize: '16px'}} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

// Admin Dashboard Component
const AdminDashboard = ({ teams, players, users = [] }) => {
    const stats = {
        totalTeams: teams.length,
        totalPlayers: players.length,
        totalUsers: users.length,
        activeTeams: teams.filter(t => t.active !== false).length,
        activePlayers: players.filter(p => p.active !== false).length,
        activeUsers: users.filter(u => u.status === 'active').length,
        pendingUsers: users.filter(u => u.status === 'pending').length,
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <LacrosseIcon name="teams" className="text-blue-600 mr-3" style={{fontSize: '24px'}} />
                        <div>
                            <div className="text-2xl font-bold text-blue-900">{stats.totalTeams}</div>
                            <div className="text-sm text-blue-700">Total Teams</div>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <LacrosseIcon name="players" className="text-green-600 mr-3" style={{fontSize: '24px'}} />
                        <div>
                            <div className="text-2xl font-bold text-green-900">{stats.totalPlayers}</div>
                            <div className="text-sm text-green-700">Total Players</div>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <LacrosseIcon name="admin" className="text-purple-600 mr-3" style={{fontSize: '24px'}} />
                        <div>
                            <div className="text-2xl font-bold text-purple-900">{stats.activeUsers}</div>
                            <div className="text-sm text-purple-700">Active Users</div>
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <LacrosseIcon name="time" className="text-orange-600 mr-3" style={{fontSize: '24px'}} />
                        <div>
                            <div className="text-2xl font-bold text-orange-900">{stats.pendingUsers}</div>
                            <div className="text-sm text-orange-700">Pending Users</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="bg-white border rounded-lg p-4 text-left hover:shadow-sm transition-shadow">
                        <LacrosseIcon name="add" className="text-blue-600 mb-2" style={{fontSize: '24px'}} />
                        <div className="font-medium text-slate-800">Add New Team</div>
                        <div className="text-sm text-slate-600">Create and configure a new team</div>
                    </button>
                    
                    <button className="bg-white border rounded-lg p-4 text-left hover:shadow-sm transition-shadow">
                        <LacrosseIcon name="add" className="text-green-600 mb-2" style={{fontSize: '24px'}} />
                        <div className="font-medium text-slate-800">Add New Player</div>
                        <div className="text-sm text-slate-600">Register a new player</div>
                    </button>
                    
                    <button className="bg-white border rounded-lg p-4 text-left hover:shadow-sm transition-shadow">
                        <LacrosseIcon name="backup" className="text-purple-600 mb-2" style={{fontSize: '24px'}} />
                        <div className="font-medium text-slate-800">Export Data</div>
                        <div className="text-sm text-slate-600">Backup league data</div>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Teams Manager Component
// Players Manager Component
const PlayersManager = ({ teams, players, setPlayers }) => {
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddPlayer = async (playerData) => {
        try {
            console.log('👥 Adding new player:', playerData);
            
            // Create new player with proper ID
            const newPlayer = {
                id: `player_${Date.now()}`,
                ...playerData,
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Use protected save function instead of individual API call
            const updatedPlayers = [...players, newPlayer];
            await setPlayers(updatedPlayers);
            
            setShowAddForm(false);
            console.log('✅ Player added via protected save');
            
        } catch (error) {
            console.error('❌ Error adding player:', error);
            alert('Error adding player. Please try again.');
        }
    };

    const handleEditPlayer = async (playerId, playerData) => {
        try {
            console.log('👥 Editing player:', playerId, playerData);
            
            // Use protected save function instead of individual API call
            const updatedPlayers = players.map(player => 
                player.id === playerId ? { ...player, ...playerData } : player
            );
            
            // Call the protected save function
            await setPlayers(updatedPlayers);
            
            setEditingPlayer(null);
            console.log('✅ Player updated via protected save');
            
        } catch (error) {
            console.error('❌ Error updating player:', error);
            alert('Error updating player. Please try again.');
        }
    };

    const handleDeletePlayer = async (playerId) => {
        try {
            if (!window.confirm('Are you sure you want to delete this player?')) return;
            
            console.log('👥 Deleting player:', playerId);
            
            // Use protected save function instead of individual API call  
            const updatedPlayers = players.filter(player => player.id !== playerId);
            
            // Call the protected save function
            await setPlayers(updatedPlayers);
            
            console.log('✅ Player deleted via protected save');
            
        } catch (error) {
            console.error('❌ Error deleting player:', error);
            alert('Error deleting player. Please try again.');
        }
    };

    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'No Team';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Players Management</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    <LacrosseIcon name="add" className="mr-2" style={{fontSize: '16px'}} />
                    Add Player
                </button>
            </div>

            {showAddForm && (
                <PlayerForm
                    teams={teams}
                    onSave={handleAddPlayer}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Player</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Team</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Position</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Jersey #</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
                            <th className="text-right px-4 py-3 font-medium text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map(player => (
                            <tr key={player.id} className="border-b hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-slate-800">{player.name}</div>
                                    {player.email && (
                                        <div className="text-sm text-slate-500">{player.email}</div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-600">{getTeamName(player.teamId)}</td>
                                <td className="px-4 py-3 text-slate-600">{player.position || 'Not specified'}</td>
                                <td className="px-4 py-3 text-slate-600">{player.jerseyNumber || '-'}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        player.active !== false 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {player.active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => setEditingPlayer(player)}
                                        className="text-blue-600 hover:text-blue-800 mr-3"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeletePlayer(player.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {players.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        <LacrosseIcon name="players" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                        <p>No players found. Add players to get started.</p>
                    </div>
                )}
            </div>

            {editingPlayer && (
                <PlayerForm
                    teams={teams}
                    player={editingPlayer}
                    onSave={(data) => handleEditPlayer(editingPlayer.id, data)}
                    onCancel={() => setEditingPlayer(null)}
                />
            )}
        </div>
    );
};

// Team Form Component
// Player Form Component  
const PlayerForm = ({ teams, player, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: player?.name || '',
        teamId: player?.teamId || '',
        position: player?.position || '',
        jerseyNumber: player?.jerseyNumber || '',
        email: player?.email || '',
        phone: player?.phone || '',
        handedness: player?.handedness || '',
        details: player?.details || '',
        photoUrl: player?.photoUrl || '',
        // Multiple teams and positions
        additionalTeams: player?.additionalTeams || [],
        additionalPositions: player?.additionalPositions || [],
        // Social media links
        social: {
            instagram: player?.social?.instagram || '',
            twitter: player?.social?.twitter || '',
            facebook: player?.social?.facebook || '',
            linkedin: player?.social?.linkedin || '',
            ...player?.social
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Player name is required');
            return;
        }
        onSave(formData);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File size must be less than 5MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData({...formData, photoUrl: e.target.result});
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {player ? 'Edit Player' : 'Add New Player'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Player Photo Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Player Photo
                    </label>
                    <div className="flex items-start space-x-4">
                        {/* Photo Preview */}
                        <div className="w-32 h-40 border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                            {formData.photoUrl ? (
                                <img 
                                    src={formData.photoUrl} 
                                    alt="Player preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                </div>
                            )}
                        </div>
                        
                        {/* Upload Controls */}
                        <div className="flex-1">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="player-photo-upload"
                            />
                            <label 
                                htmlFor="player-photo-upload"
                                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                                Choose Photo
                            </label>
                            {formData.photoUrl && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, photoUrl: ''})}
                                    className="ml-2 text-red-600 hover:text-red-800 text-sm"
                                >
                                    Remove Photo
                                </button>
                            )}
                            <p className="text-xs text-slate-500 mt-2">
                                Upload a player photo (max 5MB). Recommended size: 300x400px
                            </p>
                        </div>
                    </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Player Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Team
                        </label>
                        <select
                            value={formData.teamId}
                            onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Team</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Position
                        </label>
                        <select
                            value={formData.position}
                            onChange={(e) => setFormData({...formData, position: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Position</option>
                            <option value="Attack">Attack</option>
                            <option value="Midfield">Midfield</option>
                            <option value="Defense">Defense</option>
                            <option value="Goalie">Goalie</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Jersey Number
                        </label>
                        <input
                            type="number"
                            value={formData.jerseyNumber}
                            onChange={(e) => setFormData({...formData, jerseyNumber: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max="99"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Handedness
                        </label>
                        <select
                            value={formData.handedness}
                            onChange={(e) => setFormData({...formData, handedness: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Handedness</option>
                            <option value="Right">Right Handed</option>
                            <option value="Left">Left Handed</option>
                            <option value="Ambidextrous">Ambidextrous</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Player Details */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Player Details
                    </label>
                    <textarea
                        value={formData.details}
                        onChange={(e) => setFormData({...formData, details: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Enter additional player information, achievements, playing style, etc."
                    />
                </div>

                {/* Social Media Links */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        🔗 Social Media Links (Optional)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">📷 Instagram</label>
                            <input
                                type="url"
                                value={formData.social.instagram}
                                onChange={(e) => setFormData({
                                    ...formData, 
                                    social: { ...formData.social, instagram: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                placeholder="https://instagram.com/username"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">🐦 Twitter</label>
                            <input
                                type="url"
                                value={formData.social.twitter}
                                onChange={(e) => setFormData({
                                    ...formData, 
                                    social: { ...formData.social, twitter: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="https://twitter.com/username"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">📘 Facebook</label>
                            <input
                                type="url"
                                value={formData.social.facebook}
                                onChange={(e) => setFormData({
                                    ...formData, 
                                    social: { ...formData.social, facebook: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="https://facebook.com/username"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">💼 LinkedIn</label>
                            <input
                                type="url"
                                value={formData.social.linkedin}
                                onChange={(e) => setFormData({
                                    ...formData, 
                                    social: { ...formData.social, linkedin: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="https://linkedin.com/in/username"
                            />
                        </div>
                    </div>
                </div>

                {/* Multiple Teams & Positions */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        ⚡ Additional Teams & Positions (Optional)
                    </label>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Additional Teams</label>
                            <select
                                multiple
                                value={formData.additionalTeams}
                                onChange={(e) => {
                                    const selectedTeams = Array.from(e.target.selectedOptions, option => option.value);
                                    setFormData({...formData, additionalTeams: selectedTeams});
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                size="3"
                            >
                                {teams.filter(team => team.id !== formData.teamId).map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple teams</p>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Additional Positions</label>
                            <select
                                multiple
                                value={formData.additionalPositions}
                                onChange={(e) => {
                                    const selectedPositions = Array.from(e.target.selectedOptions, option => option.value);
                                    setFormData({...formData, additionalPositions: selectedPositions});
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                size="3"
                            >
                                {['Attack', 'Midfield', 'Defense', 'Goalie'].filter(pos => pos !== formData.position).map(position => (
                                    <option key={position} value={position}>
                                        {position}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple positions</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        {player ? 'Update Player' : 'Add Player'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminPage;