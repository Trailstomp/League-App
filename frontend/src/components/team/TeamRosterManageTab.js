import React, { useState, useEffect } from 'react';

const TeamRosterManageTab = ({ team, currentUser }) => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [message, setMessage] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadPlayers();
    }, [team.id]);

    const loadPlayers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/players`);
            if (response.ok) {
                const data = await response.json();
                setPlayers(data || []);
            }
        } catch (error) {
            console.error('Error loading players:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePlayer = async (playerId) => {
        if (!window.confirm('Remove this player from the team?')) return;
        
        try {
            // Update user to remove team assignment
            const response = await fetch(`${backendUrl}/api/users/${playerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: null,
                    teamAssignments: []
                })
            });

            if (response.ok) {
                setMessage('✅ Player removed from team');
                loadPlayers();
            }
        } catch (error) {
            setMessage('❌ Error removing player');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Manage Roster</h2>
                    <p className="text-slate-600">View and manage players for {team.name}</p>
                    <p className="text-sm text-slate-500 mt-1">
                        To add new players, use the People tab in the Admin Portal
                    </p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Players List */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Current Roster ({players.length} players)</h3>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : players.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">👥</div>
                        <p className="text-slate-600">No players on roster yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {players.map(player => (
                            <div key={player.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                        {player.jerseyNumber || '#'}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-800">{player.name}</div>
                                        <div className="text-sm text-slate-500">
                                            {player.position || 'No position'} • {player.email || 'No email'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemovePlayer(player.id)}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamRosterManageTab;
