import React, { useState, useEffect } from 'react';

const EventRSVP = ({ eventId, currentUser }) => {
    const [rsvps, setRsvps] = useState({ summary: { going: 0, not_going: 0, maybe: 0, total: 0 }, details: { going: [], not_going: [], maybe: [] }});
    const [userRsvp, setUserRsvp] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadRSVPs();
    }, [eventId]);

    const loadRSVPs = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/events/${eventId}/rsvps`);
            if (response.ok) {
                const data = await response.json();
                setRsvps(data);
                
                // Find current user's RSVP
                if (currentUser) {
                    const myRsvp = data.rsvps?.find(r => r.user_id === currentUser.id);
                    setUserRsvp(myRsvp?.response || null);
                }
            }
        } catch (error) {
            console.error('Error loading RSVPs:', error);
        }
    };

    const handleRSVP = async (response) => {
        if (!currentUser) {
            alert('Please log in to RSVP');
            return;
        }

        try {
            setLoading(true);
            const rsvpResponse = await fetch(`${BACKEND_URL}/api/events/${eventId}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    user_name: currentUser.name,
                    response: response
                })
            });

            if (rsvpResponse.ok) {
                setUserRsvp(response);
                await loadRSVPs(); // Reload to get updated counts
            } else {
                alert('Failed to save RSVP');
            }
        } catch (error) {
            console.error('Error saving RSVP:', error);
            alert('Failed to save RSVP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">RSVP</h4>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
            </div>

            {/* RSVP Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                    onClick={() => handleRSVP('going')}
                    disabled={loading}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        userRsvp === 'going'
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-green-300 text-green-700 hover:bg-green-50'
                    } disabled:opacity-50`}
                >
                    ✓ Going
                </button>
                <button
                    onClick={() => handleRSVP('maybe')}
                    disabled={loading}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        userRsvp === 'maybe'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-white border border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                    } disabled:opacity-50`}
                >
                    ? Maybe
                </button>
                <button
                    onClick={() => handleRSVP('not_going')}
                    disabled={loading}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        userRsvp === 'not_going'
                            ? 'bg-red-600 text-white'
                            : 'bg-white border border-red-300 text-red-700 hover:bg-red-50'
                    } disabled:opacity-50`}
                >
                    ✗ Can't Go
                </button>
            </div>

            {/* Summary */}
            <div className="flex justify-around text-center text-sm">
                <div>
                    <div className="font-bold text-green-600">{rsvps.summary.going}</div>
                    <div className="text-gray-600">Going</div>
                </div>
                <div>
                    <div className="font-bold text-yellow-600">{rsvps.summary.maybe}</div>
                    <div className="text-gray-600">Maybe</div>
                </div>
                <div>
                    <div className="font-bold text-red-600">{rsvps.summary.not_going}</div>
                    <div className="text-gray-600">Can't Go</div>
                </div>
            </div>

            {/* Detailed List */}
            {showDetails && (
                <div className="mt-4 space-y-3 border-t border-gray-200 pt-3">
                    {rsvps.details.going.length > 0 && (
                        <div>
                            <div className="font-medium text-green-700 mb-1">Going ({rsvps.details.going.length})</div>
                            <div className="text-sm text-gray-600">
                                {rsvps.details.going.map(r => r.user_name).join(', ')}
                            </div>
                        </div>
                    )}
                    {rsvps.details.maybe.length > 0 && (
                        <div>
                            <div className="font-medium text-yellow-700 mb-1">Maybe ({rsvps.details.maybe.length})</div>
                            <div className="text-sm text-gray-600">
                                {rsvps.details.maybe.map(r => r.user_name).join(', ')}
                            </div>
                        </div>
                    )}
                    {rsvps.details.not_going.length > 0 && (
                        <div>
                            <div className="font-medium text-red-700 mb-1">Can't Go ({rsvps.details.not_going.length})</div>
                            <div className="text-sm text-gray-600">
                                {rsvps.details.not_going.map(r => r.user_name).join(', ')}
                            </div>
                        </div>
                    )}
                    {rsvps.summary.total === 0 && (
                        <div className="text-sm text-gray-500 text-center py-2">
                            No RSVPs yet. Be the first!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventRSVP;
