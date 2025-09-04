import React, { useState, useMemo } from 'react';

// Lacrosse-themed icon system with fallbacks
const Calendar = () => <span>📅</span>;
const Clock = () => <span>🕐</span>;
const MapPin = () => <span>📍</span>;
const Users = () => <span>🥍</span>; // Lacrosse stick for teams!
const Edit = () => <span>✏️</span>;
const Trash2 = () => <span>🗑️</span>;

// Lacrosse-themed icons for different contexts
const LacrosseIcons = {
    teams: '🥍',      // Lacrosse stick
    game: '🏆',       // Trophy for games
    practice: '🏃‍♂️',    // Running for practice
    tournament: '🎯',  // Target for tournaments
    event: '📅',      // Calendar for general events
    field: '🟢',      // Green circle for field
    stats: '📊',      // Chart for statistics
    score: '⚽',      // Ball for scoring (closest to lacrosse ball)
    time: '⏰',       // Alarm clock
    location: '🏟️',   // Stadium
    player: '👤',     // Player icon
};

/**
 * Event Calendar Display - Clean, visual calendar with all events
 * Shows events with teams, dates, and quick actions
 */
const EventCalendar = ({ 
    leagueSchedule = [], 
    teams = [], 
    onEditEvent, 
    onDeleteEvent,
    onEventClick,
    currentUser 
}) => {
    const [viewMode, setViewMode] = useState('grid'); // 'list' or 'grid'
    const [selectedEventTypes, setSelectedEventTypes] = useState(['game', 'practice', 'tournament', 'event']); // Multiple selection

    console.log('📅 EventCalendar rendered with:', {
        eventsCount: leagueSchedule.length,
        teamsCount: teams.length,
        viewMode,
        selectedEventTypes
    });

    // Helper function to get team info
    const getTeamInfo = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        console.log('🔍 Team lookup for ID:', teamId, 'Found:', team?.name, 'Logo:', team?.style?.logoUrl);
        return team || { id: teamId, name: `Unknown Team (${teamId})`, style: {} };
    };

    // Helper function to get event team IDs (handles multiple formats)
    const getEventTeamIds = (event) => {
        let eventTeamIds = [];
        
        if (event.teamIds && event.teamIds.length > 0) {
            // New format: teamIds array
            eventTeamIds = event.teamIds;
        } else {
            // Legacy format: homeTeam, awayTeam, teamId
            if (event.homeTeam) eventTeamIds.push(event.homeTeam);
            if (event.awayTeam && event.awayTeam !== event.homeTeam) eventTeamIds.push(event.awayTeam);
            if (event.teamId && !eventTeamIds.includes(event.teamId)) eventTeamIds.push(event.teamId);
        }
        
        return eventTeamIds;
    };

    // Handle event type filter changes
    const handleEventTypeToggle = (eventType) => {
        setSelectedEventTypes(prev => 
            prev.includes(eventType)
                ? prev.filter(type => type !== eventType)
                : [...prev, eventType]
        );
    };

    const selectAllEventTypes = () => {
        setSelectedEventTypes(['game', 'practice', 'tournament', 'event']);
    };

    const clearAllEventTypes = () => {
        setSelectedEventTypes([]);
    };

    // Filter and sort events
    const filteredEvents = useMemo(() => {
        let filtered = leagueSchedule.filter(event => {
            return selectedEventTypes.includes(event.type || 'event');
        });

        // Sort by date, then by time
        filtered.sort((a, b) => {
            if (a.date !== b.date) {
                return new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01');
            }
            return (a.time || '00:00').localeCompare(b.time || '00:00');
        });

        return filtered;
    }, [leagueSchedule, selectedEventTypes]);

    // Group events by date for better display
    const eventsByDate = useMemo(() => {
        const grouped = {};
        filteredEvents.forEach(event => {
            const date = event.date || 'No Date';
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(event);
        });
        return grouped;
    }, [filteredEvents]);

    const formatDate = (dateString) => {
        if (!dateString) return 'No Date';
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

    const formatTime = (timeString) => {
        if (!timeString) return 'No Time';
        try {
            const [hours, minutes] = timeString.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        } catch {
            return timeString;
        }
    };

    const getEventTypeColor = (type) => {
        const colors = {
            game: 'bg-blue-100 text-blue-800 border-blue-200',
            practice: 'bg-green-100 text-green-800 border-green-200', 
            tournament: 'bg-purple-100 text-purple-800 border-purple-200',
            event: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[type] || colors.event;
    };

    const canEdit = (event) => {
        return currentUser && (currentUser.role === 'admin' || currentUser.roles?.includes('admin'));
    };

    return (
        <div className="event-calendar bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                            <span className="mr-2"><Calendar /></span>
                            Event Calendar
                        </h2>
                        <p className="text-gray-600 mt-1">
                            {filteredEvents.length} events scheduled
                        </p>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Event Type Checkboxes */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">Show:</span>
                            {[
                                { type: 'game', label: `${LacrosseIcons.game} Games`, count: leagueSchedule.filter(e => e.type === 'game').length },
                                { type: 'practice', label: `${LacrosseIcons.practice} Practices`, count: leagueSchedule.filter(e => e.type === 'practice').length },
                                { type: 'tournament', label: `${LacrosseIcons.tournament} Tournaments`, count: leagueSchedule.filter(e => e.type === 'tournament').length },
                                { type: 'event', label: `${LacrosseIcons.event} Events`, count: leagueSchedule.filter(e => e.type === 'event').length }
                            ].map(({ type, label, count }) => (
                                <label key={type} className="flex items-center text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedEventTypes.includes(type)}
                                        onChange={() => handleEventTypeToggle(type)}
                                        className="mr-2 rounded"
                                    />
                                    <span className={selectedEventTypes.includes(type) ? 'text-gray-800' : 'text-gray-500'}>
                                        {label} ({count})
                                    </span>
                                </label>
                            ))}
                            
                            {/* Quick actions */}
                            <div className="flex gap-2 ml-4">
                                <button
                                    onClick={selectAllEventTypes}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    All
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={clearAllEventTypes}
                                    className="text-xs text-gray-600 hover:text-gray-800"
                                >
                                    None
                                </button>
                            </div>
                        </div>

                        {/* View Mode */}
                        <div className="flex border border-gray-300 rounded-md overflow-hidden">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                📋 List
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 text-sm border-l border-gray-300 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                🔲 Cards
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Display */}
            <div className="p-6">
                {Object.keys(eventsByDate).length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mx-auto mb-4 text-gray-400"><Calendar /></div>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Events Scheduled</h3>
                        <p className="text-gray-500">Create your first event to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(eventsByDate).map(([date, events]) => (
                            <div key={date} className="date-section">
                                {/* Date Header */}
                                <div className="flex items-center mb-4">
                                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        {formatDate(date)}
                                    </div>
                                    <div className="flex-1 h-px bg-gray-200 ml-4"></div>
                                    <div className="text-sm text-gray-500 ml-4">
                                        {events.length} event{events.length !== 1 ? 's' : ''}
                                    </div>
                                </div>

                                {/* Events for this date */}
                                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3' : 'space-y-3'}>
                                    {events.map(event => (
                                        <div
                                            key={event.id}
                                            className="event-card bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                                            onClick={() => onEventClick && onEventClick(event)}
                                        >
                                            {/* Event Image */}
                                            {event.imageUrl && (
                                                <img 
                                                    src={event.imageUrl}
                                                    alt={event.title}
                                                    className={`w-full h-32 ${
                                                        event.imageStyle === 'contain' ? 'object-contain bg-gray-50' :
                                                        event.imageStyle === 'fill' ? 'object-fill' :
                                                        'object-cover'
                                                    }`}
                                                />
                                            )}
                                            
                                            <div className="p-3">
                                                {/* Header */}
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-800 text-sm truncate mb-1">
                                                            {event.title || 'Untitled Event'}
                                                        </h3>
                                                        <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                                                            {LacrosseIcons[event.type] || LacrosseIcons.event} {event.type || 'event'}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Actions */}
                                                    {canEdit(event) && (
                                                        <div className="flex ml-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onEditEvent && onEditEvent(event);
                                                                }}
                                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded text-xs"
                                                                title="Edit event"
                                                            >
                                                                <Edit />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteEvent && onDeleteEvent(event.id);
                                                                }}
                                                                className="p-1 text-red-600 hover:bg-red-100 rounded text-xs ml-1"
                                                                title="Delete event"
                                                            >
                                                                <Trash2 />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Compact Event Details */}
                                                <div className="space-y-1 text-xs text-gray-600">
                                                    {/* Time */}
                                                    <div className="flex items-center">
                                                        <span className="mr-1">{LacrosseIcons.time}</span>
                                                        <span>{formatTime(event.time)}</span>
                                                    </div>

                                                    {/* Location */}
                                                    {event.location && (
                                                        <div className="flex items-center">
                                                            <span className="mr-1">{LacrosseIcons.location}</span>
                                                            <span className="truncate">{event.location}</span>
                                                        </div>
                                                    )}

                                                    {/* Teams - Enhanced Display with Logos */}
                                                    {getEventTeamIds(event).length > 0 && (
                                                        <div className="flex items-start">
                                                            <span className="mr-1 mt-0.5">{LacrosseIcons.teams}</span>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="space-y-1">
                                                                    {getEventTeamIds(event).slice(0, 3).map(teamId => {
                                                                        const team = getTeamInfo(teamId);
                                                                        return (
                                                                            <div key={teamId} className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-md px-2 py-1 border border-blue-100">
                                                                                {team.style?.logoUrl ? (
                                                                                    <img 
                                                                                        src={team.style.logoUrl} 
                                                                                        alt={team.name}
                                                                                        className="w-4 h-4 rounded-full mr-2 border border-white shadow-sm"
                                                                                    />
                                                                                ) : (
                                                                                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mr-2">
                                                                                        {team.name.charAt(0)}
                                                                                    </span>
                                                                                )}
                                                                                <span className="text-xs font-medium text-gray-800 truncate flex-1">
                                                                                    {team.name}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {(() => {
                                                                        let eventTeamIds = [];
                                                                        if (event.teamIds && event.teamIds.length > 0) {
                                                                            eventTeamIds = event.teamIds;
                                                                        } else {
                                                                            if (event.homeTeam) eventTeamIds.push(event.homeTeam);
                                                                            if (event.awayTeam && event.awayTeam !== event.homeTeam) eventTeamIds.push(event.awayTeam);
                                                                            if (event.teamId && !eventTeamIds.includes(event.teamId)) eventTeamIds.push(event.teamId);
                                                                        }
                                                                        return eventTeamIds.length > 3;
                                                                    })() && (
                                                                        <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 text-center">
                                                                            +{(() => {
                                                                                let eventTeamIds = [];
                                                                                if (event.teamIds && event.teamIds.length > 0) {
                                                                                    eventTeamIds = event.teamIds;
                                                                                } else {
                                                                                    if (event.homeTeam) eventTeamIds.push(event.homeTeam);
                                                                                    if (event.awayTeam && event.awayTeam !== event.homeTeam) eventTeamIds.push(event.awayTeam);
                                                                                    if (event.teamId && !eventTeamIds.includes(event.teamId)) eventTeamIds.push(event.teamId);
                                                                                }
                                                                                return eventTeamIds.length - 3;
                                                                            })()} more teams
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Description - Very compact */}
                                                {event.description && (
                                                    <div className="text-xs text-gray-500 mt-2 line-clamp-1">
                                                        {event.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventCalendar;