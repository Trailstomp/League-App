import React, { useState, useEffect } from 'react';

const LiveGamePage = ({ eventId, onNavigate }) => {
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bottomTab, setBottomTab] = useState('events'); // 'events' or 'stats'
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        if (eventId) {
            loadLiveGame();
            const interval = setInterval(() => {
                loadLiveGame(true);
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [eventId]);

    const loadLiveGame = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Try live-stats endpoint first
            let response = await fetch(`${BACKEND_URL}/api/events/${eventId}/live-stats`);
            if (response.ok) {
                const data = await response.json();
                if (data.stats) { setGameData(data); setError(null); if (!silent) setLoading(false); return; }
            }
            
            // Fallback: load from game-stats
            response = await fetch(`${BACKEND_URL}/api/events/${eventId}/game-stats`);
            if (response.ok) {
                const data = await response.json();
                if (data.stats) {
                    setGameData({ event: data.stats, stats: data.stats, is_live: false });
                    setError(null); if (!silent) setLoading(false); return;
                }
            }

            // Fallback: load from unified-events
            response = await fetch(`${BACKEND_URL}/api/unified-events/${eventId}`);
            if (response.ok) {
                const event = await response.json();
                const scores = event.scores || {};
                setGameData({
                    event,
                    stats: {
                        home_team: scores.home_team || { team_name: 'Home', goals_for: 0, players: [], goalies: [] },
                        away_team: scores.away_team || { team_name: 'Away', goals_for: 0, players: [], goalies: [] },
                        game_events: scores.game_events || [],
                        status: event.status === 'in_progress' ? 'in_progress' : (event.status === 'completed' ? 'final' : event.status)
                    },
                    is_live: event.status === 'in_progress'
                });
                setError(null);
            } else {
                setError('Game not found');
            }
        } catch (err) {
            console.error('Error loading live game:', err);
            if (!silent) setError('Unable to load game data');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            </div>
        );
    }

    if (error || !gameData) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-red-600 mb-4">{error || 'Game not found'}</p>
                <button onClick={() => onNavigate?.('home')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Back to Home
                </button>
            </div>
        );
    }

    const { event, stats, is_live } = gameData;
    const homeTeam = stats.home_team;
    const awayTeam = stats.away_team;
    const homeColor = homeTeam.color || '#1e40af';
    const awayColor = awayTeam?.color || '#dc2626';
    const streamUrl = event?.streaming_url || event?.stream_url;
    const gameEvents = stats.game_events || stats.events || [];

    // Team stats rendering helper
    const TeamStats = ({ team, color, label }) => {
        if (!team) return null;
        return (
            <div className="bg-white rounded-lg border p-3">
                <h3 className="text-sm font-bold mb-2" style={{ color }}>{team.team_name} {label}</h3>
                {team.players?.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5).map(p => (
                    <div key={p.player_id} className="flex justify-between items-center py-1 border-b border-gray-100 text-sm">
                        <span className="font-medium text-gray-800">{p.player_name}</span>
                        <div className="flex gap-3 text-xs">
                            <span className="text-gray-500">{p.shots}S</span>
                            <span className="font-bold" style={{ color }}>{p.goals}G</span>
                        </div>
                    </div>
                ))}
                {team.goalies?.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Goalies</div>
                        {team.goalies.map(g => (
                            <div key={g.player_id} className="flex justify-between text-xs py-1 text-gray-600">
                                <span className="font-medium">{g.player_name}</span>
                                <span>{g.saves}SV / {g.shots_on_goal}SOG ({g.shots_on_goal > 0 ? ((g.saves / g.shots_on_goal) * 100).toFixed(0) : 0}%)</span>
                            </div>
                        ))}
                    </div>
                )}
                {(!team.players || team.players.filter(p => p.goals > 0).length === 0) && (!team.goalies || team.goalies.length === 0) && (
                    <p className="text-xs text-gray-400 py-2">No stats recorded yet</p>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto" data-testid="live-game-page">
            {/* Compact Scoreboard */}
            <div 
                className="rounded-lg overflow-hidden shadow-lg mb-3"
                style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
            >
                <div className="px-3 py-3 md:px-6 md:py-4">
                    {/* Live badge + event title */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {is_live && (
                                <span className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                                    <span className="w-2 h-2 bg-white rounded-full" /> LIVE
                                </span>
                            )}
                            {stats.status === 'final' && (
                                <span className="bg-gray-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">FINAL</span>
                            )}
                            <span className="text-white/60 text-xs">{event.date} {event.time}</span>
                        </div>
                        <span className="text-white/40 text-xs hidden md:inline">{event.location}</span>
                    </div>

                    {/* Score Row: Logo - Score VS Score - Logo */}
                    <div className="flex items-center justify-center gap-2 md:gap-6">
                        {/* Home */}
                        <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
                            <div className="text-right hidden md:block">
                                <div className="text-white font-bold text-lg">{homeTeam.team_name}</div>
                            </div>
                            {homeTeam.logo ? (
                                <img src={getImageUrl(homeTeam.logo)} alt={homeTeam.team_name} className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover border-3 shadow-lg" style={{ borderColor: homeColor }} />
                            ) : (
                                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-3" style={{ backgroundColor: homeColor, borderColor: `${homeColor}80` }}>
                                    {homeTeam.team_name?.[0]}
                                </div>
                            )}
                            <div className="text-4xl md:text-6xl font-black text-white" style={{ textShadow: `0 0 20px ${homeColor}80` }}>
                                {homeTeam.goals_for}
                            </div>
                        </div>

                        {/* VS divider */}
                        <div className="text-white/30 text-lg font-light px-1">:</div>

                        {/* Away */}
                        <div className="flex items-center gap-2 md:gap-4 flex-1">
                            <div className="text-4xl md:text-6xl font-black text-white" style={{ textShadow: `0 0 20px ${awayColor}80` }}>
                                {awayTeam?.goals_for || 0}
                            </div>
                            {awayTeam?.logo ? (
                                <img src={getImageUrl(awayTeam.logo)} alt={awayTeam?.team_name} className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover border-3 shadow-lg" style={{ borderColor: awayColor }} />
                            ) : (
                                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-3" style={{ backgroundColor: awayColor, borderColor: `${awayColor}80` }}>
                                    {awayTeam?.team_name?.[0] || '?'}
                                </div>
                            )}
                            <div className="text-left hidden md:block">
                                <div className="text-white font-bold text-lg">{awayTeam?.team_name || 'TBD'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile team names */}
                    <div className="flex justify-between mt-1 md:hidden text-xs">
                        <span className="text-white/80 font-medium">{homeTeam.team_name}</span>
                        <span className="text-white/80 font-medium">{awayTeam?.team_name || 'TBD'}</span>
                    </div>
                </div>
            </div>

            {/* Stream + Events/Stats side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Left: Stream (if available) */}
                {streamUrl ? (
                    <div className="bg-black rounded-lg overflow-hidden shadow">
                        <div className="aspect-video">
                            <iframe
                                src={streamUrl}
                                title="Live Stream"
                                className="w-full h-full"
                                allow="autoplay; fullscreen"
                                allowFullScreen
                            />
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-900 rounded-lg flex items-center justify-center shadow" style={{ minHeight: '200px' }}>
                        <div className="text-center text-gray-500">
                            <div className="text-3xl mb-2">📺</div>
                            <p className="text-sm">No stream available</p>
                        </div>
                    </div>
                )}

                {/* Right: Events/Stats toggle */}
                <div className="bg-white rounded-lg shadow border overflow-hidden">
                    {/* Toggle tabs */}
                    <div className="flex border-b bg-gray-50">
                        <button
                            onClick={() => setBottomTab('events')}
                            data-testid="events-toggle"
                            className={`flex-1 py-2 text-sm font-medium transition-colors ${
                                bottomTab === 'events' ? 'bg-white text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Game Events
                        </button>
                        <button
                            onClick={() => setBottomTab('stats')}
                            data-testid="stats-toggle"
                            className={`flex-1 py-2 text-sm font-medium transition-colors ${
                                bottomTab === 'stats' ? 'bg-white text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Player Stats
                        </button>
                    </div>

                    {/* Content area */}
                    <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                        {bottomTab === 'events' ? (
                            <div className="divide-y">
                                {gameEvents.length > 0 ? (
                                    gameEvents.slice().reverse().map((evt, i) => (
                                        <div key={i} className="px-3 py-2 flex items-start gap-2 text-sm hover:bg-gray-50">
                                            <span className="text-gray-400 text-xs mt-0.5 whitespace-nowrap">{evt.time || evt.timestamp || ''}</span>
                                            <span className="text-gray-700">{evt.description || evt.message || evt.text || JSON.stringify(evt)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-gray-400 text-sm">No events recorded yet</div>
                                )}
                            </div>
                        ) : (
                            <div className="p-3 space-y-3">
                                <TeamStats team={homeTeam} color={homeColor} label="" />
                                {awayTeam && <TeamStats team={awayTeam} color={awayColor} label="" />}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Auto-refresh */}
            {is_live && (
                <div className="mt-3 text-center text-gray-400 text-xs animate-pulse">
                    Auto-refreshing every 10s
                </div>
            )}
        </div>
    );
};

export default LiveGamePage;
