import React, { useState, useEffect } from 'react';

const GalleryManager = () => {
    const [galleries, setGalleries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        loadGalleries();
    }, [showAll]);

    const loadGalleries = async () => {
        try {
            setLoading(true);
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            
            // Use different endpoint based on showAll toggle
            const endpoint = showAll ? '/api/galleries-new' : '/api/galleries-new/active';
            const response = await fetch(`${BACKEND_URL}${endpoint}`);
            
            if (response.ok) {
                const data = await response.json();
                setGalleries(data.galleries || []);
            } else {
                console.error('Failed to load galleries');
                setGalleries([]);
            }
        } catch (error) {
            console.error('Error loading galleries:', error);
            setGalleries([]);
        } finally {
            setLoading(false);
        }
    };

    const updateGalleryStatus = async (galleryId, newStatus, expirationDate = null) => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            
            const body = new URLSearchParams();
            body.append('status', newStatus);
            if (expirationDate) {
                body.append('expiration_date', expirationDate);
            }
            
            const response = await fetch(`${BACKEND_URL}/api/galleries-new/${galleryId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body
            });

            if (response.ok) {
                loadGalleries(); // Refresh the list
                alert(`Gallery status updated to ${newStatus}`);
            } else {
                const error = await response.json();
                alert(`Failed to update status: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error updating gallery status:', error);
            alert('Error updating gallery status');
        }
    };

    const deleteGallery = async (galleryId, galleryName, deleteFiles = false) => {
        const confirmMessage = deleteFiles 
            ? `Are you sure you want to DELETE "${galleryName}" and permanently remove all files from Google Drive?\n\nThis action cannot be undone!`
            : `Are you sure you want to delete the gallery "${galleryName}"?\n\nFiles will remain in Google Drive.`;
            
        if (!confirm(confirmMessage)) return;

        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            
            const response = await fetch(`${BACKEND_URL}/api/galleries-new/${galleryId}?delete_files=${deleteFiles}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const result = await response.json();
                loadGalleries(); // Refresh the list
                
                let message = `Gallery "${galleryName}" deleted successfully.`;
                if (deleteFiles && result.deletedFiles) {
                    message += `\n\nGoogle Drive cleanup: ${result.deletedFiles.deleted} files deleted, ${result.deletedFiles.failed} failed.`;
                }
                alert(message);
            } else {
                const error = await response.json();
                alert(`Failed to delete gallery: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error deleting gallery:', error);
            alert('Error deleting gallery');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'hidden': return 'bg-yellow-100 text-yellow-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    const isExpired = (expirationDate) => {
        if (!expirationDate) return false;
        return new Date(expirationDate) < new Date();
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Gallery Manager</h2>
                
                <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={showAll}
                            onChange={(e) => setShowAll(e.target.checked)}
                            className="mr-2"
                        />
                        Show all galleries (including hidden/archived)
                    </label>
                    
                    <button
                        onClick={loadGalleries}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading galleries...</p>
                </div>
            ) : galleries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No galleries found.
                </div>
            ) : (
                <div className="grid gap-6">
                    {galleries.map((gallery) => (
                        <div key={gallery.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{gallery.name}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(gallery.status)}`}>
                                            {gallery.status}
                                        </span>
                                        {isExpired(gallery.expirationDate) && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                EXPIRED
                                            </span>
                                        )}
                                    </div>
                                    
                                    {gallery.description && (
                                        <p className="text-gray-600 mb-2">{gallery.description}</p>
                                    )}
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                                        <div>
                                            <span className="font-medium">Team:</span> {gallery.teamId || 'League-wide'}
                                        </div>
                                        <div>
                                            <span className="font-medium">Files:</span> {gallery.mediaItems?.length || 0}
                                        </div>
                                        <div>
                                            <span className="font-medium">Created:</span> {formatDate(gallery.createdAt)}
                                        </div>
                                        <div>
                                            <span className="font-medium">Expires:</span> {formatDate(gallery.expirationDate)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {/* Status Update Buttons */}
                                {gallery.status !== 'active' && (
                                    <button
                                        onClick={() => updateGalleryStatus(gallery.id, 'active')}
                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                    >
                                        Make Active
                                    </button>
                                )}
                                
                                {gallery.status !== 'hidden' && (
                                    <button
                                        onClick={() => updateGalleryStatus(gallery.id, 'hidden')}
                                        className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                                    >
                                        Hide
                                    </button>
                                )}
                                
                                {gallery.status !== 'archived' && (
                                    <button
                                        onClick={() => updateGalleryStatus(gallery.id, 'archived')}
                                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                    >
                                        Archive
                                    </button>
                                )}

                                {/* Delete Buttons */}
                                <button
                                    onClick={() => deleteGallery(gallery.id, gallery.name, false)}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                >
                                    Delete Gallery Only
                                </button>
                                
                                {gallery.mediaItems?.length > 0 && (
                                    <button
                                        onClick={() => deleteGallery(gallery.id, gallery.name, true)}
                                        className="px-3 py-1 bg-red-800 text-white rounded text-sm hover:bg-red-900"
                                    >
                                        Delete Gallery + Files
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GalleryManager;