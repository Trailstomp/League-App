import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

const CloudStorageManager = ({ teams = [] }) => {
    const [config, setConfig] = useState(null);
    const [youtubeConfig, setYoutubeConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingYoutube, setSavingYoutube] = useState(false);
    const [activeTab, setActiveTab] = useState('storage');
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);

    useEffect(() => {
        loadConfigurations();
    }, []);

    const loadConfigurations = async () => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            
            // Load cloud storage config
            const storageResponse = await fetch(`${BACKEND_URL}/api/cloud-storage`);
            if (storageResponse.ok) {
                const storageData = await storageResponse.json();
                setConfig(storageData);
            } else {
                console.error('Failed to load cloud storage config');
            }

            // Load YouTube config
            const youtubeResponse = await fetch(`${BACKEND_URL}/api/youtube-integration`);
            if (youtubeResponse.ok) {
                const youtubeData = await youtubeResponse.json();
                setYoutubeConfig(youtubeData);
            } else {
                console.error('Failed to load YouTube config');
            }
        } catch (error) {
            console.error('Error loading configurations:', error);
        }
        setLoading(false);
    };

    const saveConfig = async () => {
        if (!config) return;
        
        setSaving(true);
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const response = await fetch(`${BACKEND_URL}/api/cloud-storage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });

            if (response.ok) {
                alert('Cloud storage configuration saved successfully!');
            } else {
                const errorText = await response.text();
                alert(`Failed to save configuration: ${errorText}`);
            }
        } catch (error) {
            console.error('Error saving cloud storage config:', error);
            alert('Error saving configuration. Please try again.');
        }
        setSaving(false);
    };

    const saveYoutubeConfig = async () => {
        if (!youtubeConfig) return;
        
        setSavingYoutube(true);
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const response = await fetch(`${BACKEND_URL}/api/youtube-integration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(youtubeConfig),
            });

            if (response.ok) {
                alert('YouTube integration configuration saved successfully!');
            } else {
                const errorText = await response.text();
                alert(`Failed to save YouTube configuration: ${errorText}`);
            }
        } catch (error) {
            console.error('Error saving YouTube config:', error);
            alert('Error saving YouTube configuration. Please try again.');
        }
        setSavingYoutube(false);
    };

    const testConnection = async (provider) => {
        setTestingConnection(true);
        setConnectionStatus(null);
        
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const response = await fetch(`${BACKEND_URL}/api/cloud-storage/test-connection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ provider }),
            });

            const result = await response.json();
            setConnectionStatus(result);
        } catch (error) {
            console.error('Error testing connection:', error);
            setConnectionStatus({ status: 'error', message: 'Connection test failed' });
        }
        setTestingConnection(false);
    };

    const updateConfig = (path, value) => {
        const newConfig = { ...config };
        const keys = path.split('.');
        let obj = newConfig;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        setConfig(newConfig);
    };

    const updateYoutubeConfig = (path, value) => {
        const newConfig = { ...youtubeConfig };
        const keys = path.split('.');
        let obj = newConfig;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        setYoutubeConfig(newConfig);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-slate-600">Loading cloud storage configuration...</span>
            </div>
        );
    }

    if (!config || !youtubeConfig) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600">Failed to load configurations.</p>
                <button 
                    onClick={loadConfigurations}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Media Integration Settings</h2>
                    <p className="text-slate-600 mt-1">Configure cloud storage for media files and YouTube integration</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setActiveTab('storage')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'storage'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        ☁️ Cloud Storage
                    </button>
                    <button
                        onClick={() => setActiveTab('youtube')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'youtube'
                                ? 'bg-red-100 text-red-700'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        📺 YouTube Integration
                    </button>
                </div>
            </div>

            {/* Cloud Storage Configuration */}
            {activeTab === 'storage' && (
                <div className="space-y-6">
                    {/* Provider Selection */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Storage Provider</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div 
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                    config.activeProvider === 'google-cloud' 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                                onClick={() => updateConfig('activeProvider', 'google-cloud')}
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-2">☁️</div>
                                    <div className="font-medium">Google Cloud</div>
                                    <div className="text-sm text-slate-500">Professional Grade</div>
                                </div>
                            </div>
                            
                            <div 
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                    config.activeProvider === 'google-drive' 
                                        ? 'border-green-500 bg-green-50' 
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                                onClick={() => updateConfig('activeProvider', 'google-drive')}
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-2">📁</div>
                                    <div className="font-medium">Google Drive</div>
                                    <div className="text-sm text-slate-500">Easy Setup</div>
                                </div>
                            </div>
                            
                            <div 
                                className={`border-2 rounded-lg p-4 cursor-not-allowed transition-colors opacity-50`}
                                title="Coming in future update"
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-2">📦</div>
                                    <div className="font-medium">AWS S3</div>
                                    <div className="text-sm text-slate-500">Coming Soon</div>
                                </div>
                            </div>
                            
                            <div 
                                className={`border-2 rounded-lg p-4 cursor-not-allowed transition-colors opacity-50`}
                                title="Coming in future update"
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-2">🔷</div>
                                    <div className="font-medium">Azure Blob</div>
                                    <div className="text-sm text-slate-500">Coming Soon</div>
                                </div>
                            </div>
                            
                            <div 
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                    config.activeProvider === 'none' 
                                        ? 'border-red-500 bg-red-50' 
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                                onClick={() => updateConfig('activeProvider', 'none')}
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-2">❌</div>
                                    <div className="font-medium">Disabled</div>
                                    <div className="text-sm text-slate-500">No cloud storage</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Google Cloud Storage Configuration */}
                    {config.activeProvider === 'google-cloud' && (
                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="border-b px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-800">Google Cloud Storage Configuration</h3>
                                    <button
                                        onClick={saveConfig}
                                        disabled={saving}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <LacrosseIcon name="backup" className="mr-2" style={{fontSize: '16px'}} />
                                                Save Cloud Config
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <GoogleCloudStorageConfig 
                                    config={config} 
                                    updateConfig={updateConfig}
                                    onTestConnection={() => testConnection('google-cloud')}
                                    testingConnection={testingConnection}
                                    connectionStatus={connectionStatus}
                                />
                            </div>
                        </div>
                    )}

                    {/* Google Drive Configuration */}
                    {config.activeProvider === 'google-drive' && (
                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="border-b px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-800">Google Drive Configuration</h3>
                                    <button
                                        onClick={saveConfig}
                                        disabled={saving}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <LacrosseIcon name="backup" className="mr-2" style={{fontSize: '16px'}} />
                                                Save Drive Config
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <GoogleDriveConfig 
                                    config={config} 
                                    updateConfig={updateConfig}
                                    onTestConnection={() => testConnection('google-drive')}
                                    testingConnection={testingConnection}
                                    connectionStatus={connectionStatus}
                                    loadConfigurations={loadConfigurations}
                                />
                            </div>
                        </div>
                    )}

                    {/* Storage Behavior Settings */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Storage Behavior Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Thumbnail Cache Size (KB)
                                </label>
                                <input
                                    type="number"
                                    value={config.thumbnailCacheSize}
                                    onChange={(e) => updateConfig('thumbnailCacheSize', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    min="50"
                                    max="500"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Small thumbnails cached in database for fast loading
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Max File Size (MB)
                                </label>
                                <input
                                    type="number"
                                    value={config.maxFileSize}
                                    onChange={(e) => updateConfig('maxFileSize', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    min="10"
                                    max="500"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Maximum file size for uploads
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Status
                                </label>
                                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                    config.activeProvider === 'none' 
                                        ? 'bg-red-100 text-red-700'
                                        : config.googleCloud?.enabled 
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {config.activeProvider === 'none' 
                                        ? 'Cloud Storage Disabled'
                                        : config.activeProvider === 'google-cloud' && config.googleCloud?.enabled 
                                            ? 'Google Cloud Storage Active'
                                            : config.activeProvider === 'google-drive' && config.googleDrive?.enabled
                                                ? 'Google Drive Active'
                                                : 'Configuration Incomplete'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warning for disabled storage */}
                    {config.activeProvider === 'none' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <div className="flex items-start">
                                <div className="text-red-600 mr-3 mt-1">⚠️</div>
                                <div>
                                    <h4 className="text-red-800 font-medium mb-2">Cloud Storage Disabled</h4>
                                    <p className="text-red-700 text-sm mb-3">
                                        Without cloud storage, large media files will be stored in the database, which can cause performance issues and size limits (16MB maximum).
                                    </p>
                                    <p className="text-red-700 text-sm">
                                        <strong>Recommended:</strong> Configure Google Cloud Storage to handle large images and videos efficiently.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* YouTube Integration Configuration */}
            {activeTab === 'youtube' && (
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="border-b px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800">YouTube Integration Configuration</h3>
                            <button
                                onClick={saveYoutubeConfig}
                                disabled={savingYoutube}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {savingYoutube ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <LacrosseIcon name="backup" className="mr-2" style={{fontSize: '16px'}} />
                                        Save YouTube Config
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <YouTubeIntegrationConfig 
                            config={youtubeConfig} 
                            updateConfig={updateYoutubeConfig}
                        />
                    </div>
                </div>
            )}

            {/* Warning for disabled storage */}
            {config.activeProvider === 'none' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start">
                        <div className="text-red-600 mr-3 mt-1">⚠️</div>
                        <div>
                            <h4 className="text-red-800 font-medium mb-2">Cloud Storage Disabled</h4>
                            <p className="text-red-700 text-sm mb-3">
                                Without cloud storage, large media files will be stored in the database, which can cause performance issues and size limits (16MB maximum).
                            </p>
                            <p className="text-red-700 text-sm">
                                <strong>Recommended:</strong> Configure Google Drive (easy setup) or Google Cloud Storage (professional grade) to handle large images and videos efficiently.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Google Cloud Storage Configuration Component
const GoogleCloudStorageConfig = ({ config, updateConfig, onTestConnection, testingConnection, connectionStatus }) => {
    return (
        <div className="space-y-6">
            {/* Setup Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-blue-800 font-medium mb-3">📋 Google Cloud Storage Setup Instructions</h4>
                <div className="text-blue-700 text-sm space-y-2">
                    <p><strong>Step 1:</strong> Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></p>
                    <p><strong>Step 2:</strong> Create or select a project</p>
                    <p><strong>Step 3:</strong> Enable the Cloud Storage API</p>
                    <p><strong>Step 4:</strong> Create a storage bucket</p>
                    <p><strong>Step 5:</strong> Create a service account with Storage Admin role</p>
                    <p><strong>Step 6:</strong> Download the service account JSON key</p>
                    <p><strong>Step 7:</strong> Copy the JSON content and paste it in the Service Account Key field below</p>
                </div>
            </div>

            {/* Configuration Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Project ID *
                    </label>
                    <input
                        type="text"
                        value={config.googleCloud?.projectId || ''}
                        onChange={(e) => updateConfig('googleCloud.projectId', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="my-project-id"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Bucket Name *
                    </label>
                    <input
                        type="text"
                        value={config.googleCloud?.bucketName || ''}
                        onChange={(e) => updateConfig('googleCloud.bucketName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="my-lacrosse-bucket"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Service Account Key (JSON) *
                </label>
                <textarea
                    value={config.googleCloud?.serviceAccountKey || ''}
                    onChange={(e) => updateConfig('googleCloud.serviceAccountKey', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="8"
                    placeholder='{"type": "service_account", "project_id": "...", ...}'
                />
                <p className="text-xs text-slate-500 mt-1">
                    Paste the entire JSON content from your downloaded service account key file
                </p>
            </div>

            <div className="flex items-center space-x-4">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={config.googleCloud?.enabled || false}
                        onChange={(e) => updateConfig('googleCloud.enabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    />
                    <span className="ml-2 text-sm text-slate-700">Enable Google Cloud Storage</span>
                </label>

                <button
                    onClick={onTestConnection}
                    disabled={testingConnection || !config.googleCloud?.enabled}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                    {testingConnection ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Testing...
                        </>
                    ) : (
                        <>
                            🔍 Test Connection
                        </>
                    )}
                </button>
            </div>

            {/* Connection Status */}
            {connectionStatus && (
                <div className={`p-4 rounded-lg ${
                    connectionStatus.status === 'success' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                }`}>
                    <div className={`font-medium ${
                        connectionStatus.status === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                        {connectionStatus.status === 'success' ? '✅ Connection Successful' : '❌ Connection Failed'}
                    </div>
                    <div className={`text-sm mt-1 ${
                        connectionStatus.status === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                        {connectionStatus.message}
                    </div>
                </div>
            )}
        </div>
    );
};

// Google Drive Configuration Component
const GoogleDriveConfig = ({ config, updateConfig, onTestConnection, testingConnection, connectionStatus, loadConfigurations }) => {
    const [authUrl, setAuthUrl] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [setupStep, setSetupStep] = useState(1);
    const [loadingAuth, setLoadingAuth] = useState(false);
    const [completingAuth, setCompletingAuth] = useState(false);
    const [uploadingJson, setUploadingJson] = useState(false);

    const generateAuthUrl = async () => {
        console.log('🔗 Starting Google Drive authorization...');
        setLoadingAuth(true);
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            console.log(`🔗 Making request to: ${BACKEND_URL}/api/cloud-storage/google-drive/auth-url`);
            
            const response = await fetch(`${BACKEND_URL}/api/cloud-storage/google-drive/auth-url`);
            console.log(`🔗 Response status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔗 Auth URL generated successfully:', data.authUrl.substring(0, 100) + '...');
                setAuthUrl(data.authUrl);
                setSetupStep(2);
                console.log('🔗 Updated state: setupStep = 2');
            } else {
                const errorText = await response.text();
                console.error('🔗 Error response:', errorText);
                alert(`Authorization setup failed: ${errorText}`);
            }
        } catch (error) {
            console.error('🔗 Error generating auth URL:', error);
            alert('Error generating authorization URL. Check browser console for details.');
        }
        setLoadingAuth(false);
    };

    const completeAuth = async () => {
        if (!authCode.trim()) {
            alert('Please enter the authorization code');
            return;
        }

        setCompletingAuth(true);
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const response = await fetch(`${BACKEND_URL}/api/cloud-storage/google-drive/complete-auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ auth_code: authCode }),
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                updateConfig('googleDrive.enabled', true);
                setSetupStep(3);
            } else {
                const errorText = await response.text();
                alert(`Authorization failed: ${errorText}`);
            }
        } catch (error) {
            console.error('Error completing auth:', error);
            alert('Error completing authorization');
        }
        setCompletingAuth(false);
    };

    const handleJsonUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            alert('Please select a JSON file');
            return;
        }

        setUploadingJson(true);
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${BACKEND_URL}/api/cloud-storage/google-drive/upload-json`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message + '\n\nNext step: ' + data.nextStep);
                
                // Reload configuration to get the updated values
                await loadConfigurations();
            } else {
                const errorText = await response.text();
                alert(`Failed to process JSON file: ${errorText}`);
            }
        } catch (error) {
            console.error('Error uploading JSON file:', error);
            alert('Error uploading JSON file. Please try again.');
        }
        setUploadingJson(false);
        
        // Clear the file input
        event.target.value = '';
    };

    return (
        <div className="space-y-6">
            {/* Setup Instructions */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-green-800 font-medium mb-3">📁 Google Drive Setup - Step by Step</h4>
                <div className="text-green-700 text-sm space-y-2">
                    <p><strong>Step 1:</strong> Go to <a href="https://console.developers.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Developers Console</a></p>
                    <p><strong>Step 2:</strong> Create a project (or select existing)</p>
                    <p><strong>Step 3:</strong> Enable Google Drive API</p>
                    <p><strong>Step 4:</strong> Go to "Credentials" → Create OAuth 2.0 Client ID</p>
                    <p><strong>Step 5:</strong> Application type: "Web application"</p>
                    <p className="bg-yellow-100 text-yellow-800 p-2 rounded"><strong>Step 6 - CRITICAL:</strong> Add Authorized Redirect URI: <code>{window.location.origin}</code></p>
                    <p><strong>Step 7:</strong> Copy Client ID and Client Secret to the form below</p>
                    <p><strong>Benefits:</strong> 15GB free storage, familiar interface, easy file management</p>
                </div>
            </div>

            {/* Configuration Form */}
            <div className="space-y-4">
                {/* JSON File Upload Option */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-blue-800 font-medium mb-3">📄 Quick Setup (Recommended)</h4>
                    <p className="text-blue-700 text-sm mb-3">
                        Upload your OAuth2 client JSON file from Google Console for automatic configuration.
                    </p>
                    <div className="flex items-center space-x-3">
                        <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                            {uploadingJson ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    📁 Upload OAuth2 JSON
                                </>
                            )}
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleJsonUpload}
                                className="hidden"
                                disabled={uploadingJson}
                            />
                        </label>
                        <div className="text-sm text-blue-600">
                            or configure manually below
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Google Drive Client ID *
                        </label>
                        <input
                            type="text"
                            value={config.googleDrive?.clientId || ''}
                            onChange={(e) => updateConfig('googleDrive.clientId', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="123456789-abcdefg.apps.googleusercontent.com"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Google Drive Client Secret *
                        </label>
                        <input
                            type="password"
                            value={config.googleDrive?.clientSecret || ''}
                            onChange={(e) => updateConfig('googleDrive.clientSecret', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="GOCSPX-..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Redirect URI * <span className="text-red-600">(Must match Google Console exactly!)</span>
                    </label>
                    <input
                        type="text"
                        value={config.googleDrive?.redirectUri || window.location.origin}
                        onChange={(e) => updateConfig('googleDrive.redirectUri', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder={window.location.origin}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        <strong>IMPORTANT:</strong> This exact URI must be added to "Authorized redirect URIs" in your Google OAuth app
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Drive Folder Name
                    </label>
                    <input
                        type="text"
                        value={config.googleDrive?.folderName || 'Lacrosse League Media'}
                        onChange={(e) => updateConfig('googleDrive.folderName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Lacrosse League Media"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Main folder name that will be created in your Google Drive
                    </p>
                </div>

                {/* Authorization Flow */}
                {setupStep === 1 && (
                    <div className="bg-slate-50 rounded-lg p-4">
                        <h5 className="font-medium text-slate-800 mb-2">Step 1: Configure Client Credentials</h5>
                        <p className="text-sm text-slate-600 mb-3">
                            Enter your Google Drive Client ID and Client Secret above, then click "Start Authorization"
                        </p>
                        
                        {/* Debug info */}
                        <div className="text-xs text-slate-400 mb-3 bg-slate-100 p-2 rounded">
                            <strong>Debug Info:</strong><br/>
                            Client ID: {config.googleDrive?.clientId ? '✅ Present' : '❌ Missing'}<br/>
                            Client Secret: {config.googleDrive?.clientSecret ? '✅ Present' : '❌ Missing'}<br/>
                            Provider: {config.activeProvider || 'none'}<br/>
                            Enabled: {config.googleDrive?.enabled ? '✅ Yes' : '❌ No'}
                        </div>
                        <button
                            onClick={generateAuthUrl}
                            disabled={loadingAuth || !config.googleDrive?.clientId || !config.googleDrive?.clientSecret}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingAuth ? 'Generating...' : 'Start Authorization'}
                        </button>
                        <div className="text-xs text-slate-500 mt-2">
                            <strong>Before clicking:</strong> Save configuration above and add the Redirect URI to your Google OAuth app!
                        </div>
                    </div>
                )}

                {setupStep === 2 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-medium text-slate-800 mb-2">Step 2: Authorize Access</h5>
                        <p className="text-sm text-slate-600 mb-3">
                            Click the button below to open Google authorization in a new tab:
                        </p>
                        <button
                            onClick={() => {
                                console.log('🔗 Opening Google authorization in new tab...');
                                window.open(authUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
                            }}
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
                        >
                            🔗 Open Authorization Page (New Tab)
                        </button>
                        
                        <div className="text-xs text-slate-500 mb-4 bg-blue-50 p-3 rounded">
                            <strong>Why a new tab?</strong> Google blocks authorization in embedded frames for security. 
                            The new tab will show the Google sign-in page safely.
                        </div>
                        
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Enter Authorization Code
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={authCode}
                                    onChange={(e) => setAuthCode(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Paste the authorization code here..."
                                />
                                <button
                                    onClick={completeAuth}
                                    disabled={completingAuth || !authCode.trim()}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {completingAuth ? 'Completing...' : 'Complete Setup'}
                                </button>
                            </div>
                            
                            {/* Troubleshooting Help */}
                            <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-3 rounded">
                                <strong>Troubleshooting:</strong><br/>
                                • If authorization page won't load: Check popup blocker settings<br/>
                                • If "blocked by response": This is normal - the new tab method avoids this issue<br/>
                                • Code looks like: 4/0AX4XfWh... (starts with 4/0A)<br/>
                                • Having issues? Try incognito/private browsing mode
                            </div>
                        </div>
                    </div>
                )}

                {setupStep === 3 && (
                    <div className="bg-green-50 rounded-lg p-4">
                        <h5 className="font-medium text-green-800 mb-2">✅ Setup Complete!</h5>
                        <p className="text-sm text-green-700">
                            Google Drive is now configured and ready to store your league media files.
                        </p>
                    </div>
                )}

                <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={config.googleDrive?.enabled || false}
                            onChange={(e) => updateConfig('googleDrive.enabled', e.target.checked)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded"
                        />
                        <span className="ml-2 text-sm text-slate-700">Enable Google Drive Storage</span>
                    </label>

                    <button
                        onClick={onTestConnection}
                        disabled={testingConnection || !config.googleDrive?.enabled}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {testingConnection ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Testing...
                            </>
                        ) : (
                            <>
                                🔍 Test Connection
                            </>
                        )}
                    </button>
                </div>

                {/* Connection Status */}
                {connectionStatus && (
                    <div className={`p-4 rounded-lg ${
                        connectionStatus.status === 'success' 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                    }`}>
                        <div className={`font-medium ${
                            connectionStatus.status === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}>
                            {connectionStatus.status === 'success' ? '✅ Connection Successful' : '❌ Connection Failed'}
                        </div>
                        <div className={`text-sm mt-1 ${
                            connectionStatus.status === 'success' ? 'text-green-700' : 'text-red-700'
                        }`}>
                            {connectionStatus.message}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// YouTube Integration Configuration Component
const YouTubeIntegrationConfig = ({ config, updateConfig }) => {
    const [newPlaylistId, setNewPlaylistId] = useState('');

    const addPlaylistId = () => {
        if (newPlaylistId.trim()) {
            const currentPlaylists = config?.playlistIds || [];
            updateConfig('playlistIds', [...currentPlaylists, newPlaylistId.trim()]);
            setNewPlaylistId('');
        }
    };

    const removePlaylistId = (index) => {
        const currentPlaylists = config?.playlistIds || [];
        const newPlaylists = currentPlaylists.filter((_, i) => i !== index);
        updateConfig('playlistIds', newPlaylists);
    };

    return (
        <div className="space-y-6">
            {/* Setup Instructions */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 className="text-red-800 font-medium mb-3">📺 YouTube Integration Setup</h4>
                <div className="text-red-700 text-sm space-y-2">
                    <p><strong>Step 1:</strong> Go to your YouTube channel page</p>
                    <p><strong>Step 2:</strong> Copy the channel ID from the URL (e.g., UC_x5XG1OV2P6uZZ5FSM9Ttw)</p>
                    <p><strong>Step 3:</strong> Optionally, create playlists for organized video content</p>
                    <p><strong>Step 4:</strong> Copy playlist IDs from playlist URLs</p>
                    <p><strong>Note:</strong> All videos must be set to public or unlisted to be accessible</p>
                </div>
            </div>

            {/* Configuration Form */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        YouTube Channel ID
                    </label>
                    <input
                        type="text"
                        value={config?.channelId || ''}
                        onChange={(e) => updateConfig('channelId', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="UC_x5XG1OV2P6uZZ5FSM9Ttw"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Channel URL (Optional)
                    </label>
                    <input
                        type="url"
                        value={config?.channelUrl || ''}
                        onChange={(e) => updateConfig('channelUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="https://www.youtube.com/@yourchannelname"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Playlist IDs
                    </label>
                    <div className="flex space-x-2 mb-2">
                        <input
                            type="text"
                            value={newPlaylistId}
                            onChange={(e) => setNewPlaylistId(e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            placeholder="PLxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        />
                        <button
                            onClick={addPlaylistId}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Add
                        </button>
                    </div>
                    
                    {config?.playlistIds?.length > 0 && (
                        <div className="space-y-2">
                            {config.playlistIds.map((playlistId, index) => (
                                <div key={index} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                                    <span className="text-sm font-mono">{playlistId}</span>
                                    <button
                                        onClick={() => removePlaylistId(index)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={config?.enabled || false}
                            onChange={(e) => updateConfig('enabled', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                        />
                        <span className="ml-2 text-sm text-slate-700">Enable YouTube Integration</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default CloudStorageManager;