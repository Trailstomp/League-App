import React, { useState } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

// Icons
const Plus = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

const Edit = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
);

const Trash2 = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="3,6 5,6 21,6"/>
        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2,-2V6m3,0V4a2,2 0 0,1,2,-2h4a2,2 0 0,1,2,2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);

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

const Eye = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const MediaManager = ({ teams = [], setTeams, currentUser, isTeamSpecific = false, teamId = null }) => {
    const [activeTab, setActiveTab] = useState('photos');
    const [editingGallery, setEditingGallery] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedGallery, setSelectedGallery] = useState(null);
    const [slideshow, setSlideshow] = useState({ isOpen: false, items: [], startIndex: 0 });

    // Get all galleries or team-specific galleries
    const getAllGalleries = () => {
        if (isTeamSpecific && teamId) {
            const team = teams.find(t => t.id === teamId);
            return team?.galleries || [];
        }
        // For league-wide, get galleries from all teams
        return teams.flatMap(team => (team.galleries || []).map(gallery => ({
            ...gallery,
            teamName: team.name,
            teamId: team.id
        })));
    };

    const galleries = getAllGalleries();
    const photoGalleries = galleries.filter(g => g.type === 'photo').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const videoGalleries = galleries.filter(g => g.type === 'video').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const handleSaveGallery = (galleryData) => {
        const targetTeamId = isTeamSpecific ? teamId : galleryData.teamId || teams[0]?.id;
        
        setTeams(currentTeams => currentTeams.map(team => {
            if (team.id === targetTeamId) {
                const updatedGalleries = galleryData.id && (team.galleries || []).find(g => g.id === galleryData.id)
                    ? (team.galleries || []).map(g => g.id === galleryData.id ? galleryData : g)
                    : [...(team.galleries || []), { ...galleryData, id: galleryData.id || Date.now().toString(), createdAt: new Date().toISOString() }];
                return { ...team, galleries: updatedGalleries };
            }
            return team;
        }));
        setEditingGallery(null);
    };

    const handleSaveItem = (itemData) => {
        const targetTeamId = selectedGallery.teamId || teamId;
        
        setTeams(currentTeams => currentTeams.map(team => {
            if (team.id === targetTeamId) {
                const updatedGalleries = (team.galleries || []).map(gallery => {
                    if (gallery.id === selectedGallery.id) {
                        const updatedItems = itemData.id && (gallery.items || []).find(i => i.id === itemData.id)
                            ? (gallery.items || []).map(i => i.id === itemData.id ? itemData : i)
                            : [...(gallery.items || []), { ...itemData, id: itemData.id || Date.now().toString(), addedAt: new Date().toISOString() }];
                        return { ...gallery, items: updatedItems };
                    }
                    return gallery;
                });
                return { ...team, galleries: updatedGalleries };
            }
            return team;
        }));
        setEditingItem(null);
    };

    const handleDeleteGallery = (galleryId, galleryTeamId) => {
        const targetTeamId = galleryTeamId || teamId;
        
        if (!window.confirm('Are you sure you want to delete this gallery?')) return;
        
        setTeams(currentTeams => currentTeams.map(team => {
            if (team.id === targetTeamId) {
                return { ...team, galleries: (team.galleries || []).filter(g => g.id !== galleryId) };
            }
            return team;
        }));
    };

    const handleDeleteItem = (galleryId, itemId, galleryTeamId) => {
        const targetTeamId = galleryTeamId || teamId;
        
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        
        setTeams(currentTeams => currentTeams.map(team => {
            if (team.id === targetTeamId) {
                const updatedGalleries = (team.galleries || []).map(gallery => {
                    if (gallery.id === galleryId) {
                        return { ...gallery, items: (gallery.items || []).filter(i => i.id !== itemId) };
                    }
                    return gallery;
                });
                return { ...team, galleries: updatedGalleries };
            }
            return team;
        }));
    };

    const openSlideshow = (items, startIndex = 0) => {
        setSlideshow({ isOpen: true, items, startIndex });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {isTeamSpecific ? 'Team' : 'League'} Media Management
                    </h2>
                    <p className="text-slate-600">Manage photo galleries and video collections</p>
                </div>
                <button 
                    onClick={() => setEditingGallery({ name: '', description: '', type: activeTab === 'photos' ? 'photo' : 'video' })} 
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4 inline"/> Create {activeTab === 'photos' ? 'Photo Gallery' : 'Video Collection'}
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-blue-900">{galleries.length}</div>
                    <div className="text-xs text-blue-700">Total Galleries</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-green-900">{photoGalleries.length}</div>
                    <div className="text-xs text-green-700">Photo Galleries</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-purple-900">{videoGalleries.length}</div>
                    <div className="text-xs text-purple-700">Video Collections</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-orange-900">
                        {galleries.reduce((total, gallery) => total + (gallery.items?.length || 0), 0)}
                    </div>
                    <div className="text-xs text-orange-700">Total Items</div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b px-6 py-4">
                    <div className="flex space-x-4">
                        <button 
                            onClick={() => setActiveTab('photos')}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === 'photos'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <ImageIcon className="mr-2" size={18} />
                            Photo Galleries ({photoGalleries.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('videos')}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === 'videos'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Video className="mr-2" size={18} />
                            Video Collections ({videoGalleries.length})
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Gallery Display */}
                    <div className="space-y-6">
                        {(activeTab === 'photos' ? photoGalleries : videoGalleries).map(gallery => (
                            <div key={`${gallery.teamId}-${gallery.id}`} className="bg-white border border-slate-200 rounded-lg p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <h3 className="text-xl font-semibold text-slate-800">{gallery.name}</h3>
                                            {!isTeamSpecific && gallery.teamName && (
                                                <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                    {gallery.teamName}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-600 mb-2">{gallery.description}</p>
                                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                                            <span>Created: {new Date(gallery.createdAt).toLocaleDateString()}</span>
                                            <span>{(gallery.items || []).length} {activeTab === 'photos' ? 'photos' : 'videos'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <button 
                                            onClick={() => {
                                                setSelectedGallery(gallery);
                                                setEditingItem({ galleryId: gallery.id });
                                            }}
                                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                                        >
                                            <Plus className="mr-1 h-3 w-3"/> Add {activeTab === 'photos' ? 'Photo' : 'Video'}
                                        </button>
                                        <button 
                                            onClick={() => setEditingGallery(gallery)} 
                                            className="text-slate-500 hover:text-slate-700 p-1"
                                            title="Edit gallery"
                                        >
                                            <Edit size={16}/>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteGallery(gallery.id, gallery.teamId)} 
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Delete gallery"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>

                                {/* Gallery Items */}
                                {(gallery.items || []).length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {(gallery.items || []).map((item, index) => (
                                            <div key={item.id} className="group relative bg-slate-50 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                                                <div 
                                                    onClick={() => openSlideshow(gallery.items, index)}
                                                    className="aspect-square relative overflow-hidden"
                                                >
                                                    {activeTab === 'photos' ? (
                                                        <img 
                                                            src={item.url} 
                                                            alt={item.caption} 
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                            {item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                                                                <div className="relative w-full h-full">
                                                                    <img 
                                                                        src={`https://img.youtube.com/vi/${item.url.split('v=')[1]?.split('&')[0] || item.url.split('/').pop()}/0.jpg`}
                                                                        alt={item.caption}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <div className="bg-red-600 rounded-full p-2">
                                                                            <Video className="text-white" size={24} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <Video className="text-slate-400" size={32} />
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="bg-white rounded-full p-2">
                                                                <Eye className="text-slate-800" size={20} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <p className="text-sm font-medium text-slate-800 truncate">{item.caption}</p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(item.addedAt).toLocaleDateString()}
                                                        </span>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteItem(gallery.id, item.id, gallery.teamId);
                                                            }}
                                                            className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Delete item"
                                                        >
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                                        {activeTab === 'photos' ? (
                                            <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                        ) : (
                                            <Video className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                        )}
                                        <p>No {activeTab === 'photos' ? 'photos' : 'videos'} in this gallery yet.</p>
                                        <button 
                                            onClick={() => {
                                                setSelectedGallery(gallery);
                                                setEditingItem({ galleryId: gallery.id });
                                            }}
                                            className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Add the first {activeTab === 'photos' ? 'photo' : 'video'} →
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {(activeTab === 'photos' ? photoGalleries : videoGalleries).length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                {activeTab === 'photos' ? (
                                    <ImageIcon className="mx-auto h-16 w-16 text-slate-300 mb-4"/>
                                ) : (
                                    <Video className="mx-auto h-16 w-16 text-slate-300 mb-4"/>
                                )}
                                <h3 className="text-xl font-semibold mb-2">No {activeTab === 'photos' ? 'Photo Galleries' : 'Video Collections'} Yet</h3>
                                <p className="mb-4">Create your first {activeTab === 'photos' ? 'photo gallery' : 'video collection'} to showcase {isTeamSpecific ? 'your team\'s' : 'league'} memories and highlights.</p>
                                <button 
                                    onClick={() => setEditingGallery({ name: '', description: '', type: activeTab === 'photos' ? 'photo' : 'video' })}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                                >
                                    Create First {activeTab === 'photos' ? 'Photo Gallery' : 'Video Collection'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Forms and Modals */}
            {editingGallery && (
                <GalleryForm
                    gallery={editingGallery}
                    teams={teams}
                    isTeamSpecific={isTeamSpecific}
                    teamId={teamId}
                    onSave={handleSaveGallery}
                    onCancel={() => setEditingGallery(null)}
                />
            )}
            
            {editingItem && (
                <ItemForm
                    item={editingItem}
                    gallery={selectedGallery}
                    itemType={activeTab === 'photos' ? 'photo' : 'video'}
                    onSave={handleSaveItem}
                    onCancel={() => setEditingItem(null)}
                />
            )}
            
            {slideshow.isOpen && (
                <Slideshow 
                    items={slideshow.items}
                    isOpen={slideshow.isOpen}
                    onClose={() => setSlideshow({ isOpen: false, items: [], startIndex: 0 })}
                    startIndex={slideshow.startIndex}
                />
            )}
        </div>
    );
};

// Gallery Form Component
const GalleryForm = ({ gallery, teams, isTeamSpecific, teamId, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: gallery?.name || '',
        description: gallery?.description || '',
        type: gallery?.type || 'photo',
        teamId: gallery?.teamId || teamId || teams[0]?.id || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Gallery name is required');
            return;
        }
        onSave({ ...formData, id: gallery?.id });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    {gallery?.id ? 'Edit Gallery' : 'Create New Gallery'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Gallery Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Team Association
                        </label>
                        <select
                            value={formData.teamId}
                            onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="league">League-wide gallery</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {gallery?.id ? 'Update Gallery' : 'Create Gallery'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Item Form Component
const ItemForm = ({ item, gallery, itemType, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        urls: item?.urls || (item?.url ? [item.url] : []),
        captions: item?.captions || (item?.caption ? [item.caption] : [])
    });

    const handleMultipleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const newUrls = [];
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                newUrls.push(e.target.result);
                if (newUrls.length === files.length) {
                    setFormData(prev => ({
                        ...prev,
                        urls: [...prev.urls, ...newUrls],
                        captions: [...prev.captions, ...new Array(newUrls.length).fill('')]
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            urls: prev.urls.filter((_, i) => i !== index),
            captions: prev.captions.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.urls.length === 0) {
            alert(`At least one ${itemType === 'photo' ? 'image' : 'video'} is required`);
            return;
        }
        
        // For backward compatibility, save multiple items as separate entries
        formData.urls.forEach((url, index) => {
            onSave({ 
                url, 
                caption: formData.captions[index] || '', 
                id: item?.id && index === 0 ? item.id : undefined 
            });
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    {item?.id ? `Edit ${itemType}` : `Add ${itemType}${itemType === 'photo' ? 's' : 's'}`}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {itemType === 'photo' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Upload Photos *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleMultipleFileUpload}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">Select multiple images to upload at once</p>
                            </div>
                            
                            {/* Image Previews */}
                            {formData.urls.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Selected Images ({formData.urls.length})
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                                        {formData.urls.map((url, index) => (
                                            <div key={index} className="relative group">
                                                <img 
                                                    src={url} 
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg border border-slate-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Video URL *
                            </label>
                            <input
                                type="url"
                                value={formData.urls[0] || ''}
                                onChange={(e) => setFormData({
                                    urls: [e.target.value],
                                    captions: [formData.captions[0] || '']
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://www.youtube.com/watch?v=..."
                                required
                            />
                        </div>
                    )}
                    
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {item?.id ? `Update ${itemType}${itemType === 'photo' ? 's' : 's'}` : `Add ${itemType}${itemType === 'photo' ? 's' : 's'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Simple Slideshow Component
const Slideshow = ({ items, isOpen, onClose, startIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    if (!isOpen) return null;

    const currentItem = items[currentIndex];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="relative max-w-4xl max-h-full">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white text-2xl z-10"
                >
                    ✕
                </button>
                
                {items.length > 1 && (
                    <>
                        <button
                            onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : items.length - 1)}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl"
                        >
                            ‹
                        </button>
                        <button
                            onClick={() => setCurrentIndex(prev => prev < items.length - 1 ? prev + 1 : 0)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl"
                        >
                            ›
                        </button>
                    </>
                )}
                
                <div className="text-center">
                    <img 
                        src={currentItem.url} 
                        alt={currentItem.caption}
                        className="max-w-full max-h-screen object-contain"
                    />
                    {currentItem.caption && (
                        <p className="text-white mt-4">{currentItem.caption}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaManager;