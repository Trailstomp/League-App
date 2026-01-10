import React, { useState, useEffect } from 'react';
import NewsDisplay from '../NewsDisplay';
import TeamGalleryDisplay from '../TeamGalleryDisplay';
import { LacrosseIcon } from '../LacrosseIcons';

const TeamHomeTab = ({ team, teams, events, onNavigate }) => {
    const [teamLocations, setTeamLocations] = useState([]);
    const [apiIntegrations, setApiIntegrations] = useState({});
    const [loadingLocations, setLoadingLocations] = useState(true);
    const teamStyle = team.style || {};

    // Load team locations from API
    useEffect(() => {
        const loadTeamLocations = async () => {
            try {
                setLoadingLocations(true);
                
                // Load team-specific locations
                const locationsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations?team_id=${team.id}`);
                if (locationsResponse.ok) {
                    const locationsData = await locationsResponse.json();
                    setTeamLocations(locationsData);
                    console.log('📍 Loaded team locations:', locationsData.length, 'for team', team.name);
                }

                // Load API integrations for Google Maps
                const apiResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/api-integrations`);
                if (apiResponse.ok) {
                    const apiData = await apiResponse.json();
                    setApiIntegrations(apiData);
                }
                
            } catch (error) {
                console.error('❌ Error loading team locations:', error);
            } finally {
                setLoadingLocations(false);
            }
        };

        if (team.id) {
            loadTeamLocations();
        }
    }, [team.id, team.name]);

    const getLocationTypeIcon = (types) => {
        if (!types || types.length === 0) return '📍';
        const icons = {
            practice_field: '🏃‍♂️',
            game_field: '🏟️',
            social_venue: '🍽️',
            training_facility: '💪'
        };
        return icons[types[0]] || '📍';
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

    const openGoogleMaps = (address) => {
        if (!address) return;
        window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=k`, '_blank');
    };

    const getMapImageUrl = (address, satellite = false) => {
        const apiKey = apiIntegrations?.googleMapsApiKey;
        if (!apiKey || !address) return null;
        const mapType = satellite ? 'satellite' : 'roadmap';
        return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=17&size=400x200&maptype=${mapType}&markers=color:red%7C${encodeURIComponent(address)}&key=${apiKey}&scale=2`;
    };
    
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Team News */}
            <NewsDisplay teamId={team.id} maxItems={5} />

            {/* Team Media Gallery */}
            <TeamGalleryDisplay 
                teamId={team.id}
                pageType="team"
            />

            {/* Team Locations Section - Moved below stats */}
            {teamLocations.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">🏟️ Team Locations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teamLocations.map(location => (
                            <div 
                                key={location.id} 
                                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <span className="text-xl mr-2">{getLocationTypeIcon(location.types)}</span>
                                            <h4 className="font-semibold text-slate-800">{location.name}</h4>
                                        </div>
                                        
                                        {/* Multiple type badges */}
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {location.types && location.types.map((type, index) => (
                                                <span key={index} className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {type.replace('_', ' ')}
                                                </span>
                                            ))}
                                            {(!location.types || location.types.length === 0) && (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    location
                                                </span>
                                            )}
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
                                        </div>
                                        
                                        {location.description && (
                                            <p className="text-sm text-slate-500 mt-2">{location.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Google Maps Preview with Satellite */}
                                {getMapImageUrl(location.address) && (
                                    <div className="mt-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div 
                                                className="cursor-pointer rounded-lg overflow-hidden border border-slate-200"
                                                onClick={() => openGoogleMaps(location.address)}
                                                title="Click to open in Google Maps"
                                            >
                                                <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 border-b">📍 Street View</div>
                                                <img 
                                                    src={getMapImageUrl(location.address, false)} 
                                                    alt={`Street map of ${location.name}`}
                                                    className="w-full h-24 object-cover hover:opacity-90 transition-opacity"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                            <div 
                                                className="cursor-pointer rounded-lg overflow-hidden border border-slate-200"
                                                onClick={() => openGoogleMaps(location.address)}
                                                title="Click to open in Google Maps"
                                            >
                                                <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 border-b">🛰️ Satellite</div>
                                                <img 
                                                    src={getMapImageUrl(location.address, true)} 
                                                    alt={`Satellite view of ${location.name}`}
                                                    className="w-full h-24 object-cover hover:opacity-90 transition-opacity"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loadingLocations && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">🏟️ Team Locations</h3>
                    <div className="bg-slate-50 p-4 rounded-lg text-center text-slate-500">
                        <p>Loading team locations...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamHomeTab;
