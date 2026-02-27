import React, { useState, useMemo, useEffect } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import { Home, Users, Camera, Star, UserPlus } from 'lucide-react';
import TeamGalleryDisplay from '../components/TeamGalleryDisplay';
import YouTubeGallery from '../components/YouTubeGallery';
import MediaManager from '../components/MediaManager';
import EventDetailModal from '../scheduling/components/EventDetailModal';
import TeamDetailModal from '../teams/components/TeamDetailModal';
import SponsorsDisplay from '../components/SponsorsDisplay';
import NewsDisplay from '../components/NewsDisplay';
import { fixGoogleDriveUrl } from '../utils/imageUtils';
import CachedImage from '../components/CachedImage';
import TeamRegistrationForm from '../components/joinus/TeamRegistrationForm';
import PlayerApplicationForm from '../components/joinus/PlayerApplicationForm';
import VolunteerSignupForm from '../components/joinus/VolunteerSignupForm';

// Team Card Component
const TeamCard = ({ team, onNavigate }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <div 
            className="relative bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{ 
                borderColor: team.style?.primaryColor || '#2563eb',
                borderWidth: '1px',
                borderStyle: 'solid'
            }}
            onClick={() => onNavigate && onNavigate('team', team.id)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title="Click for team details"
            data-testid={`team-card-${team.id}`}
        >
            {/* Logo Area - tiny on mobile, normal on desktop */}
            <div 
                className="relative w-full flex items-center justify-center p-1 sm:p-6 h-[70px] sm:h-auto sm:aspect-square"
                style={{ 
                    background: team.style?.cardBackgroundImage 
                        ? `url(${fixGoogleDriveUrl(team.style.cardBackgroundImage)})`
                        : `linear-gradient(145deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, white 50%, ${team.style?.accentColor || '#e2e8f0'}30 100%)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {team.style?.cardBackgroundImage && (
                    <div 
                        className="absolute inset-0"
                        style={{ backgroundColor: `rgba(255,255,255,${1 - (team.style?.cardBackgroundOpacity || 0.3)})` }}
                    />
                )}
                
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
                                    className="rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform duration-300"
                                    style={{ 
                                        width: '80%', 
                                        height: '80%',
                                        background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                        boxShadow: isHovered ? '0 12px 40px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.25)',
                                        transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                                    }}
                                >
                                    <span className="text-white font-bold drop-shadow-lg text-2xl sm:text-5xl">
                                        {team.name.charAt(0)}
                                    </span>
                                </div>
                            }
                        />
                    ) : (
                        <div 
                            className="rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform duration-300"
                            style={{ 
                                width: '80%', 
                                height: '80%',
                                background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)`,
                                boxShadow: isHovered ? '0 12px 40px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.25)',
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                            }}
                        >
                            <span className="text-white font-bold drop-shadow-lg text-2xl sm:text-5xl">
                                {team.name.charAt(0)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Team Name Bar - compact on mobile */}
            <div 
                className="py-1.5 px-2 sm:py-3 sm:px-4 text-center"
                style={{ 
                    backgroundColor: team.style?.primaryColor || '#2563eb',
                    color: team.style?.textColor || '#ffffff'
                }}
            >
                <h3 className="font-bold text-xs sm:text-sm truncate drop-shadow-sm">{team.name}</h3>
                {team.division && (
                    <p className="text-[10px] sm:text-xs opacity-80">{team.division}</p>
                )}
            </div>
        </div>
    );
};

