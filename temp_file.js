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
    
    // Penalty Modal State (updated for new workflow)
    const [showPenaltyModal, setShowPenaltyModal] = useState(false);
    const [pendingPenalty, setPendingPenalty] = useState(null);
    const [penaltyType, setPenaltyType] = useState('');
    const [penaltyDuration, setPenaltyDuration] = useState(120);
    const [selectedPenaltyPlayer, setSelectedPenaltyPlayer] = useState(null);

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
    
    // Game Events Editing State
    const [editingEvent, setEditingEvent] = useState(null);
    const [editText, setEditText] = useState('');
    const [editTime, setEditTime] = useState('');
    
    // Shot type selector state
    const [showShotMenu, setShowShotMenu] = useState(null); // stores player id when menu is open
    
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
    
    // New Shot Recording Workflow State
    const [pendingShot, setPendingShot] = useState(null);
    const [showShotModal, setShowShotModal] = useState(false);
    const [shotType, setShotType] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    
    
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
    const addGameEvent = (eventText, eventType = 'action') => {
        const newEvent = {
            id: Date.now(),
            time: formatTime(gameState.time_remaining),
            timeInSeconds: gameState.time_remaining, // Add seconds for sorting
            period: gameState.current_period,
            text: eventText,
            type: eventType,
            timestamp: new Date().toISOString()
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

    // NEW SHOT RECORDING WORKFLOW
    const handleShotTaken = (team) => {
        // Capture the shot moment with timestamp
        const shotData = {
            team: team,
            timestamp: new Date().toISOString(),
            period: gameState.current_period,
            timeRemaining: gameState.time_remaining,
            timeInSeconds: gameState.time_remaining
        };
        
        setPendingShot(shotData);
        setShotType(null);
        setSelectedPlayer(null);
        setShowShotModal(true);
        
        console.log('🏒 Shot captured at:', shotData);
    };

    const completeShotRecording = () => {
        if (!pendingShot || !shotType) {
            alert('Please select shot type');
            return;
        }

        const teamKey = pendingShot.team;
        const player = selectedPlayer ? gameState[teamKey].players.find(p => p.id === selectedPlayer) : null;
        const teamName = gameState[teamKey].name;
        
        console.log('🎯 Recording shot:', { shotType, player: player?.name || 'Unknown', team: teamName });
        
        // Update game state only if player is selected
        if (selectedPlayer && player) {
            setGameState(prev => {
                const newState = { ...prev };
                
                // Update player stats based on shot type
                newState[teamKey] = {
                    ...prev[teamKey],
                    players: prev[teamKey].players.map(p => {
                        if (p.id === selectedPlayer) {
                            const newStats = { ...p.stats };
                            
                            // Only saved and goal count as shots on goal
                            if (shotType === 'save' || shotType === 'goal') {
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
                if (shotType === 'save') {
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
        } else if (shotType === 'goal') {
            // If no player selected but it's a goal, still update score and goalie
            setGameState(prev => {
                const newState = { ...prev };
                newState[teamKey].score = prev[teamKey].score + 1;
                
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
                return newState;
            });
        }

        // Add game event narration
        const opposingTeamKey = teamKey === 'home_team' ? 'away_team' : 'home_team';
        const opposingTeamName = gameState[opposingTeamKey].name;
        const opposingGoalieKey = teamKey === 'home_team' ? 'away' : 'home';
        const activeGoalie = gameState.goalies[opposingGoalieKey].find(g => g.active);
        
        if (shotType === 'miss') {
            const playerInfo = player ? `#${player.number} ${player.name}` : 'Unknown player';
            addGameEvent(`❌ ${teamName} - ${playerInfo} - Shot misses`, 'shot_miss');
        } else if (shotType === 'save') {
            const playerInfo = player ? `#${player.number} ${player.name}` : 'Unknown player';
            addGameEvent(`🏒 ${teamName} - ${playerInfo} - Shot on goal`, 'shot');
            if (activeGoalie) {
                addGameEvent(`✋ ${opposingTeamName} - Goalie #${activeGoalie.number} ${activeGoalie.name} - SAVE!`, 'save');
            }
        } else if (shotType === 'goal') {
            const playerInfo = player ? `#${player.number} ${player.name}` : 'Unknown player';
            addGameEvent(`🚨 GOAL! ${teamName} - ${playerInfo} scores!`, 'goal');
            if (activeGoalie) {
                addGameEvent(`🥅 ${opposingTeamName} - Goalie #${activeGoalie.number} ${activeGoalie.name} - Goal against`, 'goal_against');
            }
        }

        // Close modal and reset
        setShowShotModal(false);
        setPendingShot(null);
        setShotType(null);
        setSelectedPlayer(null);
    };

    const cancelShotRecording = () => {
        setShowShotModal(false);
        setPendingShot(null);
        setShotType(null);
        setSelectedPlayer(null);
    };

    // NEW PENALTY RECORDING WORKFLOW
    const handlePenaltyTaken = (team) => {
        const penaltyData = {
            team: team,
            timestamp: new Date().toISOString(),
            period: gameState.current_period,
            timeRemaining: gameState.time_remaining,
            timeInSeconds: gameState.time_remaining
        };
        
        setPendingPenalty(penaltyData);
        setPenaltyType('');
        setPenaltyDuration(120); // Default 2 minutes
        setSelectedPenaltyPlayer(null);
        setShowPenaltyModal(true);
        
        console.log('⚠️ Penalty captured at:', penaltyData);
    };

    const completePenaltyRecording = () => {
        if (!pendingPenalty || !penaltyType || !penaltyDuration) {
            alert('Please select penalty type and duration');
            return;
        }

        const teamKey = pendingPenalty.team;
        const player = selectedPenaltyPlayer ? gameState[teamKey].players.find(p => p.id === selectedPenaltyPlayer) : null;
        const teamName = gameState[teamKey].name;
        
        console.log('⚠️ Recording penalty:', { type: penaltyType, duration: penaltyDuration, player: player?.name || 'Unknown', team: teamName });
        
        // Create penalty object
        const newPenalty = {
            id: Date.now(),
            playerId: selectedPenaltyPlayer || null,
            playerName: player ? player.name : 'Unknown Player',
            playerNumber: player ? player.number : '??',
            type: penaltyType,
            startTime: gameState.time_remaining,
            duration: penaltyDuration,
            timeRemaining: penaltyDuration,
            period: gameState.current_period
        };

        // Update game state
        setGameState(prev => {
            const newState = { ...prev };
            
            // Add penalty to team
            const penaltyKey = teamKey === 'home_team' ? 'home_penalties' : 'away_penalties';
            newState[penaltyKey] = [...(prev[penaltyKey] || []), newPenalty];
            
            // Update player stats if player selected
            if (selectedPenaltyPlayer && player) {
                newState[teamKey] = {
                    ...prev[teamKey],
                    players: prev[teamKey].players.map(p => 
                        p.id === selectedPenaltyPlayer ? {
                            ...p,
                            stats: { ...p.stats, penalties: p.stats.penalties + 1 }
                        } : p
                    )
                };
            }
            
            return newState;
        });

        // Add game event
        const playerInfo = player ? `#${player.number} ${player.name}` : 'Unknown player';
        const durationText = penaltyDuration === 90 ? '1:30' : `${Math.floor(penaltyDuration / 60)}:00`;
        addGameEvent(`⚠️ ${teamName} - ${playerInfo} - ${penaltyType} penalty (${durationText})`, 'penalty');

        // Close modal and reset
        setShowPenaltyModal(false);
        setPendingPenalty(null);
        setPenaltyType('');
        setPenaltyDuration(120);
        setSelectedPenaltyPlayer(null);
    };

    const cancelPenaltyRecording = () => {
        setShowPenaltyModal(false);
        setPendingPenalty(null);
        setPenaltyType('');
        setPenaltyDuration(120);
        setSelectedPenaltyPlayer(null);
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
            
            if (shotType === 'miss') {
                addGameEvent(`❌ ${teamName} - #${player.number} ${player.name} - Shot misses`, 'shot_miss');
            } else if (shotType === 'saved') {
                addGameEvent(`🏒 ${teamName} - #${player.number} ${player.name} - Shot on goal`, 'shot');
                if (activeGoalie) {
                    addGameEvent(`✋ ${opposingTeamName} - Goalie #${activeGoalie.number} ${activeGoalie.name} - SAVE!`, 'save');
                }
            } else if (shotType === 'goal') {
                addGameEvent(`🚨 GOAL! ${teamName} - #${player.number} ${player.name} scores!`, 'goal');
                if (activeGoalie) {
                    addGameEvent(`🥅 ${opposingTeamName} - Goalie #${activeGoalie.number} ${activeGoalie.name} - Goal against`, 'goal_against');
                }
            }
        }
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

    // Fixed header with split team banners, clock, scores, and ACTION BUTTONS
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

                {/* Center Clock & Game Controls - Floating */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 hidden md:block">
                    <div className="flex flex-col items-center gap-2">
                        <div 
                            className={`px-4 py-2 rounded-lg border-2 cursor-pointer hover:opacity-90 transition backdrop-blur-sm ${
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
                            <div className="text-2xl font-bold text-white font-mono">
                                {formatTime(gameState.time_remaining)}
                            </div>
                        </div>
                        <div className="bg-black bg-opacity-60 backdrop-blur-sm px-3 py-1 rounded text-white text-xs font-medium">
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
                            <div className="text-center md:text-right md:order-1" style={{ fontFamily: liveViewSettings.useTeamFonts ? gameState.away_team.font : 'Inter, sans-serif' }}>
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

            {/* Game Controls Bar - Mobile visible, Desktop in center */}
            <div className="md:hidden bg-gray-100 px-2 py-2 flex items-center justify-center gap-2">
                <div 
                    className={`px-3 py-1 rounded border cursor-pointer ${
                        gameState.is_running ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white'
                    }`}
                    onClick={() => {
                        setManualTimeInputs({
                            minutes: Math.floor(gameState.time_remaining / 60).toString(),
                            seconds: (gameState.time_remaining % 60).toString(),
                            period: gameState.current_period.toString()
                        });
                        setShowTimeEditor(true);
                    }}
                >
                    <div className="text-lg font-bold font-mono">{formatTime(gameState.time_remaining)}</div>
                </div>
                <div className="bg-black bg-opacity-60 px-2 py-1 rounded text-white text-xs">
                    P{gameState.current_period}
                </div>
            </div>

            {/* Quick Action Buttons Row */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-300">
                <div className="grid grid-cols-3 gap-1 md:gap-2 p-1 md:p-2 max-w-7xl mx-auto">
                    {/* Home Team Buttons - Left */}
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            onClick={() => handleShotTaken('home_team')}
                            className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-bold text-xs md:text-sm shadow-md transform active:scale-95 transition"
                        >
                            <div className="text-xl md:text-2xl">🏒</div>
                            <div className="text-xs hidden md:block">Shot</div>
                        </button>
                        <button
                            onClick={() => handlePenaltyTaken('home_team')}
                            className="p-2 md:p-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-bold text-xs md:text-sm shadow-md transform active:scale-95 transition"
                        >
                            <div className="text-xl md:text-2xl">⚠️</div>
                            <div className="text-xs hidden md:block">Penalty</div>
                        </button>
                    </div>

                    {/* Center Game Controls */}
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={toggleTimer}
                            className={`px-2 py-1 md:px-4 md:py-2 rounded-lg font-bold text-white text-xs md:text-sm ${
                                gameState.is_running 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {gameState.is_running ? '⏸️ Pause' : '▶️ Start'}
                        </button>
                        <div className="flex gap-1">
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
                                className="flex-1 px-1 py-1 md:px-2 md:py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs disabled:opacity-50"
                            >
                                ⏭️
                            </button>
                            <button
                                onClick={() => {
                                    console.log('🔘 Manual save');
                                    autoSaveGameStats();
                                }}
                                className="flex-1 px-1 py-1 md:px-2 md:py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium text-xs"
                            >
                                💾
                            </button>
                        </div>
                    </div>

                    {/* Away Team Buttons - Right */}
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            onClick={() => handleShotTaken('away_team')}
                            className="p-2 md:p-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-bold text-xs md:text-sm shadow-md transform active:scale-95 transition"
                        >
                            <div className="text-xl md:text-2xl">🏒</div>
                            <div className="text-xs hidden md:block">Shot</div>
                        </button>
                        <button
                            onClick={() => handlePenaltyTaken('away_team')}
                            className="p-2 md:p-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-bold text-xs md:text-sm shadow-md transform active:scale-95 transition"
                        >
                            <div className="text-xl md:text-2xl">⚠️</div>
                            <div className="text-xs hidden md:block">Penalty</div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Event Title Bar - Removed per original code */}
            {/* Control Buttons Bar - Moved to quick actions above */}

            {/* Goalies Section - REMOVED - Now in team tabs */}
        </div>
    );
