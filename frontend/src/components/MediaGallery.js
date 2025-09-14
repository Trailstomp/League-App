import React, { useState } from 'react';
import { LacrosseIcon } from './LacrosseIcons';

// Icons
const ChevronLeft = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="15,18 9,12 15,6"/>
    </svg>
);

const ChevronRight = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="9,18 15,12 9,6"/>
    </svg>
);

const Video = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
);

const ImageIcon = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
    </svg>
);

const MediaGallery = ({ teams = [], teamId = null, title = "Media Gallery" }) => {
    const [selectedImagePopup, setSelectedImagePopup] = useState(null);
    const [selectedVideoPopup, setSelectedVideoPopup] = useState(null);
    const [activeTab, setActiveTab] = useState('photos');

    // Helper functions for item status
    const isItemExpired = (item) => {
        if (!item.expirationDate) return false;
        return new Date(item.expirationDate) < new Date();
    };

    const isItemActive = (item) => {
        return (item.active !== false) && !isItemExpired(item);
    };

    const isGalleryExpired = (gallery) => {
        if (!gallery.expirationDate) return false;
        return new Date(gallery.expirationDate) < new Date();
    };

    const isGalleryActive = (gallery) => {
        return (gallery.isActive !== false) && !isGalleryExpired(gallery);
    };

    // Get galleries based on scope (team-specific or all teams)
    const getGalleries = () => {
        if (teamId) {
            const team = teams.find(t => t.id === teamId);
            return team?.galleries || [];
        }
        // For league-wide HomePage, only show league-wide galleries (not team-specific)
        const allGalleries = teams.flatMap(team => (team.galleries || []).map(gallery => ({
            ...gallery,
            sourceTeamName: team.name,
            sourceTeamId: team.id
        })));
        
        // Filter to only show galleries with teamId === 'league'
        const leagueGalleries = allGalleries.filter(gallery => gallery.teamId === 'league');
        
        return leagueGalleries;
    };

    const galleries = getGalleries().filter(gallery => isGalleryActive(gallery));
    const photoGalleries = galleries.filter(g => g.type === 'photo' && g.items && g.items.length > 0);
    const videoGalleries = galleries.filter(g => g.type === 'video' && g.items && g.items.length > 0);

    if (galleries.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-slate-400 mb-4">
                    <ImageIcon size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-600">No media galleries available yet.</p>
            </div>
        );
    }

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
                    </div>
                </div>
            </div>

            <div className="p-6">
                {activeTab === 'photos' && (
                    <div className="space-y-8">
                        {photoGalleries.map(gallery => (
                            <GallerySection
                                key={`${gallery.teamId || 'league'}-${gallery.id}`}
                                gallery={gallery}
                                showTeamName={!teamId}
                                onImageClick={setSelectedImagePopup}
                            />
                        ))}
                        {photoGalleries.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                <p>No photo galleries available</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'videos' && (
                    <div className="space-y-8">
                        {videoGalleries.map(gallery => (
                            <GallerySection
                                key={`${gallery.teamId || 'league'}-${gallery.id}`}
                                gallery={gallery}
                                showTeamName={!teamId}
                                isVideo={true}
                                onVideoClick={setSelectedVideoPopup}
                            />
                        ))}
                        {videoGalleries.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <Video className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                <p>No video galleries available</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Enhanced Image Popup Modal */}
            {selectedImagePopup && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 cursor-pointer"
                    onClick={() => setSelectedImagePopup(null)}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh] p-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImagePopup(null);
                            }}
                            className="absolute top-2 right-2 text-white text-3xl z-10 hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                            title="Close (or click anywhere)"
                        >
                            ✕
                        </button>
                        
                        <div 
                            className="text-center"
                        >
                            <img 
                                src={selectedImagePopup.url} 
                                alt={selectedImagePopup.caption}
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl cursor-pointer"
                                onClick={() => setSelectedImagePopup(null)}
                            />
                            {selectedImagePopup.caption && selectedImagePopup.caption !== `Photo from ${selectedImagePopup.galleryName}` && (
                                <div className="text-white mt-4 bg-black bg-opacity-70 rounded-lg p-3 inline-block">
                                    <p className="font-medium">{selectedImagePopup.caption}</p>
                                    {selectedImagePopup.galleryName && (
                                        <p className="text-sm text-gray-300 mt-1">From: {selectedImagePopup.galleryName}</p>
                                    )}
                                </div>
                            )}
                            <div className="text-white mt-2 text-sm opacity-70">
                                Click anywhere to close
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Popup Modal */}
            {selectedVideoPopup && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 cursor-pointer"
                    onClick={() => setSelectedVideoPopup(null)}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh] p-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVideoPopup(null);
                            }}
                            className="absolute top-2 right-2 text-white text-3xl z-10 hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                            title="Close (or click anywhere)"
                        >
                            ✕
                        </button>
                        
                        <div 
                            className="text-center"
                        >
                            {/* YouTube Video Embed */}
                            {(selectedVideoPopup.url.includes('youtube.com') || selectedVideoPopup.url.includes('youtu.be')) ? (
                                <div className="relative">
                                    <iframe
                                        width="800"
                                        height="450"
                                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideoPopup.url)}`}
                                        title={selectedVideoPopup.caption}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="rounded-lg shadow-2xl"
                                        onClick={(e) => e.stopPropagation()}
                                    ></iframe>
                                </div>
                            ) : (
                                <video 
                                    controls 
                                    className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <source src={selectedVideoPopup.url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            
                            {selectedVideoPopup.caption && selectedVideoPopup.caption !== `Video from ${selectedVideoPopup.galleryName}` && (
                                <div className="text-white mt-4 bg-black bg-opacity-70 rounded-lg p-3 inline-block">
                                    <p className="font-medium">{selectedVideoPopup.caption}</p>
                                    {selectedVideoPopup.galleryName && (
                                        <p className="text-sm text-gray-300 mt-1">From: {selectedVideoPopup.galleryName}</p>
                                    )}
                                </div>
                            )}
                            <div className="text-white mt-2 text-sm opacity-70">
                                Click anywhere to close
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Gallery Section Component with enhanced auto-scrolling carousel
const GallerySection = ({ gallery, showTeamName, isVideo = false, onImageClick = () => {}, onVideoClick = () => {} }) => {
    const [isPaused, setIsPaused] = useState(false);
    const [currentTranslate, setCurrentTranslate] = useState(0);

    const handleVideoClick = (item) => {
        onVideoClick(item);
    };

    // Helper functions for item status (same as parent component)
    const isItemExpired = (item) => {
        if (!item.expirationDate) return false;
        return new Date(item.expirationDate) < new Date();
    };

    const isItemActive = (item) => {
        return (item.active !== false) && !isItemExpired(item);
    };

    // Filter items to only show active, non-expired items
    const itemsToShow = (gallery.items || []).filter(item => isItemActive(item));
    const duplicatedItems = itemsToShow.length > 0 ? [...itemsToShow, ...itemsToShow] : [];

    return (
        <div>
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-semibold text-slate-700">{gallery.name}</h4>
                        {showTeamName && gallery.teamName && gallery.teamId !== 'league' && (
                            <span className="text-xs text-blue-600 font-medium">{gallery.teamName}</span>
                        )}
                    </div>
                    <span className="text-sm text-slate-500">
                        {itemsToShow.length} {isVideo ? 'videos' : 'photos'}
                    </span>
                </div>
                {gallery.description && (
                    <p className="text-slate-600 text-sm mt-1">{gallery.description}</p>
                )}
            </div>
            
            {itemsToShow.length > 0 && (
                <div className="relative group">
                    {/* Enhanced Auto-Scrolling Carousel Container */}
                    <div 
                        className="overflow-hidden w-full rounded-lg border border-slate-200 shadow-sm bg-slate-50" 
                        style={{height: '280px'}}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        <div 
                            className="flex items-center h-full"
                            style={{
                                gap: '16px',
                                width: `${duplicatedItems.length * 320}px`,
                                animation: itemsToShow.length > 1 && !isPaused ? `gallery-scroll 30s linear infinite` : 'none',
                                padding: '20px'
                            }}
                        >
                            {duplicatedItems.map((item, index) => (
                                <div 
                                    key={`${item.id}-${index}`} 
                                    className="flex-shrink-0 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer group/item transform hover:scale-105" 
                                    style={{width: '280px', height: '240px'}}
                                    onClick={() => {
                                        if (isVideo) {
                                            handleVideoClick({
                                                url: item.url,
                                                caption: item.caption || `Video from ${gallery.name}`,
                                                galleryName: gallery.name
                                            });
                                        } else {
                                            onImageClick({
                                                url: item.url,
                                                caption: item.caption || `Photo from ${gallery.name}`,
                                                galleryName: gallery.name
                                            });
                                        }
                                    }}
                                >
                                    {isVideo ? (
                                        <div className="w-full h-full relative">
                                            {item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                                                <div className="relative w-full h-full">
                                                    <img 
                                                        src={`https://img.youtube.com/vi/${item.url.split('v=')[1]?.split('&')[0] || item.url.split('/').pop()}/0.jpg`}
                                                        alt={item.caption || 'Video thumbnail'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="bg-red-600 rounded-full p-4 shadow-lg group-hover/item:scale-110 transition-transform">
                                                            <Video className="text-white" size={28} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                    <Video className="text-slate-400" size={40} />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full relative overflow-hidden">
                                            <img 
                                                src={item.url} 
                                                alt={item.caption || 'Gallery image'}
                                                className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/item:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <div className="bg-white rounded-full p-3 shadow-lg">
                                                        <ImageIcon className="text-slate-800" size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Pause indicator */}
                    {isPaused && itemsToShow.length > 1 && (
                        <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                            ⏸️ Paused
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MediaGallery;