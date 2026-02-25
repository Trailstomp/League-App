import React, { useState, useEffect, useRef } from 'react';

const LiveGamePage = ({ eventId, onNavigate }) => {
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('events');
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        if (eventId) {
            loadLiveGame();
            const interval = setInterval(() => loadLiveGame(true), 10000);
            return () => clearInterval(interval);
        }
    }, [eventId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const loadLiveGame = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Try live-stats first
            let response = await fetch(`${BACKEND_URL}/api/events/${eventId}/live-stats`);
            if (response.ok) {
                const data = await response.json();
                if (data.stats) { setGameData(data); setError(null); if (!silent) setLoading(false); return; }
            }
            // Fallback: game-stats
            response = await fetch(`${BACKEND_URL}/api/events/${eventId}/game-stats`);
            if (response.ok) {
                const data = await response.json();
                if (data.stats) {
                    setGameData({ event: data.stats, stats: data.stats, is_live: false });
                    setError(null); if (!silent) setLoading(false); return;
                }
            }
            // Fallback: unified-events
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

    const sendChat = () => {
        if (!chatInput.trim()) return;
        setChatMessages(prev => [...prev, { text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), user: 'You' }]);
        setChatInput('');
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error || !gameData) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-red-600 mb-4">{error || 'Game not found'}</p>
                <button onClick={() => onNavigate?.('home')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Back to Home</button>
            </div>
        );
    }

    const { event, stats = {}, is_live } = gameData;
    const homeTeam = stats.home_team || { team_name: 'Home', goals_for: 0, players: [], goalies: [] };
    const awayTeam = stats.away_team || { team_name: 'Away', goals_for: 0, players: [], goalies: [] };
    const homeColor = homeTeam.color || '#1e40af';
    const awayColor = awayTeam.color || '#dc2626';
    const streamUrl = event?.streaming_url || event?.stream_url;
    const gameEvents = stats.game_events || stats.events || [];
    const hasStream = !!streamUrl;

    const calcPoints = (p) => ((p.goals || 0) * 2) + (p.assists || 0);

    const PlayerStatsTable = ({ team, color }) => {
        const players = (team.players || []).filter(p => p.goals > 0 || p.assists > 0 || p.shots > 0);
        if (players.length === 0) return <p className="text-xs text-slate-400 py-3 text-center">No player stats recorded yet</p>;
        const sorted = [...players].sort((a, b) => calcPoints(b) - calcPoints(a));
        return (
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b" style={{ backgroundColor: `${color}10` }}>
                        <th className="text-left px-2 py-1.5 font-semibold text-slate-600">#</th>
                        <th className="text-left px-2 py-1.5 font-semibold text-slate-600">Player</th>
                        <th className="text-center px-1 py-1.5 font-semibold text-green-700">Goals</th>
                        <th className="text-center px-1 py-1.5 font-semibold text-blue-600">Assists</th>
                        <th className="text-center px-1 py-1.5 font-semibold text-indigo-600">Pts</th>
                        <th className="text-center px-1 py-1.5 font-semibold text-slate-600">Shots</th>
                        <th className="text-center px-1 py-1.5 font-semibold text-slate-600 hidden sm:table-cell">GB</th>
                        <th className="text-center px-1 py-1.5 font-semibold text-red-600 hidden sm:table-cell">PIM</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {sorted.map((p, i) => (
                        <tr key={p.player_id || i} className="hover:bg-slate-50">
                            <td className="px-2 py-1 text-slate-400">{p.jersey_number || '-'}</td>
                            <td className="px-2 py-1 font-medium text-slate-800">{p.player_name}</td>
                            <td className="text-center px-1 py-1 font-bold text-green-700">{p.goals || 0}</td>
                            <td className="text-center px-1 py-1 text-blue-600">{p.assists || 0}</td>
                            <td className="text-center px-1 py-1 font-bold text-indigo-600">{calcPoints(p)}</td>
                            <td className="text-center px-1 py-1 text-slate-600">{p.shots || 0}</td>
                            <td className="text-center px-1 py-1 text-slate-600 hidden sm:table-cell">{p.ground_balls || p.groundBalls || 0}</td>
                            <td className="text-center px-1 py-1 text-red-600 hidden sm:table-cell">{p.penalties || 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="max-w-6xl mx-auto" data-testid="live-game-page">
            {/* Scoreboard */}
            <div className="rounded-lg overflow-hidden shadow-lg mb-3" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                <div className="px-3 py-3 md:px-6 md:py-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {is_live && (
                                <span className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                                    <span className="w-2 h-2 bg-white rounded-full" /> LIVE
                                </span>
                            )}
                            {stats.status === 'final' && <span className="bg-gray-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">FINAL</span>}
                            <span className="text-white/60 text-xs">{event.date} {event.time}</span>
                        </div>
                        <span className="text-white/40 text-xs hidden md:inline">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 md:gap-6">
                        <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
                            <div className="text-right hidden md:block"><div className="text-white font-bold text-lg">{homeTeam.team_name}</div></div>
                            {homeTeam.logo ? (
                                <img src={getImageUrl(homeTeam.logo)} alt="" className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover border-3 shadow-lg" style={{ borderColor: homeColor }} />
                            ) : (
                                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-3" style={{ backgroundColor: homeColor, borderColor: `${homeColor}80` }}>{homeTeam.team_name?.[0]}</div>
                            )}
                            <div className="text-4xl md:text-6xl font-black text-white" style={{ textShadow: `0 0 20px ${homeColor}80` }}>{homeTeam.goals_for}</div>
                        </div>
                        <div className="text-white/30 text-lg font-light px-1">:</div>
                        <div className="flex items-center gap-2 md:gap-4 flex-1">
                            <div className="text-4xl md:text-6xl font-black text-white" style={{ textShadow: `0 0 20px ${awayColor}80` }}>{awayTeam.goals_for || 0}</div>
                            {awayTeam.logo ? (
                                <img src={getImageUrl(awayTeam.logo)} alt="" className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover border-3 shadow-lg" style={{ borderColor: awayColor }} />
                            ) : (
                                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-3" style={{ backgroundColor: awayColor, borderColor: `${awayColor}80` }}>{awayTeam.team_name?.[0] || '?'}</div>
                            )}
                            <div className="text-left hidden md:block"><div className="text-white font-bold text-lg">{awayTeam.team_name || 'TBD'}</div></div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-1 md:hidden text-xs">
                        <span className="text-white/80 font-medium">{homeTeam.team_name}</span>
                        <span className="text-white/80 font-medium">{awayTeam.team_name || 'TBD'}</span>
                    </div>
                </div>
            </div>

            {/* No live feed message (only when no stream) */}
            {!hasStream && is_live && (
                <div className="bg-slate-800 text-slate-400 text-xs text-center py-1.5 rounded-md mb-3" data-testid="no-stream-message">
                    No live video feed available for this game
                </div>
            )}

            {/* Main content: stream (if any) + tabs */}
            <div className={`grid gap-3 ${hasStream ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Stream — only when URL exists */}
                {hasStream && (
                    <div className="bg-black rounded-lg overflow-hidden shadow">
                        <div className="aspect-video">
                            <iframe src={streamUrl} title="Live Stream" className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
                        </div>
                    </div>
                )}

                {/* Tabs: Events / Stats / Chat */}
                <div className="bg-white rounded-lg shadow border overflow-hidden">
                    <div className="flex border-b bg-gray-50">
                        {['events', 'stats', 'chat'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                data-testid={`tab-${tab}`}
                                className={`flex-1 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                                    activeTab === tab
                                        ? 'bg-white text-blue-600 border-b-2 border-blue-500'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab === 'events' && 'Game Events'}
                                {tab === 'stats' && 'Player Stats'}
                                {tab === 'chat' && 'Chat'}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-y-auto" style={{ maxHeight: hasStream ? '400px' : '500px' }}>
                        {/* Game Events Tab */}
                        {activeTab === 'events' && (
                            <div className="divide-y divide-slate-100">
                                {gameEvents.length > 0 ? (
                                    [...gameEvents].reverse().map((evt, i) => (
                                        <div key={i} className="px-3 py-2 flex items-start gap-2 text-sm hover:bg-gray-50">
                                            <span className="text-gray-400 text-xs mt-0.5 whitespace-nowrap w-12 text-right flex-shrink-0">
                                                {evt.time || evt.timestamp || ''}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                                                evt.type === 'goal' ? 'bg-green-100 text-green-700' :
                                                evt.type === 'penalty' || evt.type === 'penalty_start' ? 'bg-red-100 text-red-700' :
                                                evt.type === 'save' || evt.type === 'shot_saved' ? 'bg-blue-100 text-blue-700' :
                                                evt.type === 'period_start' || evt.type === 'period_end' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {(evt.type || 'event').replace('_', ' ')}
                                            </span>
                                            <span className="text-gray-700 text-sm">{evt.text || evt.description || evt.message || ''}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-12 text-center text-gray-400">
                                        <div className="text-2xl mb-2">&#9200;</div>
                                        <p className="text-sm">No events recorded yet</p>
                                        {is_live && <p className="text-xs mt-1 text-gray-300">Events will appear here as the game progresses</p>}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Player Stats Tab */}
                        {activeTab === 'stats' && (
                            <div className="p-3 space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider mb-1.5 px-1" style={{ color: homeColor }}>{homeTeam.team_name}</h4>
                                    <PlayerStatsTable team={homeTeam} color={homeColor} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider mb-1.5 px-1" style={{ color: awayColor }}>{awayTeam.team_name || 'Away'}</h4>
                                    <PlayerStatsTable team={awayTeam} color={awayColor} />
                                </div>
                                {homeTeam.goalies?.length > 0 && (
                                    <div className="border-t pt-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider mb-1.5 px-1 text-slate-500">Goalies</h4>
                                        {[...homeTeam.goalies || [], ...awayTeam.goalies || []].map((g, i) => (
                                            <div key={i} className="flex justify-between text-xs py-1 px-2 text-gray-600 border-b border-slate-50">
                                                <span className="font-medium">{g.player_name}</span>
                                                <span>{g.saves || 0} SV / {g.shots_on_goal || 0} SOG ({g.shots_on_goal > 0 ? ((g.saves / g.shots_on_goal) * 100).toFixed(0) : 0}%)</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Chat Tab */}
                        {activeTab === 'chat' && (
                            <div className="flex flex-col" style={{ height: hasStream ? '360px' : '460px' }}>
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    {chatMessages.length === 0 ? (
                                        <div className="text-center text-gray-400 text-sm py-8">
                                            <p>No messages yet</p>
                                            <p className="text-xs mt-1">Be the first to chat!</p>
                                        </div>
                                    ) : (
                                        chatMessages.map((msg, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">{msg.user?.[0] || '?'}</div>
                                                <div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-xs font-semibold text-slate-700">{msg.user}</span>
                                                        <span className="text-[10px] text-slate-400">{msg.time}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600">{msg.text}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="border-t p-2 flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                                        placeholder="Type a message..."
                                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        data-testid="chat-input"
                                    />
                                    <button
                                        onClick={sendChat}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                        data-testid="chat-send-btn"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Auto-refresh indicator */}
            {is_live && (
                <div className="mt-3 text-center text-gray-400 text-xs animate-pulse">
                    Auto-refreshing every 10s
                </div>
            )}
        </div>
    );
};

export default LiveGamePage;
