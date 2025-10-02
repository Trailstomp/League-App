import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';
import SimpleCropTool from '../SimpleCropTool';

const NewsManager = ({ teams = [], currentUser }) => {
    const [newsItems, setNewsItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showCropTool, setShowCropTool] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState('');
    const [cropTargetField, setCropTargetField] = useState('');

    // Load news items on mount
    useEffect(() => {
        loadNewsItems();
    }, []);

    const loadNewsItems = async () => {
        try {
            setLoading(true);
            console.log('📰 Loading news items from API...');
            
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/league-data/newsItems`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ News items loaded from API:', data.newsItems);
                setNewsItems(data.newsItems || []);
            } else {
                console.error('❌ Failed to load news items:', response.statusText);
                // Initialize with empty array if API fails
                setNewsItems([]);
            }
        } catch (error) {
            console.error('❌ Error loading news items:', error);
            // Initialize with empty array on error
            setNewsItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveItem = async (itemData) => {
        try {
            setSaving(true);
            console.log('📰 Saving news item:', itemData);

            let updatedItems;
            
            if (editingItem) {
                // Update existing item
                updatedItems = newsItems.map(item => 
                    item.id === editingItem.id ? { ...itemData, id: editingItem.id } : item
                );
                setEditingItem(null);
            } else {
                // Add new item
                const newItem = {
                    ...itemData,
                    id: Date.now().toString(),
                    date: new Date().toISOString().split('T')[0],
                    active: itemData.active !== undefined ? itemData.active : true
                };
                updatedItems = [newItem, ...newsItems];
                setShowAddForm(false);
            }
            
            // Save to API
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/league-data/newsItems`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedItems)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ News items saved to API:', result);
                setNewsItems(updatedItems);
            } else {
                console.error('❌ Failed to save news items to API:', response.statusText);
                alert('Failed to save news item to server. Please try again.');
                return;
            }
            
            console.log('✅ News item saved successfully');
        } catch (error) {
            console.error('❌ Error saving news item:', error);
            alert('Error saving news item. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this news item?')) return;
        
        try {
            setSaving(true);
            
            // Filter out the item to delete
            const updatedItems = newsItems.filter(item => item.id !== itemId);
            
            // Save to API
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/league-data/newsItems`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedItems)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ News items updated in API after deletion:', result);
                setNewsItems(updatedItems);
            } else {
                console.error('❌ Failed to update news items in API:', response.statusText);
                alert('Failed to delete news item from server. Please try again.');
                return;
            }
            
            console.log('✅ News item deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting news item:', error);
            alert('Error deleting news item. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Check if news item is expired
    const isExpired = (item) => {
        if (!item.expirationDate) return false;
        return new Date(item.expirationDate) < new Date();
    };

    // Check if news item should be displayed (active and not expired)
    const isItemActive = (item) => {
        return item.active && !isExpired(item);
    };

    // Get filtered active items for display
    const getActiveNewsItems = () => {
        return newsItems.filter(isItemActive);
    };

    // Handle crop tool functionality
    const handleCropComplete = (croppedImageData) => {
        if (cropTargetField && (editingItem || showAddForm)) {
            // Update the appropriate image field
            if (editingItem) {
                setEditingItem(prev => ({
                    ...prev,
                    [cropTargetField]: croppedImageData
                }));
            }
            // Note: For new items, we'll handle this in the form component
        }
        setShowCropTool(false);
        setCropImageUrl('');
        setCropTargetField('');
    };

    const getTeamName = (teamId) => {
        if (!teamId || teamId === 'league') return 'League-wide';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    const getTypeIcon = (type) => {
        const icons = {
            text: '📝',
            image: '🖼️',
            video: '🎥'
        };
        return icons[type] || '📰';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <LacrosseIcon name="loading" className="text-4xl text-blue-600 mb-4" />
                    <p className="text-slate-600">Loading news items...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">News & Ticker Management</h2>
                    <p className="text-slate-600">Manage news items that appear in the ticker and team pages</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    <LacrosseIcon name="add" className="mr-2" style={{fontSize: '16px'}} />
                    Add News Item
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-blue-900">{newsItems.length}</div>
                    <div className="text-xs text-blue-700">Total Items</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-green-900">{getActiveNewsItems().length}</div>
                    <div className="text-xs text-green-700">Active</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-red-900">{newsItems.filter(n => !n.active).length}</div>
                    <div className="text-xs text-red-700">Inactive</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-yellow-900">{newsItems.filter(n => isExpired(n)).length}</div>
                    <div className="text-xs text-yellow-700">Expired</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-purple-900">{newsItems.filter(n => n.type === 'image').length}</div>
                    <div className="text-xs text-purple-700">With Images</div>
                </div>
            </div>

            {/* Vertical Scrolling Preview */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-slate-800">Live Preview - Vertical Scrolling Ticker</h3>
                    <p className="text-sm text-slate-600">This is how your news items will appear in the ticker</p>
                </div>
                
                <div className="p-4">
                    <div className="flex items-start">
                        <span className="bg-red-800 text-white px-4 py-3 rounded text-sm font-bold mr-6 flex-shrink-0 shadow-lg">
                            NEWS
                        </span>
                        
                        <div className="flex-grow overflow-hidden relative max-w-2xl bg-red-800 rounded-lg shadow-lg" style={{ height: '200px' }}>
                            <div className="animate-scroll-vertical absolute w-full">
                                {getActiveNewsItems().concat(getActiveNewsItems()).map((item, index) => (
                                    <div 
                                        key={`${item.id}-${index}`}
                                        className="relative flex items-center py-4 px-4 cursor-pointer hover:bg-red-700 hover:bg-opacity-50 rounded transition-colors"
                                        style={{ height: '200px' }}
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        {item.type === 'image' && item.imageUrl && (
                                            <img 
                                                src={item.imageUrl} 
                                                alt="News"
                                                className="w-32 h-24 rounded mr-4 object-cover flex-shrink-0 shadow-sm"
                                            />
                                        )}
                                        {item.type === 'video' && item.thumbnailUrl && (
                                            <div className="relative mr-4 flex-shrink-0">
                                                <img 
                                                    src={item.thumbnailUrl} 
                                                    alt="Video"
                                                    className="w-32 h-24 rounded object-cover shadow-sm"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                        <div className="w-0 h-0 border-l-4 border-l-red-600 border-t-3 border-t-transparent border-b-3 border-b-transparent ml-1"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex-grow min-w-0">
                                            <div className="text-white font-semibold text-lg truncate leading-tight">{item.heading || item.text}</div>
                                            {item.comments && (
                                                <div className="text-red-100 text-sm truncate mt-1">{item.comments}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* News Items List */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-slate-800">News Items ({newsItems.length})</h3>
                </div>
                
                <div className="divide-y divide-slate-200">
                    {newsItems.map(item => (
                        <NewsItemCard
                            key={item.id}
                            item={item}
                            teams={teams}
                            onEdit={setEditingItem}
                            onDelete={handleDeleteItem}
                            onClick={setSelectedItem}
                            getTeamName={getTeamName}
                            getTypeIcon={getTypeIcon}
                            isExpired={isExpired}
                            isItemActive={isItemActive}
                        />
                    ))}
                </div>

                {newsItems.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <LacrosseIcon name="news" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No news items yet</p>
                        <p>Add your first news item to get started</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Form Modal */}
            {(showAddForm || editingItem) && (
                <NewsItemForm
                    item={editingItem}
                    teams={teams}
                    onSave={handleSaveItem}
                    onCancel={() => {
                        setShowAddForm(false);
                        setEditingItem(null);
                    }}
                    saving={saving}
                    onImageUpload={(imageData, field) => {
                        setCropImageUrl(imageData);
                        setCropTargetField(field);
                        setShowCropTool(true);
                    }}
                />
            )}

            {/* Crop Tool Modal */}
            {showCropTool && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
                        <SimpleCropTool
                            imageUrl={cropImageUrl}
                            onCrop={handleCropComplete}
                            onCancel={() => {
                                setShowCropTool(false);
                                setCropImageUrl('');
                                setCropTargetField('');
                            }}
                            targetType="banner" // 16:9 aspect ratio good for news images
                        />
                    </div>
                </div>
            )}

            {/* News Detail Modal */}
            {selectedItem && (
                <NewsDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
};

// News Item Card Component
const NewsItemCard = ({ item, teams, onEdit, onDelete, onClick, getTeamName, getTypeIcon, isExpired, isItemActive }) => {
    const expired = isExpired(item);
    const active = isItemActive(item);
    
    return (
        <div className={`p-4 hover:bg-slate-50 transition-colors ${!active ? 'opacity-60' : ''}`}>
            <div className="flex items-start space-x-4">
                {/* Type indicator and thumbnail */}
                <div className="flex-shrink-0 relative">
                    {item.type === 'image' && item.imageUrl ? (
                        <img 
                            src={item.imageUrl} 
                            alt="News thumbnail"
                            className="w-16 h-12 rounded object-cover border border-slate-200"
                        />
                    ) : item.type === 'video' && item.thumbnailUrl ? (
                        <div className="relative">
                            <img 
                                src={item.thumbnailUrl} 
                                alt="Video thumbnail"
                                className="w-16 h-12 rounded object-cover border border-slate-200"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                    <div className="w-0 h-0 border-l-2 border-l-red-600 border-t-1 border-t-transparent border-b-1 border-b-transparent ml-0.5"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-16 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                            <span className="text-2xl">{getTypeIcon(item.type)}</span>
                        </div>
                    )}
                    
                    {/* Status indicators */}
                    {expired && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center" title="Expired">
                            <span className="text-white text-xs">⏰</span>
                        </div>
                    )}
                    {!item.active && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center" title="Inactive">
                            <span className="text-white text-xs">⏸️</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 truncate">{item.heading || item.text}</h4>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.text}</p>
                            {item.comments && (
                                <p className="text-xs text-slate-500 mt-1">{item.comments}</p>
                            )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                            <button
                                onClick={() => onClick(item)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="View details"
                            >
                                👁️
                            </button>
                            <button
                                onClick={() => onEdit(item)}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Edit item"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => onDelete(item.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete item"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                                {getTeamName(item.teamId)}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                                {getTypeIcon(item.type)} {item.type}
                            </span>
                            {!item.active && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium">
                                    Inactive
                                </span>
                            )}
                            {expired && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
                                    Expired
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500">{item.date}</div>
                            {item.expirationDate && (
                                <div className="text-xs text-slate-400">Expires: {item.expirationDate}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// News Item Form Component
const NewsItemForm = ({ item, teams, onSave, onCancel, saving, onImageUpload }) => {
    const [formData, setFormData] = useState({
        type: item?.type || 'text',
        heading: item?.heading || '',
        text: item?.text || '',
        comments: item?.comments || '',
        teamId: item?.teamId || 'league',
        imageUrl: item?.imageUrl || '',
        videoUrl: item?.videoUrl || '',
        thumbnailUrl: item?.thumbnailUrl || '',
        expirationDate: item?.expirationDate || '',
        active: item?.active !== undefined ? item.active : true
    });

    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            console.log(`📸 News ${field} upload:`, file.name, file.size);
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                if (onImageUpload) {
                    onImageUpload(imageData, field);
                } else {
                    // Direct upload without cropping
                    setFormData(prev => ({...prev, [field]: imageData}));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.heading.trim() && !formData.text.trim()) {
            alert('Please provide either a heading or text content');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    {item ? 'Edit News Item' : 'Add New News Item'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Content Type
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="text">📝 Text Only</option>
                                <option value="image">🖼️ Image + Text</option>
                                <option value="video">🎥 Video + Text</option>
                            </select>
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
                                <option value="league">League-wide news</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Status
                            </label>
                            <div className="flex items-center space-x-4 pt-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({...formData, active: e.target.checked})}
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Active</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Headline *
                        </label>
                        <input
                            type="text"
                            value={formData.heading}
                            onChange={(e) => setFormData({...formData, heading: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 'Championship Victory' or 'Training Session Update'"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            News Content
                        </label>
                        <textarea
                            value={formData.text}
                            onChange={(e) => setFormData({...formData, text: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="4"
                            placeholder="Detailed news content..."
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Additional Comments
                        </label>
                        <input
                            type="text"
                            value={formData.comments}
                            onChange={(e) => setFormData({...formData, comments: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Optional additional information"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Expiration Date (optional)
                        </label>
                        <input
                            type="date"
                            value={formData.expirationDate}
                            onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-slate-500 mt-1">Leave blank for no expiration. Item will become inactive after this date.</p>
                    </div>
                    
                    {formData.type === 'image' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    News Image
                                </label>
                                
                                {/* Current image preview */}
                                {formData.imageUrl && (
                                    <div className="mb-4">
                                        <img 
                                            src={formData.imageUrl} 
                                            alt="Current news image"
                                            className="w-full max-w-md h-40 object-cover rounded-lg border border-slate-200"
                                        />
                                    </div>
                                )}
                                
                                {/* Upload options */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'imageUrl')}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    {onImageUpload && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = 'image/*';
                                                input.onchange = (e) => handleFileUpload(e, 'imageUrl');
                                                input.click();
                                            }}
                                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                                        >
                                            📐 Upload & Crop
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Upload an image file or use "Upload & Crop" for custom sizing</p>
                            </div>
                        </div>
                    )}
                    
                    {formData.type === 'video' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Video URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.videoUrl}
                                    onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Video Thumbnail
                                </label>
                                
                                {/* Current thumbnail preview */}
                                {formData.thumbnailUrl && (
                                    <div className="mb-4 relative">
                                        <img 
                                            src={formData.thumbnailUrl} 
                                            alt="Video thumbnail"
                                            className="w-full max-w-md h-40 object-cover rounded-lg border border-slate-200"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg">
                                                <div className="w-0 h-0 border-l-6 border-l-red-600 border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Upload options */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'thumbnailUrl')}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    {onImageUpload && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = 'image/*';
                                                input.onchange = (e) => handleFileUpload(e, 'thumbnailUrl');
                                                input.click();
                                            }}
                                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                                        >
                                            📐 Upload & Crop
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Upload a thumbnail image for your video</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={saving}
                            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" 
                            disabled={saving || (!formData.heading.trim() && !formData.text.trim())}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// News Detail Modal Component
const NewsDetailModal = ({ item, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{item.heading || 'News Item'}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="space-y-4">
                    {item.type === 'image' && item.imageUrl && (
                        <div className="text-center">
                            <img 
                                src={item.imageUrl} 
                                alt="News content"
                                className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                            />
                        </div>
                    )}
                    
                    {item.type === 'video' && item.thumbnailUrl && (
                        <div className="text-center">
                            <div className="relative inline-block">
                                <img 
                                    src={item.thumbnailUrl} 
                                    alt="Video thumbnail"
                                    className="max-w-full h-auto rounded-lg shadow-lg cursor-pointer"
                                    onClick={() => item.videoUrl && window.open(item.videoUrl, '_blank')}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg cursor-pointer">
                                        <div className="w-0 h-0 border-l-8 border-l-red-600 border-t-6 border-t-transparent border-b-6 border-b-transparent ml-2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="prose max-w-none">
                        <p className="text-lg text-slate-700 leading-relaxed">{item.text}</p>
                        {item.comments && (
                            <p className="text-sm text-slate-600 italic border-l-4 border-blue-200 pl-4 mt-4">
                                {item.comments}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                                {item.type} content
                            </span>
                        </div>
                        <span className="text-sm text-slate-500">{item.date}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsManager;