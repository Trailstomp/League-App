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

    // Handle different event team data structures
    const eventTeams = event.teamIds || 
                      (event.teamId ? [event.teamId] : 
                      (event.homeTeam && event.awayTeam ? [event.homeTeam, event.awayTeam] : []));
    const getTeamInfo = (teamId) => teams.find(team => team.id === teamId);

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

    const calculateSavePercentage = (saves, shotsAgainst) => {
        return shotsAgainst > 0 ? ((saves / shotsAgainst) * 100).toFixed(1) : '0.0';
    };

    return (
        <div className="space-y-6">
            {/* Game Status Header */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-blue-800">🏆 Game Statistics</h4>
                    <div className="flex items-center space-x-4 text-sm text-blue-600">
                        <span>Period: {localGameStats.gameDetails.currentPeriod}/{localGameStats.gameDetails.periods}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                            localGameStats.gameDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                            localGameStats.gameDetails.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                            {localGameStats.gameDetails.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {eventTeams.length >= 2 ? (
                <div className="space-y-6">
                    {/* Team Scores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {eventTeams.map(teamId => {
                            const team = getTeamInfo(teamId);
                            const teamStats = localGameStats.teamStats[teamId] || {};
                            if (!team) return null;

                            return (
                                <div key={teamId} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <img 
                                                src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random`}
                                                alt={team.name}
                                                className="w-10 h-10 rounded-full"
                                            />
                                            <div>
                                                <div className="font-medium">{team.name}</div>
                                                <div className="text-sm text-gray-500">Score</div>
                                            </div>
                                        </div>
                                        
                                        {editMode && userCanEdit ? (
                                            <input
                                                type="number"
                                                min="0"
                                                value={teamStats.score || 0}
                                                onChange={(e) => handleScoreChange(teamId, e.target.value)}
                                                className="w-16 p-2 border border-gray-300 rounded text-center text-2xl font-bold focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <div className="text-3xl font-bold text-blue-600">
                                                {teamStats.score || 0}
                                            </div>
                                        )}
                                    </div>

                                    {/* Enhanced Team Stats */}
                                    <div className="space-y-3 border-t pt-3">
                                        <h5 className="font-medium text-gray-700">Team Statistics</h5>
                                        
                                        {/* Goalie Stats */}
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <label className="block text-gray-600 mb-1">Saves</label>
                                                {editMode && userCanEdit ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={teamStats.saves || 0}
                                                        onChange={(e) => handleGoalieStatChange(teamId, 'saves', e.target.value)}
                                                        className="w-full p-1 border border-gray-300 rounded text-center"
                                                    />
                                                ) : (
                                                    <div className="font-medium">{teamStats.saves || 0}</div>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <label className="block text-gray-600 mb-1">Shots Against</label>
                                                {editMode && userCanEdit ? (
                                                    <input
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
                                    </div>
                                </div>
                            );
                        })}
                    </div>

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