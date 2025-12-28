import React, { useState } from 'react';
import EventRSVPDashboard from '../EventRSVPDashboard';

const EventsList = ({ 
    events, 
    teams, 
    currentUser, 
    loading, 
    onEventSelect, 
    onEventUpdate,
    onCreateEvent,
    onManageTournament,
    onEnterScoring,
    onViewLive,
    onRefresh 
}) => {
    const [filter, setFilter] = useState('all'); // all, scheduled, in_progress, completed
    const [sortBy, setSortBy] = useState('date'); // date, title, type
    const [sendingNotifications, setSendingNotifications] = useState({});
    const [viewingRSVPs, setViewingRSVPs] = useState(null);
    const [changingStatus, setChangingStatus] = useState(null);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    const handleStatusChange = async (eventId, newStatus) => {
        try {
            const response = await fetch(`${backendUrl}/api/unified-events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setChangingStatus(null);
                if (onRefresh) onRefresh();
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            alert('Error updating status');
        }
    };

    const handleSendNotifications = async (eventId) => {
        try {
            setSendingNotifications(prev => ({ ...prev, [eventId]: true }));
            
            const response = await fetch(`${backendUrl}/api/events/${eventId}/send-email-notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (response.ok) {
                alert('✅ Notifications sent successfully!');
            } else {
                const error = await response.json();
                alert(`❌ Failed to send: ${error.detail}`);
            }
        } catch (error) {
            alert('❌ Error sending notifications');
        } finally {
            setSendingNotifications(prev => ({ ...prev, [eventId]: false }));
        }
    };

    // Get team name by ID
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    // Get team logo by ID
    const getTeamLogo = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team?.style?.logoUrl;
    };

    // Filter and sort events
    const filteredEvents = events
        .filter(event => {
            if (filter === 'all') return true;
            return event.status === filter;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(a.date) - new Date(b.date);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'type':
                    return a.type.localeCompare(b.type);
                default:
                    return 0;
            }
        });

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getEventTypeIcon = (type) => {
        switch (type) {
            case 'regular_game': return '🏆';
            case 'tournament': return '🏅';
            case 'practice': return '🏃';
            case 'social': return '🎉';
            default: return '📅';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const canManageEvent = (event) => {
        // Allow admins or event creators to manage events
        return currentUser?.role === 'admin' || event.created_by === currentUser?.id;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading events...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col" style={{ backgroundColor: 'transparent' }}>
            {/* Filters and Controls - Mobile Optimized */}
            <div className="bg-white/90 backdrop-blur-sm border-b px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700">Status:</label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-2 py-1 sm:px-3 border border-gray-300 rounded text-xs sm:text-sm"
                            >
                                <option value="all">All</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700">Sort:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-2 py-1 sm:px-3 border border-gray-300 rounded text-xs sm:text-sm"
                            >
                                <option value="date">Date</option>
                                <option value="title">Title</option>
                                <option value="type">Type</option>
                            </select>
                        </div>
                    </div>

                    <div className="text-xs sm:text-sm text-gray-600">
                        {filteredEvents.length} of {events.length} events
                    </div>
                </div>
            </div>

            {/* Events List - Mobile Optimized Cards */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">📅</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                        <p className="text-gray-600 mb-6">
                            {filter === 'all' 
                                ? 'Get started by creating your first event'
                                : `No ${filter} events found. Try changing the filter.`
                            }
                        </p>
                        {filter === 'all' && (
                            <button
                                onClick={onCreateEvent}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create First Event
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {filteredEvents.map(event => (
                            <div
                                key={event.id}
                                className="bg-white/90 backdrop-blur-sm rounded-lg shadow border hover:shadow-md transition-shadow"
                            >
                                {/* Mobile-first Card Layout */}
                                <div className="p-3 sm:p-6">
                                    {/* Header Row - Status Badge and Type Icon */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl sm:text-2xl">
                                                {getEventTypeIcon(event.type)}
                                            </span>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setChangingStatus(event.id === changingStatus ? null : event.id)}
                                                    className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)} cursor-pointer hover:opacity-80`}
                                                >
                                                    {event.status.replace('_', ' ').toUpperCase()} ▼
                                                </button>
                                                {changingStatus === event.id && (
                                                    <div className="absolute left-0 mt-1 bg-white rounded-lg shadow-lg border z-10 py-1 min-w-[120px]">
                                                        {['scheduled', 'in_progress', 'completed', 'cancelled'].map(status => (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleStatusChange(event.id, status)}
                                                                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-xs sm:text-sm"
                                                            >
                                                                {status.replace('_', ' ')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Quick Action - Live View */}
                                        {(event.type === 'regular_game' || event.type === 'tournament') && 
                                         (event.status === 'in_progress' || event.status === 'scheduled') && (
                                            <button
                                                onClick={() => onViewLive ? onViewLive(event) : null}
                                                className="px-2 py-1 text-xs sm:px-3 sm:text-sm bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                                            >
                                                📺 Live
                                            </button>
                                        )}
                                    </div>

                                    {/* Event Title */}
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                                        {event.title}
                                    </h3>

                                    {/* Event Details - Stacked on Mobile */}
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600 mb-3">
                                        <span>📅 {formatDate(event.date)}</span>
                                        <span>🕒 {formatTime(event.time)}</span>
                                        <span className="truncate max-w-[150px] sm:max-w-none">📍 {event.location}</span>
                                    </div>

                                    {/* Teams - Compact on Mobile */}
                                    {event.teams && event.teams.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1 mb-3">
                                            {event.teams.slice(0, 3).map((teamId, index) => (
                                                <div key={teamId} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                                                    {getTeamLogo(teamId) && (
                                                        <img
                                                            src={getTeamLogo(teamId)}
                                                            alt={getTeamName(teamId)}
                                                            className="w-4 h-4 sm:w-5 sm:h-5 object-cover rounded"
                                                        />
                                                    )}
                                                    <span className="text-xs sm:text-sm text-gray-800 truncate max-w-[80px]">
                                                        {getTeamName(teamId)}
                                                    </span>
                                                </div>
                                            ))}
                                            {event.teams.length > 3 && (
                                                <span className="text-xs text-gray-500 px-2">
                                                    +{event.teams.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Scores (if completed) */}
                                    {event.scores && (
                                        <div className="bg-gray-50 rounded p-2 mb-3">
                                            <div className="text-sm sm:text-base font-semibold text-gray-900 text-center">
                                                {event.scores.home_team?.name} {event.scores.home_team?.score} - {event.scores.away_team?.score} {event.scores.away_team?.name}
                                            </div>
                                        </div>
                                    )}

                                    {/* Admin Actions - Grid on Mobile */}
                                    {canManageEvent(event) && (
                                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 pt-3 border-t">
                                            <button
                                                onClick={() => onEventSelect ? onEventSelect(event) : null}
                                                className="px-2 py-1.5 text-xs sm:px-3 sm:text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                                            >
                                                ✏️ Edit
                                            </button>

                                            {event.type === 'tournament' && (
                                                <button
                                                    onClick={() => onManageTournament(event)}
                                                    className="px-2 py-1.5 text-xs sm:px-3 sm:text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                                                >
                                                    🏅 Bracket
                                                </button>
                                            )}

                                            {(event.type === 'regular_game' || event.type === 'tournament') && (
                                                <button
                                                    onClick={() => {
                                                        if (onEnterScoring) onEnterScoring(event);
                                                    }}
                                                    className="px-2 py-1.5 text-xs sm:px-3 sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    🎯 Score
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={() => handleSendNotifications(event.id)}
                                                disabled={sendingNotifications[event.id]}
                                                className="px-2 py-1.5 text-xs sm:px-3 sm:text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {sendingNotifications[event.id] ? '⏳...' : '📧 Notify'}
                                            </button>
                                            
                                            {event.rsvp_enabled && (
                                                <button
                                                    onClick={() => setViewingRSVPs(event)}
                                                    className="px-2 py-1.5 text-xs sm:px-3 sm:text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                                                >
                                                    📊 RSVPs
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* RSVP Modal */}
            {viewingRSVPs && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">Event RSVPs</h3>
                            <button
                                onClick={() => setViewingRSVPs(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                ✕ Close
                            </button>
                        </div>
                        <div className="p-6">
                            <EventRSVPDashboard 
                                eventId={viewingRSVPs.id} 
                                eventTitle={viewingRSVPs.title}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsList;