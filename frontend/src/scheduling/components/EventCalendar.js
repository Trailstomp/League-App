import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Users, Edit, Trash2 } from 'lucide-react';

/**
 * Event Calendar Display - Clean, visual calendar with all events
 * Shows events with teams, dates, and quick actions
 */
const EventCalendar = ({ 
    leagueSchedule = [], 
    teams = [], 
    onEditEvent, 
    onDeleteEvent,
    currentUser 
}) => {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [filterType, setFilterType] = useState('all'); // 'all', 'game', 'practice', 'tournament'

    console.log('📅 EventCalendar rendered with:', {
        eventsCount: leagueSchedule.length,
        teamsCount: teams.length,
        viewMode,
        filterType
    });

    // Helper function to get team info
    const getTeamInfo = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team || { id: teamId, name: `Unknown Team (${teamId})`, style: {} };
    };

    // Filter and sort events
    const filteredEvents = useMemo(() => {
        let filtered = leagueSchedule.filter(event => {
            if (filterType === 'all') return true;
            return event.type === filterType;
        });

        // Sort by date, then by time
        filtered.sort((a, b) => {
            if (a.date !== b.date) {
                return new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01');
            }
            return (a.time || '00:00').localeCompare(b.time || '00:00');
        });

        return filtered;
    }, [leagueSchedule, filterType]);

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
                            <Calendar className="mr-2" size={24} />
                            Event Calendar
                        </h2>
                        <p className="text-gray-600 mt-1">
                            {filteredEvents.length} events scheduled
                        </p>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex gap-3">
                        {/* Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Events ({leagueSchedule.length})</option>
                            <option value="game">Games ({leagueSchedule.filter(e => e.type === 'game').length})</option>
                            <option value="practice">Practices ({leagueSchedule.filter(e => e.type === 'practice').length})</option>
                            <option value="tournament">Tournaments ({leagueSchedule.filter(e => e.type === 'tournament').length})</option>
                        </select>

                        {/* View Mode */}
                        <div className="flex border border-gray-300 rounded-md overflow-hidden">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 text-sm border-l border-gray-300 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                Grid
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Display */}
            <div className="p-6">
                {Object.keys(eventsByDate).length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
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
                                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                                    {events.map(event => (
                                        <div
                                            key={event.id}
                                            className="event-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-800 text-lg mb-1">
                                                        {event.title || 'Untitled Event'}
                                                    </h3>
                                                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                                                        {event.type || 'event'}
                                                    </div>
                                                </div>
                                                
                                                {/* Actions */}
                                                {canEdit(event) && (
                                                    <div className="flex space-x-1 ml-2">
                                                        <button
                                                            onClick={() => onEditEvent && onEditEvent(event)}
                                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                            title="Edit event"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteEvent && onDeleteEvent(event.id)}
                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                            title="Delete event"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Event Details */}
                                            <div className="space-y-2 text-sm text-gray-600">
                                                {/* Time */}
                                                <div className="flex items-center">
                                                    <Clock size={14} className="mr-2 text-gray-400" />
                                                    <span>{formatTime(event.time)}</span>
                                                </div>

                                                {/* Location */}
                                                {event.location && (
                                                    <div className="flex items-center">
                                                        <MapPin size={14} className="mr-2 text-gray-400" />
                                                        <span>{event.location}</span>
                                                    </div>
                                                )}

                                                {/* Teams */}
                                                {event.teamIds && event.teamIds.length > 0 && (
                                                    <div className="flex items-start">
                                                        <Users size={14} className="mr-2 text-gray-400 mt-0.5" />
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap gap-1">
                                                                {event.teamIds.slice(0, 3).map(teamId => {
                                                                    const team = getTeamInfo(teamId);
                                                                    return (
                                                                        <span
                                                                            key={teamId}
                                                                            className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                                                        >
                                                                            {team.style?.logoUrl && (
                                                                                <img 
                                                                                    src={team.style.logoUrl} 
                                                                                    alt=""
                                                                                    className="w-3 h-3 rounded mr-1"
                                                                                />
                                                                            )}
                                                                            {team.name}
                                                                        </span>
                                                                    );
                                                                })}
                                                                {event.teamIds.length > 3 && (
                                                                    <span className="text-xs text-gray-500">
                                                                        +{event.teamIds.length - 3} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Description */}
                                                {event.description && (
                                                    <div className="text-xs text-gray-500 mt-2 line-clamp-2">
                                                        {event.description}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Debug info for development */}
                                            <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
                                                ID: {event.id} | Teams: {event.teamIds?.length || 0}
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