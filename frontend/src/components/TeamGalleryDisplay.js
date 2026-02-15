import React, { useState, useEffect } from 'react';
import ImageModal from './ImageModal';
import { fixGoogleDriveUrl } from '../utils/imageUtils';

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
        // Small delay to allow parent to cache dashboard data
        const timer = setTimeout(() => {
            loadGalleries();
        }, 50); // 50ms delay
        
        return () => clearTimeout(timer);
    }, [teamId, pageType]);

    // Using centralized image utility function

    const loadGalleries = async () => {
        try {
            setLoading(true);
            
            // First try to use cached dashboard data for faster loading
            if (window.dashboardData && window.dashboardData.galleries) {
                console.log('🚀 Using cached dashboard data for galleries');
                setGalleries(window.dashboardData.galleries);
                setLoading(false);
                return;
            }
            
            // Fallback to API call if no cached data
            console.log('📡 Loading galleries from API...');
            const response = await fetch(`${BACKEND_URL}/api/galleries`);
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
            switch (pageType) {
                case 'league':
                    return (
                        (gallery.visibility === 'all_pages') ||
                        (gallery.visibility === 'league_page' && !gallery.teamId) ||
                        (gallery.visibility === 'league_only' && !gallery.teamId)
                    );
                
                case 'team':
                    if (!teamId) return false;
                    return (
                        (gallery.teamId === teamId && ['all_pages', 'team_page', 'team_only'].includes(gallery.visibility)) ||
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
        return null;
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
                                                        src={fixGoogleDriveUrl(item.url)} 
                                                        alt={item.filename}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                                                        onClick={() => setSelectedImage({
                                                            url: fixGoogleDriveUrl(item.url),
                                                            alt: item.filename
                                                        })}
                                                        onError={(e) => {
                                                            console.log(`Image failed to load: ${item.filename}`);
                                                            
                                                            // If proxy already failed, hide the image
                                                            if (e.target.src.includes('/api/proxy-image')) {
                                                                console.error(`Proxy failed for: ${item.filename}`);
                                                                // Show a placeholder or hide
                                                                e.target.style.display = 'none';
                                                                return;
                                                            }
                                                            
                                                            // Extract Google Drive ID and try proxy
                                                            let driveId = null;
                                                            if (item.url && item.url.includes('id=')) {
                                                                driveId = item.url.split('id=')[1].split('&')[0];
                                                            } else if (item.googleDriveId) {
                                                                driveId = item.googleDriveId;
                                                            }
                                                            
                                                            if (driveId) {
                                                                const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
                                                                const proxyUrl = `${BACKEND_URL}/api/proxy-image?url=${encodeURIComponent(`https://drive.google.com/uc?id=${driveId}`)}`;
                                                                console.log(`Trying proxy URL: ${proxyUrl}`);
                                                                e.target.src = proxyUrl;
                                                                return;
                                                            }
                                                            
                                                            console.error(`No fallback available for: ${item.filename}`);
                                                            e.target.style.display = 'none';
                                                        }}
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
                                                     onClick={() => window.open(fixGoogleDriveUrl(item.url), '_blank')}>
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