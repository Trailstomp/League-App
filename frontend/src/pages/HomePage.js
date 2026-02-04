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

// Team Card Component
const TeamCard = ({ team, onNavigate }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <div 
            className="relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{ 
                borderColor: team.style?.primaryColor || '#2563eb',
                borderWidth: '3px',
                borderStyle: 'solid'
            }}
            onClick={() => onNavigate && onNavigate('team', team.id)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title="Click for team details"
        >
            {/* Large Logo Area - 70% of card */}
            <div 
                className="relative w-full flex items-center justify-center p-6"
                style={{ 
                    aspectRatio: '1/1',
                    background: team.style?.cardBackgroundImage 
                        ? `url(${fixGoogleDriveUrl(team.style.cardBackgroundImage)})`
                        : `linear-gradient(145deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, white 50%, ${team.style?.accentColor || '#e2e8f0'}30 100%)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* Background overlay if image exists */}
                {team.style?.cardBackgroundImage && (
                    <div 
                        className="absolute inset-0"
                        style={{ backgroundColor: `rgba(255,255,255,${1 - (team.style?.cardBackgroundOpacity || 0.3)})` }}
                    />
                )}
                
                {/* Team Logo - Large & Centered */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                    {team.style?.logoUrl ? (
                        <CachedImage 
                            src={fixGoogleDriveUrl(team.style.logoUrl)} 
                            alt={team.name}
                            className="object-contain transition-transform duration-300"
                            style={{ 
                                width: '85%',
                                height: '85%',
                                filter: isHovered ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))' : 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))',
                                opacity: team.style?.logoOpacity || 1,
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                            }}
                            fallback={
                                <div 
                                    className="rounded-2xl flex items-center justify-center transition-transform duration-300"
                                    style={{ 
                                        width: '80%', 
                                        height: '80%',
                                        background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                        boxShadow: isHovered ? '0 12px 40px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.25)',
                                        transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                                    }}
                                >
                                    <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: '4rem' }}>
                                        {team.name.charAt(0)}
                                    </span>
                                </div>
                            }
                        />
                    ) : (
                        <div 
                            className="rounded-2xl flex items-center justify-center transition-transform duration-300"
                            style={{ 
                                width: '80%', 
                                height: '80%',
                                background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                boxShadow: isHovered ? '0 12px 40px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.25)',
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                            }}
                        >
                            <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: '4rem' }}>
                                {team.name.charAt(0)}
                            </span>
                        </div>
                    )}
                </div>
                
                {/* Record Badge - Top Right */}
                <div 
                    className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                    style={{ 
                        backgroundColor: team.style?.primaryColor || '#2563eb',
                        color: 'white'
                    }}
                >
                    {team.wins || 0}-{team.losses || 0}{team.ties ? `-${team.ties}` : ''}
                </div>
            </div>
            
            {/* Info Footer - Clean & Minimal */}
            <div 
                className="px-4 py-3 border-t"
                style={{ 
                    backgroundColor: team.style?.primaryColor || '#2563eb',
                    borderColor: team.style?.accentColor || team.style?.primaryColor || '#2563eb'
                }}
            >
                <h3 className="font-bold text-lg text-center text-white truncate drop-shadow-sm">
                    {team.name}
                </h3>
                <p className="text-center text-white/80 text-sm">
                    {team.division || 'Division'}
                </p>
            </div>
        </div>
    );
};

const HomePage = ({ teams = [], players = [], currentUser, events = [], setEvents, websiteStyle = {}, onNavigate }) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [activeTab, setActiveTab] = useState('teams'); // 'teams', 'media'
    const [activeTeamTab, setActiveTeamTab] = useState('all'); // 'all', 'field', 'box', 'other'
    
    // Calculate statistics - use players array for accurate count
    const stats = {
        totalTeams: teams.filter(t => !t.isExternal).length,
        activeEvents: events ? events.length : 0,
        totalPlayers: players.length
    };

    // Group teams by division (excluding external teams)
    const teamsByDivision = useMemo(() => {
        const internalTeams = teams.filter(t => !t.isExternal);
        const field = internalTeams.filter(t => t.division === 'Field').sort((a, b) => a.name.localeCompare(b.name));
        const box = internalTeams.filter(t => t.division === 'Box').sort((a, b) => a.name.localeCompare(b.name));
        const other = internalTeams.filter(t => !t.division || (t.division !== 'Field' && t.division !== 'Box')).sort((a, b) => a.name.localeCompare(b.name));
        return { field, box, other, all: internalTeams.slice().sort((a, b) => a.name.localeCompare(b.name)) };
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

    // Event handlers
    const handleEventClick = (event) => {
        const fullEvent = events.find(e => e.id === event.id);
        if (fullEvent) {
            setSelectedEvent(fullEvent);
            setShowEventModal(true);
        }
    };

    const handleTeamClick = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            setSelectedTeam(team);
            setShowTeamModal(true);
        }
    };

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
