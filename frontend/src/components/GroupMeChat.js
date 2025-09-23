import React, { useState, useEffect } from 'react';

const GroupMeChat = ({ teamId = null, channelType = "all" }) => {
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

    useEffect(() => {
        loadChannels();
    }, [teamId, channelType]);

    useEffect(() => {
        if (selectedChannel) {
            loadMessages(selectedChannel.id);
        }
    }, [selectedChannel]);

    const loadChannels = async () => {
        try {
            setLoading(true);
            console.log('🔍 Loading GroupMe channels...');
            const response = await fetch(`${backendUrl}/api/groupme/channels?active_only=true`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('🔍 Raw channels data:', data);
            
            let filteredChannels = data.channels || [];
            console.log('🔍 All channels found:', filteredChannels.length, filteredChannels);
            
            // Filter channels based on context
            if (teamId && channelType === "team") {
                // Show only this team's channel
                filteredChannels = filteredChannels.filter(c => c.team_id === teamId);
            } else if (channelType === "league") {
                // Show only league-wide channels
                filteredChannels = filteredChannels.filter(c => c.channel_type === "league");
            }
            // If channelType === "all", show all channels
            
            setChannels(filteredChannels);
            
            // Auto-select first channel if available
            if (filteredChannels.length > 0 && !selectedChannel) {
                setSelectedChannel(filteredChannels[0]);
            }
            
            if (filteredChannels.length === 0) {
                setError('No GroupMe channels available');
            }
        } catch (error) {
            setError('Failed to load GroupMe channels');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (channelId) => {
        try {
            const response = await fetch(`${backendUrl}/api/groupme/channels/${channelId}/messages?limit=50`);
            if (response.ok) {
                const data = await response.json();
                // Ensure we always have an array
                if (Array.isArray(data)) {
                    setMessages(data);
                } else if (Array.isArray(data.messages)) {
                    setMessages(data.messages);
                } else {
                    setMessages([]);
                }
            } else {
                console.warn('Messages endpoint not available, showing placeholder');
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
            setMessages([]); // Always set to empty array on error
        }
    };

    const formatTimeAgo = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            
            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
            if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
            return `${Math.floor(diffInMinutes / 1440)}d ago`;
        } catch {
            return 'Unknown time';
        }
    };

    const getChannelIcon = (channel) => {
        if (channel.channel_type === 'league') {
            return '🏆'; // Trophy for league
        }
        return '👥'; // People for team
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <div className="text-yellow-800 mb-2">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">GroupMe Not Available</h3>
                <p className="text-yellow-700">{error}</p>
                <p className="text-sm text-yellow-600 mt-2">Ask your admin to set up GroupMe integration.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Channel Selector */}
            {channels.length > 1 && (
                <div className="bg-gray-50 p-4 border-b">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">GroupMe Channels</h3>
                    <div className="flex flex-wrap gap-2">
                        {channels.map((channel) => (
                            <button
                                key={channel.id}
                                onClick={() => setSelectedChannel(channel)}
                                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedChannel?.id === channel.id
                                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="mr-2">{getChannelIcon(channel)}</span>
                                {channel.name}
                                {channel.team_name && (
                                    <span className="ml-2 text-xs text-gray-500">({channel.team_name})</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages Area */}
            {selectedChannel && (
                <div className="h-96 flex flex-col">
                    {/* Channel Header */}
                    <div className="bg-blue-600 text-white p-4 flex items-center">
                        <span className="text-2xl mr-3">{getChannelIcon(selectedChannel)}</span>
                        <div>
                            <h4 className="font-semibold">{selectedChannel.name}</h4>
                            <p className="text-sm text-blue-100">
                                {selectedChannel.channel_type === 'league' ? 'League-wide Chat' : 'Team Chat'}
                                {selectedChannel.team_name && ` • ${selectedChannel.team_name}`}
                            </p>
                        </div>
                        <div className="ml-auto">
                            <button
                                onClick={() => loadMessages(selectedChannel.id)}
                                className="p-2 hover:bg-blue-700 rounded"
                                title="Refresh messages"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p>No messages yet</p>
                                <p className="text-sm mt-1">Start chatting in GroupMe to see messages here!</p>
                            </div>
                        ) : Array.isArray(messages) ? (
                            messages.map((message) => (
                                <div key={message.id} className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-bold text-gray-600">
                                                {message.sender_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-gray-900">{message.sender_name}</span>
                                            <span className="text-sm text-gray-500">
                                                {formatTimeAgo(message.created_at)}
                                            </span>
                                            {message.message_type === 'command' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Command
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 mt-1">{message.text || 'Media message'}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>Unable to load messages</p>
                            </div>
                        )}
                    </div>

                    {/* Chat Instructions */}
                    <div className="bg-gray-50 p-4 border-t">
                        <div className="text-sm text-gray-600">
                            <div className="flex items-center mb-2">
                                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">How to participate:</span>
                            </div>
                            <ul className="text-xs space-y-1 ml-6">
                                <li>• Open GroupMe app and join the "{selectedChannel.name}" group</li>
                                <li>• Send messages there to participate in team discussions</li>
                                <li>• Use <code className="bg-gray-200 px-1 rounded">/rsvp yes</code>, <code className="bg-gray-200 px-1 rounded">/rsvp no</code>, or <code className="bg-gray-200 px-1 rounded">/rsvp maybe</code> for events</li>
                                <li>• Use <code className="bg-gray-200 px-1 rounded">/schedule</code> to see upcoming events</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {!selectedChannel && channels.length > 0 && (
                <div className="p-8 text-center text-gray-500">
                    <p>Select a channel to view messages</p>
                </div>
            )}
        </div>
    );
};

export default GroupMeChat;