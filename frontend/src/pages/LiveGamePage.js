import React, { useState, useEffect } from 'react';

const LiveGamePage = ({ eventId, onNavigate }) => {
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        if (eventId) {
            loadLiveGame();
            // Refresh every 10 seconds if live
            const interval = setInterval(() => {
                loadLiveGame(true);
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [eventId]);

    const loadLiveGame = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/events/${eventId}/live-stats`);
            const data = await response.json();
            setGameData(data);
            setError(null);
        } catch (err) {
            console.error('Error loading live game:', err);
            setError('Unable to load game data');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading game...</p>
                </div>
            </div>
        );
    }

    if (error || !gameData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Game not found'}</p>
                    <button
                        onClick={() => onNavigate && onNavigate('home')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const { event, stats, is_live } = gameData;
    const homeTeam = stats.home_team;
    const awayTeam = stats.away_team;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-gray-800">{event.title}</h1>
                        {is_live && (
                            <span className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full animate-pulse">
                                <span className="w-3 h-3 bg-white rounded-full"></span>
                                <span className="font-semibold">LIVE</span>
                            </span>
                        )}
                    </div>
                    <div className="text-gray-600">
                        {event.date} • {event.time} • {event.location}
                    </div>
                </div>

                {/* Score Board */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 mb-6 text-white">
                    <div className="grid grid-cols-3 gap-8 items-center">
                        {/* Home Team */}
                        <div className="text-center">
                            <div className="text-sm opacity-75 mb-2">HOME</div>
                            <div className="text-6xl font-bold mb-2">{homeTeam.goals_for}</div>
                            <div className="text-2xl font-semibold">{homeTeam.team_name}</div>
                        </div>

                        {/* VS */}
                        <div className="text-center">
                            <div className="text-3xl font-light opacity-75">vs</div>
                            <div className="text-sm mt-2 opacity-75">
                                {stats.status === 'final' ? 'FINAL' : is_live ? 'IN PROGRESS' : 'SCHEDULED'}
                            </div>
                        </div>

                        {/* Away Team */}
                        <div className="text-center">
                            <div className="text-sm opacity-75 mb-2">AWAY</div>
                            <div className="text-6xl font-bold mb-2">{awayTeam?.goals_for || 0}</div>
                            <div className="text-2xl font-semibold">{awayTeam?.team_name || 'TBD'}</div>
                        </div>
                    </div>
                </div>

                {/* Stats Tabs */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Home Team Stats */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-blue-700 mb-4">{homeTeam.team_name}</h2>
                        
                        {/* Top Scorers */}
                        {homeTeam.players && homeTeam.players.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Top Scorers</h3>
                                <div className="space-y-2">
                                    {homeTeam.players
                                        .filter(p => p.goals > 0)
                                        .sort((a, b) => b.goals - a.goals)
                                        .slice(0, 5)
                                        .map(player => (
                                            <div key={player.player_id} className="flex justify-between items-center py-2 border-b">
                                                <span className="font-medium">{player.player_name}</span>
                                                <div className="flex items-center space-x-4 text-sm">
                                                    <span className="text-gray-600">{player.shots} shots</span>
                                                    <span className="font-bold text-blue-600">{player.goals} goals</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Goalies */}
                        {homeTeam.goalies && homeTeam.goalies.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Goalies</h3>
                                <div className="space-y-2">
                                    {homeTeam.goalies.map(goalie => (
                                        <div key={goalie.player_id} className="py-2 border-b">
                                            <div className="font-medium mb-1">{goalie.player_name}</div>
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>{goalie.saves} saves</span>
                                                <span>{goalie.shots_on_goal} SOG</span>
                                                <span className="font-semibold text-blue-600">
                                                    {goalie.shots_on_goal > 0 
                                                        ? ((goalie.saves / goalie.shots_on_goal) * 100).toFixed(1) 
                                                        : '0.0'}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Away Team Stats */}
                    {awayTeam && (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold text-red-700 mb-4">{awayTeam.team_name}</h2>
                            
                            {/* Top Scorers */}
                            {awayTeam.players && awayTeam.players.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Top Scorers</h3>
                                    <div className="space-y-2">
                                        {awayTeam.players
                                            .filter(p => p.goals > 0)
                                            .sort((a, b) => b.goals - a.goals)
                                            .slice(0, 5)
                                            .map(player => (
                                                <div key={player.player_id} className="flex justify-between items-center py-2 border-b">
                                                    <span className="font-medium">{player.player_name}</span>
                                                    <div className="flex items-center space-x-4 text-sm">
                                                        <span className="text-gray-600">{player.shots} shots</span>
                                                        <span className="font-bold text-red-600">{player.goals} goals</span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Goalies */}
                            {awayTeam.goalies && awayTeam.goalies.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Goalies</h3>
                                    <div className="space-y-2">
                                        {awayTeam.goalies.map(goalie => (
                                            <div key={goalie.player_id} className="py-2 border-b">
                                                <div className="font-medium mb-1">{goalie.player_name}</div>
                                                <div className="flex justify-between text-sm text-gray-600">
                                                    <span>{goalie.saves} saves</span>
                                                    <span>{goalie.shots_on_goal} SOG</span>
                                                    <span className="font-semibold text-red-600">
                                                        {goalie.shots_on_goal > 0 
                                                            ? ((goalie.saves / goalie.shots_on_goal) * 100).toFixed(1) 
                                                            : '0.0'}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Auto-refresh indicator */}
                {is_live && (
                    <div className="mt-6 text-center text-gray-500 text-sm">
                        <span className="animate-pulse">Refreshing every 10 seconds...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveGamePage;