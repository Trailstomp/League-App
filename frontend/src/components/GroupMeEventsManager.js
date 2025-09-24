import React, { useState, useEffect } from 'react';
import { isAdmin, isCoach } from './PermissionsSystem';

const GroupMeEventsManager = ({ currentUser }) => {
    const [events, setEvents] = useState([]);
    const [channels, setChannels] = useState([]);
    const [eventNotifications, setEventNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [notificationForm, setNotificationForm] = useState({
        event_id: '',
        channel_ids: [],
        notification_type: 'event_announcement',
        include_rsvp: true,
        send_time: 'now'
    });
    const [activeTab, setActiveTab] = useState('overview');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadEvents(),
                loadChannels(),
                loadEventNotifications()
            ]);
        } catch (err) {
            setError('Failed to load data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadEvents = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/league-data`);
            if (response.ok) {
                const data = await response.json();
                // Filter for upcoming events
                const upcomingEvents = (data.leagueSchedule || []).filter(event => {
                    const eventDate = new Date(event.start_datetime);
                    const now = new Date();
                    return eventDate >= now;
                });
                setEvents(upcomingEvents);
            }
        } catch (err) {
            console.error('Error loading events:', err);
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

    const loadEventNotifications = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/groupme/event-notifications`);
            if (response.ok) {
                const data = await response.json();
                setEventNotifications(data.notifications || []);
            }
        } catch (err) {
            console.error('Error loading notifications:', err);
        }
    };

    const sendEventNotification = async () => {
        if (!notificationForm.event_id || notificationForm.channel_ids.length === 0) return;

        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/groupme/send-event-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notificationForm)
            });

            if (response.ok) {
                setSuccess('Event notification sent successfully!');
                setNotificationForm({
                    event_id: '',
                    channel_ids: [],
                    notification_type: 'event_announcement',
                    include_rsvp: true,
                    send_time: 'now'
                });
                setTimeout(() => setSuccess(''), 5000);
                loadEventNotifications();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to send notification');
            }
        } catch (err) {
            setError('Failed to send notification: ' + err.message);
            setTimeout(() => setError(''), 5000);
        } finally {
            setLoading(false);
        }
    };

    const getEventRSVPs = async (eventId) => {
        try {
            const response = await fetch(`${backendUrl}/api/groupme/events/${eventId}/rsvps`);
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (err) {
            console.error('Error loading RSVPs:', err);
        }
        return null;
    };

    const formatDateTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return dateString;
        }
    };

    const getEventTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'game': return '🏆';
            case 'practice': return '⚡';
            case 'meeting': return '📋';
            case 'tournament': return '🏅';
            default: return '📅';
        }
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            📅
                        </div>
                        <div className="ml-4">
                            <div className="text-2xl font-bold text-gray-900">{events.length}</div>
                            <div className="text-sm text-gray-600">Upcoming Events</div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            💬
                        </div>
                        <div className="ml-4">
                            <div className="text-2xl font-bold text-gray-900">{channels.length}</div>
                            <div className="text-sm text-gray-600">Active Channels</div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            📢
                        </div>
                        <div className="ml-4">
                            <div className="text-2xl font-bold text-gray-900">{eventNotifications.length}</div>
                            <div className="text-sm text-gray-600">Sent Notifications</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Events with RSVP Status */}
            <div className="bg-white rounded-lg shadow border">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Recent Events & RSVP Status</h3>
                </div>
                <div className="p-6">
                    {events.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            No upcoming events found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.slice(0, 5).map((event) => (
                                <EventRSVPSummary 
                                    key={event.id} 
                                    event={event} 
                                    getEventRSVPs={getEventRSVPs}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderSendNotification = () => (
        <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold mb-6">Send Event Notification</h3>
            
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {success}
                </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); sendEventNotification(); }} className="space-y-6">
                {/* Event Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Event
                    </label>
                    <select
                        value={notificationForm.event_id}
                        onChange={(e) => setNotificationForm({...notificationForm, event_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    >
                        <option value="">Choose an event...</option>
                        {events.map((event) => (
                            <option key={event.id} value={event.id}>
                                {getEventTypeIcon(event.type)} {event.title} - {formatDateTime(event.start_datetime)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Channel Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Channels
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
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
                                <div className="flex items-center">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
                                        {channel.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm">{channel.name}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Notification Type */}
                <div>
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
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="include_rsvp"
                        checked={notificationForm.include_rsvp}
                        onChange={(e) => setNotificationForm({...notificationForm, include_rsvp: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="include_rsvp" className="text-sm text-gray-700">
                        Include RSVP instructions in message
                    </label>
                </div>

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={loading || !notificationForm.event_id || notificationForm.channel_ids.length === 0}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        loading || !notificationForm.event_id || notificationForm.channel_ids.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {loading ? 'Sending...' : '📢 Send Notification'}
                </button>
            </form>
        </div>
    );

    if (!isAdmin(currentUser) && !isCoach(currentUser)) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                    <div className="text-lg font-medium mb-2">Access Restricted</div>
                    <div className="text-sm">This feature is only available to administrators and coaches.</div>
                </div>
            </div>
        );
    }

    if (loading && events.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading GroupMe events integration...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">GroupMe Events Integration</h2>
                <p className="text-gray-600">Manage event notifications and track RSVPs through GroupMe</p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6 border-b">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        📊 Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'send'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        📢 Send Notification
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'send' && renderSendNotification()}
        </div>
    );
};

// Component for displaying RSVP summary for each event
const EventRSVPSummary = ({ event, getEventRSVPs }) => {
    const [rsvpData, setRSVPData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadRSVPs();
    }, [event.id]);

    const loadRSVPs = async () => {
        setLoading(true);
        const data = await getEventRSVPs(event.id);
        setRSVPData(data);
        setLoading(false);
    };

    const formatDateTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return dateString;
        }
    };

    const getEventTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'game': return '🏆';
            case 'practice': return '⚡';
            case 'meeting': return '📋';
            case 'tournament': return '🏅';
            default: return '📅';
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                            {event.type || 'event'}
                        </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                        📅 {formatDateTime(event.start_datetime)}
                        {event.location && <span className="ml-4">📍 {event.location}</span>}
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    {loading ? (
                        <div className="text-sm text-gray-500">Loading RSVPs...</div>
                    ) : rsvpData ? (
                        <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span>{rsvpData.summary?.attending_count || 0} Yes</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                <span>{rsvpData.summary?.not_attending_count || 0} No</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                <span>{rsvpData.summary?.maybe_count || 0} Maybe</span>
                            </div>
                            <div className="text-gray-500">
                                ({rsvpData.summary?.total_responses || 0} total)
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400">No RSVPs yet</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupMeEventsManager;