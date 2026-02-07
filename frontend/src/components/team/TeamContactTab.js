import React, { useState, useEffect } from 'react';

const TeamContactTab = ({ team }) => {
    const [teamLocations, setTeamLocations] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [loadingCoaches, setLoadingCoaches] = useState(true);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Load team locations and coaches from API
    useEffect(() => {
        const loadTeamData = async () => {
            try {
                setLoadingLocations(true);
                setLoadingCoaches(true);
                
                // Load team-specific locations
                const locationsResponse = await fetch(`${backendUrl}/api/locations?team_id=${team.id}`);
                if (locationsResponse.ok) {
                    const locationsData = await locationsResponse.json();
                    setTeamLocations(locationsData);
                }

                // Load team coaches
                const coachesResponse = await fetch(`${backendUrl}/api/teams/${team.id}/coaches`);
                if (coachesResponse.ok) {
                    const coachesData = await coachesResponse.json();
                    setCoaches(coachesData.coaches || []);
                }
                
            } catch (error) {
                console.error('❌ Error loading team data:', error);
            } finally {
                setLoadingLocations(false);
                setLoadingCoaches(false);
            }
        };

        if (team.id) {
            loadTeamData();
        }
    }, [team.id, backendUrl]);

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

    const openGoogleMaps = (address) => {
        if (!address) return;
        window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=k`, '_blank');
    };

    return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Contact Information</h2>
        
        {/* Join This Team Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
                <span className="text-2xl">👋</span>
                <div>
                    <h3 className="font-semibold text-slate-800">Interested in Joining {team.name}?</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Contact one of our coaches below via email to inquire about joining the team!
                    </p>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Team Details</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-slate-600">Team Name</label>
                        <div className="text-slate-800">{team.name}</div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Division</label>
                        <div className="text-slate-800">{team.division || 'Field'}</div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Home Field</label>
                        <div className="text-slate-800">{team.homeField || 'TBD'}</div>
                    </div>
                    {team.contactEmail && (
                        <div>
                            <label className="text-sm font-medium text-slate-600">Team Email</label>
                            <div>
                                <a 
                                    href={`mailto:${team.contactEmail}?subject=Inquiry about ${team.name}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                    data-testid="team-contact-email"
                                >
                                    {team.contactEmail}
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Coaching Staff</h3>
                {loadingCoaches ? (
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                ) : coaches.length > 0 ? (
                    <div className="space-y-4">
                        {coaches.map((coach, index) => (
                            <div key={coach.id || index} className="border-b border-slate-200 last:border-0 pb-3 last:pb-0">
                                <div className="font-medium text-slate-800">
                                    {coach.name || coach.firstName + ' ' + coach.lastName}
                                </div>
                                <div className="text-sm text-slate-600">
                                    {coach.role || 'Coach'}
                                </div>
                                {coach.email && (
                                    <a 
                                        href={`mailto:${coach.email}?subject=Inquiry about joining ${team.name}`}
                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center mt-1"
                                        data-testid={`coach-email-${index}`}
                                    >
                                        <span className="mr-1">✉️</span>
                                        {coach.email}
                                    </a>
                                )}
                                {coach.phone && (
                                    <a 
                                        href={`tel:${coach.phone}`}
                                        className="text-sm text-slate-600 hover:text-slate-800 flex items-center mt-1"
                                    >
                                        <span className="mr-1">📱</span>
                                        {coach.phone}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {team.coach && (
                            <div>
                                <label className="text-sm font-medium text-slate-600">Head Coach</label>
                                <div className="text-slate-800">{team.coach}</div>
                            </div>
                        )}
                        {team.contactEmail && (
                            <div>
                                <label className="text-sm font-medium text-slate-600">Contact</label>
                                <div>
                                    <a 
                                        href={`mailto:${team.contactEmail}?subject=Inquiry about joining ${team.name}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {team.contactEmail}
                                    </a>
                                </div>
                            </div>
                        )}
                        {!team.coach && !team.contactEmail && (
                            <p className="text-slate-500 text-sm">No coaching information available</p>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Team Locations */}
        <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">📍 Team Locations</h3>
            {loadingLocations ? (
                <div className="bg-slate-50 p-4 rounded-lg text-center text-slate-500">
                    <p>Loading team locations...</p>
                </div>
            ) : teamLocations.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {teamLocations.map(location => (
                        <div key={location.id} className="bg-white border border-slate-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <span className="text-lg mr-2">{getLocationTypeIcon(location.types)}</span>
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
                            
                            {location.address && (
                                <div 
                                    className="text-sm text-slate-600 mb-2 cursor-pointer hover:text-blue-600"
                                    onClick={() => openGoogleMaps(location.address)}
                                    title="Click to open in Google Maps"
                                >
                                    📍 {location.address}
                                </div>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                                <span className={location.indoor ? 'text-orange-600' : 'text-green-600'}>
                                    {location.indoor ? '🏢 Indoor' : '🌤️ Outdoor'}
                                </span>
                                <span>
                                    {location.surface?.replace('_', ' ') || 'grass'}
                                </span>
                            </div>
                            
                            {location.description && (
                                <p className="text-sm text-slate-500 mt-2">{location.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 p-6 rounded-lg text-center text-slate-500">
                    <span className="text-3xl mb-2 block">📍</span>
                    <p>No team locations configured</p>
                    <p className="text-xs mt-1">Contact your team administrator to add practice fields, game venues, and meeting locations</p>
                </div>
            )}
        </div>
    </div>
    );
};

export default TeamContactTab;
