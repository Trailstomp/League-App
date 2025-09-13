import React, { useState } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import GameTicker from '../components/GameTicker';
import EventDetailModal from '../scheduling/components/EventDetailModal';
import TeamDetailModal from '../teams/components/TeamDetailModal';

const HomePage = ({ teams = [], currentUser, events = [], setEvents, websiteStyle = {}, onNavigate }) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const stats = {
        totalTeams: teams.length,
        activeEvents: 0, // Will be connected later
        totalPlayers: 0, // Will be connected later
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

            {/* Game Ticker */}
            <GameTicker 
                teams={teams}
                leagueSchedule={events}
                onTeamClick={handleTeamClick}
                onEventClick={handleEventClick}
                websiteStyle={websiteStyle}
            />

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {teams.slice(0, 8).map(team => (
                            <div 
                                key={team.id} 
                                className="relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2"
                                style={{ 
                                    borderColor: team.style?.primaryColor || '#2563eb',
                                    background: `linear-gradient(135deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, rgba(255,255,255,0.9) 100%)`
                                }}
                                onClick={() => {
                                    console.log('🏆 Team card clicked:', team.name);
                                    // Navigate to team page like navigation pane
                                    if (onNavigate) {
                                        onNavigate('team', team.id);
                                    }
                                }}
                            >
                                {/* Card Header with Team Colors */}
                                <div 
                                    className="h-3 w-full"
                                    style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}
                                ></div>
                                
                                {/* Team Logo Section */}
                                <div className="flex justify-center py-6">
                                    <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-xl bg-white">
                                        {team.style?.logoUrl ? (
                                            <img 
                                                src={team.style.logoUrl} 
                                                alt={team.name}
                                                className="w-full h-full object-contain p-2"
                                            />
                                        ) : (
                                            <div 
                                                className="w-full h-full rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}
                                            >
                                                <span className="text-white font-bold text-4xl">
                                                    {team.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Team Info */}
                                <div className="px-4 pb-4 text-center">
                                    <h3 
                                        className="text-lg font-bold mb-2 truncate"
                                        style={{ color: team.style?.primaryColor || '#2563eb' }}
                                    >
                                        {team.name}
                                    </h3>
                                    <div className="space-y-1">
                                        <div className="text-sm text-slate-600 font-medium">
                                            {team.division || 'Field'} Division
                                        </div>
                                        <div 
                                            className="text-lg font-bold"
                                            style={{ color: team.style?.primaryColor || '#2563eb' }}
                                        >
                                            {team.wins || 0}-{team.losses || 0}
                                            {team.ties > 0 && `-${team.ties}`}
                                        </div>
                                        {team.coach && (
                                            <div className="text-xs text-slate-500">
                                                Coach: {team.coach}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Card Footer */}
                                <div 
                                    className="h-2 w-full"
                                    style={{ backgroundColor: team.style?.accentColor || team.style?.primaryColor || '#2563eb' }}
                                ></div>
                                
                                {/* Playing Card Corner Elements */}
                                <div className="absolute top-1 left-1 text-xs font-bold opacity-60" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                    {team.division?.charAt(0) || 'F'}
                                </div>
                                <div className="absolute bottom-1 right-1 text-xs font-bold opacity-60 transform rotate-180" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                    {team.division?.charAt(0) || 'F'}
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