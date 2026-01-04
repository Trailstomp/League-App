import React, { useState, useMemo } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import GameTicker from '../components/GameTicker';
import TeamGalleryDisplay from '../components/TeamGalleryDisplay';
import YouTubeGallery from '../components/YouTubeGallery';
import EventDetailModal from '../scheduling/components/EventDetailModal';
import TeamDetailModal from '../teams/components/TeamDetailModal';
import NewsDisplay from '../components/NewsDisplay';
import { fixGoogleDriveUrl } from '../utils/imageUtils';
import CachedImage from '../components/CachedImage';
import { SkeletonTeamCard } from '../components/Skeleton';

const HomePage = ({ teams = [], currentUser, events = [], setEvents, websiteStyle = {}, onNavigate }) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [activeTab, setActiveTab] = useState('teams'); // 'teams', 'media'
    const [activeTeamTab, setActiveTeamTab] = useState('all'); // 'all', 'field', 'box', 'other'
    
    // Calculate real statistics from current data
    const stats = {
        totalTeams: teams.length,
        activeEvents: events ? events.length : 0, // Show ALL events count
        totalPlayers: teams.reduce((total, team) => total + (team.players?.length || 0), 0)
    };

    // Group teams by division
    const teamsByDivision = useMemo(() => {
        const field = teams.filter(t => t.division === 'Field').sort((a, b) => a.name.localeCompare(b.name));
        const box = teams.filter(t => t.division === 'Box').sort((a, b) => a.name.localeCompare(b.name));
        const other = teams.filter(t => !t.division || (t.division !== 'Field' && t.division !== 'Box')).sort((a, b) => a.name.localeCompare(b.name));
        return { field, box, other, all: teams.slice().sort((a, b) => a.name.localeCompare(b.name)) };
    }, [teams]);

    // Get teams to display based on active tab
    const displayTeams = useMemo(() => {
        switch(activeTeamTab) {
            case 'field': return teamsByDivision.field;
            case 'box': return teamsByDivision.box;
            case 'other': return teamsByDivision.other;
            default: return teamsByDivision.all;
        }
    }, [activeTeamTab, teamsByDivision]);

    // Handle event click from ticker
    const handleEventClick = (event) => {
        console.log('📅 Event clicked from ticker:', event);
        
        // Find the full event data from our events array
        const fullEvent = events.find(e => e.id === event.id);
        if (fullEvent) {
            setSelectedEvent(fullEvent);
            setShowEventModal(true);
        }
    };

    // Handle team click from ticker
    const handleTeamClick = (teamId) => {
        console.log('🏆 Team clicked from ticker:', teamId);
        
        const team = teams.find(t => t.id === teamId);
        if (team) {
            setSelectedTeam(team);
            setShowTeamModal(true);
        }
    };

    // Handle event updates from modal
    const handleUpdateEvent = (updatedEvent) => {
        setEvents(events.map(event => 
            event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
        ));
    };

    const handleUpdateRSVP = (eventId, rsvpData) => {
        setEvents(events.map(event =>
            event.id === eventId ? { ...event, rsvps: rsvpData } : event
        ));
    };

    const handleUpdateGameStats = (eventId, gameStats) => {
        setEvents(events.map(event =>
            event.id === eventId ? { ...event, gameStats: gameStats } : event
        ));
    };

    const handleUpdateTournament = (eventId, tournamentData) => {
        setEvents(events.map(event =>
            event.id === eventId ? { ...event, tournamentData: tournamentData } : event
        ));
    };

    return (
        <div className="space-y-6 p-4" style={{ backgroundColor: 'transparent', minHeight: '100%' }}>
            {/* Banner and ticker moved to Layout component - now fixed at top of all pages */}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/90 rounded-lg shadow-sm border p-6 backdrop-blur-sm">
                    <div className="flex items-center">
                        <LacrosseIcon name="teams" style={{fontSize: '32px'}} className="text-blue-500 mr-4" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stats.totalTeams}</div>
                            <div className="text-sm text-slate-600">Total Teams</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/90 rounded-lg shadow-sm border backdrop-blur-sm p-6">
                    <div className="flex items-center">
                        <LacrosseIcon name="calendar" style={{fontSize: '32px'}} className="text-green-500 mr-4" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stats.activeEvents}</div>
                            <div className="text-sm text-slate-600">Active Events</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/90 rounded-lg shadow-sm border backdrop-blur-sm p-6">
                    <div className="flex items-center">
                        <LacrosseIcon name="players" style={{fontSize: '32px'}} className="text-purple-500 mr-4" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stats.totalPlayers}</div>
                            <div className="text-sm text-slate-600">Total Players</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="bg-white/90 rounded-lg shadow-sm border backdrop-blur-sm">
                {/* Tab Navigation */}
                <div className="border-b border-slate-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('teams')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'teams' 
                                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50' 
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            🏆 Teams ({teams.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'media' 
                                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50' 
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            📸 Media & Videos
                        </button>
                    </div>
                </div>

                {/* Teams Tab Content */}
                {activeTab === 'teams' && (
                    <div className="p-6">
                        {/* Team Division Filter Tabs */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <button
                                onClick={() => setActiveTeamTab('all')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    activeTeamTab === 'all'
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                All Teams ({teamsByDivision.all.length})
                            </button>
                            {teamsByDivision.field.length > 0 && (
                                <button
                                    onClick={() => setActiveTeamTab('field')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        activeTeamTab === 'field'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                >
                                    🌿 Field ({teamsByDivision.field.length})
                                </button>
                            )}
                            {teamsByDivision.box.length > 0 && (
                                <button
                                    onClick={() => setActiveTeamTab('box')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        activeTeamTab === 'box'
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                    }`}
                                >
                                    📦 Box ({teamsByDivision.box.length})
                                </button>
                            )}
                            {teamsByDivision.other.length > 0 && (
                                <button
                                    onClick={() => setActiveTeamTab('other')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        activeTeamTab === 'other'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                    }`}
                                >
                                    ⭐ Other ({teamsByDivision.other.length})
                                </button>
                            )}
                        </div>

                        {/* Teams Grid */}
                        {displayTeams.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {displayTeams.map(team => (
                                    <TeamCard key={team.id} team={team} onNavigate={onNavigate} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <LacrosseIcon name="teams" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                                <p>No teams in this category.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Media Tab Content */}
                {activeTab === 'media' && (
                    <div className="p-6 space-y-8">
                        {/* League Media Gallery */}
                        <TeamGalleryDisplay pageType="league" />

                        {/* YouTube Gallery */}
                        <YouTubeGallery title="League YouTube Videos" />
                    </div>
                )}
            </div>

            {/* League News - Always visible */}
            <NewsDisplay maxItems={3} showTeamFilter={true} />
                                        {division} Teams ({divisionTeams.length})
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                        {divisionTeams.map(team => (
                            <div 
                                key={team.id} 
                                className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform hover:scale-105 duration-300 border-4 cursor-pointer group"
                                style={{ 
                                    borderColor: team.style?.primaryColor || '#2563eb'
                                }}
                                onClick={() => {
                                    console.log('🏆 Team card clicked:', team.name);
                                    console.log('🎨 Team colors for card:', team.style);
                                    // Navigate to team page like navigation pane
                                    if (onNavigate) {
                                        onNavigate('team', team.id);
                                    }
                                }}
                                title="Click for team details"
                            >
                                {/* Main Logo Area - Larger for better visibility */}
                                <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', minHeight: '200px' }}>
                                    <div 
                                        className="w-full h-full flex items-center justify-center relative"
                                        style={{ 
                                            background: team.style?.cardBackgroundImage 
                                                ? `url(${team.style.cardBackgroundImage})`
                                                : `linear-gradient(135deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, rgba(255,255,255,0.9) 100%)`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    >
                                        {/* Background overlay for opacity control */}
                                        {team.style?.cardBackgroundImage && (
                                            <div 
                                                className="absolute inset-0"
                                                style={{ 
                                                    backgroundColor: `rgba(255,255,255,${1 - (team.style?.cardBackgroundOpacity || 0.3)})`
                                                }}
                                            ></div>
                                        )}
                                        
                                        {/* Logo - Made 50% larger with CachedImage for performance */}
                                        <div className="relative z-10">
                                            {team.style?.logoUrl ? (
                                                <CachedImage 
                                                    src={fixGoogleDriveUrl(team.style.logoUrl)} 
                                                    alt={team.name}
                                                    className="object-contain drop-shadow-2xl"
                                                    style={{ 
                                                        width: '240px',
                                                        height: '240px',
                                                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(255,255,255,0.1))',
                                                        backgroundColor: 'transparent'
                                                    }}
                                                    onError={() => {
                                                        console.warn(`Failed to load logo for team: ${team.name}`, team.style?.logoUrl);
                                                    }}
                                                    fallback={
                                                        <div 
                                                            className="rounded-2xl flex items-center justify-center relative"
                                                            style={{ 
                                                                width: '240px', 
                                                                height: '240px',
                                                                background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                                                            }}
                                                        >
                                                            <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: '6rem' }}>
                                                                {team.name.charAt(0)}
                                                            </span>
                                                        </div>
                                                    }
                                                />
                                            ) : null}
                                            
                                            {/* Fallback letter logo - shown when no logo URL */}
                                            {!team.style?.logoUrl && (
                                            <div 
                                                className="rounded-2xl flex items-center justify-center relative"
                                                style={{ 
                                                    width: '240px', 
                                                    height: '240px',
                                                    background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                                                }}
                                            >
                                                <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: '6rem' }}>
                                                    {team.name.charAt(0)}
                                                </span>
                                                {/* Gradient shine overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-20 pointer-events-none rounded-2xl"></div>
                                            </div>
                                            )}
                                        </div>
                                        
                                        {/* Record Badge - Like hover overlay in player card */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-black bg-opacity-60 rounded px-2 py-1 text-xs text-white">
                                                {team.wins || 0}-{team.losses || 0}
                                            </div>
                                        </div>
                                        
                                        {/* Remove overlay - move to white space below */}
                                    </div>
                                </div>
                                
                                {/* Info Section - Team name and data in white space */}
                                <div className="p-4">
                                    {/* Team Name - Main heading */}
                                    <h3 className="font-bold text-lg text-center mb-2" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                        {team.name}
                                    </h3>
                                    
                                    {/* Team Details */}
                                    <div className="text-center mb-2">
                                        <p className="text-sm text-slate-600">{team.division || 'Division'}</p>
                                        <p className="text-xs text-slate-500">Record: {team.wins || 0}-{team.losses || 0}</p>
                                    </div>
                                    
                                    {/* Coach Info */}
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-600">
                                            Coach: {team.coach || 'TBD'}
                                        </span>
                                        {team.captain && (
                                            <span className="bg-yellow-500 text-white px-2 py-1 rounded font-bold">CAPTAIN</span>
                                        )}
                                    </div>
                                    
                                    {/* Team Motto */}
                                    {team.motto && (
                                        <p className="text-slate-500 text-xs mt-2 italic text-center">"{team.motto}"</p>
                                    )}
                                </div>
                            </div>
                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Teams without division */}
                        {(() => {
                            const noDivisionTeams = teams
                                .filter(team => !team.division || (team.division !== 'Field' && team.division !== 'Box'))
                                .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
                            if (noDivisionTeams.length === 0) return null;
                            
                            return (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-slate-700 border-b border-slate-200 pb-2">
                                        Other Teams ({noDivisionTeams.length})
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                        {noDivisionTeams.map(team => (
                                            <div 
                                                key={team.id} 
                                                className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform hover:scale-105 duration-300 border-4 cursor-pointer group"
                                                style={{ 
                                                    borderColor: team.style?.primaryColor || '#2563eb'
                                                }}
                                                onClick={() => {
                                                    console.log('🏆 Team card clicked:', team.name);
                                                    console.log('🎨 Team colors for card:', team.style);
                                                    if (onNavigate) {
                                                        onNavigate('team', team.id);
                                                    }
                                                }}
                                                title="Click for team details"
                                            >
                                                {/* Main Logo Area - Larger for better visibility */}
                                                <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', minHeight: '200px' }}>
                                                    <div 
                                                        className="w-full h-full flex items-center justify-center relative"
                                                        style={{ 
                                                            background: team.style?.cardBackgroundImage 
                                                                ? `url(${team.style.cardBackgroundImage})`
                                                                : `linear-gradient(135deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, rgba(255,255,255,0.9) 100%)`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center'
                                                        }}
                                                    >
                                                        {team.style?.cardBackgroundImage && (
                                                            <div 
                                                                className="absolute inset-0"
                                                                style={{ 
                                                                    backgroundColor: `rgba(255,255,255,${1 - (team.style?.cardBackgroundOpacity || 0.3)})`
                                                                }}
                                                            ></div>
                                                        )}
                                                        
                                                        <div className="relative z-10">
                                                            {team.style?.logoUrl ? (
                                                                <CachedImage 
                                                                    src={fixGoogleDriveUrl(team.style.logoUrl)} 
                                                                    alt={team.name}
                                                                    className="object-contain drop-shadow-2xl"
                                                                    style={{ 
                                                                        width: '240px',
                                                                        height: '240px',
                                                                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(255,255,255,0.1))',
                                                                        backgroundColor: 'transparent'
                                                                    }}
                                                                    onError={() => {
                                                                        console.warn(`Failed to load logo for team: ${team.name}`, team.style?.logoUrl);
                                                                    }}
                                                                    fallback={
                                                                        <div 
                                                                            className="rounded-2xl flex items-center justify-center relative"
                                                                            style={{ 
                                                                                width: '240px', 
                                                                                height: '240px',
                                                                                background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                                                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                                                                            }}
                                                                        >
                                                                            <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: '6rem' }}>
                                                                                {team.name.charAt(0)}
                                                                            </span>
                                                                        </div>
                                                                    }
                                                                />
                                                            ) : null}
                                                            
                                                            {!team.style?.logoUrl && (
                                                            <div 
                                                                className="rounded-2xl flex items-center justify-center relative"
                                                                style={{ 
                                                                    width: '240px', 
                                                                    height: '240px',
                                                                    background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                                                                }}
                                                            >
                                                                <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: '6rem' }}>
                                                                    {team.name.charAt(0)}
                                                                </span>
                                                                <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-20 pointer-events-none rounded-2xl"></div>
                                                            </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-2 text-center" style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}>
                                                    <h3 className="font-bold text-white drop-shadow-sm" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                                                        {team.name}
                                                    </h3>
                                                    
                                                    <div className="flex justify-center mt-1 space-x-1">
                                                        {team.captain && (
                                                            <span className="bg-yellow-500 text-white px-2 py-1 rounded font-bold">CAPTAIN</span>
                                                        )}
                                                    </div>
                                                    
                                                    {team.motto && (
                                                        <p className="text-slate-500 text-xs mt-2 italic text-center">"{team.motto}"</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <LacrosseIcon name="teams" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                        <p>No teams available. Add teams through the Admin Portal.</p>
                    </div>
                )}
            </div>

            {/* League News */}
            <NewsDisplay maxItems={3} showTeamFilter={true} />

            {/* League Media Gallery */}
            <TeamGalleryDisplay pageType="league" />

            {/* YouTube Gallery */}
            <YouTubeGallery 
                title="League YouTube Videos" 
            />

            {/* Event Detail Modal */}
            {showEventModal && selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    teams={teams}
                    currentUser={currentUser}
                    users={[]}
                    leagueInfo={{}}
                    isOpen={showEventModal}
                    onClose={() => {
                        setShowEventModal(false);
                        setSelectedEvent(null);
                    }}
                    onUpdateEvent={handleUpdateEvent}
                    onUpdateRSVP={handleUpdateRSVP}
                    onUpdateGameStats={handleUpdateGameStats}
                    onUpdateTournament={handleUpdateTournament}
                    gameStats={selectedEvent?.gameStats}
                    tournamentData={selectedEvent?.tournamentData}
                />
            )}

            {/* Team Detail Modal */}
            {showTeamModal && selectedTeam && (
                <TeamDetailModal
                    team={selectedTeam}
                    teams={teams}
                    events={events}
                    currentUser={currentUser}
                    isOpen={showTeamModal}
                    onClose={() => {
                        setShowTeamModal(false);
                        setSelectedTeam(null);
                    }}
                />
            )}
        </div>
    );
};

export default HomePage;