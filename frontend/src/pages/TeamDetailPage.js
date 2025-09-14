import React, { useState } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';

const TeamDetailPage = ({ team, teams, events, players, onNavigate }) => {
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

    const tabs = [
        { id: 'home', label: 'Home', icon: 'venue' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'roster', label: 'Roster', icon: 'teams' },
        { id: 'stats', label: 'Stats', icon: 'trophy' },
        { id: 'media', label: 'Photos & Vids', icon: 'view' },
        { id: 'contact', label: 'Contact', icon: 'email' }
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
            {/* DEBUG: Log team colors */}
            {console.log('🎨 Team page background colors:', {
                pageBackgroundType: teamStyle.pageBackgroundType,
                pageBackgroundColor: teamStyle.pageBackgroundColor,
                backgroundColor: teamStyle.backgroundColor,
                finalColor: teamStyle.pageBackgroundColor || teamStyle.backgroundColor || '#f8fafc'
            })}
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
                        {/* Team Logo - Enhanced */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-white">
                            {teamStyle.logoUrl ? (
                                <img 
                                    src={teamStyle.logoUrl} 
                                    alt={`${team.name} logo`}
                                    className="w-full h-full object-contain p-2"
                                    style={{ opacity: teamStyle.logoOpacity || 1 }}
                                />
                            ) : (
                                <div 
                                    className="w-full h-full flex items-center justify-center rounded-xl"
                                    style={{ backgroundColor: teamStyle.primaryColor || '#dc2626' }}
                                >
                                    <LacrosseIcon name="stick" style={{fontSize: '32px', color: 'white'}} />
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
                {activeTab === 'home' && <TeamHomeTab team={team} />}
                {activeTab === 'schedule' && <TeamScheduleTab team={team} events={events} />}
                {activeTab === 'roster' && <TeamRosterTab team={team} players={players} />}
                {activeTab === 'stats' && <TeamStatsTab team={team} events={events} />}
                {activeTab === 'media' && <TeamMediaTab team={team} />}
                {activeTab === 'contact' && <TeamContactTab team={team} />}
            </div>
        </div>
    );
};

// Team Home Tab - Enhanced with Team Identity
const TeamHomeTab = ({ team }) => {
    const teamStyle = team.style || {};
    
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Team Identity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Team Logo Showcase */}
                <div className="text-center">
                    <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border-4 border-white shadow-xl bg-white mb-4">
                        {teamStyle.logoUrl ? (
                            <img 
                                src={teamStyle.logoUrl} 
                                alt={`${team.name} logo`}
                                className="w-full h-full object-contain p-3"
                            />
                        ) : (
                            <div 
                                className="w-full h-full flex items-center justify-center rounded-xl"
                                style={{ backgroundColor: teamStyle.primaryColor || '#dc2626' }}
                            >
                                <LacrosseIcon name="stick" style={{fontSize: '48px', color: 'white'}} />
                            </div>
                        )}
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: teamStyle.primaryColor || '#1f2937' }}>
                        {team.name}
                    </h3>
                    <p className="text-slate-600">{team.division || 'Field'} Division</p>
                </div>

                {/* Season Record */}
                <div 
                    className="p-6 rounded-lg text-center"
                    style={{ 
                        backgroundColor: teamStyle.backgroundColor || '#f8fafc',
                        border: `2px solid ${teamStyle.primaryColor || '#dc2626'}`
                    }}
                >
                    <h3 className="text-lg font-semibold mb-3" style={{ color: teamStyle.primaryColor || '#1f2937' }}>
                        Season Record
                    </h3>
                    <div className="text-4xl font-bold mb-2" style={{ color: teamStyle.primaryColor || '#1f2937' }}>
                        {team.wins || 0}-{team.losses || 0}
                        {(team.ties || 0) > 0 && `-${team.ties}`}
                    </div>
                    <div className="text-sm text-slate-600">
                        {((team.wins || 0) + (team.losses || 0) + (team.ties || 0))} games played
                    </div>
                </div>

                {/* Team Info */}
                <div 
                    className="p-6 rounded-lg"
                    style={{ backgroundColor: teamStyle.backgroundColor || '#f8fafc' }}
                >
                    <h3 className="text-lg font-semibold mb-3" style={{ color: teamStyle.primaryColor || '#1f2937' }}>
                        Team Details
                    </h3>
                    <div className="space-y-2 text-sm">
                        {team.coach && (
                            <div className="flex justify-between">
                                <span>Head Coach:</span>
                                <span className="font-semibold">{team.coach}</span>
                            </div>
                        )}
                        {team.homeField && (
                            <div className="flex justify-between">
                                <span>Home Field:</span>
                                <span className="font-semibold">{team.homeField}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>Division:</span>
                            <span className="font-semibold">{team.division || 'Field'}</span>
                        </div>
                        {team.contactEmail && (
                            <div className="flex justify-between">
                                <span>Contact:</span>
                                <span className="font-semibold text-xs">{team.contactEmail}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">Welcome to {team.name}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-lg">
                        <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-3">Season Overview</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Games Played:</span>
                                <span className="font-semibold">{(team.wins || 0) + (team.losses || 0) + (team.ties || 0)}</span>
                            </div>
                        <div className="flex justify-between">
                            <span>Wins:</span>
                            <span className="font-semibold text-green-600">{team.wins || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Losses:</span>
                            <span className="font-semibold text-red-600">{team.losses || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Ties:</span>
                            <span className="font-semibold text-yellow-600">{team.ties || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-lg">
                    <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-3">Team Info</h3>
                    <div className="space-y-2 text-sm">
                        <div><strong>Division:</strong> {team.division || 'Field'}</div>
                        <div><strong>Coach:</strong> <span className="break-words">{team.coach || 'TBD'}</span></div>
                        <div><strong>Home Field:</strong> <span className="break-words">{team.homeField || 'TBD'}</span></div>
                        <div><strong>Contact:</strong> <span className="break-words">{team.contactEmail || 'Not provided'}</span></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">Recent News</h3>
            <div className="bg-slate-50 p-4 rounded-lg text-center text-slate-500">
                <LacrosseIcon name="news" style={{fontSize: '32px'}} className="mx-auto mb-2" />
                <p>No recent news updates</p>
            </div>
        </div>
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
                                
                                {/* Team Logo Overlay */}
                                <div className="absolute top-3 left-3">
                                    <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-white">
                                        {team.style?.logoUrl ? (
                                            <img 
                                                src={team.style.logoUrl} 
                                                alt={team.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div 
                                                className="w-full h-full rounded-full flex items-center justify-center"
                                                style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}
                                            >
                                                <span className="text-white font-bold text-xs">
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
                                        <img 
                                            src={player.photoUrl} 
                                            alt={player.name}
                                            className="w-full h-full object-cover"
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
                                    
                                    {/* Team Logo Overlay - Enhanced with Card Border */}
                                    <div className="absolute top-3 left-3">
                                        <div 
                                            className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-3 border-white"
                                            style={{ 
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)'
                                            }}
                                        >
                                            {team.style?.logoUrl ? (
                                                <img 
                                                    src={team.style.logoUrl} 
                                                    alt={team.name}
                                                    className="w-full h-full object-contain p-1"
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

                                    {/* Jersey Number - Enhanced with Metallic Effect */}
                                    <div className="absolute bottom-3 right-3">
                                        <div 
                                            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-3 border-white"
                                            style={{ 
                                                background: `linear-gradient(135deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 50%, ${team.style?.primaryColor || '#2563eb'} 100%)`,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.1)'
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
    const teamEvents = events.filter(event => 
        event.teamIds?.includes(team.id) || 
        event.homeTeam === team.id || 
        event.awayTeam === team.id
    );

    const gamesPlayed = teamEvents.filter(e => e.type === 'game').length;
    const winPercentage = gamesPlayed > 0 ? ((team.wins || 0) / gamesPlayed * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{team.wins || 0}</div>
                        <div className="text-sm text-green-800">Wins</div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">{team.losses || 0}</div>
                        <div className="text-sm text-red-800">Losses</div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{winPercentage}%</div>
                        <div className="text-sm text-blue-800">Win Rate</div>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Season Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                        <div className="font-semibold text-slate-800">{gamesPlayed}</div>
                        <div className="text-slate-600">Games Played</div>
                    </div>
                    <div className="text-center">
                        <div className="font-semibold text-slate-800">{team.ties || 0}</div>
                        <div className="text-slate-600">Ties</div>
                    </div>
                    <div className="text-center">
                        <div className="font-semibold text-slate-800">{team.pf || 0}</div>
                        <div className="text-slate-600">Points For</div>
                    </div>
                    <div className="text-center">
                        <div className="font-semibold text-slate-800">{team.pa || 0}</div>
                        <div className="text-slate-600">Points Against</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Team Media Tab
const TeamMediaTab = ({ team }) => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Photos & Videos</h2>
        
        <div className="bg-slate-50 p-8 rounded-lg text-center text-slate-500">
            <LacrosseIcon name="view" style={{fontSize: '64px'}} className="mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Media Gallery Coming Soon</h3>
            <p>Team photos and videos will be displayed here</p>
            <div className="mt-4 text-xs text-slate-400">
                Features coming: Game highlights, team photos, action shots, celebrations
            </div>
        </div>
    </div>
);

// Team Contact Tab
const TeamContactTab = ({ team }) => {
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
    </div>
    );
};

export default TeamDetailPage;