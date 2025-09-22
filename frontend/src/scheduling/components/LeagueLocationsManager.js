import React, { useState } from 'react';

/**
 * League Locations Manager - Manage all possible event locations
 * Includes team locations + league-specific external locations
 */
const LeagueLocationsManager = ({ teams = [], leagueLocations = [], setLeagueLocations }) => {
    const [newLocation, setNewLocation] = useState({
        name: '',
        address: '',
        type: 'field', // 'field', 'arena', 'tournament', 'other'
        description: ''
    });
    const [editingLocation, setEditingLocation] = useState(null);

    // Get all team locations
    const teamLocations = teams.reduce((acc, team) => {
        if (team.locations && team.locations.length > 0) {
            team.locations.forEach(location => {
                acc.push({
                    ...location,
                    source: 'team',
                    teamName: team.name,
                    teamId: team.id
                });
            });
        }
        return acc;
    }, []);

    // Combine team and league locations
    const allLocations = [
        ...teamLocations,
        ...leagueLocations.map(loc => ({ ...loc, source: 'league' }))
    ];

    const handleAddLocation = () => {
        if (!newLocation.name.trim()) return;

        const locationToAdd = {
            id: `location_${Date.now()}`,
            ...newLocation,
            createdAt: new Date().toISOString()
        };

        console.log('📍 Adding new league location:', locationToAdd);
        setLeagueLocations(prev => [...prev, locationToAdd]);
        setNewLocation({ name: '', address: '', type: 'field', description: '' });
    };

    const handleEditLocation = (location) => {
        setEditingLocation(location);
    };

    const handleUpdateLocation = () => {
        if (!editingLocation || !editingLocation.name.trim()) return;

        console.log('📍 Updating location:', editingLocation);
        setLeagueLocations(prev => 
            prev.map(loc => loc.id === editingLocation.id ? editingLocation : loc)
        );
        setEditingLocation(null);
    };

    const handleDeleteLocation = (locationId) => {
        if (window.confirm('Are you sure you want to delete this location?')) {
            console.log('📍 Deleting location:', locationId);
            setLeagueLocations(prev => prev.filter(loc => loc.id !== locationId));
        }
    };

    const getLocationTypeIcon = (type) => {
        const icons = {
            field: '🏟️',
            arena: '🏢',
            tournament: '🎯',
            other: '📍'
        };
        return icons[type] || icons.other;
    };

    const getLocationTypeColor = (type) => {
        const colors = {
            field: 'bg-green-100 text-green-800 border-green-200',
            arena: 'bg-blue-100 text-blue-800 border-blue-200',
            tournament: 'bg-purple-100 text-purple-800 border-purple-200',
            other: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[type] || colors.other;
    };

    return (
        <div className="league-locations-manager bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">📍 League Locations Management</h2>
                <p className="text-gray-600">
                    Manage all possible event locations including team venues and external tournament sites
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-800">{allLocations.length}</div>
                    <div className="text-sm text-blue-600">Total Locations</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-800">{teamLocations.length}</div>
                    <div className="text-sm text-green-600">Team Locations</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-800">{leagueLocations.length}</div>
                    <div className="text-sm text-purple-600">League Locations</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-800">
                        {leagueLocations.filter(loc => loc.type === 'tournament').length}
                    </div>
                    <div className="text-sm text-orange-600">Tournament Sites</div>
                </div>
            </div>

            {/* Add New Location */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">➕ Add New League Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location Name *
                        </label>
                        <input
                            type="text"
                            value={newLocation.name}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Tournament Complex East"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <select
                            value={newLocation.type}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="field">🏟️ Field/Stadium</option>
                            <option value="arena">🏢 Indoor Arena</option>
                            <option value="tournament">🎯 Tournament Site</option>
                            <option value="other">📍 Other</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <input
                            type="text"
                            value={newLocation.address}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="123 Main St, City, State"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={newLocation.description}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="Additional details about this location..."
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleAddLocation}
                        disabled={!newLocation.name.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ➕ Add Location
                    </button>
                </div>
            </div>

            {/* All Locations List */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">All Available Locations ({allLocations.length})</h3>
                
                {allLocations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No locations available. Add team locations or create league locations above.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {allLocations.map((location, index) => (
                            <div key={location.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <span className="text-lg mr-2">{getLocationTypeIcon(location.type)}</span>
                                            <h4 className="font-semibold text-gray-800">{location.name}</h4>
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getLocationTypeColor(location.type)}`}>
                                                {location.type}
                                            </span>
                                        </div>
                                        
                                        {location.address && (
                                            <div className="text-sm text-gray-600 mb-1">
                                                📍 {location.address}
                                            </div>
                                        )}
                                        
                                        {location.description && (
                                            <div className="text-sm text-gray-500 mb-2">
                                                {location.description}
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center text-xs text-gray-500">
                                            <span className={`px-2 py-1 rounded ${
                                                location.source === 'team' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {location.source === 'team' ? `🥍 ${location.teamName}` : '🏛️ League'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {location.source === 'league' && (
                                        <div className="flex space-x-1 ml-4">
                                            <button
                                                onClick={() => handleEditLocation(location)}
                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded text-sm"
                                                title="Edit location"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLocation(location.id)}
                                                className="p-1 text-red-600 hover:bg-red-100 rounded text-sm"
                                                title="Delete location"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Location Modal */}
            {editingLocation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">✏️ Edit Location</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingLocation.name}
                                    onChange={(e) => setEditingLocation(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={editingLocation.type}
                                    onChange={(e) => setEditingLocation(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="field">🏟️ Field/Stadium</option>
                                    <option value="arena">🏢 Indoor Arena</option>
                                    <option value="tournament">🎯 Tournament Site</option>
                                    <option value="other">📍 Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={editingLocation.address || ''}
                                    onChange={(e) => setEditingLocation(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={editingLocation.description || ''}
                                    onChange={(e) => setEditingLocation(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="2"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setEditingLocation(null)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateLocation}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                💾 Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeagueLocationsManager;