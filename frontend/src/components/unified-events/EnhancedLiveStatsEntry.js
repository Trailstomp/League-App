import React, { useState, useEffect, useRef } from 'react';

const EnhancedLiveStatsEntry = ({ event, teams, currentUser, onSubmit, onCancel }) => {
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

    // Live Chat State
    const [chat, setChat] = useState({
        messages: [],
        newMessage: ''
    });

    // Game Events State (for narration)
    const [gameEvents, setGameEvents] = useState([]);
    const [gameStarted, setGameStarted] = useState(false); // Track if game has started
    
    // Shot type selector state
    const [showShotMenu, setShowShotMenu] = useState(null); // stores player id when menu is open
    
    // Team shot modal state
    const [showTeamShotModal, setShowTeamShotModal] = useState(false);
    const [teamShotModalTeam, setTeamShotModalTeam] = useState(null); // 'home_team' or 'away_team'
    const [teamShotInput, setTeamShotInput] = useState({
        playerId: 'unknown',
        shotType: '',
        timestamp: ''
    });
    
    // Event editing state
    const [editingEvent, setEditingEvent] = useState(null);
    const [editText, setEditText] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editEventInput, setEditEventInput] = useState({
        playerId: '',
        shotType: '',
        teamKey: '',
        timestamp: ''
    });
    
    // Close shot menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showShotMenu && !event.target.closest('.shot-button-container')) {
                setShowShotMenu(null);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showShotMenu]);
    
    // Timeout tracking
    const [timeouts, setTimeouts] = useState({
        home: 0,
        away: 0
    });
    
    // Manual player addition state
    const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
    const [addPlayerTeam, setAddPlayerTeam] = useState(null);
    const [newPlayerInput, setNewPlayerInput] = useState({
        number: '',
        firstName: '',
        lastName: '',
        position: 'Forward'
    });

    // Live View Settings State
    const [liveViewSettings, setLiveViewSettings] = useState({
        backgroundType: 'banners',
        bannerOpacity: 0.3,
        useTeamFonts: true
    });

    const timerRef = useRef(null);
    const autoSaveRef = useRef(null);
    const penaltyTimersRef = useRef([]);
    const chatEndRef = useRef(null);
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
            const updateTeamPenalties = (teamPenalties, teamKey) => {
                const expiredPenalties = [];
                
                const updatedPenalties = teamPenalties.map(penalty => {
                    if (penalty.timeRemaining > 0) {
                        const newTimeRemaining = penalty.timeRemaining - 1;
                        
                        // Check if penalty just expired
                        if (newTimeRemaining === 0) {
                            expiredPenalties.push(penalty);
                        }
                        
                        return {
                            ...penalty,
                            timeRemaining: newTimeRemaining
                        };
                    }
                    return penalty;
                }).filter(penalty => penalty.timeRemaining > 0); // Remove expired penalties
                
                // Log expiration events
                expiredPenalties.forEach(penalty => {
                    const teamName = teamKey === 'home' ? gameState.home_team.name : gameState.away_team.name;
                    addGameEvent(`✅ Penalty expired - ${teamName} - #${penalty.playerNumber} ${penalty.playerName} back on ice`, 'penalty_end');
                });
                
                return updatedPenalties;
            };
            
            return {
                home: updateTeamPenalties(prev.home, 'home'),
                away: updateTeamPenalties(prev.away, 'away')
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
                penalties: penalties, // Include active penalties for live view
                gameEvents: gameEvents, // Include game narration events
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
    }, [event, gameState, penalties, backendUrl]);

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

    // Fetch website style settings for live view
    useEffect(() => {
        const fetchWebsiteStyle = async () => {
            try {
                const response = await fetch(`${backendUrl}/api/league-data`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.websiteStyle) {
                        setLiveViewSettings({
                            backgroundType: data.websiteStyle.liveViewBackgroundType || 'banners',
                            bannerOpacity: data.websiteStyle.liveViewBannerOpacity || 0.3,
                            useTeamFonts: data.websiteStyle.liveViewUseTeamFonts !== false
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching website style:', error);
            }
        };
        fetchWebsiteStyle();
    }, [backendUrl]);

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
                    color: homeTeam?.style?.primaryColor || '#3b82f6',
                    banner: homeTeam?.style?.bannerUrl || null,
                    font: homeTeam?.style?.font || 'Inter, sans-serif',
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
                    color: awayTeam?.style?.accentColor || awayTeam?.style?.primaryColor || '#ef4444',
                    banner: awayTeam?.style?.bannerUrl || null,
                    font: awayTeam?.style?.font || 'Inter, sans-serif',
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

    // Format player name as "Last, First"
    const formatPlayerName = (name) => {
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return name;
        const lastName = parts[parts.length - 1];
        const firstName = parts.slice(0, -1).join(' ');
        return `${lastName}, ${firstName}`;
    };

    // Add game event for narration
    const addGameEvent = (eventText, eventType = 'action', metadata = {}) => {
        const newEvent = {
            id: Date.now(),
            time: formatTime(gameState.time_remaining),
            timeInSeconds: gameState.time_remaining, // Add seconds for sorting
            period: gameState.current_period,
            text: eventText,
            type: eventType,
            timestamp: new Date().toISOString(),
            metadata: metadata // Store additional data for editing (teamKey, playerId, shotType, etc.)
        };
        
        setGameEvents(prev => [newEvent, ...prev]); // Add to beginning for newest first
        console.log('📝 Game Event:', eventText);
    };

    const toggleTimer = () => {
        setGameState(prev => {
            const newIsRunning = !prev.is_running;
            
            // Add game start event on first timer start (only once)
            if (newIsRunning && !gameStarted && prev.time_remaining === prev.period_length * 60 && prev.current_period === 1) {
                addGameEvent(`🏁 GAME START - ${gameState.home_team.name} vs ${gameState.away_team.name}`, 'game_start');
                setGameStarted(true);
            }
            // Add resume event when resuming after pause
            else if (newIsRunning && prev.is_running === false && gameStarted) {
                addGameEvent(`▶️ GAME RESUMED - Play continues`, 'game_resume');
            }
            // Add pause event when pausing
            else if (!newIsRunning && prev.is_running === true) {
                addGameEvent(`⏸️ GAME PAUSED`, 'game_pause');
            }
            
            return { ...prev, is_running: newIsRunning };
        });

        // Update event status to in_progress when starting
        if (!gameState.is_running && event?.id) {
            console.log('🎬 Game started, updating event status to in_progress');
            updateEventStatus(event.id, 'in_progress');
        }
    };

    // Call timeout
    const callTimeout = (team) => {
        const teamName = team === 'home' ? gameState.home_team.name : gameState.away_team.name;
        
        // Pause the game timer
        setGameState(prev => ({ ...prev, is_running: false }));
        
        setTimeouts(prev => ({
            ...prev,
            [team]: prev[team] + 1
        }));
        addGameEvent(`⏸️ TIMEOUT called by ${teamName} (Timeout #${timeouts[team] + 1})`, 'timeout');
        addGameEvent(`⏸️ GAME PAUSED for timeout`, 'game_pause');
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

    // Enhanced stat adding with shot types (miss, saved, goal)
    const addShotStat = (teamKey, playerId, shotType) => {
        // shotType: 'miss', 'saved', 'goal'
        const player = gameState[teamKey].players.find(p => p.id === playerId);
        const teamName = gameState[teamKey].name;
        
        // Update game state
        setGameState(prev => {
            const newState = { ...prev };
            
            // Update player stats based on shot type
            newState[teamKey] = {
                ...prev[teamKey],
                players: prev[teamKey].players.map(p => {
                    if (p.id === playerId) {
                        const newStats = { ...p.stats };
                        
                        // Only saved and goal count as shots on goal
                        if (shotType === 'saved' || shotType === 'goal') {
                            newStats.shots += 1;
                        }
                        
                        // Goals increment goal count and team score
                        if (shotType === 'goal') {
                            newStats.goals += 1;
                        }
                        
                        return { ...p, stats: newStats };
                    }
                    return p;
                })
            };

            // Update team score and goalie stats for goals
            if (shotType === 'goal') {
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
                                shots_faced: goalie.stats.shots_faced + 1,
                                goals_against: goalie.stats.goals_against + 1
                            }
                        } : goalie
                    )
                };
            }

            // Update opposing goalie's shots faced and saves for saved shots
            if (shotType === 'saved') {
                const opposingTeamKey = teamKey === 'home_team' ? 'away' : 'home';
                newState.goalies = {
                    ...prev.goalies,
                    [opposingTeamKey]: prev.goalies[opposingTeamKey].map(goalie => 
                        goalie.active ? {
                            ...goalie,
                            stats: {
                                ...goalie.stats,
                                shots_faced: goalie.stats.shots_faced + 1,
                                saves: goalie.stats.saves + 1
                            }
                        } : goalie
                    )
                };
            }

            return newState;
        });

        // Add game event narration AFTER state update
        if (player) {
            const opposingTeamKey = teamKey === 'home_team' ? 'away_team' : 'home_team';
            const opposingTeamName = gameState[opposingTeamKey].name;
            const opposingGoalieKey = teamKey === 'home_team' ? 'away' : 'home';
            const activeGoalie = gameState.goalies[opposingGoalieKey].find(g => g.active);
            
            // Create single consolidated event with goalie info
            let eventText = '';
            let eventType = '';
            
            if (shotType === 'miss') {
                eventText = `❌ ${teamName} - #${player.number} ${player.name} - Shot misses`;
                eventType = 'shot_miss';
            } else if (shotType === 'saved') {
                eventText = `✋ ${teamName} - #${player.number} ${player.name} - Shot on goal`;
                if (activeGoalie) {
                    eventText += ` - SAVED by ${opposingTeamName} Goalie #${activeGoalie.number} ${activeGoalie.name}`;
                }
                eventType = 'shot';
            } else if (shotType === 'goal') {
                eventText = `🚨 GOAL! ${teamName} - #${player.number} ${player.name} scores!`;
                if (activeGoalie) {
                    eventText += ` (Against ${opposingTeamName} Goalie #${activeGoalie.number} ${activeGoalie.name})`;
                }
                eventType = 'goal';
            }
            
            addGameEvent(eventText, eventType, { teamKey, playerId, shotType, timestamp: formatTime(gameState.time_remaining) });
        }
    };

    // Open team shot modal
    const openTeamShotModal = (team) => {
        setTeamShotModalTeam(team);
        setTeamShotInput({
            playerId: 'unknown',
            shotType: '',
            timestamp: formatTime(gameState.time_remaining)
        });
        setShowTeamShotModal(true);
    };

    // Handle team shot submission (with unknown player support)
    const submitTeamShot = () => {
        if (!teamShotInput.shotType) {
            alert('Please select a shot type');
            return;
        }

        const teamKey = teamShotModalTeam;
        const playerId = teamShotInput.playerId;
        const shotType = teamShotInput.shotType;

        if (playerId === 'unknown') {
            // Handle unknown player shot
            const teamName = gameState[teamKey].name;
            const opposingTeamKey = teamKey === 'home_team' ? 'away_team' : 'home_team';
            const opposingTeamName = gameState[opposingTeamKey].name;
            const opposingGoalieKey = teamKey === 'home_team' ? 'away' : 'home';
            const activeGoalie = gameState.goalies[opposingGoalieKey].find(g => g.active);

            setGameState(prev => {
                const newState = { ...prev };

                // Update team score for goals
                if (shotType === 'goal') {
                    newState[teamKey].score = prev[teamKey].score + 1;

                    // Update opposing goalie's goals against
                    newState.goalies = {
                        ...prev.goalies,
                        [opposingGoalieKey]: prev.goalies[opposingGoalieKey].map(goalie => 
                            goalie.active ? {
                                ...goalie,
                                stats: {
                                    ...goalie.stats,
                                    shots_faced: goalie.stats.shots_faced + 1,
                                    goals_against: goalie.stats.goals_against + 1
                                }
                            } : goalie
                        )
                    };
                }

                // Update opposing goalie's shots faced and saves for saved shots
                if (shotType === 'saved') {
                    newState.goalies = {
                        ...prev.goalies,
                        [opposingGoalieKey]: prev.goalies[opposingGoalieKey].map(goalie => 
                            goalie.active ? {
                                ...goalie,
                                stats: {
                                    ...goalie.stats,
                                    shots_faced: goalie.stats.shots_faced + 1,
                                    saves: goalie.stats.saves + 1
                                }
                            } : goalie
                        )
                    };
                }

                return newState;
            });

            // Add consolidated game event for unknown player
            let eventText = '';
            let eventType = '';
            
            if (shotType === 'miss') {
                eventText = `❌ ${teamName} - Unknown Player - Shot misses`;
                eventType = 'shot_miss';
            } else if (shotType === 'saved') {
                eventText = `✋ ${teamName} - Unknown Player - Shot on goal`;
                if (activeGoalie) {
                    eventText += ` - SAVED by ${opposingTeamName} Goalie #${activeGoalie.number} ${activeGoalie.name}`;
                }
                eventType = 'shot';
            } else if (shotType === 'goal') {
                eventText = `🚨 GOAL! ${teamName} - Unknown Player scores!`;
                if (activeGoalie) {
                    eventText += ` (Against ${opposingTeamName} Goalie #${activeGoalie.number} ${activeGoalie.name})`;
                }
                eventType = 'goal';
            }
            
            addGameEvent(eventText, eventType, { teamKey, playerId: 'unknown', shotType, timestamp: teamShotInput.timestamp });
        } else {
            // Handle known player shot using existing function
            addShotStat(teamKey, playerId, shotType);
        }

        // Close modal
        setShowTeamShotModal(false);
        setTeamShotInput({ playerId: 'unknown', shotType: '', timestamp: '' });
    };


    // Add assists and other stats
    const addStat = (teamKey, playerId, statType) => {
        const player = gameState[teamKey].players.find(p => p.id === playerId);
        const teamName = gameState[teamKey].name;
        
        setGameState(prev => {
            const newState = { ...prev };
            
            newState[teamKey] = {
                ...prev[teamKey],
                players: prev[teamKey].players.map(p => {
                    if (p.id === playerId) {
                        const newStats = { ...p.stats };
                        newStats[statType] += 1;
                        return { ...p, stats: newStats };
                    }
                    return p;
                })
            };

            return newState;
        });

        // Add game event for assists
        if (player && statType === 'assists') {
            addGameEvent(`🎯 ${teamName} - #${player.number} ${player.name} with an assist`, 'assist');
        }
    };

    // Handle shot event editing (updates actual game stats)
    const handleShotEventEdit = (originalEvent) => {
        const oldMetadata = originalEvent.metadata || {};
        const newPlayerId = editEventInput.playerId;
        const newShotType = editEventInput.shotType;
        const oldPlayerId = oldMetadata.playerId;
        const oldShotType = oldMetadata.shotType;
        const teamKey = editEventInput.teamKey || oldMetadata.teamKey;

        if (!teamKey || !newShotType) {
            alert('Missing shot details');
            return;
        }

        const opposingTeamKey = teamKey === 'home_team' ? 'away_team' : 'home_team';
        const opposingGoalieKey = teamKey === 'home_team' ? 'away' : 'home';

        // Reverse old stats completely
        setGameState(prev => {
            const newState = { ...prev };

            // Reverse old player stats
            if (oldPlayerId && oldPlayerId !== 'unknown') {
                newState[teamKey] = {
                    ...prev[teamKey],
                    players: prev[teamKey].players.map(p => {
                        if (p.id === oldPlayerId) {
                            const newStats = { ...p.stats };
                            if (oldShotType === 'saved' || oldShotType === 'goal') {
                                newStats.shots = Math.max(0, newStats.shots - 1);
                            }
                            if (oldShotType === 'goal') {
                                newStats.goals = Math.max(0, newStats.goals - 1);
                            }
                            return { ...p, stats: newStats };
                        }
                        return p;
                    })
                };
            }

            // Reverse old team score
            if (oldShotType === 'goal') {
                newState[teamKey].score = Math.max(0, prev[teamKey].score - 1);
            }

            // Reverse old goalie stats
            if (oldShotType === 'goal') {
                newState.goalies = {
                    ...prev.goalies,
                    [opposingGoalieKey]: prev.goalies[opposingGoalieKey].map(goalie => 
                        goalie.active ? {
                            ...goalie,
                            stats: {
                                ...goalie.stats,
                                shots_faced: Math.max(0, goalie.stats.shots_faced - 1),
                                goals_against: Math.max(0, goalie.stats.goals_against - 1)
                            }
                        } : goalie
                    )
                };
            } else if (oldShotType === 'saved') {
                newState.goalies = {
                    ...prev.goalies,
                    [opposingGoalieKey]: prev.goalies[opposingGoalieKey].map(goalie => 
                        goalie.active ? {
                            ...goalie,
                            stats: {
                                ...goalie.stats,
                                shots_faced: Math.max(0, goalie.stats.shots_faced - 1),
                                saves: Math.max(0, goalie.stats.saves - 1)
                            }
                        } : goalie
                    )
                };
            }

            return newState;
        });

        // Apply new stats (without creating a new event)
        setTimeout(() => {
            setGameState(prev => {
                const newState = { ...prev };

                // Apply new player stats
                if (newPlayerId !== 'unknown') {
                    newState[teamKey] = {
                        ...prev[teamKey],
                        players: prev[teamKey].players.map(p => {
                            if (p.id === newPlayerId) {
                                const newStats = { ...p.stats };
                                if (newShotType === 'saved' || newShotType === 'goal') {
                                    newStats.shots += 1;
                                }
                                if (newShotType === 'goal') {
                                    newStats.goals += 1;
                                }
                                return { ...p, stats: newStats };
                            }
                            return p;
                        })
                    };
                }

                // Apply new team score
                if (newShotType === 'goal') {
                    newState[teamKey].score = prev[teamKey].score + 1;
                }

                // Apply new goalie stats
                if (newShotType === 'goal') {
                    newState.goalies = {
                        ...prev.goalies,
                        [opposingGoalieKey]: prev.goalies[opposingGoalieKey].map(goalie => 
                            goalie.active ? {
                                ...goalie,
                                stats: {
                                    ...goalie.stats,
                                    shots_faced: goalie.stats.shots_faced + 1,
                                    goals_against: goalie.stats.goals_against + 1
                                }
                            } : goalie
                        )
                    };
                } else if (newShotType === 'saved') {
                    newState.goalies = {
                        ...prev.goalies,
                        [opposingGoalieKey]: prev.goalies[opposingGoalieKey].map(goalie => 
                            goalie.active ? {
                                ...goalie,
                                stats: {
                                    ...goalie.stats,
                                    shots_faced: goalie.stats.shots_faced + 1,
                                    saves: goalie.stats.saves + 1
                                }
                            } : goalie
                        )
                    };
                }

                return newState;
            });
        }, 50);

        // Update event with new metadata and text (keep original time unless user changed it)
        const newText = generateShotEventText(teamKey, newPlayerId, newShotType);
        const [mins, secs] = editTime.split(':').map(Number);
        const newTimeInSeconds = mins * 60 + secs;

        setGameEvents(prev => prev.map(e => 
            e.id === originalEvent.id ? { 
                ...e, 
                text: newText,
                time: editTime,
                timeInSeconds: newTimeInSeconds,
                metadata: { ...oldMetadata, playerId: newPlayerId, shotType: newShotType, teamKey }
            } : e
        ));

        setEditingEvent(null);
    };

    // Generate shot event text
    const generateShotEventText = (teamKey, playerId, shotType) => {
        const teamName = gameState[teamKey].name;
        if (playerId === 'unknown') {
            if (shotType === 'miss') return `❌ ${teamName} - Unknown Player - Shot misses`;
            if (shotType === 'saved') return `🥍 ${teamName} - Unknown Player - Shot on goal`;
            if (shotType === 'goal') return `🚨 GOAL! ${teamName} - Unknown Player scores!`;
        } else {
            const player = gameState[teamKey].players.find(p => p.id === playerId);
            if (player) {
                if (shotType === 'miss') return `❌ ${teamName} - #${player.number} ${player.name} - Shot misses`;
                if (shotType === 'saved') return `🥍 ${teamName} - #${player.number} ${player.name} - Shot on goal`;
                if (shotType === 'goal') return `🚨 GOAL! ${teamName} - #${player.number} ${player.name} scores!`;
            }
        }
        return 'Shot event';
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

    // Add manual player
    const addManualPlayer = () => {
        if (!newPlayerInput.number || !newPlayerInput.firstName || !newPlayerInput.lastName) {
            alert('Please fill in all required fields');
            return;
        }

        const newPlayer = {
            id: `manual_${Date.now()}`,
            number: newPlayerInput.number,
            name: `${newPlayerInput.firstName} ${newPlayerInput.lastName}`,
            position: newPlayerInput.position,
            active: true,
            stats: { goals: 0, assists: 0, shots: 0, penalties: 0 }
        };

        setGameState(prev => ({
            ...prev,
            [addPlayerTeam]: {
                ...prev[addPlayerTeam],
                players: [...prev[addPlayerTeam].players, newPlayer]
            }
        }));

        // Reset and close
        setNewPlayerInput({ number: '', firstName: '', lastName: '', position: 'Forward' });
        setShowAddPlayerModal(false);
        setAddPlayerTeam(null);
        
        addGameEvent(`➕ Player added: #${newPlayer.number} ${newPlayer.name}`, 'admin');
    };

    // Assign penalty to player
    const assignPenalty = (teamKey, playerId, playerName, playerNumber) => {
        const penaltyType = penaltyInput.type === 'Other (specify)' ? penaltyInput.customType : penaltyInput.type;
        const duration = parseFloat(penaltyInput.duration) || 2; // Allow decimal for 1.5 minutes
        
        const team = teamKey.split('_')[0]; // 'home_team' -> 'home'
        const teamName = gameState[teamKey].name;
        
        const newPenalty = {
            id: Date.now().toString(),
            playerId,
            playerName,
            playerNumber,
            team: teamKey,
            type: penaltyType,
            duration: duration,
            timeRemaining: duration * 60, // Convert minutes to seconds (no extra 90 seconds)
            startTime: Date.now()
        };

        setPenalties(prev => ({
            ...prev,
            [team]: [...prev[team], newPenalty]
        }));

        // Update player's penalty minutes
        setGameState(prev => ({
            ...prev,
            [teamKey]: {
                ...prev[teamKey],
                players: prev[teamKey].players.map(p =>
                    p.id === playerId
                        ? { ...p, stats: { ...p.stats, penalties: p.stats.penalties + duration } }
                        : p
                )
            }
        }));

        // Add game event
        const minutes = Math.floor(duration);
        const seconds = Math.round((duration - minutes) * 60);
        const timeDisplay = seconds > 0 ? `${minutes}:${seconds < 10 ? '0' : ''}${seconds}` : `${minutes}:00`;
        addGameEvent(`⚠️ PENALTY! ${teamName} - #${playerNumber} ${playerName} - ${penaltyType} (${timeDisplay})`, 'penalty');

        // Close modal and reset
        setShowPenaltyModal(false);
        setSelectedPlayerForPenalty(null);
        setPenaltyInput({ type: '', duration: 2, customType: '' });
    };

    // Live Chat Functions
    const loadChatMessages = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/events/${event.id}/chat`);
            if (response.ok) {
                const data = await response.json();
                setChat(prev => ({
                    ...prev,
                    messages: data.messages || []
                }));
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        }
    };

    const handleSendMessage = async () => {
        if (chat.newMessage.trim()) {
            const userName = currentUser?.name || currentUser?.user_name || 'Scorer';
            const newMsg = {
                id: Date.now(),
                user_name: userName,
                message: chat.newMessage,
                timestamp: new Date().toISOString(),
                type: 'user'
            };

            // Optimistically add message
            setChat(prev => ({
                ...prev,
                messages: [...prev.messages, newMsg],
                newMessage: ''
            }));

            try {
                await fetch(`${backendUrl}/api/events/${event.id}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: chat.newMessage,
                        event_id: event.id,
                        timestamp: new Date().toISOString(),
                        user_name: userName
                    })
                });
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    // Load chat messages on mount
    useEffect(() => {
        if (event?.id) {
            loadChatMessages();
            
            // Poll for new messages every 5 seconds
            const chatInterval = setInterval(loadChatMessages, 5000);
            return () => clearInterval(chatInterval);
        }
    }, [event?.id]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat.messages]);

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

    // Render Penalty Assignment Modal
    const renderPenaltyModal = () => {
        if (!showPenaltyModal || !selectedPlayerForPenalty) return null;
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                    <h3 className="text-xl font-bold mb-4">Assign Penalty</h3>
                    
                    <div className="mb-4 p-3 bg-gray-100 rounded">
                        <div className="font-bold">#{selectedPlayerForPenalty.number} {selectedPlayerForPenalty.name}</div>
                        <div className="text-sm text-gray-600">{selectedPlayerForPenalty.position}</div>
                    </div>
                    
                    {/* Penalty Type */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Penalty Type</label>
                        <select
                            value={penaltyInput.type}
                            onChange={(e) => setPenaltyInput(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-3 py-2 border rounded"
                        >
                            <option value="">Select penalty type...</option>
                            {penaltyTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Custom Type (if Other selected) */}
                    {penaltyInput.type === 'Other (specify)' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Specify Penalty</label>
                            <input
                                type="text"
                                value={penaltyInput.customType}
                                onChange={(e) => setPenaltyInput(prev => ({ ...prev, customType: e.target.value }))}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Enter penalty type..."
                            />
                        </div>
                    )}
                    
                    {/* Duration */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                        <div className="grid grid-cols-5 gap-2">
                            {[1.5, 2, 4, 5, 10].map(mins => (
                                <button
                                    key={mins}
                                    onClick={() => setPenaltyInput(prev => ({ ...prev, duration: mins }))}
                                    className={`px-3 py-2 rounded font-medium text-sm ${
                                        penaltyInput.duration === mins
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {mins === 1.5 ? '1:30' : `${mins} min`}
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            step="0.5"
                            value={penaltyInput.duration}
                            onChange={(e) => setPenaltyInput(prev => ({ ...prev, duration: parseFloat(e.target.value) || 2 }))}
                            className="w-full px-3 py-2 border rounded mt-2"
                            min="0.5"
                            max="20"
                            placeholder="Or enter custom duration..."
                        />
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setShowPenaltyModal(false);
                                setSelectedPlayerForPenalty(null);
                                setPenaltyInput({ type: '', duration: 2, customType: '' });
                            }}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => assignPenalty(
                                selectedPlayerForPenalty.teamKey,
                                selectedPlayerForPenalty.id,
                                selectedPlayerForPenalty.name,
                                selectedPlayerForPenalty.number
                            )}
                            disabled={!penaltyInput.type || (penaltyInput.type === 'Other (specify)' && !penaltyInput.customType)}
                            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Assign Penalty
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Render Team Shot Modal
    const renderTeamShotModal = () => {
        if (!showTeamShotModal || !teamShotModalTeam) return null;

        const teamKey = teamShotModalTeam;
        const teamName = gameState[teamKey].name;
        const teamPlayers = gameState[teamKey].players.filter(p => p.active);

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                    <h3 className="text-xl font-bold mb-4">Record Shot - {teamName}</h3>
                    
                    {/* Player Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Player</label>
                        <select
                            value={teamShotInput.playerId}
                            onChange={(e) => setTeamShotInput(prev => ({ ...prev, playerId: e.target.value }))}
                            className="w-full px-3 py-2 border rounded"
                        >
                            <option value="unknown">Unknown Player</option>
                            {teamPlayers.map(player => (
                                <option key={player.id} value={player.id}>
                                    #{player.number} {player.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Shot Type Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Shot Type</label>
                        <div className="space-y-2">
                            <button
                                onClick={() => setTeamShotInput(prev => ({ ...prev, shotType: 'miss' }))}
                                className={`w-full px-4 py-3 rounded-lg border-2 flex items-center gap-3 ${
                                    teamShotInput.shotType === 'miss'
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-2xl">❌</span>
                                <div className="text-left">
                                    <div className="font-bold">Miss</div>
                                    <div className="text-xs text-gray-600">Shot misses the goal</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setTeamShotInput(prev => ({ ...prev, shotType: 'saved' }))}
                                className={`w-full px-4 py-3 rounded-lg border-2 flex items-center gap-3 ${
                                    teamShotInput.shotType === 'saved'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-2xl">✋</span>
                                <div className="text-left">
                                    <div className="font-bold">Saved</div>
                                    <div className="text-xs text-gray-600">Shot on goal - saved by goalie</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setTeamShotInput(prev => ({ ...prev, shotType: 'goal' }))}
                                className={`w-full px-4 py-3 rounded-lg border-2 flex items-center gap-3 ${
                                    teamShotInput.shotType === 'goal'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-2xl">🚨</span>
                                <div className="text-left">
                                    <div className="font-bold">Goal</div>
                                    <div className="text-xs text-gray-600">Shot scores!</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Timestamp Display */}
                    <div className="mb-4 p-3 bg-gray-100 rounded text-center">
                        <div className="text-sm text-gray-600">Time</div>
                        <div className="font-mono font-bold text-lg">{teamShotInput.timestamp}</div>
                        <div className="text-xs text-gray-500">Period {gameState.current_period}</div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setShowTeamShotModal(false);
                                setTeamShotInput({ playerId: 'unknown', shotType: '', timestamp: '' });
                            }}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submitTeamShot}
                            disabled={!teamShotInput.shotType}
                            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Record Shot
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    // Cancel penalty with reason
    const cancelPenalty = (penaltyId, team) => {
        const reasons = [
            'Opposing team scored',
            'Period ended',
            'Scorer error',
            'Other'
        ];
        
        const reason = window.prompt(`Why cancel this penalty?\n\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nEnter number (1-4):`);
        
        if (reason) {
            const reasonIndex = parseInt(reason) - 1;
            const reasonText = reasons[reasonIndex] || reasons[3];
            
            // Find penalty info before removing
            const penalty = penalties[team].find(p => p.id === penaltyId);
            if (penalty) {
                addGameEvent(`✅ Penalty cancelled - #${penalty.playerNumber} ${penalty.playerName} - Reason: ${reasonText}`, 'admin');
            }
            
            // Remove penalty
            setPenalties(prev => ({
                ...prev,
                [team]: prev[team].filter(p => p.id !== penaltyId)
            }));
        }
    };

    // Render Active Penalties Box
    const renderActivePenalties = () => {
        const homePenalties = penalties.home || [];
        const awayPenalties = penalties.away || [];
        const totalPenalties = homePenalties.length + awayPenalties.length;
        
        if (totalPenalties === 0) return null;
        
        // Determine Man Up / Penalty Kill status
        const homeManDown = homePenalties.length > awayPenalties.length;
        const awayManDown = awayPenalties.length > homePenalties.length;
        
        return (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold mb-3 text-gray-800">⚠️ Active Penalties</h3>
                
                {/* Man Up / Penalty Kill Indicators */}
                {(homeManDown || awayManDown) && (
                    <div className="flex justify-between mb-3 font-bold text-sm">
                        <div className={homeManDown ? 'text-red-600' : 'text-green-600'}>
                            {gameState.home_team.name}: {homeManDown ? '🛡️ PENALTY KILL' : '⚡ MAN UP'}
                        </div>
                        <div className={awayManDown ? 'text-red-600' : 'text-green-600'}>
                            {gameState.away_team.name}: {awayManDown ? '🛡️ PENALTY KILL' : '⚡ MAN UP'}
                        </div>
                    </div>
                )}
                
                {/* Penalties List */}
                <div className="space-y-2">
                    {homePenalties.map(penalty => (
                        <div 
                            key={penalty.id} 
                            className={`p-3 rounded ${
                                penalty.timeRemaining <= 10 ? 'bg-red-200 animate-pulse' : 'bg-white'
                            } border border-gray-300`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    <div>
                                        <span className="font-bold">{gameState.home_team.name}</span>
                                        <span className="mx-2">-</span>
                                        <span>#{penalty.playerNumber} {penalty.playerName}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">{penalty.type}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <div className={`text-xl font-bold font-mono ${
                                            penalty.timeRemaining <= 10 ? 'text-red-600' : 'text-gray-800'
                                        }`}>
                                            {formatTime(penalty.timeRemaining)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => {
                                                const newTime = prompt('Edit penalty time (in seconds):', penalty.timeRemaining);
                                                if (newTime && !isNaN(parseInt(newTime))) {
                                                    setPenalties(prev => ({
                                                        ...prev,
                                                        home: prev.home.map(p => 
                                                            p.id === penalty.id 
                                                                ? { ...p, timeRemaining: parseInt(newTime) }
                                                                : p
                                                        )
                                                    }));
                                                }
                                            }}
                                            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded"
                                            title="Edit time"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => cancelPenalty(penalty.id, 'home')}
                                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded"
                                            title="Cancel penalty"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {awayPenalties.map(penalty => (
                        <div 
                            key={penalty.id} 
                            className={`p-3 rounded ${
                                penalty.timeRemaining <= 10 ? 'bg-red-200 animate-pulse' : 'bg-white'
                            } border border-gray-300`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    <div>
                                        <span className="font-bold">{gameState.away_team.name}</span>
                                        <span className="mx-2">-</span>
                                        <span>#{penalty.playerNumber} {penalty.playerName}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">{penalty.type}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <div className={`text-xl font-bold font-mono ${
                                            penalty.timeRemaining <= 10 ? 'text-red-600' : 'text-gray-800'
                                        }`}>
                                            {formatTime(penalty.timeRemaining)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => {
                                                const newTime = prompt('Edit penalty time (in seconds):', penalty.timeRemaining);
                                                if (newTime && !isNaN(parseInt(newTime))) {
                                                    setPenalties(prev => ({
                                                        ...prev,
                                                        away: prev.away.map(p => 
                                                            p.id === penalty.id 
                                                                ? { ...p, timeRemaining: parseInt(newTime) }
                                                                : p
                                                        )
                                                    }));
                                                }
                                            }}
                                            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded"
                                            title="Edit time"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => cancelPenalty(penalty.id, 'away')}
                                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded"
                                            title="Cancel penalty"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Fixed sticky header with split team banners, clock, scores, and goalies
    const renderStickyHeader = () => (
        <div className="fixed top-0 left-0 right-0 z-50 shadow-md bg-white">
            {/* Split Banner Header - Responsive */}
            <div className="flex flex-col md:flex-row relative">
                {/* Home Team Side */}
                <div 
                    className="flex-1 relative overflow-hidden"
                    style={{
                        backgroundColor: liveViewSettings.backgroundType === 'banners' && gameState.home_team.banner
                            ? 'transparent'
                            : liveViewSettings.backgroundType === 'gradient'
                            ? 'transparent'
                            : gameState.home_team.color || '#3b82f6',
                        backgroundImage: liveViewSettings.backgroundType === 'banners' && gameState.home_team.banner
                            ? `linear-gradient(rgba(0, 0, 0, ${liveViewSettings.bannerOpacity}), rgba(0, 0, 0, ${liveViewSettings.bannerOpacity})), url(${gameState.home_team.banner})`
                            : liveViewSettings.backgroundType === 'gradient'
                            ? `linear-gradient(to right, ${gameState.home_team.color}, ${gameState.home_team.color}dd)`
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="p-2 md:p-4 text-white relative z-10">
                        <div className="flex items-center gap-2 md:gap-3 justify-center md:justify-start">
                            {gameState.home_team.logo && (
                                <img 
                                    src={gameState.home_team.logo} 
                                    alt={gameState.home_team.name}
                                    className="w-8 h-8 md:w-12 md:h-12 object-cover rounded-lg border-2 border-white shadow-lg"
                                />
                            )}
                            <div style={{ fontFamily: liveViewSettings.useTeamFonts ? gameState.home_team.font : 'Inter, sans-serif' }}>
                                <div className="text-xs md:text-sm font-medium">{gameState.home_team.name}</div>
                                <div className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">{gameState.home_team.score}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Clock & Period - Absolute on desktop, separate row on mobile */}
                <div className="md:absolute md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 z-30 bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-1 p-2 md:gap-2 md:p-3">
                        {/* Timer - Clickable */}
                        <div 
                            className={`px-3 py-1 md:px-6 md:py-2 rounded-lg border-2 cursor-pointer hover:opacity-90 transition ${
                                gameState.is_running 
                                    ? 'bg-green-600 border-green-400' 
                                    : 'bg-red-600 border-red-400'
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
                            <div className="text-xl md:text-3xl font-bold text-white font-mono">
                                {formatTime(gameState.time_remaining)}
                            </div>
                        </div>
                        {/* Period */}
                        <div className="px-2 py-0.5 md:px-4 md:py-1 rounded text-white text-xs md:text-sm font-medium">
                            Period {gameState.current_period} of {gameState.game_settings.periods}
                        </div>
                    </div>
                </div>

                {/* Away Team Side */}
                <div 
                    className="flex-1 relative overflow-hidden"
                    style={{
                        backgroundColor: liveViewSettings.backgroundType === 'banners' && gameState.away_team.banner
                            ? 'transparent'
                            : liveViewSettings.backgroundType === 'gradient'
                            ? 'transparent'
                            : gameState.away_team.color || '#ef4444',
                        backgroundImage: liveViewSettings.backgroundType === 'banners' && gameState.away_team.banner
                            ? `linear-gradient(rgba(0, 0, 0, ${liveViewSettings.bannerOpacity}), rgba(0, 0, 0, ${liveViewSettings.bannerOpacity})), url(${gameState.away_team.banner})`
                            : liveViewSettings.backgroundType === 'gradient'
                            ? `linear-gradient(to left, ${gameState.away_team.color}, ${gameState.away_team.color}dd)`
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="p-2 md:p-4 text-white relative z-10">
                        <div className="flex items-center gap-2 md:gap-3 justify-center md:justify-end">
                            <div className="text-right md:order-1" style={{ fontFamily: liveViewSettings.useTeamFonts ? gameState.away_team.font : 'Inter, sans-serif' }}>
                                <div className="text-xs md:text-sm font-medium">{gameState.away_team.name}</div>
                                <div className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">{gameState.away_team.score}</div>
                            </div>
                            {gameState.away_team.logo && (
                                <img 
                                    src={gameState.away_team.logo} 
                                    alt={gameState.away_team.name}
                                    className="w-8 h-8 md:w-12 md:h-12 object-cover rounded-lg border-2 border-white shadow-lg md:order-2"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Title Bar */}
            <div className="bg-white px-2 md:px-4 py-1 md:py-2 border-b border-gray-200">
                <div className="text-center">
                    <h2 className="text-sm md:text-lg font-bold text-gray-800">{event?.title || 'Live Game Scoring'}</h2>
                </div>
            </div>

            {/* Control Buttons Bar - Split into Team Sections */}
            <div className="bg-gray-50 border-b border-gray-200">
                {/* Global Controls Row */}
                <div className="flex items-center justify-center gap-1 md:gap-3 px-2 md:px-4 py-2 border-b border-gray-300">
                    <button
                        onClick={toggleTimer}
                        className={`px-3 md:px-6 py-1.5 md:py-2 rounded-lg font-bold text-white text-xs md:text-base ${
                            gameState.is_running 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {gameState.is_running ? '⏸️ Pause' : '▶️ Start'}
                    </button>
                    
                    <button
                        onClick={() => {
                            setGameState(prev => ({
                                ...prev,
                                current_period: Math.min(prev.current_period + 1, prev.game_settings.periods),
                                time_remaining: prev.period_length * 60,
                                is_running: false
                            }));
                            
                            const newPeriod = Math.min(gameState.current_period + 1, gameState.game_settings.periods);
                            addGameEvent(`🔔 Period ${gameState.current_period} ended. Starting Period ${newPeriod}`, 'period_change');
                        }}
                        disabled={gameState.current_period >= gameState.game_settings.periods}
                        className="px-2 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ⏭️ Next Period
                    </button>
                    
                    <button
                        onClick={() => {
                            setManualTimeInputs({
                                minutes: Math.floor(gameState.time_remaining / 60).toString(),
                                seconds: (gameState.time_remaining % 60).toString(),
                                period: gameState.current_period.toString()
                            });
                            setShowTimeEditor(true);
                        }}
                        className="hidden md:block px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
                    >
                        🕒 Edit Time
                    </button>
                    
                    <button
                        onClick={() => {
                            console.log('🔘 Manual save button clicked');
                            autoSaveGameStats();
                        }}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-xs md:text-base"
                    >
                        💾 Save
                    </button>
                    
                    {lastSaved && (
                        <span className="hidden md:inline text-xs text-gray-600">
                            Last saved: {Math.round((new Date() - lastSaved) / 1000)}s ago
                        </span>
                    )}
                </div>

                {/* Team-Specific Controls Row - Split in Half */}
                <div className="grid grid-cols-2 divide-x divide-gray-300">
                    {/* Home Team Section */}
                    <div className="px-2 md:px-4 py-2 bg-blue-50">
                        <div className="text-center mb-2">
                            <span className="text-xs md:text-sm font-bold text-blue-800">{gameState.home_team.name}</span>
                        </div>
                        <div className="flex flex-col gap-1 md:gap-2">
                            <button
                                onClick={() => openTeamShotModal('home_team')}
                                className="w-full px-2 md:px-3 py-1.5 md:py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium text-xs md:text-sm flex items-center justify-center gap-1"
                            >
                                🥍 Record Shot
                            </button>
                            <button
                                onClick={() => callTimeout('home')}
                                className="w-full px-2 md:px-3 py-1.5 md:py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-xs md:text-sm"
                            >
                                ⏸️ Timeout ({timeouts.home})
                            </button>
                        </div>
                    </div>

                    {/* Away Team Section */}
                    <div className="px-2 md:px-4 py-2 bg-red-50">
                        <div className="text-center mb-2">
                            <span className="text-xs md:text-sm font-bold text-red-800">{gameState.away_team.name}</span>
                        </div>
                        <div className="flex flex-col gap-1 md:gap-2">
                            <button
                                onClick={() => openTeamShotModal('away_team')}
                                className="w-full px-2 md:px-3 py-1.5 md:py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium text-xs md:text-sm flex items-center justify-center gap-1"
                            >
                                🥍 Record Shot
                            </button>
                            <button
                                onClick={() => callTimeout('away')}
                                className="w-full px-2 md:px-3 py-1.5 md:py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-xs md:text-sm"
                            >
                                ⏸️ Timeout ({timeouts.away})
                            </button>
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
                
                {/* Player Name with Photo */}
                <td className="px-2 py-1">
                    <div className="flex items-center gap-2">
                        {teamData.logo && (
                            <img 
                                src={teamData.logo} 
                                alt={teamData.name}
                                className="w-6 h-6 object-cover rounded-full border border-gray-300"
                            />
                        )}
                        <span className="text-sm font-medium">{formatPlayerName(player.name)}</span>
                    </div>
                </td>
                
                <td className="px-2 py-1 text-xs text-gray-600">{player.position}</td>
                
                {/* Only show stat buttons for ACTIVE players */}
                {!isInactive ? (
                    <>
                        {/* Shots Display */}
                        <td className="px-2 py-1 text-center">
                            <span className="font-bold text-base text-yellow-600">
                                {player.stats.shots}
                            </span>
                        </td>
                        
                        {/* Goals Display */}
                        <td className="px-2 py-1 text-center">
                            <span className="font-bold text-base text-green-600">
                                {player.stats.goals}
                            </span>
                        </td>
                        
                        {/* Assists with +/- buttons */}
                        <td className="px-2 py-1 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <button
                                    onClick={() => {
                                        if (player.stats.assists > 0) {
                                            setGameState(prev => ({
                                                ...prev,
                                                [teamKey]: {
                                                    ...prev[teamKey],
                                                    players: prev[teamKey].players.map(p => 
                                                        p.id === player.id 
                                                            ? { ...p, stats: { ...p.stats, assists: p.stats.assists - 1 } }
                                                            : p
                                                    )
                                                }
                                            }));
                                        }
                                    }}
                                    className="w-8 h-8 bg-red-100 text-red-600 rounded text-sm font-bold hover:bg-red-200"
                                    disabled={player.stats.assists <= 0}
                                >
                                    −
                                </button>
                                <span className="w-10 text-center font-bold text-base text-blue-600">
                                    {player.stats.assists}
                                </span>
                                <button
                                    onClick={() => addStat(teamKey, player.id, 'assists')}
                                    className="w-8 h-8 bg-blue-100 text-blue-600 rounded text-sm font-bold hover:opacity-80"
                                >
                                    +
                                </button>
                            </div>
                        </td>
                        
                        {/* Penalty Button - MOVED after assists */}
                        <td className="px-2 py-1 text-center">
                            <button
                                onClick={() => {
                                    setSelectedPlayerForPenalty({ ...player, teamKey });
                                    setShowPenaltyModal(true);
                                }}
                                className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-bold rounded"
                                title="Assign Penalty"
                            >
                                ⚠️ PEN
                            </button>
                        </td>
                        
                        {/* Penalty Minutes Display */}
                        <td className="px-2 py-1 text-center">
                            <span className="font-bold text-base text-red-600">
                                {player.stats.penalties}
                            </span>
                        </td>
                    </>
                ) : (
                    /* Inactive players - just show stats, no buttons */
                    <>
                        <td className="px-2 py-1 text-center text-sm text-gray-400">-</td>
                        <td className="px-2 py-1 text-center text-sm">{player.stats.shots || 0}</td>
                        <td className="px-2 py-1 text-center text-sm">{player.stats.goals || 0}</td>
                        <td className="px-2 py-1 text-center text-sm">{player.stats.assists || 0}</td>
                        <td className="px-2 py-1 text-center text-sm">-</td>
                        <td className="px-2 py-1 text-center text-sm">{player.stats.penalties || 0}</td>
                    </>
                )}
            </tr>
        );

        return (
            <div className="space-y-6">
                {/* Active Players */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-3">
                            {teamData.logo && (
                                <img 
                                    src={teamData.logo} 
                                    alt={teamData.name}
                                    className="w-6 h-6 object-cover rounded"
                                />
                            )}
                            {teamData.name} - Active Players ({activePlayers.length})
                        </h3>
                        <button
                            onClick={() => {
                                setAddPlayerTeam(teamKey);
                                setShowAddPlayerModal(true);
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm"
                        >
                            ➕ Add Player
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto -mx-2 md:mx-0">
                        <table className="min-w-full bg-white border rounded-lg text-xs md:text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-1 md:px-2 py-1 text-left text-xs font-medium text-gray-700">✓</th>
                                    <SortableHeader column="number">#</SortableHeader>
                                    <SortableHeader column="name">Player</SortableHeader>
                                    <th className="hidden md:table-cell px-2 py-1 text-center text-xs font-medium text-gray-700">Pos</th>
                                    <th className="px-1 md:px-2 py-1 text-center text-xs font-medium text-gray-700">Shot</th>
                                    <SortableHeader column="shots">S</SortableHeader>
                                    <SortableHeader column="goals">G</SortableHeader>
                                    <SortableHeader column="assists">A</SortableHeader>
                                    <th className="px-1 md:px-2 py-1 text-center text-xs font-medium text-gray-700">Pen</th>
                                    <SortableHeader column="penalties">PIM</SortableHeader>
                                </tr>
                            </thead>
                            <tbody>
                                {activePlayers.map(player => <PlayerRow key={player.id} player={player} />)}
                            </tbody>
                        </table>
                        {/* Buffer space at bottom to prevent dropdown cutoff */}
                        <div className="h-32"></div>
                    </div>
                </div>

                {/* Goalies Section */}
                <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-3">🥅 Goalies</h4>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="divide-y divide-gray-200">
                            {gameState.goalies[isHome ? 'home' : 'away'].map(goalie => (
                                <div key={goalie.id} className={`flex items-center justify-between p-3 ${
                                    goalie.active ? (isHome ? 'bg-blue-50' : 'bg-red-50') : 'bg-gray-50'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={goalie.active}
                                            onChange={() => toggleGoalieActive(isHome ? 'home' : 'away', goalie.id)}
                                            className="rounded"
                                        />
                                        <span className="font-mono font-bold text-sm">#{goalie.number}</span>
                                        <span className="font-medium">{goalie.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm">
                                            <span className="font-semibold">Saves:</span> {goalie.stats.saves}
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-semibold">GA:</span> {goalie.stats.goals_against}
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-semibold">SF:</span> {goalie.stats.shots_faced}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setGameState(prev => ({
                                                    ...prev,
                                                    goalies: {
                                                        ...prev.goalies,
                                                        [isHome ? 'home' : 'away']: prev.goalies[isHome ? 'home' : 'away'].map(g => 
                                                            g.id === goalie.id ? { ...g, stats: { ...g.stats, saves: g.stats.saves + 1, shots_faced: g.stats.shots_faced + 1 } } : g
                                                        )
                                                    }
                                                }));
                                            }}
                                            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 font-medium text-sm"
                                        >
                                            +Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Inactive Players */}
                {inactivePlayers.length > 0 && (
                    <div className="mt-6">
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
                                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Shots</th>
                                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Goals</th>
                                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Assists</th>
                                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">Pen</th>
                                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-600">PIM</th>
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

    // Render Game Events with inline editing
    const renderGameEvents = () => {
        // Sort by period (desc) then by timeInSeconds (desc) - newest first
        const sortedEvents = [...gameEvents].sort((a, b) => {
            if (b.period !== a.period) return b.period - a.period;
            return b.timeInSeconds - a.timeInSeconds;
        });

        const handleSaveEdit = (evt) => {
            // Validate time format
            if (editTime && !/^\d{1,2}:\d{2}$/.test(editTime)) {
                alert('Invalid time format. Use MM:SS (e.g., 12:30)');
                return;
            }

            const updates = { text: editText };
            
            if (editTime !== evt.time) {
                const [mins, secs] = editTime.split(':').map(Number);
                updates.time = editTime;
                updates.timeInSeconds = mins * 60 + secs;
            }

            setGameEvents(prev => prev.map(e => 
                e.id === evt.id ? { ...e, ...updates } : e
            ));
            
            setEditingEvent(null);
        };

        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">📋 Game Events Timeline</h3>
                    <span className="text-sm text-gray-600">{sortedEvents.length} events recorded</span>
                </div>
                
                {sortedEvents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-2">📋</div>
                        <p>No events yet. Start tracking game actions!</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto">
                        {sortedEvents.map((evt) => (
                            <div 
                                key={evt.id} 
                                className={`p-3 rounded-lg border-l-4 ${
                                    evt.type === 'goal' ? 'bg-green-50 border-green-500' :
                                    evt.type === 'penalty' ? 'bg-yellow-50 border-yellow-500' :
                                    evt.type === 'penalty_end' ? 'bg-blue-50 border-blue-400' :
                                    evt.type === 'shot' ? 'bg-blue-50 border-blue-400' :
                                    evt.type === 'save' ? 'bg-cyan-50 border-cyan-400' :
                                    evt.type === 'shot_miss' ? 'bg-gray-50 border-gray-400' :
                                    'bg-white border-gray-300'
                                }`}
                            >
                                {editingEvent === evt.id ? (
                                    // Edit Mode - Check if it's a shot event
                                    evt.metadata && evt.metadata.shotType ? (
                                        // Shot Event Edit Mode with Dropdowns
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                {/* Player Dropdown */}
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Player</label>
                                                    <select
                                                        value={editEventInput.playerId}
                                                        onChange={(e) => setEditEventInput(prev => ({ ...prev, playerId: e.target.value }))}
                                                        className="w-full px-2 py-1 border rounded text-sm"
                                                    >
                                                        <option value="unknown">Unknown Player</option>
                                                        {gameState[evt.metadata.teamKey]?.players.filter(p => p.active).map(player => (
                                                            <option key={player.id} value={player.id}>
                                                                #{player.number} {player.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Shot Type Dropdown */}
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Shot Type</label>
                                                    <select
                                                        value={editEventInput.shotType}
                                                        onChange={(e) => setEditEventInput(prev => ({ ...prev, shotType: e.target.value }))}
                                                        className="w-full px-2 py-1 border rounded text-sm"
                                                    >
                                                        <option value="miss">❌ Miss</option>
                                                        <option value="saved">✋ Saved</option>
                                                        <option value="goal">🚨 Goal</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editTime}
                                                    onChange={(e) => setEditTime(e.target.value)}
                                                    className="w-20 px-2 py-1 border rounded text-sm font-mono"
                                                    placeholder="MM:SS"
                                                />
                                                <span className="text-xs text-gray-600">P{evt.period}</span>
                                                <button
                                                    onClick={() => handleShotEventEdit(evt)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                                                >
                                                    ✓ Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingEvent(null)}
                                                    className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded"
                                                >
                                                    ✕ Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Delete this event?')) {
                                                            setGameEvents(prev => prev.filter(e => e.id !== evt.id));
                                                            setEditingEvent(null);
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded ml-auto"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Regular Event Edit Mode (Text Only)
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="w-full px-2 py-1 border rounded text-sm"
                                                placeholder="Event description"
                                            />
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editTime}
                                                    onChange={(e) => setEditTime(e.target.value)}
                                                    className="w-20 px-2 py-1 border rounded text-sm font-mono"
                                                    placeholder="MM:SS"
                                                />
                                                <span className="text-xs text-gray-600">P{evt.period}</span>
                                                <button
                                                    onClick={() => handleSaveEdit(evt)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                                                >
                                                    ✓ Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingEvent(null)}
                                                    className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded"
                                                >
                                                    ✕ Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Delete this event?')) {
                                                            setGameEvents(prev => prev.filter(e => e.id !== evt.id));
                                                            setEditingEvent(null);
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded ml-auto"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    // View Mode
                                    <div 
                                        className="flex items-start justify-between gap-3 cursor-pointer hover:bg-black hover:bg-opacity-5 p-1 rounded"
                                        onClick={() => {
                                            setEditingEvent(evt.id);
                                            setEditText(evt.text);
                                            setEditTime(evt.time);
                                            // If it's a shot event, populate the shot editing fields
                                            if (evt.metadata && evt.metadata.shotType) {
                                                setEditEventInput({
                                                    playerId: evt.metadata.playerId || 'unknown',
                                                    shotType: evt.metadata.shotType || 'miss',
                                                    teamKey: evt.metadata.teamKey || '',
                                                    timestamp: evt.time
                                                });
                                            }
                                        }}
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{evt.text}</div>
                                        </div>
                                        <div className="text-xs text-gray-600 text-right whitespace-nowrap">
                                            <div className="font-mono font-bold">{evt.time}</div>
                                            <div>Period {evt.period}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-3 text-center">
                    💡 Click any event to edit
                </p>
            </div>
        );
    };

    // Render Live Chat
    const renderLiveChat = () => {
        const formatChatTime = (timestamp) => {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        };

        return (
            <div className="bg-white rounded-lg shadow-md h-[calc(100vh-450px)]">
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b bg-gray-50">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            💬 Live Chat
                            <span className="text-sm font-normal text-gray-500">
                                ({chat.messages.length} messages)
                            </span>
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Chat with spectators and other scorers in real-time
                        </p>
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {chat.messages.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-4xl mb-2">💬</div>
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            chat.messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.type === 'system' ? 'justify-center' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] px-4 py-2 rounded-lg ${
                                        msg.type === 'system'
                                            ? 'bg-blue-100 text-blue-800 text-sm'
                                            : 'bg-white shadow border'
                                    }`}>
                                        <div className="font-semibold text-sm text-gray-700">{msg.user_name}</div>
                                        <div className="text-sm mt-1">{msg.message}</div>
                                        <div className="text-xs text-gray-500 mt-1">{formatChatTime(msg.timestamp)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t bg-white">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chat.newMessage}
                                onChange={(e) => setChat(prev => ({ ...prev, newMessage: e.target.value }))}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!chat.newMessage.trim()}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            💡 Tip: Chat is synced with the Live Spectator View
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Fixed Header */}
            {renderStickyHeader()}

            {/* Main Content with padding for fixed header */}
            <div style={{ paddingTop: '320px' }}>
            {/* Tab Navigation */}
            <div className="bg-white border-b sticky" style={{ top: '0px', zIndex: 10 }}>
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
                        <button
                            onClick={() => setActiveTab('game_events')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm ${
                                activeTab === 'game_events'
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            📋 Game Events ({gameEvents.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('live_chat')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm ${
                                activeTab === 'live_chat'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            💬 Live Chat
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6" style={{ paddingTop: '20px' }}>
                <div className="max-w-7xl mx-auto">
                    {/* Active Penalties Display */}
                    {renderActivePenalties()}
                    
                    {activeTab === 'home_stats' && renderPlayerStats('home_team', gameState.home_team)}
                    {activeTab === 'away_stats' && renderPlayerStats('away_team', gameState.away_team)}
                    {activeTab === 'game_events' && renderGameEvents()}
                    {activeTab === 'live_chat' && renderLiveChat()}
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
            
            {/* Penalty Assignment Modal */}
            {renderPenaltyModal()}
            
            {/* Team Shot Modal */}
            {renderTeamShotModal()}
            
            {/* Add Player Modal */}
            {showAddPlayerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">➕ Add Player Manually</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jersey Number *
                                </label>
                                <input
                                    type="text"
                                    value={newPlayerInput.number}
                                    onChange={(e) => setNewPlayerInput(prev => ({ ...prev, number: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="00"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    value={newPlayerInput.firstName}
                                    onChange={(e) => setNewPlayerInput(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="John"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    value={newPlayerInput.lastName}
                                    onChange={(e) => setNewPlayerInput(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Doe"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Position
                                </label>
                                <select
                                    value={newPlayerInput.position}
                                    onChange={(e) => setNewPlayerInput(prev => ({ ...prev, position: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Forward">Forward</option>
                                    <option value="Defense">Defense</option>
                                    <option value="Center">Center</option>
                                    <option value="Wing">Wing</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddPlayerModal(false);
                                    setAddPlayerTeam(null);
                                    setNewPlayerInput({ number: '', firstName: '', lastName: '', position: 'Forward' });
                                }}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addManualPlayer}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Add Player
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default EnhancedLiveStatsEntry;