import React, { useState, useEffect } from 'react';
import GoogleDriveUploader from './GoogleDriveUploader';

const GalleryManager = ({ teams = [], currentUser }) => {
    const [galleries, setGalleries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [editingGallery, setEditingGallery] = useState(null);
    const [activeView, setActiveView] = useState('manage'); // 'manage' or 'upload'
    const [selectedGallery, setSelectedGallery] = useState(null); // For image management
    const [deleteDialogGallery, setDeleteDialogGallery] = useState(null); // For delete confirmation
    const [selectedDeleteOption, setSelectedDeleteOption] = useState('gallery_only'); // For delete option selection
    const [addImagesGalleryId, setAddImagesGalleryId] = useState(null); // For maintaining gallery context when adding images
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
        setSelectedGallery(gallery);
    };

    const closeGalleryManager = () => {
        setSelectedGallery(null);
    };

    const deleteImageFromGallery = async (galleryId, imageId, imageName) => {
        if (!confirm(`Delete image "${imageName}" from this gallery?\n\nThis will remove it from the gallery but keep it in Google Drive.`)) return;

        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            
            const response = await fetch(`${BACKEND_URL}/api/galleries-new/${galleryId}/images/${imageId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Refresh the gallery data
                loadGalleries();
                // Update the selected gallery view
                const updatedGallery = galleries.find(g => g.id === galleryId);
                if (updatedGallery) {
                    setSelectedGallery(updatedGallery);
                }
                alert(`Image "${imageName}" removed from gallery`);
            } else {
                const error = await response.json();
                alert(`Failed to delete image: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Error deleting image');
        }
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
                    {/* Show context banner when adding to existing gallery */}
                    {addImagesGalleryId && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        Adding images to existing gallery
                                    </p>
                                    <p className="text-xs text-green-600">
                                        {galleries.find(g => g.id === addImagesGalleryId)?.name || 'Selected gallery'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAddImagesGalleryId(null)}
                                    className="ml-auto text-green-600 hover:text-green-800"
                                    title="Cancel adding to existing gallery"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <GoogleDriveUploader 
                        teamId="league-wide" 
                        defaultVisibility="all_pages"
                        selectedGalleryId={addImagesGalleryId} // Use the dedicated state for add images flow
                        onUploadSuccess={() => {
                            loadGalleries();
                            setActiveView('manage');
                            setAddImagesGalleryId(null); // Clear the add images context
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
                                        
                                        <button
                                            onClick={() => setDeleteDialogGallery(gallery)}
                                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                            title="Delete gallery"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                        </div>
                    )}
                </div>
            )}
            
            {/* Image Management Modal */}
            {selectedGallery && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeGalleryManager}>
                    <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{selectedGallery.name}</h3>
                                <p className="text-sm text-gray-600">{selectedGallery.mediaItems?.length || 0} images</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => {
                                        // Set the gallery context for adding images
                                        setAddImagesGalleryId(selectedGallery.id);
                                        setActiveView('upload');
                                        closeGalleryManager(); // Close the modal
                                    }}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                    title="Add more images to this gallery"
                                >
                                    + Add Images
                                </button>
                                <button
                                    onClick={closeGalleryManager}
                                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="p-4 overflow-y-auto max-h-[70vh]">
                            {selectedGallery.mediaItems?.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No images in this gallery yet.</p>
                                    <p className="text-sm mt-2">Use the "📤 Upload Images" tab to add images.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {selectedGallery.mediaItems.map((item) => (
                                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                            {/* Image Preview */}
                                            <div className="aspect-square bg-gray-100 relative">
                                                <img
                                                    src={item.thumbnailUrl || item.url}
                                                    alt={item.filename}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // Fallback to a placeholder
                                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDE3SDE2TDEyIDEzSDhMMTIgMTdaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                                                    }}
                                                />
                                                {/* File type indicator */}
                                                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                    {item.type === 'video' ? '🎥' : '📷'}
                                                </div>
                                            </div>
                                            
                                            {/* Image Details */}
                                            <div className="p-3">
                                                <p className="text-sm font-medium text-gray-900 truncate" title={item.filename}>
                                                    {item.filename}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {item.size ? `${Math.round(item.size / 1024)} KB` : 'Unknown size'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : 'Unknown date'}
                                                </p>
                                                
                                                {/* Image Actions */}
                                                <div className="flex space-x-2 mt-3">
                                                    <button
                                                        onClick={() => window.open(item.url, '_blank')}
                                                        className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => deleteImageFromGallery(selectedGallery.id, item.id, item.filename)}
                                                        className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600">
                                    Gallery: {getDisplayLocation(selectedGallery)} | 
                                    Status: <span className={getStatusBadge(selectedGallery.status)}>{selectedGallery.status}</span>
                                </p>
                                <button
                                    onClick={closeGalleryManager}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete Confirmation Dialog */}
            {deleteDialogGallery && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDeleteDialogGallery(null)}>
                    <div className="bg-white rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        {/* Dialog Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Delete Gallery</h3>
                            <button
                                onClick={() => setDeleteDialogGallery(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        
                        {/* Dialog Content */}
                        <div className="p-4">
                            <p className="text-gray-700 mb-4">
                                What would you like to delete for gallery <strong>"{deleteDialogGallery.name}"</strong>?
                            </p>
                            
                            <div className="space-y-3">
                                {/* Option 1: Delete Gallery Only */}
                                <button
                                    onClick={() => {
                                        deleteGallery(deleteDialogGallery.id, deleteDialogGallery.name, false);
                                        setDeleteDialogGallery(null);
                                    }}
                                    className="w-full p-3 text-left border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-orange-500 rounded-full mr-3"></div>
                                        <div>
                                            <div className="font-medium text-gray-900">Delete Gallery Only</div>
                                            <div className="text-sm text-gray-600">
                                                Remove gallery from the website but keep all {deleteDialogGallery.mediaItems?.length || 0} files in Google Drive
                                            </div>
                                        </div>
                                    </div>
                                </button>
                                
                                {/* Option 2: Delete Everything */}
                                {deleteDialogGallery.mediaItems?.length > 0 && (
                                    <button
                                        onClick={() => {
                                            deleteGallery(deleteDialogGallery.id, deleteDialogGallery.name, true);
                                            setDeleteDialogGallery(null);
                                        }}
                                        className="w-full p-3 text-left border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                                            <div>
                                                <div className="font-medium text-gray-900">Delete Everything</div>
                                                <div className="text-sm text-gray-600">
                                                    Remove gallery AND permanently delete all {deleteDialogGallery.mediaItems.length} files from Google Drive
                                                </div>
                                                <div className="text-xs text-red-600 mt-1">
                                                    ⚠️ This action cannot be undone!
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Dialog Footer */}
                        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                            <button
                                onClick={() => setDeleteDialogGallery(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryManager;