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
    const teamPlayers = players.filter(player => player.teamId === team.id);

    const getPositionColor = (position) => {
        switch (position?.toLowerCase()) {
            case 'attack':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'midfield':
            case 'midfielder':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'defense':
            case 'defender':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'goalie':
            case 'goalkeeper':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPositionIcon = (position) => {
        switch (position?.toLowerCase()) {
            case 'attack':
                return '⚔️';
            case 'midfield':
            case 'midfielder':
                return '🏃';
            case 'defense':
            case 'defender':
                return '🛡️';
            case 'goalie':
            case 'goalkeeper':
                return '🥅';
            default:
                return '🥍';
        }
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamPlayers.map(player => (
                        <div 
                            key={player.id} 
                            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 hover:border-slate-300"
                        >
                            {/* Player Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    {/* Jersey Number */}
                                    <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                                        style={{ 
                                            backgroundColor: team.style?.primaryColor || '#2563eb'
                                        }}
                                    >
                                        {player.jerseyNumber || '?'}
                                    </div>
                                    {/* Player Name */}
                                    <div>
                                        <h3 className="font-semibold text-slate-800 text-lg leading-tight">
                                            {player.name}
                                        </h3>
                                        <div className="text-xs text-slate-500 mt-1">
                                            Player ID: {player.id}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Position Badge */}
                                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPositionColor(player.position)}`}>
                                    <span className="mr-1">{getPositionIcon(player.position)}</span>
                                    {player.position || 'Unassigned'}
                                </div>
                            </div>

                            {/* Player Details */}
                            <div className="space-y-2">
                                {/* Contact Information */}
                                {(player.email || player.phone) && (
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <h4 className="text-xs font-medium text-slate-600 mb-2 uppercase tracking-wide">
                                            Contact Information
                                        </h4>
                                        <div className="space-y-1">
                                            {player.email && (
                                                <div className="flex items-center text-sm">
                                                    <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-slate-700 break-words">{player.email}</span>
                                                </div>
                                            )}
                                            {player.phone && (
                                                <div className="flex items-center text-sm">
                                                    <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span className="text-slate-700">{player.phone}</span>
                                                </div>
                                            )}
                                            {!player.email && !player.phone && (
                                                <div className="text-sm text-slate-500 italic">No contact info</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Player Status */}
                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-2 ${player.active !== false ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className={`text-xs font-medium ${player.active !== false ? 'text-green-700' : 'text-red-700'}`}>
                                            {player.active !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex space-x-1">
                                        <button 
                                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                            title="Edit Player"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button 
                                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                            title="View Player Stats"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
                                            </svg>
                                        </button>
                                    </div>
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