import React, { useState, useEffect, useCallback } from 'react';

const YouTubeGallery = ({ 
    teamId = null, 
    channelId = null,
    title = "YouTube Videos",
    showLiveIndicator = true,
    maxVideos = 12,
    compact = false
}) => {
    const [youtubeConfig, setYoutubeConfig] = useState(null);
    const [videos, setVideos] = useState([]);
    const [liveStreams, setLiveStreams] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [activeTab, setActiveTab] = useState('videos');
    const [error, setError] = useState(null);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    const loadYouTubeData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get configuration
            let config = null;
            
            if (channelId) {
                // Direct channel ID provided
                config = { enabled: true, channelId, playlistIds: [] };
            } else if (teamId) {
                // Team-specific configuration
                const response = await fetch(`${backendUrl}/api/teams/${teamId}/youtube`);
                if (response.ok) {
                    config = await response.json();
                }
            } else {
                // League-level configuration
                const response = await fetch(`${backendUrl}/api/youtube-integration`);
                if (response.ok) {
                    config = await response.json();
                }
            }
            
            setYoutubeConfig(config);
            
            if (!config || !config.enabled || !config.channelId) {
                setLoading(false);
                return;
            }
            
            // Fetch videos, live streams, and playlists in parallel
            const [videosRes, liveRes, playlistsRes] = await Promise.all([
                fetch(`${backendUrl}/api/youtube/videos/${config.channelId}?max_results=${maxVideos}`),
                fetch(`${backendUrl}/api/youtube/live/${config.channelId}`),
                config.playlistIds?.length > 0 
                    ? fetch(`${backendUrl}/api/youtube/playlists/${config.channelId}`)
                    : Promise.resolve({ ok: true, json: () => ({ playlists: [] }) })
            ]);
            
            if (videosRes.ok) {
                const videosData = await videosRes.json();
                setVideos(videosData.videos || []);
            }
            
            if (liveRes.ok) {
                const liveData = await liveRes.json();
                setLiveStreams([
                    ...(liveData.liveStreams || []),
                    ...(liveData.upcomingStreams || [])
                ]);
            }
            
            if (playlistsRes.ok) {
                const playlistsData = await playlistsRes.json();
                setPlaylists(playlistsData.playlists || []);
            }
            
        } catch (err) {
            console.error('Error loading YouTube data:', err);
            setError('Failed to load YouTube content');
        }
        
        setLoading(false);
    }, [backendUrl, teamId, channelId, maxVideos]);

    useEffect(() => {
        loadYouTubeData();
    }, [loadYouTubeData]);

    const openVideoModal = (video) => {
        setSelectedVideo(video);
    };

    const closeVideoModal = () => {
        setSelectedVideo(null);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="bg-white/90 rounded-lg shadow-sm border p-8 text-center backdrop-blur-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading YouTube videos...</p>
            </div>
        );
    }

    if (!youtubeConfig || !youtubeConfig.enabled) {
        return (
            <div className="bg-white/90 rounded-lg shadow-sm border p-8 text-center backdrop-blur-sm">
                <div className="text-slate-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-600 mb-4">YouTube integration is not configured.</p>
                <p className="text-sm text-slate-500">Contact your administrator to set up YouTube channel integration.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white/90 rounded-lg shadow-sm border p-8 text-center backdrop-blur-sm">
                <div className="text-red-400 mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-red-600">{error}</p>
                <button 
                    onClick={loadYouTubeData}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const hasLiveContent = liveStreams.length > 0;
    const hasVideos = videos.length > 0;
    const hasPlaylists = playlists.length > 0;

    if (!hasLiveContent && !hasVideos && !hasPlaylists) {
        return (
            <div className="bg-white/90 rounded-lg shadow-sm border p-8 text-center backdrop-blur-sm">
                <div className="text-slate-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-600">No videos available yet.</p>
                {youtubeConfig.channelUrl && (
                    <a 
                        href={youtubeConfig.channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block text-red-600 hover:text-red-800"
                    >
                        Visit YouTube Channel →
                    </a>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white/90 rounded-lg shadow-sm border backdrop-blur-sm">
            {/* Header */}
            <div className="border-b px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        {title}
                        
                        {/* Live Indicator */}
                        {showLiveIndicator && hasLiveContent && liveStreams.some(s => s.isLive) && (
                            <span className="ml-3 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded animate-pulse">
                                🔴 LIVE
                            </span>
                        )}
                    </h3>
                    
                    <div className="flex items-center gap-4">
                        {/* Tabs */}
                        {(hasLiveContent || hasPlaylists) && (
                            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                                <button
                                    onClick={() => setActiveTab('videos')}
                                    className={`px-3 py-1 text-sm rounded ${activeTab === 'videos' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
                                >
                                    Videos
                                </button>
                                {hasLiveContent && (
                                    <button
                                        onClick={() => setActiveTab('live')}
                                        className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${activeTab === 'live' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
                                    >
                                        {liveStreams.some(s => s.isLive) && <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>}
                                        Live
                                    </button>
                                )}
                                {hasPlaylists && (
                                    <button
                                        onClick={() => setActiveTab('playlists')}
                                        className={`px-3 py-1 text-sm rounded ${activeTab === 'playlists' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
                                    >
                                        Playlists
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {youtubeConfig.channelUrl && (
                            <a 
                                href={youtubeConfig.channelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-red-600 hover:text-red-800 font-medium whitespace-nowrap"
                            >
                                View Channel →
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
                {/* Videos Tab */}
                {activeTab === 'videos' && (
                    <div className={`grid gap-4 sm:gap-6 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                        {videos.map(video => (
                            <VideoCard 
                                key={video.id} 
                                video={video} 
                                onClick={() => openVideoModal(video)}
                                compact={compact}
                            />
                        ))}
                    </div>
                )}
                
                {/* Live Tab */}
                {activeTab === 'live' && (
                    <div className="space-y-4">
                        {liveStreams.filter(s => s.isLive).length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center">
                                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2"></span>
                                    Live Now
                                </h4>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {liveStreams.filter(s => s.isLive).map(stream => (
                                        <VideoCard 
                                            key={stream.id} 
                                            video={stream} 
                                            onClick={() => openVideoModal(stream)}
                                            isLive={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {liveStreams.filter(s => s.isUpcoming).length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-600 mb-3">📅 Upcoming</h4>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {liveStreams.filter(s => s.isUpcoming).map(stream => (
                                        <VideoCard 
                                            key={stream.id} 
                                            video={stream} 
                                            onClick={() => openVideoModal(stream)}
                                            isUpcoming={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {liveStreams.length === 0 && (
                            <p className="text-center text-slate-500 py-8">No live streams scheduled</p>
                        )}
                    </div>
                )}
                
                {/* Playlists Tab */}
                {activeTab === 'playlists' && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {playlists.map(playlist => (
                            <a
                                key={playlist.id}
                                href={`https://youtube.com/playlist?list=${playlist.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-slate-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {playlist.thumbnail && (
                                    <img 
                                        src={playlist.thumbnail} 
                                        alt={playlist.title}
                                        className="w-full h-32 object-cover"
                                    />
                                )}
                                <div className="p-3">
                                    <h4 className="font-medium text-slate-800 line-clamp-2">{playlist.title}</h4>
                                    <p className="text-sm text-slate-500 mt-1">{playlist.itemCount} videos</p>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 cursor-pointer p-4"
                    onClick={closeVideoModal}
                >
                    <div className="relative w-full max-w-4xl">
                        <button
                            onClick={(e) => { e.stopPropagation(); closeVideoModal(); }}
                            className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
                        >
                            ✕
                        </button>
                        
                        <div className="relative pt-[56.25%]">
                            <iframe
                                className="absolute inset-0 w-full h-full rounded-lg"
                                src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                onClick={(e) => e.stopPropagation()}
                            ></iframe>
                        </div>
                        
                        <div className="text-white mt-4">
                            <h4 className="text-lg font-semibold">{selectedVideo.title}</h4>
                            <p className="text-sm text-gray-400 mt-1">{selectedVideo.channelTitle}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Video Card Component
const VideoCard = ({ video, onClick, compact = false, isLive = false, isUpcoming = false }) => {
    return (
        <div 
            className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer group"
            onClick={onClick}
        >
            {/* Thumbnail */}
            <div className="relative">
                <img 
                    src={video.thumbnail}
                    alt={video.title}
                    className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${compact ? 'h-28' : 'h-40 sm:h-48'}`}
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-red-600 rounded-full p-3 shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                    </div>
                </div>
                
                {/* Live/Upcoming Badge */}
                {isLive && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded animate-pulse">
                        🔴 LIVE
                    </div>
                )}
                {isUpcoming && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                        📅 UPCOMING
                    </div>
                )}
                
                {/* YouTube Logo */}
                <div className="absolute top-2 right-2">
                    <div className="bg-red-600 rounded px-1.5 py-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Video Info */}
            <div className={compact ? 'p-2' : 'p-3 sm:p-4'}>
                <h4 className={`font-semibold text-slate-800 line-clamp-2 ${compact ? 'text-sm' : ''}`}>
                    {video.title}
                </h4>
                {!compact && video.description && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {video.description}
                    </p>
                )}
                <div className={`flex items-center justify-between text-slate-500 mt-2 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                    <span className="truncate">{video.channelTitle}</span>
                    {video.publishedAt && (
                        <span className="whitespace-nowrap ml-2">
                            {new Date(video.publishedAt).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YouTubeGallery;
