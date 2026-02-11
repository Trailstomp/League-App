import React, { useState, useEffect, useRef } from 'react';
import AnalogScoreboard from '../components/AnalogScoreboard';

const LiveSpectatorView = ({ event, teams, onClose, tournamentMatch }) => {
    console.log('🎬 LiveSpectatorView RENDERING with event:', event?.id, event?.title);
    
    const [liveData, setLiveData] = useState({
        home_team: { name: '', logo: '', score: 0, color: '#3b82f6', banner: null, font: 'Inter, sans-serif', players: [] },
        away_team: { name: '', logo: '', score: 0, color: '#ef4444', banner: null, font: 'Inter, sans-serif', players: [] },
        time_remaining: '15:00',
        current_period: 1,
        home_players: [],
        away_players: [],
        home_stats: { goals: 0, shots: 0, assists: 0, penalties: 0 },
        away_stats: { goals: 0, shots: 0, assists: 0, penalties: 0 },
        penalties: { home: [], away: [] },
        gameEvents: []
    });

    const [activeTab, setActiveTab] = useState('stream'); // stream, events, stats
    const [showChat, setShowChat] = useState(false);
    const [chat, setChat] = useState({ messages: [], newMessage: '' });
    const chatEndRef = useRef(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    // Initialize game data with team colors and fonts
    useEffect(() => {
        if (event && teams) {
            const homeTeam = teams.find(t => t.id === event.teams?.[0]);
            const awayTeam = teams.find(t => t.id === event.teams?.[1]);

            setLiveData(prev => ({
                ...prev,
                home_team: {
                    ...prev.home_team,
                    name: homeTeam?.name || 'Home Team',
                    logo: homeTeam?.style?.logoUrl || null,
                    color: homeTeam?.style?.primaryColor || '#3b82f6',
                    banner: homeTeam?.style?.bannerUrl || null,
                    font: homeTeam?.style?.font || 'Inter, sans-serif',
                },
                away_team: {
                    ...prev.away_team,
                    name: awayTeam?.name || 'Away Team',
                    logo: awayTeam?.style?.logoUrl || null,
                    color: awayTeam?.style?.accentColor || awayTeam?.style?.primaryColor || '#ef4444',
                    banner: awayTeam?.style?.bannerUrl || null,
                    font: awayTeam?.style?.font || 'Inter, sans-serif',
                }
            }));
            loadChatMessages();
        }
    }, [event, teams]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat.messages]);

    // Poll for live updates
    useEffect(() => {
        const pollInterval = setInterval(() => fetchLiveUpdates(), 3000);
        fetchLiveUpdates();
        return () => clearInterval(pollInterval);
    }, [event.id]);

    const loadChatMessages = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/events/${event.id}/chat`);
            if (response.ok) {
                const data = await response.json();
                setChat(prev => ({ ...prev, messages: data.messages || [] }));
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        }
    };

    const fetchLiveUpdates = async () => {
        try {
            const eventResponse = await fetch(`${backendUrl}/api/unified-events/${event.id}`);
            if (eventResponse.ok) {
                const eventData = await eventResponse.json();
                
                if (eventData.scores && eventData.scores.home_team && eventData.scores.away_team) {
                    const homeStats = calculateTeamStats(eventData.scores.home_team.players || []);
                    const awayStats = calculateTeamStats(eventData.scores.away_team.players || []);
                    
                    setLiveData(prev => ({
                        ...prev,
                        home_team: { 
                            ...prev.home_team, 
                            score: eventData.scores.home_team.score || 0,
                            players: eventData.scores.home_team.players || []
                        },
                        away_team: { 
                            ...prev.away_team, 
                            score: eventData.scores.away_team.score || 0,
                            players: eventData.scores.away_team.players || []
                        },
                        home_players: (eventData.scores.home_team.players || [])
                            .filter(p => p.stats && (p.stats.goals > 0 || p.stats.assists > 0))
                            .sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0))
                            .slice(0, 5),
                        away_players: (eventData.scores.away_team.players || [])
                            .filter(p => p.stats && (p.stats.goals > 0 || p.stats.assists > 0))
                            .sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0))
                            .slice(0, 5),
                        home_stats: homeStats,
                        away_stats: awayStats,
                        time_remaining: eventData.scores.time_remaining || '15:00',
                        current_period: eventData.scores.current_period || 1,
                        penalties: eventData.scores.penalties || { home: [], away: [] },
                        gameEvents: eventData.scores.gameEvents || []
                    }));
                    return;
                }
            }

            // Fallback to game_stats
            const statsResponse = await fetch(`${backendUrl}/api/events/${event.id}/game-stats`);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                let latestStats = statsData.stats || (Array.isArray(statsData) ? statsData[statsData.length - 1] : null);
                
                if (latestStats?.home_team && latestStats?.away_team) {
                    const homeStats = calculateTeamStats(latestStats.home_team.players || []);
                    const awayStats = calculateTeamStats(latestStats.away_team.players || []);
                    
                    setLiveData(prev => ({
                        ...prev,
                        home_team: { 
                            ...prev.home_team, 
                            score: latestStats.home_team.score || 0,
                            players: latestStats.home_team.players || []
                        },
                        away_team: { 
                            ...prev.away_team, 
                            score: latestStats.away_team.score || 0,
                            players: latestStats.away_team.players || []
                        },
                        home_players: (latestStats.home_team.players || [])
                            .filter(p => p.stats && (p.stats.goals > 0 || p.stats.assists > 0))
                            .sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0))
                            .slice(0, 5),
                        away_players: (latestStats.away_team.players || [])
                            .filter(p => p.stats && (p.stats.goals > 0 || p.stats.assists > 0))
                            .sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0))
                            .slice(0, 5),
                        home_stats: homeStats,
                        away_stats: awayStats,
                        time_remaining: latestStats.time_remaining || '15:00',
                        current_period: latestStats.current_period || 1,
                        penalties: latestStats.penalties || { home: [], away: [] },
                        gameEvents: latestStats.gameEvents || []
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching live updates:', error);
        }
    };

    const calculateTeamStats = (players) => {
        return players.reduce((acc, player) => ({
            goals: acc.goals + (player.stats?.goals || 0),
            shots: acc.shots + (player.stats?.shots || 0),
            assists: acc.assists + (player.stats?.assists || 0),
            penalties: acc.penalties + (player.stats?.penalties || 0)
        }), { goals: 0, shots: 0, assists: 0, penalties: 0 });
    };

    const handleSendMessage = async () => {
        if (chat.newMessage.trim()) {
            const newMsg = {
                id: Date.now(),
                user_name: 'Spectator',
                message: chat.newMessage,
                timestamp: new Date().toISOString(),
                type: 'user'
            };
            setChat(prev => ({ ...prev, messages: [...prev.messages, newMsg], newMessage: '' }));
            try {
                await fetch(`${backendUrl}/api/events/${event.id}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: chat.newMessage, event_id: event.id, timestamp: new Date().toISOString(), user_name: 'Spectator' })
                });
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${backendUrl}${url}`;
    };

    // Find player by ID or number
    const findPlayer = (playerId, teamKey) => {
        const team = liveData[teamKey];
        if (!team?.players) return null;
        return team.players.find(p => p.id === playerId || String(p.number) === String(playerId));
    };

    // Parse player info from event text
    const parsePlayerFromEvent = (eventItem) => {
        const teamKey = eventItem.data?.teamKey;
        if (eventItem.data?.playerId && eventItem.data.playerId !== 'unknown') {
            return { player: findPlayer(eventItem.data.playerId, teamKey), teamKey };
        }
        // Try to parse "#X Name" from text
        const match = eventItem.text?.match(/#(\d+)\s+(\w+)/);
        if (match) {
            const homePlayer = liveData.home_team.players?.find(p => String(p.number) === match[1]);
            if (homePlayer) return { player: homePlayer, teamKey: 'home_team' };
            const awayPlayer = liveData.away_team.players?.find(p => String(p.number) === match[1]);
            if (awayPlayer) return { player: awayPlayer, teamKey: 'away_team' };
        }
        return { player: null, teamKey };
    };

    // Player avatar component
    const PlayerAvatar = ({ player, teamColor, size = 'md' }) => {
        const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-8 h-8 text-sm';
        if (!player) return null;
        return player.photoUrl ? (
            <img 
                src={getImageUrl(player.photoUrl)}
                alt={player.name}
                className={`${sizeClasses} rounded-full object-cover border-2 flex-shrink-0`}
                style={{ borderColor: teamColor }}
            />
        ) : (
            <div 
                className={`${sizeClasses} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
                style={{ backgroundColor: teamColor }}
            >
                {player.number}
            </div>
        );
    };

    // Get sorted events (most recent first)
    const getSortedEvents = () => {
        return [...(liveData.gameEvents || [])].sort((a, b) => {
            // Sort by timestamp descending if available
            if (a.timestamp && b.timestamp) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            // Otherwise by period then time
            if (b.period !== a.period) return (b.period || 0) - (a.period || 0);
            return (b.timeInSeconds || 0) - (a.timeInSeconds || 0);
        }).slice(0, 20);
    };

    const homeColor = liveData.home_team.color;
    const awayColor = liveData.away_team.color;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header with Team Banners */}
            <div className="relative flex-shrink-0">
                {/* Background Banners */}
                <div className="absolute inset-0 flex">
                    <div 
                        className="w-1/2 bg-cover bg-center"
                        style={{ 
                            backgroundImage: liveData.home_team.banner ? `url(${getImageUrl(liveData.home_team.banner)})` : 'none',
                            backgroundColor: homeColor
                        }}
                    >
                        <div className="w-full h-full" style={{ backgroundColor: `${homeColor}cc` }} />
                    </div>
                    <div 
                        className="w-1/2 bg-cover bg-center"
                        style={{ 
                            backgroundImage: liveData.away_team.banner ? `url(${getImageUrl(liveData.away_team.banner)})` : 'none',
                            backgroundColor: awayColor
                        }}
                    >
                        <div className="w-full h-full" style={{ backgroundColor: `${awayColor}cc` }} />
                    </div>
                </div>

                {/* Top Bar */}
                <div className="relative z-20 p-3 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
                    <div className="flex items-center gap-3">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            🔴 LIVE
                        </span>
                        <span className="text-white font-medium">{event.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                showChat ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            💬 Chat
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Scoreboard */}
                <div className="relative z-10 px-6 py-4">
                    <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 items-center">
                        {/* Home Team */}
                        <div className="flex items-center gap-4">
                            {liveData.home_team.logo ? (
                                <img 
                                    src={getImageUrl(liveData.home_team.logo)}
                                    alt={liveData.home_team.name}
                                    className="w-16 h-16 rounded-full object-cover bg-white p-1 shadow-lg"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: homeColor }}>
                                    {liveData.home_team.name?.[0]}
                                </div>
                            )}
                            <div>
                                <div className="text-white font-bold text-lg">{liveData.home_team.name}</div>
                                <div className="text-5xl font-bold text-white drop-shadow-lg">{liveData.home_team.score}</div>
                            </div>
                        </div>

                        {/* Clock */}
                        <div className="text-center bg-black/50 backdrop-blur rounded-xl py-3 px-6">
                            <div className="text-4xl font-mono font-bold text-white">{liveData.time_remaining}</div>
                            <div className="text-sm text-gray-300">Period {liveData.current_period}</div>
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center gap-4 justify-end flex-row-reverse">
                            {liveData.away_team.logo ? (
                                <img 
                                    src={getImageUrl(liveData.away_team.logo)}
                                    alt={liveData.away_team.name}
                                    className="w-16 h-16 rounded-full object-cover bg-white p-1 shadow-lg"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: awayColor }}>
                                    {liveData.away_team.name?.[0]}
                                </div>
                            )}
                            <div className="text-right">
                                <div className="text-white font-bold text-lg">{liveData.away_team.name}</div>
                                <div className="text-5xl font-bold text-white drop-shadow-lg">{liveData.away_team.score}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-gray-900 border-t border-gray-700 flex-shrink-0">
                <div className="max-w-4xl mx-auto flex">
                    {[
                        { id: 'stream', label: '📺 Stream' },
                        { id: 'events', label: '📋 Events' },
                        { id: 'stats', label: '📊 Stats' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'text-white bg-gray-800 border-b-2 border-blue-500'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden bg-gray-900">
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Stream Tab */}
                        {activeTab === 'stream' && (
                            <div className="space-y-4">
                                {/* YouTube Embed */}
                                <div className="bg-black rounded-xl overflow-hidden aspect-video">
                                    {event.youtubeUrl ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${
                                                event.youtubeUrl.includes('watch?v=') 
                                                    ? event.youtubeUrl.split('watch?v=')[1].split('&')[0]
                                                    : event.youtubeUrl.includes('youtu.be/')
                                                    ? event.youtubeUrl.split('youtu.be/')[1].split('?')[0]
                                                    : event.youtubeUrl.split('/').pop()
                                            }?autoplay=1`}
                                            title="Live Stream"
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                            <span className="text-6xl mb-4">📺</span>
                                            <p className="text-lg">No Livestream Available</p>
                                            <p className="text-sm">Add a YouTube URL to the event to enable streaming</p>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: `${homeColor}20` }}>
                                        <div className="flex items-center gap-3 mb-3">
                                            {liveData.home_team.logo && (
                                                <img src={getImageUrl(liveData.home_team.logo)} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            )}
                                            <span className="text-white font-bold">{liveData.home_team.name}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                            <div className="bg-black/30 rounded p-2">
                                                <div className="text-white font-bold">{liveData.home_stats.shots}</div>
                                                <div className="text-gray-400 text-xs">Shots</div>
                                            </div>
                                            <div className="bg-black/30 rounded p-2">
                                                <div className="text-white font-bold">{liveData.home_stats.goals}</div>
                                                <div className="text-gray-400 text-xs">Goals</div>
                                            </div>
                                            <div className="bg-black/30 rounded p-2">
                                                <div className="text-white font-bold">{liveData.home_stats.assists}</div>
                                                <div className="text-gray-400 text-xs">Assists</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: `${awayColor}20` }}>
                                        <div className="flex items-center gap-3 mb-3 justify-end">
                                            <span className="text-white font-bold">{liveData.away_team.name}</span>
                                            {liveData.away_team.logo && (
                                                <img src={getImageUrl(liveData.away_team.logo)} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                            <div className="bg-black/30 rounded p-2">
                                                <div className="text-white font-bold">{liveData.away_stats.shots}</div>
                                                <div className="text-gray-400 text-xs">Shots</div>
                                            </div>
                                            <div className="bg-black/30 rounded p-2">
                                                <div className="text-white font-bold">{liveData.away_stats.goals}</div>
                                                <div className="text-gray-400 text-xs">Goals</div>
                                            </div>
                                            <div className="bg-black/30 rounded p-2">
                                                <div className="text-white font-bold">{liveData.away_stats.assists}</div>
                                                <div className="text-gray-400 text-xs">Assists</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Events Tab - Most Recent First */}
                        {activeTab === 'events' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-bold text-lg">📋 Live Event Tracker</h3>
                                    <span className="text-gray-400 text-xs">Most recent first</span>
                                </div>
                                
                                {getSortedEvents().length > 0 ? (
                                    getSortedEvents().map((evt, idx) => {
                                        const { player, teamKey } = parsePlayerFromEvent(evt);
                                        const teamColor = teamKey === 'home_team' ? homeColor : awayColor;
                                        const assistPlayer = evt.data?.assistPlayerId ? findPlayer(evt.data.assistPlayerId, teamKey) : null;
                                        
                                        return (
                                            <div 
                                                key={evt.id || idx}
                                                className={`p-4 rounded-xl ${idx === 0 ? 'bg-blue-900/40 border border-blue-500/50' : 'bg-gray-800'}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">
                                                        {evt.type === 'goal' ? '🚨' : 
                                                         evt.type === 'shot' || evt.type === 'shot_saved' ? '🧤' :
                                                         evt.type === 'shot_miss' ? '❌' :
                                                         evt.type?.includes('penalty') ? '⚠️' : '📋'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {player && (
                                                                <>
                                                                    <PlayerAvatar player={player} teamColor={teamColor} />
                                                                    <span className="text-white font-medium">
                                                                        #{player.number} {player.name}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {evt.type === 'goal' && (
                                                                <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded">GOAL!</span>
                                                            )}
                                                            {assistPlayer && (
                                                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                                                    (Assist: <PlayerAvatar player={assistPlayer} teamColor={teamColor} size="sm" />
                                                                    #{assistPlayer.number} {assistPlayer.name?.split(' ').pop()})
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!player && <span className="text-white">{evt.text}</span>}
                                                        <div className="text-gray-500 text-xs mt-1">
                                                            {evt.time} • Period {evt.period}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <span className="text-4xl block mb-2">📋</span>
                                        <p>No events recorded yet</p>
                                        <p className="text-sm">Events will appear here as the game progresses</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stats Tab */}
                        {activeTab === 'stats' && (
                            <div className="space-y-6">
                                <h3 className="text-white font-bold text-lg">📊 Top Performers</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Home Team */}
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: `${homeColor}15` }}>
                                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                                            {liveData.home_team.logo && (
                                                <img src={getImageUrl(liveData.home_team.logo)} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            )}
                                            <span className="text-white font-bold text-lg">{liveData.home_team.name}</span>
                                        </div>
                                        <div className="space-y-3">
                                            {liveData.home_players.length > 0 ? liveData.home_players.map(player => (
                                                <div key={player.id} className="flex items-center gap-3">
                                                    <PlayerAvatar player={player} teamColor={homeColor} size="lg" />
                                                    <div className="flex-1">
                                                        <div className="text-white font-medium">#{player.number} {player.name}</div>
                                                        <div className="text-gray-400 text-sm">{player.position || ''}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-white font-bold">{player.stats?.goals || 0}G {player.stats?.assists || 0}A</div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-gray-500 text-center py-4">No scoring yet</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Away Team */}
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: `${awayColor}15` }}>
                                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                                            {liveData.away_team.logo && (
                                                <img src={getImageUrl(liveData.away_team.logo)} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            )}
                                            <span className="text-white font-bold text-lg">{liveData.away_team.name}</span>
                                        </div>
                                        <div className="space-y-3">
                                            {liveData.away_players.length > 0 ? liveData.away_players.map(player => (
                                                <div key={player.id} className="flex items-center gap-3">
                                                    <PlayerAvatar player={player} teamColor={awayColor} size="lg" />
                                                    <div className="flex-1">
                                                        <div className="text-white font-medium">#{player.number} {player.name}</div>
                                                        <div className="text-gray-400 text-sm">{player.position || ''}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-white font-bold">{player.stats?.goals || 0}G {player.stats?.assists || 0}A</div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-gray-500 text-center py-4">No scoring yet</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Panel (Collapsible) */}
                {showChat && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col flex-shrink-0">
                        <div className="p-3 border-b border-gray-700">
                            <h3 className="text-white font-bold">💬 Live Chat</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {chat.messages.map(msg => (
                                <div key={msg.id} className={msg.type === 'system' ? 'text-center' : ''}>
                                    <div className={`inline-block max-w-full text-sm ${
                                        msg.type === 'system' ? 'bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs' :
                                        'bg-gray-700 text-white p-2 rounded-lg'
                                    }`}>
                                        {msg.type !== 'system' && <div className="text-xs text-gray-400 mb-0.5">{msg.user_name}</div>}
                                        <p>{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-3 border-t border-gray-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chat.newMessage}
                                    onChange={(e) => setChat(prev => ({ ...prev, newMessage: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
                                    placeholder="Type a message..."
                                />
                                <button onClick={handleSendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveSpectatorView;
