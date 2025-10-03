import React, { useState, useEffect } from 'react';

const TeamStatsDisplay = ({ teamId }) => {
    const [stats, setStats] = useState(null);
    const [playerStats, setPlayerStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(null);
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        loadSeasons();
    }, []);

    useEffect(() => {
        if (teamId && selectedSeason) {
            loadStats();
        }
    }, [teamId, selectedSeason]);

    const loadSeasons = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/seasons`);
            const data = await response.json();
            setSeasons(data.seasons || []);
            
            // Set active season as default
            const activeSeason = data.seasons.find(s => s.is_active);
            if (activeSeason) {
                setSelectedSeason(activeSeason.id);
            } else if (data.seasons.length > 0) {
                setSelectedSeason(data.seasons[0].id);
            }
        } catch (error) {
            console.error('Error loading seasons:', error);
        }
    };

    const loadStats = async () => {
        try {
            const seasonParam = selectedSeason ? `?season_id=${selectedSeason}` : '';
            const [teamResponse, playerResponse] = await Promise.all([
                fetch(`${BACKEND_URL}/api/teams/${teamId}/season-stats${seasonParam}`),
                fetch(`${BACKEND_URL}/api/teams/${teamId}/player-stats${seasonParam}`)
            ]);
            
            const teamData = await teamResponse.json();
            const playerData = await playerResponse.json();
            
            setStats(teamData);
            setPlayerStats(playerData);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading stats...</div>;
    }

    if (!stats || stats.games_played === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Stats Yet</h3>
                <p className="text-gray-500">This team hasn't played any games yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Team Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('players')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'players'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Player Stats
                    </button>
                    <button
                        onClick={() => setActiveTab('goalies')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'goalies'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Goalie Stats
                    </button>
                </nav>
            </div>

            {/* Team Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                        <div className="text-sm text-gray-600 mb-1">Record</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.wins}-{stats.losses}-{stats.ties}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                        <div className="text-sm text-gray-600 mb-1">Points</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.points}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                        <div className="text-sm text-gray-600 mb-1">Goals For</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.goals_for}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                        <div className="text-sm text-gray-600 mb-1">Goals Against</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.goals_against}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                        <div className="text-sm text-gray-600 mb-1">Goal Diff</div>
                        <div className={`text-2xl font-bold ${
                            stats.goal_diff > 0 ? 'text-green-600' : 
                            stats.goal_diff < 0 ? 'text-red-600' : 
                            'text-gray-600'
                        }`}>
                            {stats.goal_diff > 0 ? '+' : ''}{stats.goal_diff}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
                        <div className="text-sm text-gray-600 mb-1">Games Played</div>
                        <div className="text-2xl font-bold text-gray-900">{stats.games_played}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                        <div className="text-sm text-gray-600 mb-1">Win %</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {((stats.wins / stats.games_played) * 100).toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                        <div className="text-sm text-gray-600 mb-1">Avg Goals/Game</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {(stats.goals_for / stats.games_played).toFixed(1)}
                        </div>
                    </div>
                </div>
            )}

            {/* Player Stats Tab */}
            {activeTab === 'players' && playerStats && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">GP</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">W-L-T</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Goals</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Shots</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Shot %</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">GB</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {playerStats.players
                                    .sort((a, b) => b.goals - a.goals)
                                    .map(player => (
                                    <tr key={player.player_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{player.player_name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-700">{player.games_played}</td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                                            {player.wins}-{player.losses}-{player.ties}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-semibold text-blue-600">{player.goals}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-700">{player.shots}</td>
                                        <td className="px-6 py-4 text-center text-gray-700">
                                            {player.shots > 0 ? ((player.goals / player.shots) * 100).toFixed(1) : '0.0'}%
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-700">{player.ground_balls}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Goalie Stats Tab */}
            {activeTab === 'goalies' && playerStats && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Goalie</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">GP</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">W-L-T</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Minutes</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Periods</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Saves</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">SOG</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Save %</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">GA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {playerStats.goalies
                                    .sort((a, b) => b.save_percentage - a.save_percentage)
                                    .map(goalie => (
                                    <tr key={goalie.player_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{goalie.player_name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-700">{goalie.games_played}</td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                                            {goalie.wins}-{goalie.losses}-{goalie.ties}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-700">{goalie.total_minutes}</td>
                                        <td className="px-6 py-4 text-center text-gray-700">{goalie.total_periods}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-semibold text-green-600">{goalie.saves}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-700">{goalie.shots_on_goal}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-semibold text-blue-600">{goalie.save_percentage}%</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-700">{goalie.goals_allowed}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamStatsDisplay;