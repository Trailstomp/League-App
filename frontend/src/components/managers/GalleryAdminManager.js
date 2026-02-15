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

const EditIcon = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const DeleteIcon = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="3,6 5,6 21,6"/>
        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);

const PlusIcon = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

const GalleryAdminManager = ({ teams = [], currentUser }) => {
    const [galleries, setGalleries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('manage'); // 'manage' or 'create'
    const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
    const [editingGallery, setEditingGallery] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    // Determine user permissions
    const isLeagueAdmin = currentUser?.role === 'admin' || currentUser?.role === 'league_admin';
    const userTeamIds = currentUser?.teams || [];

    console.log('🎛️ GalleryAdminManager loaded:', { 
        teamsCount: teams.length, 
        currentUser: currentUser?.name,
        isLeagueAdmin,
        userTeamIds 
    });

    useEffect(() => {
        loadGalleries();
    }, []);

    const loadGalleries = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BACKEND_URL}/api/galleries-new`);
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
            // Permission check - users can only see galleries they can manage
            if (isLeagueAdmin) {
                // League admins see all galleries
                if (selectedTeamFilter === 'all') return true;
                if (selectedTeamFilter === 'league') return !gallery.teamId;
                return gallery.teamId === selectedTeamFilter;
            } else {
                // Team admins only see their team galleries
                return userTeamIds.includes(gallery.teamId);
            }
        });
    };

    const canEditGallery = (gallery) => {
        if (isLeagueAdmin) return true;
        return gallery.teamId && userTeamIds.includes(gallery.teamId);
    };

    const handleDeleteGallery = async (galleryId) => {
        if (!confirm('Are you sure you want to delete this gallery? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/galleries-new/${galleryId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setGalleries(galleries.filter(g => g.id !== galleryId));
                alert('Gallery deleted successfully');
            } else {
                alert('Failed to delete gallery');
            }
        } catch (error) {
            console.error('Error deleting gallery:', error);
            alert('Error deleting gallery');
        }
    };

    const handleEditGallery = (gallery) => {
        setEditingGallery(gallery);
        setActiveView('edit');
    };

    const handleSaveEdit = async (updatedGallery) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/galleries-new/${updatedGallery.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedGallery)
            });

            if (response.ok) {
                setGalleries(galleries.map(g => g.id === updatedGallery.id ? updatedGallery : g));
                setEditingGallery(null);
                setActiveView('manage');
                alert('Gallery updated successfully');
            } else {
                alert('Failed to update gallery');
            }
        } catch (error) {
            console.error('Error updating gallery:', error);
            alert('Error updating gallery');
        }
    };

    const getTeamName = (teamId) => {
        if (!teamId) return 'League Wide';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    const getVisibilityDisplayName = (visibility, teamId) => {
        switch (visibility) {
            case 'league_page': return 'League Page Only';
            case 'team_page': return `${getTeamName(teamId)} Page Only`;
            case 'all_pages': return 'All Pages';
            case 'public': return 'Public';
            default: return visibility || 'Public';
        }
    };

    const filteredGalleries = getFilteredGalleries();

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-2">Loading galleries...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">Gallery Management</h2>
                        <p className="text-slate-600 text-sm">
                            {isLeagueAdmin 
                                ? 'Manage all league and team galleries' 
                                : `Manage galleries for your teams: ${userTeamIds.map(id => getTeamName(id)).join(', ')}`
                            }
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setActiveView('manage')}
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeView === 'manage'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Manage Galleries
                        </button>
                        <button
                            onClick={() => setActiveView('create')}
                            className={`px-4 py-2 rounded-lg font-medium ${
                                activeView === 'create'
                                    ? 'bg-green-100 text-green-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <PlusIcon className="inline mr-2" size={16} />
                            Create New
                        </button>
                    </div>
                </div>

                {activeView === 'manage' && (
                    <div className="space-y-6">
                        {/* Filters */}
                        {isLeagueAdmin && (
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-slate-700">Filter by:</label>
                                <select
                                    value={selectedTeamFilter}
                                    onChange={(e) => setSelectedTeamFilter(e.target.value)}
                                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Galleries</option>
                                    <option value="league">League Wide Only</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Galleries List */}
                        {filteredGalleries.length > 0 ? (
                            <div className="space-y-4">
                                {filteredGalleries.map(gallery => (
                                    <div key={gallery.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-slate-800">{gallery.name}</h3>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        gallery.type === 'photo' 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {gallery.type === 'photo' ? 'Photos' : 'Videos'} ({gallery.mediaItems?.length || 0})
                                                    </span>
                                                </div>
                                                
                                                <p className="text-slate-600 text-sm mb-3">{gallery.description}</p>
                                                
                                                <div className="flex items-center space-x-6 text-xs text-slate-500">
                                                    <span><strong>Team:</strong> {getTeamName(gallery.teamId)}</span>
                                                    <span><strong>Visibility:</strong> {getVisibilityDisplayName(gallery.visibility, gallery.teamId)}</span>
                                                    <span><strong>Created:</strong> {new Date(gallery.createdAt).toLocaleDateString()}</span>
                                                </div>

                                                {/* Media Preview */}
                                                {gallery.mediaItems && gallery.mediaItems.length > 0 && (
                                                    <div className="mt-4">
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {gallery.mediaItems.slice(0, 4).map(item => (
                                                                <div key={item.id} className="aspect-square bg-slate-100 rounded overflow-hidden">
                                                                    <img 
                                                                        src={item.thumbnailUrl || item.url} 
                                                                        alt={item.filename}
                                                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                                        onClick={() => setSelectedImage({ url: item.url, alt: item.filename })}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {gallery.mediaItems.length > 4 && (
                                                            <p className="text-xs text-slate-500 mt-2">
                                                                +{gallery.mediaItems.length - 4} more items
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {canEditGallery(gallery) && (
                                                <div className="flex space-x-2 ml-4">
                                                    <button
                                                        onClick={() => handleEditGallery(gallery)}
                                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Gallery"
                                                    >
                                                        <EditIcon size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGallery(gallery.id)}
                                                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Gallery"
                                                    >
                                                        <DeleteIcon size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                <p>No galleries found</p>
                                <p className="text-sm text-slate-400 mt-1">Create your first gallery to get started</p>
                            </div>
                        )}
                    </div>
                )}

                {activeView === 'create' && (
                    <CreateGalleryForm 
                        teams={teams}
                        currentUser={currentUser}
                        isLeagueAdmin={isLeagueAdmin}
                        userTeamIds={userTeamIds}
                        onSuccess={() => {
                            loadGalleries();
                            setActiveView('manage');
                        }}
                        onCancel={() => setActiveView('manage')}
                    />
                )}

                {activeView === 'edit' && editingGallery && (
                    <EditGalleryForm 
                        gallery={editingGallery}
                        teams={teams}
                        currentUser={currentUser}
                        isLeagueAdmin={isLeagueAdmin}
                        userTeamIds={userTeamIds}
                        onSave={handleSaveEdit}
                        onCancel={() => {
                            setEditingGallery(null);
                            setActiveView('manage');
                        }}
                    />
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

// Create Gallery Form Component
const CreateGalleryForm = ({ teams, currentUser, isLeagueAdmin, userTeamIds, onSuccess, onCancel }) => {
    const [selectedTeam, setSelectedTeam] = useState(isLeagueAdmin ? 'league' : userTeamIds[0] || '');
    const [visibility, setVisibility] = useState('all_pages');

    const getTeamName = (teamId) => {
        if (!teamId || teamId === 'league') return 'League Wide';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    const handleUploadSuccess = () => {
        onSuccess();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-800">Create New Gallery</h3>
                <button
                    onClick={onCancel}
                    className="text-slate-500 hover:text-slate-700"
                >
                    Cancel
                </button>
            </div>

            {/* Team Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assign to Team/League
                </label>
                <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {isLeagueAdmin && <option value="league">League Wide</option>}
                    {(isLeagueAdmin ? teams : teams.filter(t => userTeamIds.includes(t.id))).map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                </select>
            </div>

            {/* Visibility Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Where should this gallery appear?
                </label>
                <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="all_pages">All Pages (League + Team Pages)</option>
                    <option value="league_page">League Page Only</option>
                    <option value="team_page">{getTeamName(selectedTeam)} Page Only</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                    This controls where visitors can view this gallery on your website
                </p>
            </div>

            {/* Upload Component */}
            <div className="border-t pt-6">
                <GoogleDriveUploader 
                    teamId={selectedTeam === 'league' ? null : selectedTeam}
                    defaultVisibility={visibility}
                    onUploadSuccess={handleUploadSuccess}
                />
            </div>
        </div>
    );
};

// Edit Gallery Form Component  
const EditGalleryForm = ({ gallery, teams, currentUser, isLeagueAdmin, userTeamIds, onSave, onCancel }) => {
    const [name, setName] = useState(gallery.name);
    const [description, setDescription] = useState(gallery.description);
    const [visibility, setVisibility] = useState(gallery.visibility);
    const [teamId, setTeamId] = useState(gallery.teamId || 'league');

    const handleSave = () => {
        onSave({
            ...gallery,
            name,
            description,
            visibility,
            teamId: teamId === 'league' ? null : teamId,
            updatedAt: new Date().toISOString()
        });
    };

    const getTeamName = (teamId) => {
        if (!teamId || teamId === 'league') return 'League Wide';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-800">Edit Gallery</h3>
                <button
                    onClick={onCancel}
                    className="text-slate-500 hover:text-slate-700"
                >
                    Cancel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Team Assignment</label>
                    <select
                        value={teamId}
                        onChange={(e) => setTeamId(e.target.value)}
                        disabled={!isLeagueAdmin} // Team admins can't move galleries between teams
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                    >
                        {isLeagueAdmin && <option value="league">League Wide</option>}
                        {(isLeagueAdmin ? teams : teams.filter(t => userTeamIds.includes(t.id))).map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Visibility</label>
                <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="all_pages">All Pages (League + Team Pages)</option>
                    <option value="league_page">League Page Only</option>
                    <option value="team_page">{getTeamName(teamId)} Page Only</option>
                </select>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default GalleryAdminManager;