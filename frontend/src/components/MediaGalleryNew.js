import React, { useState, useEffect } from 'react';
import GoogleDriveUploader from './GoogleDriveUploader';

// Icons
const ImageIcon = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
    </svg>
);

const Video = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
);

const Upload = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17,8 12,3 7,8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
);

const MediaGalleryNew = ({ teams = [], teamId = null, title = "Media Gallery" }) => {
    const [activeTab, setActiveTab] = useState('photos');
    const [galleries, setGalleries] = useState([]);
    const [loading, setLoading] = useState(true);

    console.log('🆕 NEW MediaGallery Component Loaded:', { title, teamId, teamsCount: teams.length });

    // Load galleries from backend
    useEffect(() => {
        loadGalleries();
    }, [teamId]);

    const loadGalleries = async () => {
        try {
            setLoading(true);
            console.log('📡 Loading galleries from backend...');
            
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/galleries-new`);
            if (response.ok) {
                const data = await response.json();
                console.log('📡 Galleries loaded:', data);
                setGalleries(data.galleries || []);
            } else {
                console.log('📡 No galleries found or error loading');
                setGalleries([]);
            }
        } catch (error) {
            console.error('📡 Error loading galleries:', error);
            setGalleries([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter galleries based on scope
    const getFilteredGalleries = () => {
        if (!galleries.length) return [];
        
        return galleries.filter(gallery => {
            if (teamId) {
                // Team page: show team-specific + league-wide galleries
                return gallery.teamId === teamId || gallery.visibility === 'league-wide';
            } else {
                // League page: show only league-wide galleries
                return gallery.visibility === 'league-wide' || gallery.visibility === 'public';
            }
        });
    };

    const filteredGalleries = getFilteredGalleries();
    const photoGalleries = filteredGalleries.filter(g => g.type === 'photo');
    const videoGalleries = filteredGalleries.filter(g => g.type === 'video');

    const handleUploadSuccess = (result) => {
        console.log('🎉 Upload successful, refreshing galleries:', result);
        loadGalleries(); // Refresh galleries after successful upload
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab('photos')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === 'photos'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <ImageIcon className="mr-1 inline" size={14} />
                            Photos ({photoGalleries.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('videos')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === 'videos'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Video className="mr-1 inline" size={14} />
                            Videos ({videoGalleries.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === 'upload'
                                    ? 'bg-green-100 text-green-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Upload className="mr-1 inline" size={14} />
                            Upload
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-600 mt-2">Loading galleries...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'photos' && (
                            <div className="space-y-6">
                                {photoGalleries.length > 0 ? (
                                    photoGalleries.map(gallery => (
                                        <div key={gallery.id} className="border rounded-lg p-4">
                                            <h4 className="font-semibold text-slate-800 mb-2">{gallery.name}</h4>
                                            <p className="text-slate-600 text-sm mb-3">{gallery.description}</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {gallery.mediaItems?.map(item => (
                                                    <div key={item.id} className="aspect-square bg-slate-100 rounded overflow-hidden">
                                                        <img 
                                                            src={item.thumbnailUrl || item.url} 
                                                            alt={item.filename}
                                                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">
                                                {gallery.mediaItems?.length || 0} items • Created {new Date(gallery.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                        <p>No photo galleries available</p>
                                        <p className="text-sm text-slate-400 mt-1">Create your first gallery using the Upload tab</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'videos' && (
                            <div className="space-y-6">
                                {videoGalleries.length > 0 ? (
                                    videoGalleries.map(gallery => (
                                        <div key={gallery.id} className="border rounded-lg p-4">
                                            <h4 className="font-semibold text-slate-800 mb-2">{gallery.name}</h4>
                                            <p className="text-slate-600 text-sm mb-3">{gallery.description}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {gallery.mediaItems?.map(item => (
                                                    <div key={item.id} className="aspect-video bg-slate-100 rounded overflow-hidden">
                                                        <video 
                                                            src={item.url} 
                                                            controls
                                                            className="w-full h-full object-cover"
                                                        >
                                                            Your browser does not support video playback.
                                                        </video>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">
                                                {gallery.mediaItems?.length || 0} videos • Created {new Date(gallery.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        <Video className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                        <p>No video galleries available</p>
                                        <p className="text-sm text-slate-400 mt-1">Create your first video gallery using the Upload tab</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'upload' && (
                            <GoogleDriveUploader 
                                teamId={teamId}
                                onUploadSuccess={handleUploadSuccess}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MediaGalleryNew;