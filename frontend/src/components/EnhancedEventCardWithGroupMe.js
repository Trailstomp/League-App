import React, { useState, useEffect } from 'react';
import { isAdmin, isCoach } from './PermissionsSystem';

const EnhancedEventCardWithGroupMe = ({ event, showRSVP = true, currentUser }) => {
    const [showRSVPModal, setShowRSVPModal] = useState(false);
    const [rsvpData, setRSVPData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showSendNotification, setShowSendNotification] = useState(false);
    const [channels, setChannels] = useState([]);
    const [notificationForm, setNotificationForm] = useState({
        channel_ids: [],
        notification_type: 'event_announcement',
        include_rsvp: true
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

    useEffect(() => {
        if (showRSVPModal) {
            loadRSVPData();
        }
        if (showSendNotification) {
            loadChannels();
        }
    }, [showRSVPModal, showSendNotification]);

    const loadRSVPData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/groupme/events/${event.id}/rsvp-summary`);
            if (response.ok) {
                const data = await response.json();
                setRSVPData(data);
            }
        } catch (err) {
            console.error('Error loading RSVP data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadChannels = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/groupme/channels?active_only=true`);
            if (response.ok) {
                const data = await response.json();
                setChannels(data.channels || []);
            }
        } catch (err) {
            console.error('Error loading channels:', err);
        }
    };

    const sendEventNotification = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('event_id', event.id);
            formData.append('channel_ids', JSON.stringify(notificationForm.channel_ids));
            formData.append('notification_type', notificationForm.notification_type);
            formData.append('include_rsvp', notificationForm.include_rsvp);

            const response = await fetch(`${backendUrl}/api/groupme/send-event-notification`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                setShowSendNotification(false);
                setNotificationForm({
                    channel_ids: [],
                    notification_type: 'event_announcement',
                    include_rsvp: true
                });
                // Show success message (you could add a toast notification here)
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
                {/* Event Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-xl">{getEventIcon(event.type)}</span>
                                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <span className="mr-1">📅</span>
                                    {formatDate(event.start_datetime)}
                                </div>
                                <div className="flex items-center">
                                    <span className="mr-1">🕒</span>
                                    {formatTime(event.start_datetime)}
                                </div>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                            {event.type || 'Event'}
                        </div>
                    </div>

                    {/* Admin Actions */}
                    {(isAdmin(currentUser) || isCoach(currentUser)) && (
                        <div className="mt-3 flex space-x-2">
                            <button
                                onClick={() => setShowSendNotification(true)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors flex items-center space-x-1"
                            >
                                <span>📢</span>
                                <span>Send Notification</span>
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
                        </div>
                    )}
                </div>

                {/* Event Details */}
                <div className="p-4">
                    {event.location && (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                            <span className="mr-2">📍</span>
                            {event.location}
                        </div>
                    )}
                    
                    {event.description && (
                        <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 mb-3">
                            {event.description}
                        </div>
                    )}

                    {/* Quick RSVP Status (for everyone) */}
                    {showRSVP && (
                        <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm">
                                    <div className="flex items-center text-blue-600">
                                        <span className="mr-1">💬</span>
                                        <span className="font-medium">RSVP via GroupMe</span>
                                    </div>
                                </div>
                                <div className="text-xs text-blue-600">
                                    Reply with: <code className="bg-blue-100 px-1 rounded">/rsvp yes</code>
                                </div>
                            </div>
                        </div>
                    )}
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
                                            {rsvpData.rsvp_summary.total_responses}
                                        </div>
                                        <div className="text-sm text-gray-600">Total</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-700">
                                            {rsvpData.rsvp_summary.attending_count}
                                        </div>
                                        <div className="text-sm text-green-600">Yes</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-2xl font-bold text-red-700">
                                            {rsvpData.rsvp_summary.not_attending_count}
                                        </div>
                                        <div className="text-sm text-red-600">No</div>
                                    </div>
                                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                        <div className="text-2xl font-bold text-yellow-700">
                                            {rsvpData.rsvp_summary.maybe_count}
                                        </div>
                                        <div className="text-sm text-yellow-600">Maybe</div>
                                    </div>
                                </div>

                                {/* RSVP Lists */}
                                <div className="space-y-4">
                                    {/* Attending */}
                                    {rsvpData.rsvp_summary.attending.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-green-700 mb-2 flex items-center">
                                                <span className="mr-2">✅</span>
                                                Attending ({rsvpData.rsvp_summary.attending.length})
                                            </h4>
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {rsvpData.rsvp_summary.attending.map((rsvp, index) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                                                            {rsvp.user_name || rsvp.groupme_user_name || 'Unknown'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Not Attending */}
                                    {rsvpData.rsvp_summary.not_attending.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-red-700 mb-2 flex items-center">
                                                <span className="mr-2">❌</span>
                                                Not Attending ({rsvpData.rsvp_summary.not_attending.length})
                                            </h4>
                                            <div className="bg-red-50 rounded-lg p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {rsvpData.rsvp_summary.not_attending.map((rsvp, index) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-sm rounded">
                                                            {rsvp.user_name || rsvp.groupme_user_name || 'Unknown'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Maybe */}
                                    {rsvpData.rsvp_summary.maybe.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-yellow-700 mb-2 flex items-center">
                                                <span className="mr-2">❓</span>
                                                Maybe ({rsvpData.rsvp_summary.maybe.length})
                                            </h4>
                                            <div className="bg-yellow-50 rounded-lg p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {rsvpData.rsvp_summary.maybe.map((rsvp, index) => (
                                                        <span key={index} className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                                                            {rsvp.user_name || rsvp.groupme_user_name || 'Unknown'}
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

            {/* Send Notification Modal */}
            {showSendNotification && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">📢 Send Event Notification</h3>
                            <button
                                onClick={() => setShowSendNotification(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Channel Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Channels
                            </label>
                            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                                {channels.map((channel) => (
                                    <label key={channel.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                        <input
                                            type="checkbox"
                                            checked={notificationForm.channel_ids.includes(channel.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setNotificationForm({
                                                        ...notificationForm,
                                                        channel_ids: [...notificationForm.channel_ids, channel.id]
                                                    });
                                                } else {
                                                    setNotificationForm({
                                                        ...notificationForm,
                                                        channel_ids: notificationForm.channel_ids.filter(id => id !== channel.id)
                                                    });
                                                }
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm">{channel.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Notification Type */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notification Type
                            </label>
                            <select
                                value={notificationForm.notification_type}
                                onChange={(e) => setNotificationForm({...notificationForm, notification_type: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="event_announcement">📢 Event Announcement</option>
                                <option value="rsvp_reminder">📋 RSVP Reminder</option>
                                <option value="event_update">✏️ Event Update</option>
                                <option value="last_call">⏰ Last Call for RSVPs</option>
                            </select>
                        </div>

                        {/* Include RSVP */}
                        <div className="mb-6 flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="include_rsvp"
                                checked={notificationForm.include_rsvp}
                                onChange={(e) => setNotificationForm({...notificationForm, include_rsvp: e.target.checked})}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="include_rsvp" className="text-sm text-gray-700">
                                Include RSVP instructions
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowSendNotification(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendEventNotification}
                                disabled={loading || notificationForm.channel_ids.length === 0}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                                    loading || notificationForm.channel_ids.length === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {loading ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EnhancedEventCardWithGroupMe;