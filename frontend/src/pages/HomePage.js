import React, { useState } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import GameTicker from '../components/GameTicker';
import MediaGallery from '../components/MediaGallery';
import EventDetailModal from '../scheduling/components/EventDetailModal';
import TeamDetailModal from '../teams/components/TeamDetailModal';

const HomePage = ({ teams = [], currentUser, events = [], setEvents, websiteStyle = {}, onNavigate }) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    // Calculate real statistics from current data
    const stats = {
        totalTeams: teams.length,
        activeEvents: events ? events.filter(event => {
            // Filter for upcoming events (consistent with EventsTicker logic)
            if (!event.date) return false;
            
            const eventDate = new Date(event.date);
            const today = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(today.getDate() + 30);
            
            // Include upcoming events within 30 days (matches ticker filtering)
            return eventDate >= today && eventDate <= thirtyDaysFromNow;
        }).length : 0,
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
        <div className="space-y-6">
            {/* Dynamic Welcome Banner */}
            <div 
                className="rounded-lg shadow-sm border p-6"
                style={{
                    backgroundColor: websiteStyle.bannerBackgroundType === 'image' ? 'transparent' : (websiteStyle.bannerBackgroundColor || '#ffffff'),
                    backgroundImage: websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage 
                        ? `url(${websiteStyle.bannerBackgroundImage})` 
                        : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                }}
            >
                {/* Overlay for image banners */}
                {websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg"></div>
                )}
                
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <h1 
                            className="text-3xl font-bold mb-2"
                            style={{
                                fontFamily: websiteStyle.bannerFont || 'Inter, sans-serif',
                                fontSize: websiteStyle.bannerFontSize || '32px',
                                color: websiteStyle.bannerTextColor || '#1f2937'
                            }}
                        >
                            {websiteStyle.bannerTitle || 'Welcome to the Lacrosse League'}
                        </h1>
                        <p 
                            className="mt-2"
                            style={{
                                fontFamily: websiteStyle.bannerFont || 'Inter, sans-serif',
                                color: websiteStyle.bannerTextColor || '#6b7280'
                            }}
                        >
                            {websiteStyle.bannerSubtitle || 'Manage your league with style and efficiency'}
                        </p>
                    </div>
                    <div className="text-6xl">🥍</div>
                </div>
            </div>

            {/* Game Ticker moved to Layout component - now shows on all pages */}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <LacrosseIcon name="teams" style={{fontSize: '32px'}} className="text-blue-500 mr-4" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stats.totalTeams}</div>
                            <div className="text-sm text-slate-600">Total Teams</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <LacrosseIcon name="calendar" style={{fontSize: '32px'}} className="text-green-500 mr-4" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stats.activeEvents}</div>
                            <div className="text-sm text-slate-600">Active Events</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <LacrosseIcon name="players" style={{fontSize: '32px'}} className="text-purple-500 mr-4" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stats.totalPlayers}</div>
                            <div className="text-sm text-slate-600">Total Players</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Teams */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">League Teams</h2>
                {teams.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                        {teams.slice(0, 8).map(team => (
                            <div 
                                key={team.id} 
                                className="relative bg-white rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group"
                                style={{ 
                                    borderColor: team.style?.primaryColor || '#2563eb',
                                    background: `linear-gradient(135deg, rgba(255,255,255,1) 0%, ${team.style?.backgroundColor || '#f8fafc'} 100%)`,
                                    // SPECTACULAR CARD SHADOWS - like premium trading cards
                                    boxShadow: `
                                        0 8px 25px -5px rgba(0, 0, 0, 0.1),
                                        0 4px 6px -2px rgba(0, 0, 0, 0.05),
                                        0 0 0 1px ${team.style?.primaryColor || '#2563eb'}60,
                                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                                    `,
                                    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                                    border: `3px solid ${team.style?.primaryColor || '#2563eb'}`,
                                }}
                                onMouseEnter={(e) => {
                                    // Enhanced 3D card hover effect
                                    e.currentTarget.style.transform = 'perspective(1000px) rotateX(-3deg) rotateY(3deg) translateY(-8px)';
                                    e.currentTarget.style.boxShadow = `
                                        0 25px 50px -12px rgba(0, 0, 0, 0.25),
                                        0 12px 20px -8px rgba(0, 0, 0, 0.1),
                                        0 0 0 1px ${team.style?.primaryColor || '#2563eb'}80,
                                        inset 0 2px 0 rgba(255, 255, 255, 0.3)
                                    `;
                                }}
                                onMouseLeave={(e) => {
                                    // Return to flat position
                                    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
                                    e.currentTarget.style.boxShadow = `
                                        0 8px 25px -5px rgba(0, 0, 0, 0.1),
                                        0 4px 6px -2px rgba(0, 0, 0, 0.05),
                                        0 0 0 1px ${team.style?.primaryColor || '#2563eb'}60,
                                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                                    `;
                                }}
                                onClick={() => {
                                    console.log('🏆 Team card clicked:', team.name);
                                    console.log('🎨 Team colors for card:', team.style);
                                    // Navigate to team page like navigation pane
                                    if (onNavigate) {
                                        onNavigate('team', team.id);
                                    }
                                }}
                                onMouseEnter={(e) => {
                                    // Enhanced 3D card hover effect
                                    e.currentTarget.style.transform = 'perspective(1000px) rotateX(-3deg) rotateY(3deg) translateY(-8px)';
                                    e.currentTarget.style.boxShadow = `
                                        0 25px 50px -12px rgba(0, 0, 0, 0.25),
                                        0 12px 20px -8px rgba(0, 0, 0, 0.1),
                                        0 0 0 1px ${team.style?.primaryColor || '#2563eb'}80,
                                        inset 0 2px 0 rgba(255, 255, 255, 0.3)
                                    `;
                                }}
                                onMouseLeave={(e) => {
                                    // Return to flat position
                                    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
                                    e.currentTarget.style.boxShadow = `
                                        0 8px 25px -5px rgba(0, 0, 0, 0.1),
                                        0 4px 6px -2px rgba(0, 0, 0, 0.05),
                                        0 0 0 1px ${team.style?.primaryColor || '#2563eb'}60,
                                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                                    `;
                                }}
                            >
                                {/* Card Header Stripe with Enhanced Gradient */}
                                <div 
                                    className="h-4 w-full relative"
                                    style={{ 
                                        background: `linear-gradient(90deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 50%, ${team.style?.primaryColor || '#2563eb'} 100%)`
                                    }}
                                >
                                    {/* Shine effect on header */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>
                                </div>
                                
                                {/* COMPACT LOGO SECTION - Narrower cards */}
                                <div 
                                    className="relative p-2" 
                                    style={{ 
                                        height: '120px',
                                        background: team.style?.cardBackgroundImage 
                                            ? `url(${team.style.cardBackgroundImage})`
                                            : `linear-gradient(135deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, rgba(255,255,255,0.9) 100%)`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        aspectRatio: '1'  // Keep cards square for narrow layout
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
                                    
                                    {/* Logo container - COMPACT for narrow cards */}
                                    <div className="w-full h-full flex items-center justify-center relative z-10">
                                        {team.style?.logoUrl ? (
                                            <img 
                                                src={team.style.logoUrl} 
                                                alt={team.name}
                                                className="w-16 h-16 object-contain drop-shadow-lg"
                                                style={{ 
                                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                                                    backgroundColor: 'transparent'
                                                }}
                                            />
                                        ) : (
                                            <div 
                                                className="w-16 h-16 rounded-xl flex items-center justify-center relative"
                                                style={{ 
                                                    background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <span className="text-white font-bold text-2xl drop-shadow-lg">
                                                    {team.name.charAt(0)}
                                                </span>
                                                {/* Gradient shine overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-20 pointer-events-none rounded-xl"></div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Team Record Badge - Floating */}
                                    <div className="absolute top-2 right-2">
                                        <div 
                                            className="px-3 py-1 rounded-full text-white text-sm font-bold shadow-lg"
                                            style={{ 
                                                background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                        >
                                            {team.wins || 0}-{team.losses || 0}
                                        </div>
                                    </div>
                                    
                                    {/* Division Badge - Floating */}
                                    <div className="absolute top-2 left-2">
                                        <div 
                                            className="px-2 py-1 rounded-full text-xs font-semibold shadow-lg bg-white border"
                                            style={{ 
                                                color: team.style?.primaryColor || '#2563eb',
                                                borderColor: team.style?.primaryColor || '#2563eb'
                                            }}
                                        >
                                            {team.division || 'Field'}
                                        </div>
                                    </div>
                                    
                                    {/* Holographic shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"></div>
                                </div>
                                
                                {/* Team Info Footer - VERY Compact for narrow cards */}
                                <div className="px-2 pb-2 bg-white relative z-10">
                                    <h3 
                                        className="text-sm font-bold text-center truncate"
                                        style={{ color: team.style?.primaryColor || '#2563eb' }}
                                        title={team.name}
                                    >
                                        {team.name}
                                    </h3>
                                </div>
                                
                                {/* Card Footer Stripe with Enhanced Gradient */}
                                <div 
                                    className="h-4 w-full relative"
                                    style={{ 
                                        background: `linear-gradient(90deg, ${team.style?.accentColor || '#3b82f6'} 0%, ${team.style?.primaryColor || '#2563eb'} 50%, ${team.style?.accentColor || '#3b82f6'} 100%)`
                                    }}
                                >
                                    {/* Footer shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>
                                </div>
                                
                                {/* Premium Card Bevel Effect */}
                                <div className="absolute inset-0 rounded-xl border border-white/30 pointer-events-none"></div>
                                <div className="absolute inset-0 rounded-xl border-2 border-black/5 pointer-events-none"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <LacrosseIcon name="teams" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                        <p>No teams available. Add teams through the Admin Portal.</p>
                    </div>
                )}
            </div>

            {/* Media Gallery */}
            <MediaGallery 
                teams={teams} 
                title="League Media Gallery" 
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