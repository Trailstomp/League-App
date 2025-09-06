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
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Welcome to {team.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">Season Overview</h3>
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
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">Team Info</h3>
                    <div className="space-y-2 text-sm">
                        <div><strong>Division:</strong> {team.division || 'Field'}</div>
                        <div><strong>Coach:</strong> {team.coach || 'TBD'}</div>
                        <div><strong>Home Field:</strong> {team.homeField || 'TBD'}</div>
                        <div><strong>Contact:</strong> {team.contactEmail || 'Not provided'}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Recent News</h3>
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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Roster</h2>
            
            {teamPlayers.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="border border-slate-200 px-4 py-2 text-left">#</th>
                                <th className="border border-slate-200 px-4 py-2 text-left">Name</th>
                                <th className="border border-slate-200 px-4 py-2 text-left">Position</th>
                                <th className="border border-slate-200 px-4 py-2 text-left">Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamPlayers.map(player => (
                                <tr key={player.id} className="hover:bg-slate-50">
                                    <td className="border border-slate-200 px-4 py-2 font-mono">{player.jerseyNumber || '--'}</td>
                                    <td className="border border-slate-200 px-4 py-2 font-semibold">{player.name}</td>
                                    <td className="border border-slate-200 px-4 py-2">{player.position || 'Not specified'}</td>
                                    <td className="border border-slate-200 px-4 py-2 text-sm text-slate-600">{player.email || player.phone || 'Not provided'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-slate-50 p-8 rounded-lg text-center text-slate-500">
                    <LacrosseIcon name="teams" style={{fontSize: '48px'}} className="mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No players registered</h3>
                    <p>Players will appear here once they're added to the roster</p>
                </div>
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