import React, { useState, useEffect, useRef } from 'react';

const LiveSpectatorView = ({ event, gameData, onClose }) => {
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [userName, setUserName] = useState('');
    const [isNameSet, setIsNameSet] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [activeTab, setActiveTab] = useState('stream'); // stream, stats, roster
    const chatEndRef = useRef(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Mock initial chat messages
    useEffect(() => {
        const initialMessages = [
            {
                id: '1',
                user: 'GameBot',
                message: `Welcome to ${event.title}! Game is live.`,
                timestamp: new Date(Date.now() - 300000),
                type: 'system'
            }
        ];
        setChatMessages(initialMessages);
    }, [event]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !isNameSet) return;
        const message = {
            id: Date.now().toString(),
            user: userName,
            message: newMessage.trim(),
            timestamp: new Date(),
            type: 'user'
        };
        setChatMessages(prev => [...prev, message]);
        setNewMessage('');
    };

    const handleSetUserName = () => {
        if (userName.trim()) {
            setIsNameSet(true);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimestamp = (timestamp) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get team colors with fallbacks
    const homeColor = gameData?.home_team?.color || '#3b82f6';
    const awayColor = gameData?.away_team?.color || '#ef4444';

    // Helper to get full image URL
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${backendUrl}${url}`;
    };

    // Get game events sorted by most recent first
    const getRecentEvents = () => {
        const events = gameData?.game_events || [];
        // Return a copy sorted by timestamp descending (most recent first)
        return [...events].sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeB - timeA;
        }).slice(0, 10); // Show last 10 events
    };

    // Find player by ID or number
    const findPlayer = (playerId, teamKey) => {
        if (!gameData || !teamKey) return null;
        const team = gameData[teamKey];
        if (!team?.players) return null;
        return team.players.find(p => p.id === playerId || p.number === playerId);
    };

    // Parse player info from event text (e.g., "#12 Smith")
    const parsePlayerFromText = (text, teamKey) => {
        const match = text?.match(/#(\d+)\s+(\w+)/);
        if (match && gameData?.[teamKey]?.players) {
            const number = match[1];
            return gameData[teamKey].players.find(p => String(p.number) === number);
        }
        return null;
    };

    // Render player with photo
    const PlayerWithPhoto = ({ player, teamColor }) => {
        if (!player) return null;
        return (
            <span className="inline-flex items-center gap-1.5">
                {player.photoUrl ? (
                    <img 
                        src={getImageUrl(player.photoUrl)}
                        alt={player.name}
                        className="w-6 h-6 rounded-full object-cover border-2"
                        style={{ borderColor: teamColor }}
                    />
                ) : (
                    <span 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: teamColor }}
                    >
                        {player.number}
                    </span>
                )}
                <span className="font-medium">#{player.number} {player.name}</span>
            </span>
        );
    };

    // Render event with player photos
    const renderEventWithPhotos = (eventItem) => {
        const { text, type, data } = eventItem;
        
        // Determine team based on event data
        let teamKey = data?.teamKey;
        let teamColor = teamKey === 'home_team' ? homeColor : awayColor;
        
        // Try to find player from event data
        let player = null;
        if (data?.playerId && data.playerId !== 'unknown') {
            player = findPlayer(data.playerId, teamKey);
        }
        
        // If no player found from data, try to parse from text
        if (!player && text) {
            // Check home team first
            player = parsePlayerFromText(text, 'home_team');
            if (player) {
                teamColor = homeColor;
            } else {
                player = parsePlayerFromText(text, 'away_team');
                if (player) teamColor = awayColor;
            }
        }

        // Check for assist player
        let assistPlayer = null;
        if (data?.assistPlayerId) {
            assistPlayer = findPlayer(data.assistPlayerId, teamKey);
        }

        // Get event icon based on type
        const getEventIcon = () => {
            switch (type) {
                case 'goal': return '🚨';
                case 'shot': case 'shot_saved': return '🧤';
                case 'shot_miss': return '❌';
                case 'penalty_start': return '⚠️';
                case 'penalty_end': return '✅';
                case 'period_start': case 'period_end': return '⏱️';
                case 'game_start': return '🏒';
                case 'game_end': return '🏆';
                default: return '📋';
            }
        };

        return (
            <div className="flex items-start gap-3">
                <span className="text-xl">{getEventIcon()}</span>
                <div className="flex-1">
                    {player ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <PlayerWithPhoto player={player} teamColor={teamColor} />
                            {type === 'goal' && <span className="text-green-600 font-bold">GOAL!</span>}
                            {type === 'shot' && <span className="text-blue-600">Shot on goal</span>}
                            {type === 'shot_miss' && <span className="text-gray-500">Shot missed</span>}
                            {assistPlayer && (
                                <span className="text-sm text-gray-600">
                                    (Assist: <PlayerWithPhoto player={assistPlayer} teamColor={teamColor} />)
                                </span>
                            )}
                        </div>
                    ) : (
                        <span>{text}</span>
                    )}
                    <div className="text-xs text-gray-500 mt-0.5">
                        {eventItem.gameTime || eventItem.time || ''}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="bg-gray-900 w-full h-full flex flex-col overflow-hidden">
                {/* Top Banner with Team Logos and Banners */}
                <div className="relative">
                    {/* Background gradient using team colors */}
                    <div 
                        className="absolute inset-0 opacity-30"
                        style={{ 
                            background: `linear-gradient(90deg, ${homeColor} 0%, ${homeColor} 40%, ${awayColor} 60%, ${awayColor} 100%)`
                        }}
                    />
                    
                    {/* Team Banners as background */}
                    <div className="absolute inset-0 flex">
                        {gameData?.home_team?.banner && (
                            <div 
                                className="w-1/2 bg-cover bg-center opacity-20"
                                style={{ backgroundImage: `url(${getImageUrl(gameData.home_team.banner)})` }}
                            />
                        )}
                        {gameData?.away_team?.banner && (
                            <div 
                                className="w-1/2 bg-cover bg-center opacity-20"
                                style={{ backgroundImage: `url(${getImageUrl(gameData.away_team.banner)})` }}
                            />
                        )}
                    </div>

                    {/* Header Content */}
                    <div className="relative z-10 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                                    🔴 LIVE
                                </span>
                                <div className="text-white">
                                    <h1 className="text-xl font-bold">{event.title}</h1>
                                    <p className="text-sm text-gray-300">
                                        📍 {event.location || 'TBD'} • 📅 {event.date}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowChat(!showChat)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        showChat 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                >
                                    💬 Chat {showChat ? '▼' : '▲'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Main View Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Scoreboard */}
                        <div className="p-4 bg-gray-800">
                            <div className="max-w-4xl mx-auto">
                                <div className="grid grid-cols-3 gap-4 items-center">
                                    {/* Home Team */}
                                    <div 
                                        className="flex items-center gap-4 p-4 rounded-xl"
                                        style={{ backgroundColor: `${homeColor}20` }}
                                    >
                                        {gameData?.home_team?.logo ? (
                                            <img 
                                                src={getImageUrl(gameData.home_team.logo)}
                                                alt={gameData?.home_team?.name}
                                                className="w-16 h-16 rounded-full object-cover bg-white p-1 shadow-lg"
                                            />
                                        ) : (
                                            <div 
                                                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                                                style={{ backgroundColor: homeColor }}
                                            >
                                                {gameData?.home_team?.name?.[0] || 'H'}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="text-white font-bold text-lg">
                                                {gameData?.home_team?.name || 'Home'}
                                            </div>
                                            <div className="text-gray-400 text-sm">Home</div>
                                        </div>
                                        <div 
                                            className="text-5xl font-bold"
                                            style={{ color: homeColor }}
                                        >
                                            {gameData?.home_team?.score || 0}
                                        </div>
                                    </div>

                                    {/* Game Clock */}
                                    <div className="text-center">
                                        <div className="text-4xl font-mono font-bold text-white mb-1">
                                            {formatTime(gameData?.time_remaining)}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            {gameData?.game_settings?.periodName || 'Period'} {gameData?.current_period || 1}
                                        </div>
                                        {gameData?.is_running && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                                In Progress
                                            </span>
                                        )}
                                    </div>

                                    {/* Away Team */}
                                    <div 
                                        className="flex items-center gap-4 p-4 rounded-xl flex-row-reverse"
                                        style={{ backgroundColor: `${awayColor}20` }}
                                    >
                                        {gameData?.away_team?.logo ? (
                                            <img 
                                                src={getImageUrl(gameData.away_team.logo)}
                                                alt={gameData?.away_team?.name}
                                                className="w-16 h-16 rounded-full object-cover bg-white p-1 shadow-lg"
                                            />
                                        ) : (
                                            <div 
                                                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                                                style={{ backgroundColor: awayColor }}
                                            >
                                                {gameData?.away_team?.name?.[0] || 'A'}
                                            </div>
                                        )}
                                        <div className="flex-1 text-right">
                                            <div className="text-white font-bold text-lg">
                                                {gameData?.away_team?.name || 'Away'}
                                            </div>
                                            <div className="text-gray-400 text-sm">Away</div>
                                        </div>
                                        <div 
                                            className="text-5xl font-bold"
                                            style={{ color: awayColor }}
                                        >
                                            {gameData?.away_team?.score || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="bg-gray-800 border-t border-gray-700">
                            <div className="max-w-4xl mx-auto flex">
                                {[
                                    { id: 'stream', label: '📺 Stream', icon: '📺' },
                                    { id: 'events', label: '📋 Events', icon: '📋' },
                                    { id: 'stats', label: '📊 Stats', icon: '📊' },
                                    { id: 'roster', label: '👥 Rosters', icon: '👥' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                                            activeTab === tab.id
                                                ? 'text-white border-b-2 border-blue-500 bg-gray-700/50'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
                            <div className="max-w-4xl mx-auto">
                                {/* Stream Tab */}
                                {activeTab === 'stream' && (
                                    <div className="space-y-4">
                                        {/* Livestream Embed Area */}
                                        <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
                                            {gameData?.youtubeUrl || event.youtubeUrl ? (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${(gameData?.youtubeUrl || event.youtubeUrl).includes('watch?v=') 
                                                        ? (gameData?.youtubeUrl || event.youtubeUrl).split('watch?v=')[1].split('&')[0]
                                                        : (gameData?.youtubeUrl || event.youtubeUrl).split('/').pop()
                                                    }?autoplay=1`}
                                                    title="Live Stream"
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                                    <span className="text-6xl mb-4">📺</span>
                                                    <p className="text-lg font-medium">No Livestream Available</p>
                                                    <p className="text-sm">Check back later for live video</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick Stats Below Stream */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div 
                                                className="p-4 rounded-xl"
                                                style={{ backgroundColor: `${homeColor}15` }}
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    {gameData?.home_team?.logo && (
                                                        <img 
                                                            src={getImageUrl(gameData.home_team.logo)}
                                                            alt=""
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <span className="text-white font-bold">{gameData?.home_team?.name}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                                    <div className="bg-black/20 rounded p-2">
                                                        <div className="text-white font-bold">{gameData?.home_team?.shots || 0}</div>
                                                        <div className="text-gray-400 text-xs">Shots</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded p-2">
                                                        <div className="text-white font-bold">{gameData?.home_team?.score || 0}</div>
                                                        <div className="text-gray-400 text-xs">Goals</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded p-2">
                                                        <div className="text-white font-bold">{gameData?.home_team?.assists || 0}</div>
                                                        <div className="text-gray-400 text-xs">Assists</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div 
                                                className="p-4 rounded-xl"
                                                style={{ backgroundColor: `${awayColor}15` }}
                                            >
                                                <div className="flex items-center gap-3 mb-3 justify-end">
                                                    <span className="text-white font-bold">{gameData?.away_team?.name}</span>
                                                    {gameData?.away_team?.logo && (
                                                        <img 
                                                            src={getImageUrl(gameData.away_team.logo)}
                                                            alt=""
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                                    <div className="bg-black/20 rounded p-2">
                                                        <div className="text-white font-bold">{gameData?.away_team?.shots || 0}</div>
                                                        <div className="text-gray-400 text-xs">Shots</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded p-2">
                                                        <div className="text-white font-bold">{gameData?.away_team?.score || 0}</div>
                                                        <div className="text-gray-400 text-xs">Goals</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded p-2">
                                                        <div className="text-white font-bold">{gameData?.away_team?.assists || 0}</div>
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
                                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                            <span>📋 Live Event Tracker</span>
                                            <span className="text-xs text-gray-400 font-normal">(Most Recent First)</span>
                                        </h3>
                                        
                                        {getRecentEvents().length > 0 ? (
                                            getRecentEvents().map((eventItem, index) => (
                                                <div 
                                                    key={eventItem.id || index}
                                                    className={`p-4 rounded-xl ${
                                                        index === 0 ? 'bg-blue-900/30 border border-blue-500/50' : 'bg-gray-800'
                                                    }`}
                                                >
                                                    {renderEventWithPhotos(eventItem)}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-gray-500">
                                                <span className="text-4xl mb-2 block">📋</span>
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
                                            {/* Home Team Stats */}
                                            <div 
                                                className="p-4 rounded-xl"
                                                style={{ backgroundColor: `${homeColor}15` }}
                                            >
                                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                                                    {gameData?.home_team?.logo && (
                                                        <img 
                                                            src={getImageUrl(gameData.home_team.logo)}
                                                            alt=""
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <span className="text-white font-bold text-lg">{gameData?.home_team?.name}</span>
                                                </div>
                                                <div className="space-y-3">
                                                    {(gameData?.home_team?.players || [])
                                                        .filter(p => p.active && ((p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0))
                                                        .sort((a, b) => ((b.stats?.goals || 0) + (b.stats?.assists || 0)) - ((a.stats?.goals || 0) + (a.stats?.assists || 0)))
                                                        .slice(0, 5)
                                                        .map(player => (
                                                            <div key={player.id} className="flex items-center gap-3">
                                                                {player.photoUrl ? (
                                                                    <img 
                                                                        src={getImageUrl(player.photoUrl)}
                                                                        alt={player.name}
                                                                        className="w-10 h-10 rounded-full object-cover border-2"
                                                                        style={{ borderColor: homeColor }}
                                                                    />
                                                                ) : (
                                                                    <div 
                                                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                                                        style={{ backgroundColor: homeColor }}
                                                                    >
                                                                        {player.number}
                                                                    </div>
                                                                )}
                                                                <div className="flex-1">
                                                                    <div className="text-white font-medium">#{player.number} {player.name}</div>
                                                                    <div className="text-gray-400 text-sm">{player.position || ''}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-white font-bold">{player.stats?.goals || 0}G {player.stats?.assists || 0}A</div>
                                                                    <div className="text-gray-400 text-xs">{player.stats?.shots || 0} shots</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                    {(gameData?.home_team?.players || []).filter(p => p.active && ((p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0)).length === 0 && (
                                                        <p className="text-gray-500 text-center py-4">No scoring yet</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Away Team Stats */}
                                            <div 
                                                className="p-4 rounded-xl"
                                                style={{ backgroundColor: `${awayColor}15` }}
                                            >
                                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                                                    {gameData?.away_team?.logo && (
                                                        <img 
                                                            src={getImageUrl(gameData.away_team.logo)}
                                                            alt=""
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <span className="text-white font-bold text-lg">{gameData?.away_team?.name}</span>
                                                </div>
                                                <div className="space-y-3">
                                                    {(gameData?.away_team?.players || [])
                                                        .filter(p => p.active && ((p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0))
                                                        .sort((a, b) => ((b.stats?.goals || 0) + (b.stats?.assists || 0)) - ((a.stats?.goals || 0) + (a.stats?.assists || 0)))
                                                        .slice(0, 5)
                                                        .map(player => (
                                                            <div key={player.id} className="flex items-center gap-3">
                                                                {player.photoUrl ? (
                                                                    <img 
                                                                        src={getImageUrl(player.photoUrl)}
                                                                        alt={player.name}
                                                                        className="w-10 h-10 rounded-full object-cover border-2"
                                                                        style={{ borderColor: awayColor }}
                                                                    />
                                                                ) : (
                                                                    <div 
                                                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                                                        style={{ backgroundColor: awayColor }}
                                                                    >
                                                                        {player.number}
                                                                    </div>
                                                                )}
                                                                <div className="flex-1">
                                                                    <div className="text-white font-medium">#{player.number} {player.name}</div>
                                                                    <div className="text-gray-400 text-sm">{player.position || ''}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-white font-bold">{player.stats?.goals || 0}G {player.stats?.assists || 0}A</div>
                                                                    <div className="text-gray-400 text-xs">{player.stats?.shots || 0} shots</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                    {(gameData?.away_team?.players || []).filter(p => p.active && ((p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0)).length === 0 && (
                                                        <p className="text-gray-500 text-center py-4">No scoring yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Roster Tab */}
                                {activeTab === 'roster' && (
                                    <div className="space-y-6">
                                        <h3 className="text-white font-bold text-lg">👥 Team Rosters</h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Home Team Roster */}
                                            <div 
                                                className="p-4 rounded-xl"
                                                style={{ backgroundColor: `${homeColor}15` }}
                                            >
                                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                                                    {gameData?.home_team?.logo && (
                                                        <img 
                                                            src={getImageUrl(gameData.home_team.logo)}
                                                            alt=""
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <span className="text-white font-bold text-lg">{gameData?.home_team?.name}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(gameData?.home_team?.players || [])
                                                        .filter(p => p.active)
                                                        .sort((a, b) => parseInt(a.number) - parseInt(b.number))
                                                        .map(player => (
                                                            <div key={player.id} className="flex items-center gap-2 p-2 bg-black/20 rounded">
                                                                {player.photoUrl ? (
                                                                    <img 
                                                                        src={getImageUrl(player.photoUrl)}
                                                                        alt={player.name}
                                                                        className="w-8 h-8 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div 
                                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                                        style={{ backgroundColor: homeColor }}
                                                                    >
                                                                        {player.number}
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-white text-sm font-medium truncate">
                                                                        #{player.number} {player.name?.split(' ').pop()}
                                                                    </div>
                                                                    <div className="text-gray-400 text-xs">{player.position || ''}</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>

                                            {/* Away Team Roster */}
                                            <div 
                                                className="p-4 rounded-xl"
                                                style={{ backgroundColor: `${awayColor}15` }}
                                            >
                                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                                                    {gameData?.away_team?.logo && (
                                                        <img 
                                                            src={getImageUrl(gameData.away_team.logo)}
                                                            alt=""
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <span className="text-white font-bold text-lg">{gameData?.away_team?.name}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(gameData?.away_team?.players || [])
                                                        .filter(p => p.active)
                                                        .sort((a, b) => parseInt(a.number) - parseInt(b.number))
                                                        .map(player => (
                                                            <div key={player.id} className="flex items-center gap-2 p-2 bg-black/20 rounded">
                                                                {player.photoUrl ? (
                                                                    <img 
                                                                        src={getImageUrl(player.photoUrl)}
                                                                        alt={player.name}
                                                                        className="w-8 h-8 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div 
                                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                                        style={{ backgroundColor: awayColor }}
                                                                    >
                                                                        {player.number}
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-white text-sm font-medium truncate">
                                                                        #{player.number} {player.name?.split(' ').pop()}
                                                                    </div>
                                                                    <div className="text-gray-400 text-xs">{player.position || ''}</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Chat Panel (Collapsible) */}
                    {showChat && (
                        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                            {/* Chat Header */}
                            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                                <h3 className="text-white font-bold">💬 Live Chat</h3>
                                <span className="text-xs text-gray-400">{chatMessages.length} messages</span>
                            </div>

                            {/* Name Input */}
                            {!isNameSet && (
                                <div className="p-3 bg-gray-700 border-b border-gray-600">
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSetUserName()}
                                        className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg text-sm mb-2"
                                        placeholder="Enter your name..."
                                    />
                                    <button
                                        onClick={handleSetUserName}
                                        disabled={!userName.trim()}
                                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                    >
                                        Join Chat
                                    </button>
                                </div>
                            )}

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {chatMessages.map(msg => (
                                    <div key={msg.id} className={msg.type === 'system' ? 'text-center' : ''}>
                                        <div className={`inline-block max-w-full text-sm ${
                                            msg.type === 'system'
                                                ? 'bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs'
                                                : msg.user === userName
                                                    ? 'bg-blue-600 text-white p-2 rounded-lg rounded-br-none ml-6'
                                                    : 'bg-gray-700 text-white p-2 rounded-lg rounded-bl-none mr-6'
                                        }`}>
                                            {msg.type !== 'system' && (
                                                <div className="text-xs opacity-70 mb-0.5">
                                                    {msg.user} • {formatTimestamp(msg.timestamp)}
                                                </div>
                                            )}
                                            <p>{msg.message}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            {isNameSet && (
                                <div className="p-3 border-t border-gray-700">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
                                            placeholder="Type a message..."
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveSpectatorView;
