import React from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

const TeamScheduleTab = ({ team, events = [] }) => {
    const teamEvents = events.filter(event => 
        // Filter to team's events
        (event.teamIds?.includes(team.id) || 
        event.homeTeam === team.id || 
        event.awayTeam === team.id) &&
        // Exclude canceled/cancelled events
        event.status !== 'canceled' &&
        event.status !== 'cancelled' &&
        event.status !== 'archived'
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

export default TeamScheduleTab;
