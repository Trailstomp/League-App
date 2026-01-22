import React, { useState, useEffect } from 'react';
import { getSportConfig, SPORTS } from '../../config/sportsConfig';

const LiveStatsEntry = ({ event, teams, onSubmit, onCancel, sportType = 'lacrosse' }) => {
    // Get sport-specific configuration
    const sportConfig = getSportConfig(sportType);
    
    const [gameState, setGameState] = useState({
        home_team: { id: '', name: '', score: 0, players: [] },
        away_team: { id: '', name: '', score: 0, players: [] },
        current_period: 1,
        time_remaining: '15:00',
        is_running: false
    });

    const [activeTab, setActiveTab] = useState('scoreboard'); // scoreboard, home_stats, away_stats
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [statEntry, setStatEntry] = useState({ type: 'goal', player: null });
    const [loading, setLoading] = useState(false);

    // Get sport-specific stat types with colors
    const getStatTypes = () => {
        const baseStats = [
            { key: 'penalty', label: '⚠️ Penalty', color: 'bg-red-100 text-red-800' }
        ];
        
        // Sport-specific scoring actions
        const sportStats = sportConfig.scoringActions.map(action => ({
            key: action.id,
            label: `${action.emoji} ${action.name}`,
            color: action.id === 'goal' || action.id === 'kill' || action.id === 'ace' 
                ? 'bg-green-100 text-green-800'
                : action.id === 'save' || action.id === 'block' || action.id === 'dig'
                ? 'bg-purple-100 text-purple-800'
                : action.id === 'miss' || action.id === 'error'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-800',
            points: action.points
        }));
        
        // Add assist for non-volleyball sports
        if (sportType !== 'volleyball') {
            sportStats.push({ key: 'assist', label: '🎯 Assist', color: 'bg-blue-100 text-blue-800', points: 0 });
        }
        
        // Add shot for goal-based sports
        if (['lacrosse', 'hockey', 'soccer'].includes(sportType)) {
            sportStats.push({ key: 'shot', label: '🏹 Shot', color: 'bg-yellow-100 text-yellow-800', points: 0 });
        }
        
        return [...sportStats, ...baseStats];
    };
    
    const statTypes = getStatTypes();

    // Mock player data - this would come from teams prop in real implementation
    const getMockPlayers = (teamId) => {
        // Use sport-specific positions
        const positions = sportConfig.positions.slice(0, 6);
        return positions.map((pos, index) => ({
            id: String(index + 1),
            name: `Player ${index + 1}`,
            number: String((index + 1) * 5),
            position: pos.name
        }));
    };

    // Initialize teams and players
    useEffect(() => {
        if (event && event.teams && event.teams.length >= 2) {
            setGameState(prev => ({
                ...prev,
                home_team: {
                    id: event.teams[0],
                    name: getTeamName(event.teams[0]),
                    score: 0,
                    players: getMockPlayers(event.teams[0]).map(p => ({
                        ...p,
                        stats: { goals: 0, assists: 0, shots: 0, saves: 0, penalties: 0 }
                    }))
                },
                away_team: {
                    id: event.teams[1],
                    name: getTeamName(event.teams[1]),
                    score: 0,
                    players: getMockPlayers(event.teams[1]).map(p => ({
                        ...p,
                        stats: { goals: 0, assists: 0, shots: 0, saves: 0, penalties: 0 }
                    }))
                }
            }));
        }
    }, [event]);

    const getTeamName = (teamId) => {
        const team = teams?.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    const statTypes = [
        { key: 'goal', label: '⚽ Goal', color: 'bg-green-100 text-green-800' },
        { key: 'assist', label: '🎯 Assist', color: 'bg-blue-100 text-blue-800' },
        { key: 'shot', label: '🏹 Shot', color: 'bg-yellow-100 text-yellow-800' },
        { key: 'save', label: '🥅 Save', color: 'bg-purple-100 text-purple-800' },
        { key: 'penalty', label: '⚠️ Penalty', color: 'bg-red-100 text-red-800' }
    ];

    const addStat = (teamKey, playerId, statType) => {
        setGameState(prev => ({
            ...prev,
            [teamKey]: {
                ...prev[teamKey],
                players: prev[teamKey].players.map(player => {
                    if (player.id === playerId) {
                        const newStats = { ...player.stats };
                        if (statType === 'goal') {
                            newStats.goals += 1;
                        } else if (statType === 'assist') {
                            newStats.assists += 1;
                        } else if (statType === 'shot') {
                            newStats.shots += 1;
                        } else if (statType === 'save') {
                            newStats.saves += 1;
                        } else if (statType === 'penalty') {
                            newStats.penalties += 1;
                        }
                        return { ...player, stats: newStats };
                    }
                    return player;
                })
            }
        }));

        // Auto-update team score for goals
        if (statType === 'goal') {
            setGameState(prev => ({
                ...prev,
                [teamKey]: {
                    ...prev[teamKey],
                    score: prev[teamKey].score + 1
                }
            }));
        }
    };

    const removeStat = (teamKey, playerId, statType) => {
        setGameState(prev => ({
            ...prev,
            [teamKey]: {
                ...prev[teamKey],
                players: prev[teamKey].players.map(player => {
                    if (player.id === playerId) {
                        const newStats = { ...player.stats };
                        if (statType === 'goal' && newStats.goals > 0) {
                            newStats.goals -= 1;
                            // Also decrease team score
                            setGameState(p => ({
                                ...p,
                                [teamKey]: { ...p[teamKey], score: Math.max(0, p[teamKey].score - 1) }
                            }));
                        } else if (statType === 'assist' && newStats.assists > 0) {
                            newStats.assists -= 1;
                        } else if (statType === 'shot' && newStats.shots > 0) {
                            newStats.shots -= 1;
                        } else if (statType === 'save' && newStats.saves > 0) {
                            newStats.saves -= 1;
                        } else if (statType === 'penalty' && newStats.penalties > 0) {
                            newStats.penalties -= 1;
                        }
                        return { ...player, stats: newStats };
                    }
                    return player;
                })
            }
        }));
    };

    const renderScoreboard = () => (
        <div className="space-y-6">
            {/* Game Clock */}
            <div className="text-center bg-gray-900 text-white rounded-lg p-6">
                <div className="text-4xl font-bold mb-2">{gameState.time_remaining}</div>
                <div className="text-lg">Period {gameState.current_period}</div>
                <button
                    onClick={() => setGameState(prev => ({ ...prev, is_running: !prev.is_running }))}
                    className={`mt-3 px-4 py-2 rounded font-medium ${
                        gameState.is_running 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                >
                    {gameState.is_running ? '⏸️ Pause' : '▶️ Start'}
                </button>
            </div>

            {/* Score Display */}
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <div className="text-lg font-semibold text-blue-900 mb-2">
                        {gameState.home_team.name}
                    </div>
                    <div className="text-6xl font-bold text-blue-600">
                        {gameState.home_team.score}
                    </div>
                    <div className="text-sm text-blue-700 mt-2">HOME</div>
                </div>

                <div className="flex items-center justify-center text-4xl font-bold text-gray-400">
                    VS
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                    <div className="text-lg font-semibold text-red-900 mb-2">
                        {gameState.away_team.name}
                    </div>
                    <div className="text-6xl font-bold text-red-600">
                        {gameState.away_team.score}
                    </div>
                    <div className="text-sm text-red-700 mt-2">AWAY</div>
                </div>
            </div>

            {/* Quick Stats Entry */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Stat Entry</h3>
                <div className="grid grid-cols-2 gap-6">
                    {/* Home Team Quick Entry */}
                    <div>
                        <h4 className="font-medium text-blue-900 mb-3">{gameState.home_team.name}</h4>
                        <div className="space-y-2">
                            {statTypes.map(stat => (
                                <button
                                    key={stat.key}
                                    onClick={() => {
                                        // Quick add to first player for demo
                                        if (gameState.home_team.players[0]) {
                                            addStat('home_team', gameState.home_team.players[0].id, stat.key);
                                        }
                                    }}
                                    className={`w-full px-3 py-2 rounded text-sm font-medium ${stat.color} hover:opacity-80`}
                                >
                                    {stat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Away Team Quick Entry */}
                    <div>
                        <h4 className="font-medium text-red-900 mb-3">{gameState.away_team.name}</h4>
                        <div className="space-y-2">
                            {statTypes.map(stat => (
                                <button
                                    key={stat.key}
                                    onClick={() => {
                                        // Quick add to first player for demo
                                        if (gameState.away_team.players[0]) {
                                            addStat('away_team', gameState.away_team.players[0].id, stat.key);
                                        }
                                    }}
                                    className={`w-full px-3 py-2 rounded text-sm font-medium ${stat.color} hover:opacity-80`}
                                >
                                    {stat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPlayerStats = (teamKey, teamData) => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">{teamData.name} - Player Statistics</h3>
            
            <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">#</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Player</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Pos</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">G</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">A</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">S</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Sv</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">P</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {teamData.players.map(player => (
                            <tr key={player.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium">{player.number}</td>
                                <td className="px-4 py-3 text-sm">{player.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{player.position}</td>
                                <td className="px-4 py-3 text-sm text-center font-medium text-green-600">
                                    {player.stats.goals}
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-medium text-blue-600">
                                    {player.stats.assists}
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-medium text-yellow-600">
                                    {player.stats.shots}
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-medium text-purple-600">
                                    {player.stats.saves}
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-medium text-red-600">
                                    {player.stats.penalties}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex justify-center gap-1">
                                        {statTypes.map(stat => (
                                            <div key={stat.key} className="flex">
                                                <button
                                                    onClick={() => addStat(teamKey, player.id, stat.key)}
                                                    className="w-6 h-6 bg-green-100 text-green-600 rounded-l text-xs hover:bg-green-200"
                                                    title={`Add ${stat.label}`}
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => removeStat(teamKey, player.id, stat.key)}
                                                    className="w-6 h-6 bg-red-100 text-red-600 rounded-r text-xs hover:bg-red-200"
                                                    title={`Remove ${stat.label}`}
                                                >
                                                    -
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const handleSubmit = async () => {
        try {
            setLoading(true);

            const gameData = {
                home_team: {
                    id: gameState.home_team.id,
                    name: gameState.home_team.name,
                    score: gameState.home_team.score,
                    players: gameState.home_team.players
                },
                away_team: {
                    id: gameState.away_team.id,
                    name: gameState.away_team.name,
                    score: gameState.away_team.score,
                    players: gameState.away_team.players
                },
                final_score: `${gameState.home_team.score}-${gameState.away_team.score}`,
                winner: gameState.home_team.score > gameState.away_team.score ? gameState.home_team : gameState.away_team,
                entry_type: 'live_stats',
                entry_time: new Date().toISOString(),
                game_duration: gameState.current_period,
                detailed_stats: true
            };

            await onSubmit(gameData);
        } catch (error) {
            console.error('❌ Error submitting live stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                        <div className="text-sm text-gray-600">
                            📅 {event.date} • 🕒 {event.time} • 📍 {event.location}
                        </div>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('scoreboard')}
                            className={`px-4 py-2 rounded text-sm font-medium ${
                                activeTab === 'scoreboard' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            📊 Scoreboard
                        </button>
                        <button
                            onClick={() => setActiveTab('home_stats')}
                            className={`px-4 py-2 rounded text-sm font-medium ${
                                activeTab === 'home_stats' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            🏠 {gameState.home_team.name}
                        </button>
                        <button
                            onClick={() => setActiveTab('away_stats')}
                            className={`px-4 py-2 rounded text-sm font-medium ${
                                activeTab === 'away_stats' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            ✈️ {gameState.away_team.name}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'scoreboard' && renderScoreboard()}
                {activeTab === 'home_stats' && renderPlayerStats('home_team', gameState.home_team)}
                {activeTab === 'away_stats' && renderPlayerStats('away_team', gameState.away_team)}
            </div>

            {/* Actions */}
            <div className="bg-white border-t px-6 py-4">
                <div className="flex justify-between items-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setGameState(prev => ({
                                ...prev,
                                home_team: { ...prev.home_team, score: 0, players: prev.home_team.players.map(p => ({ ...p, stats: { goals: 0, assists: 0, shots: 0, saves: 0, penalties: 0 } })) },
                                away_team: { ...prev.away_team, score: 0, players: prev.away_team.players.map(p => ({ ...p, stats: { goals: 0, assists: 0, shots: 0, saves: 0, penalties: 0 } })) }
                            }))}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                            🔄 Reset Game
                        </button>
                        
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : '✅ Save Game Stats'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveStatsEntry;