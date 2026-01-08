import React, { useState, useEffect } from 'react';

const GroupMeChat = ({ teamId = null, channelType = "all", showAllChannels = true }) => {
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

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
            
            let allChannels = data.channels || [];
            console.log('🔍 All channels found:', allChannels.length, allChannels);
            
            // If showAllChannels is true, show all channels but prioritize current team's channel
            if (showAllChannels) {
                // Sort channels: current team's channel first, then league channels, then other teams
                allChannels = allChannels.sort((a, b) => {
                    // Current team's channel first
                    if (teamId && a.team_id === teamId) return -1;
                    if (teamId && b.team_id === teamId) return 1;
                    // Then league channels
                    if (a.channel_type === 'league') return -1;
                    if (b.channel_type === 'league') return 1;
                    // Then alphabetically
                    return (a.name || '').localeCompare(b.name || '');
                });
            } else {
                // Original filtering behavior
                if (teamId && channelType === "team") {
                    allChannels = allChannels.filter(c => c.team_id === teamId);
                } else if (channelType === "league") {
                    allChannels = allChannels.filter(c => c.channel_type === "league");
                }
            }
            
            setChannels(allChannels);
            console.log('🔍 Channels set:', allChannels.length, allChannels);
            
            // Auto-select the current team's channel or first channel if available
            if (allChannels.length > 0 && !selectedChannel) {
                const teamChannel = teamId ? allChannels.find(c => c.team_id === teamId) : null;
                setSelectedChannel(teamChannel || allChannels[0]);
                console.log('🔍 Auto-selected channel:', teamChannel || allChannels[0]);
            }
            
            if (allChannels.length === 0) {
                setError('No GroupMe channels available');
                console.log('🔍 No channels available');
            }
        } catch (error) {
            console.error('Failed to load channels:', error);
            setChannels([]);
            setSelectedChannel(null);
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

    const sendMessage = async () => {
        console.log('🚀 sendMessage called', { 
            newMessage: newMessage.trim(), 
            selectedChannel: selectedChannel?.id, 
            sending 
        });
        
        if (!newMessage.trim() || !selectedChannel || sending) {
            console.log('❌ Send conditions not met:', {
                hasMessage: !!newMessage.trim(),
                hasChannel: !!selectedChannel,
                notSending: !sending
            });
            return;
        }
        
        try {
            console.log('📤 Starting message send...');
            setSending(true);
            const formData = new FormData();
            formData.append('message', newMessage.trim());
            formData.append('channel_ids', JSON.stringify([selectedChannel.id]));
            formData.append('notification_type', 'message');
            
            console.log('📋 FormData prepared:', {
                message: newMessage.trim(),
                channel_ids: [selectedChannel.id],
                notification_type: 'message'
            });
            
            const response = await fetch(`${backendUrl}/api/groupme/broadcast`, {
                method: 'POST',
                body: formData
            });
            
            console.log('📡 Response received:', {
                status: response.status,
                ok: response.ok
            });
            
            if (response.ok) {
                console.log('✅ Message sent successfully');
                setNewMessage('');
                // Refresh messages to show the sent message
                await loadMessages(selectedChannel.id);
            } else {
                const errorData = await response.json();
                console.log('❌ Send failed:', errorData);
                alert(`Failed to send message: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('💥 Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            console.log('🏁 Send process finished');
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
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
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">No GroupMe Channels Available</h3>
                <p className="text-yellow-700 mb-4">{error}</p>
                <div className="space-y-2">
                    <p className="text-sm text-yellow-600">To see your GroupMe groups in Team Chat:</p>
                    <p className="text-sm text-yellow-600">1. Go to <strong>Admin Portal → API Integrations</strong></p>
                    <p className="text-sm text-yellow-600">2. Click <strong>"Manage Channels"</strong> in GroupMe section</p>
                    <p className="text-sm text-yellow-600">3. Create channels from your available GroupMe groups</p>
                </div>
                <a 
                    href="/admin" 
                    className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Go to Admin Portal
                </a>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Channel Selector - Always show if channels exist */}
            {channels.length >= 1 && (
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
                                {selectedChannel.channel_type === 'league' ? 'League Chat' : 'Team Chat'}
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

                    {/* Messages Display */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-96 max-h-96">
                        {messages.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-lg font-medium mb-2">No messages yet</p>
                                <p className="text-sm">Be the first to send a message to this channel!</p>
                            </div>
                        ) : Array.isArray(messages) ? (
                            messages.map((message) => (
                                <div key={message.id} className="flex space-x-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-bold text-white">
                                                {message.sender_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="font-semibold text-gray-900">{message.sender_name}</span>
                                            <span className="text-xs text-gray-500">
                                                {formatTimeAgo(message.created_at)}
                                            </span>
                                            {message.message_type === 'command' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Command
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed break-words">{message.text || 'Media message'}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>Unable to load messages</p>
                            </div>
                        )}
                    </div>

                    {/* Message Input Section */}
                    <div className="border-t bg-white p-4">
                        <div className="flex space-x-3">
                            <div className="flex-1">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={`Send a message to ${selectedChannel.name}...`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                    disabled={sending}
                                />
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={!newMessage.trim() || sending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {sending ? (
                                    <div className="flex items-center space-x-1">
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Sending</span>
                                    </div>
                                ) : (
                                    'Send'
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Press Enter to send, Shift+Enter for new line
                        </p>
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