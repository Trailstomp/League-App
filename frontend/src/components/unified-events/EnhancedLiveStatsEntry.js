import React, { useState, useEffect, useRef } from 'react';
import { getSportConfig } from '../../config/sportsConfig';

const EnhancedLiveStatsEntry = ({ event, teams, currentUser, onSubmit, onCancel, sportType = 'lacrosse', statsOnly = false }) => {
    // Get sport-specific configuration
    const sportConfig = getSportConfig(sportType);
    
    console.log('🎮 EnhancedLiveStatsEntry mounted with:', {
        event: event,
        eventId: event?.id,
        eventTitle: event?.title,
        teamsCount: teams?.length,
        sport: sportType
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
            periods: sportConfig.periods,
            periodName: sportConfig.periodName,
            period_length_options: [10, 15, 20, 25, 30]
        }
    });

    const [activeTab, setActiveTab] = useState('home_stats');
    const [playerSort, setPlayerSort] = useState({
        home: { column: 'number', direction: 'asc' },
        away: { column: 'number', direction: 'asc' }
    });
    
    // Shot Clock State
    const [shotClock, setShotClock] = useState({
        duration: 30, // seconds
        timeRemaining: 30,
        isRunning: false
    });
    const [showShotClockSettings, setShowShotClockSettings] = useState(false);
    
    // Clock visibility toggles - allow scoring without clocks
    const [showGameClock, setShowGameClock] = useState(!statsOnly);
    const [showShotClock, setShowShotClock] = useState(!statsOnly);
    
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
    const [penaltyTeam, setPenaltyTeam] = useState(null); // 'home_team' or 'away_team' for team-based penalty
    const [penaltyInput, setPenaltyInput] = useState({
        playerId: '',
        type: '',
        duration: 2,
        customType: ''
    });

    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [lastSaved, setLastSaved] = useState(null);
    const [isLive, setIsLive] = useState(event?.status === 'in_progress');

    const toggleLive = async () => {
        const bUrl = process.env.REACT_APP_BACKEND_URL || '';
        const newLive = !isLive;
        setIsLive(newLive);
        try {
            const newStatus = newLive ? 'in_progress' : 'scheduled';
            await fetch(`${bUrl}/api/unified-events/${event?.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            console.log(`📡 Game ${newLive ? 'LIVE' : 'OFF AIR'} — status set to ${newStatus}`);
        } catch (e) {
            console.error('Failed to toggle live status:', e);
            setIsLive(!newLive); // revert on error
        }
    };

    // Live Chat State
    const [chat, setChat] = useState({
        messages: [],
        newMessage: ''
    });

    // Game Events State (for narration)
    const [gameEvents, setGameEvents] = useState([]);
    const [gameStarted, setGameStarted] = useState(false); // Track if game has started
    
    // Broadcast State (YouTube Live Stream)
    const [broadcastConfig, setBroadcastConfig] = useState({
        enabled: false,
        youtubeVideoId: '',
        youtubeChannelId: '',
        customStreamUrl: ''
    });
    
    // Shot type selector state
    const [showShotMenu, setShowShotMenu] = useState(null); // stores player id when menu is open
    
    // Assist picker state for goals
    const [showAssistPicker, setShowAssistPicker] = useState(null); // {teamKey, scorerId, scorerName}
    
    // Team shot modal state
    const [showTeamShotModal, setShowTeamShotModal] = useState(false);
    const [teamShotModalTeam, setTeamShotModalTeam] = useState(null); // 'home_team' or 'away_team'
    const [stopClockOnGoal, setStopClockOnGoal] = useState(false); // Persistent setting
    const [teamShotInput, setTeamShotInput] = useState({
        playerId: 'unknown',
        shotType: '',
        timestamp: '',
        assistPlayerId: null // Player who assisted the goal
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
    
    // Event filtering state
    const [eventFilter, setEventFilter] = useState('all');
    const [eventSortOrder, setEventSortOrder] = useState('newest'); // 'newest' or 'oldest'
    
    // Players on field picker state (shown after a goal is scored)
    const [showOnFieldPicker, setShowOnFieldPicker] = useState(null); // { goalEventId, scoringTeamKey, defendingTeamKey }
    const [onFieldSelections, setOnFieldSelections] = useState({ scoring: [], defending: [] });
    
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

    // Shot Clock - Sync with game clock (only when shot clock is visible)
    useEffect(() => {
        if (!showShotClock) return;
        if (gameState.is_running && !shotClock.isRunning) {
            setShotClock(prev => ({ ...prev, isRunning: true }));
        } else if (!gameState.is_running && shotClock.isRunning) {
            setShotClock(prev => ({ ...prev, isRunning: false }));
        }
    }, [gameState.is_running, showShotClock]);

    // Shot Clock - Countdown
    useEffect(() => {
        if (shotClock.isRunning && shotClock.timeRemaining > 0) {
            const timer = setInterval(() => {
                setShotClock(prev => ({
                    ...prev,
                    timeRemaining: Math.max(0, prev.timeRemaining - 1)
                }));
            }, 1000);
            
            return () => clearInterval(timer);
        }
    }, [shotClock.isRunning, shotClock.timeRemaining]);

    // Shot Clock - Horn sound at 0
    useEffect(() => {
        if (shotClock.timeRemaining === 0 && shotClock.isRunning) {
            // Play horn sound for 4 seconds
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 400; // Horn frequency
            oscillator.type = 'square';
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                audioContext.close();
            }, 4000); // 4 seconds
        }
    }, [shotClock.timeRemaining, shotClock.isRunning]);


    
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

    // Enhanced player data - now fetches real players from API
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    
    const fetchTeamPlayers = async (teamId) => {
        try {
            // Use /api/team/{id}/players endpoint (singular 'team')
            const response = await fetch(`${backendUrl}/api/team/${teamId}/players`);
            if (response.ok) {
                const players = await response.json(); // Returns array directly
                
                // Separate goalies from field players
                const goalies = players.filter(p => 
                    p.position?.toLowerCase().includes('goalie') || 
                    p.position?.toLowerCase().includes('goalkeeper') ||
                    p.position?.toLowerCase() === 'g'
                );
                const fieldPlayers = players.filter(p => 
                    !p.position?.toLowerCase().includes('goalie') && 
                    !p.position?.toLowerCase().includes('goalkeeper') &&
                    p.position?.toLowerCase() !== 'g'
                );
                
                console.log(`📋 Loaded ${fieldPlayers.length} players + ${goalies.length} goalies for team ${teamId}`);
                
                return {
                    players: fieldPlayers.map(p => ({
                        id: p.id || p.userId,
                        name: p.name,
                        number: p.jerseyNumber || p.playerNumber || '?',
                        position: p.position || 'Player',
                        active: true
                    })),
                    goalies: goalies.map(p => ({
                        id: p.id || p.userId,
                        name: p.name,
                        number: p.jerseyNumber || p.playerNumber || '?',
                        position: 'Goalie',
                        active: true
                    }))
                };
            }
        } catch (error) {
            console.error('Error fetching team players:', error);
        }
        
        // Fallback to empty if fetch fails
        return { players: [], goalies: [] };
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
    // Track if an auto-save is in progress to prevent overlapping requests
    const autoSaveInProgressRef = useRef(false);
    const autoSaveRetryCountRef = useRef(0);
    const MAX_RETRY_COUNT = 3;

    const autoSaveGameStats = React.useCallback(async () => {
        if (!event?.id) {
            console.log('⚠️ Auto-save skipped: No event ID');
            return;
        }

        // Skip if another auto-save is already in progress
        if (autoSaveInProgressRef.current) {
            console.log('⏳ Auto-save skipped: Previous save still in progress');
            return;
        }
        
        autoSaveInProgressRef.current = true;
        console.log('💾 Auto-saving game stats for event:', event.id, 'Current scores:', gameState.home_team.score, '-', gameState.away_team.score);
        
        try {
            const gameData = {
                event_id: event.id,
                home_team: gameState.home_team,
                away_team: gameState.away_team,
                goalies: gameState.goalies,
                penalties: penalties, // Include active penalties for live view
                gameEvents: gameEvents, // Include game narration events
                time_remaining: gameState.time_remaining, // Store as number for recalculation
                current_period: gameState.current_period,
                period_length: gameState.period_length,
                is_running: gameState.is_running, // Save running state
                game_settings: gameState.game_settings,
                last_update_timestamp: new Date().toISOString(), // Timestamp for time recalculation
                active_penalties: penalties, // Save active penalties
                shot_clock: shotClock, // Save shot clock state
                game_events: gameEvents, // Save all game events
                detailed_stats: true,
                entry_type: 'enhanced_live_stats_autosave',
                created_at: new Date().toISOString()
            };

            console.log('💾 Sending auto-save data to game_stats');

            // Save to game_stats collection with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const statsResponse = await fetch(`${backendUrl}/api/game-stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!statsResponse.ok) {
                const error = await statsResponse.text();
                console.error('❌ Auto-save to game_stats failed:', statsResponse.status, error);
                autoSaveRetryCountRef.current++;
                autoSaveInProgressRef.current = false;
                return;
            }

            console.log('✅ Saved to game_stats');

            // ALSO update unified_events.scores so Live View sees the update immediately
            console.log('💾 Updating unified_events.scores');
            const eventController = new AbortController();
            const eventTimeoutId = setTimeout(() => eventController.abort(), 15000);

            const eventUpdateResponse = await fetch(`${backendUrl}/api/unified-events/${event.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scores: gameData,
                    status: 'in_progress'
                }),
                signal: eventController.signal
            });

            clearTimeout(eventTimeoutId);

            if (eventUpdateResponse.ok) {
                setLastSaved(new Date());
                autoSaveRetryCountRef.current = 0; // Reset retry count on success
                console.log('✅ Auto-saved to BOTH game_stats AND unified_events.scores');
            } else {
                const error = await eventUpdateResponse.text();
                console.error('❌ Failed to update unified_events.scores:', error);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('❌ Auto-save timed out');
            } else {
                console.error('❌ Auto-save error:', error);
            }
            autoSaveRetryCountRef.current++;
        } finally {
            autoSaveInProgressRef.current = false;
        }
    }, [event, gameState, penalties, gameEvents, shotClock, backendUrl]);

    // Setup auto-save interval when timer is running - reduced frequency to 30 seconds
    useEffect(() => {
        console.log('🔧 Auto-save useEffect triggered. Enabled:', autoSaveEnabled, 'Running:', gameState.is_running, 'Event ID:', event?.id);
        
        if (autoSaveEnabled && gameState.is_running && event?.id) {
            console.log('✅ Starting auto-save interval (every 30 seconds)');
            
            // Immediate first save
            autoSaveGameStats();
            
            // Then save every 30 seconds (reduced from 10 to reduce DB load)
            const intervalId = setInterval(() => {
                // Skip if too many consecutive failures
                if (autoSaveRetryCountRef.current >= MAX_RETRY_COUNT) {
                    console.log('⚠️ Auto-save paused: Too many failures. Will retry in 60s');
                    setTimeout(() => { autoSaveRetryCountRef.current = 0; }, 60000);
                    return;
                }
                console.log('⏰ 30 seconds elapsed, triggering auto-save...');
                autoSaveGameStats();
            }, 30000); // Changed from 10000 to 30000
            
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

    // Load saved game state on mount and recalculate time if game was running
    useEffect(() => {
        const loadSavedGameState = async () => {
            if (!event?.id) return;
            
            try {
                const response = await fetch(`${backendUrl}/api/events/${event.id}/game-stats`);
                if (response.ok) {
                    const savedData = await response.json();
                    
                    if (savedData && savedData.home_team) {
                        console.log('📥 Loading saved game state:', savedData);
                        
                        // If game was running, calculate elapsed time
                        if (savedData.is_running && savedData.last_update_timestamp) {
                            const now = Date.now();
                            const lastUpdate = new Date(savedData.last_update_timestamp).getTime();
                            const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
                            
                            // Update game time remaining
                            const newTimeRemaining = Math.max(0, savedData.time_remaining - elapsedSeconds);
                            savedData.time_remaining = newTimeRemaining;
                            
                            // Update shot clock time remaining
                            if (savedData.shot_clock && savedData.shot_clock.isRunning) {
                                const newShotClockTime = Math.max(0, savedData.shot_clock.timeRemaining - elapsedSeconds);
                                savedData.shot_clock.timeRemaining = newShotClockTime;
                            }
                            
                            console.log(`⏰ Time recalculated: ${elapsedSeconds}s elapsed, game time: ${newTimeRemaining}s, shot clock: ${savedData.shot_clock?.timeRemaining}s`);
                        }
                        
                        // Restore game state
                        setGameState(savedData);
                        
                        // Restore game events if saved
                        if (savedData.game_events) {
                            setGameEvents(savedData.game_events);
                        }
                        
                        // Restore penalties if saved
                        if (savedData.active_penalties) {
                            setPenalties(savedData.active_penalties);
                        }
                        
                        // Restore shot clock
                        if (savedData.shot_clock) {
                            setShotClock(savedData.shot_clock);
                        }
                        
                        console.log('✅ Game state restored successfully');
                    }
                }
            } catch (error) {
                console.error('Error loading saved game state:', error);
            }
        };
        
        loadSavedGameState();
    }, [event?.id, backendUrl]);


    // Initialize teams and players - now fetches real roster data
    useEffect(() => {
        const initializeTeams = async () => {
            if (event && event.teams && event.teams.length >= 2) {
                setLoadingPlayers(true);
                
                const homeTeam = teams?.find(t => t.id === event.teams[0]);
                const awayTeam = teams?.find(t => t.id === event.teams[1]);
                
                // Fetch real players from API
                const [homeData, awayData] = await Promise.all([
                    fetchTeamPlayers(event.teams[0]),
                    fetchTeamPlayers(event.teams[1])
                ]);

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
                            stats: { goals: 0, assists: 0, shots: 0, penalties: 0, faceoffs: 0, groundBalls: 0 }
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
                            stats: { goals: 0, assists: 0, shots: 0, penalties: 0, faceoffs: 0, groundBalls: 0 }
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
                
                setLoadingPlayers(false);
            }
        };
        
        initializeTeams();
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
    const addShotStat = (teamKey, playerId, shotType, assistPlayerId = null) => {
        // shotType: 'miss', 'saved', 'goal'
        const player = gameState[teamKey].players.find(p => p.id === playerId);
        const teamName = gameState[teamKey].name;
        const assistPlayer = assistPlayerId ? gameState[teamKey].players.find(p => p.id === assistPlayerId) : null;
        
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
                    // Add assist to the assisting player
                    if (assistPlayerId && p.id === assistPlayerId && shotType === 'goal') {
                        return {
                            ...p,
                            stats: {
                                ...p.stats,
                                assists: (p.stats.assists || 0) + 1
                            }
                        };
                    }
                    return p;
                })
            };

            // Update team score and goalie stats for goals
            if (shotType === 'goal') {
                newState[teamKey].score = prev[teamKey].score + 1;
                
                // Update team assists count
                newState[teamKey].assists = (prev[teamKey].assists || 0) + (assistPlayerId ? 1 : 0);
                
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
                if (assistPlayer) {
                    eventText += ` (Assist: #${assistPlayer.number} ${assistPlayer.name})`;
                }
                if (activeGoalie) {
                    eventText += ` (Against ${opposingTeamName} Goalie #${activeGoalie.number} ${activeGoalie.name})`;
                }
                eventType = 'goal';
            }
            
            addGameEvent(eventText, eventType, { 
                teamKey, 
                playerId, 
                shotType, 
                assistPlayerId: assistPlayerId || null,
                timestamp: formatTime(gameState.time_remaining) 
            });
            
            // Show optional "players on field" picker after a goal
            if (shotType === 'goal') {
                const opposingTeamKey = teamKey === 'home_team' ? 'away_team' : 'home_team';
                const activeScoringPlayers = gameState[teamKey].players.filter(p => p.active).map(p => p.id);
                const activeDefendingPlayers = gameState[opposingTeamKey].players.filter(p => p.active).map(p => p.id);
                setOnFieldSelections({ scoring: activeScoringPlayers, defending: activeDefendingPlayers });
                setShowOnFieldPicker({ 
                    goalEventId: Date.now(), 
                    scoringTeamKey: teamKey, 
                    defendingTeamKey: opposingTeamKey 
                });
            }
        }
    };

    // Open team shot modal
    const openTeamShotModal = (team) => {
        setTeamShotModalTeam(team);
        setTeamShotInput({
            playerId: 'unknown',
            shotType: '',
            timestamp: formatTime(gameState.time_remaining),
            assistPlayerId: null
        });
        setShowTeamShotModal(true);
    };

    // Open team shot modal with pre-selected shot type (for quick buttons)
    const openTeamShotModalWithType = (team, shotType) => {
        setTeamShotModalTeam(team);
        setTeamShotInput({
            playerId: 'unknown',
            shotType: shotType,
            timestamp: formatTime(gameState.time_remaining),
            assistPlayerId: null
        });
        // If goal type, pause the game clock
        if (shotType === 'goal' && gameState.is_running && stopClockOnGoal) {
            setGameState(prev => ({ ...prev, is_running: false }));
            addGameEvent('⏸️ GAME PAUSED (Goal scored)', 'game_pause');
        }
        setShowTeamShotModal(true);
    };


    // Open team penalty modal
    const openTeamPenaltyModal = (team) => {
        setPenaltyTeam(team);
        setPenaltyInput({
            playerId: '',
            type: '',
            duration: 2,
            customType: ''
        });
        setSelectedPlayerForPenalty(null); // Clear old player-specific selection
        setShowPenaltyModal(true);
    };


    // Reset shot clock
    const resetShotClock = () => {
        setShotClock(prev => ({
            ...prev,
            timeRemaining: prev.duration,
            isRunning: gameState.is_running
        }));
    };

    // Update shot clock duration
    const updateShotClockDuration = (newDuration) => {
        setShotClock(prev => ({
            duration: newDuration,
            timeRemaining: newDuration,
            isRunning: prev.isRunning
        }));
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
        const assistPlayerId = teamShotInput.assistPlayerId;

        // Handle shot clock based on shot type
        if (shotType === 'saved') {
            // Reset shot clock on save
            resetShotClock();
        } else if (shotType === 'goal') {
            // On goal: pause and reset shot clock
            setShotClock(prev => ({
                ...prev,
                timeRemaining: prev.duration,
                isRunning: false
            }));
            
            // Game timer already paused when goal button was clicked in modal
            // This just ensures it stays paused
            if (gameState.is_running) {
                setGameState(prev => ({
                    ...prev,
                    is_running: false
                }));
            }
        }

        if (playerId === 'unknown') {
            // Handle unknown player shot
            const teamName = gameState[teamKey].name;
            const opposingTeamKey = teamKey === 'home_team' ? 'away_team' : 'home_team';
            const opposingTeamName = gameState[opposingTeamKey].name;
            const opposingGoalieKey = teamKey === 'home_team' ? 'away' : 'home';
            const activeGoalie = gameState.goalies[opposingGoalieKey].find(g => g.active);
            const assistPlayer = assistPlayerId ? gameState[teamKey].players.find(p => p.id === assistPlayerId) : null;

            setGameState(prev => {
                const newState = { ...prev };

                // Update team score for goals
                if (shotType === 'goal') {
                    newState[teamKey].score = prev[teamKey].score + 1;
                    
                    // Track team assists
                    if (assistPlayerId) {
                        newState[teamKey].assists = (prev[teamKey].assists || 0) + 1;
                    }

                    // Update assisting player's stats
                    if (assistPlayerId) {
                        newState[teamKey] = {
                            ...newState[teamKey],
                            players: prev[teamKey].players.map(p => {
                                if (p.id === assistPlayerId) {
                                    return {
                                        ...p,
                                        stats: {
                                            ...p.stats,
                                            assists: (p.stats.assists || 0) + 1
                                        }
                                    };
                                }
                                return p;
                            })
                        };
                    }

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
                if (assistPlayer) {
                    eventText += ` (Assist: #${assistPlayer.number} ${assistPlayer.name})`;
                }
                if (activeGoalie) {
                    eventText += ` (Against ${opposingTeamName} Goalie #${activeGoalie.number} ${activeGoalie.name})`;
                }
                eventType = 'goal';
            }
            
            addGameEvent(eventText, eventType, { teamKey, playerId: 'unknown', shotType, assistPlayerId, timestamp: teamShotInput.timestamp });
            
            // Show optional "players on field" picker after a goal (unknown player path)
            if (shotType === 'goal') {
                const opposingTeamKey = teamKey === 'home_team' ? 'away_team' : 'home_team';
                const activeScoringPlayers = gameState[teamKey].players.filter(p => p.active).map(p => p.id);
                const activeDefendingPlayers = gameState[opposingTeamKey].players.filter(p => p.active).map(p => p.id);
                setOnFieldSelections({ scoring: activeScoringPlayers, defending: activeDefendingPlayers });
                setShowOnFieldPicker({ 
                    goalEventId: Date.now(), 
                    scoringTeamKey: teamKey, 
                    defendingTeamKey: opposingTeamKey 
                });
            }
        } else {
            // Handle known player shot using existing function (with assist)
            addShotStat(teamKey, playerId, shotType, assistPlayerId);
        }

        // Close modal - only reset shot clock for saves and goals (not misses)
        setShowTeamShotModal(false);
        setTeamShotInput({ playerId: 'unknown', shotType: '', timestamp: '', assistPlayerId: null });
        // Shot clock already handled above for saves/goals - misses don't affect it
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
            addGameEvent(`🎯 ${teamName} - #${player.number} ${player.name} with an assist`, 'assist', { teamKey, playerId, timestamp: formatTime(gameState.time_remaining) });
        }
        if (player && statType === 'faceoffs') {
            addGameEvent(`🤝 ${teamName} - #${player.number} ${player.name} wins face-off`, 'faceoff', { teamKey, playerId, timestamp: formatTime(gameState.time_remaining) });
        }
        if (player && statType === 'groundBalls') {
            addGameEvent(`⬇️ ${teamName} - #${player.number} ${player.name} ground ball`, 'ground_ball', { teamKey, playerId, timestamp: formatTime(gameState.time_remaining) });
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

        // Remove any related save/goal_against events that were created immediately after this shot
        // (This handles old events that had separate lines for saves/goals)
        setGameEvents(prev => {
            const updatedEvents = prev.map(e => 
                e.id === originalEvent.id ? { 
                    ...e, 
                    text: newText,
                    time: editTime,
                    timeInSeconds: newTimeInSeconds,
                    metadata: { ...oldMetadata, playerId: newPlayerId, shotType: newShotType, teamKey }
                } : e
            );
            
            // Find and remove any save/goal_against events that occurred right after this shot
            // (within 1 second and same period)
            const shotEventIndex = updatedEvents.findIndex(e => e.id === originalEvent.id);
            if (shotEventIndex !== -1) {
                const shotEvent = updatedEvents[shotEventIndex];
                // Filter out related goalie events that are adjacent to this shot
                return updatedEvents.filter((e, index) => {
                    if ((e.type === 'save' || e.type === 'goal_against') && 
                        e.period === shotEvent.period &&
                        Math.abs(index - shotEventIndex) <= 2) {
                        return false; // Remove this event
                    }
                    return true; // Keep this event
                });
            }
            
            return updatedEvents;
        });

        setEditingEvent(null);
    };

    // Generate consolidated shot event text with goalie info
    const generateShotEventText = (teamKey, playerId, shotType) => {
        const teamName = gameState[teamKey].name;
        const opposingTeamKey = teamKey === 'home_team' ? 'away_team' : 'home_team';
        const opposingTeamName = gameState[opposingTeamKey].name;
        const opposingGoalieKey = teamKey === 'home_team' ? 'away' : 'home';
        const activeGoalie = gameState.goalies[opposingGoalieKey].find(g => g.active);
        
        let eventText = '';
        
        if (playerId === 'unknown') {
            if (shotType === 'miss') {
                eventText = `❌ ${teamName} - Unknown Player - Shot misses`;
            } else if (shotType === 'saved') {
                eventText = `✋ ${teamName} - Unknown Player - Shot on goal`;
                if (activeGoalie) {
                    eventText += ` - SAVED by ${opposingTeamName} Goalie #${activeGoalie.number} ${activeGoalie.name}`;
                }
            } else if (shotType === 'goal') {
                eventText = `🚨 GOAL! ${teamName} - Unknown Player scores!`;
                if (activeGoalie) {
                    eventText += ` (Against ${opposingTeamName} Goalie #${activeGoalie.number} ${activeGoalie.name})`;
                }
            }
        } else {
            const player = gameState[teamKey].players.find(p => p.id === playerId);
            if (player) {
                if (shotType === 'miss') {
                    eventText = `❌ ${teamName} - #${player.number} ${player.name} - Shot misses`;
                } else if (shotType === 'saved') {
                    eventText = `✋ ${teamName} - #${player.number} ${player.name} - Shot on goal`;
                    if (activeGoalie) {
                        eventText += ` - SAVED by ${opposingTeamName} Goalie #${activeGoalie.number} ${activeGoalie.name}`;
                    }
                } else if (shotType === 'goal') {
                    eventText = `🚨 GOAL! ${teamName} - #${player.number} ${player.name} scores!`;
                    if (activeGoalie) {
                        eventText += ` (Against ${opposingTeamName} Goalie #${activeGoalie.number} ${activeGoalie.name})`;
                    }
                }
            }
        }
        
        return eventText || 'Shot event';
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
            stats: { goals: 0, assists: 0, shots: 0, penalties: 0, faceoffs: 0, groundBalls: 0 }
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
        setPenaltyTeam(null);
        setPenaltyInput({ playerId: '', type: '', duration: 2, customType: '' });
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
                case 'points':
                    aValue = ((a.stats.goals || 0) * 2) + (a.stats.assists || 0);
                    bValue = ((b.stats.goals || 0) * 2) + (b.stats.assists || 0);
                    break;
                case 'goals':
                case 'assists':
                case 'shots':
                case 'penalties':
                case 'faceoffs':
                case 'groundBalls':
                    aValue = a.stats[sortConfig.column] || 0;
                    bValue = b.stats[sortConfig.column] || 0;
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
        if (!showPenaltyModal) return null;
        
        // Team-based penalty mode (from top buttons)
        const isTeamMode = penaltyTeam && !selectedPlayerForPenalty;
        const teamName = isTeamMode ? gameState[penaltyTeam].name : null;
        const teamPlayers = isTeamMode 
            ? gameState[penaltyTeam].players
                .filter(p => p.active)
                .sort((a, b) => parseInt(a.number) - parseInt(b.number))
            : [];
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                    <h3 className="text-xl font-bold mb-4">
                        {isTeamMode ? `Record Penalty - ${teamName}` : 'Assign Penalty'}
                    </h3>
                    
                    {/* Player Selection (for team mode) or Display (for player mode) */}
                    {isTeamMode ? (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Player</label>
                            <select
                                value={penaltyInput.playerId}
                                onChange={(e) => setPenaltyInput(prev => ({ ...prev, playerId: e.target.value }))}
                                className="w-full px-3 py-2 border rounded"
                            >
                                <option value="">Select player...</option>
                                {teamPlayers.map(player => (
                                    <option key={player.id} value={player.id}>
                                        #{player.number} {player.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : selectedPlayerForPenalty ? (
                        <div className="mb-4 p-3 bg-gray-100 rounded">
                            <div className="font-bold">#{selectedPlayerForPenalty.number} {selectedPlayerForPenalty.name}</div>
                            <div className="text-sm text-gray-600">{selectedPlayerForPenalty.position}</div>
                        </div>
                    ) : null}
                    
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
                                setPenaltyTeam(null);
                                setPenaltyInput({ playerId: '', type: '', duration: 2, customType: '' });
                            }}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (isTeamMode) {
                                    // Team mode: get player from dropdown
                                    if (!penaltyInput.playerId) {
                                        alert('Please select a player');
                                        return;
                                    }
                                    const player = teamPlayers.find(p => p.id === penaltyInput.playerId);
                                    if (player) {
                                        assignPenalty(penaltyTeam, player.id, player.name, player.number);
                                    }
                                } else if (selectedPlayerForPenalty) {
                                    // Player mode: use selected player
                                    assignPenalty(
                                        selectedPlayerForPenalty.teamKey,
                                        selectedPlayerForPenalty.id,
                                        selectedPlayerForPenalty.name,
                                        selectedPlayerForPenalty.number
                                    );
                                }
                            }}
                            disabled={
                                (isTeamMode && !penaltyInput.playerId) ||
                                !penaltyInput.type || 
                                (penaltyInput.type === 'Other (specify)' && !penaltyInput.customType)
                            }
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Assign Penalty
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Render Team Shot Modal
    // Render "Players On Field" picker modal (shown after a goal)
    const renderOnFieldPicker = () => {
        if (!showOnFieldPicker) return null;
        
        const { scoringTeamKey, defendingTeamKey } = showOnFieldPicker;
        const scoringTeam = gameState[scoringTeamKey];
        const defendingTeam = gameState[defendingTeamKey];
        const scoringPlayers = scoringTeam.players.filter(p => p.active);
        const defendingPlayers = defendingTeam.players.filter(p => p.active);
        
        const togglePlayer = (side, playerId) => {
            setOnFieldSelections(prev => ({
                ...prev,
                [side]: prev[side].includes(playerId)
                    ? prev[side].filter(id => id !== playerId)
                    : [...prev[side], playerId]
            }));
        };
        
        const handleConfirm = () => {
            // Find the most recent goal event and attach the on-field data
            setGameEvents(prev => {
                const updated = [...prev];
                const goalEvent = updated.find(e => e.type === 'goal');
                if (goalEvent) {
                    goalEvent.metadata = {
                        ...goalEvent.metadata,
                        playersOnField: {
                            scoring: onFieldSelections.scoring,
                            defending: onFieldSelections.defending,
                            scoringTeamKey,
                            defendingTeamKey
                        }
                    };
                }
                return updated;
            });
            setShowOnFieldPicker(null);
        };
        
        const PlayerCheckbox = ({ player, side, teamColor }) => (
            <label 
                key={player.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    onFieldSelections[side].includes(player.id) 
                        ? 'bg-opacity-20 border-2' 
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
                style={onFieldSelections[side].includes(player.id) ? { 
                    backgroundColor: `${teamColor}20`, 
                    borderColor: teamColor 
                } : {}}
            >
                <input
                    type="checkbox"
                    checked={onFieldSelections[side].includes(player.id)}
                    onChange={() => togglePlayer(side, player.id)}
                    className="rounded"
                />
                <span className="text-sm font-mono font-bold w-6">#{player.number}</span>
                <span className="text-sm">{player.name}</span>
                <span className="text-xs text-gray-500 ml-auto">{player.position}</span>
            </label>
        );
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="on-field-picker-modal">
                <div className="bg-white rounded-xl p-5 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Players On Field At Goal</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        Select which players were on the field when the goal was scored. Pre-filled with active players — uncheck any who were on the bench.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Scoring Team */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b-2" style={{ borderColor: scoringTeam.color || '#3b82f6' }}>
                                <span className="text-sm font-bold" style={{ color: scoringTeam.color }}>{scoringTeam.name}</span>
                                <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">Scored</span>
                                <span className="text-xs text-gray-500 ml-auto">{onFieldSelections.scoring.length} selected</span>
                            </div>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {scoringPlayers.map(p => <PlayerCheckbox key={p.id} player={p} side="scoring" teamColor={scoringTeam.color || '#3b82f6'} />)}
                            </div>
                        </div>
                        
                        {/* Defending Team */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b-2" style={{ borderColor: defendingTeam.color || '#ef4444' }}>
                                <span className="text-sm font-bold" style={{ color: defendingTeam.color }}>{defendingTeam.name}</span>
                                <span className="text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Scored On</span>
                                <span className="text-xs text-gray-500 ml-auto">{onFieldSelections.defending.length} selected</span>
                            </div>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {defendingPlayers.map(p => <PlayerCheckbox key={p.id} player={p} side="defending" teamColor={defendingTeam.color || '#ef4444'} />)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-5 pt-4 border-t">
                        <button
                            onClick={() => setShowOnFieldPicker(null)}
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                            data-testid="on-field-skip-btn"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                            data-testid="on-field-confirm-btn"
                        >
                            Confirm Players On Field
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderTeamShotModal = () => {
        if (!showTeamShotModal || !teamShotModalTeam) return null;

        const teamKey = teamShotModalTeam;
        const teamName = gameState[teamKey].name;
        const teamColor = gameState[teamKey].color || (teamKey === 'home_team' ? '#3b82f6' : '#ef4444');
        const teamLogo = gameState[teamKey].logo;
        const teamPlayers = gameState[teamKey].players
            .filter(p => p.active)
            .sort((a, b) => parseInt(a.number) - parseInt(b.number)); // Sort by number

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
                    {/* Team Header with Logo & Colors */}
                    <div 
                        className="p-3 flex items-center gap-3"
                        style={{ backgroundColor: teamColor }}
                    >
                        {teamLogo && (
                            <img 
                                src={teamLogo.startsWith('http') ? teamLogo : `${backendUrl}${teamLogo}`} 
                                alt={teamName}
                                className="w-10 h-10 rounded-full object-cover bg-white p-0.5"
                            />
                        )}
                        <h3 className="text-lg font-bold text-white flex-1">{teamName}</h3>
                        <button 
                            onClick={() => {
                                setShowTeamShotModal(false);
                                setTeamShotInput({ playerId: 'unknown', shotType: '', timestamp: '', assistPlayerId: null });
                            }}
                            className="text-white/80 hover:text-white text-xl"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <div className="p-4 space-y-3">
                        {/* Shot Type - Compact Horizontal Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setTeamShotInput(prev => ({ ...prev, shotType: 'miss', assistPlayerId: null }))}
                                className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                                    teamShotInput.shotType === 'miss'
                                        ? 'border-yellow-500 bg-yellow-50 scale-105'
                                        : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50'
                                }`}
                                data-testid="shot-type-miss"
                            >
                                <span className="text-2xl">❌</span>
                                <span className="text-xs font-bold mt-1">MISS</span>
                            </button>

                            <button
                                onClick={() => setTeamShotInput(prev => ({ ...prev, shotType: 'saved', assistPlayerId: null }))}
                                className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                                    teamShotInput.shotType === 'saved'
                                        ? 'border-blue-500 bg-blue-50 scale-105'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                                }`}
                                data-testid="shot-type-saved"
                            >
                                <span className="text-2xl">🧤</span>
                                <span className="text-xs font-bold mt-1">SAVE</span>
                            </button>

                            <button
                                onClick={() => {
                                    setTeamShotInput(prev => ({ ...prev, shotType: 'goal' }));
                                    // Pause game timer immediately when goal is clicked
                                    if (gameState.is_running) {
                                        setGameState(prev => ({ ...prev, is_running: false }));
                                        addGameEvent('⏸️ GAME PAUSED (Goal scored)', 'game_pause');
                                    }
                                }}
                                className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                                    teamShotInput.shotType === 'goal'
                                        ? 'border-green-500 bg-green-50 scale-105'
                                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                                }`}
                                data-testid="shot-type-goal"
                            >
                                <span className="text-2xl">🚨</span>
                                <span className="text-xs font-bold mt-1">GOAL</span>
                            </button>
                        </div>

                        {/* Player & Time Row - Compact */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    {teamShotInput.shotType === 'goal' ? 'Scorer' : 'Player'}
                                </label>
                                <select
                                    value={teamShotInput.playerId}
                                    onChange={(e) => setTeamShotInput(prev => ({ ...prev, playerId: e.target.value }))}
                                    className="w-full px-2 py-2 border rounded-lg text-sm"
                                    data-testid="shot-player-select"
                                >
                                    <option value="unknown">Unknown</option>
                                    {teamPlayers.map(player => (
                                        <option key={player.id} value={player.id}>
                                            #{player.number} {player.name.split(' ').pop()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                                <input
                                    type="text"
                                    value={teamShotInput.timestamp}
                                    onChange={(e) => setTeamShotInput(prev => ({ ...prev, timestamp: e.target.value }))}
                                    className="w-full px-2 py-2 border rounded-lg text-sm font-mono text-center"
                                    placeholder="MM:SS"
                                    data-testid="shot-time-input"
                                />
                            </div>
                        </div>

                        {/* Assist Picker - Compact, only shown when goal is selected */}
                        {teamShotInput.shotType === 'goal' && (
                            <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                                <label className="block text-xs font-medium text-green-700 mb-1">🎯 Assist</label>
                                <select
                                    value={teamShotInput.assistPlayerId || ''}
                                    onChange={(e) => setTeamShotInput(prev => ({ 
                                        ...prev, 
                                        assistPlayerId: e.target.value || null 
                                    }))}
                                    className="w-full px-2 py-2 border border-green-300 rounded-lg text-sm bg-white"
                                    data-testid="assist-player-select"
                                >
                                    <option value="">No Assist</option>
                                    {teamPlayers
                                        .filter(p => p.id !== teamShotInput.playerId)
                                        .map(player => (
                                            <option key={player.id} value={player.id}>
                                                #{player.number} {player.name.split(' ').pop()}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        )}

                        {/* Period Display - Compact */}
                        <div className="text-center text-xs text-gray-500">
                            {gameState.game_settings.periodName} {gameState.current_period}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowTeamShotModal(false);
                                    setTeamShotInput({ playerId: 'unknown', shotType: '', timestamp: '', assistPlayerId: null });
                                }}
                                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                                data-testid="shot-modal-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitTeamShot}
                                disabled={!teamShotInput.shotType}
                                className="flex-1 px-3 py-2 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                style={{ backgroundColor: teamShotInput.shotType ? teamColor : '#9ca3af' }}
                                data-testid="shot-modal-submit"
                            >
                                {teamShotInput.shotType === 'goal' ? '🚨 GOAL!' : teamShotInput.shotType === 'saved' ? '🧤 SAVE' : teamShotInput.shotType === 'miss' ? '❌ MISS' : 'Select Type'}
                            </button>
                        </div>
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
    const renderStickyHeader = () => {
        const homeColor = gameState.home_team.color || '#3b82f6';
        const awayColor = gameState.away_team.color || '#ef4444';
        const getLogoUrl = (logo) => logo ? (logo.startsWith('http') ? logo : `${backendUrl}${logo}`) : null;

        return (
        <div className="fixed top-0 left-0 right-0 z-50 shadow-lg">
            {/* Match Title Bar */}
            <div className="bg-gray-950 px-2 py-0.5 text-center">
                <span className="text-[10px] md:text-xs text-white/60 truncate">{event?.title || 'Live Game'}</span>
            </div>
            {/* Scoreboard + Toggles */}
            <div className="bg-gray-900 px-2 md:px-4 py-1">
                <div className="flex items-center justify-between max-w-7xl mx-auto gap-2">
                    {/* Center: Score display */}
                    <div className="flex items-center gap-1.5 md:gap-3 flex-1 justify-center">
                        {/* Home logo + name */}
                        <div className="flex items-center gap-1">
                            {getLogoUrl(gameState.home_team.logo) && (
                                <img src={getLogoUrl(gameState.home_team.logo)} alt="" className="w-7 h-7 md:w-9 md:h-9 rounded-full object-cover border-2" style={{ borderColor: homeColor }} />
                            )}
                            <span className="text-white text-[10px] md:text-xs font-semibold hidden md:inline max-w-[80px] truncate">{gameState.home_team.name}</span>
                        </div>
                        {/* Score */}
                        <div className="flex items-center gap-1">
                            <span className="text-xl md:text-2xl font-black text-white tabular-nums" style={{ textShadow: `0 0 8px ${homeColor}60` }}>{gameState.home_team.score}</span>
                            {showGameClock ? (
                                <button
                                    onClick={() => { setManualTimeInputs({ minutes: Math.floor(gameState.time_remaining / 60).toString(), seconds: (gameState.time_remaining % 60).toString(), period: gameState.current_period.toString() }); setShowTimeEditor(true); }}
                                    className="flex flex-col items-center mx-1 cursor-pointer hover:opacity-80"
                                    data-testid="edit-time-btn"
                                >
                                    <span className="text-amber-400 font-mono text-sm md:text-base font-bold">{formatTime(gameState.time_remaining)}</span>
                                    <span className="text-white/40 text-[9px]">{gameState.game_settings.periodName} {gameState.current_period}</span>
                                </button>
                            ) : (
                                <span className="text-white/30 text-sm mx-1">-</span>
                            )}
                            <span className="text-xl md:text-2xl font-black text-white tabular-nums" style={{ textShadow: `0 0 8px ${awayColor}60` }}>{gameState.away_team.score}</span>
                        </div>
                        {/* Away logo + name */}
                        <div className="flex items-center gap-1">
                            <span className="text-white text-[10px] md:text-xs font-semibold hidden md:inline max-w-[80px] truncate">{gameState.away_team.name}</span>
                            {getLogoUrl(gameState.away_team.logo) && (
                                <img src={getLogoUrl(gameState.away_team.logo)} alt="" className="w-7 h-7 md:w-9 md:h-9 rounded-full object-cover border-2" style={{ borderColor: awayColor }} />
                            )}
                        </div>
                    </div>
                    {/* Right: Toggles */}
                    <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                        {/* GO LIVE Toggle */}
                        <label className="flex items-center gap-0.5 cursor-pointer" data-testid="go-live-toggle">
                            <button
                                onClick={toggleLive}
                                className={`px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold transition-all ${
                                    isLive
                                        ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                                data-testid="go-live-btn"
                            >
                                {isLive ? '● LIVE' : 'GO LIVE'}
                            </button>
                        </label>
                        <div className="w-px h-4 bg-gray-600" />
                        <button
                            onClick={() => {
                                const isStatsOnly = !showGameClock && !showShotClock;
                                if (isStatsOnly) { setShowGameClock(true); setShowShotClock(true); }
                                else { setShowGameClock(false); setShowShotClock(false); if (gameState.is_running) setGameState(prev => ({ ...prev, is_running: false })); setActiveTab('home_stats'); }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold ${!showGameClock && !showShotClock ? 'bg-amber-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            data-testid="stats-only-btn"
                        >Stats Only</button>
                        <label className="flex items-center gap-0.5 cursor-pointer" data-testid="game-clock-toggle">
                            <span className="text-[9px] md:text-[10px] text-gray-400">Clk</span>
                            <button onClick={() => setShowGameClock(!showGameClock)} className={`relative w-7 h-3.5 rounded-full transition-colors ${showGameClock ? 'bg-green-500' : 'bg-gray-600'}`} data-testid="game-clock-toggle-btn">
                                <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-transform ${showGameClock ? 'translate-x-3.5' : ''}`} />
                            </button>
                        </label>
                        <label className="flex items-center gap-0.5 cursor-pointer" data-testid="shot-clock-toggle">
                            <span className="text-[9px] md:text-[10px] text-gray-400">Sht</span>
                            <button onClick={() => setShowShotClock(!showShotClock)} className={`relative w-7 h-3.5 rounded-full transition-colors ${showShotClock ? 'bg-green-500' : 'bg-gray-600'}`} data-testid="shot-clock-toggle-btn">
                                <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-transform ${showShotClock ? 'translate-x-3.5' : ''}`} />
                            </button>
                        </label>
                    </div>
                </div>
            </div>

            {/* Row 2: Controls + Action Buttons - centered compact row */}
            <div className="bg-white border-b border-gray-200 px-2 md:px-4 py-1.5">
                <div className="flex items-center justify-center gap-2 md:gap-4 max-w-xl mx-auto">
                    {/* Home Team Actions */}
                    <div className="flex items-center gap-1 md:gap-1.5" data-testid="home-score-display">
                        <button onClick={() => openTeamShotModal('home_team')} className="h-12 w-12 md:h-14 md:w-14 rounded-lg font-bold flex flex-col items-center justify-center shadow-sm text-white hover:brightness-110 transition-all" style={{ backgroundColor: homeColor }} title="Record Shot" data-testid="home-shot-btn">
                            <span className="text-base md:text-xl">{sportConfig.icon}</span>
                            <span className="text-[9px] md:text-[10px] font-bold leading-none">SHOT</span>
                        </button>
                        <div className="flex flex-col gap-0.5">
                            <button onClick={() => openTeamPenaltyModal('home_team')} className="h-6 md:h-6 px-2.5 md:px-3 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] md:text-[11px] font-bold flex items-center justify-center shadow-sm" data-testid="home-penalty-btn">Pen</button>
                            <button onClick={() => callTimeout('home')} className="h-6 md:h-6 px-2.5 md:px-3 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] md:text-[11px] font-bold flex items-center justify-center shadow-sm" data-testid="home-timeout-btn">TO</button>
                        </div>
                    </div>

                    {/* Center: Game Controls + Shot Clock */}
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        {showGameClock && (
                            <button onClick={toggleTimer} className={`px-2 md:px-4 py-1 md:py-1.5 rounded font-bold text-white text-[10px] md:text-sm ${gameState.is_running ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`} data-testid="timer-toggle-btn">
                                {gameState.is_running ? 'Pause' : 'Start'}
                            </button>
                        )}
                        {showGameClock && (
                            <button
                                onClick={() => { setGameState(prev => ({ ...prev, current_period: Math.min(prev.current_period + 1, prev.game_settings.periods), time_remaining: prev.period_length * 60, is_running: false })); const newPeriod = Math.min(gameState.current_period + 1, gameState.game_settings.periods); addGameEvent(`${gameState.game_settings.periodName} ${gameState.current_period} ended. Starting ${gameState.game_settings.periodName} ${newPeriod}`, 'period_change'); }}
                                disabled={gameState.current_period >= gameState.game_settings.periods}
                                className="px-1.5 md:px-3 py-1 md:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[10px] md:text-sm disabled:opacity-50"
                                data-testid="next-period-btn"
                            >Next</button>
                        )}
                        {showShotClock ? (
                            <button onClick={resetShotClock} className={`text-lg md:text-2xl font-bold font-mono px-2 md:px-3 py-0.5 md:py-1 rounded border-2 cursor-pointer transition-all ${shotClock.timeRemaining === 0 ? 'bg-red-600 text-white border-red-700 animate-pulse' : shotClock.timeRemaining <= 10 ? 'bg-yellow-400 text-gray-900 border-yellow-500 animate-pulse' : 'bg-white text-gray-800 border-gray-300 hover:border-blue-500'}`} title="Click to reset shot clock" data-testid="shot-clock-reset-btn">
                                {shotClock.timeRemaining}
                            </button>
                        ) : null}
                        <button onClick={() => { console.log('Manual save button clicked'); autoSaveGameStats(); }} className="px-2 md:px-3 py-1 md:py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium text-[10px] md:text-sm" data-testid="manual-save-btn">Save</button>
                        {lastSaved && <span className="hidden md:inline text-[9px] text-gray-400">Saved {Math.round((new Date() - lastSaved) / 1000)}s</span>}
                    </div>

                    {/* Away Team Actions */}
                    <div className="flex items-center gap-1 md:gap-1.5" data-testid="away-score-display">
                        <div className="flex flex-col gap-0.5">
                            <button onClick={() => openTeamPenaltyModal('away_team')} className="h-6 md:h-6 px-2.5 md:px-3 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] md:text-[11px] font-bold flex items-center justify-center shadow-sm" data-testid="away-penalty-btn">Pen</button>
                            <button onClick={() => callTimeout('away')} className="h-6 md:h-6 px-2.5 md:px-3 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] md:text-[11px] font-bold flex items-center justify-center shadow-sm" data-testid="away-timeout-btn">TO</button>
                        </div>
                        <button onClick={() => openTeamShotModal('away_team')} className="h-12 w-12 md:h-14 md:w-14 rounded-lg font-bold flex flex-col items-center justify-center shadow-sm text-white hover:brightness-110 transition-all" style={{ backgroundColor: awayColor }} title="Record Shot" data-testid="away-shot-btn">
                            <span className="text-base md:text-xl">{sportConfig.icon}</span>
                            <span className="text-[9px] md:text-[10px] font-bold leading-none">SHOT</span>
                        </button>
                    </div>
                </div>
                {showShotClock && (
                    <div className="flex justify-center pt-0.5 pb-0.5">
                        <label className="flex items-center gap-1 cursor-pointer text-[9px] text-gray-500" data-testid="shot-clock-panel">
                            <input type="checkbox" checked={stopClockOnGoal} onChange={(e) => setStopClockOnGoal(e.target.checked)} className="rounded w-2.5 h-2.5" />
                            <span>Stop on Goal</span>
                        </label>
                    </div>
                )}
            </div>
        </div>
        );
    };

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
        const teamColor = teamData.color || (isHome ? '#3b82f6' : '#ef4444');

        // ─── Shared: Shot dropdown logic ───
        const ShotDropdown = ({ player }) => (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 min-w-[160px]">
                <button
                    onClick={() => {
                        setGameState(prev => ({ ...prev, is_running: false }));
                        setShotClock(prev => ({ ...prev, isRunning: false }));
                        setTeamShotModalTeam(teamKey);
                        setTeamShotInput({ playerId: player.id, shotType: 'goal', timestamp: formatTime(gameState.time_remaining), assistPlayerId: null });
                        setShowTeamShotModal(true);
                        setShowShotMenu(null);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-green-50 border-b flex items-center gap-2 rounded-t-lg"
                >
                    <span className="text-lg">🥅</span>
                    <div><div className="font-bold text-green-700">Goal</div><div className="text-xs text-gray-500">Stop clocks</div></div>
                </button>
                <button
                    onClick={() => {
                        setShotClock(prev => ({ ...prev, timeRemaining: prev.duration, isRunning: gameState.is_running }));
                        addShotStat(teamKey, player.id, 'saved');
                        setShowShotMenu(null);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b flex items-center gap-2"
                >
                    <span className="text-lg">🧤</span>
                    <div><div className="font-bold text-purple-700">Save</div><div className="text-xs text-gray-500">Reset shot clock</div></div>
                </button>
                <button
                    onClick={() => {
                        const playerObj = gameState[teamKey].players.find(p => p.id === player.id);
                        const playerName = playerObj ? formatPlayerName(playerObj.name) : 'Unknown';
                        addGameEvent(`${playerName} - Shot missed`, 'miss', { teamKey, playerId: player.id, shotType: 'miss', timestamp: formatTime(gameState.time_remaining) });
                        setShowShotMenu(null);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 rounded-b-lg"
                >
                    <span className="text-lg">❌</span>
                    <div><div className="font-bold text-gray-700">Miss</div><div className="text-xs text-gray-500">No stat change</div></div>
                </button>
            </div>
        );

        // ─── Shared: +/- stat control ───
        const StatControl = ({ value, label, color, onIncrement, onDecrement }) => (
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 leading-none mb-0.5">{label}</span>
                <div className="flex items-center gap-0.5">
                    <button onClick={onDecrement} disabled={value <= 0}
                        className="w-7 h-7 md:w-8 md:h-8 bg-red-100 text-red-600 rounded text-sm font-bold hover:bg-red-200 disabled:opacity-30 flex items-center justify-center">−</button>
                    <span className={`w-7 text-center font-bold text-sm ${color}`}>{value}</span>
                    <button onClick={onIncrement}
                        className={`w-7 h-7 md:w-8 md:h-8 rounded text-sm font-bold hover:opacity-80 flex items-center justify-center`}
                        style={{ backgroundColor: `${color === 'text-blue-600' ? '#dbeafe' : color === 'text-orange-600' ? '#ffedd5' : '#ccfbf1'}`, color: `${color === 'text-blue-600' ? '#2563eb' : color === 'text-orange-600' ? '#ea580c' : '#0d9488'}` }}>+</button>
                </div>
            </div>
        );

        // Helper to decrement a stat
        const decrementStat = (playerId, statKey) => {
            setGameState(prev => ({
                ...prev,
                [teamKey]: {
                    ...prev[teamKey],
                    players: prev[teamKey].players.map(p =>
                        p.id === playerId ? { ...p, stats: { ...p.stats, [statKey]: Math.max(0, (p.stats[statKey] || 0) - 1) } } : p
                    )
                }
            }));
        };

        // ─── Mobile Card Layout (visible < md) ───
        const MobilePlayerCard = ({ player }) => (
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 shadow-sm" data-testid={`player-card-${player.id}`}>
                {/* Row 1: Player info + Shot button */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <input type="checkbox" checked={player.active} onChange={() => togglePlayerActive(teamKey, player.id)} className="rounded w-4 h-4 flex-shrink-0" />
                        <span className="font-mono font-bold text-sm text-gray-800">#{player.number}</span>
                        <span className="text-sm font-medium truncate">{formatPlayerName(player.name)}</span>
                    </div>
                    <div className="shot-button-container relative flex-shrink-0">
                        <button
                            onClick={() => setShowShotMenu(showShotMenu === player.id ? null : player.id)}
                            className="h-10 px-5 bg-yellow-500 text-white rounded-lg font-bold text-sm hover:bg-yellow-600 shadow-sm"
                            data-testid={`shot-btn-${player.id}`}
                        >
                            SHOT
                        </button>
                        {showShotMenu === player.id && <ShotDropdown player={player} />}
                    </div>
                </div>
                {/* Row 2: Read-only stats */}
                <div className="flex items-center gap-3 mb-2 px-1">
                    <div className="flex items-center gap-1"><span className="text-[10px] text-gray-400">S</span><span className="font-bold text-sm text-yellow-600">{player.stats.shots}</span></div>
                    <div className="flex items-center gap-1"><span className="text-[10px] text-gray-400">G</span><span className="font-bold text-sm text-green-600">{player.stats.goals}</span></div>
                    <div className="flex items-center gap-1"><span className="text-[10px] text-gray-400">Pts</span><span className="font-bold text-sm text-indigo-600">{((player.stats.goals || 0) * 2) + (player.stats.assists || 0)}</span></div>
                    <div className="flex items-center gap-1"><span className="text-[10px] text-gray-400">PIM</span><span className="font-bold text-sm text-red-600">{player.stats.penalties}</span></div>
                </div>
                {/* Row 3: Adjustable stats with +/- */}
                <div className="flex items-center justify-between gap-1 border-t border-gray-100 pt-2">
                    <StatControl label="Ast" value={player.stats.assists} color="text-blue-600"
                        onIncrement={() => addStat(teamKey, player.id, 'assists')}
                        onDecrement={() => decrementStat(player.id, 'assists')} />
                    <StatControl label="FO" value={player.stats.faceoffs || 0} color="text-orange-600"
                        onIncrement={() => addStat(teamKey, player.id, 'faceoffs')}
                        onDecrement={() => decrementStat(player.id, 'faceoffs')} />
                    <StatControl label="GB" value={player.stats.groundBalls || 0} color="text-teal-600"
                        onIncrement={() => addStat(teamKey, player.id, 'groundBalls')}
                        onDecrement={() => decrementStat(player.id, 'groundBalls')} />
                </div>
            </div>
        );

        // ─── Desktop Table (visible >= md) ───
        const SortableHeader = ({ column, children, className: cls = '' }) => (
            <th className={`px-2 py-1.5 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none ${cls}`}
                onClick={() => handleColumnSort(teamKey, column)}>
                <div className="flex items-center gap-1">
                    {children}
                    {sortConfig.column === column && <span className="text-[10px]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                </div>
            </th>
        );

        const DesktopPlayerRow = ({ player, isInactive = false }) => (
            <tr className={`${isInactive ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50/50'} border-b border-gray-100`}>
                <td className="px-1.5 py-1"><input type="checkbox" checked={player.active} onChange={() => togglePlayerActive(teamKey, player.id)} className="rounded" /></td>
                <td className="px-1.5 py-1 text-sm font-mono font-bold">{player.number}</td>
                <td className="px-1.5 py-1">
                    <div className="flex items-center gap-1.5">
                        {player.photo ? (
                            <img src={player.photo} alt={player.name} className="w-7 h-7 object-cover rounded-full border border-gray-300" />
                        ) : (
                            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                                <span className="text-[10px] font-bold text-gray-500">{player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                            </div>
                        )}
                        <span className="text-sm font-medium">{formatPlayerName(player.name)}</span>
                    </div>
                </td>
                <td className="px-1.5 py-1 text-xs text-gray-500">{player.position}</td>
                {!isInactive ? (
                    <>
                        <td className="px-1 py-1 text-center shot-button-container relative">
                            <button onClick={() => setShowShotMenu(showShotMenu === player.id ? null : player.id)}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-md font-bold text-sm hover:bg-yellow-600 shadow-sm">Shot</button>
                            {showShotMenu === player.id && <ShotDropdown player={player} />}
                        </td>
                        <td className="px-1.5 py-1 text-center"><span className="font-bold text-sm text-yellow-600">{player.stats.shots}</span></td>
                        <td className="px-1.5 py-1 text-center"><span className="font-bold text-sm text-green-600">{player.stats.goals}</span></td>
                        <td className="px-1 py-1 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                                <button onClick={() => decrementStat(player.id, 'assists')} disabled={player.stats.assists <= 0}
                                    className="w-7 h-7 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200 disabled:opacity-30">−</button>
                                <span className="w-7 text-center font-bold text-sm text-blue-600">{player.stats.assists}</span>
                                <button onClick={() => addStat(teamKey, player.id, 'assists')}
                                    className="w-7 h-7 bg-blue-100 text-blue-600 rounded text-xs font-bold hover:opacity-80">+</button>
                            </div>
                        </td>
                        <td className="px-1.5 py-1 text-center"><span className="font-bold text-sm text-indigo-600">{((player.stats.goals || 0) * 2) + (player.stats.assists || 0)}</span></td>
                        <td className="px-1 py-1 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                                <button onClick={() => decrementStat(player.id, 'faceoffs')} disabled={(player.stats.faceoffs || 0) <= 0}
                                    className="w-7 h-7 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200 disabled:opacity-30">−</button>
                                <span className="w-7 text-center font-bold text-sm text-orange-600">{player.stats.faceoffs || 0}</span>
                                <button onClick={() => addStat(teamKey, player.id, 'faceoffs')}
                                    className="w-7 h-7 bg-orange-100 text-orange-600 rounded text-xs font-bold hover:opacity-80">+</button>
                            </div>
                        </td>
                        <td className="px-1 py-1 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                                <button onClick={() => decrementStat(player.id, 'groundBalls')} disabled={(player.stats.groundBalls || 0) <= 0}
                                    className="w-7 h-7 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200 disabled:opacity-30">−</button>
                                <span className="w-7 text-center font-bold text-sm text-teal-600">{player.stats.groundBalls || 0}</span>
                                <button onClick={() => addStat(teamKey, player.id, 'groundBalls')}
                                    className="w-7 h-7 bg-teal-100 text-teal-600 rounded text-xs font-bold hover:opacity-80">+</button>
                            </div>
                        </td>
                        <td className="px-1.5 py-1 text-center"><span className="font-bold text-sm text-red-600">{player.stats.penalties}</span></td>
                    </>
                ) : (
                    <>
                        <td className="px-1.5 py-1 text-center text-xs text-gray-400">-</td>
                        <td className="px-1.5 py-1 text-center text-xs">{player.stats.shots || 0}</td>
                        <td className="px-1.5 py-1 text-center text-xs">{player.stats.goals || 0}</td>
                        <td className="px-1.5 py-1 text-center text-xs">{player.stats.assists || 0}</td>
                        <td className="px-1.5 py-1 text-center text-xs font-semibold text-indigo-600">{((player.stats.goals || 0) * 2) + (player.stats.assists || 0)}</td>
                        <td className="px-1.5 py-1 text-center text-xs">{player.stats.faceoffs || 0}</td>
                        <td className="px-1.5 py-1 text-center text-xs">{player.stats.groundBalls || 0}</td>
                        <td className="px-1.5 py-1 text-center text-xs">{player.stats.penalties || 0}</td>
                    </>
                )}
            </tr>
        );

        return (
            <div className="space-y-4">
                {/* Goalies Section */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Goalies</h4>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="divide-y divide-gray-200">
                            {gameState.goalies[isHome ? 'home' : 'away'].map(goalie => (
                                <div key={goalie.id} className={`flex items-center justify-between p-2.5 gap-2 ${
                                    goalie.active ? (isHome ? 'bg-blue-50' : 'bg-red-50') : 'bg-gray-50'
                                }`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <input type="checkbox" checked={goalie.active} onChange={() => toggleGoalieActive(isHome ? 'home' : 'away', goalie.id)} className="rounded w-4 h-4" />
                                        <span className="font-mono font-bold text-sm">#{goalie.number}</span>
                                        <span className="font-medium text-sm truncate">{goalie.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                                        <div className="text-xs"><span className="font-semibold">SV:</span> {goalie.stats.saves}</div>
                                        <div className="text-xs"><span className="font-semibold">GA:</span> {goalie.stats.goals_against}</div>
                                        <div className="text-xs hidden sm:block"><span className="font-semibold">SF:</span> {goalie.stats.shots_faced}</div>
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
                                            className="h-8 px-3 bg-purple-500 text-white rounded-md hover:bg-purple-600 font-bold text-xs"
                                        >
                                            +Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team Header */}
                <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: `${teamColor}15` }}>
                    <h3 className="text-base font-semibold flex items-center gap-2">
                        {teamData.logo && (
                            <img src={teamData.logo.startsWith('http') ? teamData.logo : `${backendUrl}${teamData.logo}`}
                                alt={teamData.name} className="w-7 h-7 object-cover rounded-full bg-white p-0.5 shadow" />
                        )}
                        <span style={{ color: teamColor }}>{teamData.name}</span>
                        <span className="text-gray-500 font-normal text-xs">({activePlayers.length})</span>
                    </h3>
                    <button onClick={() => { setAddPlayerTeam(teamKey); setShowAddPlayerModal(true); }}
                        className="px-3 py-1.5 text-white rounded-lg font-medium text-xs hover:opacity-90"
                        style={{ backgroundColor: teamColor }}>+ Add</button>
                </div>

                {/* ─── MOBILE: Card Layout (< md) ─── */}
                <div className="md:hidden space-y-2" data-testid={`mobile-player-cards-${teamKey}`}>
                    {activePlayers.map(player => <MobilePlayerCard key={player.id} player={player} />)}
                </div>

                {/* ─── DESKTOP: Table Layout (>= md) ─── */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full bg-white border rounded-lg text-sm">
                        <thead style={{ backgroundColor: `${teamColor}15` }}>
                            <tr>
                                <th className="px-1.5 py-1.5 text-left text-xs font-medium text-gray-700 w-8">Act</th>
                                <SortableHeader column="number">#</SortableHeader>
                                <SortableHeader column="name">Player</SortableHeader>
                                <th className="px-1.5 py-1.5 text-xs font-medium text-gray-700 w-12">Pos</th>
                                <th className="px-1 py-1.5 text-center text-xs font-medium text-gray-700">Shot</th>
                                <SortableHeader column="shots">Shots</SortableHeader>
                                <SortableHeader column="goals">Goals</SortableHeader>
                                <SortableHeader column="assists">Assists</SortableHeader>
                                <SortableHeader column="points">Pts</SortableHeader>
                                <SortableHeader column="faceoffs">Faceoffs</SortableHeader>
                                <SortableHeader column="groundBalls">GBalls</SortableHeader>
                                <SortableHeader column="penalties">PIM</SortableHeader>
                            </tr>
                        </thead>
                        <tbody>
                            {activePlayers.map(player => <DesktopPlayerRow key={player.id} player={player} />)}
                        </tbody>
                    </table>
                    <div className="h-32"></div>
                </div>

                {/* Inactive Players */}
                {inactivePlayers.length > 0 && (
                    <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-2">
                            Inactive / Didn't RSVP ({inactivePlayers.length})
                        </h4>
                        {/* Mobile inactive */}
                        <div className="md:hidden space-y-1">
                            {inactivePlayers.map(player => (
                                <div key={player.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100 opacity-60">
                                    <input type="checkbox" checked={player.active} onChange={() => togglePlayerActive(teamKey, player.id)} className="rounded w-4 h-4" />
                                    <span className="font-mono font-bold text-xs">#{player.number}</span>
                                    <span className="text-xs truncate">{formatPlayerName(player.name)}</span>
                                    <div className="ml-auto flex gap-2 text-[10px] text-gray-400">
                                        <span>G:{player.stats.goals||0}</span>
                                        <span>A:{player.stats.assists||0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Desktop inactive */}
                        <div className="hidden md:block bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600 w-8">Act</th>
                                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">#</th>
                                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Player</th>
                                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-600">Pos</th>
                                        <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Shot</th>
                                        <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Shots</th>
                                        <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Goals</th>
                                        <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Assists</th>
                                        <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">Pts</th>
                                        <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">FO</th>
                                        <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">GB</th>
                                        <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-600">PIM</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {inactivePlayers.map(player => <DesktopPlayerRow key={player.id} player={player} isInactive={true} />)}
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
        // Sort by period and time - based on user preference
        const sortedEvents = [...gameEvents].sort((a, b) => {
            if (eventSortOrder === 'newest') {
                // Newest first: higher period first, then higher time
                if (b.period !== a.period) return b.period - a.period;
                return b.timeInSeconds - a.timeInSeconds;
            } else {
                // Oldest first: lower period first, then lower time
                if (a.period !== b.period) return a.period - b.period;
                return a.timeInSeconds - b.timeInSeconds;
            }
        });

        // Filter events based on selected filter
        const filteredEvents = eventFilter === 'all' 
            ? sortedEvents 
            : sortedEvents.filter(evt => evt.type === eventFilter);

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

        // Get unique event types for the filter
        const eventTypes = [...new Set(gameEvents.map(e => e.type))].sort();

        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-xl font-bold">📋 Game Events Timeline</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Sort Order Toggle */}
                        <button
                            onClick={() => setEventSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-2"
                            title="Toggle sort order"
                        >
                            {eventSortOrder === 'newest' ? '⬇️ Newest First' : '⬆️ Oldest First'}
                        </button>
                        
                        <label className="text-sm font-medium text-gray-600">Filter:</label>
                        <select
                            value={eventFilter}
                            onChange={(e) => setEventFilter(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Events ({sortedEvents.length})</option>
                            {eventTypes.map(type => {
                                const count = sortedEvents.filter(e => e.type === type).length;
                                const label = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                const icon = 
                                    type === 'goal' ? '🚨' :
                                    type === 'shot' ? sportConfig.icon :
                                    type === 'shot_miss' ? '❌' :
                                    type === 'save' ? '✋' :
                                    type === 'penalty' ? '⚠️' :
                                    type === 'penalty_end' ? '✅' :
                                    type === 'assist' ? '🎯' :
                                    type === 'period_change' ? '🔔' :
                                    type === 'game_start' ? '🏁' :
                                    '📌';
                                return (
                                    <option key={type} value={type}>
                                        {icon} {label} ({count})
                                    </option>
                                );
                            })}
                        </select>
                        <span className="text-sm text-gray-600">
                            {filteredEvents.length} of {sortedEvents.length} shown
                        </span>
                    </div>
                </div>
                
                {sortedEvents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-2">📋</div>
                        <p>No events yet. Start tracking game actions!</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-2">🔍</div>
                        <p>No events match the selected filter.</p>
                        <button 
                            onClick={() => setEventFilter('all')}
                            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Show All Events
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto">
                        {filteredEvents.map((evt) => (
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
                                                        {gameState[evt.metadata.teamKey]?.players
                                                            .filter(p => p.active)
                                                            .sort((a, b) => parseInt(a.number) - parseInt(b.number))
                                                            .map(player => (
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
                                            <div>{gameState.game_settings.periodName} {evt.period}</div>
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

    // Broadcast Tab - YouTube Live Stream Integration
    const renderBroadcastTab = () => {
        return (
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        📺 Live Broadcast
                        {broadcastConfig.enabled && broadcastConfig.youtubeVideoId && (
                            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded animate-pulse">
                                🔴 LIVE
                            </span>
                        )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Embed a YouTube live stream alongside the scoreboard
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Enable Broadcast Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-slate-800">Enable Live Broadcast</h4>
                            <p className="text-sm text-slate-600">Show YouTube stream in the spectator view</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={broadcastConfig.enabled}
                                onChange={(e) => setBroadcastConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>

                    {/* YouTube Video ID Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            YouTube Video/Stream ID
                        </label>
                        <input
                            type="text"
                            value={broadcastConfig.youtubeVideoId}
                            onChange={(e) => setBroadcastConfig(prev => ({ ...prev, youtubeVideoId: e.target.value }))}
                            placeholder="e.g., dQw4w9WgXcQ"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Enter the video ID from the YouTube URL (the part after v= or youtu.be/)
                        </p>
                    </div>

                    {/* Preview */}
                    {broadcastConfig.enabled && broadcastConfig.youtubeVideoId && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Stream Preview
                            </label>
                            <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
                                <iframe
                                    className="absolute inset-0 w-full h-full"
                                    src={`https://www.youtube.com/embed/${broadcastConfig.youtubeVideoId}?autoplay=0`}
                                    title="YouTube Live Stream"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    )}

                    {/* Quick Channel Lookup */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            YouTube Channel ID (for live stream detection)
                        </label>
                        <input
                            type="text"
                            value={broadcastConfig.youtubeChannelId}
                            onChange={(e) => setBroadcastConfig(prev => ({ ...prev, youtubeChannelId: e.target.value }))}
                            placeholder="UCxxxxxxxxxxxxxx"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Optional: Enter your channel ID to auto-detect when you go live
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            <div>
                                <h5 className="font-medium text-red-800">How to use Live Broadcast</h5>
                                <ol className="text-sm text-red-700 mt-2 space-y-1 list-decimal list-inside">
                                    <li>Start a live stream on your YouTube channel</li>
                                    <li>Copy the video ID from the stream URL</li>
                                    <li>Paste it above and enable the broadcast</li>
                                    <li>Spectators will see the stream alongside the scoreboard</li>
                                </ol>
                            </div>
                        </div>
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
            <div style={{ paddingTop: '90px' }}>
            {/* Tab Navigation - positioned below fixed header */}
            <div className="bg-white border-b sticky" style={{ top: '90px', zIndex: 40 }}>
                <div className="max-w-7xl mx-auto px-2 md:px-4">
                    <div className="flex overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('home_stats')}
                            className={`whitespace-nowrap py-2 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm ${
                                activeTab === 'home_stats'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                            data-testid="tab-home-stats"
                        >
                            {gameState.home_team.name}
                        </button>
                        <button
                            onClick={() => setActiveTab('away_stats')}
                            className={`whitespace-nowrap py-2 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm ${
                                activeTab === 'away_stats'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                            data-testid="tab-away-stats"
                        >
                            {gameState.away_team.name}
                        </button>
                        <button
                            onClick={() => setActiveTab('game_events')}
                            className={`whitespace-nowrap py-2 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm ${
                                activeTab === 'game_events'
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                            data-testid="tab-game-events"
                        >
                            Events ({gameEvents.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('live_chat')}
                            className={`whitespace-nowrap py-2 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm ${
                                activeTab === 'live_chat'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                            data-testid="tab-live-chat"
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('broadcast')}
                            className={`whitespace-nowrap py-2 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm ${
                                activeTab === 'broadcast'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                            data-testid="tab-broadcast"
                        >
                            Broadcast
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-3 md:p-6" style={{ paddingTop: '12px' }}>
                <div className="max-w-7xl mx-auto">
                    {/* Active Penalties Display */}
                    {renderActivePenalties()}
                    
                    {activeTab === 'home_stats' && renderPlayerStats('home_team', gameState.home_team)}
                    {activeTab === 'away_stats' && renderPlayerStats('away_team', gameState.away_team)}
                    {activeTab === 'game_events' && renderGameEvents()}
                    {activeTab === 'live_chat' && renderLiveChat()}
                    {activeTab === 'broadcast' && renderBroadcastTab()}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-white border-t px-3 md:px-6 py-2 md:py-3 sticky bottom-0">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button
                        onClick={onCancel}
                        className="px-3 md:px-6 py-1.5 md:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs md:text-sm"
                        data-testid="cancel-scoring-btn"
                    >
                        ← Cancel
                    </button>

                    <div className="flex gap-2">
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
                                            stats: { goals: 0, assists: 0, shots: 0, penalties: 0, faceoffs: 0, groundBalls: 0 } 
                                        })) 
                                    },
                                    away_team: { 
                                        ...prev.away_team, 
                                        score: 0, 
                                        players: prev.away_team.players.map(p => ({ 
                                            ...p, 
                                            stats: { goals: 0, assists: 0, shots: 0, penalties: 0, faceoffs: 0, groundBalls: 0 } 
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
                            className="px-3 md:px-4 py-1.5 md:py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-xs md:text-sm"
                            data-testid="reset-game-btn"
                        >
                            Reset
                        </button>
                        
                        <button
                            onClick={async () => {
                                // Save game with FINAL status so it counts in standings
                                const gameData = {
                                    event_id: event.id,
                                    home_team: {
                                        team_id: gameState.home_team.id,
                                        name: gameState.home_team.name,
                                        goals_for: gameState.home_team.score,
                                        goals_against: gameState.away_team.score,
                                        players: gameState.home_team.players
                                    },
                                    away_team: {
                                        team_id: gameState.away_team.id,
                                        name: gameState.away_team.name,
                                        goals_for: gameState.away_team.score,
                                        goals_against: gameState.home_team.score,
                                        players: gameState.away_team.players
                                    },
                                    goalies: gameState.goalies,
                                    time_remaining: formatTime(gameState.time_remaining),
                                    current_period: gameState.current_period,
                                    game_settings: gameState.game_settings,
                                    status: 'final', // IMPORTANT: Mark as final for standings
                                    final_score: `${gameState.home_team.score}-${gameState.away_team.score}`,
                                    winner: gameState.home_team.score > gameState.away_team.score 
                                        ? gameState.home_team.id 
                                        : gameState.home_team.score < gameState.away_team.score 
                                        ? gameState.away_team.id 
                                        : null,
                                    entry_type: 'enhanced_live_stats',
                                    entry_time: new Date().toISOString(),
                                    game_duration: gameState.current_period,
                                    period_length: gameState.period_length,
                                    detailed_stats: true,
                                    game_events: gameEvents,
                                    penalties: penalties
                                };
                                
                                try {
                                    // Save to game_stats with final status
                                    const response = await fetch(`${backendUrl}/api/game-stats`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(gameData)
                                    });
                                    
                                    if (response.ok) {
                                        // Also update the event to completed
                                        await fetch(`${backendUrl}/api/unified-events/${event.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                status: 'completed',
                                                homeScore: gameState.home_team.score,
                                                awayScore: gameState.away_team.score,
                                                scores: gameData
                                            })
                                        });
                                        
                                        alert(`✅ Game saved as FINAL!\n\nFinal Score: ${gameState.home_team.name} ${gameState.home_team.score} - ${gameState.away_team.score} ${gameState.away_team.name}\n\nStandings will be updated.`);
                                        onSubmit(gameData);
                                    } else {
                                        alert('❌ Error saving game stats');
                                    }
                                } catch (error) {
                                    console.error('Error saving final game:', error);
                                    alert('❌ Error saving game stats');
                                }
                            }}
                            className="px-4 md:px-6 py-1.5 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-xs md:text-sm"
                            data-testid="end-game-btn"
                        >
                            End Game
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
            
            {/* Players On Field Picker Modal */}
            {renderOnFieldPicker()}
            
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