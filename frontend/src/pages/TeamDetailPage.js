import React, { useState, useEffect, useRef } from 'react';
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
import { PlayerFeeDashboard } from '../components/fees';

const TeamDetailPage = ({ team, teams, events, players, currentUser, onNavigate, onUserUpdate }) => {
    const [activeTab, setActiveTab] = useState(() => {
        // Check if user has a default tab for this team
        if (currentUser?.defaultLandingPage?.type === 'team' && 
            currentUser?.defaultLandingPage?.teamId === team?.id &&
            currentUser?.defaultLandingPage?.tabId) {
            return currentUser.defaultLandingPage.tabId;
        }
        return 'home';
    });
    const [settingDefault, setSettingDefault] = useState(false);
    const [defaultPageMessage, setDefaultPageMessage] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Check if current tab is the user's default landing page
    const isDefaultPage = currentUser?.defaultLandingPage?.type === 'team' && 
                          currentUser?.defaultLandingPage?.teamId === team?.id &&
                          currentUser?.defaultLandingPage?.tabId === activeTab;

    // Set this tab as the default landing page
    const handleSetDefaultPage = async (tabId) => {
        if (!currentUser) {
            alert('Please log in to set your default landing page');
            return;
        }

        setSettingDefault(true);
        try {
            const landingPage = {
                type: 'team',
                teamId: team.id,
                teamName: team.name,
                tabId: tabId
            };

            const response = await fetch(`${backendUrl}/api/users/${currentUser.id}/default-landing-page`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(landingPage)
            });

            if (response.ok) {
                const data = await response.json();
                setDefaultPageMessage('⭐ Set as your default landing page!');
                // Update the current user in parent component
                if (onUserUpdate && data.user) {
                    onUserUpdate(data.user);
                }
            } else {
                setDefaultPageMessage('❌ Failed to set default page');
            }
        } catch (error) {
            console.error('Error setting default page:', error);
            setDefaultPageMessage('❌ Error saving preference');
        } finally {
            setSettingDefault(false);
            setTimeout(() => setDefaultPageMessage(''), 3000);
        }
    };

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

    // Check if user is a player or coach for this team
    const isPlayerOrCoach = currentUser && (
        (currentUser.roles?.includes('player') || currentUser.roles?.includes('coach') || 
         currentUser.role === 'player' || currentUser.role === 'coach') &&
        (currentUser.teamAssignments?.some(ta => ta.teamId === team?.id) || currentUser.teamId === team?.id)
    );

    const tabs = [
        { id: 'home', label: 'Home', icon: 'venue' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'roster', label: 'Roster', icon: 'teams' },
        { id: 'stats', label: 'Stats', icon: 'trophy' },
        { id: 'chat', label: 'Team Chat', icon: 'email' },
        { id: 'media', label: 'Photos & Vids', icon: 'view' },
        { id: 'contact', label: 'Contact', icon: 'email' },
        // Player/Coach personal dashboard tab
        ...(isPlayerOrCoach ? [
            { id: 'my-dashboard', label: 'My Dashboard', icon: 'admin', playerOnly: true }
        ] : []),
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
                {/* Default page message */}
                {defaultPageMessage && (
                    <div className="bg-yellow-50 text-yellow-800 text-sm px-4 py-2 text-center">
                        {defaultPageMessage}
                    </div>
                )}
                <div className="flex overflow-x-auto">
                    {tabs.map(tab => {
                        const isThisTabDefault = currentUser?.defaultLandingPage?.type === 'team' && 
                                                  currentUser?.defaultLandingPage?.teamId === team?.id &&
                                                  currentUser?.defaultLandingPage?.tabId === tab.id;
                        return (
                            <div key={tab.id} className="relative group">
                                <button
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
                                    {isThisTabDefault && (
                                        <span className="ml-1 text-yellow-500" title="Your default landing page">⭐</span>
                                    )}
                                </button>
                                {/* Star button - visible on hover or when active */}
                                {currentUser && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetDefaultPage(tab.id);
                                        }}
                                        disabled={settingDefault}
                                        className={`absolute top-1 right-1 p-1 rounded-full transition-all ${
                                            isThisTabDefault 
                                                ? 'text-yellow-500 bg-yellow-50' 
                                                : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50 opacity-0 group-hover:opacity-100'
                                        }`}
                                        title={isThisTabDefault ? 'This is your default page' : 'Set as default landing page'}
                                    >
                                        {settingDefault ? (
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill={isThisTabDefault ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-6 overflow-x-hidden">
                {activeTab === 'home' && <TeamHomeTab team={team} teams={teams} events={events} onNavigate={onNavigate} />}
                {activeTab === 'schedule' && <TeamScheduleTab team={team} events={events} />}
                {activeTab === 'roster' && <TeamRosterTab team={team} players={players} currentUser={currentUser} />}
                {activeTab === 'stats' && <TeamStatsTab team={team} events={events} />}
                {activeTab === 'chat' && <TeamChatTab team={team} />}
                {activeTab === 'media' && <TeamMediaTab team={team} />}
                {activeTab === 'contact' && <TeamContactTab team={team} />}
                {activeTab === 'my-dashboard' && <MyDashboardTab team={team} currentUser={currentUser} />}
                {activeTab === 'manage-roster' && <TeamRosterManageTab team={team} currentUser={currentUser} />}
                {activeTab === 'recruiting' && <TeamRecruitingTab team={team} currentUser={currentUser} />}
                {activeTab === 'team-fees' && <TeamFeesTab team={team} currentUser={currentUser} />}
                {activeTab === 'settings' && <TeamSettingsTab team={team} />}
            </div>
        </div>
    );
};

// My Dashboard Tab - Player/Coach personal dashboard
const MyDashboardTab = ({ team, currentUser }) => {
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        loadDashboardData();
    }, [team?.id]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team?.id}/events`);
            if (response.ok) {
                const events = await response.json();
                const now = new Date();
                const upcoming = (events || [])
                    .filter(e => new Date(e.date) >= now && e.status !== 'canceled')
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(0, 5);
                setUpcomingEvents(upcoming);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const userRoles = currentUser?.roles || [currentUser?.role];
    const teamAssignment = currentUser?.teamAssignments?.find(ta => ta.teamId === team?.id);

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Welcome, {currentUser?.name}!</h2>
                <p className="text-blue-100">
                    {userRoles.includes('coach') ? '🏆 Team Coach' : '🥍 Player'} • {team?.name}
                    {teamAssignment?.playerNumber && ` • #${teamAssignment.playerNumber}`}
                    {teamAssignment?.position && ` • ${teamAssignment.position}`}
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="text-2xl font-bold text-blue-600">{upcomingEvents.length}</div>
                    <div className="text-sm text-slate-600">Upcoming Events</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="text-2xl font-bold text-green-600">{team?.record || '0-0'}</div>
                    <div className="text-sm text-slate-600">Team Record</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="text-2xl font-bold text-purple-600">{teamAssignment?.jerseyNumber || '—'}</div>
                    <div className="text-sm text-slate-600">Jersey #</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="text-2xl font-bold text-orange-600">{teamAssignment?.position || '—'}</div>
                    <div className="text-sm text-slate-600">Position</div>
                </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-4 py-3 border-b bg-slate-50">
                    <h3 className="font-semibold text-slate-800">📅 Your Upcoming Events</h3>
                </div>
                <div className="p-4">
                    {upcomingEvents.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingEvents.map((event, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-slate-800">{event.title}</div>
                                        <div className="text-sm text-slate-600">
                                            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            {event.time && ` at ${event.time}`}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        event.eventType === 'game' ? 'bg-red-100 text-red-800' :
                                        event.eventType === 'practice' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {event.eventType || 'Event'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-4">No upcoming events scheduled</p>
                    )}
                </div>
            </div>

            {/* Fees Section */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-4 py-3 border-b bg-slate-50">
                    <h3 className="font-semibold text-slate-800">💰 My Fees & Payments</h3>
                </div>
                <div className="p-4">
                    <PlayerFeeDashboard teamId={team?.id} currentUser={currentUser} />
                </div>
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
        // Filter to team's events
        (event.teamIds?.includes(team.id) || 
        event.homeTeam === team.id || 
        event.awayTeam === team.id) &&
        // Exclude canceled/cancelled events
        event.status !== 'canceled' &&
        event.status !== 'cancelled' &&
        event.status !== 'archived'
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
const TeamRosterTab = ({ team, players = [], currentUser }) => {
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [teamPlayers, setTeamPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const cardRef = useRef(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Check if current user is a team admin or league admin
    const isTeamAdmin = currentUser && (
        currentUser.roles?.includes('admin') ||
        currentUser.roles?.includes('league_admin') ||
        (currentUser.roles?.includes('coach') && (
            currentUser.teamId === team.id ||
            currentUser.teamAssignments?.some(a => a.teamId === team.id)
        ))
    );
    
    // Fetch players directly from API to ensure we get multi-team players
    const fetchTeamPlayers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/players`);
            if (response.ok) {
                const data = await response.json();
                setTeamPlayers(data || []);
            } else {
                // Fallback to prop-based filtering
                const filtered = players.filter(player => 
                    player.teamId === team.id || 
                    player.teamAssignments?.some(ta => ta.teamId === team.id)
                );
                setTeamPlayers(filtered);
            }
        } catch (error) {
            console.error('Error fetching team players:', error);
            // Fallback to prop-based filtering
            const filtered = players.filter(player => 
                player.teamId === team.id || 
                player.teamAssignments?.some(ta => ta.teamId === team.id)
            );
            setTeamPlayers(filtered);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchTeamPlayers();
    }, [team.id, backendUrl, players]);
    
    // Fetch available users when add modal opens
    const fetchAvailableUsers = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/users?status=active`);
            if (response.ok) {
                const data = await response.json();
                // Filter out users already on this team
                const teamPlayerIds = teamPlayers.map(p => p.id);
                const available = (data.users || data || []).filter(u => 
                    !teamPlayerIds.includes(u.id) &&
                    (u.roles?.includes('player') || u.role === 'player' || !u.roles?.length)
                );
                setAvailableUsers(available);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };
    
    // Handle adding a player to the team
    const handleAddPlayer = async (userId) => {
        setActionLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/add-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            
            if (response.ok) {
                setMessage('✅ Player added to team!');
                setShowAddModal(false);
                fetchTeamPlayers();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to add player'}`);
            }
        } catch (error) {
            setMessage('❌ Error adding player');
        } finally {
            setActionLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };
    
    // Handle removing a player from the team
    const handleRemovePlayer = async (playerId, e) => {
        e.stopPropagation();
        if (!window.confirm('Remove this player from the team roster?')) return;
        
        setActionLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/remove-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: playerId })
            });
            
            if (response.ok) {
                setMessage('✅ Player removed from team');
                fetchTeamPlayers();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to remove player'}`);
            }
        } catch (error) {
            setMessage('❌ Error removing player');
        } finally {
            setActionLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };
    
    // Handle editing player details
    const handleEditPlayer = async (e) => {
        e.preventDefault();
        if (!editingPlayer) return;
        
        setActionLoading(true);
        try {
            // Update the player's team assignment
            const response = await fetch(`${backendUrl}/api/team/${team.id}/update-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editingPlayer.id,
                    playerNumber: editingPlayer.jerseyNumber,
                    position: editingPlayer.position
                })
            });
            
            if (response.ok) {
                setMessage('✅ Player updated!');
                setShowEditModal(false);
                setEditingPlayer(null);
                fetchTeamPlayers();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to update player'}`);
            }
        } catch (error) {
            setMessage('❌ Error updating player');
        } finally {
            setActionLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };
    
    const openEditModal = (player, e) => {
        e.stopPropagation();
        setEditingPlayer({
            id: player.id,
            name: player.name,
            jerseyNumber: player.jerseyNumber || '',
            position: player.position || ''
        });
        setShowEditModal(true);
    };

    const openPlayerCard = (player) => {
        setSelectedPlayer(player);
        setIsFlipped(false);
    };

    const closePlayerCard = () => {
        setSelectedPlayer(null);
        setIsFlipped(false);
    };

    const toggleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    // Print the player card
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const teamColor = team?.style?.primaryColor || '#2563eb';
        
        printWindow.document.write(`
            <html>
            <head>
                <title>${selectedPlayer.name} - Player Card</title>
                <style>
                    @page { size: 3.5in 5in; margin: 0; }
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                    .card { width: 3in; border: 2px solid ${teamColor}; border-radius: 12px; overflow: hidden; }
                    .header { background: ${teamColor}; color: white; padding: 8px; text-align: center; }
                    .photo { height: 180px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; }
                    .photo img { max-width: 100%; max-height: 100%; object-fit: cover; }
                    .info { padding: 12px; text-align: center; }
                    .name { font-size: 18px; font-weight: bold; color: ${teamColor}; margin-bottom: 4px; }
                    .position { background: ${teamColor}; color: white; padding: 4px 12px; border-radius: 12px; display: inline-block; font-size: 12px; }
                    .number { font-size: 24px; font-weight: bold; color: ${teamColor}; }
                    .section { margin-top: 8px; font-size: 11px; text-align: left; padding: 0 8px; }
                    .section-title { font-weight: bold; color: #666; margin-bottom: 2px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">${team?.name || 'Team'}</div>
                    <div class="photo">
                        ${selectedPlayer.photoUrl ? `<img src="${selectedPlayer.photoUrl}" />` : '<span style="font-size:48px;color:#ccc">👤</span>'}
                    </div>
                    <div class="info">
                        <div class="number">#${selectedPlayer.jerseyNumber || '?'}</div>
                        <div class="name">${selectedPlayer.name}</div>
                        <div class="position">${selectedPlayer.position || 'Player'}</div>
                    </div>
                    ${selectedPlayer.lacrosseHistory?.highSchool?.teamName ? `
                        <div class="section">
                            <div class="section-title">🏫 High School</div>
                            <div>${selectedPlayer.lacrosseHistory.highSchool.teamName}</div>
                        </div>
                    ` : ''}
                    ${selectedPlayer.lacrosseHistory?.college?.teamName ? `
                        <div class="section">
                            <div class="section-title">🎓 College</div>
                            <div>${selectedPlayer.lacrosseHistory.college.teamName}</div>
                        </div>
                    ` : ''}
                    ${selectedPlayer.funFacts ? `
                        <div class="section">
                            <div class="section-title">✨ Fun Facts</div>
                            <div>${selectedPlayer.funFacts}</div>
                        </div>
                    ` : ''}
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Download as PDF - now accepts optional statsByYear parameter
    const handleDownloadPDF = async (playerStatsByYear = {}) => {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: [3.5, 5] });
        const teamColor = team?.style?.primaryColor || '#2563eb';
        const accentColor = team?.style?.accentColor || '#3b82f6';
        
        // If no statsByYear passed, try to fetch it
        let statsByYear = playerStatsByYear;
        if (Object.keys(statsByYear).length === 0 && selectedPlayer?.id) {
            try {
                const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/players/${selectedPlayer.id}/stats-by-year`);
                if (response.ok) {
                    const data = await response.json();
                    statsByYear = data.statsByYear || {};
                }
            } catch (e) {
                console.error('Error fetching stats for PDF:', e);
            }
        }
        
        // Convert hex to RGB
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 37, g: 99, b: 235 };
        };
        const teamRgb = hexToRgb(teamColor);
        const accentRgb = hexToRgb(accentColor);
        
        // ============ PAGE 1: FRONT OF CARD ============
        // Card border
        pdf.setDrawColor(teamRgb.r, teamRgb.g, teamRgb.b);
        pdf.setLineWidth(0.03);
        pdf.roundedRect(0.1, 0.1, 3.3, 4.8, 0.15, 0.15, 'S');
        
        // Header bar
        pdf.setFillColor(teamRgb.r, teamRgb.g, teamRgb.b);
        pdf.rect(0.1, 0.1, 3.3, 0.5, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(team?.name || 'Team', 1.75, 0.4, { align: 'center' });
        
        // Player photo placeholder area
        pdf.setFillColor(240, 240, 240);
        pdf.roundedRect(0.5, 0.8, 2.5, 2.2, 0.1, 0.1, 'F');
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(10);
        pdf.text('[ Player Photo ]', 1.75, 1.9, { align: 'center' });
        
        // Jersey number circle
        pdf.setFillColor(teamRgb.r, teamRgb.g, teamRgb.b);
        pdf.circle(2.7, 2.7, 0.35, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${selectedPlayer.jerseyNumber || '?'}`, 2.7, 2.78, { align: 'center' });
        
        // Player name
        pdf.setTextColor(teamRgb.r, teamRgb.g, teamRgb.b);
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        pdf.text(selectedPlayer.name || 'Player', 1.75, 3.3, { align: 'center' });
        
        // Position badge
        pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        pdf.roundedRect(1.15, 3.45, 1.2, 0.3, 0.1, 0.1, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(selectedPlayer.position || 'Player', 1.75, 3.65, { align: 'center' });
        
        // Footer bar
        pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        pdf.rect(0.1, 4.75, 3.3, 0.15, 'F');
        
        // ============ PAGE 2: BACK OF CARD ============
        pdf.addPage([3.5, 5], 'portrait');
        
        // Card border
        pdf.setDrawColor(teamRgb.r, teamRgb.g, teamRgb.b);
        pdf.setLineWidth(0.03);
        pdf.roundedRect(0.1, 0.1, 3.3, 4.8, 0.15, 0.15, 'S');
        
        // Header bar
        pdf.setFillColor(teamRgb.r, teamRgb.g, teamRgb.b);
        pdf.rect(0.1, 0.1, 3.3, 0.4, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Player Bio', 1.75, 0.35, { align: 'center' });
        
        // Mini name header
        pdf.setTextColor(teamRgb.r, teamRgb.g, teamRgb.b);
        pdf.setFontSize(11);
        pdf.text(`${selectedPlayer.name} • #${selectedPlayer.jerseyNumber || '?'}`, 1.75, 0.75, { align: 'center' });
        
        let yPos = 1.0;
        
        // Stats section (if available)
        const hasStats = (selectedPlayer.goals > 0 || selectedPlayer.assists > 0);
        if (hasStats) {
            pdf.setFillColor(teamRgb.r, teamRgb.g, teamRgb.b, 0.1);
            pdf.roundedRect(0.2, yPos - 0.05, 3.1, 0.7, 0.05, 0.05, 'F');
            
            pdf.setTextColor(80, 80, 80);
            pdf.setFontSize(8);
            pdf.setFont(undefined, 'bold');
            pdf.text('SEASON STATS', 0.3, yPos + 0.1);
            
            // Stats boxes
            const statsY = yPos + 0.25;
            const boxWidth = 0.9;
            const boxGap = 0.15;
            const startX = 0.35;
            
            // Goals
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(startX, statsY, boxWidth, 0.35, 0.03, 0.03, 'F');
            pdf.setTextColor(teamRgb.r, teamRgb.g, teamRgb.b);
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.text(`${selectedPlayer.goals || 0}`, startX + boxWidth/2, statsY + 0.18, { align: 'center' });
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(6);
            pdf.text('Goals', startX + boxWidth/2, statsY + 0.3, { align: 'center' });
            
            // Assists
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(startX + boxWidth + boxGap, statsY, boxWidth, 0.35, 0.03, 0.03, 'F');
            pdf.setTextColor(teamRgb.r, teamRgb.g, teamRgb.b);
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.text(`${selectedPlayer.assists || 0}`, startX + boxWidth + boxGap + boxWidth/2, statsY + 0.18, { align: 'center' });
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(6);
            pdf.text('Assists', startX + boxWidth + boxGap + boxWidth/2, statsY + 0.3, { align: 'center' });
            
            // Points
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(startX + 2*(boxWidth + boxGap), statsY, boxWidth, 0.35, 0.03, 0.03, 'F');
            pdf.setTextColor(teamRgb.r, teamRgb.g, teamRgb.b);
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.text(`${(selectedPlayer.goals || 0) + (selectedPlayer.assists || 0)}`, startX + 2*(boxWidth + boxGap) + boxWidth/2, statsY + 0.18, { align: 'center' });
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(6);
            pdf.text('Points', startX + 2*(boxWidth + boxGap) + boxWidth/2, statsY + 0.3, { align: 'center' });
            
            yPos += 0.8;
        }
        
        // Stats by Year (if available)
        if (statsByYear && Object.keys(statsByYear).length > 0) {
            pdf.setTextColor(80, 80, 80);
            pdf.setFontSize(8);
            pdf.setFont(undefined, 'bold');
            pdf.text('CAREER STATS BY YEAR', 0.3, yPos + 0.1);
            yPos += 0.25;
            
            const years = Object.keys(statsByYear).sort().reverse();
            for (const year of years.slice(0, 4)) { // Show max 4 years
                const yearStats = statsByYear[year];
                pdf.setTextColor(teamRgb.r, teamRgb.g, teamRgb.b);
                pdf.setFontSize(9);
                pdf.setFont(undefined, 'bold');
                pdf.text(year, 0.3, yPos);
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(80, 80, 80);
                pdf.text(`${yearStats.goals || 0}G  ${yearStats.assists || 0}A  ${yearStats.gamesPlayed || 0}GP`, 0.7, yPos);
                yPos += 0.2;
            }
            yPos += 0.1;
        }
        
        // Bio info
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        
        if (selectedPlayer.lacrosseHistory?.highSchool?.teamName) {
            pdf.setTextColor(teamRgb.r, teamRgb.g, teamRgb.b);
            pdf.setFont(undefined, 'bold');
            pdf.text('High School', 0.3, yPos);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(80, 80, 80);
            const hsText = `${selectedPlayer.lacrosseHistory.highSchool.teamName}${selectedPlayer.lacrosseHistory.highSchool.graduationYear ? ` '${selectedPlayer.lacrosseHistory.highSchool.graduationYear.toString().slice(-2)}` : ''}`;
            pdf.text(hsText, 0.3, yPos + 0.15);
            yPos += 0.4;
        }
        
        if (selectedPlayer.lacrosseHistory?.college?.teamName) {
            pdf.setTextColor(teamRgb.r, teamRgb.g, teamRgb.b);
            pdf.setFont(undefined, 'bold');
            pdf.text('College', 0.3, yPos);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(80, 80, 80);
            const collegeText = `${selectedPlayer.lacrosseHistory.college.teamName}${selectedPlayer.lacrosseHistory.college.graduationYear ? ` '${selectedPlayer.lacrosseHistory.college.graduationYear.toString().slice(-2)}` : ''}`;
            pdf.text(collegeText, 0.3, yPos + 0.15);
            yPos += 0.4;
        }
        
        if (selectedPlayer.lacrosseHistory?.postGrad?.length > 0) {
            pdf.setTextColor(teamRgb.r, teamRgb.g, teamRgb.b);
            pdf.setFont(undefined, 'bold');
            pdf.text('Post-Grad', 0.3, yPos);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(80, 80, 80);
            yPos += 0.15;
            for (const t of selectedPlayer.lacrosseHistory.postGrad.slice(0, 2)) {
                pdf.text(`${t.teamName}${t.years ? ` (${t.years})` : ''}`, 0.3, yPos);
                yPos += 0.15;
            }
            yPos += 0.1;
        }
        
        if (selectedPlayer.funFacts && yPos < 4.2) {
            pdf.setTextColor(teamRgb.r, teamRgb.g, teamRgb.b);
            pdf.setFont(undefined, 'bold');
            pdf.text('Fun Facts', 0.3, yPos);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(80, 80, 80);
            const funFacts = selectedPlayer.funFacts.substring(0, 100) + (selectedPlayer.funFacts.length > 100 ? '...' : '');
            const lines = pdf.splitTextToSize(funFacts, 2.9);
            pdf.text(lines.slice(0, 3), 0.3, yPos + 0.15);
        }
        
        // Footer bar
        pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        pdf.rect(0.1, 4.75, 3.3, 0.15, 'F');
        
        pdf.save(`${selectedPlayer.name?.replace(/\s+/g, '_')}_card.pdf`);
    };

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

    // Player Card Popup Modal with Flip Animation
    const PlayerCardPopup = ({ player, team, isFlipped, onFlip, onClose, onPrint, onDownload }) => {
        const [statsByYear, setStatsByYear] = useState({});
        const [loadingStats, setLoadingStats] = useState(false);
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        
        // Fetch stats by year when card opens
        useEffect(() => {
            if (player?.id) {
                const fetchStats = async () => {
                    setLoadingStats(true);
                    try {
                        const response = await fetch(`${backendUrl}/api/players/${player.id}/stats-by-year`);
                        if (response.ok) {
                            const data = await response.json();
                            setStatsByYear(data.statsByYear || {});
                        }
                    } catch (error) {
                        console.error('Error fetching player stats:', error);
                    } finally {
                        setLoadingStats(false);
                    }
                };
                fetchStats();
            }
        }, [player?.id, backendUrl]);
        
        if (!player) return null;

        const teamColor = team?.style?.primaryColor || '#2563eb';
        const accentColor = team?.style?.accentColor || '#3b82f6';

        return (
            <div 
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="relative max-w-sm w-full">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute -top-3 -right-3 z-20 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                    >
                        <span className="text-gray-600 text-xl">✕</span>
                    </button>

                    {/* Card Container with 3D Flip */}
                    <div 
                        className="relative w-full cursor-pointer"
                        style={{ 
                            perspective: '1500px',
                            height: '580px'
                        }}
                        onClick={onFlip}
                    >
                        <div 
                            className="relative w-full h-full"
                            style={{ 
                                transformStyle: 'preserve-3d',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                transition: 'transform 0.8s ease-in-out'
                            }}
                        >
                            {/* FRONT OF CARD */}
                            <div 
                                className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl"
                                style={{ 
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    border: `3px solid ${teamColor}`,
                                    background: `linear-gradient(135deg, white 0%, ${team?.style?.backgroundColor || '#f8fafc'} 100%)`
                                }}
                            >
                                {/* Header with Team Name */}
                                <div 
                                    className="h-10 w-full flex items-center justify-center"
                                    style={{ background: `linear-gradient(90deg, ${teamColor} 0%, ${accentColor} 100%)` }}
                                >
                                    <span className="text-white font-bold text-sm tracking-wide">{team?.name || 'Team'}</span>
                                </div>
                                
                                {/* Player Photo */}
                                <div className="relative h-72 bg-gradient-to-br from-slate-100 to-slate-200">
                                    {player.photoUrl ? (
                                        <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${team?.style?.backgroundColor || '#f8fafc'} 0%, ${teamColor}15 100%)` }}>
                                            <svg className="w-24 h-24 opacity-30" fill="currentColor" viewBox="0 0 24 24" style={{ color: teamColor }}>
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                            </svg>
                                        </div>
                                    )}
                                    
                                    {/* Team Logo */}
                                    <div className="absolute top-3 left-3">
                                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                                            {team?.style?.logoUrl ? (
                                                <img src={fixGoogleDriveUrl(team.style.logoUrl)} alt={team.name} className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: teamColor }}>
                                                    <span className="text-white font-bold">{team?.name?.charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Jersey Number */}
                                    <div className="absolute bottom-3 right-3">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-white shadow-lg" style={{ backgroundColor: teamColor }}>
                                            {player.jerseyNumber || '?'}
                                        </div>
                                    </div>
                                    
                                    {/* Position Badge */}
                                    <div className="absolute top-3 right-3">
                                        <div className="px-3 py-1 bg-white/90 rounded-full text-sm font-bold shadow-sm" style={{ color: teamColor }}>
                                            {player.position || 'Player'}
                                        </div>
                                    </div>
                                </div>

                                {/* Player Info */}
                                <div className="p-4 bg-white text-center">
                                    <h2 className="font-bold text-xl mb-2" style={{ color: teamColor }}>
                                        {player.name}
                                    </h2>
                                    <div className="inline-block px-4 py-1 rounded-full text-white text-sm font-medium" style={{ backgroundColor: accentColor }}>
                                        {player.position || 'Player'}
                                    </div>
                                    <p className="text-slate-400 text-sm mt-3">
                                        Tap card to flip →
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="h-3 w-full" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, ${teamColor} 100%)` }}></div>
                            </div>

                            {/* BACK OF CARD */}
                            <div 
                                className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl"
                                style={{ 
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    border: `3px solid ${teamColor}`,
                                    background: `linear-gradient(135deg, ${teamColor}08 0%, #f8fafc 50%, ${accentColor}08 100%)`
                                }}
                            >
                                {/* Header */}
                                <div className="h-10 w-full flex items-center justify-center" style={{ background: `linear-gradient(90deg, ${teamColor} 0%, ${accentColor} 100%)` }}>
                                    <span className="text-white font-bold text-sm tracking-wide">Player Bio & Stats</span>
                                </div>
                                
                                <div className="p-4 h-[calc(100%-52px)] overflow-y-auto">
                                    {/* Header with mini photo */}
                                    <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: teamColor }}>
                                            {player.photoUrl ? (
                                                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 text-lg font-bold">
                                                    {player.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg" style={{ color: teamColor }}>{player.name}</h3>
                                            <p className="text-sm text-slate-500">#{player.jerseyNumber || '?'} • {player.position || 'Player'}</p>
                                        </div>
                                    </div>

                                    {/* Current Season Stats */}
                                    {(player.goals > 0 || player.assists > 0) && (
                                        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${teamColor}08` }}>
                                            <div className="text-xs font-semibold text-slate-600 uppercase mb-2">📊 Current Season</div>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-white rounded p-2 shadow-sm">
                                                    <div className="text-xl font-bold" style={{ color: teamColor }}>{player.goals || 0}</div>
                                                    <div className="text-xs text-slate-500">Goals</div>
                                                </div>
                                                <div className="bg-white rounded p-2 shadow-sm">
                                                    <div className="text-xl font-bold" style={{ color: teamColor }}>{player.assists || 0}</div>
                                                    <div className="text-xs text-slate-500">Assists</div>
                                                </div>
                                                <div className="bg-white rounded p-2 shadow-sm">
                                                    <div className="text-xl font-bold" style={{ color: teamColor }}>{(player.goals || 0) + (player.assists || 0)}</div>
                                                    <div className="text-xs text-slate-500">Points</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Stats By Year */}
                                    {Object.keys(statsByYear).length > 0 && (
                                        <div className="mb-4 p-3 rounded-lg border border-slate-200">
                                            <div className="text-xs font-semibold text-slate-600 uppercase mb-2">📅 Career Stats by Year</div>
                                            {loadingStats ? (
                                                <div className="text-center text-slate-400 py-2">Loading...</div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {Object.keys(statsByYear).sort().reverse().slice(0, 5).map(year => {
                                                        const yearStats = statsByYear[year];
                                                        return (
                                                            <div key={year} className="flex items-center justify-between bg-white rounded p-2 shadow-sm">
                                                                <span className="font-bold text-sm" style={{ color: teamColor }}>{year}</span>
                                                                <div className="flex gap-3 text-xs text-slate-600">
                                                                    <span><strong>{yearStats.goals || 0}</strong> G</span>
                                                                    <span><strong>{yearStats.assists || 0}</strong> A</span>
                                                                    <span><strong>{yearStats.gamesPlayed || 0}</strong> GP</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Bio Info */}
                                    <div className="space-y-3 text-sm">
                                        {player.lacrosseHistory?.highSchool?.teamName && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">🏫</span>
                                                <div>
                                                    <div className="font-semibold text-slate-700">High School</div>
                                                    <div className="text-slate-600">{player.lacrosseHistory.highSchool.teamName} {player.lacrosseHistory.highSchool.graduationYear && `'${player.lacrosseHistory.highSchool.graduationYear.toString().slice(-2)}`}</div>
                                                </div>
                                            </div>
                                        )}
                                        {player.lacrosseHistory?.college?.teamName && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">🎓</span>
                                                <div>
                                                    <div className="font-semibold text-slate-700">College</div>
                                                    <div className="text-slate-600">{player.lacrosseHistory.college.teamName} {player.lacrosseHistory.college.graduationYear && `'${player.lacrosseHistory.college.graduationYear.toString().slice(-2)}`}</div>
                                                </div>
                                            </div>
                                        )}
                                        {player.lacrosseHistory?.postGrad?.length > 0 && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">🏆</span>
                                                <div>
                                                    <div className="font-semibold text-slate-700">Post-Grad</div>
                                                    {player.lacrosseHistory.postGrad.map((t, i) => (
                                                        <div key={i} className="text-slate-600">{t.teamName} {t.years && `(${t.years})`}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {player.funFacts && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">✨</span>
                                                <div>
                                                    <div className="font-semibold text-slate-700">Fun Facts</div>
                                                    <div className="text-slate-600">{player.funFacts}</div>
                                                </div>
                                            </div>
                                        )}
                                        {player.socialMedia && Object.values(player.socialMedia).some(v => v) && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">📱</span>
                                                <div>
                                                    <div className="font-semibold text-slate-700 mb-1">Social</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {player.socialMedia.instagram && <a href={`https://instagram.com/${player.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200" onClick={e => e.stopPropagation()}>📸 @{player.socialMedia.instagram}</a>}
                                                        {player.socialMedia.twitter && <a href={`https://twitter.com/${player.socialMedia.twitter}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-blue-100 text-blue-500 rounded-full hover:bg-blue-200" onClick={e => e.stopPropagation()}>🐦 @{player.socialMedia.twitter}</a>}
                                                        {player.socialMedia.tiktok && <a href={`https://tiktok.com/@${player.socialMedia.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200" onClick={e => e.stopPropagation()}>🎵 @{player.socialMedia.tiktok}</a>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Empty state */}
                                        {!player.lacrosseHistory?.highSchool?.teamName && 
                                         !player.lacrosseHistory?.college?.teamName && 
                                         !player.funFacts &&
                                         !(player.goals > 0 || player.assists > 0) && (
                                            <div className="text-center text-slate-400 py-4">
                                                <p>No bio information yet</p>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-center text-slate-400 text-sm mt-3">
                                        ← Tap to flip back
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="h-3 w-full absolute bottom-0" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, ${teamColor} 100%)` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-3 mt-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); onPrint(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                        >
                            🖨️ Print
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDownload(statsByYear); }}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                        >
                            📥 Save PDF
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Message Toast */}
            {message && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                    message.startsWith('✅') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    {message}
                </div>
            )}
            
            <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Team Roster</h2>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-500">
                        {loading ? 'Loading...' : `${teamPlayers.length} player${teamPlayers.length !== 1 ? 's' : ''}`}
                    </div>
                    {isTeamAdmin && (
                        <button
                            onClick={() => {
                                fetchAvailableUsers();
                                setShowAddModal(true);
                            }}
                            data-testid="add-player-btn"
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Player
                        </button>
                    )}
                </div>
            </div>
            
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-slate-600">Loading roster...</span>
                </div>
            ) : teamPlayers.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {teamPlayers.map(player => (
                        <div 
                            key={player.id} 
                            className="relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
                            style={{ 
                                border: `2px solid ${team.style?.primaryColor || '#2563eb'}40`
                            }}
                            onClick={() => openPlayerCard(player)}
                        >
                            {/* Admin Action Buttons - Top Right Corner */}
                            {isTeamAdmin && (
                                <div className="absolute top-10 right-1 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => openEditModal(player, e)}
                                        data-testid={`edit-player-${player.id}`}
                                        className="p-1.5 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-colors"
                                        title="Edit player"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => handleRemovePlayer(player.id, e)}
                                        data-testid={`remove-player-${player.id}`}
                                        className="p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                                        title="Remove from team"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            
                            {/* Card Header */}
                            <div 
                                className="h-2 w-full"
                                style={{ background: `linear-gradient(90deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)` }}
                            />
                            
                            {/* Player Photo */}
                            <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200">
                                {player.photoUrl ? (
                                    <CachedImage 
                                        src={player.photoUrl} 
                                        alt={player.name}
                                        className="w-full h-full object-cover"
                                        fallback={
                                            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, ${team.style?.primaryColor || '#2563eb'}15 100%)` }}>
                                                <svg className="w-16 h-16 opacity-30" fill="currentColor" viewBox="0 0 24 24" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                </svg>
                                            </div>
                                        }
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, ${team.style?.primaryColor || '#2563eb'}15 100%)` }}>
                                        <svg className="w-16 h-16 opacity-30" fill="currentColor" viewBox="0 0 24 24" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                    </div>
                                )}
                                
                                {/* Team Logo */}
                                <div className="absolute top-2 left-2">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                                        {team.style?.logoUrl ? (
                                            <CachedImage src={fixGoogleDriveUrl(team.style.logoUrl)} alt={team.name} className="w-full h-full object-contain p-0.5" fallback={<span className="text-white font-bold text-xs">{team.name.charAt(0)}</span>} />
                                        ) : (
                                            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}>
                                                <span className="text-white font-bold text-xs">{team.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Jersey Number */}
                                <div className="absolute bottom-2 right-2">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-md" style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}>
                                        {player.jerseyNumber || '?'}
                                    </div>
                                </div>
                                
                                {/* Position Badge */}
                                <div className="absolute top-2 right-2">
                                    <div className="px-2 py-1 bg-white/90 rounded-full text-xs font-bold shadow-sm" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                        {player.position?.charAt(0) || 'P'}
                                    </div>
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                                        View Card
                                    </span>
                                </div>
                            </div>

                            {/* Player Info */}
                            <div className="p-3 bg-white text-center">
                                <h3 className="font-bold text-sm mb-1 truncate" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                    {player.name}
                                </h3>
                                <div className="text-xs font-medium px-2 py-0.5 rounded-full inline-block text-white" style={{ backgroundColor: team.style?.accentColor || '#3b82f6' }}>
                                    {player.position || 'Player'}
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${team.style?.accentColor || '#3b82f6'} 0%, ${team.style?.primaryColor || '#2563eb'} 100%)` }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 p-6 sm:p-8 rounded-lg text-center text-slate-500">
                    <LacrosseIcon name="teams" style={{fontSize: '48px'}} className="mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium mb-2">No players registered</h3>
                    <p className="text-sm mb-4">Start building your team by adding players to the roster</p>
                    {isTeamAdmin && (
                        <button 
                            onClick={() => {
                                fetchAvailableUsers();
                                setShowAddModal(true);
                            }}
                            data-testid="add-first-player-btn"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Add First Player
                        </button>
                    )}
                </div>
            )}

            {/* Player Detail Modal */}
            {selectedPlayer && (
                <PlayerCardPopup 
                    player={selectedPlayer} 
                    team={team}
                    isFlipped={isFlipped}
                    onFlip={toggleFlip}
                    onClose={closePlayerCard}
                    onPrint={handlePrint}
                    onDownload={handleDownloadPDF}
                />
            )}
            
            {/* Add Player Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Add Player to Team</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-testid="search-players-input"
                            />
                            
                            <div className="max-h-[50vh] overflow-y-auto space-y-2">
                                {availableUsers
                                    .filter(u => 
                                        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map(user => (
                                        <div 
                                            key={user.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {user.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800">{user.name}</div>
                                                    <div className="text-sm text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAddPlayer(user.id)}
                                                disabled={actionLoading}
                                                data-testid={`add-user-${user.id}`}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {actionLoading ? '...' : 'Add'}
                                            </button>
                                        </div>
                                    ))
                                }
                                
                                {availableUsers.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        <p>No available users to add.</p>
                                        <p className="text-sm mt-1">Create new users in the Admin Portal first.</p>
                                    </div>
                                )}
                                
                                {availableUsers.length > 0 && availableUsers.filter(u => 
                                    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        No users match your search.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Edit Player Modal */}
            {showEditModal && editingPlayer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Edit Player</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleEditPlayer} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Player Name</label>
                                <input
                                    type="text"
                                    value={editingPlayer.name}
                                    disabled
                                    className="w-full p-3 border rounded-lg bg-slate-100 text-slate-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Jersey Number</label>
                                <input
                                    type="text"
                                    value={editingPlayer.jerseyNumber}
                                    onChange={(e) => setEditingPlayer({...editingPlayer, jerseyNumber: e.target.value})}
                                    placeholder="Enter jersey number"
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    data-testid="edit-jersey-number"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                                <select
                                    value={editingPlayer.position}
                                    onChange={(e) => setEditingPlayer({...editingPlayer, position: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    data-testid="edit-position"
                                >
                                    <option value="">Select position</option>
                                    <option value="Attack">Attack</option>
                                    <option value="Midfield">Midfield</option>
                                    <option value="Defense">Defense</option>
                                    <option value="Goalie">Goalie</option>
                                    <option value="FOGO">FOGO</option>
                                    <option value="LSM">LSM</option>
                                </select>
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    data-testid="save-player-btn"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
        console.log('📧 Attempting to send invite...', formData);
        
        if (!formData.name.trim()) {
            setMessage('❌ Name is required');
            console.log('❌ Validation failed: Name is required');
            return;
        }
        
        if (formData.method === 'email' && !formData.email.trim()) {
            setMessage('❌ Email is required for email invites');
            console.log('❌ Validation failed: Email is required');
            return;
        }
        
        if (formData.method === 'sms' && !formData.phone.trim()) {
            setMessage('❌ Phone number is required for SMS invites');
            console.log('❌ Validation failed: Phone is required');
            return;
        }

        try {
            setSending(true);
            console.log(`📧 Sending invite to ${backendUrl}/api/team/${team.id}/invites`);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/invites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    sentBy: currentUser?.id,
                    sentByName: currentUser?.name || 'Coach'
                })
            });

            console.log('📧 Response status:', response.status);
            const data = await response.json();
            console.log('📧 Response data:', data);
            
            if (response.ok) {
                setMessage('✅ Invitation sent successfully!');
                setShowInviteForm(false);
                setFormData({ name: '', email: '', phone: '', method: 'email', position: '', message: '' });
                loadInvites();
            } else {
                // Provide helpful error messages
                let errorMsg = data.detail || 'Failed to send invite';
                if (errorMsg.includes('already registered')) {
                    errorMsg = '❌ This person is already registered. They can log in and join the team directly.';
                } else if (errorMsg.includes('already been sent')) {
                    errorMsg = '❌ An invitation has already been sent to this email address.';
                } else if (errorMsg.includes('Email configuration') || errorMsg.includes('SMTP')) {
                    errorMsg = '❌ Email service not configured. Please contact the league admin to set up email settings.';
                } else {
                    errorMsg = `❌ ${errorMsg}`;
                }
                setMessage(errorMsg);
                console.log('❌ Invite error:', errorMsg);
            }
        } catch (error) {
            console.error('❌ Network error sending invite:', error);
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

// Team Roster Management Tab - For coaches to add/edit players
const TeamRosterManageTab = ({ team, currentUser }) => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [message, setMessage] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadPlayers();
    }, [team.id]);

    const loadPlayers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/players`);
            if (response.ok) {
                const data = await response.json();
                setPlayers(data || []);
            }
        } catch (error) {
            console.error('Error loading players:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePlayer = async (playerId) => {
        if (!window.confirm('Remove this player from the team?')) return;
        
        try {
            // Update user to remove team assignment
            const response = await fetch(`${backendUrl}/api/users/${playerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: null,
                    teamAssignments: []
                })
            });

            if (response.ok) {
                setMessage('✅ Player removed from team');
                loadPlayers();
            }
        } catch (error) {
            setMessage('❌ Error removing player');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Manage Roster</h2>
                    <p className="text-slate-600">View and manage players for {team.name}</p>
                    <p className="text-sm text-slate-500 mt-1">
                        To add new players, use the People tab in the Admin Portal
                    </p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Players List */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Current Roster ({players.length} players)</h3>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : players.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">👥</div>
                        <p className="text-slate-600">No players on roster yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {players.map(player => (
                            <div key={player.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                        {player.jerseyNumber || '#'}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-800">{player.name}</div>
                                        <div className="text-sm text-slate-500">
                                            {player.position || 'No position'} • {player.email || 'No email'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemovePlayer(player.id)}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Team Fees Tab - For coaches to manage team fees
const TeamFeesTab = ({ team, currentUser }) => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        dueDate: '',
        description: ''
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadFees();
    }, [team.id]);

    const loadFees = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/fees?teamId=${team.id}`);
            if (response.ok) {
                const data = await response.json();
                setFees(data.fees || []);
            }
        } catch (error) {
            console.error('Error loading fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFee = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.amount) {
            setMessage('❌ Name and amount are required');
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/fees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    amount: parseFloat(formData.amount),
                    dueDate: formData.dueDate || null,
                    description: formData.description,
                    teamId: team.id,
                    teamName: team.name,
                    scope: 'team',
                    createdBy: currentUser?.id
                })
            });

            if (response.ok) {
                setMessage('✅ Fee created successfully!');
                setShowAddForm(false);
                setFormData({ name: '', amount: '', dueDate: '', description: '' });
                loadFees();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to create fee'}`);
            }
        } catch (error) {
            setMessage('❌ Network error');
        }
        setTimeout(() => setMessage(''), 4000);
    };

    const handleDeleteFee = async (feeId) => {
        if (!window.confirm('Delete this fee?')) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/fees/${feeId}`, { method: 'DELETE' });
            if (response.ok) {
                setMessage('✅ Fee deleted');
                loadFees();
            }
        } catch (error) {
            setMessage('❌ Error deleting fee');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Team Fees</h2>
                    <p className="text-slate-600">Manage fees for {team.name}</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                    <span>+</span> Add Fee
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Add Fee Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Create Team Fee</h3>
                                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>

                            <form onSubmit={handleAddFee} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fee Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        placeholder="Season Registration, Tournament Fee, etc."
                                        required
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="100.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        rows={2}
                                        placeholder="Details about the fee..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        Create Fee
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Fees List */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b">
                    <h3 className="font-semibold text-slate-800">Team Fees</h3>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : fees.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">💰</div>
                        <p className="text-slate-600">No fees set up yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {fees.map(fee => (
                            <div key={fee.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-800">{fee.name}</div>
                                    <div className="text-sm text-slate-500">
                                        ${fee.amount?.toFixed(2) || '0.00'}
                                        {fee.dueDate && ` • Due: ${new Date(fee.dueDate).toLocaleDateString()}`}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteFee(fee.id)}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetailPage;