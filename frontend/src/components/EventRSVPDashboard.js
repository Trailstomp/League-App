import React, { useState, useEffect } from 'react';

const EventRSVPDashboard = ({ eventId, eventTitle }) => {
    const [rsvps, setRsvps] = useState({ going: [], maybe: [], not_going: [], pending: [] });
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ going: 0, maybe: 0, not_going: 0, pending: 0, total: 0 });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadRSVPs();
    }, [eventId]);

    const loadRSVPs = async () => {
        try {
            setLoading(true);
            // Get all users for the event's teams
            const eventResponse = await fetch(`${backendUrl}/api/unified-events/${eventId}`);
            const event = await eventResponse.json();
            
            if (!event.teams || event.teams.length === 0) {
                setLoading(false);
                return;
            }

            // Get users from those teams
            const usersResponse = await fetch(`${backendUrl}/api/users`);
            const usersData = await usersResponse.json();
            const users = usersData.users || [];

            // Filter users by event teams
            const teamUsers = users.filter(u => 
                event.teams.includes(u.teamId) && 
                (u.status === 'active' || u.status === 'guest')
            );

            // Get RSVP responses
            const rsvpResponse = await fetch(`${backendUrl}/api/events/${eventId}/rsvps`);
            let rsvpData = { going: [], maybe: [], not_going: [] };
            
            if (rsvpResponse.ok) {
                const data = await rsvpResponse.json();
                rsvpData = {
                    going: data.details?.going || [],
                    maybe: data.details?.maybe || [],
                    not_going: data.details?.not_going || []
                };
            }

            // Categorize users
            const categorized = {
                going: [],
                maybe: [],
                not_going: [],
                pending: []
            };

            teamUsers.forEach(user => {
                const response = rsvpData.going.find(r => r.user_email === user.email) ? 'going' :
                               rsvpData.maybe.find(r => r.user_email === user.email) ? 'maybe' :
                               rsvpData.not_going.find(r => r.user_email === user.email) ? 'not_going' : 'pending';
                
                categorized[response].push(user);
            });

            setRsvps(categorized);
            setStats({
                going: categorized.going.length,
                maybe: categorized.maybe.length,
                not_going: categorized.not_going.length,
                pending: categorized.pending.length,
                total: teamUsers.length
            });

        } catch (error) {
            console.error('Error loading RSVPs:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold text-gray-800">RSVP Dashboard</h3>
                <p className="text-gray-600">{eventTitle}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
                    <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.going}</div>
                    <div className="text-xs md:text-sm text-gray-600">✅ Going</div>
                    <div className="text-xs text-gray-500 mt-1">{stats.total > 0 ? Math.round((stats.going / stats.total) * 100) : 0}%</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
                    <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.maybe}</div>
                    <div className="text-xs md:text-sm text-gray-600">❓ Maybe</div>
                    <div className="text-xs text-gray-500 mt-1">{stats.total > 0 ? Math.round((stats.maybe / stats.total) * 100) : 0}%</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                    <div className="text-2xl md:text-3xl font-bold text-red-600">{stats.not_going}</div>
                    <div className="text-xs md:text-sm text-gray-600">❌ Can't Make It</div>
                    <div className="text-xs text-gray-500 mt-1">{stats.total > 0 ? Math.round((stats.not_going / stats.total) * 100) : 0}%</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                    <div className="text-2xl md:text-3xl font-bold text-gray-600">{stats.pending}</div>
                    <div className="text-xs md:text-sm text-gray-600">⏳ No Response</div>
                    <div className="text-xs text-gray-500 mt-1">{stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%</div>
                </div>
            </div>

            {/* Response Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Going */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                        <span className="text-xl mr-2">✅</span>
                        Going ({stats.going})
                    </h4>
                    {rsvps.going.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No responses yet</p>
                    ) : (
                        <div className="space-y-2">
                            {rsvps.going.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                    <div>
                                        <div className="font-medium text-sm">{user.name}</div>
                                        <div className="text-xs text-gray-600">{user.teamName}</div>
                                    </div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Maybe */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h4 className="font-semibold text-yellow-600 mb-3 flex items-center">
                        <span className="text-xl mr-2">❓</span>
                        Maybe ({stats.maybe})
                    </h4>
                    {rsvps.maybe.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No responses yet</p>
                    ) : (
                        <div className="space-y-2">
                            {rsvps.maybe.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                                    <div>
                                        <div className="font-medium text-sm">{user.name}</div>
                                        <div className="text-xs text-gray-600">{user.teamName}</div>
                                    </div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Can't Make It */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h4 className="font-semibold text-red-600 mb-3 flex items-center">
                        <span className="text-xl mr-2">❌</span>
                        Can't Make It ({stats.not_going})
                    </h4>
                    {rsvps.not_going.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No responses yet</p>
                    ) : (
                        <div className="space-y-2">
                            {rsvps.not_going.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                                    <div>
                                        <div className="font-medium text-sm">{user.name}</div>
                                        <div className="text-xs text-gray-600">{user.teamName}</div>
                                    </div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* No Response */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h4 className="font-semibold text-gray-600 mb-3 flex items-center">
                        <span className="text-xl mr-2">⏳</span>
                        No Response ({stats.pending})
                    </h4>
                    {rsvps.pending.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Everyone has responded!</p>
                    ) : (
                        <div className="space-y-2">
                            {rsvps.pending.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div>
                                        <div className="font-medium text-sm">{user.name}</div>
                                        <div className="text-xs text-gray-600">{user.teamName}</div>
                                    </div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Tip</h4>
                <p className="text-sm text-blue-800">
                    Send reminders to users who haven't responded by clicking the "Send Notifications" button on the event.
                </p>
            </div>
        </div>
    );
};

export default EventRSVPDashboard;
