import React, { useState, useEffect, useRef, useCallback } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const MediaManager = ({ ownerType = 'league', ownerId = 'league', canEdit = false, currentUser = null }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('photos');
    const [showAddVideo, setShowAddVideo] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoTitle, setVideoTitle] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BACKEND_URL}/api/media-items?owner_type=${ownerType}&owner_id=${ownerId}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
            }
        } catch (e) {
            console.error('Error loading media:', e);
        } finally {
            setLoading(false);
        }
    }, [ownerType, ownerId]);

    useEffect(() => { loadItems(); }, [loadItems]);

    const photos = items.filter(i => i.type === 'photo');
    const videos = items.filter(i => i.type === 'video');

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setUploading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('owner_type', ownerType);
                formData.append('owner_id', ownerId);
                formData.append('title', file.name);
                formData.append('uploaded_by', currentUser?.email || '');

                const res = await fetch(`${BACKEND_URL}/api/media-items/upload`, {
                    method: 'POST',
                    body: formData
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    alert(`Upload failed: ${err.detail || 'Unknown error'}`);
                }
            }
            loadItems();
        } catch (e) {
            console.error('Upload error:', e);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddVideo = async () => {
        if (!videoUrl.trim()) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/media-items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'video',
                    url: videoUrl.trim(),
                    title: videoTitle.trim() || 'Video',
                    ownerType,
                    ownerId,
                    uploadedBy: currentUser?.email || ''
                })
            });
            if (res.ok) {
                setVideoUrl('');
                setVideoTitle('');
                setShowAddVideo(false);
                loadItems();
            }
        } catch (e) {
            console.error('Error adding video:', e);
        }
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm('Delete this item?')) return;
        try {
            await fetch(`${BACKEND_URL}/api/media-items/${itemId}`, { method: 'DELETE' });
            loadItems();
        } catch (e) {
            console.error('Error deleting:', e);
        }
    };

    // Extract YouTube embed URL
    const getYouTubeEmbed = (url) => {
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    };

    const resolveUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BACKEND_URL}${url}`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                <p className="text-slate-500 mt-2 text-sm">Loading media...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden" data-testid="media-manager">
            {/* Header */}
            <div className="border-b px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-800">
                        {ownerType === 'league' ? 'League Media' : 'Team Media'}
                    </h3>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setActiveTab('photos')}
                            data-testid="photos-tab"
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === 'photos' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            Photos ({photos.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('videos')}
                            data-testid="videos-tab"
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === 'videos' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            Videos ({videos.length})
                        </button>
                    </div>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        {activeTab === 'photos' && (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    data-testid="photo-upload-input"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    data-testid="upload-photos-btn"
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {uploading ? 'Uploading...' : 'Upload Photos'}
                                </button>
                            </>
                        )}
                        {activeTab === 'videos' && (
                            <button
                                onClick={() => setShowAddVideo(true)}
                                data-testid="add-video-btn"
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add Video Link
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {activeTab === 'photos' && (
                    <>
                        {photos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {photos.map(item => (
                                    <div key={item.id} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden">
                                        <img
                                            src={resolveUrl(item.url)}
                                            alt={item.title}
                                            className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                                            onClick={() => setSelectedImage(item)}
                                            loading="lazy"
                                        />
                                        {canEdit && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold"
                                                data-testid={`delete-photo-${item.id}`}
                                            >
                                                X
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <svg className="mx-auto h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5"/><polyline points="21,15 16,10 5,21" strokeWidth="1.5"/></svg>
                                <p className="font-medium">No photos yet</p>
                                {canEdit && <p className="text-sm mt-1">Click "Upload Photos" to add images</p>}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'videos' && (
                    <>
                        {videos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {videos.map(item => {
                                    const embedUrl = getYouTubeEmbed(item.url);
                                    return (
                                        <div key={item.id} className="relative group rounded-lg overflow-hidden border border-slate-200">
                                            {embedUrl ? (
                                                <div className="aspect-video">
                                                    <iframe
                                                        src={embedUrl}
                                                        title={item.title}
                                                        className="w-full h-full"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            ) : (
                                                <a href={item.url} target="_blank" rel="noopener noreferrer"
                                                   className="aspect-video flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors">
                                                    <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polygon points="23 7 16 12 23 17 23 7" strokeWidth="1.5"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="1.5"/></svg>
                                                </a>
                                            )}
                                            <div className="p-2 flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-700 truncate">{item.title}</span>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-red-500 hover:text-red-700 text-xs font-medium ml-2 flex-shrink-0"
                                                        data-testid={`delete-video-${item.id}`}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <svg className="mx-auto h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polygon points="23 7 16 12 23 17 23 7" strokeWidth="1.5"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="1.5"/></svg>
                                <p className="font-medium">No videos yet</p>
                                {canEdit && <p className="text-sm mt-1">Click "Add Video Link" to add a YouTube or video URL</p>}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add Video Modal */}
            {showAddVideo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" data-testid="add-video-modal">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Add Video</h3>
                        <input
                            type="text"
                            placeholder="Video title"
                            value={videoTitle}
                            onChange={e => setVideoTitle(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            data-testid="video-title-input"
                        />
                        <input
                            type="text"
                            placeholder="YouTube or video URL"
                            value={videoUrl}
                            onChange={e => setVideoUrl(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            data-testid="video-url-input"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => { setShowAddVideo(false); setVideoUrl(''); setVideoTitle(''); }}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddVideo}
                                disabled={!videoUrl.trim()}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                data-testid="save-video-btn"
                            >
                                Add Video
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <img
                            src={resolveUrl(selectedImage.url)}
                            alt={selectedImage.title}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold"
                        >
                            X
                        </button>
                        {selectedImage.title && (
                            <p className="text-white text-center mt-3 text-sm">{selectedImage.title}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaManager;
