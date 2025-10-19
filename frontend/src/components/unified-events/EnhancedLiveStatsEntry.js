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

    // Live Chat State
    const [chat, setChat] = useState({
        messages: [],
        newMessage: ''
    });

    // Game Events State (for narration)
    const [gameEvents, setGameEvents] = useState([]);
    
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
        const duration = parseInt(penaltyInput.duration) || 2;
        
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
            timeRemaining: duration * 60 + 90, // Convert minutes to seconds and add 1:30
            startTime: Date.now()
        };
        
        // Add penalty to list
        setPenalties(prev => ({
            ...prev,
            [team]: [...prev[team], newPenalty]
        }));
        
        // Add penalty minutes to player stats
        setGameState(prev => ({
            ...prev,
            [teamKey]: {
                ...prev[teamKey],
                players: prev[teamKey].players.map(p =>
                    p.id === playerId
                        ? { ...p, stats: { ...p.stats, penalties: (p.stats.penalties || 0) + duration } }
                        : p
                )
            }
        }));
        
        // Add game event
        const totalTime = Math.floor((duration * 60 + 90) / 60); // Convert back to display minutes
        addGameEvent(`⚠️ PENALTY! ${teamName} - #${playerNumber} ${playerName} - ${penaltyType} (${totalTime}:30)`, 'penalty');
        
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
            const newMsg = {
                id: Date.now(),
                user_name: 'Scorer',
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
                        user_name: 'Scorer'
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
                        <div className="flex gap-2">
                            {[2, 4, 5, 10].map(mins => (
                                <button
                                    key={mins}
                                    onClick={() => setPenaltyInput(prev => ({ ...prev, duration: mins }))}
                                    className={`flex-1 px-3 py-2 rounded font-medium ${
                                        penaltyInput.duration === mins
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {mins} min
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            value={penaltyInput.duration}
                            onChange={(e) => setPenaltyInput(prev => ({ ...prev, duration: parseInt(e.target.value) || 2 }))}
                            className="w-full px-3 py-2 border rounded mt-2"
                            min="1"
                            max="20"
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
                            className={`p-2 rounded ${
                                penalty.timeRemaining <= 10 ? 'bg-red-200 animate-pulse' : 'bg-white'
                            } border border-gray-300`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-bold">{gameState.home_team.name}</span>
                                    <span className="mx-2">-</span>
                                    <span>#{penalty.playerNumber} {penalty.playerName}</span>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-bold font-mono ${
                                        penalty.timeRemaining <= 10 ? 'text-red-600' : 'text-gray-800'
                                    }`}>
                                        {formatTime(penalty.timeRemaining)}
                                    </div>
                                    <div className="text-xs text-gray-600">{penalty.type}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {awayPenalties.map(penalty => (
                        <div 
                            key={penalty.id} 
                            className={`p-2 rounded ${
                                penalty.timeRemaining <= 10 ? 'bg-red-200 animate-pulse' : 'bg-white'
                            } border border-gray-300`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-bold">{gameState.away_team.name}</span>
                                    <span className="mx-2">-</span>
                                    <span>#{penalty.playerNumber} {penalty.playerName}</span>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-bold font-mono ${
                                        penalty.timeRemaining <= 10 ? 'text-red-600' : 'text-gray-800'
                                    }`}>
                                        {formatTime(penalty.timeRemaining)}
                                    </div>
                                    <div className="text-xs text-gray-600">{penalty.type}</div>
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
        <div className="sticky top-0 z-50 shadow-md bg-white">
            {/* Split Banner Header */}
            <div className="flex relative">
                {/* Home Team Side - Left 50% */}
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
                    <div className="p-4 text-white relative z-10">
                        <div className="flex items-center gap-3">
                            {gameState.home_team.logo && (
                                <img 
                                    src={gameState.home_team.logo} 
                                    alt={gameState.home_team.name}
                                    className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow-lg"
                                />
                            )}
                            <div style={{ fontFamily: liveViewSettings.useTeamFonts ? gameState.home_team.font : 'Inter, sans-serif' }}>
                                <div className="text-sm font-medium">{gameState.home_team.name}</div>
                                <div className="text-4xl font-bold text-white drop-shadow-lg">{gameState.home_team.score}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Clock & Period - Floating Over Both Sides */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
                    <div className="flex flex-col items-center gap-2">
                        {/* Timer - Clickable */}
                        <div 
                            className={`px-6 py-2 rounded-lg border-2 cursor-pointer hover:opacity-90 transition backdrop-blur-sm ${
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
                            <div className="text-3xl font-bold text-white font-mono">
                                {formatTime(gameState.time_remaining)}
                            </div>
                        </div>
                        {/* Period */}
                        <div className="bg-black bg-opacity-60 backdrop-blur-sm px-4 py-1 rounded text-white text-sm font-medium">
                            Period {gameState.current_period} of {gameState.game_settings.periods}
                        </div>
                    </div>
                </div>

                {/* Away Team Side - Right 50% */}
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
                    <div className="p-4 text-white relative z-10">
                        <div className="flex items-center gap-3 justify-end">
                            <div className="text-right" style={{ fontFamily: liveViewSettings.useTeamFonts ? gameState.away_team.font : 'Inter, sans-serif' }}>
                                <div className="text-sm font-medium">{gameState.away_team.name}</div>
                                <div className="text-4xl font-bold text-white drop-shadow-lg">{gameState.away_team.score}</div>
                            </div>
                            {gameState.away_team.logo && (
                                <img 
                                    src={gameState.away_team.logo} 
                                    alt={gameState.away_team.name}
                                    className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow-lg"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Title Bar */}
            <div className="bg-white px-4 py-2 border-b border-gray-200">
                <div className="text-center">
                    <h2 className="text-lg font-bold text-gray-800">{event?.title || 'Live Game Scoring'}</h2>
                </div>
            </div>

            {/* Control Buttons Bar */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                        onClick={toggleTimer}
                        className={`px-6 py-2 rounded-lg font-bold text-white ${
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
                        }}
                        disabled={gameState.current_period >= gameState.game_settings.periods}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
                    >
                        🕒 Edit Time
                    </button>
                    
                    <button
                        onClick={() => {
                            console.log('🔘 Manual save button clicked');
                            autoSaveGameStats();
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                    >
                        💾 Save Now
                    </button>
                    
                    {lastSaved && (
                        <span className="text-xs text-gray-600">
                            Last saved: {Math.round((new Date() - lastSaved) / 1000)}s ago
                        </span>
                    )}
                </div>
            </div>

            {/* Goalies Section */}
            <div className="bg-white px-4 py-3 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Home Goalies */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">🥅 {gameState.home_team.name} Goalies</h4>
                        <div className="space-y-2">
                            {gameState.goalies.home.map(goalie => (
                                <div key={goalie.id} className={`flex items-center justify-between p-2 rounded text-sm ${
                                    goalie.active ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={goalie.active}
                                            onChange={() => toggleGoalieActive('home', goalie.id)}
                                            className="rounded"
                                        />
                                        <span className="font-mono text-xs">#{goalie.number}</span>
                                        <span className="text-xs">{goalie.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span>S: {goalie.stats.saves}</span>
                                        <span>GA: {goalie.stats.goals_against}</span>
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
                                            className="w-6 h-6 bg-purple-100 text-purple-600 rounded text-xs hover:bg-purple-200 font-bold"
                                        >
                                            +S
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Away Goalies */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">🥅 {gameState.away_team.name} Goalies</h4>
                        <div className="space-y-2">
                            {gameState.goalies.away.map(goalie => (
                                <div key={goalie.id} className={`flex items-center justify-between p-2 rounded text-sm ${
                                    goalie.active ? 'bg-red-50 border border-red-200' : 'bg-gray-100'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={goalie.active}
                                            onChange={() => toggleGoalieActive('away', goalie.id)}
                                            className="rounded"
                                        />
                                        <span className="font-mono text-xs">#{goalie.number}</span>
                                        <span className="text-xs">{goalie.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span>S: {goalie.stats.saves}</span>
                                        <span>GA: {goalie.stats.goals_against}</span>
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
                                            className="w-6 h-6 bg-purple-100 text-purple-600 rounded text-xs hover:bg-purple-200 font-bold"
                                        >
                                            +S
                                        </button>
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
                        {/* Shot Buttons - Three types */}
                        <td className="px-2 py-1">
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => addShotStat(teamKey, player.id, 'miss')}
                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded"
                                    title="Shot - Miss (no shot on goal)"
                                >
                                    ❌ Miss
                                </button>
                                <button
                                    onClick={() => addShotStat(teamKey, player.id, 'saved')}
                                    className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded"
                                    title="Shot - Saved by goalie"
                                >
                                    ✋ Saved
                                </button>
                                <button
                                    onClick={() => addShotStat(teamKey, player.id, 'goal')}
                                    className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded"
                                    title="Shot - Goal!"
                                >
                                    🚨 Goal
                                </button>
                            </div>
                        </td>
                        
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
                                    <th className="px-2 py-1 text-center text-xs font-medium text-gray-700">Pen</th>
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
        </div>
    );
};

export default EnhancedLiveStatsEntry;