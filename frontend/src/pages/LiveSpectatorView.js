import React, { useState, useEffect, useRef } from 'react';

const LiveSpectatorView = ({ event, teams, onClose }) => {
    const [liveData, setLiveData] = useState({
        home_team: { name: '', logo: '', score: 0, color: '#3b82f6', banner: null },
        away_team: { name: '', logo: '', score: 0, color: '#ef4444', banner: null },
        time_remaining: '15:00',
        current_period: 1,
        top_players: [],
        home_stats: { goals: 0, shots: 0, penalties: 0 },
        away_stats: { goals: 0, shots: 0, penalties: 0 }
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

    const [activeTab, setActiveTab] = useState('chat'); // chat, media, stats
    const chatEndRef = useRef(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    // Initialize game data
    useEffect(() => {
        if (event && teams) {
            const homeTeam = teams.find(t => t.id === event.teams[0]);
            const awayTeam = teams.find(t => t.id === event.teams[1]);

            setLiveData(prev => ({
                ...prev,
                home_team: {
                    name: homeTeam?.name || 'Home',
                    logo: homeTeam?.style?.logoUrl || null,
                    score: 0
                },
                away_team: {
                    name: awayTeam?.name || 'Away',
                    logo: awayTeam?.style?.logoUrl || null,
                    score: 0
                }
            }));

            // Initialize with welcome message
            setChat(prev => ({
                ...prev,
                messages: [{
                    id: Date.now(),
                    user: 'System',
                    text: `Welcome to the live view of ${event.title}!`,
                    timestamp: new Date().toISOString(),
                    type: 'system'
                }]
            }));
        }
    }, [event, teams]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat.messages]);

    // Simulate live updates (in production, this would be WebSocket/SSE)
    useEffect(() => {
        const pollInterval = setInterval(() => {
            // Poll for live game updates
            fetchLiveUpdates();
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(pollInterval);
    }, [event]);

    const fetchLiveUpdates = async () => {
        // In production, this would fetch live game data from the API
        try {
            const response = await fetch(`${backendUrl}/api/unified-events/${event.id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.scores) {
                    setLiveData(prev => ({
                        ...prev,
                        home_team: { ...prev.home_team, score: data.scores.home_team?.score || 0 },
                        away_team: { ...prev.away_team, score: data.scores.away_team?.score || 0 }
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching live updates:', error);
        }
    };

    const handleSendMessage = async () => {
        if (chat.newMessage.trim()) {
            const newMsg = {
                id: Date.now(),
                user: 'You', // In production, use actual user name
                text: chat.newMessage,
                timestamp: new Date().toISOString(),
                type: 'user'
            };

            setChat(prev => ({
                ...prev,
                messages: [...prev.messages, newMsg],
                newMessage: ''
            }));

            // In production, send message to chat API
            try {
                await fetch(`${backendUrl}/api/events/${event.id}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: chat.newMessage,
                        event_id: event.id,
                        timestamp: new Date().toISOString()
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
            
            // Create preview
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
            formData.append('event_id', event.id);
            formData.append('timestamp', new Date().toISOString());

            // Upload to Google Drive or configured storage
            const response = await fetch(`${backendUrl}/api/events/${event.id}/media`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Media uploaded successfully:', result);
                
                // Add system message to chat
                const newMsg = {
                    id: Date.now(),
                    user: 'System',
                    text: `📷 Media uploaded: ${mediaUpload.preview.name}`,
                    timestamp: new Date().toISOString(),
                    type: 'media',
                    media_url: result.url
                };

                setChat(prev => ({
                    ...prev,
                    messages: [...prev.messages, newMsg]
                }));

                // Reset upload state
                setMediaUpload({
                    uploading: false,
                    files: [],
                    preview: null
                });
            } else {
                console.error('❌ Upload failed:', response.statusText);
                alert('Upload failed. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error uploading media:', error);
            alert('Upload error: ' + error.message);
        } finally {
            setMediaUpload(prev => ({ ...prev, uploading: false }));
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white p-4 rounded-t-lg flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
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
                        <div className="flex items-center gap-3 flex-1">
                            {liveData.home_team.logo && (
                                <img 
                                    src={liveData.home_team.logo} 
                                    alt={liveData.home_team.name}
                                    className="w-12 h-12 object-cover rounded-lg border-2 border-white"
                                />
                            )}
                            <div>
                                <div className="text-lg font-bold">{liveData.home_team.name}</div>
                                <div className="text-4xl font-bold text-green-400">{liveData.home_team.score}</div>
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="text-center px-6">
                            <div className="text-4xl font-bold">{liveData.time_remaining}</div>
                            <div className="text-sm">Period {liveData.current_period}</div>
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center gap-3 flex-1 justify-end">
                            <div className="text-right">
                                <div className="text-lg font-bold">{liveData.away_team.name}</div>
                                <div className="text-4xl font-bold text-red-400">{liveData.away_team.score}</div>
                            </div>
                            {liveData.away_team.logo && (
                                <img 
                                    src={liveData.away_team.logo} 
                                    alt={liveData.away_team.name}
                                    className="w-12 h-12 object-cover rounded-lg border-2 border-white"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-gray-50 flex-shrink-0">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 px-4 font-medium transition ${
                            activeTab === 'chat'
                                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        💬 Live Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`flex-1 py-3 px-4 font-medium transition ${
                            activeTab === 'media'
                                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        📸 Upload Media
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 py-3 px-4 font-medium transition ${
                            activeTab === 'stats'
                                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        📊 Stats
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {/* Chat Tab */}
                    {activeTab === 'chat' && (
                        <div className="h-full flex flex-col">
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {chat.messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.type === 'system' ? 'justify-center' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-md px-4 py-2 rounded-lg ${
                                            msg.type === 'system'
                                                ? 'bg-blue-100 text-blue-800 text-sm'
                                                : msg.type === 'media'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            <div className="font-semibold text-sm">{msg.user}</div>
                                            <div className="text-sm">{msg.text}</div>
                                            {msg.media_url && (
                                                <img src={msg.media_url} alt="Media" className="mt-2 rounded max-w-xs" />
                                            )}
                                            <div className="text-xs text-gray-500 mt-1">{formatTime(msg.timestamp)}</div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t bg-gray-50 flex-shrink-0">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chat.newMessage}
                                        onChange={(e) => setChat(prev => ({ ...prev, newMessage: e.target.value }))}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Media Upload Tab */}
                    {activeTab === 'media' && (
                        <div className="h-full p-6 overflow-y-auto">
                            <div className="max-w-2xl mx-auto">
                                <h3 className="text-xl font-bold mb-4">Upload Photos or Videos</h3>
                                
                                {/* File Upload */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="media-upload"
                                    />
                                    <label htmlFor="media-upload" className="cursor-pointer">
                                        <div className="text-4xl mb-2">📷</div>
                                        <div className="text-lg font-medium text-gray-700">Click to select file</div>
                                        <div className="text-sm text-gray-500 mt-1">Photos or videos up to 50MB</div>
                                    </label>
                                </div>

                                {/* Preview */}
                                {mediaUpload.preview && (
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <h4 className="font-semibold mb-2">Preview:</h4>
                                        {mediaUpload.preview.type.startsWith('image/') ? (
                                            <img 
                                                src={mediaUpload.preview.url} 
                                                alt="Preview"
                                                className="max-w-full h-auto rounded"
                                            />
                                        ) : (
                                            <video 
                                                src={mediaUpload.preview.url} 
                                                controls
                                                className="max-w-full h-auto rounded"
                                            />
                                        )}
                                        <div className="text-sm text-gray-600 mt-2">{mediaUpload.preview.name}</div>
                                    </div>
                                )}

                                {/* Upload Button */}
                                {mediaUpload.preview && (
                                    <button
                                        onClick={handleUploadMedia}
                                        disabled={mediaUpload.uploading}
                                        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {mediaUpload.uploading ? '⏳ Uploading...' : '📤 Upload Media'}
                                    </button>
                                )}

                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <div className="text-sm text-blue-800">
                                        <strong>Note:</strong> Media is stored in the connected Google Drive and attached to this event for future viewing.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                        <div className="h-full p-6 overflow-y-auto">
                            <div className="max-w-2xl mx-auto">
                                <h3 className="text-xl font-bold mb-4">Live Game Statistics</h3>
                                
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="text-gray-600">Stats will update automatically as the game progresses...</div>
                                </div>

                                {/* Top Players (mock data) */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Top Scorers</h4>
                                        <div className="bg-white rounded-lg p-4 shadow">
                                            <div className="text-gray-600">No goals scored yet</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveSpectatorView;
