import React, { useState, useEffect, useRef } from 'react';

const LiveSpectatorView = ({ event, teams, onClose, tournamentMatch }) => {
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

    const [infoTab, setInfoTab] = useState('events');
    const [showChat, setShowChat] = useState(false);
    const [chat, setChat] = useState({ messages: [], newMessage: '' });
    const [liveStyle, setLiveStyle] = useState({
        bgColor: '#0a0e17',
        textColor: '#ffffff',
        panelBgColor: '#0d1221',
        accentColor: '#3b82f6'
    });
    const chatEndRef = useRef(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

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

    // Fetch live view styles from websiteStyle
    useEffect(() => {
        const fetchLiveStyles = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/league-data`);
                if (res.ok) {
                    const data = await res.json();
                    const ws = data.websiteStyle || {};
                    setLiveStyle({
                        bgColor: ws.liveViewBgColor || '#0a0e17',
                        textColor: ws.liveViewTextColor || '#ffffff',
                        panelBgColor: ws.liveViewPanelBgColor || '#0d1221',
                        accentColor: ws.liveViewAccentColor || '#3b82f6'
                    });
                }
            } catch (e) { /* use defaults */ }
        };
        fetchLiveStyles();
    }, [backendUrl]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat.messages]);

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
                        home_team: { ...prev.home_team, score: eventData.scores.home_team.score || 0, players: eventData.scores.home_team.players || [] },
                        away_team: { ...prev.away_team, score: eventData.scores.away_team.score || 0, players: eventData.scores.away_team.players || [] },
                        home_players: (eventData.scores.home_team.players || []).filter(p => p.stats && (p.stats.goals > 0 || p.stats.assists > 0)).sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0)).slice(0, 5),
                        away_players: (eventData.scores.away_team.players || []).filter(p => p.stats && (p.stats.goals > 0 || p.stats.assists > 0)).sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0)).slice(0, 5),
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
            const statsResponse = await fetch(`${backendUrl}/api/events/${event.id}/game-stats`);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                let latestStats = statsData.stats || (Array.isArray(statsData) ? statsData[statsData.length - 1] : null);
                if (latestStats?.home_team && latestStats?.away_team) {
                    const homeStats = calculateTeamStats(latestStats.home_team.players || []);
                    const awayStats = calculateTeamStats(latestStats.away_team.players || []);
                    setLiveData(prev => ({
                        ...prev,
                        home_team: { ...prev.home_team, score: latestStats.home_team.score || 0, players: latestStats.home_team.players || [] },
                        away_team: { ...prev.away_team, score: latestStats.away_team.score || 0, players: latestStats.away_team.players || [] },
                        home_players: (latestStats.home_team.players || []).filter(p => p.stats && (p.stats.goals > 0 || p.stats.assists > 0)).sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0)).slice(0, 5),
                        away_players: (latestStats.away_team.players || []).filter(p => p.stats && (p.stats.goals > 0 || p.stats.assists > 0)).sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0)).slice(0, 5),
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
            penalties: acc.penalties + (player.stats?.penalties || 0),
            faceoffs: acc.faceoffs + (player.stats?.faceoffs || 0),
            groundBalls: acc.groundBalls + (player.stats?.groundBalls || 0)
        }), { goals: 0, shots: 0, assists: 0, penalties: 0, faceoffs: 0, groundBalls: 0 });
    };

    const handleSendMessage = async () => {
        if (chat.newMessage.trim()) {
            const newMsg = { id: Date.now(), user_name: 'Spectator', message: chat.newMessage, timestamp: new Date().toISOString(), type: 'user' };
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

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${backendUrl}${url}`;
    };

    const findPlayer = (playerId, teamKey) => {
        const team = liveData[teamKey];
        if (!team?.players) return null;
        return team.players.find(p => p.id === playerId || String(p.number) === String(playerId));
    };

    const parsePlayerFromEvent = (eventItem) => {
        const teamKey = eventItem.data?.teamKey;
        if (eventItem.data?.playerId && eventItem.data.playerId !== 'unknown') {
            return { player: findPlayer(eventItem.data.playerId, teamKey), teamKey };
        }
        const match = eventItem.text?.match(/#(\d+)\s+(\w+)/);
        if (match) {
            const homePlayer = liveData.home_team.players?.find(p => String(p.number) === match[1]);
            if (homePlayer) return { player: homePlayer, teamKey: 'home_team' };
            const awayPlayer = liveData.away_team.players?.find(p => String(p.number) === match[1]);
            if (awayPlayer) return { player: awayPlayer, teamKey: 'away_team' };
        }
        return { player: null, teamKey };
    };

    const PlayerAvatar = ({ player, teamColor, size = 'md' }) => {
        const sizeClasses = size === 'sm' ? 'w-5 h-5 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-7 h-7 text-xs';
        if (!player) return null;
        return player.photoUrl ? (
            <img src={getImageUrl(player.photoUrl)} alt={player.name} className={`${sizeClasses} rounded-full object-cover border-2 flex-shrink-0`} style={{ borderColor: teamColor }} />
        ) : (
            <div className={`${sizeClasses} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`} style={{ backgroundColor: teamColor }}>
                {player.number}
            </div>
        );
    };

    const getSortedEvents = () => {
        return [...(liveData.gameEvents || [])].sort((a, b) => {
            if (a.timestamp && b.timestamp) return new Date(b.timestamp) - new Date(a.timestamp);
            if (b.period !== a.period) return (b.period || 0) - (a.period || 0);
            return (b.timeInSeconds || 0) - (a.timeInSeconds || 0);
        }).slice(0, 20);
    };

    const homeColor = liveData.home_team.color;
    const awayColor = liveData.away_team.color;

    const TeamLogo = ({ team, size = 'lg' }) => {
        const sizeMap = { sm: 'w-10 h-10', md: 'w-14 h-14', lg: 'w-16 h-16 md:w-20 md:h-20' };
        const cls = sizeMap[size];
        return team.logo ? (
            <img src={getImageUrl(team.logo)} alt={team.name} className={`${cls} rounded-full object-cover border-[3px] shadow-lg`} style={{ borderColor: team.color, boxShadow: `0 0 12px ${team.color}40` }} />
        ) : (
            <div className={`${cls} rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-white border-[3px]`} style={{ backgroundColor: team.color, borderColor: `${team.color}80` }}>
                {team.name?.[0] || '?'}
            </div>
        );
    };

    const StatBar = ({ label, homeVal, awayVal }) => {
        const total = (homeVal || 0) + (awayVal || 0);
        const homePct = total > 0 ? ((homeVal / total) * 100) : 50;
        return (
            <div className="py-1.5">
                <div className="flex justify-between text-xs mb-1" style={{ color: `${liveStyle.textColor}b3` }}>
                    <span className="font-semibold">{homeVal}</span>
                    <span className="uppercase text-[10px] tracking-wider" style={{ color: `${liveStyle.textColor}60` }}>{label}</span>
                    <span className="font-semibold">{awayVal}</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${liveStyle.textColor}20` }}>
                    <div className="rounded-l-full transition-all" style={{ width: `${homePct}%`, backgroundColor: homeColor }} />
                    <div className="rounded-r-full transition-all" style={{ width: `${100 - homePct}%`, backgroundColor: awayColor }} />
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: liveStyle.bgColor }} data-testid="live-spectator-view">
            {/* Compact Top Bar */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b" style={{ backgroundColor: liveStyle.panelBgColor, borderColor: `${liveStyle.textColor}1a` }}>
                <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wide animate-pulse flex-shrink-0">
                        <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                    </span>
                    <span className="text-xs truncate" style={{ color: `${liveStyle.textColor}b3` }}>{event.title}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        data-testid="spectator-chat-toggle"
                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                            showChat ? 'text-white' : 'hover:opacity-80'
                        }`}
                        style={{
                            backgroundColor: showChat ? liveStyle.accentColor : `${liveStyle.textColor}1a`,
                            color: showChat ? '#ffffff' : `${liveStyle.textColor}cc`
                        }}
                    >
                        Chat
                    </button>
                    <button
                        onClick={onClose}
                        data-testid="spectator-close-btn"
                        className="w-7 h-7 rounded flex items-center justify-center text-sm hover:opacity-80"
                        style={{ backgroundColor: `${liveStyle.textColor}1a`, color: `${liveStyle.textColor}cc` }}
                    >
                        &#x2715;
                    </button>
                </div>
            </div>

            {/* Scoreboard Header - Compact with big logos */}
            <div className="flex-shrink-0 px-3 py-3 md:py-4" style={{ background: `linear-gradient(to bottom, ${liveStyle.panelBgColor}, ${liveStyle.bgColor})` }}>
                <div className="flex items-center justify-center gap-3 md:gap-6 max-w-xl mx-auto">
                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-1 flex-1">
                        <TeamLogo team={liveData.home_team} size="lg" />
                        <span className="text-[11px] md:text-sm font-semibold text-center leading-tight truncate max-w-[90px] md:max-w-[140px]" style={{ color: `${liveStyle.textColor}e6` }}>{liveData.home_team.name}</span>
                    </div>

                    {/* Score + Clock */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-4xl md:text-5xl font-black tabular-nums" style={{ color: liveStyle.textColor, textShadow: `0 0 16px ${homeColor}60` }}>
                                {liveData.home_team.score}
                            </span>
                            <span className="text-xl md:text-2xl font-light" style={{ color: `${liveStyle.textColor}4d` }}>-</span>
                            <span className="text-4xl md:text-5xl font-black tabular-nums" style={{ color: liveStyle.textColor, textShadow: `0 0 16px ${awayColor}60` }}>
                                {liveData.away_team.score}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-mono font-bold tracking-wide" style={{ color: '#fbbf24' }}>{liveData.time_remaining}</span>
                            <span style={{ color: `${liveStyle.textColor}66` }}>|</span>
                            <span style={{ color: `${liveStyle.textColor}80` }}>P{liveData.current_period}</span>
                        </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-1 flex-1">
                        <TeamLogo team={liveData.away_team} size="lg" />
                        <span className="text-[11px] md:text-sm font-semibold text-center leading-tight truncate max-w-[90px] md:max-w-[140px]" style={{ color: `${liveStyle.textColor}e6` }}>{liveData.away_team.name}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Stream + Events/Stats side by side */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left: Video Stream */}
                    <div className="md:flex-1 flex-shrink-0 bg-black">
                        <div className="w-full aspect-video md:h-full md:aspect-auto">
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
                                    data-testid="stream-iframe"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 bg-[#0d1221]">
                                    <svg className="w-12 h-12 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    <p className="text-sm">No Stream Available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Events / Stats Panel */}
                    <div className="flex-1 md:w-[380px] md:max-w-[420px] md:flex-none flex flex-col bg-[#0d1221] border-t md:border-t-0 md:border-l border-white/10">
                        {/* Events / Stats Toggle */}
                        <div className="flex flex-shrink-0 border-b border-white/10">
                            <button
                                onClick={() => setInfoTab('events')}
                                data-testid="spectator-events-tab"
                                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                                    infoTab === 'events'
                                        ? 'text-white bg-white/10 border-b-2 border-blue-400'
                                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                }`}
                            >
                                Events
                            </button>
                            <button
                                onClick={() => setInfoTab('stats')}
                                data-testid="spectator-stats-tab"
                                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                                    infoTab === 'stats'
                                        ? 'text-white bg-white/10 border-b-2 border-blue-400'
                                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                }`}
                            >
                                Stats
                            </button>
                        </div>

                        {/* Panel Content */}
                        <div className="flex-1 overflow-y-auto">
                            {infoTab === 'events' ? (
                                <div className="divide-y divide-white/5">
                                    {getSortedEvents().length > 0 ? getSortedEvents().map((evt, idx) => {
                                        const { player, teamKey } = parsePlayerFromEvent(evt);
                                        const teamColor = teamKey === 'home_team' ? homeColor : awayColor;
                                        const assistPlayer = evt.data?.assistPlayerId ? findPlayer(evt.data.assistPlayerId, teamKey) : null;
                                        const isGoal = evt.type === 'goal';
                                        return (
                                            <div key={evt.id || idx} className={`px-3 py-2.5 ${idx === 0 ? 'bg-blue-500/10' : 'hover:bg-white/[0.03]'}`}>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-base flex-shrink-0 mt-0.5">
                                                        {isGoal ? '\u{1F6A8}' : evt.type === 'shot' || evt.type === 'shot_saved' ? '\u{1F9E4}' : evt.type === 'shot_miss' ? '\u{274C}' : evt.type?.includes('penalty') ? '\u{26A0}\u{FE0F}' : '\u{1F4CB}'}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {player && (
                                                                <>
                                                                    <PlayerAvatar player={player} teamColor={teamColor} size="sm" />
                                                                    <span className="text-white text-xs font-medium">#{player.number} {player.name}</span>
                                                                </>
                                                            )}
                                                            {isGoal && <span className="px-1.5 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded">GOAL</span>}
                                                        </div>
                                                        {assistPlayer && (
                                                            <span className="text-gray-500 text-[10px] flex items-center gap-1 mt-0.5">
                                                                Assist: <PlayerAvatar player={assistPlayer} teamColor={teamColor} size="sm" /> #{assistPlayer.number} {assistPlayer.name?.split(' ').pop()}
                                                            </span>
                                                        )}
                                                        {!player && <span className="text-white/80 text-xs">{evt.text}</span>}
                                                        <div className="text-white/30 text-[10px] mt-0.5">{evt.time} &middot; P{evt.period}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center py-10 text-gray-600">
                                            <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            <p className="text-xs">No events yet</p>
                                            <p className="text-[10px] text-gray-700 mt-1">Events appear as the game progresses</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3 space-y-4">
                                    {/* Comparison Bars */}
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: homeColor }} />
                                                <span className="text-white/80 text-[10px] font-medium truncate max-w-[80px]">{liveData.home_team.name}</span>
                                            </div>
                                            <span className="text-white/30 text-[10px]">vs</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-white/80 text-[10px] font-medium truncate max-w-[80px]">{liveData.away_team.name}</span>
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: awayColor }} />
                                            </div>
                                        </div>
                                        <StatBar label="Goals" homeVal={liveData.home_stats.goals} awayVal={liveData.away_stats.goals} />
                                        <StatBar label="Shots" homeVal={liveData.home_stats.shots} awayVal={liveData.away_stats.shots} />
                                        <StatBar label="Assists" homeVal={liveData.home_stats.assists} awayVal={liveData.away_stats.assists} />
                                        {(liveData.home_stats.faceoffs > 0 || liveData.away_stats.faceoffs > 0) && (
                                            <StatBar label="Faceoffs" homeVal={liveData.home_stats.faceoffs} awayVal={liveData.away_stats.faceoffs} />
                                        )}
                                        {(liveData.home_stats.groundBalls > 0 || liveData.away_stats.groundBalls > 0) && (
                                            <StatBar label="Ground Balls" homeVal={liveData.home_stats.groundBalls} awayVal={liveData.away_stats.groundBalls} />
                                        )}
                                    </div>

                                    {/* Top Performers */}
                                    {[
                                        { label: liveData.home_team.name, players: liveData.home_players, color: homeColor },
                                        { label: liveData.away_team.name, players: liveData.away_players, color: awayColor }
                                    ].map(({ label, players, color }) => (
                                        <div key={label} className="bg-white/5 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                                <span className="text-white/80 text-xs font-semibold">{label}</span>
                                            </div>
                                            {players.length > 0 ? players.map(player => (
                                                <div key={player.id} className="flex items-center gap-2 py-1.5">
                                                    <PlayerAvatar player={player} teamColor={color} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-white text-xs font-medium truncate">#{player.number} {player.name}</div>
                                                        <div className="text-white/40 text-[10px]">{player.position || ''}</div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <span className="text-white text-xs font-bold">{player.stats?.goals || 0}G {player.stats?.assists || 0}A</span>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-gray-600 text-xs text-center py-3">No scoring yet</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Panel */}
                {showChat && (
                    <div className="w-72 md:w-80 bg-[#0d1221] border-l border-white/10 flex flex-col flex-shrink-0">
                        <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between">
                            <span className="text-white text-xs font-bold">Live Chat</span>
                            <button onClick={() => setShowChat(false)} className="text-white/40 hover:text-white/70 text-sm">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                            {chat.messages.map(msg => (
                                <div key={msg.id} className={msg.type === 'system' ? 'text-center' : ''}>
                                    <div className={`text-xs ${
                                        msg.type === 'system' ? 'text-white/30 px-2 py-0.5' : 'bg-white/5 text-white/80 p-2 rounded'
                                    }`}>
                                        {msg.type !== 'system' && <div className="text-[10px] text-white/40 mb-0.5">{msg.user_name}</div>}
                                        <p>{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-2 border-t border-white/10">
                            <div className="flex gap-1.5">
                                <input
                                    type="text"
                                    value={chat.newMessage}
                                    onChange={(e) => setChat(prev => ({ ...prev, newMessage: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 px-2.5 py-1.5 bg-white/5 text-white rounded text-xs border border-white/10 focus:border-blue-500/50 focus:outline-none"
                                    placeholder="Type a message..."
                                    data-testid="chat-input"
                                />
                                <button onClick={handleSendMessage} className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition-colors" data-testid="chat-send-btn">
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
