import React, { useState, useEffect } from 'react';

/**
 * MyDashboardTab - Personal player/coach dashboard showing upcoming events and stats
 */
const MyDashboardTab = ({ team, currentUser }) => {
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team?.id]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team?.id}/events`);
            if (response.ok) {
                const events = await response.json();
                const now = new Date();
                const upcoming = (events || [])
                    .filter(e => new Date(e.date + 'T00:00:00') >= now && e.status !== 'canceled')
                    .sort((a, b) => new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00'))
                    .slice(0, 5);
                setUpcomingEvents(upcoming);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Get player's team assignment info
    const teamAssignment = currentUser?.teamAssignments?.find(a => a.teamId === team?.id) || {};

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">My Dashboard</h2>
            
            {/* Player Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-4">
                    <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                        style={{ backgroundColor: team?.style?.primaryColor || '#2563eb' }}
                    >
                        {teamAssignment.playerNumber || currentUser?.jerseyNumber || '?'}
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">{currentUser?.name}</h3>
                        <p className="text-slate-600">
                            {teamAssignment.position || currentUser?.position || 'Player'} • {team?.name}
                        </p>
                        {currentUser?.roles?.includes('coach') && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                                Coach
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            {(currentUser?.goals > 0 || currentUser?.assists > 0) && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border text-center">
                        <div className="text-3xl font-bold text-blue-600">{currentUser?.goals || 0}</div>
                        <div className="text-sm text-slate-500">Goals</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border text-center">
                        <div className="text-3xl font-bold text-green-600">{currentUser?.assists || 0}</div>
                        <div className="text-sm text-slate-500">Assists</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border text-center">
                        <div className="text-3xl font-bold text-purple-600">{(currentUser?.goals || 0) + (currentUser?.assists || 0)}</div>
                        <div className="text-sm text-slate-500">Points</div>
                    </div>
                </div>
            )}

            {/* Upcoming Events */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b">
                    <h3 className="font-semibold text-slate-800">📅 Upcoming Events</h3>
                </div>
                {upcomingEvents.length > 0 ? (
                    <div className="divide-y">
                        {upcomingEvents.map((event, index) => (
                            <div key={event.id || index} className="p-4 hover:bg-slate-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-slate-800">{event.title || event.name}</h4>
                                        <p className="text-sm text-slate-500">
                                            {new Date(event.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                            {event.time && ` at ${event.time}`}
                                        </p>
                                        {event.location && (
                                            <p className="text-sm text-slate-500">📍 {event.location}</p>
                                        )}
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        event.type === 'game' ? 'bg-red-100 text-red-700' :
                                        event.type === 'practice' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                    }`}>
                                        {event.type || 'Event'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        <p>No upcoming events</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyDashboardTab;
