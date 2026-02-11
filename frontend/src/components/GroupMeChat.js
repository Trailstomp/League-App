import React, { useState, useEffect } from 'react';

const GroupMeChat = ({ teamId = null, channelType = "all", showAllChannels = true, currentUser = null }) => {
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

    // Get user's roles - normalize to array
    const getUserRoles = () => {
        if (!currentUser) return [];
        const roles = [];
        if (currentUser.role) roles.push(currentUser.role);
        if (Array.isArray(currentUser.roles)) {
            currentUser.roles.forEach(r => {
                if (!roles.includes(r)) roles.push(r);
            });
        }
        return roles;
    };

    // Get user's team IDs
    const getUserTeamIds = () => {
        if (!currentUser) return [];
        const teamIds = [];
        if (currentUser.teamId) teamIds.push(currentUser.teamId);
        if (Array.isArray(currentUser.teamAssignments)) {
            currentUser.teamAssignments.forEach(ta => {
                if (ta.teamId && !teamIds.includes(ta.teamId)) {
                    teamIds.push(ta.teamId);
                }
            });
        }
        // Also include the current teamId prop if viewing a specific team
        if (teamId && !teamIds.includes(teamId)) {
            teamIds.push(teamId);
        }
        return teamIds;
    };

    // Check if user can access a channel
    const canAccessChannel = (channel) => {
        // If no user, no access (unless channel explicitly allows anonymous)
        if (!currentUser) {
            console.log(`🚫 No user - denying access to channel: ${channel.name}`);
            return false;
        }

        const userRoles = getUserRoles();
        const userTeamIds = getUserTeamIds();
        const isAdmin = userRoles.includes('admin') || userRoles.includes('league_admin');

        // Admins can see all channels
        if (isAdmin) {
            console.log(`✅ Admin access to channel: ${channel.name}`);
            return true;
        }

        // Check role-based access - default to all roles if not set
        const channelRoles = Array.isArray(channel.access_roles) && channel.access_roles.length > 0 
            ? channel.access_roles 
            : ['admin', 'coach', 'player'];
        const hasRoleAccess = userRoles.some(role => channelRoles.includes(role));
        
        if (!hasRoleAccess) {
            console.log(`🚫 No role access to channel: ${channel.name} (user roles: ${userRoles}, channel roles: ${channelRoles})`);
            return false;
        }

        // For league-wide channels, role access is enough
        if (channel.channel_type === 'league') {
            console.log(`✅ League channel access: ${channel.name}`);
            return true;
        }

        // For team channels, check if user is on one of the channel's teams
        // Handle undefined, null, or empty array for team_ids
        let channelTeamIds = [];
        if (Array.isArray(channel.team_ids) && channel.team_ids.length > 0) {
            channelTeamIds = channel.team_ids;
        } else if (channel.team_id) {
            channelTeamIds = [channel.team_id];
        }
        
        if (channelTeamIds.length === 0) {
            // No teams assigned to this team channel - legacy channel, allow role-based access
            console.log(`⚠️ Team channel has no teams assigned, allowing role-based access: ${channel.name}`);
            return true;
        }

        const hasTeamAccess = channelTeamIds.some(ctid => userTeamIds.includes(ctid));
        
        if (!hasTeamAccess) {
            console.log(`🚫 No team access to channel: ${channel.name} (user teams: ${userTeamIds}, channel teams: ${channelTeamIds})`);
            return false;
        }

        console.log(`✅ Team + role access to channel: ${channel.name}`);
        return true;
    };

    useEffect(() => {
        loadChannels();
    }, [teamId, channelType, currentUser]);

    useEffect(() => {
        if (selectedChannel) {
            loadMessages(selectedChannel.id);
        }
    }, [selectedChannel]);

    const loadChannels = async () => {
        try {
            setLoading(true);
            console.log('🔍 Loading GroupMe channels...');
            console.log('🔍 Current user:', currentUser);
            
            const response = await fetch(`${backendUrl}/api/groupme/channels?active_only=true`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('🔍 Raw channels data:', data);
            
            let allChannels = data.channels || [];
            console.log('🔍 All channels found:', allChannels.length);
            
            // Filter channels based on user permissions
            let accessibleChannels = allChannels.filter(channel => canAccessChannel(channel));
            console.log('🔍 Accessible channels after filtering:', accessibleChannels.length);
            
            // Sort channels: current team's channel first, then league channels, then other teams
            accessibleChannels = accessibleChannels.sort((a, b) => {
                // Current team's channel first
                const aTeamIds = a.team_ids || (a.team_id ? [a.team_id] : []);
                const bTeamIds = b.team_ids || (b.team_id ? [b.team_id] : []);
                
                if (teamId && aTeamIds.includes(teamId)) return -1;
                if (teamId && bTeamIds.includes(teamId)) return 1;
                // Then league channels
                if (a.channel_type === 'league') return -1;
                if (b.channel_type === 'league') return 1;
                // Then alphabetically
                return (a.name || '').localeCompare(b.name || '');
            });
            
            setChannels(accessibleChannels);
            console.log('🔍 Channels set:', accessibleChannels.length);
            
            // Auto-select the current team's channel or first channel if available
            if (accessibleChannels.length > 0 && !selectedChannel) {
                const teamChannel = teamId ? accessibleChannels.find(c => {
                    const cTeamIds = c.team_ids || (c.team_id ? [c.team_id] : []);
                    return cTeamIds.includes(teamId);
                }) : null;
                setSelectedChannel(teamChannel || accessibleChannels[0]);
                console.log('🔍 Auto-selected channel:', teamChannel || accessibleChannels[0]);
            }
            
            if (accessibleChannels.length === 0) {
                if (!currentUser) {
                    setError('Please log in to view team chat channels');
                } else {
                    setError('No GroupMe channels available for your team');
                }
                console.log('🔍 No accessible channels');
            } else {
                setError('');
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

    const isCurrentTeamChannel = (channel) => {
        return teamId && channel.team_id === teamId;
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
                    <p className="text-sm text-yellow-600">2. Click <strong>&quot;Manage Channels&quot;</strong> in GroupMe section</p>
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
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">GroupMe Channels</h3>
                        <span className="text-xs text-gray-500">{channels.length} channel{channels.length !== 1 ? 's' : ''} available</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {channels.map((channel) => (
                            <button
                                key={channel.id}
                                onClick={() => setSelectedChannel(channel)}
                                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedChannel?.id === channel.id
                                        ? 'bg-blue-600 text-white border-2 border-blue-600'
                                        : isCurrentTeamChannel(channel)
                                            ? 'bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="mr-2">{getChannelIcon(channel)}</span>
                                {channel.name}
                                {isCurrentTeamChannel(channel) && selectedChannel?.id !== channel.id && (
                                    <span className="ml-2 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">Your Team</span>
                                )}
                                {channel.team_name && !isCurrentTeamChannel(channel) && (
                                    <span className="ml-2 text-xs text-gray-500">({channel.team_name})</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages Area */}
            {selectedChannel && (
                <div className="flex flex-col" style={{ height: '500px' }}>
                    {/* Channel Header */}
                    <div className="bg-blue-600 text-white p-4 flex items-center flex-shrink-0">
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

                    {/* Message Input Section - AT TOP */}
                    <div className="border-b bg-white p-4 flex-shrink-0">
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
                                disabled={sending || !newMessage.trim()}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors self-end ${
                                    sending || !newMessage.trim()
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {sending ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending
                                    </span>
                                ) : 'Send'}
                            </button>
                        </div>
                    </div>

                    {/* Messages Display - Newest First */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-lg font-medium mb-2">No messages yet</p>
                                <p className="text-sm">Be the first to send a message to this channel!</p>
                            </div>
                        ) : Array.isArray(messages) ? (
                            [...messages]
                                .sort((a, b) => {
                                    // Sort newest first
                                    const timeA = a.created_at || 0;
                                    const timeB = b.created_at || 0;
                                    return timeB - timeA;
                                })
                                .map((message) => (
                                <div key={message.id} className="flex space-x-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-bold text-white">
                                                {message.sender_name?.charAt(0).toUpperCase() || '?'}
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
                </div>
            )}

            {/* No Channel Selected */}
            {!selectedChannel && channels.length > 0 && (
                <div className="p-8 text-center text-gray-500">
                    <p>Select a channel to view messages</p>
                </div>
            )}
        </div>
    );
};

export default GroupMeChat;