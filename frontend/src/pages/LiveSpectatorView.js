import React, { useState, useEffect, useRef } from 'react';

const LiveSpectatorView = ({ event, teams, onClose }) => {
    const [liveData, setLiveData] = useState({
        home_team: { name: '', logo: '', score: 0, color: '#3b82f6', banner: null },
        away_team: { name: '', logo: '', score: 0, color: '#ef4444', banner: null },
        time_remaining: '15:00',
        current_period: 1,
        home_players: [],
        away_players: [],
        home_stats: { goals: 0, shots: 0, assists: 0, penalties: 0 },
        away_stats: { goals: 0, shots: 0, assists: 0, penalties: 0 }
    });

    const [chat, setChat] = useState({
        messages: [],
        newMessage: ''
    });

    const [mediaUpload, setMediaUpload] = useState({
        uploading: false,
        files: [],
        preview: null
    });

    const chatEndRef = useRef(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    // Initialize game data with team colors
    useEffect(() => {
        if (event && teams) {
            const homeTeam = teams.find(t => t.id === event.teams?.[0]);
            const awayTeam = teams.find(t => t.id === event.teams?.[1]);

            setLiveData(prev => ({
                ...prev,
                home_team: {
                    name: homeTeam?.name || 'Home Team',
                    logo: homeTeam?.style?.logoUrl || null,
                    color: homeTeam?.style?.primaryColor || '#3b82f6',
                    banner: homeTeam?.style?.bannerUrl || null,
                    score: 0
                },
                away_team: {
                    name: awayTeam?.name || 'Away Team',
                    logo: awayTeam?.style?.logoUrl || null,
                    color: awayTeam?.style?.accentColor || awayTeam?.style?.primaryColor || '#ef4444',
                    banner: awayTeam?.style?.bannerUrl || null,
                    score: 0
                }
            }));

            // Load chat history
            loadChatMessages();
        }
    }, [event, teams]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat.messages]);

    // Poll for live updates every 3 seconds
    useEffect(() => {
        const pollInterval = setInterval(() => {
            fetchLiveUpdates();
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [event]);

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

    const fetchLiveUpdates = async () => {
        try {
            // Fetch event data for basic info
            const eventResponse = await fetch(`${backendUrl}/api/unified-events/${event.id}`);
            if (eventResponse.ok) {
                const eventData = await eventResponse.json();
                
                // Update scores if available
                if (eventData.scores) {
                    setLiveData(prev => ({
                        ...prev,
                        home_team: { 
                            ...prev.home_team, 
                            score: eventData.scores.home_team?.score || 0 
                        },
                        away_team: { 
                            ...prev.away_team, 
                            score: eventData.scores.away_team?.score || 0 
                        }
                    }));
                }
            }

            // Fetch game stats for detailed player/team statistics
            try {
                const statsResponse = await fetch(`${backendUrl}/api/events/${event.id}/game-stats`);
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    
                    // Handle both old array format and new object format
                    let latestStats = null;
                    if (statsData.stats) {
                        latestStats = statsData.stats;
                    } else if (Array.isArray(statsData) && statsData.length > 0) {
                        latestStats = statsData[statsData.length - 1];
                    }
                    
                    if (latestStats && latestStats.home_team && latestStats.away_team) {
                        const homeStats = calculateTeamStats(latestStats.home_team.players || []);
                        const awayStats = calculateTeamStats(latestStats.away_team.players || []);
                        
                        setLiveData(prev => ({
                            ...prev,
                            home_team: { 
                                ...prev.home_team, 
                                score: latestStats.home_team.score || 0 
                            },
                            away_team: { 
                                ...prev.away_team, 
                                score: latestStats.away_team.score || 0 
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
                            current_period: latestStats.current_period || 1
                        }));
                    }
                }
            } catch (statsError) {
                console.log('No game stats yet, waiting for game to start...');
            }
        } catch (error) {
            console.error('Error fetching live updates:', error);
        }
    };

    const calculateTeamStats = (players) => {
        return players.reduce((acc, player) => {
            return {
                goals: acc.goals + (player.stats?.goals || 0),
                shots: acc.shots + (player.stats?.shots || 0),
                assists: acc.assists + (player.stats?.assists || 0),
                penalties: acc.penalties + (player.stats?.penalties || 0)
            };
        }, { goals: 0, shots: 0, assists: 0, penalties: 0 });
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
                        user_name: 'Spectator'
                    })
                });
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const file = files[0];
            
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setMediaUpload(prev => ({
                        ...prev,
                        preview: { url: e.target.result, type: file.type, name: file.name },
                        files: [file]
                    }));
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleUploadMedia = async () => {
        if (mediaUpload.files.length === 0) return;

        setMediaUpload(prev => ({ ...prev, uploading: true }));

        try {
            const formData = new FormData();
            mediaUpload.files.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch(`${backendUrl}/api/events/${event.id}/media`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                
                // Add system message to chat
                const newMsg = {
                    id: Date.now(),
                    user_name: 'System',
                    message: `📷 Media uploaded: ${mediaUpload.preview.name}`,
                    timestamp: new Date().toISOString(),
                    type: 'media'
                };

                setChat(prev => ({
                    ...prev,
                    messages: [...prev.messages, newMsg]
                }));

                setMediaUpload({
                    uploading: false,
                    files: [],
                    preview: null
                });

                alert('Media uploaded successfully!');
            } else {
                alert('Upload failed. Please try again.');
            }
        } catch (error) {
            console.error('Error uploading media:', error);
            alert('Upload error: ' + error.message);
        } finally {
            setMediaUpload(prev => ({ ...prev, uploading: false }));
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatPlayerName = (name) => {
        // Convert "First Last" to "Last, First"
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            const lastName = parts[parts.length - 1];
            const firstName = parts.slice(0, -1).join(' ');
            return `${lastName}, ${firstName}`;
        }
        return name;
    };

    const getBackgroundStyle = () => {
        if (liveData.home_team.banner || liveData.away_team.banner) {
            return {
                background: `linear-gradient(to right, 
                    ${liveData.home_team.color}aa 0%, 
                    ${liveData.home_team.color}ee 25%,
                    ${liveData.away_team.color}ee 75%,
                    ${liveData.away_team.color}aa 100%)`
            };
        }
        return {
            background: `linear-gradient(to right, ${liveData.home_team.color}, ${liveData.away_team.color})`
        };
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full h-[95vh] flex flex-col">
                {/* Header with Team Colors/Banners */}
                <div 
                    className="text-white p-6 rounded-t-lg flex-shrink-0 relative overflow-hidden"
                    style={getBackgroundStyle()}
                >
                    {/* Team Banners as Background */}
                    {liveData.home_team.banner && (
                        <div 
                            className="absolute left-0 top-0 bottom-0 w-1/2 opacity-20"
                            style={{
                                backgroundImage: `url(${liveData.home_team.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                    )}
                    {liveData.away_team.banner && (
                        <div 
                            className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20"
                            style={{
                                backgroundImage: `url(${liveData.away_team.banner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                    )}

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold">🔴 LIVE: {event.title}</h2>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-medium transition"
                            >
                                ✕ Close
                            </button>
                        </div>

                        {/* Live Scoreboard */}
                        <div className="flex items-center justify-between">
                            {/* Home Team */}
                            <div className="flex items-center gap-4 flex-1">
                                {liveData.home_team.logo && (
                                    <img 
                                        src={liveData.home_team.logo} 
                                        alt={liveData.home_team.name}
                                        className="w-16 h-16 object-cover rounded-lg border-4 border-white shadow-lg"
                                    />
                                )}
                                <div>
                                    <div className="text-xl font-bold">{liveData.home_team.name}</div>
                                    <div className="text-5xl font-bold text-white drop-shadow-lg">{liveData.home_team.score}</div>
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="text-center px-8 bg-black bg-opacity-30 rounded-lg py-3">
                                <div className="text-5xl font-bold">{liveData.time_remaining}</div>
                                <div className="text-sm mt-1">Period {liveData.current_period}</div>
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center gap-4 flex-1 justify-end">
                                <div className="text-right">
                                    <div className="text-xl font-bold">{liveData.away_team.name}</div>
                                    <div className="text-5xl font-bold text-white drop-shadow-lg">{liveData.away_team.score}</div>
                                </div>
                                {liveData.away_team.logo && (
                                    <img 
                                        src={liveData.away_team.logo} 
                                        alt={liveData.away_team.name}
                                        className="w-16 h-16 object-cover rounded-lg border-4 border-white shadow-lg"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area - Split View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Side - Stats */}
                    <div className="w-2/3 p-6 overflow-y-auto border-r">
                        <h3 className="text-2xl font-bold mb-4">📊 Live Game Stats</h3>
                        
                        {/* Team Stats Comparison */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Home Team Stats */}
                            <div className="bg-blue-50 rounded-lg p-4 border-2" style={{ borderColor: liveData.home_team.color }}>
                                <h4 className="font-bold text-lg mb-3" style={{ color: liveData.home_team.color }}>
                                    {liveData.home_team.name}
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Goals:</span>
                                        <span className="text-xl font-bold">{liveData.home_stats.goals}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Shots:</span>
                                        <span className="text-xl font-bold">{liveData.home_stats.shots}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Assists:</span>
                                        <span className="text-xl font-bold">{liveData.home_stats.assists}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Penalties:</span>
                                        <span className="text-xl font-bold">{liveData.home_stats.penalties}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Away Team Stats */}
                            <div className="bg-red-50 rounded-lg p-4 border-2" style={{ borderColor: liveData.away_team.color }}>
                                <h4 className="font-bold text-lg mb-3" style={{ color: liveData.away_team.color }}>
                                    {liveData.away_team.name}
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Goals:</span>
                                        <span className="text-xl font-bold">{liveData.away_stats.goals}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Shots:</span>
                                        <span className="text-xl font-bold">{liveData.away_stats.shots}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Assists:</span>
                                        <span className="text-xl font-bold">{liveData.away_stats.assists}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Penalties:</span>
                                        <span className="text-xl font-bold">{liveData.away_stats.penalties}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Players */}
                        {(liveData.home_players.length > 0 || liveData.away_players.length > 0) && (
                            <div>
                                <h4 className="text-lg font-bold mb-3">⭐ Top Performers</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h5 className="font-semibold mb-2" style={{ color: liveData.home_team.color }}>
                                            {liveData.home_team.name}
                                        </h5>
                                        {liveData.home_players.map((player, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded p-2 mb-2 text-sm">
                                                <div className="font-medium">#{player.number} {formatPlayerName(player.name)}</div>
                                                <div className="text-xs text-gray-600">
                                                    G:{player.stats?.goals || 0} A:{player.stats?.assists || 0}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <h5 className="font-semibold mb-2" style={{ color: liveData.away_team.color }}>
                                            {liveData.away_team.name}
                                        </h5>
                                        {liveData.away_players.map((player, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded p-2 mb-2 text-sm">
                                                <div className="font-medium">#{player.number} {formatPlayerName(player.name)}</div>
                                                <div className="text-xs text-gray-600">
                                                    G:{player.stats?.goals || 0} A:{player.stats?.assists || 0}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {liveData.home_players.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <div className="text-4xl mb-2">⏳</div>
                                <p>Game stats will appear here once the game starts...</p>
                            </div>
                        )}

                        {/* Media Upload Section */}
                        <div className="mt-6 pt-6 border-t">
                            <h4 className="text-lg font-bold mb-3">📸 Share Photos/Videos</h4>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="media-upload-spectator"
                                />
                                <label htmlFor="media-upload-spectator" className="cursor-pointer">
                                    <div className="text-3xl mb-2">📷</div>
                                    <div className="text-sm font-medium text-gray-700">Click to upload media</div>
                                </label>
                            </div>

                            {mediaUpload.preview && (
                                <div className="mt-4">
                                    {mediaUpload.preview.type.startsWith('image/') ? (
                                        <img 
                                            src={mediaUpload.preview.url} 
                                            alt="Preview"
                                            className="max-w-full h-auto rounded mb-2"
                                        />
                                    ) : (
                                        <video 
                                            src={mediaUpload.preview.url} 
                                            controls
                                            className="max-w-full h-auto rounded mb-2"
                                        />
                                    )}
                                    <button
                                        onClick={handleUploadMedia}
                                        disabled={mediaUpload.uploading}
                                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition disabled:opacity-50"
                                    >
                                        {mediaUpload.uploading ? '⏳ Uploading...' : '📤 Upload'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Live Chat */}
                    <div className="w-1/3 flex flex-col bg-gray-50">
                        <div className="p-4 border-b bg-white">
                            <h3 className="text-xl font-bold">💬 Live Chat</h3>
                        </div>
                        
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {chat.messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.type === 'system' || msg.type === 'media' ? 'justify-center' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] px-3 py-2 rounded-lg ${
                                        msg.type === 'system'
                                            ? 'bg-blue-100 text-blue-800 text-sm'
                                            : msg.type === 'media'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-white shadow border'
                                    }`}>
                                        <div className="font-semibold text-sm">{msg.user_name}</div>
                                        <div className="text-sm">{msg.message}</div>
                                        <div className="text-xs text-gray-500 mt-1">{formatTime(msg.timestamp)}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t bg-white flex-shrink-0">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chat.newMessage}
                                    onChange={(e) => setChat(prev => ({ ...prev, newMessage: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveSpectatorView;
