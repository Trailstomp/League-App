import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import TeamGalleryDisplay from '../components/TeamGalleryDisplay';
import GroupMeChat from '../components/GroupMeChat';
import NewsDisplay from '../components/NewsDisplay';
import TeamStatsDisplay from '../components/TeamStatsDisplay';
import YouTubeSettings from '../components/managers/YouTubeSettings';
import PlayerCard from '../components/PlayerCard';
import { fixGoogleDriveUrl } from '../utils/imageUtils';
import CachedImage from '../components/CachedImage';
import Skeleton, { SkeletonEventCard } from '../components/Skeleton';

const TeamDetailPage = ({ team, teams, events, players, currentUser, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('home');

    if (!team) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <LacrosseIcon name="teams" style={{fontSize: '48px'}} />
                    <h2 className="text-xl font-semibold text-slate-800 mt-4">Team not found</h2>
                    <p className="text-slate-600 mt-2">The team you're looking for doesn't exist.</p>
                    <button 
                        onClick={() => onNavigate('home')}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Check if current user is a coach or admin for this team
    const isTeamCoachOrAdmin = currentUser && (
        currentUser.roles?.includes('admin') ||
        (currentUser.roles?.includes('coach') && (
            currentUser.teamId === team.id ||
            currentUser.teamAssignments?.some(a => a.teamId === team.id)
        ))
    );

    const tabs = [
        { id: 'home', label: 'Home', icon: 'venue' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'roster', label: 'Roster', icon: 'teams' },
        { id: 'stats', label: 'Stats', icon: 'trophy' },
        { id: 'chat', label: 'Team Chat', icon: 'email' },
        { id: 'media', label: 'Photos & Vids', icon: 'view' },
        { id: 'contact', label: 'Contact', icon: 'email' },
        // Coach/Admin only tabs
        ...(isTeamCoachOrAdmin ? [
            { id: 'manage-roster', label: 'Manage Roster', icon: 'admin', coachOnly: true },
            { id: 'recruiting', label: 'Recruiting', icon: 'add', coachOnly: true },
            { id: 'team-fees', label: 'Fees', icon: '💰', coachOnly: true },
        ] : []),
        { id: 'settings', label: 'Settings', icon: 'settings', adminOnly: true }
    ];

    const teamStyle = team.style || {};

    return (
        <div 
            className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 min-h-screen"
            style={{
                background: teamStyle.pageBackgroundType === 'image' && teamStyle.pageBackgroundImage
                    ? `url(${teamStyle.pageBackgroundImage})`
                    : `linear-gradient(135deg, ${teamStyle.pageBackgroundColor || teamStyle.backgroundColor || '#f8fafc'} 0%, rgba(255,255,255,0.8) 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* DEBUG: Log team colors - DETAILED */}
            {(() => {
                console.log('🎨 DETAILED Team page background analysis:');
                console.log('  - pageBackgroundType:', teamStyle.pageBackgroundType);
                console.log('  - pageBackgroundColor:', teamStyle.pageBackgroundColor);
                console.log('  - backgroundColor:', teamStyle.backgroundColor);
                console.log('  - primaryColor:', teamStyle.primaryColor);
                console.log('  - Final calculated color:', teamStyle.pageBackgroundColor || teamStyle.backgroundColor || '#f8fafc');
                console.log('  - Full teamStyle object:', teamStyle);
                return null;
            })()}
            {/* Team Header */}
            <div 
                className="relative bg-gradient-to-r from-slate-800 to-slate-600 text-white rounded-lg overflow-hidden mb-4 sm:mb-6"
                style={{
                    backgroundColor: teamStyle.primaryColor || '#64748b',
                    backgroundImage: teamStyle.bannerUrl ? `url(${teamStyle.bannerUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {teamStyle.bannerUrl && <div className="absolute inset-0 bg-black bg-opacity-40"></div>}
                <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        {/* Team Logo - Enhanced - LARGER */}
                        <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-xl overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-white">
                            {teamStyle.logoUrl ? (
                                <CachedImage 
                                    src={fixGoogleDriveUrl(teamStyle.logoUrl)} 
                                    alt={`${team.name} logo`}
                                    className="w-full h-full object-contain p-2"
                                    style={{ opacity: teamStyle.logoOpacity || 1 }}
                                    fallback={
                                        <div 
                                            className="w-full h-full flex items-center justify-center rounded-xl"
                                            style={{ backgroundColor: teamStyle.primaryColor || '#dc2626' }}
                                        >
                                            <LacrosseIcon name="stick" style={{fontSize: '64px', color: 'white'}} />
                                        </div>
                                    }
                                />
                            ) : (
                                <div 
                                    className="w-full h-full flex items-center justify-center rounded-xl"
                                    style={{ backgroundColor: teamStyle.primaryColor || '#dc2626' }}
                                >
                                    <LacrosseIcon name="stick" style={{fontSize: '64px', color: 'white'}} />
                                </div>
                            )}
                        </div>
                        
                        {/* Team Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 break-words">{team.name}</h1>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                                <div>
                                    <span className="text-blue-200">Division:</span>
                                    <div className="font-semibold truncate">{team.division || 'Field'}</div>
                                </div>
                                <div>
                                    <span className="text-blue-200">Record:</span>
                                    <div className="font-semibold">{team.wins || 0}-{team.losses || 0}-{team.ties || 0}</div>
                                </div>
                                <div>
                                    <span className="text-blue-200">Coach:</span>
                                    <div className="font-semibold truncate">{team.coach || 'TBD'}</div>
                                </div>
                                <div>
                                    <span className="text-blue-200">Home Field:</span>
                                    <div className="font-semibold truncate">{team.homeField || 'TBD'}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Back Button */}
                        <button 
                            onClick={() => onNavigate('home')}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors text-sm flex-shrink-0"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-4 sm:mb-6">
                <div className="flex overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <LacrosseIcon name={tab.icon} className="mr-1 sm:mr-2" style={{fontSize: '14px'}} />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-6 overflow-x-hidden">
                {activeTab === 'home' && <TeamHomeTab team={team} teams={teams} events={events} onNavigate={onNavigate} />}
                {activeTab === 'schedule' && <TeamScheduleTab team={team} events={events} />}
                {activeTab === 'roster' && <TeamRosterTab team={team} players={players} />}
                {activeTab === 'stats' && <TeamStatsTab team={team} events={events} />}
                {activeTab === 'chat' && <TeamChatTab team={team} />}
                {activeTab === 'media' && <TeamMediaTab team={team} />}
                {activeTab === 'contact' && <TeamContactTab team={team} />}
                {activeTab === 'recruiting' && <TeamRecruitingTab team={team} currentUser={currentUser} />}
                {activeTab === 'settings' && <TeamSettingsTab team={team} />}
            </div>
        </div>
    );
};

// Team Home Tab - Enhanced with Team Identity and Locations
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

// Team Schedule Tab
const TeamScheduleTab = ({ team, events = [] }) => {
    const teamEvents = events.filter(event => 
        event.teamIds?.includes(team.id) || 
        event.homeTeam === team.id || 
        event.awayTeam === team.id
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Schedule</h2>
            
            {teamEvents.length > 0 ? (
                <div className="space-y-4">
                    {teamEvents.map(event => (
                        <div key={event.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-800">{event.title}</h3>
                                    <p className="text-sm text-slate-600">{event.date} at {event.time}</p>
                                    <p className="text-sm text-slate-500">{event.location}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        event.type === 'game' ? 'bg-red-100 text-red-800' :
                                        event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                        {event.type || 'Event'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 p-8 rounded-lg text-center text-slate-500">
                    <LacrosseIcon name="calendar" style={{fontSize: '48px'}} className="mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No scheduled events</h3>
                    <p>Check back later for upcoming games and practices</p>
                </div>
            )}
        </div>
    );
};

// Team Roster Tab
const TeamRosterTab = ({ team, players = [] }) => {
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const teamPlayers = players.filter(player => player.teamId === team.id);

    const getPositionColor = (position) => {
        switch (position?.toLowerCase()) {
            case 'attack':
                return 'text-red-600';
            case 'midfield':
            case 'midfielder':
                return 'text-blue-600';
            case 'defense':
            case 'defender':
                return 'text-green-600';
            case 'goalie':
            case 'goalkeeper':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    };

    const PlayerDetailModal = ({ player, team, onClose }) => {
        if (!player) return null;

        return (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={(e) => {
                    // Click-away to close - only if clicking the backdrop, not the modal
                    if (e.target === e.currentTarget) {
                        console.log('🎯 Player popup closed by click-away');
                        onClose();
                    }
                }}
            >
                <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border">
                    {/* Large Player Card */}
                    <div className="p-6">
                        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg overflow-hidden mb-4">
                            {/* Player Photo */}
                            <div className="aspect-[3/4] relative">
                                {player.photoUrl ? (
                                    <img 
                                        src={player.photoUrl} 
                                        alt={player.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                                        <svg className="w-20 h-20 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                    </div>
                                )}
                                
                                {/* Team Logo Overlay - LARGER */}
                                <div className="absolute top-3 left-3">
                                    <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-white">
                                        {team.style?.logoUrl ? (
                                            <img 
                                                src={fixGoogleDriveUrl(team.style.logoUrl)} 
                                                alt={team.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div 
                                                className="w-full h-full rounded-full flex items-center justify-center"
                                                style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}
                                            >
                                                <span className="text-white font-bold text-sm">
                                                    {team.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Jersey Number */}
                                <div className="absolute bottom-3 right-3">
                                    <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                                        style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}
                                    >
                                        {player.jerseyNumber || '?'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Player Info */}
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">{player.name}</h2>
                            <div className="flex items-center justify-center space-x-4 text-sm text-slate-600">
                                <span className={`font-medium ${getPositionColor(player.position)}`}>
                                    {player.position || 'Unassigned'}
                                </span>
                                {player.handedness && (
                                    <span className="bg-slate-100 px-2 py-1 rounded">
                                        {player.handedness} Handed
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Player Details & Social Links */}
                        <div className="space-y-4">
                            {player.details && (
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-2">About {player.name.split(' ')[0]}</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{player.details}</p>
                                </div>
                            )}
                            
                            {/* Social Links */}
                            <div>
                                <h4 className="font-semibold text-slate-700 mb-3">Connect</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {player.social?.instagram && (
                                        <a 
                                            href={player.social.instagram} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium"
                                        >
                                            📷 Instagram
                                        </a>
                                    )}
                                    {player.social?.twitter && (
                                        <a 
                                            href={player.social.twitter} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-medium"
                                        >
                                            🐦 Twitter
                                        </a>
                                    )}
                                    {player.social?.facebook && (
                                        <a 
                                            href={player.social.facebook} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                                        >
                                            📘 Facebook
                                        </a>
                                    )}
                                    {player.social?.linkedin && (
                                        <a 
                                            href={player.social.linkedin} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-all text-sm font-medium"
                                        >
                                            💼 LinkedIn
                                        </a>
                                    )}
                                </div>
                                
                                {/* Contact Info - Minimized */}
                                {(player.email || player.phone) && (
                                    <div className="mt-4 pt-3 border-t">
                                        <h5 className="text-xs font-semibold text-slate-500 mb-2">CONTACT</h5>
                                        <div className="space-y-1">
                                            {player.email && (
                                                <div className="text-xs text-slate-600">📧 {player.email}</div>
                                            )}
                                            {player.phone && (
                                                <div className="text-xs text-slate-600">📱 {player.phone}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Close Button */}
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={onClose}
                                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Team Roster</h2>
                <div className="text-sm text-slate-500">
                    {teamPlayers.length} player{teamPlayers.length !== 1 ? 's' : ''}
                </div>
            </div>
            
            {teamPlayers.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {teamPlayers.map(player => (
                        <div 
                            key={player.id} 
                            className="relative bg-white rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group"
                            style={{ 
                                borderColor: team.style?.primaryColor || '#2563eb',
                                background: `linear-gradient(135deg, rgba(255,255,255,1) 0%, ${team.style?.backgroundColor || '#f8fafc'} 100%)`,
                                // REALISTIC CARD SHADOWS - like sitting on desk
                                boxShadow: `
                                    0 4px 6px -1px rgba(0, 0, 0, 0.1),
                                    0 2px 4px -1px rgba(0, 0, 0, 0.06),
                                    0 0 0 1px ${team.style?.primaryColor || '#2563eb'}40,
                                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                                `,
                                transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                                border: `2px solid ${team.style?.primaryColor || '#2563eb'}`,
                            }}
                            onMouseEnter={(e) => {
                                // 3D card hover effect
                                e.currentTarget.style.transform = 'perspective(1000px) rotateX(-2deg) rotateY(2deg) translateY(-4px)';
                                e.currentTarget.style.boxShadow = `
                                    0 20px 25px -5px rgba(0, 0, 0, 0.1),
                                    0 10px 10px -5px rgba(0, 0, 0, 0.04),
                                    0 0 0 1px ${team.style?.primaryColor || '#2563eb'}60,
                                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                                `;
                            }}
                            onMouseLeave={(e) => {
                                // Return to flat position
                                e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
                                e.currentTarget.style.boxShadow = `
                                    0 4px 6px -1px rgba(0, 0, 0, 0.1),
                                    0 2px 4px -1px rgba(0, 0, 0, 0.06),
                                    0 0 0 1px ${team.style?.primaryColor || '#2563eb'}40,
                                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                                `;
                            }}
                            onClick={() => setSelectedPlayer(player)}
                        >
                            {/* Card Header Stripe with Gradient */}
                            <div 
                                className="h-3 w-full"
                                style={{ 
                                    background: `linear-gradient(90deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`
                                }}
                            ></div>
                            
                            {/* Player Photo Container */}
                            <div className="relative bg-gradient-to-br from-slate-100 to-slate-200">
                                {/* Player Photo */}
                                <div className="aspect-[3/4] relative">
                                    {player.photoUrl ? (
                                        <CachedImage 
                                            src={player.photoUrl} 
                                            alt={player.name}
                                            className="w-full h-full object-cover"
                                            fallback={
                                                <div 
                                                    className="w-full h-full flex items-center justify-center"
                                                    style={{ 
                                                        background: `linear-gradient(135deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, ${team.style?.primaryColor || '#2563eb'}15 100%)`
                                                    }}
                                                >
                                                    <svg className="w-20 h-20 opacity-30" fill="currentColor" viewBox="0 0 24 24" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                    </svg>
                                                </div>
                                            }
                                        />
                                    ) : (
                                        <div 
                                            className="w-full h-full flex items-center justify-center"
                                            style={{ 
                                                background: `linear-gradient(135deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, ${team.style?.primaryColor || '#2563eb'}15 100%)`
                                            }}
                                        >
                                            <svg className="w-20 h-20 opacity-30" fill="currentColor" viewBox="0 0 24 24" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                            </svg>
                                        </div>
                                    )}
                                    
                                    {/* Team Logo Overlay - SMALLER to avoid covering faces */}
                                    <div className="absolute top-2 left-2">
                                        <div 
                                            className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white"
                                            style={{ 
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                            }}
                                        >
                                            {team.style?.logoUrl ? (
                                                <CachedImage 
                                                    src={fixGoogleDriveUrl(team.style.logoUrl)} 
                                                    alt={team.name}
                                                    className="w-full h-full object-contain p-0.5"
                                                    fallback={
                                                        <LacrosseIcon name="stick" style={{ fontSize: '16px', color: team.style?.primaryColor || '#dc2626' }} />
                                                    }
                                                />
                                            ) : (
                                                <div 
                                                    className="w-full h-full rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}
                                                >
                                                    <span className="text-white font-bold text-sm">
                                                        {team.name.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Jersey Number - Smaller to match logo */}
                                    <div className="absolute bottom-2 right-2">
                                        <div 
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white"
                                            style={{ 
                                                background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 50%, ${team.style?.primaryColor || '#2563eb'} 100%)`,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            {player.jerseyNumber || '?'}
                                        </div>
                                    </div>
                                    
                                    {/* Position Badge - Enhanced */}
                                    <div className="absolute top-1 right-1">
                                        <div 
                                            className="bg-white rounded-full w-10 h-10 flex items-center justify-center border-2 border-white"
                                            style={{ 
                                                borderColor: team.style?.primaryColor || '#2563eb',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <span 
                                                className="text-xs font-bold"
                                                style={{ color: team.style?.primaryColor || '#2563eb' }}
                                            >
                                                {player.position?.charAt(0) || 'P'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Player Info Card with Card-like Design */}
                            <div className="p-4 bg-white relative">
                                {/* Card Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-40 pointer-events-none"></div>
                                
                                <h3 
                                    className="font-bold text-center text-base mb-2 truncate relative z-10"
                                    style={{ color: team.style?.primaryColor || '#2563eb' }}
                                >
                                    {player.name}
                                </h3>
                                <div className="text-center space-y-2 relative z-10">
                                    <div 
                                        className="text-sm font-semibold px-3 py-1 rounded-full inline-block"
                                        style={{ 
                                            backgroundColor: team.style?.accentColor || '#3b82f6',
                                            color: 'white',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {player.position || 'Player'}
                                    </div>
                                    
                                    {/* Additional Positions */}
                                    {player.additionalPositions && player.additionalPositions.length > 0 && (
                                        <div className="flex flex-wrap justify-center gap-1">
                                            {player.additionalPositions.slice(0, 2).map((pos, idx) => (
                                                <span 
                                                    key={idx}
                                                    className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600"
                                                    style={{ borderColor: team.style?.primaryColor || '#2563eb' }}
                                                >
                                                    +{pos}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {player.handedness && (
                                        <div className="text-xs text-slate-600 font-medium">
                                            {player.handedness} Handed
                                        </div>
                                    )}
                                    
                                    {/* Additional Teams Indicator */}
                                    {player.additionalTeams && player.additionalTeams.length > 0 && (
                                        <div className="text-xs text-slate-500">
                                            +{player.additionalTeams.length} other team{player.additionalTeams.length > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Card Footer Stripe with Gradient */}
                            <div 
                                className="h-3 w-full"
                                style={{ 
                                    background: `linear-gradient(90deg, ${team.style?.accentColor || '#3b82f6'} 0%, ${team.style?.primaryColor || '#2563eb'} 100%)`
                                }}
                            ></div>
                            
                            {/* Playing Card Corner Elements - Enhanced */}
                            <div 
                                className="absolute bottom-2 left-2 text-xs font-bold opacity-50 transform rotate-180"
                                style={{ color: team.style?.primaryColor || '#2563eb' }}
                            >
                                #{player.jerseyNumber || '?'}
                            </div>
                            
                            {/* Card Bevel Effect */}
                            <div className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 p-6 sm:p-8 rounded-lg text-center text-slate-500">
                    <LacrosseIcon name="teams" style={{fontSize: '48px'}} className="mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium mb-2">No players registered</h3>
                    <p className="text-sm mb-4">Start building your team by adding players to the roster</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Add First Player
                    </button>
                </div>
            )}

            {/* Player Detail Modal */}
            {selectedPlayer && (
                <PlayerDetailModal 
                    player={selectedPlayer} 
                    team={team}
                    onClose={() => setSelectedPlayer(null)} 
                />
            )}
        </div>
    );
};

// Team Stats Tab
const TeamStatsTab = ({ team, events = [] }) => {
    return <TeamStatsDisplay teamId={team.id} />;
};

// Team Media Tab
const TeamMediaTab = ({ team }) => {
    // Import YouTubeGallery and MediaGallery dynamically
    const YouTubeGallery = React.lazy(() => import('../components/YouTubeGallery'));
    // TeamGalleryDisplay is already imported above

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Photos & Videos</h2>
            
            <React.Suspense fallback={<div className="bg-slate-50 p-8 rounded-lg text-center text-slate-500">Loading media...</div>}>
                {/* Team-specific Media Gallery */}
                <TeamGalleryDisplay 
                    teamId={team.id}
                    pageType="team"
                />
                
                {/* Team YouTube Videos */}
                <YouTubeGallery 
                    teamId={team.id}
                    title={`${team.name} YouTube Videos`} 
                />
            </React.Suspense>
        </div>
    );
};

// Team Contact Tab - Enhanced with Locations
const TeamContactTab = ({ team }) => {
    const [teamLocations, setTeamLocations] = useState([]);
    const [apiIntegrations, setApiIntegrations] = useState({});
    const [loadingLocations, setLoadingLocations] = useState(true);

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
    }, [team.id]);

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
                </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Coaching Staff</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-slate-600">Head Coach</label>
                        <div className="text-slate-800">{team.coach || 'TBD'}</div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Contact Email</label>
                        <div className="text-slate-800">
                            {team.contactEmail ? (
                                <a href={`mailto:${team.contactEmail}`} className="text-blue-600 hover:text-blue-800">
                                    {team.contactEmail}
                                </a>
                            ) : (
                                'Not provided'
                            )}
                        </div>
                    </div>
                </div>
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

// Team Chat Tab
const TeamChatTab = ({ team }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Team Chat</h2>
                <div className="flex items-center text-sm text-slate-600">
                    <span className="mr-2">💬</span>
                    Real-time GroupMe integration
                </div>
            </div>
            
            <GroupMeChat teamId={team.id} channelType="team" />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">Team Chat Features</h4>
                        <div className="text-sm text-blue-700 mt-1">
                            <ul className="list-disc list-inside space-y-1">
                                <li>RSVP to events with <code className="bg-blue-100 px-1 rounded">/rsvp yes</code> or <code className="bg-blue-100 px-1 rounded">/rsvp no</code></li>
                                <li>Check schedule with <code className="bg-blue-100 px-1 rounded">/schedule</code></li>
                                <li>Get help with <code className="bg-blue-100 px-1 rounded">/help</code></li>
                                <li>Messages sync in real-time from GroupMe</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Team Settings Tab - Admin Only
const TeamSettingsTab = ({ team }) => {
    const [activeSection, setActiveSection] = useState('youtube');
    
    const sections = [
        { id: 'youtube', label: 'YouTube Channel', icon: '📺' },
        { id: 'social', label: 'Social Media', icon: '📱' },
        { id: 'appearance', label: 'Appearance', icon: '🎨' }
    ];
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Team Settings</h2>
                <div className="flex items-center text-sm text-slate-600">
                    <span className="mr-2">⚙️</span>
                    Manage team configuration
                </div>
            </div>
            
            {/* Settings Navigation */}
            <div className="flex gap-2 border-b pb-4">
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeSection === section.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <span className="mr-2">{section.icon}</span>
                        {section.label}
                    </button>
                ))}
            </div>
            
            {/* Settings Content */}
            <div className="bg-white/90 rounded-lg shadow-sm border p-6 backdrop-blur-sm">
                {activeSection === 'youtube' && (
                    <YouTubeSettings 
                        teamId={team.id} 
                        onSave={() => console.log('Team YouTube settings saved')} 
                    />
                )}
                
                {activeSection === 'social' && (
                    <div className="text-center py-8 text-slate-600">
                        <p className="text-4xl mb-4">📱</p>
                        <h3 className="text-lg font-semibold mb-2">Social Media Settings</h3>
                        <p>Configure your team's social media links and integration.</p>
                        <p className="text-sm text-slate-500 mt-4">Coming soon...</p>
                    </div>
                )}
                
                {activeSection === 'appearance' && (
                    <div className="text-center py-8 text-slate-600">
                        <p className="text-4xl mb-4">🎨</p>
                        <h3 className="text-lg font-semibold mb-2">Appearance Settings</h3>
                        <p>Customize your team page colors, fonts, and branding.</p>
                        <p className="text-sm text-slate-500 mt-4">Coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Team Recruiting Tab - For coaches to send invitations
const TeamRecruitingTab = ({ team, currentUser }) => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        method: 'email',
        position: '',
        message: ''
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadInvites();
    }, [team.id]);

    const loadInvites = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/invites`);
            if (response.ok) {
                const data = await response.json();
                setInvites(data.invites || []);
            }
        } catch (error) {
            console.error('Error loading invites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setMessage('❌ Name is required');
            return;
        }
        
        if (formData.method === 'email' && !formData.email.trim()) {
            setMessage('❌ Email is required for email invites');
            return;
        }
        
        if (formData.method === 'sms' && !formData.phone.trim()) {
            setMessage('❌ Phone number is required for SMS invites');
            return;
        }

        try {
            setSending(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/invites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    sentBy: currentUser?.id,
                    sentByName: currentUser?.name || 'Coach'
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessage('✅ Invitation sent successfully!');
                setShowInviteForm(false);
                setFormData({ name: '', email: '', phone: '', method: 'email', position: '', message: '' });
                loadInvites();
            } else {
                setMessage(`❌ ${data.detail || 'Failed to send invite'}`);
            }
        } catch (error) {
            setMessage('❌ Network error. Please try again.');
        } finally {
            setSending(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const handleResend = async (inviteId) => {
        try {
            const response = await fetch(`${backendUrl}/api/invite/${inviteId}/resend`, {
                method: 'POST'
            });
            
            if (response.ok) {
                setMessage('✅ Invitation resent!');
                loadInvites();
            } else {
                setMessage('❌ Failed to resend invite');
            }
        } catch (error) {
            setMessage('❌ Network error');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleCancel = async (inviteId) => {
        if (!window.confirm('Are you sure you want to cancel this invitation?')) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/invite/${inviteId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setMessage('✅ Invitation cancelled');
                loadInvites();
            } else {
                setMessage('❌ Failed to cancel invite');
            }
        } catch (error) {
            setMessage('❌ Network error');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const getStatusBadge = (status) => {
        const styles = {
            sent: 'bg-blue-100 text-blue-800',
            viewed: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-green-100 text-green-800',
            declined: 'bg-red-100 text-red-800',
            expired: 'bg-gray-100 text-gray-800',
            failed: 'bg-red-100 text-red-800'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const positionOptions = [
        'Attack', 'Midfield', 'Defense', 'Goalie', 'FOGO', 'LSM', 'Any Position'
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Recruiting</h2>
                    <p className="text-slate-600">Invite new players to join {team.name}</p>
                </div>
                <button
                    onClick={() => setShowInviteForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <span className="text-lg">+</span> Send Invitation
                </button>
            </div>

            {/* Message Banner */}
            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Invite Form Modal */}
            {showInviteForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Send Recruitment Invitation</h3>
                                <button
                                    onClick={() => setShowInviteForm(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSendInvite} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Recruit's Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="John Smith"
                                        required
                                    />
                                </div>

                                {/* Send Method */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Send via
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="method"
                                                value="email"
                                                checked={formData.method === 'email'}
                                                onChange={() => setFormData({...formData, method: 'email'})}
                                                className="mr-2"
                                            />
                                            📧 Email
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="method"
                                                value="sms"
                                                checked={formData.method === 'sms'}
                                                onChange={() => setFormData({...formData, method: 'sms'})}
                                                className="mr-2"
                                            />
                                            📱 Text Message
                                        </label>
                                    </div>
                                </div>

                                {/* Email */}
                                {formData.method === 'email' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="recruit@email.com"
                                        />
                                    </div>
                                )}

                                {/* Phone */}
                                {formData.method === 'sms' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                )}

                                {/* Position */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Position Needed
                                    </label>
                                    <select
                                        value={formData.position}
                                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select position...</option>
                                        {positionOptions.map(pos => (
                                            <option key={pos} value={pos}>{pos}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Personal Message */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Personal Message
                                    </label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="We'd love to have you on our team! We practice on Tuesdays and Thursdays..."
                                    />
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowInviteForm(false)}
                                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                                    >
                                        {sending ? 'Sending...' : 'Send Invitation'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Invites Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                        {invites.filter(i => i.status === 'sent').length}
                    </div>
                    <div className="text-sm text-blue-800">Sent</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                        {invites.filter(i => i.status === 'viewed').length}
                    </div>
                    <div className="text-sm text-yellow-800">Viewed</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {invites.filter(i => i.status === 'accepted').length}
                    </div>
                    <div className="text-sm text-green-800">Accepted</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-slate-600">
                        {invites.length}
                    </div>
                    <div className="text-sm text-slate-800">Total</div>
                </div>
            </div>

            {/* Invites List */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b">
                    <h3 className="font-semibold text-slate-800">Sent Invitations</h3>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : invites.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">📨</div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No invitations yet</h3>
                        <p className="text-slate-600">Start recruiting by sending your first invitation!</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {invites.map(invite => (
                            <div key={invite.id} className="p-4 hover:bg-slate-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-800">{invite.name}</span>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(invite.status)}`}>
                                                {invite.status}
                                            </span>
                                            {invite.method === 'sms' && <span className="text-sm">📱</span>}
                                            {invite.method === 'email' && <span className="text-sm">📧</span>}
                                        </div>
                                        <div className="text-sm text-slate-600 mt-1">
                                            {invite.email || invite.phone}
                                            {invite.position && <span className="ml-2 text-slate-500">• {invite.position}</span>}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Sent {new Date(invite.sentAt).toLocaleDateString()} by {invite.sentByName}
                                            {invite.viewedAt && (
                                                <span className="ml-2">• Viewed {new Date(invite.viewedAt).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Actions */}
                                    {(invite.status === 'sent' || invite.status === 'viewed') && (
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleResend(invite.id)}
                                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                            >
                                                Resend
                                            </button>
                                            <button
                                                onClick={() => handleCancel(invite.id)}
                                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetailPage;