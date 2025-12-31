import React, { useState } from 'react';
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
    // Calculate real statistics from current data
    const stats = {
        totalTeams: teams.length,
        activeEvents: events ? events.length : 0, // Show ALL events count
        totalPlayers: teams.reduce((total, team) => total + (team.players?.length || 0), 0)
    };

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

            {/* Teams by Division */}
            <div className="bg-white/90 rounded-lg shadow-sm border backdrop-blur-sm p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">League Teams</h2>
                {teams.length > 0 ? (
                    <div className="space-y-8">
                        {/* Group teams by division */}
                        {['Field', 'Box'].map(division => {
                            const divisionTeams = teams
                                .filter(team => team.division === division)
                                .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
                            if (divisionTeams.length === 0) return null;
                            
                            return (
                                <div key={division} className="space-y-4">
                                    <h3 className="text-lg font-medium text-slate-700 border-b border-slate-200 pb-2">
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
                                        
                                        {/* Logo - Made 50% larger */}
                                        <div className="relative z-10">
                                            {team.style?.logoUrl ? (
                                                <img 
                                                    src={fixGoogleDriveUrl(team.style.logoUrl)} 
                                                    alt={team.name}
                                                    className="object-contain drop-shadow-2xl"
                                                    style={{ 
                                                        width: '240px', // Even larger for better visibility
                                                        height: '240px', // Even larger for better visibility
                                                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(255,255,255,0.1))',
                                                        backgroundColor: 'transparent'
                                                    }}
                                                    onLoad={(e) => {
                                                        // Image loaded successfully
                                                        e.target.style.opacity = '1';
                                                        e.target.style.transition = 'opacity 0.3s ease';
                                                    }}
                                                    onError={(e) => {
                                                        console.warn(`Failed to load logo for team: ${team.name}`, team.style?.logoUrl);
                                                        // Hide the broken image and show fallback
                                                        e.target.style.display = 'none';
                                                        // Show the fallback letter logo
                                                        const fallback = e.target.parentElement.querySelector('.fallback-logo');
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }}
                                                    loading="lazy"
                                                />
                                            ) : null}
                                            
                                            {/* Fallback letter logo - always present but hidden if image loads */}
                                            <div 
                                                className="fallback-logo rounded-2xl flex items-center justify-center relative"
                                                style={{ 
                                                    width: '240px', 
                                                    height: '240px',
                                                    background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                                    display: team.style?.logoUrl ? 'none' : 'flex' // Hidden if logo URL exists, shown otherwise
                                                }}
                                            >
                                                <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: '6rem' }}>
                                                    {team.name.charAt(0)}
                                                </span>
                                                {/* Gradient shine overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-20 pointer-events-none rounded-2xl"></div>
                                            </div>
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
                                                                <img 
                                                                    src={fixGoogleDriveUrl(team.style.logoUrl)} 
                                                                    alt={team.name}
                                                                    className="object-contain drop-shadow-2xl"
                                                                    style={{ 
                                                                        width: '240px',
                                                                        height: '240px',
                                                                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(255,255,255,0.1))',
                                                                        backgroundColor: 'transparent'
                                                                    }}
                                                                    onLoad={(e) => {
                                                                        e.target.style.opacity = '1';
                                                                        e.target.style.transition = 'opacity 0.3s ease';
                                                                    }}
                                                                    onError={(e) => {
                                                                        console.warn(`Failed to load logo for team: ${team.name}`, team.style?.logoUrl);
                                                                        e.target.style.display = 'none';
                                                                        const fallback = e.target.parentElement.querySelector('.fallback-logo');
                                                                        if (fallback) fallback.style.display = 'flex';
                                                                    }}
                                                                    loading="lazy"
                                                                />
                                                            ) : null}
                                                            
                                                            <div 
                                                                className="fallback-logo rounded-2xl flex items-center justify-center relative"
                                                                style={{ 
                                                                    width: '240px', 
                                                                    height: '240px',
                                                                    background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                                                    display: team.style?.logoUrl ? 'none' : 'flex'
                                                                }}
                                                            >
                                                                <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: '6rem' }}>
                                                                    {team.name.charAt(0)}
                                                                </span>
                                                                <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-20 pointer-events-none rounded-2xl"></div>
                                                            </div>
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