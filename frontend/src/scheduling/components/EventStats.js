import React from 'react';
import { Calendar, Users, Trophy, Clock } from 'lucide-react';

/**
 * Event Statistics - Quick overview of scheduling data
 */
const EventStats = ({ leagueSchedule = [], teams = [] }) => {
    
    // Calculate stats
    const totalEvents = leagueSchedule.length;
    const gameEvents = leagueSchedule.filter(e => e.type === 'game').length;
    const practiceEvents = leagueSchedule.filter(e => e.type === 'practice').length;
    const tournamentEvents = leagueSchedule.filter(e => e.type === 'tournament').length;
    
    // Events with teams
    const eventsWithTeams = leagueSchedule.filter(e => e.teamIds && e.teamIds.length > 0).length;
    
    // Upcoming events (events with dates in the future)
    const today = new Date().toISOString().split('T')[0];
    const upcomingEvents = leagueSchedule.filter(e => e.date && e.date >= today).length;
    
    // Most active teams
    const teamEventCounts = {};
    leagueSchedule.forEach(event => {
        if (event.teamIds && event.teamIds.length > 0) {
            event.teamIds.forEach(teamId => {
                teamEventCounts[teamId] = (teamEventCounts[teamId] || 0) + 1;
            });
        }
    });
    
    const mostActiveTeamId = Object.keys(teamEventCounts).reduce((a, b) => 
        teamEventCounts[a] > teamEventCounts[b] ? a : b, null
    );
    
    const mostActiveTeam = mostActiveTeamId ? teams.find(t => t.id === mostActiveTeamId) : null;

    const stats = [
        {
            title: 'Total Events',
            value: totalEvents,
            icon: Calendar,
            color: 'blue',
            description: `${upcomingEvents} upcoming`
        },
        {
            title: 'Games',
            value: gameEvents,
            icon: Trophy,
            color: 'green',
            description: `${Math.round((gameEvents / totalEvents) * 100) || 0}% of events`
        },
        {
            title: 'Practices',
            value: practiceEvents,
            icon: Clock,
            color: 'orange',
            description: `${Math.round((practiceEvents / totalEvents) * 100) || 0}% of events`
        },
        {
            title: 'Events with Teams',
            value: eventsWithTeams,
            icon: Users,
            color: 'purple',
            description: `${Math.round((eventsWithTeams / totalEvents) * 100) || 0}% assigned`
        }
    ];

    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800 border-blue-200',
        green: 'bg-green-100 text-green-800 border-green-200',
        orange: 'bg-orange-100 text-orange-800 border-orange-200',
        purple: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    return (
        <div className="event-stats">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map(stat => {
                    const IconComponent = stat.icon;
                    return (
                        <div key={stat.title} className={`p-4 rounded-lg border ${colorClasses[stat.color]}`}>
                            <div className="flex items-center justify-between mb-2">
                                <IconComponent size={20} />
                                <span className="text-2xl font-bold">{stat.value}</span>
                            </div>
                            <div className="text-sm font-medium mb-1">{stat.title}</div>
                            <div className="text-xs opacity-75">{stat.description}</div>
                        </div>
                    );
                })}
            </div>

            {/* Most Active Team */}
            {mostActiveTeam && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Most Active Team</h3>
                    <div className="flex items-center">
                        {mostActiveTeam.style?.logoUrl && (
                            <img 
                                src={mostActiveTeam.style.logoUrl} 
                                alt={mostActiveTeam.name}
                                className="w-6 h-6 rounded mr-2"
                            />
                        )}
                        <span className="font-medium">{mostActiveTeam.name}</span>
                        <span className="ml-2 text-sm text-gray-600">
                            ({teamEventCounts[mostActiveTeamId]} events)
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventStats;