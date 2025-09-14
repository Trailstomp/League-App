import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

const LocationManager = ({ teams, currentUser }) => {
    const [locations, setLocations] = useState([]);
    const [apiIntegrations, setApiIntegrations] = useState({}); // Keep for Google Maps
    const [editingLocation, setEditingLocation] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load locations and API integrations on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Load locations
            const locationsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations`);
            if (locationsResponse.ok) {
                const locationsData = await locationsResponse.json();
                setLocations(locationsData || []);
                console.log('✅ Loaded locations:', locationsData.length, 'locations');
            }

            // Load API integrations for Google Maps
            const apiResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/api-integrations`);
            if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                setApiIntegrations(apiData || {});
                console.log('✅ Loaded API integrations for maps');
            }
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLocation = async (locationData) => {
        try {
            setSaving(true);
            console.log('📍 Adding new location:', locationData);
            
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
            
            if (response.ok) {
                const newLocation = await response.json();
                setLocations(prev => [...prev, newLocation]);
                setShowAddForm(false);
                console.log('✅ Location added successfully');
            } else {
                console.error('❌ Failed to add location:', response.statusText);
                alert('Failed to add location. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error adding location:', error);
            alert('Error adding location. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleEditLocation = async (locationId, locationData) => {
        try {
            setSaving(true);
            console.log('📍 Updating location:', locationId, locationData);
            
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations/${locationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
            
            if (response.ok) {
                const updatedLocation = await response.json();
                setLocations(prev => prev.map(loc => 
                    loc.id === locationId ? updatedLocation : loc
                ));
                setEditingLocation(null);
                console.log('✅ Location updated successfully');
            } else {
                console.error('❌ Failed to update location:', response.statusText);
                alert('Failed to update location. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error updating location:', error);
            alert('Error updating location. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLocation = async (locationId) => {
        try {
            if (!window.confirm('Are you sure you want to delete this location?')) return;
            
            setSaving(true);
            console.log('📍 Deleting location:', locationId);
            
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations/${locationId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setLocations(prev => prev.filter(loc => loc.id !== locationId));
                console.log('✅ Location deleted successfully');
            } else {
                console.error('❌ Failed to delete location:', response.statusText);
                alert('Failed to delete location. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error deleting location:', error);
            alert('Error deleting location. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getLocationTypeIcon = (types) => {
        if (!types || types.length === 0) return '📍';
        const icons = {
            practice_field: '🏃‍♂️',
            game_field: '🏟️',
            social_venue: '🍽️',
            training_facility: '💪'
        };
        // Return first type's icon, but we'll show all types in labels
        return icons[types[0]] || '📍';
    };

    const getLocationTypeColor = (types) => {
        if (!types || types.length === 0) return 'bg-gray-100 text-gray-800 border-gray-200';
        const colors = {
            practice_field: 'bg-green-100 text-green-800 border-green-200',
            game_field: 'bg-blue-100 text-blue-800 border-blue-200',
            social_venue: 'bg-purple-100 text-purple-800 border-purple-200',
            training_facility: 'bg-orange-100 text-orange-800 border-orange-200'
        };
        // Use first type's color
        return colors[types[0]] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getSurfaceIcon = (surface) => {
        const icons = {
            turf: '🌿',
            grass: '🌱',
            concrete: '🧱',
            indoor_court: '🏢'
        };
        return icons[surface] || '🌿';
    };

    const getTeamName = (teamId) => {
        if (!teamId) return 'League-wide';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    const openGoogleMaps = (address) => {
        if (!address) return;
        window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=k`, '_blank');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <LacrosseIcon name="loading" className="text-4xl text-blue-600 mb-4" />
                    <p className="text-slate-600">Loading locations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Locations Management</h2>
                    <p className="text-slate-600">Manage team locations and facilities</p>
                </div>
            </div>

            <LocationsTab
                locations={locations}
                teams={teams}
                apiIntegrations={apiIntegrations}
                onAddLocation={handleAddLocation}
                onEditLocation={handleEditLocation}
                onDeleteLocation={handleDeleteLocation}
                showAddForm={showAddForm}
                setShowAddForm={setShowAddForm}
                editingLocation={editingLocation}
                setEditingLocation={setEditingLocation}
                saving={saving}
                getLocationTypeIcon={getLocationTypeIcon}
                getLocationTypeColor={getLocationTypeColor}
                getSurfaceIcon={getSurfaceIcon}
                getTeamName={getTeamName}
                openGoogleMaps={openGoogleMaps}
            />
        </div>
    );
};

// Locations Tab Component
const LocationsTab = ({ 
    locations, teams, apiIntegrations, onAddLocation, onEditLocation, onDeleteLocation,
    showAddForm, setShowAddForm, editingLocation, setEditingLocation, saving,
    getLocationTypeIcon, getLocationTypeColor, getSurfaceIcon, getTeamName, openGoogleMaps
}) => {
    const stats = {
        total: locations.length,
        practiceFields: locations.filter(l => l.type === 'practice_field').length,
        gameFields: locations.filter(l => l.type === 'game_field').length,
        socialVenues: locations.filter(l => l.type === 'social_venue').length,
        trainingFacilities: locations.filter(l => l.type === 'training_facility').length,
        indoor: locations.filter(l => l.indoor).length,
        outdoor: locations.filter(l => !l.indoor).length
    };

    const getMapImageUrl = (address) => {
        const apiKey = apiIntegrations?.googleMapsApiKey;
        if (!apiKey || !address) return null;
        return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=15&size=300x200&markers=color:red%7C${encodeURIComponent(address)}&key=${apiKey}&scale=2`;
    };

    return (
        <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-blue-900">{stats.total}</div>
                    <div className="text-xs text-blue-700">Total</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-green-900">{stats.practiceFields}</div>
                    <div className="text-xs text-green-700">Practice</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-purple-900">{stats.gameFields}</div>
                    <div className="text-xs text-purple-700">Game</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-orange-900">{stats.socialVenues}</div>
                    <div className="text-xs text-orange-700">Social</div>
                </div>
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-pink-900">{stats.indoor}</div>
                    <div className="text-xs text-pink-700">Indoor</div>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                    <div className="text-xl font-bold text-teal-900">{stats.outdoor}</div>
                    <div className="text-xs text-teal-700">Outdoor</div>
                </div>
            </div>

            {/* Add Location Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowAddForm(true)}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    <LacrosseIcon name="add" className="mr-2" style={{fontSize: '16px'}} />
                    Add Location
                </button>
            </div>

            {/* Add Location Form */}
            {showAddForm && (
                <LocationForm
                    teams={teams}
                    onSave={onAddLocation}
                    onCancel={() => setShowAddForm(false)}
                    saving={saving}
                />
            )}

            {/* Locations List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {locations.map(location => (
                    <LocationCard
                        key={location.id}
                        location={location}
                        teams={teams}
                        apiIntegrations={apiIntegrations}
                        onEdit={setEditingLocation}
                        onDelete={onDeleteLocation}
                        getLocationTypeIcon={getLocationTypeIcon}
                        getLocationTypeColor={getLocationTypeColor}
                        getSurfaceIcon={getSurfaceIcon}
                        getTeamName={getTeamName}
                        openGoogleMaps={openGoogleMaps}
                        getMapImageUrl={getMapImageUrl}
                    />
                ))}
            </div>

            {locations.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <LacrosseIcon name="location" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No locations yet</p>
                    <p>Add your first location to get started</p>
                </div>
            )}

            {/* Edit Location Form */} 
            {editingLocation && (
                <LocationForm
                    location={editingLocation}
                    teams={teams}
                    onSave={(data) => onEditLocation(editingLocation.id, data)}
                    onCancel={() => setEditingLocation(null)}
                    saving={saving}
                />
            )}
        </div>
    );
};

// Location Card Component
const LocationCard = ({ 
    location, teams, apiIntegrations, onEdit, onDelete,
    getLocationTypeIcon, getLocationTypeColor, getSurfaceIcon, getTeamName, openGoogleMaps, getMapImageUrl
}) => {
    const mapImageUrl = getMapImageUrl(location.address);

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        <span className="text-xl mr-2">{getLocationTypeIcon(location.type)}</span>
                        <h3 className="font-semibold text-slate-800">{location.name}</h3>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getLocationTypeColor(location.type)}`}>
                            {location.type.replace('_', ' ')}
                        </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-slate-600">
                        {location.address && (
                            <div 
                                className="flex items-center cursor-pointer hover:text-blue-600"
                                onClick={() => openGoogleMaps(location.address)}
                                title="Click to open in Google Maps"
                            >
                                📍 {location.address}
                            </div>
                        )}
                        
                        <div className="flex items-center space-x-4">
                            <span className={`flex items-center ${location.indoor ? 'text-orange-600' : 'text-green-600'}`}>
                                {location.indoor ? '🏢 Indoor' : '🌤️ Outdoor'}
                            </span>
                            <span className="flex items-center">
                                {getSurfaceIcon(location.surface)} {location.surface?.replace('_', ' ') || 'grass'}
                            </span>
                        </div>
                        
                        <div className="text-xs">
                            <span className={`px-2 py-1 rounded ${
                                location.teamId ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                                {getTeamName(location.teamId)}
                            </span>
                        </div>
                    </div>
                    
                    {location.description && (
                        <p className="text-sm text-slate-500 mt-2">{location.description}</p>
                    )}
                </div>
                
                <div className="flex space-x-1 ml-4">
                    <button
                        onClick={() => onEdit(location)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit location"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onDelete(location.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Delete location"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Google Maps Preview */}
            {mapImageUrl && (
                <div 
                    className="mt-3 cursor-pointer rounded-lg overflow-hidden border border-slate-200"
                    onClick={() => openGoogleMaps(location.address)}
                    title="Click to open in Google Maps"
                >
                    <img 
                        src={mapImageUrl} 
                        alt={`Map of ${location.name}`}
                        className="w-full h-24 object-cover hover:opacity-90 transition-opacity"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            )}
        </div>
    );
};

// Location Form Component
const LocationForm = ({ location, teams = [], onSave, onCancel, saving = false }) => {
    const [formData, setFormData] = useState({
        name: location?.name || '',
        address: location?.address || '',
        type: location?.type || 'practice_field',
        indoor: location?.indoor || false,
        surface: location?.surface || 'grass',
        description: location?.description || '',
        teamId: location?.teamId || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Location name is required');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    {location ? 'Edit Location' : 'Add New Location'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Location Name *
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
                                Type
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="practice_field">🏃‍♂️ Practice Field</option>
                                <option value="game_field">🏟️ Game Field</option>
                                <option value="social_venue">🍽️ Social Venue</option>
                                <option value="training_facility">💪 Training Facility</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Team (optional)
                            </label>
                            <select
                                value={formData.teamId}
                                onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">League-wide location</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Surface Type
                            </label>
                            <select
                                value={formData.surface}
                                onChange={(e) => setFormData({...formData, surface: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="grass">🌱 Grass</option>
                                <option value="turf">🌿 Turf</option>
                                <option value="concrete">🧱 Concrete</option>
                                <option value="indoor_court">🏢 Indoor Court</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Address
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="123 Main St, City, State 12345"
                        />
                    </div>
                    
                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.indoor}
                                onChange={(e) => setFormData({...formData, indoor: e.target.checked})}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-slate-700">Indoor Location</span>
                        </label>
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
                            placeholder="Additional details about this location..."
                        />
                    </div>
                    
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
                            disabled={saving || !formData.name.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : (location ? 'Update Location' : 'Add Location')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LocationManager;