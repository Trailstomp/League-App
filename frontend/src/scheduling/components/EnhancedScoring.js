import React, { useState, useEffect } from 'react';

/**
 * Enhanced Scoring System - Foundation for comprehensive lacrosse statistics
 * Tracks games, wins, losses, goals, saves, shots with percentages
 * Designed for future live scoring integration
 */

// Player Statistics Model
const createPlayerStats = (playerId, playerName, position = 'field') => ({
    playerId,
    playerName,
    position, // 'field', 'goalie'
    // Game counts
    gamesPlayed: 0,
    gamesStarted: 0,
    // Scoring stats (field players)
    goals: 0,
    assists: 0,
    points: 0, // goals + assists
    // Goalie stats
    saves: 0,
    shotsAgainst: 0,
    goalsAllowed: 0,
    shutouts: 0,
    // Calculated percentages
    get savePercentage() {
        return this.shotsAgainst > 0 ? ((this.saves / this.shotsAgainst) * 100).toFixed(1) : '0.0';
    },
    get goalsAgainstAverage() {
        return this.gamesPlayed > 0 ? (this.goalsAllowed / this.gamesPlayed).toFixed(2) : '0.00';
    }
});

// Team Statistics Model
const createTeamStats = (teamId, teamName) => ({
    teamId,
    teamName,
    // Season record
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    // Scoring
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifferential: 0,
    // Calculated percentages
    get winPercentage() {
        return this.gamesPlayed > 0 ? ((this.wins / this.gamesPlayed) * 100).toFixed(1) : '0.0';
    },
    get averageGoalsFor() {
        return this.gamesPlayed > 0 ? (this.goalsFor / this.gamesPlayed).toFixed(1) : '0.0';
    },
    get averageGoalsAgainst() {
        return this.gamesPlayed > 0 ? (this.goalsAgainst / this.gamesPlayed).toFixed(1) : '0.0';
    }
});

