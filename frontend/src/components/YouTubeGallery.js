import React, { useState, useEffect } from 'react';

// YouTube Video Component for MediaGallery integration
const YouTubeGallery = ({ teamId = null, title = "YouTube Videos" }) => {
    const [youtubeConfig, setYoutubeConfig] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        loadYouTubeVideos();
    }, [teamId]);

    const loadYouTubeVideos = async () => {
        try {
            setLoading(true);
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            
            // Load YouTube configuration
            const response = await fetch(`${BACKEND_URL}/api/youtube-integration`);
            if (response.ok) {
                const config = await response.json();
                setYoutubeConfig(config);
                
                if (config.enabled && config.channelId) {
                    // TODO: In a real implementation, you would call YouTube API here
                    // For now, we'll create mock videos based on the configuration
                    const mockVideos = generateMockVideos(config);
                    setVideos(mockVideos);
                }
            }
        } catch (error) {
            console.error('Error loading YouTube videos:', error);
        }
        setLoading(false);
    };

    // Generate mock videos for demonstration
    const generateMockVideos = (config) => {
        const mockVideos = [
            {
                id: 'sample1',
                title: 'Team Practice Highlights',
                description: 'Best moments from our recent practice session',
                thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
                videoId: 'dQw4w9WgXcQ',
                publishedAt: new Date().toISOString(),
                channelTitle: 'Lacrosse League Official'
            },
            {
                id: 'sample2', 
                title: 'Game Day Preparation',
                description: 'How our team gets ready for the big game',
                thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
                videoId: 'dQw4w9WgXcQ',
                publishedAt: new Date().toISOString(),
                channelTitle: 'Lacrosse League Official'
            },
            {
                id: 'sample3',
                title: 'Season Highlights Reel',
                description: 'Best plays and moments from this season',
                thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
                videoId: 'dQw4w9WgXcQ',
                publishedAt: new Date().toISOString(),
                channelTitle: 'Lacrosse League Official'
            }
        ];

        // If playlists are configured, add playlist-specific videos
        if (config.playlistIds && config.playlistIds.length > 0) {
            config.playlistIds.forEach((playlistId, index) => {
                mockVideos.push({
                    id: `playlist_${index}`,
                    title: `Playlist Video ${index + 1}`,
                    description: `Video from playlist ${playlistId}`,
                    thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
                    videoId: 'dQw4w9WgXcQ',
                    publishedAt: new Date().toISOString(),
                    channelTitle: 'Lacrosse League Official',
                    playlistId: playlistId
                });
            });
        }

        return mockVideos;
    };

    const openVideoModal = (video) => {
        setSelectedVideo(video);
    };

    const closeVideoModal = () => {
        setSelectedVideo(null);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading YouTube videos...</p>
            </div>
        );
    }

    if (!youtubeConfig || !youtubeConfig.enabled) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
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

    if (videos.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-slate-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-600">No videos available from configured YouTube channel.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        {title}
                    </h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-500">{videos.length} videos</span>
                        {youtubeConfig.channelUrl && (
                            <a 
                                href={youtubeConfig.channelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                View Channel →
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map(video => (
                        <div 
                            key={video.id}
                            className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer group"
                            onClick={() => openVideoModal(video)}
                        >
                            {/* Video Thumbnail */}
                            <div className="relative">
                                <img 
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-red-600 rounded-full p-4 shadow-lg">
                                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* YouTube Logo */}
                                <div className="absolute top-2 right-2">
                                    <div className="bg-red-600 rounded px-2 py-1 flex items-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Video Information */}
                            <div className="p-4">
                                <h4 className="font-semibold text-slate-800 mb-2 line-clamp-2">
                                    {video.title}
                                </h4>
                                <p className="text-sm text-slate-600 mb-2 line-clamp-3">
                                    {video.description}
                                </p>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>{video.channelTitle}</span>
                                    <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                                </div>
                                {video.playlistId && (
                                    <div className="mt-2">
                                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                            From Playlist
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Configuration Info */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center space-x-4">
                            <span>Channel: {youtubeConfig.channelId}</span>
                            {youtubeConfig.playlistIds && youtubeConfig.playlistIds.length > 0 && (
                                <span>{youtubeConfig.playlistIds.length} playlists configured</span>
                            )}
                        </div>
                        <span className="text-green-600 font-medium">YouTube Integration Active</span>
                    </div>
                </div>
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 cursor-pointer"
                    onClick={closeVideoModal}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh] p-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeVideoModal();
                            }}
                            className="absolute top-2 right-2 text-white text-3xl z-10 hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                            title="Close (or click anywhere)"
                        >
                            ✕
                        </button>
                        
                        <div className="text-center">
                            <div className="relative">
                                <iframe
                                    width="800"
                                    height="450"
                                    src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                                    title={selectedVideo.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="rounded-lg shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                ></iframe>
                            </div>
                            
                            <div className="text-white mt-4 bg-black bg-opacity-70 rounded-lg p-3 inline-block">
                                <p className="font-medium">{selectedVideo.title}</p>
                                <p className="text-sm text-gray-300 mt-1">{selectedVideo.description}</p>
                            </div>
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

export default YouTubeGallery;