import React, { useState, useEffect } from 'react';
import GoogleDriveUploader from './GoogleDriveUploader';

const GalleryManager = ({ teams = [], currentUser }) => {
    const [galleries, setGalleries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [editingGallery, setEditingGallery] = useState(null);
    const [activeView, setActiveView] = useState('manage'); // 'manage' or 'upload'
    const [editForm, setEditForm] = useState({
        status: '',
        expirationDate: ''
    });

    useEffect(() => {
        loadGalleries();
    }, [showAll]);

    const loadGalleries = async () => {
        try {
            setLoading(true);
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            
            const endpoint = showAll ? '/api/galleries-new' : '/api/galleries-new/active';
            const response = await fetch(`${BACKEND_URL}${endpoint}`);
            
            if (response.ok) {
                const data = await response.json();
                setGalleries(data.galleries || []);
            } else {
                setGalleries([]);
            }
        } catch (error) {
            console.error('Error loading galleries:', error);
            setGalleries([]);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (gallery) => {
        setEditingGallery(gallery.id);
        setEditForm({
            status: gallery.status || 'active',
            expirationDate: gallery.expirationDate ? gallery.expirationDate.slice(0, 16) : ''
        });
    };

    const cancelEdit = () => {
        setEditingGallery(null);
        setEditForm({ status: '', expirationDate: '' });
    };

    const saveEdit = async (galleryId) => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            
            const body = new URLSearchParams();
            body.append('status', editForm.status);
            if (editForm.expirationDate) {
                body.append('expiration_date', editForm.expirationDate);
            }
            
            const response = await fetch(`${BACKEND_URL}/api/galleries-new/${galleryId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body
            });

            if (response.ok) {
                loadGalleries();
                cancelEdit();
                alert('Gallery updated successfully');
            } else {
                const error = await response.json();
                alert(`Failed to update: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error updating gallery:', error);
            alert('Error updating gallery');
        }
    };

    const quickStatusUpdate = async (galleryId, newStatus) => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            
            const body = new URLSearchParams();
            body.append('status', newStatus);
            
            const response = await fetch(`${BACKEND_URL}/api/galleries-new/${galleryId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body
            });

            if (response.ok) {
                loadGalleries();
                alert(`Gallery ${newStatus === 'active' ? 'activated' : newStatus}`);
            } else {
                const error = await response.json();
                alert(`Failed to update: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error updating gallery:', error);
            alert('Error updating gallery');
        }
    };

    const deleteGallery = async (galleryId, galleryName, deleteFiles = false) => {
        const action = deleteFiles ? 'DELETE gallery AND all files from Google Drive' : 'DELETE gallery (keep files in Google Drive)';
        
        if (!confirm(`${action}\n\nGallery: "${galleryName}"\n\nThis action cannot be undone!`)) return;

        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            
            const response = await fetch(`${BACKEND_URL}/api/galleries-new/${galleryId}?delete_files=${deleteFiles}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const result = await response.json();
                loadGalleries();
                
                let message = `Gallery "${galleryName}" deleted.`;
                if (deleteFiles && result.deletedFiles) {
                    message += ` Files: ${result.deletedFiles.deleted} deleted, ${result.deletedFiles.failed} failed.`;
                }
                alert(message);
            } else {
                const error = await response.json();
                alert(`Delete failed: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error deleting gallery:', error);
            alert('Error deleting gallery');
        }
    };

    const openGallery = (gallery) => {
        // TODO: Implement gallery image viewer/manager
        alert(`Opening gallery: ${gallery.name}\nImages: ${gallery.mediaItems?.length || 0}\n\nImage management interface coming soon!`);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleDateString();
    };

    const getStatusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-700',
            hidden: 'bg-yellow-100 text-yellow-700', 
            archived: 'bg-gray-100 text-gray-700'
        };
        return `px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.active}`;
    };

    const getDisplayLocation = (gallery) => {
        const visibility = gallery.visibility || 'all_pages';
        switch (visibility) {
            case 'all_pages': return 'All Pages';
            case 'league_only': return 'League Only';
            case 'team_only': 
                if (gallery.selectedTeams && gallery.selectedTeams.length > 0) {
                    return `Teams (${gallery.selectedTeams.length})`;
                }
                return 'Team Only';
            default: return 'All Pages';
        }
    };

    const isExpired = (expirationDate) => {
        return expirationDate && new Date(expirationDate) < new Date();
    };

    return (
        <div className="p-4">
            {/* Header with Tabs */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveView('manage')}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            activeView === 'manage'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        📋 Manage Galleries
                    </button>
                    <button
                        onClick={() => setActiveView('upload')}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            activeView === 'upload'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        📤 Upload Images
                    </button>
                </div>
                
                {activeView === 'manage' && (
                    <div className="flex items-center space-x-3">
                        <label className="flex items-center text-sm">
                            <input
                                type="checkbox"
                                checked={showAll}
                                onChange={(e) => setShowAll(e.target.checked)}
                                className="mr-2"
                            />
                            Show all galleries
                        </label>
                        <button
                            onClick={loadGalleries}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                )}
            </div>

            {/* Content based on active view */}
            {activeView === 'upload' ? (
                /* Upload View */
                <div>
                    <GoogleDriveUploader 
                        teamId="league-wide" 
                        defaultVisibility="all_pages"
                        onUploadSuccess={() => {
                            loadGalleries();
                            setActiveView('manage');
                        }}
                    />
                </div>
            ) : (
                /* Manage View */
                <div>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600 text-sm">Loading galleries...</p>
                        </div>
                    ) : galleries.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No galleries found.
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <div className="grid grid-cols-8 gap-3 text-xs font-medium text-gray-700 uppercase tracking-wide">
                            <div className="col-span-2">Gallery</div>
                            <div>Status</div>
                            <div>Where it Appears</div>
                            <div>Files</div>
                            <div>Created</div>
                            <div>Expires</div>
                            <div>Actions</div>
                        </div>
                    </div>

                    {/* Gallery Rows */}
                    {galleries.map((gallery, index) => (
                        <div key={gallery.id} className={`px-4 py-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            {editingGallery === gallery.id ? (
                                /* Edit Mode */
                                <div className="grid grid-cols-8 gap-3 items-center text-sm">
                                    <div className="col-span-2">
                                        <div className="font-medium text-gray-900">{gallery.name}</div>
                                        {gallery.description && (
                                            <div className="text-xs text-gray-500 truncate">{gallery.description}</div>
                                        )}
                                    </div>
                                    <div>
                                        <select
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                            className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
                                        >
                                            <option value="active">Active</option>
                                            <option value="hidden">Hidden</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {getDisplayLocation(gallery)}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {gallery.mediaItems?.length || 0}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {formatDate(gallery.createdAt)}
                                    </div>
                                    <div>
                                        <input
                                            type="datetime-local"
                                            value={editForm.expirationDate}
                                            onChange={(e) => setEditForm({...editForm, expirationDate: e.target.value})}
                                            className="text-xs border border-gray-300 rounded px-1 py-1 w-full"
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => saveEdit(gallery.id)}
                                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div className="grid grid-cols-8 gap-3 items-center text-sm">
                                    <div className="col-span-2">
                                        <div className="font-medium text-gray-900">{gallery.name}</div>
                                        {gallery.description && (
                                            <div className="text-xs text-gray-500 truncate">{gallery.description}</div>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={getStatusBadge(gallery.status)}>
                                            {gallery.status}
                                        </span>
                                        {isExpired(gallery.expirationDate) && (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                                EXPIRED
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {getDisplayLocation(gallery)}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {gallery.mediaItems?.length || 0}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {formatDate(gallery.createdAt)}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {formatDate(gallery.expirationDate)}
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => startEdit(gallery)}
                                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                            title="Edit gallery"
                                        >
                                            Edit
                                        </button>
                                        
                                        <button
                                            onClick={() => openGallery(gallery)}
                                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                            title="View and manage images"
                                        >
                                            Images ({gallery.mediaItems?.length || 0})
                                        </button>
                                        
                                        {gallery.status !== 'active' && (
                                            <button
                                                onClick={() => quickStatusUpdate(gallery.id, 'active')}
                                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                title="Make active"
                                            >
                                                Activate
                                            </button>
                                        )}
                                        
                                        {/* Clear delete buttons instead of dropdown */}
                                        <button
                                            onClick={() => deleteGallery(gallery.id, gallery.name, false)}
                                            className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                                            title="Delete gallery only (keep Google Drive files)"
                                        >
                                            Delete Gallery
                                        </button>
                                        
                                        {gallery.mediaItems?.length > 0 && (
                                            <button
                                                onClick={() => deleteGallery(gallery.id, gallery.name, true)}
                                                className="px-2 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-800"
                                                title="Delete gallery AND all files from Google Drive"
                                            >
                                                Delete All ({gallery.mediaItems.length} files)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GalleryManager;