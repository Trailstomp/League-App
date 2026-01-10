import React, { useState, useEffect } from 'react';

const GoogleDriveFolderManager = ({ teams = [] }) => {
    const [folderStructure, setFolderStructure] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(false);
    const [creatingTeamFolders, setCreatingTeamFolders] = useState({});
    const [cleanupPreview, setCleanupPreview] = useState(null);
    const [cleaning, setCleaning] = useState(false);
    const [message, setMessage] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        loadFolderStructure();
    }, []);

    const loadFolderStructure = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/drive/folders`);
            if (response.ok) {
                const data = await response.json();
                setFolderStructure(data);
            }
        } catch (error) {
            console.error('Error loading folder structure:', error);
        } finally {
            setLoading(false);
        }
    };

    const initializeFolders = async () => {
        try {
            setInitializing(true);
            setMessage('');
            const response = await fetch(`${backendUrl}/api/drive/folders/initialize`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const data = await response.json();
                setMessage('✅ Folder structure initialized successfully!');
                loadFolderStructure();
            } else {
                const error = await response.json();
                setMessage(`❌ ${error.detail || 'Failed to initialize folders'}`);
            }
        } catch (error) {
            setMessage('❌ Error initializing folders');
        } finally {
            setInitializing(false);
        }
    };

    const createTeamFolders = async (teamId, teamName) => {
        try {
            setCreatingTeamFolders(prev => ({ ...prev, [teamId]: true }));
            
            const response = await fetch(`${backendUrl}/api/drive/folders/team/${teamId}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                setMessage(`✅ Folders created for ${teamName}`);
                loadFolderStructure();
            } else {
                const error = await response.json();
                setMessage(`❌ ${error.detail || 'Failed to create team folders'}`);
            }
        } catch (error) {
            setMessage('❌ Error creating team folders');
        } finally {
            setCreatingTeamFolders(prev => ({ ...prev, [teamId]: false }));
        }
    };

    const previewCleanup = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/drive/cleanup/preview`);
            if (response.ok) {
                const data = await response.json();
                setCleanupPreview(data);
            }
        } catch (error) {
            console.error('Error previewing cleanup:', error);
        }
    };

    const runCleanup = async () => {
        if (!window.confirm('Are you sure you want to clean up orphaned data? This cannot be undone.')) {
            return;
        }
        
        try {
            setCleaning(true);
            const response = await fetch(`${backendUrl}/api/drive/cleanup/orphaned`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const data = await response.json();
                setMessage(`✅ Cleanup complete! Removed ${data.report.galleries_removed} galleries, ${data.report.folder_references_removed} folder references`);
                setCleanupPreview(null);
                loadFolderStructure();
            } else {
                setMessage('❌ Cleanup failed');
            }
        } catch (error) {
            setMessage('❌ Error during cleanup');
        } finally {
            setCleaning(false);
        }
    };

    const openDriveFolder = (folderId) => {
        window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank');
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-slate-600">Loading folder structure...</p>
            </div>
        );
    }

    const isConfigured = folderStructure?.status === 'ok' && folderStructure?.configured;
    const isInitialized = folderStructure?.folder_structure?.teams_folder_id;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">📁 Google Drive Folder Structure</h3>
                    <p className="text-sm text-slate-600">Organize photos and media in Google Drive</p>
                </div>
                <button
                    onClick={loadFolderStructure}
                    className="px-3 py-1 text-sm bg-slate-100 rounded hover:bg-slate-200"
                >
                    🔄 Refresh
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Configuration Status */}
            {!isConfigured ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <span className="text-3xl">⚠️</span>
                        <div>
                            <h4 className="font-semibold text-yellow-800">Google Drive Not Configured</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                                Please configure Google Drive in the Cloud Storage settings first. 
                                You'll need to set up OAuth credentials and authorize the connection.
                            </p>
                        </div>
                    </div>
                </div>
            ) : !isInitialized ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <span className="text-3xl">📁</span>
                        <div className="flex-1">
                            <h4 className="font-semibold text-blue-800">Initialize Folder Structure</h4>
                            <p className="text-sm text-blue-700 mt-1 mb-4">
                                Create the organized folder structure in your Google Drive:
                            </p>
                            <div className="bg-white rounded-lg p-4 text-sm font-mono text-slate-700 mb-4">
                                📁 MLBL League (your root folder)<br/>
                                &nbsp;&nbsp;├── 📁 Team Logos<br/>
                                &nbsp;&nbsp;├── 📁 League Gallery<br/>
                                &nbsp;&nbsp;└── 📁 Teams<br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── 📁 [Team Name]<br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── 📁 Player Photos<br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── 📁 Team Gallery<br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── ...
                            </div>
                            <button
                                onClick={initializeFolders}
                                disabled={initializing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {initializing ? '⏳ Initializing...' : '📁 Initialize Folders'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Folder Structure Display */}
                    <div className="bg-white border rounded-lg p-6">
                        <h4 className="font-semibold text-slate-800 mb-4">✅ Folder Structure Initialized</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div 
                                className="bg-slate-50 rounded-lg p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => openDriveFolder(folderStructure.folder_structure.team_logos_folder_id)}
                            >
                                <div className="text-2xl mb-2">🏷️</div>
                                <div className="font-medium text-slate-800">Team Logos</div>
                                <div className="text-xs text-blue-600 mt-1">Click to open in Drive →</div>
                            </div>
                            
                            <div 
                                className="bg-slate-50 rounded-lg p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => openDriveFolder(folderStructure.folder_structure.league_gallery_folder_id)}
                            >
                                <div className="text-2xl mb-2">🖼️</div>
                                <div className="font-medium text-slate-800">League Gallery</div>
                                <div className="text-xs text-blue-600 mt-1">Click to open in Drive →</div>
                            </div>
                            
                            <div 
                                className="bg-slate-50 rounded-lg p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => openDriveFolder(folderStructure.folder_structure.teams_folder_id)}
                            >
                                <div className="text-2xl mb-2">👥</div>
                                <div className="font-medium text-slate-800">Teams Folder</div>
                                <div className="text-xs text-blue-600 mt-1">Click to open in Drive →</div>
                            </div>
                        </div>

                        {/* Team Folders */}
                        <h4 className="font-semibold text-slate-800 mb-3">Team Folders</h4>
                        {teams.length === 0 ? (
                            <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-500">
                                No teams yet. Create teams first, then set up their folders.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {teams.map(team => {
                                    const teamFolders = folderStructure.folder_structure.team_folders?.[team.id];
                                    const hasFolder = !!teamFolders;
                                    
                                    return (
                                        <div 
                                            key={team.id} 
                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{hasFolder ? '✅' : '📁'}</span>
                                                <div>
                                                    <div className="font-medium text-slate-800">{team.name}</div>
                                                    {hasFolder && (
                                                        <div className="text-xs text-slate-500">
                                                            Player Photos + Team Gallery folders ready
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {hasFolder ? (
                                                <button
                                                    onClick={() => openDriveFolder(teamFolders.folder_id)}
                                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                >
                                                    Open in Drive →
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => createTeamFolders(team.id, team.name)}
                                                    disabled={creatingTeamFolders[team.id]}
                                                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                                                >
                                                    {creatingTeamFolders[team.id] ? '⏳ Creating...' : '➕ Create Folders'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Data Cleanup Section */}
            <div className="bg-white border rounded-lg p-6">
                <h4 className="font-semibold text-slate-800 mb-2">🧹 Data Cleanup</h4>
                <p className="text-sm text-slate-600 mb-4">
                    Clean up orphaned galleries and folder references from deleted teams.
                </p>
                
                {!cleanupPreview ? (
                    <button
                        onClick={previewCleanup}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                    >
                        🔍 Preview Cleanup
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-slate-700">Current Teams:</span>
                                    <span className="ml-2 text-slate-600">{cleanupPreview.valid_teams?.length || 0}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-slate-700">Orphaned Galleries:</span>
                                    <span className="ml-2 text-red-600">{cleanupPreview.orphaned_galleries?.length || 0}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-slate-700">Orphaned Folder Refs:</span>
                                    <span className="ml-2 text-red-600">{cleanupPreview.orphaned_folder_references?.length || 0}</span>
                                </div>
                            </div>
                            
                            {cleanupPreview.orphaned_galleries?.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-sm font-medium text-slate-700 mb-2">Galleries to remove:</div>
                                    <div className="text-xs text-slate-600 space-y-1">
                                        {cleanupPreview.orphaned_galleries.map((g, i) => (
                                            <div key={i}>• {g.name || g.id} (Team: {g.teamId})</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCleanupPreview(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={runCleanup}
                                disabled={cleaning || (cleanupPreview.orphaned_galleries?.length === 0 && cleanupPreview.orphaned_folder_references?.length === 0)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {cleaning ? '⏳ Cleaning...' : '🗑️ Run Cleanup'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoogleDriveFolderManager;
