import React, { useState, useEffect } from 'react';

const LeagueManager = ({ teams = [], events = [], websiteStyle = {}, currentUser }) => {
    const [leagues, setLeagues] = useState([]);
    const [newLeague, setNewLeague] = useState({
        name: '',
        division: '',
        description: '',
        status: 'active' // active, inactive, archived
    });
    const [editingLeague, setEditingLeague] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load leagues from backend
    useEffect(() => {
        loadLeagues();
    }, []);

    const loadLeagues = async () => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const response = await fetch(`${BACKEND_URL}/api/league-data`);
            if (response.ok) {
                const data = await response.json();
                setLeagues(data.leagues || []);
            }
        } catch (error) {
            console.error('Error loading leagues:', error);
        }
        setLoading(false);
    };

    const saveLeagues = async (updatedLeagues) => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const response = await fetch(`${BACKEND_URL}/api/league-data/leagues`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLeagues)
            });
            
            if (response.ok) {
                console.log('✅ Leagues saved successfully');
                return true;
            } else {
                console.error('❌ Failed to save leagues:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Error saving leagues:', error);
            return false;
        }
    };

    const handleAddLeague = async () => {
        if (!newLeague.name.trim()) return;

        const leagueToAdd = {
            id: `league_${Date.now()}`,
            ...newLeague,
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.name || 'Admin'
        };

        const updatedLeagues = [...leagues, leagueToAdd];
        setLeagues(updatedLeagues);
        
        if (await saveLeagues(updatedLeagues)) {
            setNewLeague({ name: '', division: '', description: '', status: 'active' });
        }
    };

    const handleEditLeague = (league) => {
        setEditingLeague({ ...league });
    };

    const handleUpdateLeague = async () => {
        if (!editingLeague || !editingLeague.name.trim()) return;

        const updatedLeagues = leagues.map(l => 
            l.id === editingLeague.id ? editingLeague : l
        );
        setLeagues(updatedLeagues);
        
        if (await saveLeagues(updatedLeagues)) {
            setEditingLeague(null);
        }
    };

    const handleDeleteLeague = async (leagueId) => {
        if (!window.confirm('Are you sure you want to delete this league? This cannot be undone.')) return;

        const updatedLeagues = leagues.filter(l => l.id !== leagueId);
        setLeagues(updatedLeagues);
        await saveLeagues(updatedLeagues);
    };

    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800 border-green-200',
            inactive: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            archived: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[status] || colors.active;
    };

    const getStatusIcon = (status) => {
        const icons = {
            active: '🏆',
            inactive: '⏸️',
            archived: '📦'
        };
        return icons[status] || '🏆';
    };

    // Calculate league statistics
    const getLeagueStats = (league) => {
        const leagueEvents = events.filter(event => event.league === league.name);
        const leagueTeams = new Set(leagueEvents.flatMap(event => event.teamIds || [])).size;
        
        return {
            events: leagueEvents.length,
            teams: leagueTeams,
            games: leagueEvents.filter(e => e.type === 'game').length,
            tournaments: leagueEvents.filter(e => e.type === 'tournament').length
        };
    };

    if (loading) {
        return <div className="text-center py-8">Loading leagues...</div>;
    }

    return (
        <div className="league-manager bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🏆 League Management</h2>
                <p className="text-gray-600">
                    Manage leagues, divisions, and competition levels
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-800">{leagues.length}</div>
                    <div className="text-sm text-blue-600">Total Leagues</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-800">
                        {leagues.filter(l => l.status === 'active').length}
                    </div>
                    <div className="text-sm text-green-600">Active Leagues</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-800">
                        {leagues.filter(l => l.status === 'inactive').length}
                    </div>
                    <div className="text-sm text-yellow-600">Inactive Leagues</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-800">
                        {new Set(leagues.map(l => l.division).filter(Boolean)).size}
                    </div>
                    <div className="text-sm text-purple-600">Divisions</div>
                </div>
            </div>

            {/* Add New League */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">➕ Add New League</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">League Name *</label>
                        <input
                            type="text"
                            value={newLeague.name}
                            onChange={(e) => setNewLeague(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Recreational, Competitive, Championship"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Division/Level</label>
                        <input
                            type="text"
                            value={newLeague.division}
                            onChange={(e) => setNewLeague(prev => ({ ...prev, division: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Division A, Premier, Youth"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={newLeague.status}
                            onChange={(e) => setNewLeague(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="active">🏆 Active</option>
                            <option value="inactive">⏸️ Inactive</option>
                            <option value="archived">📦 Archived</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={newLeague.description}
                            onChange={(e) => setNewLeague(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="League description or rules..."
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleAddLeague}
                        disabled={!newLeague.name.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ➕ Add League
                    </button>
                </div>
            </div>

            {/* Leagues List */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    All Leagues ({leagues.length})
                </h3>
                
                {leagues.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No leagues created yet. Add your first league above.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {leagues.map(league => {
                            const stats = getLeagueStats(league);
                            return (
                                <div key={league.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <span className="text-lg mr-2">{getStatusIcon(league.status)}</span>
                                                <h4 className="font-semibold text-gray-800">{league.name}</h4>
                                                {league.division && (
                                                    <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {league.division}
                                                    </span>
                                                )}
                                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(league.status)}`}>
                                                    {league.status}
                                                </span>
                                            </div>
                                            
                                            {league.description && (
                                                <div className="text-sm text-gray-500 mb-2">
                                                    {league.description}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <span>📊 {stats.events} events</span>
                                                <span>🏆 {stats.teams} teams</span>
                                                <span>🥍 {stats.games} games</span>
                                                <span>🏆 {stats.tournaments} tournaments</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex space-x-1 ml-4">
                                            <button
                                                onClick={() => handleEditLeague(league)}
                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded text-sm"
                                                title="Edit league"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLeague(league.id)}
                                                className="p-1 text-red-600 hover:bg-red-100 rounded text-sm"
                                                title="Delete league"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Edit League Modal */}
            {editingLeague && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">✏️ Edit League</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingLeague.name}
                                    onChange={(e) => setEditingLeague(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Division/Level</label>
                                <input
                                    type="text"
                                    value={editingLeague.division || ''}
                                    onChange={(e) => setEditingLeague(prev => ({ ...prev, division: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={editingLeague.status}
                                    onChange={(e) => setEditingLeague(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="active">🏆 Active</option>
                                    <option value="inactive">⏸️ Inactive</option>
                                    <option value="archived">📦 Archived</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={editingLeague.description || ''}
                                    onChange={(e) => setEditingLeague(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="2"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setEditingLeague(null)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateLeague}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                💾 Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeagueManager;