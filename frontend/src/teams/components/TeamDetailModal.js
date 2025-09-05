import React, { useState } from 'react';
import { LacrosseIcon } from '../../components/LacrosseIcons';

// Icons
const X = ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const TeamDetailModal = ({
    team,
    teams = [],
    events = [],
    currentUser,
    isOpen,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!isOpen || !team) return null;

    // Get team-related events
    const teamEvents = events.filter(event => 
        event.teamId === team.id || 
        event.homeTeam === team.id || 
        event.awayTeam === team.id ||
        (event.teamIds && event.teamIds.includes(team.id))
    );

    const upcomingEvents = teamEvents.filter(event => 
        new Date(event.date) >= new Date()
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    const recentEvents = teamEvents.filter(event => 
        new Date(event.date) < new Date()
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate team stats
    const stats = {
        totalGames: teamEvents.filter(e => e.type === 'game').length,
        wins: team.wins || 0,
        losses: team.losses || 0,
        ties: team.ties || 0,
        upcomingGames: upcomingEvents.filter(e => e.type === 'game').length,
        practices: teamEvents.filter(e => e.type === 'practice').length,
        tournaments: teamEvents.filter(e => e.type === 'tournament').length
    };

    const winPercentage = stats.totalGames > 0 ? 
        ((stats.wins / stats.totalGames) * 100).toFixed(1) : '0.0';

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'venue' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'roster', label: 'Roster', icon: 'players' },
        { id: 'stats', label: 'Statistics', icon: 'trophy' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                                <LacrosseIcon name="stick" className="text-blue-600" style={{fontSize: '32px'}} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">{team.name}</h2>
                                <p className="text-blue-100 mt-1">
                                    Founded {team.founded || '2024'} • {team.location || 'League Team'}
                                </p>
                                <div className="flex items-center space-x-4 mt-2">
                                    <span className="bg-blue-800 px-2 py-1 rounded text-sm">
                                        {stats.wins}-{stats.losses}-{stats.ties}
                                    </span>
                                    <span className="text-blue-100 text-sm">
                                        {winPercentage}% Win Rate
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-white hover:text-blue-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b">
                    <div className="flex space-x-8 px-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <LacrosseIcon name={tab.icon} className="mr-2" style={{fontSize: '16px'}} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto max-h-96">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
                                    <div className="text-sm text-slate-600">Games Played</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
                                    <div className="text-sm text-slate-600">Wins</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
                                    <div className="text-sm text-slate-600">Losses</div>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{stats.ties}</div>
                                    <div className="text-sm text-slate-600">Ties</div>
                                </div>
                            </div>

                            {/* Team Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Team Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Coach:</span>
                                            <span className="font-medium">{team.coach || 'TBD'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Contact:</span>
                                            <span className="font-medium">{team.contactEmail || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Home Field:</span>
                                            <span className="font-medium">{team.homeField || 'TBD'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Status:</span>
                                            <span className={`font-medium ${team.active !== false ? 'text-green-600' : 'text-red-600'}`}>
                                                {team.active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Recent Activity</h3>
                                    {recentEvents.slice(0, 3).length > 0 ? (
                                        <div className="space-y-2">
                                            {recentEvents.slice(0, 3).map(event => (
                                                <div key={event.id} className="flex items-center space-x-3 text-sm">
                                                    <LacrosseIcon 
                                                        name={event.type === 'game' ? 'trophy' : event.type === 'practice' ? 'time' : 'calendar'} 
                                                        className="text-slate-400" 
                                                        style={{fontSize: '14px'}} 
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-slate-800">{event.title}</div>
                                                        <div className="text-slate-500">
                                                            {new Date(event.date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-sm">No recent activity</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-800">Team Schedule</h3>
                            
                            {/* Upcoming Events */}
                            {upcomingEvents.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-slate-700 mb-3">Upcoming Events</h4>
                                    <div className="space-y-2">
                                        {upcomingEvents.map(event => (
                                            <div key={event.id} className="border rounded-lg p-3 hover:bg-slate-50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-medium text-slate-800">{event.title}</div>
                                                        <div className="text-sm text-slate-600">
                                                            {new Date(event.date).toLocaleDateString()} • {event.time}
                                                        </div>
                                                        <div className="text-sm text-slate-500">{event.location}</div>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        event.type === 'game' ? 'bg-blue-100 text-blue-800' :
                                                        event.type === 'practice' ? 'bg-green-100 text-green-800' :
                                                        event.type === 'tournament' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-slate-100 text-slate-800'
                                                    }`}>
                                                        {event.type.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Events */}
                            {recentEvents.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-slate-700 mb-3">Recent Events</h4>
                                    <div className="space-y-2">
                                        {recentEvents.slice(0, 5).map(event => (
                                            <div key={event.id} className="border rounded-lg p-3 opacity-75">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-medium text-slate-800">{event.title}</div>
                                                        <div className="text-sm text-slate-600">
                                                            {new Date(event.date).toLocaleDateString()} • {event.time}
                                                        </div>
                                                        <div className="text-sm text-slate-500">{event.location}</div>
                                                    </div>
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                        COMPLETED
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {teamEvents.length === 0 && (
                                <p className="text-slate-500 text-center py-8">No events scheduled for this team</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'roster' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-800">Team Roster</h3>
                            <div className="text-center py-8 text-slate-500">
                                <LacrosseIcon name="players" className="mx-auto mb-4" style={{fontSize: '48px'}} />
                                <p>Roster management coming soon</p>
                                <p className="text-sm">Player profiles and statistics will be available here</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-800">Team Statistics</h3>
                            <div className="text-center py-8 text-slate-500">
                                <LacrosseIcon name="trophy" className="mx-auto mb-4" style={{fontSize: '48px'}} />
                                <p>Detailed statistics coming soon</p>
                                <p className="text-sm">Performance metrics and analytics will be available here</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamDetailModal;