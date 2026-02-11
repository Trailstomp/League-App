import React, { useState, useEffect } from 'react';

const GroupMeManager = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [channels, setChannels] = useState([]);
    const [availableGroups, setAvailableGroups] = useState([]);
    const [teams, setTeams] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form states
    const [newChannelForm, setNewChannelForm] = useState({
        name: '',
        groupme_group_id: '',
        channel_type: 'team',
        team_id: '',
        team_ids: [], // Multi-select for teams
        existing_bot_id: '', // Add bot ID field
        notification_settings: {},
        access_roles: ['admin', 'coach', 'player'] // Who can access this channel
    });

    const [editingChannel, setEditingChannel] = useState(null);
    const [inputMethod, setInputMethod] = useState('dropdown'); // 'dropdown' or 'manual'
    const [botMethod, setBotMethod] = useState('auto'); // 'auto' or 'existing'

    const [broadcastForm, setBroadcastForm] = useState({
        message: '',
        channel_ids: [],
        notification_type: 'announcement'
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

    useEffect(() => {
        loadInitialData();
    }, []);

    // Auto-load available GroupMe groups when entering create-channel view
    useEffect(() => {
        if (activeView === 'create-channel' && !editingChannel && availableGroups.length === 0) {
            loadAvailableGroups();
        }
    }, [activeView]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadChannels(),
                loadTeams(),
                loadDashboardStats()
            ]);
        } catch (error) {
            setError('Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const loadChannels = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/groupme/channels`);
            const data = await response.json();
            setChannels(data.channels || []);
        } catch (error) {
            console.error('Failed to load channels:', error);
        }
    };

    const loadAvailableGroups = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await fetch(`${backendUrl}/api/groupme/groups`);
            const data = await response.json();
            
            if (response.ok) {
                if (data.error) {
                    setError(`GroupMe API Error: ${data.error}`);
                    setAvailableGroups([]);
                } else {
                    setAvailableGroups(data.groups || []);
                    if (data.groups && data.groups.length === 0) {
                        setError('No GroupMe groups found. Make sure your API token has access to groups.');
                    }
                }
            } else {
                // Handle different HTTP error statuses
                if (response.status === 400) {
                    setError('GroupMe not configured. Please add GROUPME_ACCESS_TOKEN to environment variables.');
                } else if (response.status === 401) {
                    setError('GroupMe API authentication failed. Check your access token.');
                } else if (response.status === 403) {
                    setError('GroupMe API access forbidden. Check token permissions.');
                } else {
                    setError(`Failed to load GroupMe groups (Status: ${response.status}). Check server logs.`);
                }
                setAvailableGroups([]);
            }
        } catch (error) {
            console.error('Failed to load available groups:', error);
            setError(`Network error loading GroupMe groups: ${error.message}`);
            setAvailableGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const loadTeams = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/league-data`);
            const data = await response.json();
            setTeams(data.teams || []);
        } catch (error) {
            console.error('Failed to load teams:', error);
        }
    };

    const loadDashboardStats = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/groupme/dashboard/stats`);
            const data = await response.json();
            setDashboardStats(data);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
    };

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', newChannelForm.name);
            formData.append('groupme_group_id', newChannelForm.groupme_group_id);
            formData.append('channel_type', newChannelForm.channel_type);
            if (newChannelForm.team_ids && newChannelForm.team_ids.length > 0) {
                formData.append('team_ids', JSON.stringify(newChannelForm.team_ids));
            }
            if (newChannelForm.team_id) {
                formData.append('team_id', newChannelForm.team_id);
            }
            if (newChannelForm.existing_bot_id) {
                formData.append('existing_bot_id', newChannelForm.existing_bot_id);
            }
            formData.append('notification_settings', JSON.stringify(newChannelForm.notification_settings));
            formData.append('access_roles', JSON.stringify(newChannelForm.access_roles));

            const response = await fetch(`${backendUrl}/api/groupme/channels`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Channel created successfully! Bot ID: ${result.bot_id}`);
                setNewChannelForm({
                    name: '',
                    groupme_group_id: '',
                    channel_type: 'team',
                    team_id: '',
                    team_ids: [],
                    existing_bot_id: '',
                    notification_settings: {},
                    access_roles: ['admin', 'coach', 'player']
                });
                await loadChannels();
                await loadDashboardStats();
                setActiveView('channels');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create channel');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditChannel = (channel) => {
        setEditingChannel(channel);
        setNewChannelForm({
            name: channel.name,
            groupme_group_id: channel.groupme_group_id,
            channel_type: channel.channel_type,
            team_id: channel.team_id || '',
            team_ids: channel.team_ids || (channel.team_id ? [channel.team_id] : []),
            existing_bot_id: channel.groupme_bot_id || '',
            notification_settings: channel.notification_settings || {},
            access_roles: channel.access_roles || ['admin', 'coach', 'player']
        });
        setActiveView('create-channel');
    };

    const handleUpdateChannel = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            const updateData = {
                name: newChannelForm.name,
                channel_type: newChannelForm.channel_type,
                team_id: newChannelForm.team_id || null,
                team_ids: newChannelForm.team_ids || [],
                notification_settings: newChannelForm.notification_settings,
                access_roles: newChannelForm.access_roles || ['admin', 'coach', 'player']
            };
            
            const response = await fetch(`${backendUrl}/api/groupme/channels/${editingChannel.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                alert('Channel updated successfully!');
                setNewChannelForm({
                    name: '',
                    groupme_group_id: '',
                    channel_type: 'team',
                    team_id: '',
                    team_ids: [],
                    existing_bot_id: '',
                    notification_settings: {},
                    access_roles: ['admin', 'coach', 'player']
                });
                setEditingChannel(null);
                await loadChannels();
                await loadDashboardStats();
                setActiveView('channels');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update channel');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChannel = async (channelId, channelName) => {
        if (!window.confirm(`Are you sure you want to delete the channel "${channelName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/groupme/channels/${channelId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Channel deleted successfully');
                await loadChannels();
                await loadDashboardStats();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete channel');
            }
        } catch (error) {
            setError(`Failed to delete channel: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleChannel = async (channelId, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/groupme/channels/${channelId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    is_active: !currentStatus 
                })
            });

            if (response.ok) {
                alert(`Channel ${action}d successfully`);
                await loadChannels();
                await loadDashboardStats();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to ${action} channel`);
            }
        } catch (error) {
            setError(`Failed to ${action} channel: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('message', broadcastForm.message);
            formData.append('channel_ids', JSON.stringify(broadcastForm.channel_ids));
            formData.append('notification_type', broadcastForm.notification_type);

            const response = await fetch(`${backendUrl}/api/groupme/broadcast`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                setBroadcastForm({
                    message: '',
                    channel_ids: [],
                    notification_type: 'announcement'
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to broadcast message');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderDashboard = () => {
        // Calculate stats from local channels data for more accuracy
        const localStats = {
            active_channels: channels.filter(c => c.is_active).length,
            team_channels: channels.filter(c => c.channel_type === 'team').length,
            league_channels: channels.filter(c => c.channel_type === 'league').length,
            recent_messages: dashboardStats.recent_messages || 0
        };
        
        return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">GroupMe Integration Dashboard</h2>
            
            {/* Configuration Status */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Configuration Status</h3>
                        <p className="text-sm text-gray-600">Check your GroupMe API setup</p>
                    </div>
                    <button
                        onClick={loadAvailableGroups}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                        Test Configuration
                    </button>
                </div>
                
                {/* Show success if we have channels, regardless of API test */}
                {channels.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                        <div className="flex items-center">
                            <span className="text-green-500 mr-2">✅</span>
                            <div>
                                <p className="text-sm font-medium text-green-800">Channels Active</p>
                                <p className="text-sm text-green-700">You have {localStats.active_channels} active GroupMe channel(s) configured</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {error && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                            <span className="text-yellow-500 mr-2">⚠️</span>
                            <div>
                                <p className="text-sm font-medium text-yellow-800">API Configuration Note</p>
                                <p className="text-sm text-yellow-700 mt-1">{error}</p>
                                <p className="text-xs text-yellow-600 mt-2">
                                    Note: Your existing channels still work. This only affects discovering new GroupMe groups.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                {!error && availableGroups.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                            <span className="text-green-500 mr-2">✅</span>
                            <div>
                                <p className="text-sm font-medium text-green-800">API Configuration Working</p>
                                <p className="text-sm text-green-700">Found {availableGroups.length} GroupMe groups available</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-md">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Channels</p>
                            <p className="text-2xl font-semibold text-gray-900">{localStats.active_channels}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-md">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Recent Messages</p>
                            <p className="text-2xl font-semibold text-gray-900">{localStats.recent_messages}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-md">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Team Channels</p>
                            <p className="text-2xl font-semibold text-gray-900">{localStats.team_channels}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-md">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19l5-5 5 5m-5-5V7a1 1 0 011-1h4a1 1 0 011 1v7" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">League Channels</p>
                            <p className="text-2xl font-semibold text-gray-900">{localStats.league_channels}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Integration Status */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Integration Status</h3>
                        <p className="text-sm text-gray-600">
                            {localStats.active_channels > 0 
                                ? `${localStats.active_channels} channel(s) active and ready` 
                                : 'No active channels configured'}
                        </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        localStats.active_channels > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {localStats.active_channels > 0 ? 'Active' : 'Setup Required'}
                    </div>
                </div>
            </div>
        </div>
    );
    };

    const renderChannels = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">GroupMe Channels</h2>
                <button
                    onClick={() => setActiveView('create-channel')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Add Channel
                </button>
            </div>

            {/* Channels List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Channel Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Teams
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Access
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {channels.map((channel) => {
                            // Get team names from team_ids or team_id
                            const teamIds = channel.team_ids || (channel.team_id ? [channel.team_id] : []);
                            const teamNames = teamIds.map(tid => {
                                const t = teams.find(tm => tm.id === tid);
                                return t?.name || tid;
                            });
                            
                            return (
                            <tr key={channel.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{channel.name}</div>
                                    <div className="text-sm text-gray-500">Group ID: {channel.groupme_group_id}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        channel.channel_type === 'league' 
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {channel.channel_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {channel.channel_type === 'league' ? (
                                        <span className="text-purple-600 font-medium">All Teams</span>
                                    ) : teamNames.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {teamNames.slice(0, 3).map((name, i) => (
                                                <span key={i} className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                                                    {name}
                                                </span>
                                            ))}
                                            {teamNames.length > 3 && (
                                                <span className="text-gray-500 text-xs">+{teamNames.length - 3} more</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">No teams</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs">
                                    <div className="flex gap-1">
                                        {(channel.access_roles || ['admin', 'coach', 'player']).map(role => (
                                            <span key={role} className={`px-1.5 py-0.5 rounded ${
                                                role === 'admin' ? 'bg-amber-100 text-amber-700' :
                                                role === 'coach' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {role === 'admin' ? '👑' : role === 'coach' ? '📋' : '🏃'}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        channel.is_active 
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {channel.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button 
                                        onClick={() => handleEditChannel(channel)}
                                        disabled={loading}
                                        className="text-indigo-600 hover:text-indigo-900 mr-3 disabled:opacity-50"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleToggleChannel(channel.id, channel.is_active)}
                                        disabled={loading}
                                        className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50"
                                    >
                                        {channel.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteChannel(channel.id, channel.name)}
                                        disabled={loading}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCreateChannel = () => (
        <div className="space-y-6">
            <div className="flex items-center">
                <button
                    onClick={() => setActiveView('channels')}
                    className="mr-4 text-gray-600 hover:text-gray-900"
                >
                    ← Back
                </button>
                <h2 className="text-2xl font-bold text-gray-900">
                    {editingChannel ? 'Edit GroupMe Channel' : 'Create GroupMe Channel'}
                </h2>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={editingChannel ? handleUpdateChannel : handleCreateChannel} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Channel Name
                        </label>
                        <input
                            type="text"
                            value={newChannelForm.name}
                            onChange={(e) => setNewChannelForm({...newChannelForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Varsity Team Chat"
                            required
                        />
                    </div>

                    {/* Channel Type - Show for both create and edit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Channel Type
                        </label>
                        <select
                            value={newChannelForm.channel_type}
                            onChange={(e) => setNewChannelForm({...newChannelForm, channel_type: e.target.value, team_id: e.target.value === 'league' ? '' : newChannelForm.team_id, team_ids: e.target.value === 'league' ? [] : newChannelForm.team_ids})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="team">Team Channel(s)</option>
                            <option value="league">League-wide Channel</option>
                        </select>
                    </div>

                    {/* Team Multi-Select - Show for both create and edit when type is 'team' */}
                    {newChannelForm.channel_type === 'team' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assign to Teams (Select multiple)
                            </label>
                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                                {teams
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((team) => (
                                        <label key={team.id} className="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newChannelForm.team_ids?.includes(team.id)}
                                                onChange={(e) => {
                                                    const newTeamIds = e.target.checked
                                                        ? [...(newChannelForm.team_ids || []), team.id]
                                                        : (newChannelForm.team_ids || []).filter(id => id !== team.id);
                                                    setNewChannelForm({
                                                        ...newChannelForm, 
                                                        team_ids: newTeamIds,
                                                        team_id: newTeamIds[0] || '' // Keep first for backwards compat
                                                    });
                                                }}
                                                className="mr-3 h-4 w-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm">{team.name}</span>
                                        </label>
                                    ))}
                            </div>
                            {newChannelForm.team_ids?.length > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                    {newChannelForm.team_ids.length} team(s) selected
                                </p>
                            )}
                            {editingChannel && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Select which teams have access to this GroupMe channel
                                </p>
                            )}
                        </div>
                    )}

                    {/* Access Roles */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Who Can Access This Channel?
                        </label>
                        <div className="space-y-2 border border-gray-300 rounded-md p-3 bg-gray-50">
                            {[
                                { value: 'admin', label: 'League Admins', icon: '👑' },
                                { value: 'coach', label: 'Team Coaches', icon: '📋' },
                                { value: 'player', label: 'Players', icon: '🏃' }
                            ].map((role) => (
                                <label key={role.value} className="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newChannelForm.access_roles?.includes(role.value)}
                                        onChange={(e) => {
                                            const newRoles = e.target.checked
                                                ? [...(newChannelForm.access_roles || []), role.value]
                                                : (newChannelForm.access_roles || []).filter(r => r !== role.value);
                                            setNewChannelForm({...newChannelForm, access_roles: newRoles});
                                        }}
                                        className="mr-3 h-4 w-4 text-blue-600 rounded"
                                    />
                                    <span className="mr-2">{role.icon}</span>
                                    <span className="text-sm">{role.label}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Only users with selected roles will see this channel
                        </p>
                    </div>

                    {!editingChannel && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                GroupMe Group Configuration
                            </label>
                        
                        {/* Input method toggle */}
                        <div className="flex space-x-4 mb-4">
                            <button
                                type="button"
                                onClick={() => setInputMethod('dropdown')}
                                className={`px-3 py-2 text-sm rounded-md ${
                                    inputMethod === 'dropdown'
                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                📋 Select from Groups
                            </button>
                            <button
                                type="button"
                                onClick={() => setInputMethod('manual')}
                                className={`px-3 py-2 text-sm rounded-md ${
                                    inputMethod === 'manual'
                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                ✍️ Enter Group ID Manually
                            </button>
                        </div>

                        {inputMethod === 'dropdown' ? (
                            /* Dropdown Selection */
                            <div>
                                <div className="flex space-x-2 mb-2">
                                    <select
                                        value={newChannelForm.groupme_group_id}
                                        onChange={(e) => setNewChannelForm({...newChannelForm, groupme_group_id: e.target.value})}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">
                                            {availableGroups.length > 0 ? 'Select GroupMe group...' : 'Loading groups...'}
                                        </option>
                                        {availableGroups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.name} ({group.members_count} members)
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={loadAvailableGroups}
                                        disabled={loading}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                                    >
                                        {loading ? '⟳' : 'Refresh'}
                                    </button>
                                </div>
                                
                                {availableGroups.length === 0 && !loading && (
                                    <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-2">
                                        <div className="flex items-start">
                                            <span className="text-amber-500 mr-2">⚠️</span>
                                            <div>
                                                <p className="font-medium">No GroupMe groups found</p>
                                                <p className="text-xs mt-1">
                                                    This could mean: (1) GroupMe API not configured, (2) No groups available, or (3) API error. 
                                                    Try manual input below or check your GroupMe API configuration.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Manual Input */
                            <div>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        value={newChannelForm.groupme_group_id}
                                        onChange={(e) => setNewChannelForm({...newChannelForm, groupme_group_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., 12345678"
                                        required
                                    />
                                </div>
                                
                                {/* Instructions for getting Group ID */}
                                <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-3">
                                    <div className="flex items-start">
                                        <span className="text-blue-500 mr-2">ℹ️</span>
                                        <div>
                                            <p className="font-medium mb-2">How to find your GroupMe Group ID:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                                <li>Open GroupMe app or web version</li>
                                                <li>Go to your group</li>
                                                <li>Click the group name at the top</li>
                                                <li>Click "Share Group" or look for sharing options</li>
                                                <li>The Group ID is in the share URL: <code className="bg-blue-100 px-1 rounded">groupme.com/join_group/XXXXXXXX/XXXXXX</code></li>
                                                <li>Copy the first set of numbers (the Group ID)</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                                <strong>Error:</strong> {error}
                            </div>
                        )}
                    </div>
                    )}

                    {/* Bot Configuration Section */}
                    {!editingChannel && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bot Configuration
                        </label>
                        
                        {/* Bot method toggle */}
                        <div className="flex space-x-4 mb-4">
                            <button
                                type="button"
                                onClick={() => setBotMethod('auto')}
                                className={`px-3 py-2 text-sm rounded-md ${
                                    botMethod === 'auto'
                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                🤖 Create Bot Automatically
                            </button>
                            <button
                                type="button"
                                onClick={() => setBotMethod('existing')}
                                className={`px-3 py-2 text-sm rounded-md ${
                                    botMethod === 'existing'
                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                🔗 Use Existing Bot ID
                            </button>
                        </div>

                        {botMethod === 'auto' ? (
                            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
                                <div className="flex items-start">
                                    <span className="text-green-500 mr-2">✅</span>
                                    <div>
                                        <p className="font-medium">Automatic Bot Creation</p>
                                        <p className="text-xs mt-1">
                                            The system will automatically create a new bot for this GroupMe group using your API credentials. 
                                            The bot will be named "{newChannelForm.name} League Bot" and configured with the webhook URL.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="text"
                                    value={newChannelForm.existing_bot_id}
                                    onChange={(e) => setNewChannelForm({...newChannelForm, existing_bot_id: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                    placeholder="Enter your existing bot ID (e.g., 1234567890)"
                                    required={botMethod === 'existing'}
                                />
                                <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-3">
                                    <div className="flex items-start">
                                        <span className="text-blue-500 mr-2">ℹ️</span>
                                        <div>
                                            <p className="font-medium mb-2">Using Existing Bot</p>
                                            <p className="text-xs">
                                                Make sure your bot is already created in the GroupMe group with callback URL: 
                                                <br />
                                                <code className="bg-blue-100 px-1 rounded mt-1 inline-block">
                                                    {process.env.REACT_APP_BACKEND_URL || window.location.origin}/api/groupme/webhook
                                                </code>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setActiveView('channels')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? (editingChannel ? 'Updating...' : 'Creating...') : (editingChannel ? 'Update Channel' : 'Create Channel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderBroadcast = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Broadcast Message</h2>

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleBroadcast} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Channels
                        </label>
                        <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                            {channels.map((channel) => (
                                <div key={channel.id} className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        id={`channel-${channel.id}`}
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
                                        className="mr-3"
                                    />
                                    <label htmlFor={`channel-${channel.id}`} className="text-sm">
                                        {channel.name} ({channel.channel_type})
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message
                        </label>
                        <textarea
                            value={broadcastForm.message}
                            onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your message..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notification Type
                        </label>
                        <select
                            value={broadcastForm.notification_type}
                            onChange={(e) => setBroadcastForm({...broadcastForm, notification_type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="announcement">Announcement</option>
                            <option value="reminder">Reminder</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || broadcastForm.channel_ids.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Broadcast'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (loading && channels.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Show create/edit view as a full page when active
    if (activeView === 'create-channel') {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderCreateChannel()}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Navigation Tabs */}
            <div className="mb-8">
                <nav className="flex space-x-8">
                    {[
                        { id: 'dashboard', label: 'Dashboard' },
                        { id: 'channels', label: 'Channels' },
                        { id: 'broadcast', label: 'Broadcast' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveView(tab.id);
                                setEditingChannel(null); // Clear editing state when switching tabs
                                setError(''); // Clear stale errors when switching tabs
                            }}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeView === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            {activeView === 'dashboard' && renderDashboard()}
            {activeView === 'channels' && renderChannels()}
            {activeView === 'broadcast' && renderBroadcast()}
        </div>
    );
};

export default GroupMeManager;