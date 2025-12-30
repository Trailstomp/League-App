import React, { useState, useEffect } from 'react';

const YouTubeSettings = ({ teamId = null, onSave }) => {
    const [config, setConfig] = useState({
        enabled: false,
        channelId: '',
        channelUrl: '',
        apiKey: '',
        apiKeyConfigured: false,
        apiKeyMasked: '',
        playlistIds: [],
        showLiveStreams: true,
        showRecentVideos: true,
        maxVideos: 12
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [channelInfo, setChannelInfo] = useState(null);
    const [newPlaylistId, setNewPlaylistId] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [newApiKey, setNewApiKey] = useState('');
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    
    useEffect(() => {
        loadConfig();
    }, [teamId]);
    
    const loadConfig = async () => {
        try {
            setLoading(true);
            const endpoint = teamId 
                ? `${backendUrl}/api/teams/${teamId}/youtube`
                : `${backendUrl}/api/youtube-integration`;
            
            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                setConfig(prev => ({ ...prev, ...data }));
                setNewApiKey(''); // Clear any entered API key
            }
        } catch (error) {
            console.error('Error loading YouTube config:', error);
        }
        setLoading(false);
    };
    
    const saveConfig = async () => {
        try {
            setSaving(true);
            const endpoint = teamId 
                ? `${backendUrl}/api/teams/${teamId}/youtube`
                : `${backendUrl}/api/youtube-integration`;
            
            const method = teamId ? 'PUT' : 'POST';
            
            // Build the save payload
            const savePayload = {
                ...config,
                id: teamId ? `youtube_${teamId}` : 'main_youtube'
            };
            
            // Only include API key if a new one was entered
            if (newApiKey) {
                savePayload.apiKey = newApiKey;
            } else {
                // Don't overwrite existing key with empty string
                delete savePayload.apiKey;
            }
            
            // Remove display-only fields
            delete savePayload.apiKeyMasked;
            delete savePayload.apiKeyConfigured;
            
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savePayload)
            });
            
            if (response.ok) {
                setTestResult({ success: true, message: 'Configuration saved successfully!' });
                setNewApiKey(''); // Clear the API key input
                await loadConfig(); // Reload to get updated masked key
                if (onSave) onSave(config);
            } else {
                setTestResult({ success: false, message: 'Failed to save configuration' });
            }
        } catch (error) {
            setTestResult({ success: false, message: error.message });
        }
        setSaving(false);
    };
    
    const testConnection = async () => {
        if (!config.channelId) {
            setTestResult({ success: false, message: 'Please enter a Channel ID first' });
            return;
        }
        
        // Check if API key is configured
        if (!config.apiKeyConfigured && !newApiKey) {
            setTestResult({ success: false, message: 'Please configure an API key first, then save before testing' });
            return;
        }
        
        setTesting(true);
        setTestResult(null);
        setChannelInfo(null);
        
        try {
            const response = await fetch(`${backendUrl}/api/youtube/channel/${config.channelId}`);
            const data = await response.json();
            
            if (data.error) {
                setTestResult({ success: false, message: data.error });
            } else if (data.title) {
                setChannelInfo(data);
                setConfig(prev => ({
                    ...prev,
                    channelUrl: data.customUrl ? `https://youtube.com/${data.customUrl}` : `https://youtube.com/channel/${config.channelId}`
                }));
                setTestResult({ success: true, message: `✓ Connected! Found channel: ${data.title}` });
            } else {
                setTestResult({ success: false, message: 'Channel not found. Please check the Channel ID.' });
            }
        } catch (error) {
            setTestResult({ success: false, message: 'Connection test failed: ' + error.message });
        }
        
        setTesting(false);
    };
    
    const addPlaylist = () => {
        if (newPlaylistId && !config.playlistIds.includes(newPlaylistId)) {
            setConfig(prev => ({
                ...prev,
                playlistIds: [...prev.playlistIds, newPlaylistId]
            }));
            setNewPlaylistId('');
        }
    };
    
    const removePlaylist = (playlistId) => {
        setConfig(prev => ({
            ...prev,
            playlistIds: prev.playlistIds.filter(id => id !== playlistId)
        }));
    };
    
    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-slate-600">Loading YouTube settings...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <div>
                        <h3 className="text-lg font-semibold text-red-800">
                            {teamId ? 'Team YouTube Settings' : 'League YouTube Settings'}
                        </h3>
                        <p className="text-sm text-red-600">
                            Connect a YouTube channel to display videos and live streams
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                    <h4 className="font-medium text-slate-800">Enable YouTube Integration</h4>
                    <p className="text-sm text-slate-600">Show YouTube videos on the {teamId ? 'team' : 'league'} page</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
            </div>

            {/* API Key Configuration - League Level Only */}
            {!teamId && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-800 flex items-center gap-2">
                                🔑 YouTube API Key
                                {config.apiKeyConfigured ? (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Configured</span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Not Set</span>
                                )}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">
                                Required to fetch videos from YouTube
                            </p>
                        </div>
                    </div>
                    
                    {/* Current Key Status */}
                    {config.apiKeyConfigured && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-green-600">✓</span>
                            <span className="text-sm text-green-800">
                                Current key: <code className="bg-green-100 px-2 py-0.5 rounded">{config.apiKeyMasked}</code>
                            </span>
                        </div>
                    )}
                    
                    {/* New API Key Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {config.apiKeyConfigured ? 'Update API Key (leave blank to keep current)' : 'Enter API Key'}
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={newApiKey}
                                    onChange={(e) => setNewApiKey(e.target.value)}
                                    placeholder={config.apiKeyConfigured ? 'Enter new key to update...' : 'AIzaSy...'}
                                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showApiKey ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        {newApiKey && (
                            <p className="text-xs text-amber-600 mt-1">
                                ⚠️ Click "Save Configuration" to apply the new API key
                            </p>
                        )}
                    </div>
                    
                    {/* How to get API Key */}
                    <details className="text-sm">
                        <summary className="cursor-pointer text-slate-600 hover:text-slate-800 font-medium">
                            How to get a YouTube API Key →
                        </summary>
                        <div className="mt-3 p-3 bg-white rounded-lg border space-y-2 text-slate-700">
                            <ol className="list-decimal list-inside space-y-1.5">
                                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                                <li>Create a new project or select existing</li>
                                <li>Go to <strong>APIs & Services → Library</strong></li>
                                <li>Search for "<strong>YouTube Data API v3</strong>" and Enable it</li>
                                <li>Go to <strong>APIs & Services → Credentials</strong></li>
                                <li>Click <strong>+ CREATE CREDENTIALS → API Key</strong></li>
                                <li>Copy the key and paste it above</li>
                            </ol>
                            <p className="text-xs text-slate-500 mt-2">
                                💡 Tip: Restrict your key to "YouTube Data API v3" for security
                            </p>
                        </div>
                    </details>
                </div>
            )}
            
            {/* Channel Configuration */}
            <div className="space-y-4">
                <h4 className="font-medium text-slate-800">Channel Configuration</h4>
                
                {/* Channel ID */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        YouTube Channel ID *
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={config.channelId}
                            onChange={(e) => setConfig(prev => ({ ...prev, channelId: e.target.value }))}
                            placeholder="UCxxxxxxxxxxxxxx"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <button
                            onClick={testConnection}
                            disabled={testing || !config.channelId}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {testing ? 'Testing...' : 'Test'}
                        </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Find your Channel ID: Go to YouTube Studio → Settings → Channel → Advanced settings
                    </p>
                </div>
                
                {/* Channel URL (auto-filled after test) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Channel URL
                    </label>
                    <input
                        type="text"
                        value={config.channelUrl}
                        onChange={(e) => setConfig(prev => ({ ...prev, channelUrl: e.target.value }))}
                        placeholder="https://youtube.com/channel/..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                </div>
                
                {/* Test Result */}
                {testResult && (
                    <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {testResult.message}
                    </div>
                )}
                
                {/* Channel Info Preview */}
                {channelInfo && (
                    <div className="p-4 bg-slate-50 rounded-lg border">
                        <div className="flex items-center gap-4">
                            {channelInfo.thumbnail && (
                                <img 
                                    src={channelInfo.thumbnail} 
                                    alt={channelInfo.title}
                                    className="w-16 h-16 rounded-full"
                                />
                            )}
                            <div>
                                <h5 className="font-semibold text-slate-800">{channelInfo.title}</h5>
                                <p className="text-sm text-slate-600">
                                    {parseInt(channelInfo.subscriberCount).toLocaleString()} subscribers • {parseInt(channelInfo.videoCount).toLocaleString()} videos
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Display Options */}
            <div className="space-y-4">
                <h4 className="font-medium text-slate-800">Display Options</h4>
                
                <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={config.showLiveStreams}
                            onChange={(e) => setConfig(prev => ({ ...prev, showLiveStreams: e.target.checked }))}
                            className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm text-slate-700">Show Live Streams</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={config.showRecentVideos}
                            onChange={(e) => setConfig(prev => ({ ...prev, showRecentVideos: e.target.checked }))}
                            className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm text-slate-700">Show Recent Videos</span>
                    </label>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Maximum Videos to Display
                    </label>
                    <select
                        value={config.maxVideos}
                        onChange={(e) => setConfig(prev => ({ ...prev, maxVideos: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                        <option value={6}>6 videos</option>
                        <option value={9}>9 videos</option>
                        <option value={12}>12 videos</option>
                        <option value={18}>18 videos</option>
                        <option value={24}>24 videos</option>
                    </select>
                </div>
            </div>
            
            {/* Playlists */}
            <div className="space-y-4">
                <h4 className="font-medium text-slate-800">Featured Playlists</h4>
                <p className="text-sm text-slate-600">Add specific playlists to feature on the page</p>
                
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newPlaylistId}
                        onChange={(e) => setNewPlaylistId(e.target.value)}
                        placeholder="Playlist ID (PLxxxxxx...)"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                    <button
                        onClick={addPlaylist}
                        disabled={!newPlaylistId}
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
                
                {config.playlistIds && config.playlistIds.length > 0 && (
                    <div className="space-y-2">
                        {config.playlistIds.map((playlistId, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                <span className="text-sm font-mono text-slate-600">{playlistId}</span>
                                <button
                                    onClick={() => removePlaylist(playlistId)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Team-level notice about API key */}
            {teamId && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                        <span className="text-blue-600 text-xl">ℹ️</span>
                        <div>
                            <h5 className="font-medium text-blue-800">Using League API Key</h5>
                            <p className="text-sm text-blue-700 mt-1">
                                Team YouTube settings use the API key configured at the league level.
                                Contact your league administrator to set up or update the API key.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    onClick={loadConfig}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                    Reset
                </button>
                <button
                    onClick={saveConfig}
                    disabled={saving}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );
};

export default YouTubeSettings;