// Enhanced Scoring Component for EventDetailModal
const EnhancedScoresTab = ({ 
    event, 
    teams, 
    players = [], 
    editMode, 
    userCanEdit, 
    onUpdateGameStats,
    gameStats = null 
}) => {
    const [localGameStats, setLocalGameStats] = useState(gameStats || {
        teamStats: {},
        playerStats: {},
        gameDetails: {
            periods: 4,
            currentPeriod: 1,
            timeRemaining: '15:00',
            status: 'not_started' // not_started, in_progress, completed
        }
    });
    
    // State for team players fetched from API
    const [teamPlayers, setTeamPlayers] = useState({});
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Sync local state with gameStats prop when it changes (for tab switching)
    useEffect(() => {
        console.log('📊 EnhancedScoring: useEffect triggered, gameStats:', gameStats);
        if (gameStats) {
            console.log('📊 EnhancedScoring: Syncing with gameStats prop:', gameStats);
            setLocalGameStats(gameStats);
        } else {
            console.log('📊 EnhancedScoring: No gameStats provided, initializing default');
        }
    }, [gameStats]); // Only depend on gameStats prop

    // Handle different event team data structures
    const eventTeams = event.teamIds || 
                      (event.teamId ? [event.teamId] : 
                      (event.homeTeam && event.awayTeam ? [event.homeTeam, event.awayTeam] : []));
    const getTeamInfo = (teamId) => teams.find(team => team.id === teamId);
    
    // Fetch players for each team in the event
    useEffect(() => {
        const fetchTeamPlayers = async () => {
            if (eventTeams.length === 0) return;
            
            setLoadingPlayers(true);
            const playersMap = {};
            
            for (const teamId of eventTeams) {
                try {
                    const response = await fetch(`${backendUrl}/api/team/${teamId}/players`);
                    if (response.ok) {
                        const players = await response.json();
                        playersMap[teamId] = players || [];
                        console.log(`📊 Loaded ${players?.length || 0} players for team ${teamId}`);
                    }
                } catch (error) {
                    console.error(`Error fetching players for team ${teamId}:`, error);
                    playersMap[teamId] = [];
                }
            }
            
            setTeamPlayers(playersMap);
            setLoadingPlayers(false);
        };
        
        fetchTeamPlayers();
    }, [eventTeams.join(','), backendUrl]);

    // Initialize team stats if not present - only run when event teams change
    useEffect(() => {
        setLocalGameStats(prevStats => {
            const updatedStats = { ...prevStats };
            
            eventTeams.forEach(teamId => {
                if (!updatedStats.teamStats[teamId]) {
                    const team = getTeamInfo(teamId);
                    updatedStats.teamStats[teamId] = {
                        score: 0,
                        goals: [],
                        saves: 0,
                        shotsAgainst: 0,
                        penalties: 0,
                        faceOffWins: 0,
                        faceOffAttempts: 0
                    };
                }
            });
            
            return updatedStats;
        });
    }, [event.teamIds, event.teamId, event.homeTeam, event.awayTeam]); // Depend on all possible team data sources

    const handleScoreChange = (teamId, newScore) => {
        const updatedStats = {
            ...localGameStats,
            teamStats: {
                ...localGameStats.teamStats,
                [teamId]: {
                    ...localGameStats.teamStats[teamId],
                    score: parseInt(newScore) || 0
                }
            }
        };
        setLocalGameStats(updatedStats);
        
        if (onUpdateGameStats) {
            onUpdateGameStats(event.id, updatedStats);
        }
    };

    const handleGoalieStatChange = (teamId, stat, value) => {
        const updatedStats = {
            ...localGameStats,
            teamStats: {
                ...localGameStats.teamStats,
                [teamId]: {
                    ...localGameStats.teamStats[teamId],
                    [stat]: parseInt(value) || 0
                }
            }
        };
        setLocalGameStats(updatedStats);
        
        if (onUpdateGameStats) {
            onUpdateGameStats(event.id, updatedStats);
        }
    };

    // Quick shot tracking - updates both score and shot stats
    const handleShotResult = (teamId, result) => {
        const currentStats = localGameStats.teamStats[teamId] || {};
        const opponentId = eventTeams.find(t => t !== teamId);
        const opponentStats = opponentId ? (localGameStats.teamStats[opponentId] || {}) : {};
        
        let updates = { ...currentStats };
        let opponentUpdates = { ...opponentStats };
        
        switch (result) {
            case 'goal':
                updates.score = (currentStats.score || 0) + 1;
                updates.shotsOnGoal = (currentStats.shotsOnGoal || 0) + 1;
                if (opponentId) {
                    opponentUpdates.shotsAgainst = (opponentStats.shotsAgainst || 0) + 1;
                }
                break;
            case 'save':
                updates.shotsOnGoal = (currentStats.shotsOnGoal || 0) + 1;
                if (opponentId) {
                    opponentUpdates.saves = (opponentStats.saves || 0) + 1;
                    opponentUpdates.shotsAgainst = (opponentStats.shotsAgainst || 0) + 1;
                }
                break;
            case 'miss':
                updates.shotsMissed = (currentStats.shotsMissed || 0) + 1;
                break;
        }
        
        const updatedStats = {
            ...localGameStats,
            teamStats: {
                ...localGameStats.teamStats,
                [teamId]: updates,
                ...(opponentId ? { [opponentId]: opponentUpdates } : {})
            }
        };
        
        setLocalGameStats(updatedStats);
        if (onUpdateGameStats) {
            onUpdateGameStats(event.id, updatedStats);
        }
    };

    // Toggle shot clock
    const [useShotClock, setUseShotClock] = useState(true);
    const [showYouTube, setShowYouTube] = useState(false);
    const [activeYouTubeTeam, setActiveYouTubeTeam] = useState(null);

    const calculateSavePercentage = (saves, shotsAgainst) => {
        return shotsAgainst > 0 ? ((saves / shotsAgainst) * 100).toFixed(1) : '0.0';
    };

    const calculateShootingPercentage = (goals, shotsOnGoal) => {
        return shotsOnGoal > 0 ? ((goals / shotsOnGoal) * 100).toFixed(1) : '0.0';
    };

    return (
        <div className="space-y-4">
            {/* Game Controls Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h4 className="font-bold text-lg">🏆 Live Game Scoring</h4>
                        <div className="flex items-center gap-3 text-sm text-blue-100 mt-1">
                            <span>Period {localGameStats.gameDetails.currentPeriod}/{localGameStats.gameDetails.periods}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                localGameStats.gameDetails.status === 'completed' ? 'bg-green-500 text-white' :
                                localGameStats.gameDetails.status === 'in_progress' ? 'bg-yellow-400 text-yellow-900' :
                                'bg-gray-400 text-white'
                            }`}>
                                {localGameStats.gameDetails.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useShotClock}
                                onChange={(e) => setUseShotClock(e.target.checked)}
                                className="rounded border-white/30 bg-white/20 text-blue-500"
                            />
                            <span>Shot Clock</span>
                        </label>
                        <button
                            onClick={() => setShowYouTube(!showYouTube)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                showYouTube ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            📺 YouTube
                        </button>
                    </div>
                </div>
            </div>

            {/* YouTube Panel */}
            {showYouTube && (
                <div className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-white font-medium">📺 Live Stream</span>
                        <div className="flex gap-2 ml-auto">
                            <button
                                onClick={() => setActiveYouTubeTeam('league')}
                                className={`px-3 py-1 rounded text-sm ${activeYouTubeTeam === 'league' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                                MLBL Channel
                            </button>
                            {eventTeams.map(teamId => {
                                const team = getTeamInfo(teamId);
                                return team ? (
                                    <button
                                        key={teamId}
                                        onClick={() => setActiveYouTubeTeam(teamId)}
                                        className={`px-3 py-1 rounded text-sm ${activeYouTubeTeam === teamId ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    >
                                        {team.name}
                                    </button>
                                ) : null;
                            })}
                        </div>
                    </div>
                    {activeYouTubeTeam && (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <iframe
                                width="100%"
                                height="100%"
                                src={activeYouTubeTeam === 'league' 
                                    ? "https://www.youtube.com/embed/live_stream?channel=MLBL_CHANNEL_ID" 
                                    : `https://www.youtube.com/embed/live_stream?channel=${getTeamInfo(activeYouTubeTeam)?.youtubeChannelId || 'TEAM_CHANNEL'}`
                                }
                                title="Live Stream"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}
                    {!activeYouTubeTeam && (
                        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                            Select a channel to watch
                        </div>
                    )}
                </div>
            )}

            {eventTeams.length >= 2 ? (
                <div className="space-y-4">
                    {/* Main Scoreboard */}
                    <div className="grid grid-cols-3 gap-2 bg-gray-900 rounded-xl p-4 text-white">
                        {/* Team 1 */}
                        {(() => {
                            const team = getTeamInfo(eventTeams[0]);
                            const teamStats = localGameStats.teamStats[eventTeams[0]] || {};
                            return team ? (
                                <div className="text-center">
                                    <img 
                                        src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random`}
                                        alt={team.name}
                                        className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-white/20"
                                    />
                                    <div className="font-bold text-lg truncate">{team.name}</div>
                                    <div className="text-5xl font-black my-2">{teamStats.score || 0}</div>
                                </div>
                            ) : null;
                        })()}
                        
                        {/* VS / Period */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-gray-500 text-sm">PERIOD</div>
                            <div className="text-3xl font-bold">{localGameStats.gameDetails.currentPeriod}</div>
                            {useShotClock && (
                                <div className="mt-2 text-2xl font-mono bg-gray-800 px-3 py-1 rounded">
                                    {localGameStats.gameDetails.timeRemaining || '15:00'}
                                </div>
                            )}
                        </div>
                        
                        {/* Team 2 */}
                        {(() => {
                            const team = getTeamInfo(eventTeams[1]);
                            const teamStats = localGameStats.teamStats[eventTeams[1]] || {};
                            return team ? (
                                <div className="text-center">
                                    <img 
                                        src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random`}
                                        alt={team.name}
                                        className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-white/20"
                                    />
                                    <div className="font-bold text-lg truncate">{team.name}</div>
                                    <div className="text-5xl font-black my-2">{teamStats.score || 0}</div>
                                </div>
                            ) : null;
                        })()}
                    </div>

                    {/* Quick Shot Buttons - Only in Edit Mode */}
                    {editMode && userCanEdit && (
                        <div className="grid grid-cols-2 gap-4">
                            {eventTeams.map(teamId => {
                                const team = getTeamInfo(teamId);
                                if (!team) return null;
                                
                                return (
                                    <div key={teamId} className="bg-white border-2 border-gray-200 rounded-xl p-4">
                                        <div className="text-center font-bold text-gray-800 mb-3">{team.name} Shot</div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => handleShotResult(teamId, 'miss')}
                                                className="py-3 px-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-center transition-colors"
                                            >
                                                <div className="text-2xl">❌</div>
                                                <div className="text-xs font-medium text-gray-600 mt-1">MISS</div>
                                            </button>
                                            <button
                                                onClick={() => handleShotResult(teamId, 'save')}
                                                className="py-3 px-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-center transition-colors"
                                            >
                                                <div className="text-2xl">🧤</div>
                                                <div className="text-xs font-medium text-yellow-700 mt-1">SAVE</div>
                                            </button>
                                            <button
                                                onClick={() => handleShotResult(teamId, 'goal')}
                                                className="py-3 px-2 bg-green-100 hover:bg-green-200 rounded-lg text-center transition-colors"
                                            >
                                                <div className="text-2xl">🥅</div>
                                                <div className="text-xs font-medium text-green-700 mt-1">GOAL</div>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Detailed Team Stats - Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {eventTeams.map(teamId => {
                            const team = getTeamInfo(teamId);
                            const teamStats = localGameStats.teamStats[teamId] || {};
                            if (!team) return null;

                            return (
                                <div key={teamId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                    {/* Team Header */}
                                    <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-3">
                                        <img 
                                            src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random`}
                                            alt={team.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <span className="font-bold text-gray-800">{team.name}</span>
                                        <span className="ml-auto text-2xl font-bold text-blue-600">{teamStats.score || 0}</span>
                                    </div>
                                    
                                    <div className="p-4 space-y-4">
                                        {/* Shot Stats Grid */}
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            <div className="bg-green-50 rounded-lg p-2">
                                                <div className="text-xl font-bold text-green-600">{teamStats.score || 0}</div>
                                                <div className="text-xs text-green-700">Goals</div>
                                            </div>
                                            <div className="bg-yellow-50 rounded-lg p-2">
                                                <div className="text-xl font-bold text-yellow-600">{teamStats.saves || 0}</div>
                                                <div className="text-xs text-yellow-700">Saves</div>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-2">
                                                <div className="text-xl font-bold text-blue-600">{teamStats.shotsOnGoal || 0}</div>
                                                <div className="text-xs text-blue-700">SOG</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-xl font-bold text-gray-600">{teamStats.shotsMissed || 0}</div>
                                                <div className="text-xs text-gray-500">Missed</div>
                                            </div>
                                        </div>

                                        {/* Percentages */}
                                        <div className="flex justify-around text-sm">
                                            <div className="text-center">
                                                <div className="font-bold text-lg text-green-600">
                                                    {calculateShootingPercentage(teamStats.score || 0, teamStats.shotsOnGoal || 0)}%
                                                </div>
                                                <div className="text-gray-500 text-xs">Shooting %</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-lg text-blue-600">
                                                    {calculateSavePercentage(teamStats.saves || 0, teamStats.shotsAgainst || 0)}%
                                                </div>
                                                <div className="text-gray-500 text-xs">Save %</div>
                                            </div>
                                        </div>

                                        {/* Manual Edit Fields - Collapsed by Default */}
                                        {editMode && userCanEdit && (
                                            <details className="border-t pt-3">
                                                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                                                    ⚙️ Manual Adjustments
                                                </summary>
                                                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                                    <div>
                                                        <label className="block text-gray-600 mb-1">Score</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={teamStats.score || 0}
                                                            onChange={(e) => handleScoreChange(teamId, e.target.value)}
                                                            className="w-full p-2 border rounded text-center"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-600 mb-1">Saves</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={teamStats.saves || 0}
                                                            onChange={(e) => handleGoalieStatChange(teamId, 'saves', e.target.value)}
                                                            className="w-full p-2 border rounded text-center"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-600 mb-1">Shots Against</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={teamStats.shotsAgainst || 0}
                                                            onChange={(e) => handleGoalieStatChange(teamId, 'shotsAgainst', e.target.value)}
                                                            className="w-full p-2 border rounded text-center"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-600 mb-1">SOG</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={teamStats.shotsOnGoal || 0}
                                                            onChange={(e) => handleGoalieStatChange(teamId, 'shotsOnGoal', e.target.value)}
                                                            className="w-full p-2 border rounded text-center"
                                                        />
                                                    </div>
                                                </div>
                                            </details>
                                        )}

                                        {/* Team Roster */}
                                        <div className="border-t pt-3">
                                            <h5 className="font-medium text-gray-700 mb-2 flex items-center justify-between">
                                                <span>📋 Roster ({teamPlayers[teamId]?.length || 0})</span>
                                            </h5>
                                            {loadingPlayers ? (
                                                <div className="text-sm text-gray-500">Loading players...</div>
                                            ) : teamPlayers[teamId]?.length > 0 ? (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
                                                    {teamPlayers[teamId].map((player, idx) => (
                                                        <button
                                                            key={player.id || idx}
                                                            onClick={() => setSelectedPlayer(player)}
                                                            className="flex flex-col items-center p-1.5 bg-gray-50 hover:bg-blue-50 rounded text-center transition-colors"
                                                        >
                                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-white shadow-sm">
                                                                {player.photoUrl ? (
                                                                    <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: team?.primaryColor || '#3b82f6' }}>
                                                                        {player.name?.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-xs font-medium text-gray-700 mt-0.5 truncate w-full">
                                                                {player.jerseyNumber ? `#${player.jerseyNumber}` : player.name?.split(' ')[0]}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400 italic">No roster</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                                                        type="number"
                                                        min="0"
                                                        value={teamStats.shotsAgainst || 0}
                                                        onChange={(e) => handleGoalieStatChange(teamId, 'shotsAgainst', e.target.value)}
                                                        className="w-full p-1 border border-gray-300 rounded text-center"
                                                    />
                                                ) : (
                                                    <div className="font-medium">{teamStats.shotsAgainst || 0}</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Calculated Percentages */}
                                        <div className="bg-gray-50 rounded p-2">
                                            <div className="text-xs text-gray-600 mb-1">Save Percentage</div>
                                            <div className="font-bold text-lg text-green-600">
                                                {calculateSavePercentage(teamStats.saves || 0, teamStats.shotsAgainst || 0)}%
                                            </div>
                                        </div>
                                        
                                        {/* Team Roster */}
                                        <div className="border-t pt-3 mt-3">
                                            <h5 className="font-medium text-gray-700 mb-2">📋 Roster ({teamPlayers[teamId]?.length || 0})</h5>
                                            {loadingPlayers ? (
                                                <div className="text-sm text-gray-500">Loading players...</div>
                                            ) : teamPlayers[teamId]?.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                                    {teamPlayers[teamId].map((player, idx) => (
                                                        <button
                                                            key={player.id || idx}
                                                            onClick={() => setSelectedPlayer(player)}
                                                            className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-blue-50 rounded-lg text-left transition-colors border border-transparent hover:border-blue-200"
                                                        >
                                                            {/* Player Photo Thumbnail */}
                                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-white shadow-sm">
                                                                {player.photoUrl ? (
                                                                    <img 
                                                                        src={player.photoUrl} 
                                                                        alt={player.name}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                                    />
                                                                ) : null}
                                                                <div className={`w-full h-full flex items-center justify-center text-white font-bold text-sm ${player.photoUrl ? 'hidden' : ''}`} style={{ backgroundColor: team?.primaryColor || '#3b82f6' }}>
                                                                    {player.name?.charAt(0) || '?'}
                                                                </div>
                                                            </div>
                                                            {/* Player Info */}
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1">
                                                                    {player.jerseyNumber && (
                                                                        <span className="font-bold text-blue-600 text-xs">#{player.jerseyNumber}</span>
                                                                    )}
                                                                    <span className="font-medium text-gray-800 text-xs truncate">{player.name?.split(' ')[0]}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 truncate">{player.position || '—'}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400 italic">No players assigned to this team</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Player Card Popup Modal */}
                    {selectedPlayer && (
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                            onClick={() => setSelectedPlayer(null)}
                        >
                            <div 
                                className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Player Photo */}
                                <div className="relative h-64 bg-gradient-to-br from-blue-500 to-blue-600">
                                    {selectedPlayer.photoUrl ? (
                                        <img 
                                            src={selectedPlayer.photoUrl} 
                                            alt={selectedPlayer.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-8xl text-white/50 font-bold">
                                                {selectedPlayer.name?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                    )}
                                    {/* Jersey Number Badge */}
                                    {selectedPlayer.jerseyNumber && (
                                        <div className="absolute top-4 right-4 bg-white text-blue-600 font-bold text-2xl px-3 py-1 rounded-lg shadow-lg">
                                            #{selectedPlayer.jerseyNumber}
                                        </div>
                                    )}
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setSelectedPlayer(null)}
                                        className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center"
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                {/* Player Info */}
                                <div className="p-4">
                                    <h3 className="text-xl font-bold text-gray-800">{selectedPlayer.name}</h3>
                                    <div className="flex items-center gap-2 mt-1 text-gray-600">
                                        {selectedPlayer.position && (
                                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm font-medium">
                                                {selectedPlayer.position}
                                            </span>
                                        )}
                                        {selectedPlayer.teamName && (
                                            <span className="text-sm">{selectedPlayer.teamName}</span>
                                        )}
                                    </div>
                                    
                                    {/* Additional Info */}
                                    <div className="mt-4 space-y-2 text-sm">
                                        {selectedPlayer.jerseySize && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Jersey Size</span>
                                                <span className="font-medium">{selectedPlayer.jerseySize}</span>
                                            </div>
                                        )}
                                        {selectedPlayer.funFacts && (
                                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                                <div className="text-xs font-medium text-yellow-800 mb-1">✨ Fun Fact</div>
                                                <p className="text-yellow-700 text-sm">{selectedPlayer.funFacts}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Game Result Summary */}
                    {Object.keys(localGameStats.teamStats).length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <div className="text-lg font-semibold text-yellow-800">
                                {(() => {
                                    const scores = eventTeams.map(teamId => ({
                                        teamId,
                                        team: getTeamInfo(teamId),
                                        score: localGameStats.teamStats[teamId]?.score || 0
                                    }));
                                    
                                    const maxScore = Math.max(...scores.map(s => s.score));
                                    const winners = scores.filter(s => s.score === maxScore);
                                    
                                    if (winners.length === 1 && maxScore > 0) {
                                        return `🏆 Winner: ${winners[0].team?.name} (${maxScore})`;
                                    } else if (winners.length > 1 && maxScore > 0) {
                                        return `🤝 Tie Game: ${winners.map(w => w.team?.name).join(' & ')} (${maxScore})`;
                                    }
                                    return localGameStats.gameDetails.status === 'completed' ? 'Game Complete' : 'Game in Progress...';
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Future Live Scoring Foundation */}
                    {editMode && userCanEdit && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h5 className="font-medium text-blue-800 mb-2">🚀 Live Scoring (Coming Soon)</h5>
                            <div className="text-sm text-blue-600">
                                Future features: Real-time player stats, roster management, period-by-period scoring, 
                                penalty tracking, face-off statistics, and live game updates.
                            </div>
                            <div className="mt-2">
                                <button 
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                    disabled
                                >
                                    🎯 Enter Live Stats (Coming Soon)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <div>Enhanced scoring requires multiple teams</div>
                    <div className="text-sm mt-1">Individual team stats and practice tracking coming soon</div>
                </div>
            )}
        </div>
    );
};

// Season Statistics Summary Component
const SeasonStatsDisplay = ({ teams, players, gameStats = {} }) => {
    // Calculate season totals from all games
    const calculateSeasonStats = () => {
        const teamSeasonStats = {};
        const playerSeasonStats = {};
        
        // Process all game stats to build season totals
        Object.entries(gameStats).forEach(([gameId, stats]) => {
            if (stats.teamStats) {
                Object.entries(stats.teamStats).forEach(([teamId, teamGameStats]) => {
                    if (!teamSeasonStats[teamId]) {
                        const team = teams.find(t => t.id === teamId);
                        teamSeasonStats[teamId] = createTeamStats(teamId, team?.name || 'Unknown Team');
                    }
                    
                    const seasonStats = teamSeasonStats[teamId];
                    seasonStats.gamesPlayed += 1;
                    seasonStats.goalsFor += teamGameStats.score || 0;
                    
                    // Determine if this was a win/loss/tie
                    // This would need more sophisticated logic based on opponent scores
                });
            }
        });
        
        return { teamSeasonStats, playerSeasonStats };
    };

    const { teamSeasonStats } = calculateSeasonStats();

    return (
        <div className="space-y-6">
            {/* Team Season Stats */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Team Season Statistics</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.values(teamSeasonStats).map(teamStats => (
                        <div key={teamStats.teamId} className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-800 mb-3">{teamStats.teamName}</h4>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">{teamStats.wins}</div>
                                    <div className="text-gray-600">Wins</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">{teamStats.losses}</div>
                                    <div className="text-gray-600">Losses</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-yellow-600">{teamStats.ties}</div>
                                    <div className="text-gray-600">Ties</div>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                                <div className="flex justify-between text-sm">
                                    <span>Win %</span>
                                    <span className="font-medium">{teamStats.winPercentage}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Goals/Game</span>
                                    <span className="font-medium">{teamStats.averageGoalsFor}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Goals Against/Game</span>
                                    <span className="font-medium">{teamStats.averageGoalsAgainst}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Placeholder for Player Season Stats */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">👤 Player Season Statistics</h4>
                <div className="text-sm text-blue-600">
                    Individual player tracking will be available with roster management integration.
                    Coming features: Goals, Assists, Save %, GAA, Games Played, and more.
                </div>
            </div>
        </div>
    );
};

export { EnhancedScoresTab, SeasonStatsDisplay, createPlayerStats, createTeamStats };