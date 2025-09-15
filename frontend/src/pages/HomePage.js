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
                                className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform hover:scale-105 duration-300 border-4 cursor-pointer group"
                                style={{ borderColor: team.style?.primaryColor || '#2563eb' }}
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
                                {/* Main Logo Area - 80% of card like player photo */}
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
                                        
                                        {/* Logo - 80% of the card area */}
                                        <div className="relative z-10">
                                            {team.style?.logoUrl ? (
                                                <img 
                                                    src={team.style.logoUrl} 
                                                    alt={team.name}
                                                    className="w-32 h-32 object-contain drop-shadow-2xl"
                                                    style={{ 
                                                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(255,255,255,0.1))',
                                                        backgroundColor: 'transparent'
                                                    }}
                                                />
                                            ) : (
                                                <div 
                                                    className="w-32 h-32 rounded-2xl flex items-center justify-center relative"
                                                    style={{ 
                                                        background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                                                    }}
                                                >
                                                    <span className="text-white font-bold text-6xl drop-shadow-lg">
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