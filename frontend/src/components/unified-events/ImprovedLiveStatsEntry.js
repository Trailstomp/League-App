import React, { useState, useEffect, useRef } from 'react';

const ImprovedLiveStatsEntry = ({ event, teams, onSubmit, onCancel }) => {
    const [gameState, setGameState] = useState({
        home_team: { id: '', name: '', score: 0, players: [] },
        away_team: { id: '', name: '', score: 0, players: [] },
        goalies: { home: [], away: [] },
        current_period: 1,
        period_length: 15, // minutes, configurable in 5-min increments
        time_remaining: 15 * 60, // in seconds
        is_running: false,
        game_settings: {
            periods: 4,
            period_length_options: [10, 15, 20, 25, 30] // in minutes
        }
    });

    const [activeTab, setActiveTab] = useState('scoreboard');
    const [playerFilters, setPlayerFilters] = useState({
        home_sort: 'number', // number, name, position
        away_sort: 'number',
        home_hidden: new Set(), // player IDs to hide
        away_hidden: new Set()
    });

    const timerRef = useRef(null);

    // Mock player data - enhanced
    const getMockPlayers = (teamId, isHome) => {
        const positions = ['Attack', 'Midfield', 'Defense'];
        const players = [
            { id: '1', name: 'John Smith', number: '12', position: 'Attack' },
            { id: '2', name: 'Mike Johnson', number: '7', position: 'Midfield' },
            { id: '3', name: 'Dave Wilson', number: '23', position: 'Defense' },
            { id: '5', name: 'Chris Davis', number: '15', position: 'Attack' },
            { id: '6', name: 'Ryan Miller', number: '8', position: 'Midfield' },
            { id: '7', name: 'Alex Brown', number: '22', position: 'Defense' },
            { id: '8', name: 'Sam Wilson', number: '9', position: 'Midfield' },
            { id: '9', name: 'Jake Taylor', number: '11', position: 'Attack' }
        ];

        const goalies = [
            { id: '4', name: 'Tom Brown', number: '1', position: 'Goalie' },
            { id: '10', name: 'Matt Anderson', number: '30', position: 'Goalie' }
        ];

        return { players, goalies };
    };

    // Timer functionality
    useEffect(() => {
        if (gameState.is_running && gameState.time_remaining > 0) {
            timerRef.current = setInterval(() => {
                setGameState(prev => {
                    const newTime = prev.time_remaining - 1;
                    
                    if (newTime <= 0) {
                        // Period ended
                        return {
                            ...prev,
                            time_remaining: 0,
                            is_running: false
                        };
                    }
                    
                    return {
                        ...prev,
                        time_remaining: newTime
                    };
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [gameState.is_running, gameState.time_remaining]);

    // Initialize teams and players
    useEffect(() => {
        if (event && event.teams && event.teams.length >= 2) {
            const homeData = getMockPlayers(event.teams[0], true);
            const awayData = getMockPlayers(event.teams[1], false);

            setGameState(prev => ({
                ...prev,
                home_team: {
                    id: event.teams[0],
                    name: getTeamName(event.teams[0]),
                    score: 0,
                    players: homeData.players.map(p => ({
                        ...p,
                        stats: { goals: 0, assists: 0, shots: 0, penalties: 0, active: true }
                    }))
                },
                away_team: {
                    id: event.teams[1],
                    name: getTeamName(event.teams[1]),
                    score: 0,
                    players: awayData.players.map(p => ({
                        ...p,
                        stats: { goals: 0, assists: 0, shots: 0, penalties: 0, active: true }
                    }))
                },
                goalies: {
                    home: homeData.goalies.map(p => ({
                        ...p,
                        stats: { saves: 0, goals_against: 0, active: true }
                    })),
                    away: awayData.goalies.map(p => ({
                        ...p,
                        stats: { saves: 0, goals_against: 0, active: true }
                    }))
                }
            }));
        }
    }, [event]);

    const getTeamName = (teamId) => {
        const team = teams?.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        setGameState(prev => ({
            ...prev,
            is_running: !prev.is_running
        }));
    };

    const resetPeriod = () => {
        setGameState(prev => ({
            ...prev,
            time_remaining: prev.period_length * 60,
            is_running: false
        }));
    };

    const nextPeriod = () => {
        if (gameState.current_period < gameState.game_settings.periods) {
            setGameState(prev => ({
                ...prev,
                current_period: prev.current_period + 1,
                time_remaining: prev.period_length * 60,
                is_running: false
            }));
        }
    };

    const setPeriodLength = (minutes) => {
        setGameState(prev => ({
            ...prev,
            period_length: minutes,
            time_remaining: minutes * 60,
            is_running: false
        }));
    };

    const addStat = (teamKey, playerId, statType) => {
        setGameState(prev => ({
            ...prev,
            [teamKey]: {
                ...prev[teamKey],
                players: prev[teamKey].players.map(player => {
                    if (player.id === playerId) {
                        const newStats = { ...player.stats };
                        newStats[statType] += 1;
                        return { ...player, stats: newStats };
                    }
                    return player;
                })
            }
        }));

        // Auto-update team score for goals
        if (statType === 'goals') {
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
                    if (player.id === playerId && player.stats[statType] > 0) {
                        const newStats = { ...player.stats };
                        newStats[statType] -= 1;
                        return { ...player, stats: newStats };
                    }
                    return player;
                })
            }
        }));

        // Auto-update team score for goals
        if (statType === 'goals') {
            setGameState(prev => ({
                ...prev,
                [teamKey]: {
                    ...prev[teamKey],
                    score: Math.max(0, prev[teamKey].score - 1)
                }
            }));
        }
    };

    const togglePlayerActive = (teamKey, playerId) => {
        const currentHidden = playerFilters[`${teamKey.split('_')[0]}_hidden`];
        const newHidden = new Set(currentHidden);
        
        if (newHidden.has(playerId)) {
            newHidden.delete(playerId);
        } else {
            newHidden.add(playerId);
        }
        
        setPlayerFilters(prev => ({
            ...prev,
            [`${teamKey.split('_')[0]}_hidden`]: newHidden
        }));
    };

    const sortPlayers = (players, sortType, hiddenSet) => {
        const visiblePlayers = players.filter(p => !hiddenSet.has(p.id));
        
        return visiblePlayers.sort((a, b) => {
            switch (sortType) {
                case 'number':
                    return parseInt(a.number) - parseInt(b.number);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'position':
                    return a.position.localeCompare(b.position);
                default:
                    return 0;
            }
        });
    };

    // Timer and Scoreboard - Always visible at top
    const renderTimerSection = () => (
        <div className="bg-white border-b shadow-sm p-4 sticky top-0 z-10">
            <div className="max-w-6xl mx-auto">
                {/* Game Timer and Controls */}
                <div className="flex items-center justify-between mb-4">
                    {/* Timer Display */}
                    <div className="text-center bg-gray-900 text-white rounded-lg p-4 min-w-[200px]">
                        <div className="text-3xl font-bold">{formatTime(gameState.time_remaining)}</div>
                        <div className="text-sm">Period {gameState.current_period} of {gameState.game_settings.periods}</div>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTimer}
                            className={`px-4 py-2 rounded font-medium ${
                                gameState.is_running 
                                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            {gameState.is_running ? '⏸️ Pause' : '▶️ Start'}
                        </button>
                        
                        <button
                            onClick={resetPeriod}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium"
                        >
                            🔄 Reset Period
                        </button>
                        
                        <button
                            onClick={nextPeriod}
                            disabled={gameState.current_period >= gameState.game_settings.periods}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
                        >
                            ⏭️ Next Period
                        </button>
                    </div>

                    {/* Period Length Selector */}
                    <div className="text-center">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Period Length
                        </label>
                        <select
                            value={gameState.period_length}
                            onChange={(e) => setPeriodLength(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded"
                            disabled={gameState.is_running}
                        >
                            {gameState.game_settings.period_length_options.map(length => (
                                <option key={length} value={length}>
                                    {length} min
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Score Display */}
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <div className="text-lg font-semibold text-blue-900 mb-2">
                            {gameState.home_team.name}
                        </div>
                        <div className="text-4xl font-bold text-blue-600">
                            {gameState.home_team.score}
                        </div>
                        <div className="text-sm text-blue-700 mt-2">HOME</div>
                    </div>

                    <div className="flex items-center justify-center text-2xl font-bold text-gray-400">
                        VS
                    </div>

                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                        <div className="text-lg font-semibold text-red-900 mb-2">
                            {gameState.away_team.name}
                        </div>
                        <div className="text-4xl font-bold text-red-600">
                            {gameState.away_team.score}
                        </div>
                        <div className="text-sm text-red-700 mt-2">AWAY</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPlayerStats = (teamKey, teamData) => {
        const isHome = teamKey === 'home_team';
        const sortType = isHome ? playerFilters.home_sort : playerFilters.away_sort;
        const hiddenSet = isHome ? playerFilters.home_hidden : playerFilters.away_hidden;
        const sortedPlayers = sortPlayers(teamData.players, sortType, hiddenSet);

        return (
            <div className="space-y-4">
                {/* Team Header with Controls */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{teamData.name} - Player Statistics</h3>
                    
                    {/* Sort Controls */}
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Sort by:</label>
                        <select
                            value={sortType}
                            onChange={(e) => setPlayerFilters(prev => ({
                                ...prev,
                                [`${isHome ? 'home' : 'away'}_sort`]: e.target.value
                            }))}
                            className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                            <option value="number">Number</option>
                            <option value="name">Player Name</option>
                            <option value="position">Position</option>
                        </select>
                    </div>
                </div>

                {/* Players Table */}
                <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Active</th>
                                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">#</th>
                                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Player</th>
                                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Position</th>
                                <th className="px-3 py-2 text-center text-sm font-medium text-gray-700">Goals</th>
                                <th className="px-3 py-2 text-center text-sm font-medium text-gray-700">Assists</th>
                                <th className="px-3 py-2 text-center text-sm font-medium text-gray-700">Shots</th>
                                <th className="px-3 py-2 text-center text-sm font-medium text-gray-700">Penalties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedPlayers.map(player => (
                                <tr key={player.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2">
                                        <input
                                            type="checkbox"
                                            checked={!hiddenSet.has(player.id)}
                                            onChange={() => togglePlayerActive(teamKey, player.id)}
                                            className="rounded"
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-sm font-medium">{player.number}</td>
                                    <td className="px-3 py-2 text-sm">{player.name}</td>
                                    <td className="px-3 py-2 text-sm text-gray-600">{player.position}</td>
                                    
                                    {/* Goals with +/- buttons */}
                                    <td className="px-3 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => removeStat(teamKey, player.id, 'goals')}
                                                className="w-6 h-6 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                                                disabled={player.stats.goals <= 0}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-medium text-green-600">
                                                {player.stats.goals}
                                            </span>
                                            <button
                                                onClick={() => addStat(teamKey, player.id, 'goals')}
                                                className="w-6 h-6 bg-green-100 text-green-600 rounded text-xs hover:bg-green-200"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>

                                    {/* Assists with +/- buttons */}
                                    <td className="px-3 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => removeStat(teamKey, player.id, 'assists')}
                                                className="w-6 h-6 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                                                disabled={player.stats.assists <= 0}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-medium text-blue-600">
                                                {player.stats.assists}
                                            </span>
                                            <button
                                                onClick={() => addStat(teamKey, player.id, 'assists')}
                                                className="w-6 h-6 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>

                                    {/* Shots with +/- buttons */}
                                    <td className="px-3 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => removeStat(teamKey, player.id, 'shots')}
                                                className="w-6 h-6 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                                                disabled={player.stats.shots <= 0}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-medium text-yellow-600">
                                                {player.stats.shots}
                                            </span>
                                            <button
                                                onClick={() => addStat(teamKey, player.id, 'shots')}
                                                className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded text-xs hover:bg-yellow-200"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>

                                    {/* Penalties with +/- buttons */}
                                    <td className="px-3 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => removeStat(teamKey, player.id, 'penalties')}
                                                className="w-6 h-6 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                                                disabled={player.stats.penalties <= 0}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-medium text-red-600">
                                                {player.stats.penalties}
                                            </span>
                                            <button
                                                onClick={() => addStat(teamKey, player.id, 'penalties')}
                                                className="w-6 h-6 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                                            >
                                                +
                                            </button>
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

    const renderGoalieStats = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Home Goalies */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-900">{gameState.home_team.name} Goalies</h3>
                <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-blue-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-sm font-medium text-blue-900">#</th>
                                <th className="px-3 py-2 text-left text-sm font-medium text-blue-900">Goalie</th>
                                <th className="px-3 py-2 text-center text-sm font-medium text-blue-900">Saves</th>
                                <th className="px-3 py-2 text-center text-sm font-medium text-blue-900">Goals Against</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gameState.goalies.home.map(goalie => (
                                <tr key={goalie.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-sm font-medium">{goalie.number}</td>
                                    <td className="px-3 py-2 text-sm">{goalie.name}</td>
                                    <td className="px-3 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => {
                                                    const saves = Math.max(0, goalie.stats.saves - 1);
                                                    setGameState(prev => ({
                                                        ...prev,
                                                        goalies: {
                                                            ...prev.goalies,
                                                            home: prev.goalies.home.map(g => 
                                                                g.id === goalie.id ? { ...g, stats: { ...g.stats, saves } } : g
                                                            )
                                                        }
                                                    }));
                                                }}
                                                className="w-6 h-6 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                                                disabled={goalie.stats.saves <= 0}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-medium text-purple-600">
                                                {goalie.stats.saves}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const saves = goalie.stats.saves + 1;
                                                    setGameState(prev => ({
                                                        ...prev,
                                                        goalies: {
                                                            ...prev.goalies,
                                                            home: prev.goalies.home.map(g => 
                                                                g.id === goalie.id ? { ...g, stats: { ...g.stats, saves } } : g
                                                            )
                                                        }
                                                    }));
                                                }}
                                                className="w-6 h-6 bg-purple-100 text-purple-600 rounded text-xs hover:bg-purple-200"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => {
                                                    const goals = Math.max(0, goalie.stats.goals_against - 1);
                                                    setGameState(prev => ({
                                                        ...prev,
                                                        goalies: {
                                                            ...prev.goalies,
                                                            home: prev.goalies.home.map(g => 
                                                                g.id === goalie.id ? { ...g, stats: { ...g.stats, goals_against: goals } } : g
                                                            )
                                                        }
                                                    }));
                                                }}
                                                className="w-6 h-6 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                                                disabled={goalie.stats.goals_against <= 0}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-medium text-red-600">
                                                {goalie.stats.goals_against}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const goals = goalie.stats.goals_against + 1;
                                                    setGameState(prev => ({
                                                        ...prev,
                                                        goalies: {
                                                            ...prev.goalies,
                                                            home: prev.goalies.home.map(g => 
                                                                g.id === goalie.id ? { ...g, stats: { ...g.stats, goals_against: goals } } : g
                                                            )
                                                        }
                                                    }));
                                                }}
                                                className="w-6 h-6 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Away Goalies */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-900">{gameState.away_team.name} Goalies</h3>
                <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-red-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-sm font-medium text-red-900">#</th>
                                <th className="px-3 py-2 text-left text-sm font-medium text-red-900">Goalie</th>
                                <th className="px-3 py-2 text-center text-sm font-medium text-red-900">Saves</th>
                                <th className="px-3 py-2 text-center text-sm font-medium text-red-900">Goals Against</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gameState.goalies.away.map(goalie => (
                                <tr key={goalie.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-sm font-medium">{goalie.number}</td>
                                    <td className="px-3 py-2 text-sm">{goalie.name}</td>
                                    <td className="px-3 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => {
                                                    const saves = Math.max(0, goalie.stats.saves - 1);
                                                    setGameState(prev => ({
                                                        ...prev,
                                                        goalies: {
                                                            ...prev.goalies,
                                                            away: prev.goalies.away.map(g => 
                                                                g.id === goalie.id ? { ...g, stats: { ...g.stats, saves } } : g
                                                            )
                                                        }
                                                    }));
                                                }}
                                                className="w-6 h-6 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                                                disabled={goalie.stats.saves <= 0}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-medium text-purple-600">
                                                {goalie.stats.saves}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const saves = goalie.stats.saves + 1;
                                                    setGameState(prev => ({
                                                        ...prev,
                                                        goalies: {
                                                            ...prev.goalies,
                                                            away: prev.goalies.away.map(g => 
                                                                g.id === goalie.id ? { ...g, stats: { ...g.stats, saves } } : g
                                                            )
                                                        }
                                                    }));
                                                }}
                                                className="w-6 h-6 bg-purple-100 text-purple-600 rounded text-xs hover:bg-purple-200"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => {
                                                    const goals = Math.max(0, goalie.stats.goals_against - 1);
                                                    setGameState(prev => ({
                                                        ...prev,
                                                        goalies: {
                                                            ...prev.goalies,
                                                            away: prev.goalies.away.map(g => 
                                                                g.id === goalie.id ? { ...g, stats: { ...g.stats, goals_against: goals } } : g
                                                            )
                                                        }
                                                    }));
                                                }}
                                                className="w-6 h-6 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                                                disabled={goalie.stats.goals_against <= 0}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-medium text-red-600">
                                                {goalie.stats.goals_against}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const goals = goalie.stats.goals_against + 1;
                                                    setGameState(prev => ({
                                                        ...prev,
                                                        goalies: {
                                                            ...prev.goalies,
                                                            away: prev.goalies.away.map(g => 
                                                                g.id === goalie.id ? { ...g, stats: { ...g.stats, goals_against: goals } } : g
                                                            )
                                                        }
                                                    }));
                                                }}
                                                className="w-6 h-6 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const handleSubmit = async () => {
        try {
            const gameData = {
                home_team: gameState.home_team,
                away_team: gameState.away_team,
                goalies: gameState.goalies,
                final_score: `${gameState.home_team.score}-${gameState.away_team.score}`,
                winner: gameState.home_team.score > gameState.away_team.score ? gameState.home_team : gameState.away_team,
                entry_type: 'live_stats',
                entry_time: new Date().toISOString(),
                game_duration: gameState.current_period,
                period_length: gameState.period_length,
                detailed_stats: true
            };

            await onSubmit(gameData);
        } catch (error) {
            console.error('❌ Error submitting live stats:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Always-visible Timer Section */}
            {renderTimerSection()}

            {/* Tab Navigation */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('home_stats')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm ${
                                activeTab === 'home_stats'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            🏠 {gameState.home_team.name} Stats
                        </button>
                        <button
                            onClick={() => setActiveTab('away_stats')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm ${
                                activeTab === 'away_stats'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            ✈️ {gameState.away_team.name} Stats
                        </button>
                        <button
                            onClick={() => setActiveTab('goalies')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm ${
                                activeTab === 'goalies'
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            🥅 Goalies
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto">
                    {activeTab === 'home_stats' && renderPlayerStats('home_team', gameState.home_team)}
                    {activeTab === 'away_stats' && renderPlayerStats('away_team', gameState.away_team)}
                    {activeTab === 'goalies' && renderGoalieStats()}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-white border-t px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        ← Cancel
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setGameState(prev => ({
                                    ...prev,
                                    home_team: { ...prev.home_team, score: 0, players: prev.home_team.players.map(p => ({ ...p, stats: { goals: 0, assists: 0, shots: 0, penalties: 0, active: true } })) },
                                    away_team: { ...prev.away_team, score: 0, players: prev.away_team.players.map(p => ({ ...p, stats: { goals: 0, assists: 0, shots: 0, penalties: 0, active: true } })) },
                                    goalies: {
                                        home: prev.goalies.home.map(g => ({ ...g, stats: { saves: 0, goals_against: 0, active: true } })),
                                        away: prev.goalies.away.map(g => ({ ...g, stats: { saves: 0, goals_against: 0, active: true } }))
                                    },
                                    time_remaining: prev.period_length * 60,
                                    current_period: 1,
                                    is_running: false
                                }));
                            }}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                            🔄 Reset Game
                        </button>
                        
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            ✅ Save Game Stats
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImprovedLiveStatsEntry;