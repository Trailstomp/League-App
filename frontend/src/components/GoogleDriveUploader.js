import React, { useState, useEffect } from 'react';

const GoogleDriveUploader = ({ teamId = null, defaultVisibility = 'all_pages', onUploadSuccess = null }) => {
    const [cloudConfig, setCloudConfig] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [teams, setTeams] = useState([]);
    
    // Gallery creation fields
    const [galleryName, setGalleryName] = useState('');
    const [galleryDescription, setGalleryDescription] = useState('');
    const [displayLocation, setDisplayLocation] = useState(defaultVisibility);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [status, setStatus] = useState('active');
    const [expirationDate, setExpirationDate] = useState('');

    useEffect(() => {
        loadCloudConfig();
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const response = await fetch(`${BACKEND_URL}/api/league-data`);
            if (response.ok) {
                const data = await response.json();
                setTeams(data.teams || []);
            }
        } catch (error) {
            console.error('Error loading teams:', error);
        }
    };

    const loadCloudConfig = async () => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const response = await fetch(`${BACKEND_URL}/api/cloud-storage`);
            if (response.ok) {
                const config = await response.json();
                setCloudConfig(config);
            }
        } catch (error) {
            console.error('Error loading cloud config:', error);
        }
    };

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
        
        // Auto-generate gallery name if not set
        if (!galleryName && files.length > 0) {
            const timestamp = new Date().toLocaleDateString();
            const galleryType = teamId && teamId !== 'league-wide' ? 'Team' : 'League';
            setGalleryName(`${galleryType} Gallery - ${timestamp}`);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setDragActive(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragActive(false);
        
        const files = Array.from(event.dataTransfer.files);
        setSelectedFiles(files);
        
        // Auto-generate gallery name if not set
        if (!galleryName && files.length > 0) {
            const timestamp = new Date().toLocaleDateString();
            const galleryType = teamId && teamId !== 'league-wide' ? 'Team' : 'League';
            setGalleryName(`${galleryType} Gallery - ${timestamp}`);
        }
    };

    const uploadFiles = async () => {
        if (selectedFiles.length === 0) {
            alert('Please select files to upload');
            return;
        }

        if (!galleryName.trim()) {
            alert('Please enter a gallery name');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            console.log(`📤 Uploading ${selectedFiles.length} files and creating gallery: ${galleryName}`);
            
            const formData = new FormData();
            
            // Add all files
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });
            
            // Add gallery metadata
            formData.append('gallery_name', galleryName);
            formData.append('gallery_description', galleryDescription);
            formData.append('visibility', displayLocation);
            formData.append('status', status);
            
            // Add selected teams if team-only display
            if (displayLocation === 'team_only' && selectedTeams.length > 0) {
                selectedTeams.forEach(teamId => {
                    formData.append('selected_teams', teamId);
                });
            }
            
            // Add expiration date if set
            if (expirationDate) {
                formData.append('expiration_date', expirationDate);
            }
            
            // Add team ID context (where uploader was accessed from)
            if (teamId && teamId !== 'league-wide') {
                formData.append('context_team_id', teamId);
            }

            const response = await fetch(`${BACKEND_URL}/api/cloud-storage/google-drive/upload-and-create-gallery`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Upload and gallery creation successful:`, result);
                
                const message = `Success! ${result.message}\n\nGallery "${galleryName}" created with ${result.uploadedFiles} files.`;
                alert(message);
                
                // Reset form
                setSelectedFiles([]);
                setGalleryName('');
                setGalleryDescription('');
                setUploadProgress(0);
                
                // Callback for parent component
                if (onUploadSuccess) {
                    onUploadSuccess(result);
                }
            } else if (response.status === 500) {
                // Handle 500 errors - uploads might still be successful
                console.warn('⚠️ Server returned 500 but uploads may have succeeded');
                
                const confirmMessage = `Upload may have completed successfully despite a server error.\n\nPlease check your Google Drive folder and refresh the Photos tab.\n\nWould you like to reset the form?`;
                
                if (confirm(confirmMessage)) {
                    // Reset form
                    setSelectedFiles([]);
                    setGalleryName('');
                    setGalleryDescription('');
                    setUploadProgress(0);
                    
                    // Callback for parent component to refresh galleries
                    if (onUploadSuccess) {
                        onUploadSuccess({ status: 'possible_success', message: 'Upload may have succeeded - please check Google Drive' });
                    }
                }
                
                return; // Don't throw error for 500s
            } else {
                const errorResult = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorResult.detail || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        }

        setUploading(false);
    };

    const removeFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Check if Google Drive is configured and enabled
    const isGoogleDriveEnabled = cloudConfig?.activeProvider === 'google-drive' && 
                                cloudConfig?.googleDrive?.enabled;

    if (!isGoogleDriveEnabled) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <div className="text-yellow-600 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Google Drive Not Configured</h3>
                <p className="text-yellow-700 text-sm mb-4">
                    To upload images and videos, please configure Google Drive storage in the admin settings.
                </p>
                <p className="text-yellow-600 text-xs">
                    Contact your administrator to set up Google Drive integration.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.06 9L15 7.94V9zm-4.06 0H15l-3.94-6z"/>
                        <path d="M12 2l3.2 5.06l-1.13 1.13L12 5.25 9.93 8.19 8.8 7.06 12 2z"/>
                    </svg>
                    Upload to Google Drive
                </h3>
                <p className="text-slate-600 text-sm mt-1">
                    Files will be stored in: {cloudConfig?.googleDrive?.folderName || 'Lacrosse League Media'}
                </p>
            </div>

            <div className="p-6">
                {/* File Drop Zone */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-300 hover:border-green-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <svg className="w-12 h-12 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    
                    <div className="mb-4">
                        <p className="text-lg font-medium text-slate-700 mb-2">
                            Drag and drop files here
                        </p>
                        <p className="text-slate-500 text-sm mb-4">
                            or click to select files from your computer
                        </p>
                        
                        <label className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            Choose Files
                        </label>
                    </div>
                    
                    <p className="text-xs text-slate-400">
                        Supports: JPG, PNG, GIF, MP4, MOV, AVI (Max: {cloudConfig?.maxFileSize || 50}MB per file)
                    </p>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-sm font-medium text-slate-700 mb-3">
                            Selected Files ({selectedFiles.length})
                        </h4>
                        
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            {file.type.startsWith('image/') ? (
                                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"/>
                                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                                                </svg>
                                            )}
                                        </div>
                                        
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="flex-shrink-0 text-slate-400 hover:text-red-500"
                                        disabled={uploading}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Upload Progress */}
                        {uploading && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                                    <span>Uploading to Google Drive...</span>
                                    <span>{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div 
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Gallery Creation Fields */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border">
                            <h4 className="text-sm font-medium text-blue-800 mb-3">
                                📸 Gallery Information
                            </h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gallery Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={galleryName}
                                        onChange={(e) => setGalleryName(e.target.value)}
                                        placeholder="Enter gallery name..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        disabled={uploading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={galleryDescription}
                                        onChange={(e) => setGalleryDescription(e.target.value)}
                                        placeholder="Enter gallery description..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        disabled={uploading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Where to Display
                                    </label>
                                    <select
                                        value={displayLocation}
                                        onChange={(e) => {
                                            setDisplayLocation(e.target.value);
                                            if (e.target.value !== 'team_only') {
                                                setSelectedTeams([]);
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        disabled={uploading}
                                    >
                                        <option value="all_pages">All Pages (League and Team)</option>
                                        <option value="league_only">League Page Only</option>
                                        <option value="team_only">Team Only</option>
                                    </select>
                                </div>

                                {displayLocation === 'team_only' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Teams
                                        </label>
                                        <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
                                            {teams.map(team => (
                                                <label key={team.id} className="flex items-center space-x-2 text-sm py-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTeams.includes(team.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedTeams([...selectedTeams, team.id]);
                                                            } else {
                                                                setSelectedTeams(selectedTeams.filter(id => id !== team.id));
                                                            }
                                                        }}
                                                        disabled={uploading}
                                                    />
                                                    <span>{team.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {selectedTeams.length === 0 && (
                                            <p className="text-xs text-red-600 mt-1">Please select at least one team</p>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            disabled={uploading}
                                        >
                                            <option value="active">Active (Visible Now)</option>
                                            <option value="hidden">Hidden (Draft)</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Expiration Date (Optional)
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={expirationDate}
                                            onChange={(e) => setExpirationDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            disabled={uploading}
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                    </div>
                                </div>

                                <div className="text-xs text-blue-600">
                                    💡 Files will be uploaded to Google Drive and organized in this gallery
                                </div>
                            </div>
                        </div>

                        {/* Upload Button */}
                        <div className="mt-4">
                            <button
                                onClick={uploadFiles}
                                disabled={uploading || selectedFiles.length === 0 || !galleryName.trim()}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Creating Gallery & Uploading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14.06 9L15 7.94V9zm-4.06 0H15l-3.94-6z"/>
                                        </svg>
                                        Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} & Create Gallery
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Drive Folder Info */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14.06 9L15 7.94V9zm-4.06 0H15l-3.94-6z"/>
                            </svg>
                            <span>Files stored in Google Drive</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span>Max size: {cloudConfig?.maxFileSize || 50}MB</span>
                            <span className="text-green-600 font-medium">Google Drive Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleDriveUploader;