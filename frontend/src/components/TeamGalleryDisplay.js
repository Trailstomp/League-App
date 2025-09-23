import React, { useState, useEffect } from 'react';
import ImageModal from './ImageModal';

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

const TeamGalleryDisplay = ({ teamId = null, pageType = 'league' }) => {
    const [galleries, setGalleries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('photos');
    const [selectedImage, setSelectedImage] = useState(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    console.log('🖼️ TeamGalleryDisplay:', { teamId, pageType });

    useEffect(() => {
        loadGalleries();
    }, [teamId, pageType]);

    // Helper function to fix Google Drive URLs on the client side
    const fixGoogleDriveUrl = (url) => {
        if (!url) return url;
        
        // Fix old format: https://drive.google.com/file/d/{id}/view -> https://drive.google.com/uc?id={id}
        if (url.includes('drive.google.com/file/d/') && url.includes('/view')) {
            const fileId = url.split('/d/')[1].split('/view')[0];
            return `https://drive.google.com/uc?id=${fileId}`;
        }
        
        // Fix old thumbnail format: https://drive.google.com/thumbnail?id={id}&sz=w300 -> proxy URL
        if (url.includes('drive.google.com/thumbnail?id=')) {
            const fileId = url.split('id=')[1].split('&')[0];
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            return `${BACKEND_URL}/api/media/drive/${fileId}?size=w300-h300-c`;
        }
        
        return url;
    };

    const loadGalleries = async () => {
        try {
            setLoading(true);
            // Use the active galleries endpoint to automatically filter expired and hidden galleries
            const response = await fetch(`${BACKEND_URL}/api/galleries-new/active`);
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

    const getFilteredGalleries = () => {
        return galleries.filter(gallery => {
            // Filter based on page type and visibility settings
            switch (pageType) {
                case 'league':
                    // League page shows:
                    // - League-wide galleries with all_pages or league_page visibility
                    // - Team galleries with all_pages visibility
                    return (
                        (gallery.visibility === 'all_pages') ||
                        (gallery.visibility === 'league_page' && !gallery.teamId)
                    );
                
                case 'team':
                    if (!teamId) return false;
                    // Team page shows:
                    // - Team-specific galleries with all_pages or team_page visibility
                    // - League-wide galleries with all_pages visibility
                    return (
                        (gallery.teamId === teamId && ['all_pages', 'team_page'].includes(gallery.visibility)) ||
                        (!gallery.teamId && gallery.visibility === 'all_pages')
                    );
                
                default:
                    return false;
            }
        });
    };

    const filteredGalleries = getFilteredGalleries();
    const photoGalleries = filteredGalleries.filter(g => g.type === 'photo');
    const videoGalleries = filteredGalleries.filter(g => g.type === 'video');

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-2 text-sm">Loading galleries...</p>
                </div>
            </div>
        );
    }

    if (filteredGalleries.length === 0) {
        return null; // Don't show anything if no galleries
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">
                        {pageType === 'team' ? 'Team Media Gallery' : 'League Media Gallery'}
                    </h3>
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
                    </div>
                </div>
            </div>

            <div className="p-6">
                {activeTab === 'photos' && (
                    <div className="space-y-6">
                        {photoGalleries.length > 0 ? (
                            photoGalleries.map(gallery => (
                                <div key={gallery.id} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-slate-800">{gallery.name}</h4>
                                        <span className="text-xs text-slate-500">
                                            {gallery.mediaItems?.length || 0} photos
                                        </span>
                                    </div>
                                    
                                    {gallery.description && (
                                        <p className="text-slate-600 text-sm">{gallery.description}</p>
                                    )}
                                    
                                    <div className="overflow-x-auto">
                                        <div className="flex space-x-2 pb-2" style={{minWidth: 'max-content'}}>
                                            {gallery.mediaItems?.map(item => (
                                                <div key={item.id} className="flex-shrink-0 w-32 h-32 bg-slate-100 rounded overflow-hidden group">
                                                    <img 
                                                        src={item.thumbnailUrl || item.url} 
                                                        alt={item.filename}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                                                        onClick={() => setSelectedImage({
                                                            url: item.url,
                                                            alt: item.filename
                                                        })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <ImageIcon className="mx-auto h-8 w-8 text-slate-300 mb-2"/>
                                <p className="text-sm">No photo galleries available</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'videos' && (
                    <div className="space-y-6">
                        {videoGalleries.length > 0 ? (
                            videoGalleries.map(gallery => (
                                <div key={gallery.id} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-slate-800">{gallery.name}</h4>
                                        <span className="text-xs text-slate-500">
                                            {gallery.mediaItems?.length || 0} videos
                                        </span>
                                    </div>
                                    
                                    {gallery.description && (
                                        <p className="text-slate-600 text-sm">{gallery.description}</p>
                                    )}
                                    
                                    <div className="overflow-x-auto">
                                        <div className="flex space-x-4 pb-2" style={{minWidth: 'max-content'}}>
                                            {gallery.mediaItems?.map(item => (
                                                <div key={item.id} className="flex-shrink-0 w-48 h-32 bg-slate-100 rounded overflow-hidden group cursor-pointer"
                                                     onClick={() => window.open(item.url, '_blank')}>
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-200 group-hover:bg-slate-300 transition-colors">
                                                        <Video className="w-8 h-8 text-slate-500" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Video className="mx-auto h-8 w-8 text-slate-300 mb-2"/>
                                <p className="text-sm">No video galleries available</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <ImageModal 
                    imageUrl={selectedImage.url}
                    imageAlt={selectedImage.alt}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    );
};

export default TeamGalleryDisplay;