import React, { useState, useEffect, useRef } from 'react';

const LiveSpectatorView = ({ event, gameData, onClose }) => {
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [userName, setUserName] = useState('');
    const [isNameSet, setIsNameSet] = useState(false);
    const [mediaUpload, setMediaUpload] = useState(null);
    const [showMediaUpload, setShowMediaUpload] = useState(false);
    const chatEndRef = useRef(null);

    // Mock initial chat messages
    useEffect(() => {
        const initialMessages = [
            {
                id: '1',
                user: 'GameBot',
                message: `🏆 Welcome to ${event.title}! Game is starting soon.`,
                timestamp: new Date(Date.now() - 300000),
                type: 'system'
            },
            {
                id: '2',
                user: 'Fan1',
                message: "Let's go Eagles! 🦅",
                timestamp: new Date(Date.now() - 240000),
                type: 'user'
            },
            {
                id: '3',
                user: 'Coach_Mike',
                message: "Great weather for lacrosse today!",
                timestamp: new Date(Date.now() - 180000),
                type: 'user'
            }
        ];
        setChatMessages(initialMessages);
    }, [event]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Simulate live game updates
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.8) { // 20% chance every 5 seconds
                const updates = [
                    "⚡ Shot attempt by #12 Smith",
                    "🥅 Save by the goalie!",
                    "🏃 Fast break opportunity",
                    "⏰ 5 minutes remaining in the period",
                    "🔥 Great defensive play",
                    "📸 What a play! Someone got a photo of that?"
                ];
                
                const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
                addSystemMessage(randomUpdate);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const addSystemMessage = (message) => {
        const systemMessage = {
            id: Date.now().toString(),
            user: 'LiveUpdate',
            message: message,
            timestamp: new Date(),
            type: 'system'
        };
        setChatMessages(prev => [...prev, systemMessage]);
    };

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
            const welcomeMessage = {
                id: Date.now().toString(),
                user: 'GameBot',
                message: `👋 Welcome to the game, ${userName}!`,
                timestamp: new Date(),
                type: 'system'
            };
            setChatMessages(prev => [...prev, welcomeMessage]);
        }
    };

    const handleMediaUpload = (file) => {
        if (!file) return;

        // Simulate media upload
        const mediaMessage = {
            id: Date.now().toString(),
            user: userName,
            message: `📷 Shared a ${file.type.includes('image') ? 'photo' : 'video'}`,
            timestamp: new Date(),
            type: 'media',
            mediaUrl: URL.createObjectURL(file),
            mediaType: file.type.includes('image') ? 'image' : 'video'
        };

        setChatMessages(prev => [...prev, mediaMessage]);
        setMediaUpload(null);
        setShowMediaUpload(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimestamp = (timestamp) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">📺 Live Game View</h2>
                            <p className="text-blue-100">{event.title}</p>
                            <p className="text-blue-200 text-sm">📅 {event.date} • 🕒 {event.time} • 📍 {event.location}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-blue-200 text-2xl font-bold"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Side: Game Stats */}
                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                        {/* Live Score */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="text-center mb-4">
                                <div className="text-lg font-semibold text-gray-600">Live Score</div>
                                <div className="text-sm text-gray-500">Period {gameData?.current_period || 1} • {formatTime(gameData?.time_remaining || 900)}</div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        {gameData?.home_team?.logo && (
                                            <img 
                                                src={gameData.home_team.logo} 
                                                alt={gameData.home_team.name}
                                                className="w-6 h-6 object-cover rounded"
                                            />
                                        )}
                                        <div className="font-semibold text-blue-900">
                                            {gameData?.home_team?.name || 'Home Team'}
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-blue-600">
                                        {gameData?.home_team?.score || 0}
                                    </div>
                                </div>

                                <div className="flex items-center justify-center">
                                    <div className="text-2xl font-bold text-gray-400">VS</div>
                                </div>

                                <div className="bg-red-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        {gameData?.away_team?.logo && (
                                            <img 
                                                src={gameData.away_team.logo} 
                                                alt={gameData.away_team.name}
                                                className="w-6 h-6 object-cover rounded"
                                            />
                                        )}
                                        <div className="font-semibold text-red-900">
                                            {gameData?.away_team?.name || 'Away Team'}
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-red-600">
                                        {gameData?.away_team?.score || 0}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Stats */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h3 className="text-lg font-semibold mb-4">📊 Recent Activity</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                    <span className="text-green-600">⚽</span>
                                    <div>
                                        <div className="font-medium">Goal by #12 Smith</div>
                                        <div className="text-sm text-gray-600">2:15 ago • Eagles 3-2 Hawks</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                    <span className="text-purple-600">🥅</span>
                                    <div>
                                        <div className="font-medium">Save by #1 Brown</div>
                                        <div className="text-sm text-gray-600">4:32 ago • Great defensive play</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                                    <span className="text-yellow-600">🏹</span>
                                    <div>
                                        <div className="font-medium">Shot attempt by #7 Johnson</div>
                                        <div className="text-sm text-gray-600">6:18 ago • Wide right</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Player Stats */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold mb-4">🏆 Top Performers</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-blue-900 mb-3">{gameData?.home_team?.name || 'Home Team'}</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>#12 Smith</span>
                                            <span>2 Goals, 1 Assist</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>#7 Johnson</span>
                                            <span>1 Goal, 2 Assists</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>#1 Brown (G)</span>
                                            <span>8 Saves</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium text-red-900 mb-3">{gameData?.away_team?.name || 'Away Team'}</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>#15 Davis</span>
                                            <span>2 Goals</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>#8 Miller</span>
                                            <span>1 Goal, 1 Assist</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>#30 Anderson (G)</span>
                                            <span>6 Saves</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Live Chat */}
                    <div className="w-80 bg-white border-l flex flex-col">
                        {/* Chat Header */}
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-semibold">💬 Live Chat</h3>
                            <p className="text-sm text-gray-600">{chatMessages.length} messages</p>
                        </div>

                        {/* Name Input (if not set) */}
                        {!isNameSet && (
                            <div className="p-4 bg-blue-50 border-b">
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Enter your name to join the chat:
                                    </label>
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSetUserName()}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        placeholder="Your name"
                                        maxLength="20"
                                    />
                                </div>
                                <button
                                    onClick={handleSetUserName}
                                    disabled={!userName.trim()}
                                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Join Chat
                                </button>
                            </div>
                        )}

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {chatMessages.map(message => (
                                <div key={message.id} className={`${
                                    message.type === 'system' ? 'text-center' : 'text-left'
                                }`}>
                                    <div className={`inline-block max-w-full ${
                                        message.type === 'system' 
                                            ? 'bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs'
                                            : message.user === userName
                                                ? 'bg-blue-600 text-white p-3 rounded-lg rounded-br-none ml-8'
                                                : 'bg-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none mr-8'
                                    }`}>
                                        {message.type !== 'system' && (
                                            <div className="text-xs opacity-75 mb-1">
                                                {message.user} • {formatTimestamp(message.timestamp)}
                                            </div>
                                        )}
                                        
                                        {message.type === 'media' ? (
                                            <div>
                                                <p className="mb-2">{message.message}</p>
                                                {message.mediaType === 'image' ? (
                                                    <img 
                                                        src={message.mediaUrl} 
                                                        alt="Shared media"
                                                        className="max-w-full h-32 object-cover rounded"
                                                    />
                                                ) : (
                                                    <video 
                                                        src={message.mediaUrl}
                                                        controls
                                                        className="max-w-full h-32 rounded"
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm">{message.message}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        {isNameSet && (
                            <div className="p-4 border-t bg-gray-50">
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => setShowMediaUpload(!showMediaUpload)}
                                        className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                                    >
                                        📷
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        placeholder="Type your message..."
                                        maxLength="200"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Send
                                    </button>
                                </div>

                                {showMediaUpload && (
                                    <div className="mb-2">
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    handleMediaUpload(file);
                                                }
                                            }}
                                            className="w-full text-xs"
                                        />
                                    </div>
                                )}
                                
                                <div className="text-xs text-gray-500">
                                    Chatting as: <span className="font-medium">{userName}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveSpectatorView;