import React, { useState, useEffect } from 'react';
import { isAdmin, isCoach } from './PermissionsSystem';

const EnhancedEventCardWithGroupMe = ({ event, showRSVP = true, currentUser, onEnterStats }) => {
    const [showRSVPModal, setShowRSVPModal] = useState(false);
    const [rsvpData, setRSVPData] = useState(null);
    const [loading, setLoading] = useState(false);
    // Removed unused notification modal state

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

    useEffect(() => {
        if (showRSVPModal) {
            loadRSVPData();
        }
    }, [showRSVPModal]);

    // Load RSVP data on component mount to display counts on cards
    useEffect(() => {
        if (showRSVP && event.id) {
            loadRSVPData();
        }
    }, [event.id, showRSVP]);

    const loadRSVPData = async () => {
        try {
            setLoading(true);
            console.log('📊 Loading RSVP data for event:', event.id);
            const response = await fetch(`${backendUrl}/api/events/${event.id}/rsvps`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ RSVP data loaded:', data);
                setRSVPData(data);
            } else {
                console.error('❌ Failed to load RSVP data:', response.status);
            }
        } catch (err) {
            console.error('❌ Error loading RSVP data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Removed unused loadChannels function

    const sendEventNotification = async () => {
        try {
            setLoading(true);
            
            // Use the WORKING notification endpoint (same as event creation)
            const response = await fetch(`${backendUrl}/api/events/${event.id}/send-notification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'event_announcement',
                    message: `📢 Event Reminder: ${event.title}`,
                    channel_ids: [] // Send to all active channels
                })
            });

            if (response.ok) {
                alert('Event notification sent successfully!');
            } else {
                const errorData = await response.json();
                alert('Failed to send notification: ' + (errorData.detail || 'Unknown error'));
            }
        } catch (err) {
            alert('Failed to send notification: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return 'TBD';
        }
    };

    const getEventTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'game':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'practice':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'meeting':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'tournament':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getEventIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'game': return '🏆';
            case 'practice': return '⚡';
            case 'meeting': return '📋';
            case 'tournament': return '🏅';
            default: return '📅';
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* New Layout: Logo | Info | Teams */}
                <div className="p-4 flex gap-4">
                    {/* Left: Event Icon/Logo */}
                    <div className="flex-shrink-0">
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl ${getEventTypeColor(event.type)} border-2`}>
                            {getEventIcon(event.type)}
                        </div>
                    </div>

                    {/* Middle: Event Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{event.title}</h3>
                            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getEventTypeColor(event.type)}`}>
                                {event.type || 'Event'}
                            </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                                <span className="mr-2">📅</span>
                                {formatDate(event.start_datetime)}
                                <span className="mx-2">•</span>
                                <span className="mr-1">🕒</span>
                                {formatTime(event.start_datetime)}
                            </div>
                            {event.location && (
                                <div className="flex items-center">
                                    <span className="mr-2">📍</span>
                                    <span className="truncate">{event.location}</span>
                                </div>
                            )}
                        </div>

                        {event.description && (
                            <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2 line-clamp-2">
                                {event.description}
                            </div>
                        )}

                        {/* Admin Actions */}
                        {(isAdmin(currentUser) || isCoach(currentUser)) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    onClick={sendEventNotification}
                                    disabled={loading}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors flex items-center space-x-1 disabled:opacity-50"
                                >
                                    <span>📢</span>
                                    <span>{loading ? 'Sending...' : 'Send Notification'}</span>
                                </button>
                                {showRSVP && (
                                    <button
                                        onClick={() => setShowRSVPModal(true)}
                                        className="px-3 py-1 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 transition-colors flex items-center space-x-1"
                                    >
                                        <span>📋</span>
                                        <span>View RSVPs</span>
                                    </button>
                                )}
                                {onEnterStats && (event.type === 'game' || event.type === 'Game') && (
                                    <button
                                        onClick={onEnterStats}
                                        className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full hover:bg-purple-700 transition-colors flex items-center space-x-1"
                                    >
                                        <span>📊</span>
                                        <span>Enter Stats</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Teams Attending */}
                    <div className="flex-shrink-0 w-32 border-l pl-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Teams</div>
                        <div className="space-y-2">
                            {event.teamIds && event.teamIds.length > 0 ? (
                                event.teamIds.map((teamId, idx) => {
                                    const teamName = event.teamNames?.[idx] || `Team ${idx + 1}`;
                                    return (
                                        <div key={teamId} className="flex items-center text-xs">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${idx === 0 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                            <span className="truncate text-gray-700">{teamName}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-xs text-gray-400 italic">No teams</div>
                            )}
                        </div>

                        {/* Quick RSVP Count */}
                        {showRSVP && (
                            <div className="mt-3 pt-3 border-t">
                                <div className="text-xs text-gray-500">RSVPs</div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-green-600 text-xs font-semibold">
                                        {rsvpData?.summary?.going || 0} Yes
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                        {rsvpData?.summary?.total || 0} total
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RSVP Modal */}
            {showRSVPModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                📋 RSVPs for {event.title}
                            </h3>
                            <button
                                onClick={() => setShowRSVPModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="text-gray-500">Loading RSVP data...</div>
                            </div>
                        ) : rsvpData ? (
                            <div className="space-y-6">
                                {/* Summary */}
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {rsvpData.summary.total}
                                        </div>
                                        <div className="text-sm text-gray-600">Total</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-700">
                                            {rsvpData.summary.going}
                                        </div>
                                        <div className="text-sm text-green-600">Yes</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-2xl font-bold text-red-700">
                                            {rsvpData.summary.not_going}
                                        </div>
                                        <div className="text-sm text-red-600">No</div>
                                    </div>
                                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                        <div className="text-2xl font-bold text-yellow-700">
                                            {rsvpData.summary.maybe}
                                        </div>
                                        <div className="text-sm text-yellow-600">Maybe</div>
                                    </div>
                                </div>

                                {/* RSVP Lists */}
                                <div className="space-y-4">
                                    {/* Attending */}
                                    {rsvpData.details.going.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-green-700 mb-2 flex items-center">
                                                <span className="mr-2">✅</span>
                                                Going ({rsvpData.details.going.length})
                                            </h4>
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {rsvpData.details.going.map((rsvp, index) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                                                            {rsvp.user_name || 'Unknown User'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Not Attending */}
                                    {rsvpData.details.not_going.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-red-700 mb-2 flex items-center">
                                                <span className="mr-2">❌</span>
                                                Not Going ({rsvpData.details.not_going.length})
                                            </h4>
                                            <div className="bg-red-50 rounded-lg p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {rsvpData.details.not_going.map((rsvp, index) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-sm rounded">
                                                            {rsvp.user_name || 'Unknown User'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Maybe */}
                                    {rsvpData.details.maybe.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-yellow-700 mb-2 flex items-center">
                                                <span className="mr-2">❓</span>
                                                Maybe ({rsvpData.details.maybe.length})
                                            </h4>
                                            <div className="bg-yellow-50 rounded-lg p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {rsvpData.details.maybe.map((rsvp, index) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                                                            {rsvp.user_name || 'Unknown User'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Notification History */}
                                {rsvpData.notifications && rsvpData.notifications.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">📢 Notification History</h4>
                                        <div className="space-y-2">
                                            {rsvpData.notifications.map((notification) => (
                                                <div key={notification.id} className="bg-gray-50 rounded p-3 text-sm">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium capitalize">
                                                            {notification.notification_type.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {new Date(notification.sent_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-600">
                                                        Sent to {notification.total_sent} channel{notification.total_sent !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-500">No RSVP data available</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Notification modal removed - now using direct button */}
        </>
    );
};

export default EnhancedEventCardWithGroupMe;