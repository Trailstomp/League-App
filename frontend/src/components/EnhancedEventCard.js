import React, { useState } from 'react';
import EventRSVPViewer from './EventRSVPViewer';

const EnhancedEventCard = ({ event, showRSVP = true }) => {
    const [showRSVPModal, setShowRSVPModal] = useState(false);

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
            case 'game':
                return '🏆';
            case 'practice':
                return '🥍';
            case 'meeting':
                return '📋';
            case 'tournament':
                return '🏟️';
            default:
                return '📅';
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
                {/* Event Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                            {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span>📅 {formatDate(event.start_datetime)}</span>
                                <span>🕐 {formatTime(event.start_datetime)}</span>
                            </div>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.event_type)}`}>
                        {event.event_type || 'Event'}
                    </div>
                </div>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                    {event.location && (
                        <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">📍</span>
                            {event.location}
                        </div>
                    )}
                    
                    {event.description && (
                        <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                            {event.description}
                        </div>
                    )}
                </div>

                {/* RSVP Section */}
                {showRSVP && event.requires_rsvp && (
                    <div className="border-t pt-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center text-green-600">
                                    <span className="mr-1">✅</span>
                                    <span className="font-medium">RSVPs Required</span>
                                </div>
                                <div className="text-gray-600">
                                    Reply in GroupMe with <code className="bg-gray-100 px-1 rounded text-xs">/rsvp yes</code>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => setShowRSVPModal(true)}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                            >
                                View RSVPs
                            </button>
                        </div>
                        
                        {/* Quick RSVP Status */}
                        <div className="mt-2 flex items-center justify-center space-x-6 text-xs text-gray-600 bg-gray-50 rounded p-2">
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                                Going
                            </div>
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                                Maybe
                            </div>
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
                                Can't Go
                            </div>
                            <div className="text-blue-600 font-medium cursor-pointer hover:underline">
                                See all responses →
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Assignment (if applicable) */}
                {event.team_name && (
                    <div className="border-t pt-2 mt-3">
                        <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">👥</span>
                            <span>Team: <span className="font-medium">{event.team_name}</span></span>
                        </div>
                    </div>
                )}
            </div>

            {/* RSVP Modal */}
            {showRSVPModal && (
                <EventRSVPViewer
                    eventId={event.id}
                    onClose={() => setShowRSVPModal(false)}
                />
            )}
        </>
    );
};

export default EnhancedEventCard;