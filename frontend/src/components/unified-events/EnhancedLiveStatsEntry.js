import React, { useState, useEffect, useRef } from 'react';

const EnhancedLiveStatsEntry = ({ event, teams, onSubmit, onCancel }) => {
    console.log('🎮 EnhancedLiveStatsEntry mounted with:', {
        event: event,
        eventId: event?.id,
        eventTitle: event?.title,
        teamsCount: teams?.length
    });
    const [gameState, setGameState] = useState({
        home_team: { id: '', name: '', score: 0, players: [], logo: '' },
        away_team: { id: '', name: '', score: 0, players: [], logo: '' },
        goalies: { home: [], away: [] },
        current_period: 1,
        period_length: 15, // minutes
        time_remaining: 15 * 60, // in seconds
        is_running: false,
        manual_time_input: false,
        game_settings: {
            periods: 4,
            period_length_options: [10, 15, 20, 25, 30]
        }
    });

    const [activeTab, setActiveTab] = useState('home_stats');
    const [playerSort, setPlayerSort] = useState({
        home: { column: 'number', direction: 'asc' },
        away: { column: 'number', direction: 'asc' }
    });
    
    const [manualTimeInputs, setManualTimeInputs] = useState({
        minutes: '',
        seconds: '',
        period: ''
    });
    
    const [showTimeEditor, setShowTimeEditor] = useState(false);
    
    const [penalties, setPenalties] = useState({
        home: [],
        away: []
    });
    
    const [showPenaltyModal, setShowPenaltyModal] = useState(false);
    const [selectedPlayerForPenalty, setSelectedPlayerForPenalty] = useState(null);
    const [penaltyInput, setPenaltyInput] = useState({
        type: '',
        duration: 2,
        customType: ''
    });

    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [lastSaved, setLastSaved] = useState(null);

    const timerRef = useRef(null);
    const autoSaveRef = useRef(null);
    const penaltyTimersRef = useRef([]);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    
    // Common penalty types
    const penaltyTypes = [
        'Tripping',
        'Slashing',
        'High Stick',
        'Cross Check',
        'Holding',
        'Interference',
        'Roughing',
        'Unsportsmanlike Conduct',
        'Illegal Equipment',
        'Too Many Players',
        'Delay of Game',
        'Other (specify)'
    ];

    // Enhanced player data with better structure
    const getMockPlayers = (teamId, teamName) => {
        const players = [
            { id: '1', name: 'John Smith', number: '12', position: 'Attack', active: true },
            { id: '2', name: 'Mike Johnson', number: '7', position: 'Midfield', active: true },
            { id: '3', name: 'Dave Wilson', number: '23', position: 'Defense', active: true },
            { id: '5', name: 'Chris Davis', number: '15', position: 'Attack', active: true },
            { id: '6', name: 'Ryan Miller', number: '8', position: 'Midfield', active: false },
            { id: '7', name: 'Alex Brown', number: '22', position: 'Defense', active: true },
            { id: '8', name: 'Sam Wilson', number: '9', position: 'Midfield', active: true },
            { id: '9', name: 'Jake Taylor', number: '11', position: 'Attack', active: false }
        ];

        const goalies = [
            { id: '4', name: 'Tom Brown', number: '1', position: 'Goalie', active: true },
            { id: '10', name: 'Matt Anderson', number: '30', position: 'Goalie', active: true }
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
                
                // Also update penalty timers when game clock is running
                updatePenaltyTimers();
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [gameState.is_running, gameState.time_remaining]);
    
    // Update penalty timers (decrements by 1 second)
    const updatePenaltyTimers = () => {
        setPenalties(prev => {
            const updateTeamPenalties = (teamPenalties) => {
                return teamPenalties.map(penalty => {
                    if (penalty.timeRemaining > 0) {
                        return {
                            ...penalty,
                            timeRemaining: penalty.timeRemaining - 1
                        };
                    }
                    return penalty;
                }).filter(penalty => penalty.timeRemaining > 0); // Remove expired penalties
            };
            
            return {
                home: updateTeamPenalties(prev.home),
                away: updateTeamPenalties(prev.away)
            };
        });
    };

    // Auto-save functionality for live updates - wrapped in useCallback to always have latest gameState
    const autoSaveGameStats = React.useCallback(async () => {
        if (!event?.id) {
            console.log('⚠️ Auto-save skipped: No event ID');
            return;
        }
        
        console.log('💾 Auto-saving game stats for event:', event.id, 'Current scores:', gameState.home_team.score, '-', gameState.away_team.score);
        
        try {
            const gameData = {
                event_id: event.id,
                home_team: gameState.home_team,
                away_team: gameState.away_team,
                goalies: gameState.goalies,
                time_remaining: formatTime(gameState.time_remaining),
                current_period: gameState.current_period,
                period_length: gameState.period_length,
                detailed_stats: true,
                entry_type: 'enhanced_live_stats_autosave',
                created_at: new Date().toISOString()
            };

            console.log('💾 Sending auto-save data to game_stats');

            // Save to game_stats collection
            const statsResponse = await fetch(`${backendUrl}/api/game-stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });

            if (!statsResponse.ok) {
                const error = await statsResponse.text();
                console.error('❌ Auto-save to game_stats failed:', statsResponse.status, error);
                return;
            }

            console.log('✅ Saved to game_stats');

            // ALSO update unified_events.scores so Live View sees the update immediately
            console.log('💾 Updating unified_events.scores');
            const eventUpdateResponse = await fetch(`${backendUrl}/api/unified-events/${event.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scores: gameData,
                    status: 'in_progress'
                })
            });

            if (eventUpdateResponse.ok) {
                setLastSaved(new Date());
                console.log('✅ Auto-saved to BOTH game_stats AND unified_events.scores');
            } else {
                const error = await eventUpdateResponse.text();
                console.error('❌ Failed to update unified_events.scores:', error);
            }
        } catch (error) {
            console.error('❌ Auto-save error:', error);
        }
    }, [event, gameState, backendUrl]);

    // Setup auto-save interval when timer is running
    useEffect(() => {
        console.log('🔧 Auto-save useEffect triggered. Enabled:', autoSaveEnabled, 'Running:', gameState.is_running, 'Event ID:', event?.id);
        
        if (autoSaveEnabled && gameState.is_running && event?.id) {
            console.log('✅ Starting auto-save interval (every 10 seconds)');
            
            // Immediate first save
            autoSaveGameStats();
            
            // Then save every 10 seconds
            const intervalId = setInterval(() => {
                console.log('⏰ 10 seconds elapsed, triggering auto-save...');
                autoSaveGameStats();
            }, 10000);
            
            // Store in ref so cleanup can access it
            autoSaveRef.current = intervalId;
            
            return () => {
                console.log('🧹 Cleaning up auto-save interval');
                clearInterval(intervalId);
            };
        } else {
            console.log('⚠️ Auto-save NOT started. Reason:', {
                autoSaveEnabled,
                timerRunning: gameState.is_running,
                hasEventId: !!event?.id
            });
            clearInterval(autoSaveRef.current);
        }
    }, [autoSaveEnabled, gameState.is_running, event?.id, autoSaveGameStats]);

    // Initialize teams and players
    useEffect(() => {
        if (event && event.teams && event.teams.length >= 2) {
            const homeTeam = teams?.find(t => t.id === event.teams[0]);
            const awayTeam = teams?.find(t => t.id === event.teams[1]);
            
            const homeData = getMockPlayers(event.teams[0], homeTeam?.name);
            const awayData = getMockPlayers(event.teams[1], awayTeam?.name);

            setGameState(prev => ({
                ...prev,
                home_team: {
                    id: event.teams[0],
                    name: homeTeam?.name || 'Home Team',
                    logo: homeTeam?.style?.logoUrl || '',
                    score: 0,
                    players: homeData.players.map(p => ({
                        ...p,
                        stats: { goals: 0, assists: 0, shots: 0, penalties: 0 }
                    }))
                },
                away_team: {
                    id: event.teams[1],
                    name: awayTeam?.name || 'Away Team',
                    logo: awayTeam?.style?.logoUrl || '',
                    score: 0,
                    players: awayData.players.map(p => ({
                        ...p,
                        stats: { goals: 0, assists: 0, shots: 0, penalties: 0 }
                    }))
                },
                goalies: {
                    home: homeData.goalies.map(p => ({
                        ...p,
                        stats: { saves: 0, goals_against: 0, shots_faced: 0 }
                    })),
                    away: awayData.goalies.map(p => ({
                        ...p,
                        stats: { saves: 0, goals_against: 0, shots_faced: 0 }
                    }))
                }
            }));
        }
    }, [event, teams]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        const newIsRunning = !gameState.is_running;
        
        setGameState(prev => ({
            ...prev,
            is_running: newIsRunning
        }));

        // Update event status to in_progress when starting
        if (newIsRunning && event?.id) {
            console.log('🎬 Game started, updating event status to in_progress');
            updateEventStatus(event.id, 'in_progress');
        }
    };

    const nextPeriod = () => {
        setGameState(prev => ({
            ...prev,
            current_period: Math.min(prev.current_period + 1, prev.game_settings.periods),
            time_remaining: prev.period_length * 60,
            is_running: false
        }));
    };

    const updateEventStatus = async (eventId, status) => {
        try {
            const response = await fetch(`${backendUrl}/api/unified-events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            
            if (response.ok) {
                console.log('✅ Event status updated to:', status);
            } else {
                console.error('❌ Failed to update event status');
            }
        } catch (error) {
            console.error('❌ Error updating event status:', error);
        }
    };

    const setManualTime = () => {
        const minutes = parseInt(manualTimeInputs.minutes) || 0;
        const seconds = parseInt(manualTimeInputs.seconds) || 0;
        const period = parseInt(manualTimeInputs.period) || gameState.current_period;
        
        setGameState(prev => ({
            ...prev,
            time_remaining: (minutes * 60) + seconds,
            current_period: Math.max(1, Math.min(period, prev.game_settings.periods)),
            is_running: false,
            manual_time_input: false
        }));
        
        setManualTimeInputs({ minutes: '', seconds: '', period: '' });
    };

    // Enhanced stat adding with goalie integration
    const addStat = (teamKey, playerId, statType) => {
        setGameState(prev => {
            const newState = { ...prev };
            
            // Update player stats
            newState[teamKey] = {
                ...prev[teamKey],
                players: prev[teamKey].players.map(player => {
                    if (player.id === playerId) {
                        const newStats = { ...player.stats };
                        newStats[statType] += 1;
                        return { ...player, stats: newStats };
                    }
                    return player;
                })
            };

            // Update team score for goals
            if (statType === 'goals') {
                newState[teamKey].score = prev[teamKey].score + 1;
                
                // Update opposing goalie's goals against
                const opposingTeamKey = teamKey === 'home_team' ? 'away' : 'home';
                newState.goalies = {
                    ...prev.goalies,
                    [opposingTeamKey]: prev.goalies[opposingTeamKey].map(goalie => 
                        goalie.active ? {
                            ...goalie,
                            stats: {
                                ...goalie.stats,
                                goals_against: goalie.stats.goals_against + 1
                            }
                        } : goalie
                    )
                };
            }

            // Update opposing goalie's shots faced for shots
            if (statType === 'shots') {
                const opposingTeamKey = teamKey === 'home_team' ? 'away' : 'home';
                newState.goalies = {
                    ...prev.goalies,
                    [opposingTeamKey]: prev.goalies[opposingTeamKey].map(goalie => 
                        goalie.active ? {
                            ...goalie,
                            stats: {
                                ...goalie.stats,
                                shots_faced: goalie.stats.shots_faced + 1
                            }
                        } : goalie
                    )
                };
            }

            return newState;
        });
    };

    const togglePlayerActive = (teamKey, playerId) => {
        setGameState(prev => ({
            ...prev,
            [teamKey]: {
                ...prev[teamKey],
                players: prev[teamKey].players.map(player => 
                    player.id === playerId 
                        ? { ...player, active: !player.active }
                        : player
                )
            }
        }));
    };

    const toggleGoalieActive = (teamKey, goalieId) => {
        setGameState(prev => ({
            ...prev,
            goalies: {
                ...prev.goalies,
                [teamKey]: prev.goalies[teamKey].map(goalie => 
                    goalie.id === goalieId 
                        ? { ...goalie, active: !goalie.active }
                        : goalie
                )
            }
        }));
    };

    const sortPlayers = (players, sortConfig) => {
        return [...players].sort((a, b) => {
            let aValue, bValue;
            
            switch (sortConfig.column) {
                case 'number':
                    aValue = parseInt(a.number) || 0;
                    bValue = parseInt(b.number) || 0;
                    break;
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'position':
                    aValue = a.position.toLowerCase();
                    bValue = b.position.toLowerCase();
                    break;
                case 'goals':
                case 'assists':
                case 'shots':
                case 'penalties':
                    aValue = a.stats[sortConfig.column];
                    bValue = b.stats[sortConfig.column];
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const handleColumnSort = (teamKey, column) => {
        const teamSortKey = teamKey === 'home_team' ? 'home' : 'away';
        setPlayerSort(prev => ({
            ...prev,
            [teamSortKey]: {
                column,
                direction: prev[teamSortKey].column === column && prev[teamSortKey].direction === 'asc' ? 'desc' : 'asc'
            }
        }));
    };

    // Fixed sticky header with clock, scores, and goalies
    const renderStickyHeader = () => (
        <div className="bg-white border-b-2 border-gray-200 shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto p-4">
                {/* Event Name */}
                <div className="text-center mb-3">
                    <h2 className="text-2xl font-bold text-gray-800">{event?.title || 'Live Game Scoring'}</h2>
                </div>

                {/* Top Row: Timer and Period side by side */}
                <div className="flex items-center justify-center gap-8 mb-3">
                    {/* Timer Display - Clickable */}
                    <div 
                        className={`px-6 py-3 rounded-lg border-4 cursor-pointer hover:opacity-80 transition ${
                            gameState.is_running 
                                ? 'bg-green-100 border-green-500' 
                                : 'bg-red-100 border-red-500'
                        }`}
                        onClick={() => {
                            setManualTimeInputs({
                                minutes: Math.floor(gameState.time_remaining / 60).toString(),
                                seconds: (gameState.time_remaining % 60).toString(),
                                period: gameState.current_period.toString()
                            });
                            setShowTimeEditor(true);
                        }}
                        title="Click to edit time"
                    >
                        <div className="text-5xl font-bold font-mono">
                            {formatTime(gameState.time_remaining)}
                        </div>
                    </div>

                    {/* Period Display with Controls */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-lg font-medium text-gray-600">Period</span>
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={() => {
                                        setGameState(prev => ({
                                            ...prev,
                                            current_period: Math.min(prev.current_period + 1, prev.game_settings.periods),
                                            time_remaining: prev.period_length * 60,
                                            is_running: false
                                        }));
                                    }}
                                    disabled={gameState.current_period >= gameState.game_settings.periods}
                                    className="leading-none text-2xl text-blue-600 hover:text-blue-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    ▲
                                </button>
                                <span className="text-6xl font-bold text-gray-800">{gameState.current_period}</span>
                                <button
                                    onClick={() => {
                                        setGameState(prev => ({ 
                                            ...prev, 
                                            current_period: Math.max(1, prev.current_period - 1),
                                            time_remaining: prev.period_length * 60,
                                            is_running: false
                                        }));
                                    }}
                                    disabled={gameState.current_period <= 1}
                                    className="leading-none text-2xl text-blue-600 hover:text-blue-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    ▼
                                </button>
                            </div>
                            <span className="text-lg text-gray-600">of {gameState.game_settings.periods}</span>
                        </div>
                    </div>
                </div>

                {/* Control Buttons Row */}
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={toggleTimer}
                        className={`px-6 py-2 rounded-lg font-bold text-white text-lg ${
                            gameState.is_running 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {gameState.is_running ? '⏸️ Pause' : '▶️ Start'}
                    </button>
                    
                    <button
                        onClick={() => {
                            console.log('🔘 Manual save button clicked');
                            autoSaveGameStats();
                        }}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold"
                    >
                        💾 Save Now
                    </button>
                    
                    {lastSaved && (
                        <span className="text-xs text-gray-600">
                            Last saved: {Math.round((new Date() - lastSaved) / 1000)}s ago
                        </span>
                    )}
                </div>

                {/* Scoreboard */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    {/* Home Team Score */}
                    <div className="flex items-center gap-3">
                        {gameState.home_team.logo && (
                            <img 
                                src={gameState.home_team.logo} 
                                alt={gameState.home_team.name}
                                className="w-12 h-12 object-cover rounded-lg"
                            />
                        )}
                        <div>
                            <div className="text-lg font-semibold text-gray-700">{gameState.home_team.name}</div>
                            <div className="text-4xl font-bold text-blue-600">{gameState.home_team.score}</div>
                        </div>
                    </div>

                    <div className="text-2xl font-bold text-gray-400">-</div>

                    {/* Away Team Score */}
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-lg font-semibold text-gray-700">{gameState.away_team.name}</div>
                            <div className="text-4xl font-bold text-red-600">{gameState.away_team.score}</div>
                        </div>
                        {gameState.away_team.logo && (
                            <img 
                                src={gameState.away_team.logo} 
                                alt={gameState.away_team.name}
                                className="w-12 h-12 object-cover rounded-lg"
                            />
                        )}
                    </div>
                </div>

                {/* Goalies Section */}
                <div className="grid grid-cols-2 gap-6 mt-4 pt-4 border-t">
                    {/* Home Goalies */}
                    <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">🥅 {gameState.home_team.name} Goalies</h4>
                        <div className="space-y-2">
                            {gameState.goalies.home.map(goalie => (
                                <div key={goalie.id} className={`flex items-center justify-between p-2 rounded ${
                                    goalie.active ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={goalie.active}
                                            onChange={() => toggleGoalieActive('home', goalie.id)}
                                            className="rounded"
                                        />
                                        <span className="font-mono text-sm">#{goalie.number}</span>
                                        <span className="text-sm">{goalie.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span>Saves: {goalie.stats.saves}</span>
                                        <span>GA: {goalie.stats.goals_against}</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setGameState(prev => ({
                                                        ...prev,
                                                        goalies: {
                                                            ...prev.goalies,
                                                            home: prev.goalies.home.map(g => 
                                                                g.id === goalie.id ? { ...g, stats: { ...g.stats, saves: g.stats.saves + 1 } } : g
                                                            )
                                                        }
                                                    }));
                                                }}
                                                className="w-5 h-5 bg-purple-100 text-purple-600 rounded text-xs hover:bg-purple-200"
                                            >
                                                +S
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Away Goalies */}
                    <div>
                        <h4 className="text-sm font-semibold text-red-900 mb-2">🥅 {gameState.away_team.name} Goalies</h4>
                        <div className="space-y-2">
                            {gameState.goalies.away.map(goalie => (
                                <div key={goalie.id} className={`flex items-center justify-between p-2 rounded ${
                                    goalie.active ? 'bg-red-50 border border-red-200' : 'bg-gray-100'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={goalie.active}
                                            onChange={() => toggleGoalieActive('away', goalie.id)}
                                            className="rounded"
                                        />
                                        <span className="font-mono text-sm">#{goalie.number}</span>
                                        <span className="text-sm">{goalie.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span>Saves: {goalie.stats.saves}</span>
                                        <span>GA: {goalie.stats.goals_against}</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setGameState(prev => ({
                                                        ...prev,
                                                        goalies: {
                                                            ...prev.goalies,
                                                            away: prev.goalies.away.map(g => 
                                                                g.id === goalie.id ? { ...g, stats: { ...g.stats, saves: g.stats.saves + 1 } } : g
                                                            )
                                                        }
                                                    }));
                                                }}
                                                className="w-5 h-5 bg-purple-100 text-purple-600 rounded text-xs hover:bg-purple-200"
                                            >
                                                +S
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Time Editor Dialog
    const renderTimeEditor = () => {
        if (!showTimeEditor) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">Edit Game Time</h3>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Minutes
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={manualTimeInputs.minutes}
                                    onChange={(e) => setManualTimeInputs(prev => ({
                                        ...prev,
                                        minutes: e.target.value
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="15"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Seconds
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={manualTimeInputs.seconds}
                                    onChange={(e) => setManualTimeInputs(prev => ({
                                        ...prev,
                                        seconds: e.target.value
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="00"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Period
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={gameState.game_settings.periods}
                                value={manualTimeInputs.period}
                                onChange={(e) => setManualTimeInputs(prev => ({
                                    ...prev,
                                    period: e.target.value
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={gameState.current_period.toString()}
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => {
                                setShowTimeEditor(false);
                                setManualTimeInputs({ minutes: '', seconds: '', period: '' });
                            }}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                setManualTime();
                                setShowTimeEditor(false);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPlayerStats = (teamKey, teamData) => {
        const isHome = teamKey === 'home_team';
        const sortConfig = isHome ? playerSort.home : playerSort.away;
        const sortedPlayers = sortPlayers(teamData.players, sortConfig);
        const activePlayers = sortedPlayers.filter(p => p.active);
        const inactivePlayers = sortedPlayers.filter(p => !p.active);

        const SortableHeader = ({ column, children }) => (
            <th 
                className="px-3 py-2 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleColumnSort(teamKey, column)}
            >
                <div className="flex items-center gap-1">
                    {children}
                    {sortConfig.column === column && (
                        <span className="text-xs">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                    )}
                </div>
            </th>
        );

        const PlayerRow = ({ player, isInactive = false }) => (
            <tr key={player.id} className={`${isInactive ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50'}`}>
                <td className="px-2 py-1">
                    <input
                        type="checkbox"
                        checked={player.active}
                        onChange={() => togglePlayerActive(teamKey, player.id)}
                        className="rounded"
                    />
                </td>
                <td className="px-2 py-1 text-sm font-mono font-bold">{player.number}</td>
                <td className="px-2 py-1 text-sm font-medium">{player.name}</td>
                <td className="px-2 py-1 text-xs text-gray-600">{player.position}</td>
                
                {/* Stats with +/- buttons - REORDERED: Shots, Goals, Assists, Penalties */}
                {['shots', 'goals', 'assists', 'penalties'].map(statType => (
                    <td key={statType} className="px-2 py-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                            <button
                                onClick={() => {
                                    if (player.stats[statType] > 0) {
                                        setGameState(prev => {
                                            const newState = { ...prev };
                                            
                                            // Decrement player stat
                                            newState[teamKey] = {
                                                ...prev[teamKey],
                                                players: prev[teamKey].players.map(p => 
                                                    p.id === player.id 
                                                        ? { ...p, stats: { ...p.stats, [statType]: p.stats[statType] - 1 } }
                                                        : p
                                                )
                                            };
                                            
                                            // Update team score for goals
                                            if (statType === 'goals') {
                                                newState[teamKey] = {
                                                    ...newState[teamKey],
                                                    score: Math.max(0, prev[teamKey].score - 1)
                                                };
                                                
                                                // Decrement opposing goalie's goals_against
                                                const opposingTeamKey = teamKey === 'home_team' ? 'away' : 'home';
                                                newState.goalies = {
                                                    ...prev.goalies,
                                                    [opposingTeamKey]: prev.goalies[opposingTeamKey].map(goalie => 
                                                        goalie.active && goalie.stats.goals_against > 0 ? {
                                                            ...goalie,
                                                            stats: {
                                                                ...goalie.stats,
                                                                goals_against: goalie.stats.goals_against - 1
                                                            }
                                                        } : goalie
                                                    )
                                                };
                                            }
                                            
                                            // Decrement opposing goalie's shots_faced for shots
                                            if (statType === 'shots') {
                                                const opposingTeamKey = teamKey === 'home_team' ? 'away' : 'home';
                                                newState.goalies = {
                                                    ...prev.goalies,
                                                    [opposingTeamKey]: prev.goalies[opposingTeamKey].map(goalie => 
                                                        goalie.active && goalie.stats.shots_faced > 0 ? {
                                                            ...goalie,
                                                            stats: {
                                                                ...goalie.stats,
                                                                shots_faced: goalie.stats.shots_faced - 1
                                                            }
                                                        } : goalie
                                                    )
                                                };
                                            }
                                            
                                            return newState;
                                        });
                                    }
                                }}
                                className="w-8 h-8 bg-red-100 text-red-600 rounded text-sm font-bold hover:bg-red-200"
                                disabled={player.stats[statType] <= 0}
                            >
                                −
                            </button>
                            <span className={`w-10 text-center font-bold text-base ${
                                statType === 'goals' ? 'text-green-600' :
                                statType === 'assists' ? 'text-blue-600' :
                                statType === 'shots' ? 'text-yellow-600' :
                                'text-red-600'
                            }`}>
                                {player.stats[statType]}
                            </span>
                            <button
                                onClick={() => addStat(teamKey, player.id, statType)}
                                className={`w-8 h-8 rounded text-sm font-bold hover:opacity-80 ${
                                    statType === 'goals' ? 'bg-green-100 text-green-600' :
                                    statType === 'assists' ? 'bg-blue-100 text-blue-600' :
                                    statType === 'shots' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-red-100 text-red-600'
                                }`}
                            >
                                +
                            </button>
                        </div>
                    </td>
                ))}
            </tr>
        );

        return (
            <div className="space-y-6">
                {/* Active Players */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
                        {teamData.logo && (
                            <img 
                                src={teamData.logo} 
                                alt={teamData.name}
                                className="w-6 h-6 object-cover rounded"
                            />
                        )}
                        {teamData.name} - Active Players ({activePlayers.length})
                    </h3>
                    
                    <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">✓</th>
                                    <SortableHeader column="number">#</SortableHeader>
                                    <SortableHeader column="name">Player</SortableHeader>
                                    <SortableHeader column="position">Pos</SortableHeader>
                                    <SortableHeader column="shots">Shots</SortableHeader>
                                    <SortableHeader column="goals">Goals</SortableHeader>
                                    <SortableHeader column="assists">Assists</SortableHeader>
                                    <SortableHeader column="penalties">PIM</SortableHeader>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {activePlayers.map(player => <PlayerRow key={player.id} player={player} />)}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Inactive Players */}
                {inactivePlayers.length > 0 && (
                    <div>
                        <h4 className="text-md font-medium text-gray-600 mb-3">
                            📋 Inactive Players / Didn't RSVP ({inactivePlayers.length})
                        </h4>
                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-600">Activate</th>
                                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-600">#</th>
                                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-600">Player</th>
                                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-600">Position</th>
                                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Goals</th>
                                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Assists</th>
                                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Shots</th>
                                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Penalties</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {inactivePlayers.map(player => <PlayerRow key={player.id} player={player} isInactive={true} />)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Fixed Sticky Header */}
            {renderStickyHeader()}

            {/* Tab Navigation */}
            <div className="bg-white border-b sticky" style={{ top: '280px', zIndex: 10 }}>
                <div className="max-w-7xl mx-auto px-4">
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
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6" style={{ paddingTop: '20px' }}>
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'home_stats' && renderPlayerStats('home_team', gameState.home_team)}
                    {activeTab === 'away_stats' && renderPlayerStats('away_team', gameState.away_team)}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-white border-t px-6 py-4 sticky bottom-0">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        ← Cancel
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                // Reset game but keep player active/inactive states
                                setGameState(prev => ({
                                    ...prev,
                                    home_team: { 
                                        ...prev.home_team, 
                                        score: 0, 
                                        players: prev.home_team.players.map(p => ({ 
                                            ...p, 
                                            stats: { goals: 0, assists: 0, shots: 0, penalties: 0 } 
                                        })) 
                                    },
                                    away_team: { 
                                        ...prev.away_team, 
                                        score: 0, 
                                        players: prev.away_team.players.map(p => ({ 
                                            ...p, 
                                            stats: { goals: 0, assists: 0, shots: 0, penalties: 0 } 
                                        })) 
                                    },
                                    goalies: {
                                        home: prev.goalies.home.map(g => ({ ...g, stats: { saves: 0, goals_against: 0, shots_faced: 0 } })),
                                        away: prev.goalies.away.map(g => ({ ...g, stats: { saves: 0, goals_against: 0, shots_faced: 0 } }))
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
                            onClick={() => {
                                const gameData = {
                                    home_team: gameState.home_team,
                                    away_team: gameState.away_team,
                                    goalies: gameState.goalies,
                                    time_remaining: formatTime(gameState.time_remaining),
                                    current_period: gameState.current_period,
                                    final_score: `${gameState.home_team.score}-${gameState.away_team.score}`,
                                    winner: gameState.home_team.score > gameState.away_team.score ? gameState.home_team : gameState.away_team,
                                    entry_type: 'enhanced_live_stats',
                                    entry_time: new Date().toISOString(),
                                    game_duration: gameState.current_period,
                                    period_length: gameState.period_length,
                                    detailed_stats: true
                                };
                                onSubmit(gameData);
                            }}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            ✅ Save Game Stats
                        </button>
                    </div>
                </div>
            </div>

            {/* Time Editor Dialog */}
            {renderTimeEditor()}
        </div>
    );
};

export default EnhancedLiveStatsEntry;