import React, { useState, useEffect, useRef } from 'react';
import { Folder, FileText, Upload, Plus, Trash2, ExternalLink, ChevronRight, Home, ArrowLeft, Search, Settings, Loader2, FolderPlus, File, Image, FileSpreadsheet, FileVideo } from 'lucide-react';

const FILE_ICONS = {
    'application/pdf': <FileText className="w-5 h-5 text-red-500" />,
    'application/vnd.google-apps.spreadsheet': <FileSpreadsheet className="w-5 h-5 text-green-600" />,
    'application/vnd.google-apps.document': <FileText className="w-5 h-5 text-blue-500" />,
    'application/vnd.google-apps.presentation': <FileText className="w-5 h-5 text-orange-500" />,
    'video/mp4': <FileVideo className="w-5 h-5 text-purple-500" />,
    'folder': <Folder className="w-5 h-5 text-yellow-500" />,
};

const getFileIcon = (mimeType, type) => {
    if (type === 'folder') return <Folder className="w-5 h-5 text-yellow-500" />;
    if (mimeType?.startsWith('image/')) return <Image className="w-5 h-5 text-pink-500" />;
    if (mimeType?.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-500" />;
    return FILE_ICONS[mimeType] || <File className="w-5 h-5 text-slate-400" />;
};

const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileManager = ({ currentUser, teamId = null, teamName = null }) => {
    const [activeView, setActiveView] = useState('files');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [config, setConfig] = useState(null);
    const [breadcrumb, setBreadcrumb] = useState([{ id: null, name: 'Root' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [result, setResult] = useState(null);
    const [deleting, setDeleting] = useState(null);
    
    // Settings state
    const [settingsProvider, setSettingsProvider] = useState('google_drive');
    const [useLeague, setUseLeague] = useState(true);
    const [settingsConfig, setSettingsConfig] = useState({
        google_drive: { clientId: '', clientSecret: '', refreshToken: '', folderId: '', folderName: '' },
        onedrive: { clientId: '', clientSecret: '', tenantId: '', refreshToken: '', folderId: '', folderName: '' }
    });
    const [savingSettings, setSavingSettings] = useState(false);
    
    const fileInputRef = useRef(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const currentFolderId = breadcrumb[breadcrumb.length - 1]?.id;
    
    useEffect(() => {
        loadConfig();
    }, [teamId]);
    
    useEffect(() => {
        if (config?.configured) loadFiles();
    }, [currentFolderId, config]);
    
    const loadConfig = async () => {
        try {
            const url = teamId ? `${backendUrl}/api/documents/config?team_id=${teamId}` : `${backendUrl}/api/documents/config`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                // Set settings state from config
                if (data.use_league !== undefined) setUseLeague(data.use_league);
                if (data.provider && !data.use_league) setSettingsProvider(data.provider);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };
    
    const loadFiles = async () => {
        setLoading(true);
        try {
            let url = `${backendUrl}/api/documents/files`;
            const params = new URLSearchParams();
            if (teamId) params.set('team_id', teamId);
            if (currentFolderId) params.set('folder_id', currentFolderId);
            if (params.toString()) url += `?${params}`;
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setFiles(data.files || []);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };
    
    const openFolder = (folder) => {
        setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }]);
    };
    
    const navigateTo = (index) => {
        setBreadcrumb(prev => prev.slice(0, index + 1));
    };
    
    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploading(true);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (teamId) formData.append('team_id', teamId);
            if (currentFolderId) formData.append('folder_id', currentFolderId);
            
            const res = await fetch(`${backendUrl}/api/documents/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                setResult({ type: 'success', message: `Uploaded: ${data.file?.name}` });
                loadFiles();
            } else {
                setResult({ type: 'error', message: data.detail || 'Upload failed' });
            }
        } catch (e) {
            setResult({ type: 'error', message: e.message });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setTimeout(() => setResult(null), 4000);
        }
    };
    
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            const res = await fetch(`${backendUrl}/api/documents/folders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_id: teamId, name: newFolderName.trim(), parent_id: currentFolderId })
            });
            if (res.ok) {
                setResult({ type: 'success', message: `Folder "${newFolderName}" created` });
                setNewFolderName('');
                setShowNewFolder(false);
                loadFiles();
            } else {
                const data = await res.json();
                setResult({ type: 'error', message: data.detail || 'Failed to create folder' });
            }
        } catch (e) {
            setResult({ type: 'error', message: e.message });
        }
        setTimeout(() => setResult(null), 4000);
    };
    
    const handleDelete = async (fileItem) => {
        if (!window.confirm(`Delete "${fileItem.name}"? This cannot be undone.`)) return;
        setDeleting(fileItem.id);
        try {
            const params = new URLSearchParams();
            if (teamId) params.set('team_id', teamId);
            params.set('provider', fileItem.provider || 'google_drive');
            
            const res = await fetch(`${backendUrl}/api/documents/files/${fileItem.id}?${params}`, { method: 'DELETE' });
            if (res.ok) {
                setResult({ type: 'success', message: `Deleted: ${fileItem.name}` });
                loadFiles();
            }
        } catch (e) {
            setResult({ type: 'error', message: e.message });
        } finally {
            setDeleting(null);
            setTimeout(() => setResult(null), 4000);
        }
    };
    
    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            const res = await fetch(`${backendUrl}/api/documents/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    team_id: teamId,
                    provider: settingsProvider,
                    [settingsProvider]: settingsConfig[settingsProvider]
                })
            });
            if (res.ok) {
                setResult({ type: 'success', message: 'Storage settings saved!' });
                loadConfig();
            } else {
                const data = await res.json();
                setResult({ type: 'error', message: data.detail || 'Failed to save' });
            }
        } catch (e) {
            setResult({ type: 'error', message: e.message });
        } finally {
            setSavingSettings(false);
            setTimeout(() => setResult(null), 4000);
        }
    };
    
    const filteredFiles = files.filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const folders = filteredFiles.filter(f => f.type === 'folder');
    const regularFiles = filteredFiles.filter(f => f.type !== 'folder');
    
    return (
        <div className="space-y-4" data-testid="file-manager">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Documents</h2>
                    <p className="text-sm text-slate-500">
                        {config?.configured 
                            ? `Connected to ${config.provider === 'onedrive' ? 'OneDrive' : 'Google Drive'}`
                            : 'Connect a storage provider in Settings'}
                    </p>
                </div>
            </div>
            
            {/* Result Banner */}
            {result && (
                <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {result.message}
                </div>
            )}
            
            {/* View Tabs */}
            <div className="flex border-b border-slate-200">
                <button onClick={() => setActiveView('files')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeView === 'files' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} data-testid="docs-files-tab">
                    <Folder className="w-4 h-4" /> Files
                </button>
                <button onClick={() => setActiveView('settings')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeView === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} data-testid="docs-settings-tab">
                    <Settings className="w-4 h-4" /> Storage Settings
                </button>
            </div>
            
            {/* FILES VIEW */}
            {activeView === 'files' && (
                <>
                    {!config?.configured ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                            <Folder className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Storage Not Connected</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                {teamId 
                                    ? 'Connect Google Drive or OneDrive in the Storage Settings tab to manage team documents.'
                                    : 'Connect Google Drive or OneDrive at the league level in Settings → Cloud Storage, or configure team-level storage.'}
                            </p>
                            <button onClick={() => setActiveView('settings')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                                Go to Settings
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Breadcrumb */}
                                <div className="flex items-center gap-1 text-sm flex-1 min-w-0">
                                    {breadcrumb.map((crumb, i) => (
                                        <React.Fragment key={i}>
                                            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                                            <button onClick={() => navigateTo(i)} className={`truncate hover:text-blue-600 ${i === breadcrumb.length - 1 ? 'font-medium text-slate-800' : 'text-slate-500'}`}>
                                                {i === 0 ? <Home className="w-4 h-4 inline" /> : crumb.name}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </div>
                                
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
                                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm w-40 focus:w-56 transition-all focus:ring-2 focus:ring-blue-500" />
                                </div>
                                
                                {/* Actions */}
                                <button onClick={() => setShowNewFolder(true)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200" data-testid="docs-new-folder-btn">
                                    <FolderPlus className="w-4 h-4" /> New Folder
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50" data-testid="docs-upload-btn">
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                            
                            {/* New Folder Input */}
                            {showNewFolder && (
                                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <FolderPlus className="w-5 h-5 text-yellow-600" />
                                    <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} placeholder="Folder name..." className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm" autoFocus />
                                    <button onClick={handleCreateFolder} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Create</button>
                                    <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-sm hover:bg-slate-200">Cancel</button>
                                </div>
                            )}
                            
                            {/* Back button */}
                            {breadcrumb.length > 1 && (
                                <button onClick={() => navigateTo(breadcrumb.length - 2)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                            )}
                            
                            {/* File List */}
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg border overflow-hidden">
                                    {filteredFiles.length > 0 ? (
                                        <div className="divide-y">
                                            {/* Folders first */}
                                            {folders.map(item => (
                                                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer group" onClick={() => openFolder(item)} data-testid={`folder-${item.id}`}>
                                                    {getFileIcon(item.mimeType, item.type)}
                                                    <span className="flex-1 font-medium text-slate-800">{item.name}</span>
                                                    <button onClick={e => { e.stopPropagation(); handleDelete(item); }} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" data-testid={`delete-${item.id}`}>
                                                        {deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                </div>
                                            ))}
                                            {/* Files */}
                                            {regularFiles.map(item => (
                                                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 group">
                                                    {getFileIcon(item.mimeType, item.type)}
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-slate-800 block truncate">{item.name}</span>
                                                        <span className="text-xs text-slate-400">
                                                            {formatSize(item.size)}
                                                            {item.modifiedTime && ` · ${new Date(item.modifiedTime).toLocaleDateString()}`}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                        {item.webViewLink && (
                                                            <a href={item.webViewLink} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded" title="Open" onClick={e => e.stopPropagation()}>
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        <button onClick={() => handleDelete(item)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" data-testid={`delete-${item.id}`}>
                                                            {deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center text-slate-500">
                                            <Folder className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p className="font-medium">{searchQuery ? 'No files match your search' : 'This folder is empty'}</p>
                                            <p className="text-sm mt-1">Upload files or create a folder to get started</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
            
            {/* SETTINGS VIEW */}
            {activeView === 'settings' && (
                <div className="bg-white rounded-lg border p-6 space-y-5">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                            {teamId ? 'Team Storage Settings' : 'League Storage Settings'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {teamId 
                                ? 'Connect a cloud storage provider for team documents. If not set, the league-level storage is used.'
                                : 'League-level storage is configured in Settings → Cloud Storage. Teams can override with their own.'}
                        </p>
                    </div>
                    
                    {!teamId && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                            League-level Google Drive is configured in <strong>Admin Portal → Settings → Cloud Storage</strong>. 
                            This page is for team-level overrides.
                        </div>
                    )}
                    
                    {teamId && (
                        <>
                            {/* Provider Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Storage Provider</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setSettingsProvider('google_drive')} className={`p-4 rounded-lg border-2 text-left transition-all ${settingsProvider === 'google_drive' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="font-medium text-slate-800">Google Drive</div>
                                        <div className="text-xs text-slate-500 mt-1">15GB free, Google Workspace</div>
                                    </button>
                                    <button onClick={() => setSettingsProvider('onedrive')} className={`p-4 rounded-lg border-2 text-left transition-all ${settingsProvider === 'onedrive' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="font-medium text-slate-800">OneDrive / Office 365</div>
                                        <div className="text-xs text-slate-500 mt-1">5GB free, Microsoft 365</div>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Google Drive Config */}
                            {settingsProvider === 'google_drive' && (
                                <div className="space-y-3">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                                        Get credentials from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Cloud Console</a>. 
                                        Enable the Google Drive API, create OAuth 2.0 credentials, and generate a refresh token.
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Client ID</label>
                                            <input type="text" value={settingsConfig.google_drive.clientId} onChange={e => setSettingsConfig(prev => ({...prev, google_drive: {...prev.google_drive, clientId: e.target.value}}))} placeholder="xxx.apps.googleusercontent.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Client Secret</label>
                                            <input type="password" value={settingsConfig.google_drive.clientSecret} onChange={e => setSettingsConfig(prev => ({...prev, google_drive: {...prev.google_drive, clientSecret: e.target.value}}))} placeholder="GOCSPX-..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Refresh Token</label>
                                            <input type="password" value={settingsConfig.google_drive.refreshToken} onChange={e => setSettingsConfig(prev => ({...prev, google_drive: {...prev.google_drive, refreshToken: e.target.value}}))} placeholder="1//0gXXX..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Root Folder ID (optional)</label>
                                            <input type="text" value={settingsConfig.google_drive.folderId} onChange={e => setSettingsConfig(prev => ({...prev, google_drive: {...prev.google_drive, folderId: e.target.value}}))} placeholder="Leave empty for root" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Folder Name</label>
                                            <input type="text" value={settingsConfig.google_drive.folderName} onChange={e => setSettingsConfig(prev => ({...prev, google_drive: {...prev.google_drive, folderName: e.target.value}}))} placeholder="Team Documents" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* OneDrive Config */}
                            {settingsProvider === 'onedrive' && (
                                <div className="space-y-3">
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
                                        Get credentials from <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="underline font-medium">Azure Portal → App Registrations</a>. 
                                        Register an app, add Files.ReadWrite permissions, and generate a client secret.
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Application (Client) ID</label>
                                            <input type="text" value={settingsConfig.onedrive.clientId} onChange={e => setSettingsConfig(prev => ({...prev, onedrive: {...prev.onedrive, clientId: e.target.value}}))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Client Secret</label>
                                            <input type="password" value={settingsConfig.onedrive.clientSecret} onChange={e => setSettingsConfig(prev => ({...prev, onedrive: {...prev.onedrive, clientSecret: e.target.value}}))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Directory (Tenant) ID</label>
                                            <input type="text" value={settingsConfig.onedrive.tenantId} onChange={e => setSettingsConfig(prev => ({...prev, onedrive: {...prev.onedrive, tenantId: e.target.value}}))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Folder Name</label>
                                            <input type="text" value={settingsConfig.onedrive.folderName} onChange={e => setSettingsConfig(prev => ({...prev, onedrive: {...prev.onedrive, folderName: e.target.value}}))} placeholder="Team Documents" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Refresh Token</label>
                                            <input type="password" value={settingsConfig.onedrive.refreshToken} onChange={e => setSettingsConfig(prev => ({...prev, onedrive: {...prev.onedrive, refreshToken: e.target.value}}))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex justify-end">
                                <button onClick={handleSaveSettings} disabled={savingSettings} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50" data-testid="docs-save-settings">
                                    {savingSettings ? 'Saving...' : 'Save Storage Settings'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileManager;
