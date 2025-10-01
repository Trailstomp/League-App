import React, { useState, useEffect } from 'react';
import { isAdmin, isCoach } from './PermissionsSystem';

const GroupMeChatUnified = ({ teamId = null, channelType = "all", currentUser }) => {
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [broadcastForm, setBroadcastForm] = useState({
        message: '',
        channel_ids: [],
        notification_type: 'message'
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

    useEffect(() => {
        loadChannels();
    }, [teamId, channelType]);

    useEffect(() => {
        if (selectedChannel) {
            loadMessages(selectedChannel.id);
            
            // Auto-refresh messages every 10 seconds
            const refreshInterval = setInterval(() => {
                loadMessages(selectedChannel.id);
            }, 10000);
            
            return () => clearInterval(refreshInterval);
        }
    }, [selectedChannel]);

    const loadChannels = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/groupme/channels?active_only=true`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            let filteredChannels = data.channels || [];
            
            // Filter channels based on context
            if (teamId && channelType === "team") {
                filteredChannels = filteredChannels.filter(c => c.team_id === teamId);
            } else if (channelType === "league") {
                filteredChannels = filteredChannels.filter(c => c.channel_type === "league");
            }
            
            setChannels(filteredChannels);
            
            if (filteredChannels.length > 0 && !selectedChannel) {
                setSelectedChannel(filteredChannels[0]);
            }
        } catch (err) {
            console.error('Error loading channels:', err);
            setError('Failed to load channels: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (channelId) => {
        try {
            const response = await fetch(`${backendUrl}/api/groupme/channels/${channelId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setMessages(Array.isArray(data.messages) ? data.messages : []);
            } else {
                setMessages([]);
            }
        } catch (err) {
            console.error('Error loading messages:', err);
            setMessages([]);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedChannel) return;
        
        try {
            setSending(true);
            const response = await fetch(`${backendUrl}/api/groupme/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newMessage.trim(),
                    channel_ids: [selectedChannel.id],
                    notification_type: 'message'
                })
            });

            if (response.ok) {
                // Optimistically add sent message to UI immediately
                const sentMessage = {
                    id: Date.now().toString(),
                    text: newMessage.trim(),
                    name: currentUser?.name || 'You',
                    created_at: Math.floor(Date.now() / 1000),
                    sender_type: 'user',
                    system: false,
                    sent_by_bot: true // Mark as sent by our system
                };
                setMessages(prev => [...prev, sentMessage]);
                
                setNewMessage('');
                setSuccess('Message sent successfully!');
                setTimeout(() => setSuccess(''), 3000);
                
                // Reload messages after a delay to get the actual message from GroupMe
                setTimeout(() => loadMessages(selectedChannel.id), 2000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to send message');
            }
        } catch (err) {
            setError('Failed to send message: ' + err.message);
            setTimeout(() => setError(''), 5000);
        } finally {
            setSending(false);
        }
    };

    const sendBroadcast = async () => {
        if (!broadcastForm.message.trim() || broadcastForm.channel_ids.length === 0) return;
        
        try {
            setSending(true);
            const response = await fetch(`${backendUrl}/api/groupme/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(broadcastForm)
            });

            if (response.ok) {
                setBroadcastForm({ message: '', channel_ids: [], notification_type: 'message' });
                setShowBroadcast(false);
                setSuccess('Broadcast sent successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to send broadcast');
            }
        } catch (err) {
            setError('Failed to send broadcast: ' + err.message);
            setTimeout(() => setError(''), 5000);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatMessageTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading chat...</div>
            </div>
        );
    }

    if (channels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="text-lg font-medium mb-2">No GroupMe channels available</div>
                <div className="text-sm">Configure GroupMe integration in Admin Portal to get started.</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-full bg-white">
            {/* Sidebar - Channels List (Desktop) / Channel Selector (Mobile) */}
            <div className="hidden md:flex md:w-80 bg-gray-50 border-r flex-col">
                {/* Header */}
                <div className="p-4 border-b bg-white">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">League Chat</h2>
                        {(isAdmin(currentUser) || isCoach(currentUser)) && (
                            <button
                                onClick={() => setShowBroadcast(true)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                📢 Broadcast
                            </button>
                        )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{channels.length} channel{channels.length !== 1 ? 's' : ''}</div>
                </div>

                {/* Channels List */}
                <div className="flex-1 overflow-y-auto">
                    {channels.map((channel) => (
                        <div
                            key={channel.id}
                            onClick={() => setSelectedChannel(channel)}
                            className={`p-4 cursor-pointer border-b hover:bg-gray-100 transition-colors ${
                                selectedChannel?.id === channel.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                            }`}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                    {getInitials(channel.name)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">{channel.name}</div>
                                    <div className="text-sm text-gray-500 capitalize">{channel.channel_type} • Active</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Mobile Channel Selector */}
                <div className="md:hidden p-4 bg-white border-b">
                    <select 
                        value={selectedChannel?.id || ''} 
                        onChange={(e) => {
                            const channel = channels.find(c => c.id === e.target.value);
                            setSelectedChannel(channel);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select a channel...</option>
                        {channels.map((channel) => (
                            <option key={channel.id} value={channel.id}>
                                {channel.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                {selectedChannel ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b bg-white hidden md:block">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                    {getInitials(selectedChannel.name)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{selectedChannel.name}</h3>
                                    <div className="text-sm text-gray-500 capitalize">{selectedChannel.channel_type} channel</div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                            
                            {success && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                                    {success}
                                </div>
                            )}

                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <div className="text-lg mb-2">💬</div>
                                    <div>No messages yet. Be the first to send a message!</div>
                                </div>
                            ) : (
                                messages.map((message, index) => (
                                    <div key={message.id || index} className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                            {getInitials(message.sender_name || 'Unknown')}
                                        </div>
                                        <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-900 text-sm">
                                                    {message.sender_name || 'Unknown'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatMessageTime(message.created_at)}
                                                </span>
                                            </div>
                                            <div className="text-gray-700">{message.text}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 bg-white border-t">
                            <div className="flex space-x-3">
                                <div className="flex-1">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={`Message ${selectedChannel.name}...`}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows="1"
                                        style={{ minHeight: '44px', maxHeight: '120px' }}
                                        disabled={sending}
                                    />
                                </div>
                                <button
                                    onClick={sendMessage}
                                    disabled={sending || !newMessage.trim()}
                                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                        sending || !newMessage.trim()
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {sending ? '📤' : '➤'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <div className="text-4xl mb-4">💬</div>
                            <div>Select a channel to start chatting</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Broadcast Modal */}
            {showBroadcast && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">📢 Broadcast Message</h3>
                            <button
                                onClick={() => setShowBroadcast(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Channel Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Channels
                            </label>
                            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                                {channels.map((channel) => (
                                    <label key={channel.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                        <input
                                            type="checkbox"
                                            checked={broadcastForm.channel_ids.includes(channel.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setBroadcastForm({
                                                        ...broadcastForm,
                                                        channel_ids: [...broadcastForm.channel_ids, channel.id]
                                                    });
                                                } else {
                                                    setBroadcastForm({
                                                        ...broadcastForm,
                                                        channel_ids: broadcastForm.channel_ids.filter(id => id !== channel.id)
                                                    });
                                                }
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
                                                {getInitials(channel.name)}
                                            </div>
                                            <span className="text-sm">{channel.name}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Message */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Message
                            </label>
                            <textarea
                                value={broadcastForm.message}
                                onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})}
                                placeholder="Enter your broadcast message..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="4"
                            />
                        </div>

                        {/* Notification Type */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notification Type
                            </label>
                            <select
                                value={broadcastForm.notification_type}
                                onChange={(e) => setBroadcastForm({...broadcastForm, notification_type: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="message">Message</option>
                                <option value="announcement">Announcement</option>
                                <option value="alert">Alert</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowBroadcast(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                disabled={sending}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendBroadcast}
                                disabled={sending || !broadcastForm.message.trim() || broadcastForm.channel_ids.length === 0}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                                    sending || !broadcastForm.message.trim() || broadcastForm.channel_ids.length === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {sending ? 'Sending...' : 'Send Broadcast'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupMeChatUnified;