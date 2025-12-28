import React, { useState, useEffect } from 'react';

const SeasonManager = ({ teams = [], events = [], websiteStyle = {}, currentUser }) => {
    const [seasons, setSeasons] = useState([]);
    const [newSeason, setNewSeason] = useState({
        name: '',
        startDate: '',
        endDate: '',
        description: '',
        status: 'upcoming' // upcoming, active, completed, archived
    });
    const [editingSeason, setEditingSeason] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load seasons from backend
    useEffect(() => {
        loadSeasons();
    }, []);

    const loadSeasons = async () => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const response = await fetch(`${BACKEND_URL}/api/league-data`);
            if (response.ok) {
                const data = await response.json();
                setSeasons(data.seasons || []);
            }
        } catch (error) {
            console.error('Error loading seasons:', error);
        }
        setLoading(false);
    };

    const saveSeasons = async (updatedSeasons) => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const response = await fetch(`${BACKEND_URL}/api/league-data/seasons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSeasons)
            });
            
            if (response.ok) {
                console.log('✅ Seasons saved successfully');
                return true;
            } else {
                console.error('❌ Failed to save seasons:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Error saving seasons:', error);
            return false;
        }
    };

    const handleAddSeason = async () => {
        if (!newSeason.name.trim()) return;

        const seasonToAdd = {
            id: `season_${Date.now()}`,
            ...newSeason,
            teams: [],  // Add teams array
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.name || 'Admin'
        };

        const updatedSeasons = [...seasons, seasonToAdd];
        setSeasons(updatedSeasons);
        
        if (await saveSeasons(updatedSeasons)) {
            setNewSeason({ name: '', startDate: '', endDate: '', description: '', status: 'upcoming' });
        }
    };

    const handleAddTeamToSeason = async (seasonId, teamId) => {
        const updatedSeasons = seasons.map(s => {
            if (s.id === seasonId) {
                const currentTeams = s.teams || [];
                if (!currentTeams.includes(teamId)) {
                    return { ...s, teams: [...currentTeams, teamId] };
                }
            }
            return s;
        });
        setSeasons(updatedSeasons);
        await saveSeasons(updatedSeasons);
    };

    const handleRemoveTeamFromSeason = async (seasonId, teamId) => {
        const updatedSeasons = seasons.map(s => {
            if (s.id === seasonId) {
                return { ...s, teams: (s.teams || []).filter(t => t !== teamId) };
            }
            return s;
        });
        setSeasons(updatedSeasons);
        await saveSeasons(updatedSeasons);
    };

    const handleEditSeason = (season) => {
        setEditingSeason({ ...season });
    };

    const handleUpdateSeason = async () => {
        if (!editingSeason || !editingSeason.name.trim()) return;

        const updatedSeasons = seasons.map(s => 
            s.id === editingSeason.id ? editingSeason : s
        );
        setSeasons(updatedSeasons);
        
        if (await saveSeasons(updatedSeasons)) {
            setEditingSeason(null);
        }
    };

    const handleDeleteSeason = async (seasonId) => {
        if (!window.confirm('Are you sure you want to delete this season? This cannot be undone.')) return;

        const updatedSeasons = seasons.filter(s => s.id !== seasonId);
        setSeasons(updatedSeasons);
        await saveSeasons(updatedSeasons);
    };

    const handleStatusChange = async (seasonId, newStatus) => {
        const updatedSeasons = seasons.map(s => 
            s.id === seasonId ? { ...s, status: newStatus } : s
        );
        setSeasons(updatedSeasons);
        await saveSeasons(updatedSeasons);
    };

    const getStatusColor = (status) => {
        const colors = {
            upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
            active: 'bg-green-100 text-green-800 border-green-200',
            completed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            archived: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[status] || colors.upcoming;
    };

    const getStatusIcon = (status) => {
        const icons = {
            upcoming: '📅',
            active: '▶️',
            completed: '✅',
            archived: '📦'
        };
        return icons[status] || '📅';
    };

    // Calculate season statistics
    const getSeasonStats = (season) => {
        const seasonEvents = events.filter(event => event.season === season.name);
        const seasonTeams = new Set(seasonEvents.flatMap(event => event.teamIds || [])).size;
        
        return {
            events: seasonEvents.length,
            teams: seasonTeams,
            games: seasonEvents.filter(e => e.type === 'game').length,
            tournaments: seasonEvents.filter(e => e.type === 'tournament').length
        };
    };

    if (loading) {
        return <div className="text-center py-8">Loading seasons...</div>;
    }

    return (
        <div className="season-manager bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">📅 Season Management</h2>
                <p className="text-gray-600">
                    Manage league seasons and track season progress
                </p>
            </div>

            {/* Seasons Content Only - Leagues removed */}
            <div className="seasons-content">

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-800">{seasons.length}</div>
                    <div className="text-sm text-blue-600">Total Seasons</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-800">
                        {seasons.filter(s => s.status === 'active').length}
                    </div>
                    <div className="text-sm text-green-600">Active Seasons</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-800">
                        {seasons.filter(s => s.status === 'upcoming').length}
                    </div>
                    <div className="text-sm text-yellow-600">Upcoming Seasons</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-800">
                        {seasons.filter(s => s.status === 'completed').length}
                    </div>
                    <div className="text-sm text-purple-600">Completed Seasons</div>
                </div>
            </div>

            {/* Add New Season */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">➕ Add New Season</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Season Name *</label>
                        <input
                            type="text"
                            value={newSeason.name}
                            onChange={(e) => setNewSeason(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Spring 2025, Fall 2024"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={newSeason.status}
                            onChange={(e) => setNewSeason(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="upcoming">📅 Upcoming</option>
                            <option value="active">▶️ Active</option>
                            <option value="completed">✅ Completed</option>
                            <option value="archived">📦 Archived</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={newSeason.startDate}
                            onChange={(e) => setNewSeason(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={newSeason.endDate}
                            onChange={(e) => setNewSeason(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={newSeason.description}
                            onChange={(e) => setNewSeason(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="Season description or notes..."
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleAddSeason}
                        disabled={!newSeason.name.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ➕ Add Season
                    </button>
                </div>
            </div>

            {/* Seasons List */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    All Seasons ({seasons.length})
                </h3>
                
                {seasons.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No seasons created yet. Add your first season above.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {seasons.map(season => {
                            const stats = getSeasonStats(season);
                            return (
                                <div key={season.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <span className="text-lg mr-2">{getStatusIcon(season.status)}</span>
                                                <h4 className="font-semibold text-gray-800">{season.name}</h4>
                                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(season.status)}`}>
                                                    {season.status}
                                                </span>
                                            </div>
                                            
                                            <div className="text-sm text-gray-600 mb-2">
                                                {season.startDate && season.endDate && (
                                                    <span>📅 {season.startDate} → {season.endDate}</span>
                                                )}
                                            </div>
                                            
                                            {season.description && (
                                                <div className="text-sm text-gray-500 mb-2">
                                                    {season.description}
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
                                                onClick={() => handleEditSeason(season)}
                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded text-sm"
                                                title="Edit season"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSeason(season.id)}
                                                className="p-1 text-red-600 hover:bg-red-100 rounded text-sm"
                                                title="Delete season"
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

            {/* Edit Season Modal */}
            {editingSeason && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">✏️ Edit Season</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingSeason.name}
                                    onChange={(e) => setEditingSeason(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={editingSeason.status}
                                    onChange={(e) => setEditingSeason(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="upcoming">📅 Upcoming</option>
                                    <option value="active">▶️ Active</option>
                                    <option value="completed">✅ Completed</option>
                                    <option value="archived">📦 Archived</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={editingSeason.startDate || ''}
                                    onChange={(e) => setEditingSeason(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={editingSeason.endDate || ''}
                                    onChange={(e) => setEditingSeason(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={editingSeason.description || ''}
                                    onChange={(e) => setEditingSeason(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="2"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setEditingSeason(null)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateSeason}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                💾 Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
                </div>
        </div>
    );
};

export default SeasonManager;