// Join Us Card Component
const JoinUsCard = ({ type, icon, title, description, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
        data-testid={`join-as-${type}`}
    >
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
        <div className="mt-4 text-blue-600 font-medium text-sm group-hover:text-blue-700">
            Learn more →
        </div>
    </div>
);

const HomePage = ({ teams = [], players = [], currentUser, events = [], setEvents, websiteStyle = {}, onNavigate, homeTab, onHomeTabUsed }) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [activeTab, setActiveTab] = useState(homeTab || 'welcome'); // 'welcome', 'join', 'teams', 'media', 'sponsors'
    const [activeJoinForm, setActiveJoinForm] = useState(null); // 'team', 'player', 'volunteer', or null for landing
    const [activeTeamTab, setActiveTeamTab] = useState('all');
    const [welcomeMessage, setWelcomeMessage] = useState(null);
    const [loadingWelcome, setLoadingWelcome] = useState(true);
    const [adminEmail, setAdminEmail] = useState('');
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Switch tab when homeTab prop changes
    useEffect(() => {
        if (homeTab) {
            setActiveTab(homeTab);
            if (onHomeTabUsed) onHomeTabUsed();
        }
    }, [homeTab, onHomeTabUsed]);

    
    // Load welcome message
    useEffect(() => {
        const loadWelcomeMessage = async () => {
            try {
                const response = await fetch(`${backendUrl}/api/league-settings/welcome-message`);
                if (response.ok) {
                    const data = await response.json();
                    setWelcomeMessage(data);
                }
            } catch (error) {
                console.error('Error loading welcome message:', error);
            } finally {
                setLoadingWelcome(false);
            }
        };
        loadWelcomeMessage();
    }, [backendUrl]);

    // Load admin email
    useEffect(() => {
        const fetchAdminEmail = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/league-data`);
                if (res.ok) {
                    const data = await res.json();
                    setAdminEmail(data.smtpConfig?.email || '');
                }
            } catch (e) { /* silent */ }
        };
        fetchAdminEmail();
    }, [backendUrl]);
    
    // Calculate statistics
    const stats = {
        totalTeams: teams.filter(t => !t.isExternal && t.division?.toLowerCase() !== 'external').length,
        activeEvents: events ? events.length : 0,
        totalPlayers: players.length
    };

    // Group teams by division (excluding external teams)
    const teamsByDivision = useMemo(() => {
        const internalTeams = teams.filter(t => !t.isExternal && t.division?.toLowerCase() !== 'external');
        const grouped = {};
        
        internalTeams.forEach(team => {
            const division = team.division || 'Other';
            if (!grouped[division]) {
                grouped[division] = [];
            }
            grouped[division].push(team);
        });
        
        // Sort each division's teams
        Object.keys(grouped).forEach(div => {
            grouped[div].sort((a, b) => a.name.localeCompare(b.name));
        });
        
        return {
            ...grouped,
            all: internalTeams.slice().sort((a, b) => a.name.localeCompare(b.name))
        };
    }, [teams]);

    // Get unique divisions
    const divisions = useMemo(() => {
        return Object.keys(teamsByDivision).filter(d => d !== 'all');
    }, [teamsByDivision]);

    // Get teams to display based on active tab
    const displayTeams = useMemo(() => {
        if (activeTeamTab === 'all') return teamsByDivision.all || [];
        return teamsByDivision[activeTeamTab] || [];
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

    const handleJoinClick = (type) => {
        setActiveTab('join');
    };

    return (
        <div className="space-y-6 p-4" style={{ backgroundColor: 'transparent', minHeight: '100%' }}>
            {/* Live Now Banner - visible to everyone */}
            {(() => {
                const liveGames = events.filter(e => e.status === 'in_progress' && (e.type === 'game' || e.type === 'regular_game' || e.type === 'tournament'));
                if (liveGames.length === 0) return null;
                return (
                    <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-md p-1.5 sm:p-2 text-white shadow-md" data-testid="home-live-banner">
                        <div className="space-y-0.5">
                            {liveGames.map(game => {
                                const teamIds = [game.homeTeam, game.awayTeam].filter(Boolean);
                                const fallbackIds = teamIds.length ? teamIds : (game.teams || []).slice(0, 2);
                                const homeTeam = teams.find(t => t.id === fallbackIds[0]);
                                const awayTeam = teams.find(t => t.id === fallbackIds[1]);
                                const scores = game.scores?.home_team?.score !== undefined
                                    ? { home: game.scores.home_team.score, away: game.scores.away_team?.score }
                                    : { home: game.homeScore ?? '-', away: game.awayScore ?? '-' };
                                return (
                                    <div
                                        key={game.id}
                                        className="flex items-center justify-between bg-white/10 rounded px-2 py-0.5 cursor-pointer hover:bg-white/20 transition-colors"
                                        onClick={() => onNavigate && onNavigate('live-game', game.id)}
                                        data-testid={`home-live-event-${game.id}`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />
                                            <div className="flex items-center gap-1">
                                                {homeTeam?.style?.logoUrl ? (
                                                    <img src={homeTeam.style.logoUrl} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-contain bg-white" />
                                                ) : (
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{homeTeam?.name?.charAt(0) || '?'}</div>
                                                )}
                                                <span className="text-xs font-semibold truncate">{homeTeam?.name || 'Home'}</span>
                                            </div>
                                            <span className="text-sm font-bold">{scores.home} - {scores.away}</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-semibold truncate">{awayTeam?.name || 'Away'}</span>
                                                {awayTeam?.style?.logoUrl ? (
                                                    <img src={awayTeam.style.logoUrl} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-contain bg-white" />
                                                ) : (
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{awayTeam?.name?.charAt(0) || '?'}</div>
                                                )}
                                            </div>
                                        </div>
                                        <button className="px-2 py-0.5 bg-white text-red-600 text-[10px] font-bold rounded hover:bg-red-50 flex-shrink-0 ml-2">
                                            Watch
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* Quick Stats - always single row, compact on mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div className="bg-white/90 rounded-lg shadow-sm border backdrop-blur-sm" style={{ padding: '8px 10px' }}>
                    <div className="text-lg font-bold text-slate-800" data-testid="stat-teams">{stats.totalTeams}</div>
                    <div className="text-xs text-slate-500">Teams</div>
                </div>
                <div className="bg-white/90 rounded-lg shadow-sm border backdrop-blur-sm" style={{ padding: '8px 10px' }}>
                    <div className="text-lg font-bold text-slate-800" data-testid="stat-events">{stats.activeEvents}</div>
                    <div className="text-xs text-slate-500">Events</div>
                </div>
                <div className="bg-white/90 rounded-lg shadow-sm border backdrop-blur-sm" style={{ padding: '8px 10px' }}>
                    <div className="text-lg font-bold text-slate-800" data-testid="stat-players">{stats.totalPlayers}</div>
                    <div className="text-xs text-slate-500">Players</div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="bg-white/90 rounded-lg shadow-sm border backdrop-blur-sm">
                {/* Tab Navigation */}
                <div className="border-b border-slate-200">
                    <div className="flex overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('welcome')}
                            className={`flex flex-col items-center px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap min-w-0 flex-shrink-0 ${
                                activeTab === 'welcome' 
                                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50' 
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                            data-testid="welcome-tab"
                        >
                            <Home className="w-5 h-5" />
                            <span>Welcome</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('teams')}
                            className={`flex flex-col items-center px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap min-w-0 flex-shrink-0 ${
                                activeTab === 'teams' 
                                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50' 
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                            data-testid="teams-tab"
                        >
                            <Users className="w-5 h-5" />
                            <span>Teams ({stats.totalTeams})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`flex flex-col items-center px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap min-w-0 flex-shrink-0 ${
                                activeTab === 'media' 
                                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50' 
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                            data-testid="media-tab"
                        >
                            <Camera className="w-5 h-5" />
                            <span>Media</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('sponsors')}
                            className={`flex flex-col items-center px-4 py-2 text-xs font-medium transition-colors min-w-0 flex-shrink-0 ${
                                activeTab === 'sponsors' 
                                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50' 
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                            data-testid="sponsors-tab"
                        >
                            <Star className="w-5 h-5" />
                            <span className="text-center leading-tight">Sponsors<br/>& Friends</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('join')}
                            className={`flex flex-col items-center px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap min-w-0 flex-shrink-0 ${
                                activeTab === 'join' 
                                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50' 
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                            data-testid="join-tab"
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>Join Us</span>
                        </button>
                    </div>
                </div>

                {/* Welcome Tab Content */}
                {activeTab === 'welcome' && (
                    <div className="p-6 space-y-8">
                        {/* Welcome Message Section */}
                        <div 
                            className="rounded-xl p-6 border relative overflow-hidden"
                            style={{ 
                                backgroundColor: welcomeMessage?.backgroundColor || '#eff6ff',
                                fontFamily: welcomeMessage?.fontFamily || 'Inter, system-ui, sans-serif'
                            }}
                        >
                            {/* Background Image */}
                            {welcomeMessage?.imageUrl && welcomeMessage?.imagePosition === 'background' && (
                                <div 
                                    className="absolute inset-0 opacity-20"
                                    style={{
                                        backgroundImage: `url(${welcomeMessage.imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                />
                            )}

                            {loadingWelcome ? (
                                <div className="animate-pulse h-20 bg-slate-200 rounded"></div>
                            ) : (
                                <div className={`relative z-10 flex ${
                                    welcomeMessage?.imagePosition === 'top' ? 'flex-col' :
                                    welcomeMessage?.imagePosition === 'left' ? 'flex-row-reverse' :
                                    'flex-row'
                                } gap-6`}>
                                    {/* Content */}
                                    <div className="flex-1">
                                        <h2 
                                            className="text-2xl font-bold mb-4 flex items-center"
                                            style={{ color: welcomeMessage?.titleColor || '#1e40af' }}
                                        >
                                            <span className="mr-3">👋</span>
                                            {welcomeMessage?.title || 'Welcome to Our League!'}
                                        </h2>
                                        {welcomeMessage?.content ? (
                                            <div 
                                                className="prose max-w-none leading-relaxed"
                                                style={{ color: welcomeMessage?.textColor || '#1e293b' }}
                                                dangerouslySetInnerHTML={{ __html: welcomeMessage.content.replace(/\n/g, '<br/>') }}
                                            />
                                        ) : (
                                            <p style={{ color: welcomeMessage?.textColor || '#1e293b' }}>
                                                Welcome to our league community! We&apos;re excited to have you here. 
                                                Whether you&apos;re a player looking to join a team, a coach organizing your roster, 
                                                or a fan following the action, you&apos;ve come to the right place.
                                            </p>
                                        )}
                                        {currentUser?.roles?.includes('admin') && (
                                            <button 
                                                onClick={() => onNavigate && onNavigate('admin')}
                                                className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
                                            >
                                                Edit welcome message (Admin)
                                            </button>
                                        )}
                                    </div>

                                    {/* Image (if not background) */}
                                    {welcomeMessage?.imageUrl && welcomeMessage?.imagePosition !== 'background' && (
                                        <div className={`flex-shrink-0 ${
                                            welcomeMessage?.imagePosition === 'top' ? 'w-full' : 'w-48 md:w-64'
                                        }`}>
                                            <img 
                                                src={welcomeMessage.imageUrl} 
                                                alt="Welcome"
                                                className={`rounded-lg shadow-lg object-cover ${
                                                    welcomeMessage?.imagePosition === 'top' ? 'w-full h-48 md:h-64' : 'w-48 md:w-64 h-48 md:h-64'
                                                }`}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Join Us CTA Button */}
                        <div className="text-center py-4">
                            <button
                                onClick={() => setActiveTab('join')}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-base font-semibold shadow-md hover:shadow-lg"
                                data-testid="join-us-cta-btn"
                            >
                                🤝 Want to Get Involved? Join Us!
                            </button>
                        </div>

                        {/* League News Section */}
                        <div>
                            <NewsDisplay maxItems={5} showTeamFilter={true} />
                        </div>
                    </div>
                )}

                {/* Join Us Tab Content */}
                {activeTab === 'join' && (
                    <div className="p-6" data-testid="join-us-page">
                        {/* Show specific form if selected */}
                        {activeJoinForm === 'team' && (
                            <TeamRegistrationForm 
                                onBack={() => setActiveJoinForm(null)}
                                onSuccess={() => {}}
                            />
                        )}
                        
                        {activeJoinForm === 'player' && (
                            <PlayerApplicationForm 
                                onBack={() => setActiveJoinForm(null)}
                                onSuccess={() => {}}
                            />
                        )}
                        
                        {activeJoinForm === 'volunteer' && (
                            <VolunteerSignupForm 
                                onBack={() => setActiveJoinForm(null)}
                                onSuccess={() => {}}
                            />
                        )}
                        
                        {/* Show landing page if no form selected */}
                        {!activeJoinForm && (
                            <div className="space-y-8">
                                <div className="text-center max-w-2xl mx-auto">
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Get Involved</h2>
                                    <p className="text-slate-600">Whether you want to play, lead a team, volunteer, or just connect — there's a place for you here.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                                    {/* Join as Player */}
                                    <div
                                        className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
                                        onClick={() => setActiveJoinForm('player')}
                                        data-testid="join-as-player"
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🏃</div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">Join as a Player</h3>
                                                <p className="text-sm text-blue-600 font-medium">Apply now →</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600">Looking to play? Submit an application to join one of our teams. Coaches will review and get back to you.</p>
                                    </div>

                                    {/* Register a Team */}
                                    <div
                                        className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer group"
                                        onClick={() => setActiveJoinForm('team')}
                                        data-testid="join-as-team"
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🏆</div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">Register a Team</h3>
                                                <p className="text-sm text-green-600 font-medium">Get started →</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600">Have a team ready to play? Register your team for the upcoming season. League admins will review your application.</p>
                                    </div>

                                    {/* Volunteer or Sponsor */}
                                    <div
                                        className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-amber-400 hover:shadow-lg transition-all cursor-pointer group"
                                        onClick={() => setActiveJoinForm('volunteer')}
                                        data-testid="join-as-volunteer"
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🙋</div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">Volunteer or Sponsor</h3>
                                                <p className="text-sm text-amber-600 font-medium">Sign up →</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600">Want to help as a referee, scorekeeper, or sponsor? Sign up and we'll reach out with opportunities.</p>
                                    </div>

                                    {/* Contact the League */}
                                    <div
                                        className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer group"
                                        onClick={() => adminEmail ? window.location.href = `mailto:${adminEmail}?subject=League%20Inquiry` : null}
                                        data-testid="contact-league"
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📬</div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">Contact the League</h3>
                                                {adminEmail ? (
                                                    <p className="text-sm text-purple-600 font-medium">{adminEmail}</p>
                                                ) : (
                                                    <p className="text-sm text-purple-600 font-medium">Send a message →</p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600">Questions? Just want to say hello? Reach out to our league administrator directly.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                                All Teams ({teamsByDivision.all?.length || 0})
                            </button>
                            {divisions.map(division => (
                                <button
                                    key={division}
                                    onClick={() => setActiveTeamTab(division)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        activeTeamTab === division
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                >
                                    {division} ({teamsByDivision[division]?.length || 0})
                                </button>
                            ))}
                        </div>

                        {/* Info Banner for joining */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <p className="text-amber-800 text-sm">
                                <span className="font-semibold">💡 Want to join a team?</span> Click on any team below to view their page, 
                                where you can find coach contact information and send them an email directly.
                            </p>
                        </div>

                        {/* Teams Grid */}
                        {displayTeams.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
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
                        {/* Self-service Media Manager */}
                        <MediaManager
                            ownerType="league"
                            ownerId="league"
                            canEdit={currentUser?.role === 'admin' || currentUser?.roles?.includes('admin')}
                            currentUser={currentUser}
                        />

                        {/* Legacy League Media Gallery */}
                        <TeamGalleryDisplay pageType="league" />

                        {/* YouTube Gallery */}
                        <YouTubeGallery title="League YouTube Videos" />
                    </div>
                )}

                {activeTab === 'sponsors' && (
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Friends & Sponsors</h2>
                        <p className="text-sm text-slate-600 mb-6">Thank you to the friends and sponsors who make our league possible!</p>
                        <SponsorsDisplay currentUser={currentUser} editable={true} />
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
