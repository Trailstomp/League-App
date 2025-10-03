import React, { useState, useEffect } from 'react';
import GoogleDriveUploader from '../GoogleDriveUploader';
import ImageModal from '../ImageModal';

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

const MediaGalleryManager = ({ teams = [] }) => {
    const [activeTab, setActiveTab] = useState('photos');
    const [selectedTeam, setSelectedTeam] = useState('league-wide');
    const [galleries, setGalleries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    console.log('🎬 MediaGalleryManager loaded:', { teamsCount: teams.length, selectedTeam });

    // Load galleries from backend
    useEffect(() => {
        loadGalleries();
    }, [selectedTeam]);

    const loadGalleries = async () => {
        try {
            setLoading(true);
            console.log('📡 Loading galleries from backend...');
            
            const response = await fetch(`${BACKEND_URL}/api/galleries-new`);
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

    // Filter galleries based on selected team
    const getFilteredGalleries = () => {
        if (!galleries.length) return [];
        
        return galleries.filter(gallery => {
            if (selectedTeam === 'league-wide') {
                // Show league-wide galleries
                return gallery.visibility === 'league-wide' || gallery.visibility === 'public' || !gallery.teamId;
            } else {
                // Show team-specific galleries
                return gallery.teamId === selectedTeam || gallery.visibility === 'league-wide';
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

    const getTeamName = (teamId) => {
        if (!teamId || teamId === 'league-wide') return 'League Wide';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Media Gallery Management</h2>
                
                {/* Team Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Team/League
                    </label>
                    <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="league-wide">League Wide Galleries</option>
                        {teams
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                    </select>
                </div>

                {/* Tab Navigation */}
                <div className="border-b mb-6">
                    <div className="flex space-x-6">
                        <button
                            onClick={() => setActiveTab('photos')}
                            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'photos'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <ImageIcon className="mr-2 inline" size={16} />
                            Photos ({photoGalleries.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('videos')}
                            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'videos'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <Video className="mr-2 inline" size={16} />
                            Videos ({videoGalleries.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'upload'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <Upload className="mr-2 inline" size={16} />
                            Upload New Media
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-600 mt-2">Loading galleries...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'photos' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-slate-800">
                                        Photo Galleries - {getTeamName(selectedTeam)}
                                    </h3>
                                    <span className="text-sm text-slate-500">
                                        {photoGalleries.length} galleries
                                    </span>
                                </div>

                                {photoGalleries.length > 0 ? (
                                    <div className="grid gap-6">
                                        {photoGalleries.map(gallery => (
                                            <div key={gallery.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800">{gallery.name}</h4>
                                                        <p className="text-slate-600 text-sm">{gallery.description}</p>
                                                        <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
                                                            <span>Team: {getTeamName(gallery.teamId)}</span>
                                                            <span>•</span>
                                                            <span>Visibility: {gallery.visibility}</span>
                                                            <span>•</span>
                                                            <span>Created: {new Date(gallery.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                        {gallery.mediaItems?.length || 0} items
                                                    </span>
                                                </div>
                                                
                                                <div className="overflow-x-auto">
                                                    <div className="flex space-x-2 pb-2" style={{minWidth: 'max-content'}}>
                                                        {gallery.mediaItems?.map(item => (
                                                            <div key={item.id} className="flex-shrink-0 w-24 h-24 bg-slate-100 rounded overflow-hidden group">
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
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                        <p>No photo galleries found for {getTeamName(selectedTeam)}</p>
                                        <p className="text-sm text-slate-400 mt-1">Upload some photos to get started</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'videos' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-slate-800">
                                        Video Galleries - {getTeamName(selectedTeam)}
                                    </h3>
                                    <span className="text-sm text-slate-500">
                                        {videoGalleries.length} galleries
                                    </span>
                                </div>

                                {videoGalleries.length > 0 ? (
                                    <div className="grid gap-6">
                                        {videoGalleries.map(gallery => (
                                            <div key={gallery.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800">{gallery.name}</h4>
                                                        <p className="text-slate-600 text-sm">{gallery.description}</p>
                                                        <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
                                                            <span>Team: {getTeamName(gallery.teamId)}</span>
                                                            <span>•</span>
                                                            <span>Visibility: {gallery.visibility}</span>
                                                            <span>•</span>
                                                            <span>Created: {new Date(gallery.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                                                        {gallery.mediaItems?.length || 0} videos
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {gallery.mediaItems?.map(item => (
                                                        <div key={item.id} className="aspect-video bg-slate-100 rounded overflow-hidden group cursor-pointer"
                                                             onClick={() => window.open(item.url, '_blank')}>
                                                            <div className="w-full h-full flex items-center justify-center bg-slate-200 group-hover:bg-slate-300 transition-colors">
                                                                <Video className="w-8 h-8 text-slate-500" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <Video className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                        <p>No video galleries found for {getTeamName(selectedTeam)}</p>
                                        <p className="text-sm text-slate-400 mt-1">Upload some videos to get started</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'upload' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-slate-800 mb-2">
                                        Upload Media to {getTeamName(selectedTeam)}
                                    </h3>
                                    <p className="text-slate-600 text-sm mb-4">
                                        Upload photos and videos to Google Drive. They will be organized into galleries and displayed on your site.
                                    </p>
                                </div>

                                <GoogleDriveUploader 
                                    teamId={selectedTeam}
                                    onUploadSuccess={handleUploadSuccess}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {selectedImage && (
                <ImageModal
                    imageUrl={selectedImage.url}
                    altText={selectedImage.alt}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    );
};

export default MediaGalleryManager;