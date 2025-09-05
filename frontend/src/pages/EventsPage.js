import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import EventCalendar from '../scheduling/components/EventCalendar';
import EventDetailModal from '../scheduling/components/EventDetailModal';
import SimpleEventForm from '../scheduling/components/SimpleEventForm';

const EventsPage = ({ teams, currentUser, events, setEvents }) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddEvent = (eventData) => {
        const newEvent = {
            id: `event_${Date.now()}`,
            ...eventData,
            createdAt: new Date().toISOString(),
            status: 'scheduled',
        };
        setEvents([...events, newEvent]);
        setShowAddForm(false);
    };

    const handleEditEvent = (eventId, eventData) => {
        setEvents(events.map(event => 
            event.id === eventId ? { ...event, ...eventData } : event
        ));
        setShowEventModal(false);
        setSelectedEvent(null);
    };

    const handleDeleteEvent = (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            setEvents(events.filter(event => event.id !== eventId));
        }
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setShowEventModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Events Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Events & Schedule</h1>
                        <p className="text-slate-600 mt-2">Manage league events, games, and tournaments</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <LacrosseIcon name="add" className="mr-2" style={{fontSize: '16px'}} />
                        Add Event
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Events Calendar/List */}
                <div className="lg:col-span-2">
                    <EventCalendar 
                        events={events}
                        teams={teams}
                        onEventClick={handleEventClick}
                        onEditEvent={handleEditEvent}
                        onDeleteEvent={handleDeleteEvent}
                        currentUser={currentUser}
                    />
                </div>

                {/* Event Stats Sidebar */}
                <div className="space-y-4">
                    <EventStats events={events} />
                    <UpcomingEvents events={events} teams={teams} />
                </div>
            </div>

            {/* Add Event Modal */}
            {showAddForm && (
                <EventModal
                    teams={teams}
                    onSave={handleAddEvent}
                    onCancel={() => setShowAddForm(false)}
                    currentUser={currentUser}
                />
            )}

            {/* Event Detail Modal */}
            {showEventModal && selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    teams={teams}
                    currentUser={currentUser}
                    onClose={() => {
                        setShowEventModal(false);
                        setSelectedEvent(null);
                    }}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                />
            )}
        </div>
    );
};

