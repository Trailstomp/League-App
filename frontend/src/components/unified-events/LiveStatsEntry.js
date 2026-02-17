import React, { useState, useEffect, useRef } from 'react';
import { getSportConfig, SPORTS } from '../../config/sportsConfig';

const LiveStatsEntry = ({ event, teams, onSubmit, onCancel, sportType = 'lacrosse' }) => {
    const sportConfig = getSportConfig(sportType);
    
    const [gameState, setGameState] = useState({
        home_team: { id: '', name: '', score: 0, players: [] },
        away_team: { id: '', name: '', score: 0, players: [] },
        current_period: 1,
        time_remaining: '15:00',
        shot_clock: 30,
        is_running: false
    });

    const [activeTab, setActiveTab] = useState('scoreboard');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [statEntry, setStatEntry] = useState({ type: 'goal', player: null });
    const [loading, setLoading] = useState(false);
    const [showGameClock, setShowGameClock] = useState(true);
    const [showShotClock, setShowShotClock] = useState(false);
    const timerRef = useRef(null);

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

    // Initialize teams and players with sport-specific stats
    useEffect(() => {
        if (event && event.teams && event.teams.length >= 2) {
            // Create initial stats object based on sport
            const createInitialStats = () => {
                const stats = { penalties: 0 };
                statTypes.forEach(stat => {
                    if (stat.key !== 'penalty') {
                        stats[stat.key + 's'] = 0; // goals, assists, shots, saves, kills, aces, blocks, etc.
                    }
                });
                return stats;
            };
            
            setGameState(prev => ({
                ...prev,
                home_team: {
                    id: event.teams[0],
                    name: getTeamName(event.teams[0]),
                    score: 0,
                    players: getMockPlayers(event.teams[0]).map(p => ({
                        ...p,
                        stats: createInitialStats()
                    }))
                },
                away_team: {
                    id: event.teams[1],
                    name: getTeamName(event.teams[1]),
                    score: 0,
                    players: getMockPlayers(event.teams[1]).map(p => ({
                        ...p,
                        stats: createInitialStats()
                    }))
                }
            }));
        }
    }, [event, sportType]);

    const getTeamName = (teamId) => {
        const team = teams?.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    // Get the stat key for storage (adds 's' for plural)
    const getStatKey = (statType) => {
        if (statType === 'penalty') return 'penalties';
        return statType + 's';
    };
    
    // Check if this stat type scores points
    const isScoringStat = (statType) => {
        const stat = statTypes.find(s => s.key === statType);
        return stat && stat.points > 0;
    };

    const addStat = (teamKey, playerId, statType) => {
        const statKey = getStatKey(statType);
        
        setGameState(prev => ({
            ...prev,
            [teamKey]: {
                ...prev[teamKey],
                players: prev[teamKey].players.map(player => {
                    if (player.id === playerId) {
                        const newStats = { ...player.stats };
                        newStats[statKey] = (newStats[statKey] || 0) + 1;
                        return { ...player, stats: newStats };
                    }
                    return player;
                })
            }
        }));

        // Auto-update team score for scoring stats (goals, kills, aces, blocks in volleyball)
        if (isScoringStat(statType)) {
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
        const statKey = getStatKey(statType);
        
        setGameState(prev => {
            const updatedState = {
                ...prev,
                [teamKey]: {
                    ...prev[teamKey],
                    players: prev[teamKey].players.map(player => {
                        if (player.id === playerId) {
                            const newStats = { ...player.stats };
                            if ((newStats[statKey] || 0) > 0) {
                                newStats[statKey] -= 1;
                            }
                            return { ...player, stats: newStats };
                        }
                        return player;
                    })
                }
            };
            
            // Also decrease team score for scoring stats
            if (isScoringStat(statType) && prev[teamKey].score > 0) {
                updatedState[teamKey].score = prev[teamKey].score - 1;
            }
            
            return updatedState;
        });
    };

    const renderScoreboard = () => (
        <div className="space-y-3">
            {/* Clock Options Row */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border" data-testid="clock-options-row">
                <div className="flex items-center gap-1">
                    <span className="text-lg">{sportConfig.icon}</span>
                    <span className="text-sm font-medium text-gray-600">{sportConfig.name}</span>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer" data-testid="game-clock-toggle">
                        <span className="text-xs font-medium text-gray-600">Game Clock</span>
                        <button
                            onClick={() => setShowGameClock(!showGameClock)}
                            className={`relative w-9 h-5 rounded-full transition-colors ${showGameClock ? 'bg-green-500' : 'bg-gray-300'}`}
                            data-testid="game-clock-toggle-btn"
                        >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showGameClock ? 'translate-x-4' : ''}`} />
                        </button>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer" data-testid="shot-clock-toggle">
                        <span className="text-xs font-medium text-gray-600">Shot Clock</span>
                        <button
                            onClick={() => setShowShotClock(!showShotClock)}
                            className={`relative w-9 h-5 rounded-full transition-colors ${showShotClock ? 'bg-green-500' : 'bg-gray-300'}`}
                            data-testid="shot-clock-toggle-btn"
                        >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showShotClock ? 'translate-x-4' : ''}`} />
                        </button>
                    </label>
                </div>
            </div>

            {/* Compact Scoreboard: Clock + Scores in one row */}
            <div className="bg-gray-900 text-white rounded-lg p-3" data-testid="scoreboard-panel">
                <div className="flex items-center justify-between gap-2">
                    {/* Home Team Score */}
                    <div className="flex-1 text-center">
                        <div className="text-xs text-gray-400 uppercase tracking-wide truncate">{gameState.home_team.name}</div>
                        <div className="text-4xl sm:text-5xl font-bold text-blue-400" data-testid="home-score">{gameState.home_team.score}</div>
                        <div className="text-[10px] text-blue-300 uppercase">Home</div>
                    </div>

                    {/* Center: Clock + Period + Shot Clock */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        {showGameClock && (
                            <div data-testid="game-clock-display">
                                <div className="text-2xl sm:text-3xl font-mono font-bold text-yellow-300" data-testid="game-clock-time">
                                    {gameState.time_remaining}
                                </div>
                            </div>
                        )}
                        <div className="text-[10px] text-gray-400">
                            {sportConfig.periodName} {gameState.current_period}/{sportConfig.periods}
                        </div>
                        {showGameClock && (
                            <button
                                onClick={() => setGameState(prev => ({ ...prev, is_running: !prev.is_running }))}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                    gameState.is_running ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                } text-white`}
                                data-testid="clock-start-pause-btn"
                            >
                                {gameState.is_running ? 'Pause' : 'Start'}
                            </button>
                        )}
                        {showShotClock && (
                            <div className="flex items-center gap-1 mt-1" data-testid="shot-clock-display">
                                <span className="text-[10px] text-gray-500 uppercase">Shot</span>
                                <span className="text-lg font-mono font-bold text-green-400" data-testid="shot-clock-time">
                                    {String(gameState.shot_clock).padStart(2, '0')}
                                </span>
                                <button
                                    onClick={() => setGameState(prev => ({ ...prev, shot_clock: 30 }))}
                                    className="text-[10px] text-gray-400 hover:text-white ml-1"
                                    title="Reset shot clock"
                                    data-testid="shot-clock-reset-btn"
                                >
                                    RST
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Away Team Score */}
                    <div className="flex-1 text-center">
                        <div className="text-xs text-gray-400 uppercase tracking-wide truncate">{gameState.away_team.name}</div>
                        <div className="text-4xl sm:text-5xl font-bold text-red-400" data-testid="away-score">{gameState.away_team.score}</div>
                        <div className="text-[10px] text-red-300 uppercase">Away</div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Entry - Compact two-column */}
            <div className="bg-white rounded-lg border p-3" data-testid="quick-stat-entry">
                <h3 className="font-semibold text-gray-800 text-sm mb-2">Quick Stat Entry</h3>
                <div className="grid grid-cols-2 gap-3">
                    {/* Home Team Quick Entry */}
                    <div>
                        <h4 className="text-xs font-medium text-blue-800 mb-1.5 truncate">{gameState.home_team.name}</h4>
                        <div className="grid grid-cols-2 gap-1">
                            {statTypes.map(stat => (
                                <button
                                    key={stat.key}
                                    onClick={() => {
                                        if (gameState.home_team.players[0]) {
                                            addStat('home_team', gameState.home_team.players[0].id, stat.key);
                                        }
                                    }}
                                    className={`px-2 py-1.5 rounded text-xs font-medium ${stat.color} hover:opacity-80 truncate`}
                                    data-testid={`home-quick-${stat.key}`}
                                >
                                    {stat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Away Team Quick Entry */}
                    <div>
                        <h4 className="text-xs font-medium text-red-800 mb-1.5 truncate">{gameState.away_team.name}</h4>
                        <div className="grid grid-cols-2 gap-1">
                            {statTypes.map(stat => (
                                <button
                                    key={stat.key}
                                    onClick={() => {
                                        if (gameState.away_team.players[0]) {
                                            addStat('away_team', gameState.away_team.players[0].id, stat.key);
                                        }
                                    }}
                                    className={`px-2 py-1.5 rounded text-xs font-medium ${stat.color} hover:opacity-80 truncate`}
                                    data-testid={`away-quick-${stat.key}`}
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

    const renderPlayerStats = (teamKey, teamData) => {
        const getStatColumns = () => {
            if (sportType === 'volleyball') {
                return [
                    { key: 'kills', label: 'K', title: 'Kills' },
                    { key: 'aces', label: 'A', title: 'Aces' },
                    { key: 'blocks', label: 'B', title: 'Blocks' },
                    { key: 'digs', label: 'D', title: 'Digs' },
                    { key: 'errors', label: 'E', title: 'Errors' }
                ];
            } else {
                return [
                    { key: 'goals', label: 'G', title: 'Goals' },
                    { key: 'assists', label: 'A', title: 'Assists' },
                    { key: 'shots', label: 'S', title: 'Shots' },
                    { key: 'saves', label: 'Sv', title: 'Saves' }
                ];
            }
        };
        
        const statColumns = getStatColumns();
        const isHome = teamKey === 'home_team';
        
        return (
            <div className="space-y-2" data-testid={`${teamKey}-stats-panel`}>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <span>{sportConfig.icon}</span>
                    <span className={isHome ? 'text-blue-800' : 'text-red-800'}>{teamData.name}</span>
                    <span className="text-gray-400 font-normal text-xs">Player Stats</span>
                </h3>
                
                <div className="bg-white rounded-lg border overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-2 text-left font-medium text-gray-700">#</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-700">Player</th>
                                {statColumns.map(col => (
                                    <th key={col.key} className="px-1.5 py-2 text-center font-medium text-gray-700" title={col.title}>
                                        {col.label}
                                    </th>
                                ))}
                                <th className="px-1.5 py-2 text-center font-medium text-gray-700">P</th>
                                <th className="px-1 py-2 text-center font-medium text-gray-700">+/-</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {teamData.players.map(player => (
                                <tr key={player.id} className="hover:bg-gray-50">
                                    <td className="px-2 py-1.5 font-medium">{player.number}</td>
                                    <td className="px-2 py-1.5 truncate max-w-[80px]">{player.name}</td>
                                    {statColumns.map(col => (
                                        <td key={col.key} className="px-1.5 py-1.5 text-center font-medium text-green-600">
                                            {player.stats[col.key] || 0}
                                        </td>
                                    ))}
                                    <td className="px-1.5 py-1.5 text-center font-medium text-red-600">
                                        {player.stats.penalties || 0}
                                    </td>
                                    <td className="px-1 py-1.5 text-center">
                                        <div className="flex justify-center gap-0.5 flex-wrap">
                                            {statTypes.slice(0, 3).map(stat => (
                                                <div key={stat.key} className="flex">
                                                    <button
                                                        onClick={() => addStat(teamKey, player.id, stat.key)}
                                                        className="w-5 h-5 bg-green-100 text-green-600 rounded-l text-[10px] hover:bg-green-200 leading-none flex items-center justify-center"
                                                        title={`Add ${stat.label}`}
                                                        data-testid={`${teamKey}-${player.id}-add-${stat.key}`}
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        onClick={() => removeStat(teamKey, player.id, stat.key)}
                                                        className="w-5 h-5 bg-red-100 text-red-600 rounded-r text-[10px] hover:bg-red-200 leading-none flex items-center justify-center"
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
    };

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