import React, { useState } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';

const AdminPage = ({ teams, setTeams, players, setPlayers, currentUser }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Admin tabs configuration
    const adminTabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'venue' },
        { id: 'seasons', label: 'Seasons', icon: 'trophy' },
        { id: 'teams', label: 'Teams', icon: 'teams' },
        { id: 'players', label: 'Players', icon: 'players' },
        { id: 'locations', label: 'Locations', icon: 'location' },
        { id: 'users', label: 'Users & Security', icon: 'admin' },
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
                return <AdminDashboard teams={teams} players={players} />;
            case 'teams':
                return <TeamsManager teams={teams} setTeams={setTeams} />;
            case 'players':
                return <PlayersManager teams={teams} players={players} setPlayers={setPlayers} />;
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
const AdminDashboard = ({ teams, players }) => {
    const stats = {
        totalTeams: teams.length,
        totalPlayers: players.length,
        activeTeams: teams.filter(t => t.active !== false).length,
        activePlayers: players.filter(p => p.active !== false).length,
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
                        <LacrosseIcon name="active" className="text-purple-600 mr-3" style={{fontSize: '24px'}} />
                        <div>
                            <div className="text-2xl font-bold text-purple-900">{stats.activeTeams}</div>
                            <div className="text-sm text-purple-700">Active Teams</div>
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <LacrosseIcon name="active" className="text-orange-600 mr-3" style={{fontSize: '24px'}} />
                        <div>
                            <div className="text-2xl font-bold text-orange-900">{stats.activePlayers}</div>
                            <div className="text-sm text-orange-700">Active Players</div>
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
const TeamsManager = ({ teams, setTeams }) => {
    const [editingTeam, setEditingTeam] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddTeam = (teamData) => {
        const newTeam = {
            id: Date.now().toString(),
            ...teamData,
            wins: 0,
            losses: 0,
            ties: 0,
            active: true,
        };
        setTeams([...teams, newTeam]);
        setShowAddForm(false);
    };

    const handleEditTeam = (teamId, teamData) => {
        setTeams(teams.map(team => 
            team.id === teamId ? { ...team, ...teamData } : team
        ));
        setEditingTeam(null);
    };

    const handleDeleteTeam = (teamId) => {
        if (window.confirm('Are you sure you want to delete this team?')) {
            setTeams(teams.filter(team => team.id !== teamId));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Teams Management</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <LacrosseIcon name="add" className="mr-2" style={{fontSize: '16px'}} />
                    Add Team
                </button>
            </div>

            {showAddForm && (
                <TeamForm
                    onSave={handleAddTeam}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Team</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Division</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Record</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Coach</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
                            <th className="text-right px-4 py-3 font-medium text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map(team => (
                            <tr key={team.id} className="border-b hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-slate-200 rounded mr-3 flex-shrink-0"></div>
                                        <div className="font-medium text-slate-800">{team.name}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{team.division || 'Field'}</td>
                                <td className="px-4 py-3 text-slate-600">
                                    {team.wins || 0}-{team.losses || 0}-{team.ties || 0}
                                </td>
                                <td className="px-4 py-3 text-slate-600">{team.coach || 'Not assigned'}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        team.active !== false 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {team.active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => setEditingTeam(team)}
                                        className="text-blue-600 hover:text-blue-800 mr-3"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTeam(team.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingTeam && (
                <TeamForm
                    team={editingTeam}
                    onSave={(data) => handleEditTeam(editingTeam.id, data)}
                    onCancel={() => setEditingTeam(null)}
                />
            )}
        </div>
    );
};

// Players Manager Component
const PlayersManager = ({ teams, players, setPlayers }) => {
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddPlayer = (playerData) => {
        const newPlayer = {
            id: Date.now().toString(),
            ...playerData,
            active: true,
        };
        setPlayers([...players, newPlayer]);
        setShowAddForm(false);
    };

    const handleEditPlayer = (playerId, playerData) => {
        setPlayers(players.map(player => 
            player.id === playerId ? { ...player, ...playerData } : player
        ));
        setEditingPlayer(null);
    };

    const handleDeletePlayer = (playerId) => {
        if (window.confirm('Are you sure you want to delete this player?')) {
            setPlayers(players.filter(player => player.id !== playerId));
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
const TeamForm = ({ team, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: team?.name || '',
        division: team?.division || 'Field',
        coach: team?.coach || '',
        homeField: team?.homeField || '',
        contactEmail: team?.contactEmail || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Team name is required');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {team ? 'Edit Team' : 'Add New Team'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Team Name *
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
                            Division
                        </label>
                        <select
                            value={formData.division}
                            onChange={(e) => setFormData({...formData, division: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Field">Field Lacrosse</option>
                            <option value="Box">Box Lacrosse</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Coach
                        </label>
                        <input
                            type="text"
                            value={formData.coach}
                            onChange={(e) => setFormData({...formData, coach: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Home Field
                        </label>
                        <input
                            type="text"
                            value={formData.homeField}
                            onChange={(e) => setFormData({...formData, homeField: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Contact Email
                        </label>
                        <input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {team ? 'Update Team' : 'Add Team'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Player Form Component  
const PlayerForm = ({ teams, player, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: player?.name || '',
        teamId: player?.teamId || '',
        position: player?.position || '',
        jerseyNumber: player?.jerseyNumber || '',
        email: player?.email || '',
        phone: player?.phone || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Player name is required');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {player ? 'Edit Player' : 'Add New Player'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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