// Event Calendar Component
const EventCalendar = ({ events, teams, onEventClick, onEditEvent, onDeleteEvent, currentUser }) => {
    const [view, setView] = useState('cards'); // 'cards' or 'calendar'

    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    const getTeamsForEvent = (event) => {
        if (event.homeTeam && event.awayTeam) {
            return [getTeamName(event.homeTeam), getTeamName(event.awayTeam)];
        }
        if (event.teamIds && event.teamIds.length > 0) {
            return event.teamIds.map(id => getTeamName(id));
        }
        if (event.teamId) {
            return [getTeamName(event.teamId)];
        }
        return ['Teams TBD'];
    };

    const sortedEvents = [...events].sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
        const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
        return dateA - dateB;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800">League Events</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setView('cards')}
                            className={`px-3 py-1 rounded text-sm ${
                                view === 'cards' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            Cards
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={`px-3 py-1 rounded text-sm ${
                                view === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            Calendar
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {view === 'cards' ? (
                    <div className="space-y-4">
                        {sortedEvents.length > 0 ? (
                            sortedEvents.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    teams={getTeamsForEvent(event)}
                                    onClick={() => onEventClick(event)}
                                    onEdit={onEditEvent}
                                    onDelete={onDeleteEvent}
                                    currentUser={currentUser}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <LacrosseIcon name="calendar" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                                <p>No events scheduled. Add an event to get started.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <p>Calendar view coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Event Card Component
const EventCard = ({ event, teams, onClick, onEdit, onDelete, currentUser }) => {
    const eventTypeIcons = {
        game: 'trophy',
        practice: 'time',
        tournament: 'trophy',
        meeting: 'social',
    };

    const eventTypeColors = {
        game: 'blue',
        practice: 'green',
        tournament: 'purple',
        meeting: 'orange',
    };

    const color = eventTypeColors[event.type] || 'slate';
    const icon = eventTypeIcons[event.type] || 'calendar';

    const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.role === 'coach');

    return (
        <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={onClick}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        <div className={`p-2 rounded-lg bg-${color}-100 mr-3`}>
                            <LacrosseIcon name={icon} className={`text-${color}-600`} style={{fontSize: '20px'}} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">{event.title}</h3>
                            <p className="text-sm text-slate-600 capitalize">{event.type}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                        <div className="flex items-center">
                            <LacrosseIcon name="calendar" className="mr-2" style={{fontSize: '14px'}} />
                            {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                            <LacrosseIcon name="time" className="mr-2" style={{fontSize: '14px'}} />
                            {event.time || 'Time TBD'}
                        </div>
                        <div className="flex items-center">
                            <LacrosseIcon name="location" className="mr-2" style={{fontSize: '14px'}} />
                            {event.location || 'Location TBD'}
                        </div>
                        <div className="flex items-center">
                            <LacrosseIcon name="teams" className="mr-2" style={{fontSize: '14px'}} />
                            {teams.slice(0, 2).join(' vs ') || 'Teams TBD'}
                            {teams.length > 2 && ` (+${teams.length - 2} more)`}
                        </div>
                    </div>

                    {event.description && (
                        <p className="text-sm text-slate-600 mt-3 line-clamp-2">{event.description}</p>
                    )}
                </div>

                {canEdit && (
                    <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => onEdit(event.id, event)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                        >
                            <LacrosseIcon name="edit" style={{fontSize: '16px'}} />
                        </button>
                        <button
                            onClick={() => onDelete(event.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                        >
                            <LacrosseIcon name="delete" style={{fontSize: '16px'}} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Event Stats Component
const EventStats = ({ events }) => {
    const stats = {
        total: events.length,
        games: events.filter(e => e.type === 'game').length,
        tournaments: events.filter(e => e.type === 'tournament').length,
        practices: events.filter(e => e.type === 'practice').length,
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Event Statistics</h3>
            
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Events</span>
                    <span className="font-semibold text-slate-800">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-600">Games</span>
                    <span className="font-semibold text-blue-600">{stats.games}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tournaments</span>
                    <span className="font-semibold text-purple-600">{stats.tournaments}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-600">Practices</span>
                    <span className="font-semibold text-green-600">{stats.practices}</span>
                </div>
            </div>
        </div>
    );
};

// Upcoming Events Component
const UpcomingEvents = ({ events, teams }) => {
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    const upcomingEvents = events
        .filter(event => new Date(event.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Events</h3>
            
            {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                    {upcomingEvents.map(event => (
                        <div key={event.id} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">{event.title}</p>
                                <p className="text-sm text-slate-600">
                                    {new Date(event.date).toLocaleDateString()} at {event.time || 'TBD'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-500 text-sm">No upcoming events</p>
            )}
        </div>
    );
};

// Event Modal Component (simplified)
const EventModal = ({ teams, event, onSave, onCancel, currentUser }) => {
    const [formData, setFormData] = useState({
        title: event?.title || '',
        type: event?.type || 'game',
        date: event?.date || '',
        time: event?.time || '',
        location: event?.location || '',
        description: event?.description || '',
        homeTeam: event?.homeTeam || '',
        awayTeam: event?.awayTeam || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.date) {
            alert('Title and date are required');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    {event ? 'Edit Event' : 'Add New Event'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Event Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                placeholder="e.g., OH10 vs American Dads"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Event Type
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="game">Game</option>
                                <option value="practice">Practice</option>
                                <option value="tournament">Tournament</option>
                                <option value="meeting">Meeting</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Date *
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Time
                            </label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({...formData, time: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Location
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Smith Field"
                            />
                        </div>
                        
                        {formData.type === 'game' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Home Team
                                    </label>
                                    <select
                                        value={formData.homeTeam}
                                        onChange={(e) => setFormData({...formData, homeTeam: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select Home Team</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Away Team
                                    </label>
                                    <select
                                        value={formData.awayTeam}
                                        onChange={(e) => setFormData({...formData, awayTeam: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select Away Team</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows="3"
                                placeholder="Additional details about the event..."
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {event ? 'Update Event' : 'Add Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Event Detail Modal (simplified)  
const EventDetailModal = ({ event, teams, currentUser, onClose, onEdit, onDelete }) => {
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.role === 'coach');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">{event.title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <LacrosseIcon name="delete" style={{fontSize: '24px'}} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm font-medium text-slate-700">Date</span>
                            <p className="text-slate-900">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-700">Time</span>
                            <p className="text-slate-900">{event.time || 'TBD'}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-700">Type</span>
                            <p className="text-slate-900 capitalize">{event.type}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-700">Location</span>
                            <p className="text-slate-900">{event.location || 'TBD'}</p>
                        </div>
                    </div>

                    {(event.homeTeam || event.awayTeam) && (
                        <div>
                            <span className="text-sm font-medium text-slate-700">Teams</span>
                            <p className="text-slate-900">
                                {getTeamName(event.homeTeam)} vs {getTeamName(event.awayTeam)}
                            </p>
                        </div>
                    )}

                    {event.description && (
                        <div>
                            <span className="text-sm font-medium text-slate-700">Description</span>
                            <p className="text-slate-900">{event.description}</p>
                        </div>
                    )}
                </div>

                {canEdit && (
                    <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                        <button
                            onClick={() => onDelete(event.id)}
                            className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
                        >
                            Delete Event
                        </button>
                        <button
                            onClick={() => onEdit(event.id, event)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Edit Event
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPage;