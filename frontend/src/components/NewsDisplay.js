import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from './LacrosseIcons';
import CachedImage from './CachedImage';

const NewsDisplay = ({ teamId = null, maxItems = 5, showTeamFilter = false }) => {
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadNews();
    }, [teamId]);

    const loadNews = async () => {
        try {
            setLoading(true);
            setError(null);
            
            let url;
            if (teamId) {
                // Fetch team-specific news
                url = `${process.env.REACT_APP_BACKEND_URL}/api/team/${teamId}/news`;
            } else {
                // Fetch all league news
                url = `${process.env.REACT_APP_BACKEND_URL}/api/league-data/newsItems`;
            }
            
            console.log('📰 Loading news from:', url);
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                const items = teamId ? data.news : data.newsItems;
                
                // Filter active and non-expired items
                const activeItems = (items || [])
                    .filter(item => {
                        if (item.active === false) return false;
                        if (!item.expirationDate) return true;
                        return new Date(item.expirationDate) > new Date();
                    })
                    .sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'))
                    .slice(0, maxItems);
                
                console.log('✅ Active news items loaded:', activeItems.length);
                setNewsItems(activeItems);
            } else {
                console.error('❌ Failed to load news:', response.statusText);
                setError('Failed to load news');
            }
        } catch (err) {
            console.error('❌ Error loading news:', err);
            setError('Error loading news');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getNewsIcon = (type) => {
        switch (type) {
            case 'image': return '🖼️';
            case 'video': return '🎥';
            default: return '📰';
        }
    };

    const handleImageClick = (imageUrl) => {
        if (imageUrl) {
            window.open(imageUrl, '_blank');
        }
    };

    const handleVideoClick = (videoUrl) => {
        if (videoUrl) {
            window.open(videoUrl, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-slate-600">Loading news...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-center py-8">
                    <LacrosseIcon name="news" style={{ fontSize: '48px' }} className="text-slate-400 mb-4" />
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    if (newsItems.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    {teamId ? 'Team' : 'League'} News
                </h3>
                <div className="text-center py-8">
                    <LacrosseIcon name="news" style={{ fontSize: '48px' }} className="text-slate-400 mb-4" />
                    <p className="text-slate-600">No news articles available.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6" data-testid="news-display">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {teamId ? 'Team' : 'League'} News & Announcements
            </h3>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {newsItems.map((item) => (
                    <article 
                        key={item.id} 
                        className="border-b border-slate-200 last:border-b-0 pb-4 last:pb-0"
                    >
                        {/* Article Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2 min-w-0">
                                <span className="text-lg flex-shrink-0">{getNewsIcon(item.type)}</span>
                                <h4 className="font-semibold text-slate-800 truncate">{item.heading}</h4>
                            </div>
                            <span className="text-sm text-slate-500 whitespace-nowrap ml-4 flex-shrink-0">
                                {formatDate(item.date)}
                            </span>
                        </div>
                        
                        {/* Article Content */}
                        <div className="space-y-3">
                            {/* Image */}
                            {item.type === 'image' && item.imageUrl && (
                                <div className="cursor-pointer" onClick={() => handleImageClick(item.imageUrl)}>
                                    <CachedImage 
                                        src={item.imageUrl} 
                                        alt={item.heading}
                                        className="max-w-full h-auto max-h-48 object-contain rounded-lg hover:opacity-90 transition-opacity"
                                    />
                                </div>
                            )}
                            
                            {/* Video Thumbnail */}
                            {item.type === 'video' && item.thumbnailUrl && (
                                <div 
                                    className="relative cursor-pointer"
                                    onClick={() => handleVideoClick(item.videoUrl)}
                                >
                                    <CachedImage 
                                        src={item.thumbnailUrl} 
                                        alt={item.heading}
                                        className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black bg-opacity-70 rounded-full p-3 hover:bg-opacity-80 transition-colors">
                                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Text Content */}
                            <p className="text-slate-700 leading-relaxed">{item.text}</p>
                            
                            {/* Comments/Additional Info */}
                            {item.comments && (
                                <p className="text-sm text-slate-600 italic">{item.comments}</p>
                            )}
                            
                            {/* Team Filter (if showing league-wide news) */}
                            {showTeamFilter && item.teamId && item.teamId !== 'league' && (
                                <div className="flex items-center space-x-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        Team: {item.teamId}
                                    </span>
                                </div>
                            )}
                            
                            {/* Expiration Notice (for admins) */}
                            {item.expirationDate && (
                                <div className="text-xs text-slate-500">
                                    Expires: {formatDate(item.expirationDate)}
                                </div>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
};

export default NewsDisplay;