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
        existing_bot_id: '', // Add bot ID field
        notification_settings: {}
    });

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
            if (newChannelForm.team_id) {
                formData.append('team_id', newChannelForm.team_id);
            }
            if (newChannelForm.existing_bot_id) {
                formData.append('existing_bot_id', newChannelForm.existing_bot_id);
            }
            formData.append('notification_settings', JSON.stringify(newChannelForm.notification_settings));

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
                    existing_bot_id: '',
                    notification_settings: {}
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

    const renderDashboard = () => (
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
                
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                            <span className="text-red-500 mr-2">❌</span>
                            <div>
                                <p className="text-sm font-medium text-red-800">Configuration Issue</p>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                {error.includes('GROUPME_ACCESS_TOKEN') && (
                                    <div className="mt-2 text-xs text-red-600">
                                        <p><strong>To fix:</strong></p>
                                        <ol className="list-decimal list-inside mt-1 space-y-1">
                                            <li>Go to <a href="https://dev.groupme.com/" target="_blank" rel="noopener noreferrer" className="underline">https://dev.groupme.com/</a></li>
                                            <li>Create an application and get your Access Token</li>
                                            <li>Add GROUPME_ACCESS_TOKEN to your environment variables</li>
                                            <li>Restart your backend server</li>
                                        </ol>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {!error && availableGroups.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                            <span className="text-green-500 mr-2">✅</span>
                            <div>
                                <p className="text-sm font-medium text-green-800">Configuration Working</p>
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
                            <p className="text-2xl font-semibold text-gray-900">{dashboardStats.active_channels || 0}</p>
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
                            <p className="text-2xl font-semibold text-gray-900">{dashboardStats.recent_messages || 0}</p>
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
                            <p className="text-2xl font-semibold text-gray-900">{dashboardStats.team_channels || 0}</p>
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
                            <p className="text-sm font-medium text-gray-600">Notifications Sent</p>
                            <p className="text-2xl font-semibold text-gray-900">{dashboardStats.notifications_sent || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Integration Status */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Integration Status</h3>
                        <p className="text-sm text-gray-600">GroupMe integration is currently {dashboardStats.integration_status || 'inactive'}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        dashboardStats.integration_status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {dashboardStats.integration_status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                </div>
            </div>
        </div>
    );

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
                                Team
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
                        {channels.map((channel) => (
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {channel.team_name || 'N/A'}
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
                                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                                        Edit
                                    </button>
                                    <button className="text-red-600 hover:text-red-900">
                                        Deactivate
                                    </button>
                                </td>
                            </tr>
                        ))}
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
                <h2 className="text-2xl font-bold text-gray-900">Create GroupMe Channel</h2>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleCreateChannel} className="space-y-6">
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Channel Type
                        </label>
                        <select
                            value={newChannelForm.channel_type}
                            onChange={(e) => setNewChannelForm({...newChannelForm, channel_type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="team">Team Channel</option>
                            <option value="league">League-wide Channel</option>
                        </select>
                    </div>

                    {newChannelForm.channel_type === 'team' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Team
                            </label>
                            <select
                                value={newChannelForm.team_id}
                                onChange={(e) => setNewChannelForm({...newChannelForm, team_id: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select a team...</option>
                                {teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

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

                    {/* Bot Configuration Section */}
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
                                                    https://sportscomms-setup.preview.emergentagent.com/api/groupme/webhook
                                                </code>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

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
                            {loading ? 'Creating...' : 'Create Channel'}
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
                            onClick={() => setActiveView(tab.id)}
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
            {activeView === 'create-channel' && renderCreateChannel()}
            {activeView === 'broadcast' && renderBroadcast()}
        </div>
    );
};

export default GroupMeManager;