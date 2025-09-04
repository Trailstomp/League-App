import { useState, useEffect } from 'react';

/**
 * useStatistics Hook - Manages enhanced scoring and tournament statistics
 * Foundation for comprehensive lacrosse statistics tracking
 */

const useStatistics = () => {
    const [gameStatistics, setGameStatistics] = useState({}); // gameId -> stats
    const [tournamentData, setTournamentData] = useState({}); // eventId -> tournament
    const [seasonStats, setSeasonStats] = useState({
        teams: {},
        players: {}
    });

    // Load statistics from localStorage on mount
    useEffect(() => {
        try {
            const savedGameStats = localStorage.getItem('mlbl_game_statistics');
            const savedTournaments = localStorage.getItem('mlbl_tournament_data');
            const savedSeasonStats = localStorage.getItem('mlbl_season_statistics');
            
            if (savedGameStats) {
                setGameStatistics(JSON.parse(savedGameStats));
            }
            
            if (savedTournaments) {
                setTournamentData(JSON.parse(savedTournaments));
            }
            
            if (savedSeasonStats) {
                setSeasonStats(JSON.parse(savedSeasonStats));
            }
        } catch (error) {
            console.warn('Error loading statistics from localStorage:', error);
        }
    }, []);

    // Save statistics to localStorage when they change
    useEffect(() => {
        try {
            localStorage.setItem('mlbl_game_statistics', JSON.stringify(gameStatistics));
        } catch (error) {
            console.warn('Error saving game statistics:', error);
        }
    }, [gameStatistics]);

    useEffect(() => {
        try {
            localStorage.setItem('mlbl_tournament_data', JSON.stringify(tournamentData));
        } catch (error) {
            console.warn('Error saving tournament data:', error);
        }
    }, [tournamentData]);

    useEffect(() => {
        try {
            localStorage.setItem('mlbl_season_statistics', JSON.stringify(seasonStats));
        } catch (error) {
            console.warn('Error saving season statistics:', error);
        }
    }, [seasonStats]);

    // Update game statistics
    const updateGameStats = (gameId, newStats) => {
        setGameStatistics(prev => ({
            ...prev,
            [gameId]: newStats
        }));
        
        // Update season statistics based on game results
        updateSeasonStats(gameId, newStats);
    };

    // Update tournament data
    const updateTournament = (eventId, tournamentData) => {
        console.log('🏆 Updating tournament data for event:', eventId, tournamentData);
        
        // Update local state
        setTournamentData(prev => ({
            ...prev,
            [eventId]: tournamentData
        }));
        
        // Save to backend API
        const saveToBackend = async () => {
            try {
                const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
                const response = await fetch(`${BACKEND_URL}/api/league-data`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'tournamentData',
                        data: {
                            [eventId]: tournamentData
                        }
                    })
                });
                
                if (response.ok) {
                    console.log('✅ Tournament data saved to backend successfully');
                } else {
                    console.error('❌ Failed to save tournament data to backend:', response.statusText);
                }
            } catch (error) {
                console.error('❌ Error saving tournament data to backend:', error);
            }
        };
        
        saveToBackend();
    };

    // Update season statistics from game results
    const updateSeasonStats = (gameId, gameStats) => {
        if (!gameStats.teamStats) return;

        const updatedSeasonStats = { ...seasonStats };
        
        Object.entries(gameStats.teamStats).forEach(([teamId, teamGameStats]) => {
            if (!updatedSeasonStats.teams[teamId]) {
                updatedSeasonStats.teams[teamId] = {
                    teamId,
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    ties: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    saves: 0,
                    shotsAgainst: 0
                };
            }

            const teamSeasonStats = updatedSeasonStats.teams[teamId];
            
            // Add game statistics to season totals
            teamSeasonStats.goalsFor += teamGameStats.score || 0;
            teamSeasonStats.saves += teamGameStats.saves || 0;
            teamSeasonStats.shotsAgainst += teamGameStats.shotsAgainst || 0;
            
            // Determine game result (need opponent's score)
            const opponentTeamIds = Object.keys(gameStats.teamStats).filter(id => id !== teamId);
            if (opponentTeamIds.length > 0) {
                const opponentScore = gameStats.teamStats[opponentTeamIds[0]]?.score || 0;
                const teamScore = teamGameStats.score || 0;
                
                teamSeasonStats.goalsAgainst += opponentScore;
                
                if (teamScore > opponentScore) {
                    teamSeasonStats.wins += 1;
                } else if (teamScore < opponentScore) {
                    teamSeasonStats.losses += 1;
                } else {
                    teamSeasonStats.ties += 1;
                }
                
                teamSeasonStats.gamesPlayed += 1;
            }
        });

        setSeasonStats(updatedSeasonStats);
    };

    // Get team season statistics
    const getTeamSeasonStats = (teamId) => {
        const stats = seasonStats.teams[teamId];
        if (!stats) {
            return {
                teamId,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                ties: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                saves: 0,
                shotsAgainst: 0,
                winPercentage: 0,
                goalDifferential: 0,
                averageGoalsFor: 0,
                averageGoalsAgainst: 0,
                savePercentage: 0
            };
        }

        return {
            ...stats,
            winPercentage: stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100) : 0,
            goalDifferential: stats.goalsFor - stats.goalsAgainst,
            averageGoalsFor: stats.gamesPlayed > 0 ? (stats.goalsFor / stats.gamesPlayed) : 0,
            averageGoalsAgainst: stats.gamesPlayed > 0 ? (stats.goalsAgainst / stats.gamesPlayed) : 0,
            savePercentage: stats.shotsAgainst > 0 ? ((stats.saves / stats.shotsAgainst) * 100) : 0
        };
    };

    // Get all team rankings
    const getTeamRankings = () => {
        return Object.keys(seasonStats.teams)
            .map(teamId => getTeamSeasonStats(teamId))
            .sort((a, b) => {
                // Sort by win percentage, then by goal differential
                if (a.winPercentage !== b.winPercentage) {
                    return b.winPercentage - a.winPercentage;
                }
                return b.goalDifferential - a.goalDifferential;
            });
    };

    // Reset all statistics
    const resetAllStats = () => {
        setGameStatistics({});
        setTournamentData({});
        setSeasonStats({ teams: {}, players: {} });
        
        localStorage.removeItem('mlbl_game_statistics');
        localStorage.removeItem('mlbl_tournament_data');
        localStorage.removeItem('mlbl_season_statistics');
    };

    // Export/Import statistics (for backup/restore)
    const exportStatistics = () => {
        return {
            gameStatistics,
            tournamentData,
            seasonStats,
            exportDate: new Date().toISOString()
        };
    };

    const importStatistics = (data) => {
        if (data.gameStatistics) setGameStatistics(data.gameStatistics);
        if (data.tournamentData) setTournamentData(data.tournamentData);
        if (data.seasonStats) setSeasonStats(data.seasonStats);
    };

    return {
        // Data
        gameStatistics,
        tournamentData,
        seasonStats,
        
        // Actions
        updateGameStats,
        updateTournament,
        getTeamSeasonStats,
        getTeamRankings,
        
        // Utilities
        resetAllStats,
        exportStatistics,
        importStatistics
    };
};

export default useStatistics;