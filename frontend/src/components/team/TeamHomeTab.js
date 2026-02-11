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
                                className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Embedded Map */}
                                {location.address && (
                                    <div className="h-40">
                                        <iframe
                                            title={location.name}
                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(location.address)}&output=embed`}
                                            className="w-full h-full border-0"
                                            allowFullScreen
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <div className="flex items-center mb-2">
                                        <span className="text-xl mr-2">{getLocationTypeIcon(location.types)}</span>
                                        <h4 className="font-semibold text-slate-800">{location.name}</h4>
                                    </div>
                                    
                                    {/* Type badges */}
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {location.types && location.types.map((type, index) => (
                                            <span key={index} className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {type.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${location.indoor ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            {location.indoor ? 'Indoor' : 'Outdoor'}
                                        </span>
                                        {location.surface && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                {location.surface.replace(/_/g, ' ')}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {location.address && (
                                        <p className="text-sm text-slate-600 mb-1">{location.address}</p>
                                    )}
                                    {location.notes && (
                                        <p className="text-sm text-slate-500 italic mb-2">{location.notes}</p>
                                    )}
                                    
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                                        data-testid={`directions-btn-${location.id}`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Get Directions
                                    </a>
                                </div>
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
