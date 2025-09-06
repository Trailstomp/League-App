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
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
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
                        {/* Team Logo */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                            {teamStyle.logoUrl ? (
                                <img 
                                    src={teamStyle.logoUrl} 
                                    alt={`${team.name} logo`}
                                    className="w-full h-full object-cover"
                                    style={{ opacity: teamStyle.logoOpacity || 1 }}
                                />
                            ) : (
                                <div 
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ backgroundColor: teamStyle.accentColor || '#dc2626' }}
                                >
                                    <LacrosseIcon name="stick" style={{fontSize: '24px', color: 'white'}} />
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

// Team Home Tab
const TeamHomeTab = ({ team }) => (
    <div className="space-y-4 sm:space-y-6">
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
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

                        {/* Details */}
                        {player.details && (
                            <div className="mb-4">
                                <h3 className="font-semibold text-slate-800 mb-2">Details</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{player.details}</p>
                            </div>
                        )}

                        {/* Contact & Additional Info */}
                        <div className="space-y-3 text-sm">
                            {player.email && (
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-slate-700">{player.email}</span>
                                </div>
                            )}
                            {player.phone && (
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="text-slate-700">{player.phone}</span>
                                </div>
                            )}
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
                            className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105"
                            onClick={() => setSelectedPlayer(player)}
                        >
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
                                        <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                                            <svg className="w-12 h-12 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                            </svg>
                                        </div>
                                    )}
                                    
                                    {/* Team Logo Overlay */}
                                    <div className="absolute top-2 left-2">
                                        <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden border border-white">
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
                                    <div className="absolute bottom-2 right-2">
                                        <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                                            style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}
                                        >
                                            {player.jerseyNumber || '?'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Player Info */}
                            <div className="p-3">
                                <h3 className="font-semibold text-slate-800 text-sm mb-1 truncate">
                                    {player.name}
                                </h3>
                                <div className="space-y-1">
                                    <div className={`text-xs font-medium ${getPositionColor(player.position)}`}>
                                        {player.position || 'Unassigned'}
                                    </div>
                                    {player.handedness && (
                                        <div className="text-xs text-slate-500">
                                            {player.handedness} Handed
                                        </div>
                                    )}
                                </div>
                            </div>
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
const TeamContactTab = ({ team }) => (
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

export default TeamDetailPage;