import React, { useState, useMemo } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import AdvancedEventCalendar from '../scheduling/components/EventCalendar';
import EventDetailModal from '../scheduling/components/EventDetailModal';
import SimpleEventForm from '../scheduling/components/SimpleEventForm';
import { CompactEventRow, CompactEventCard } from '../components/CompactEventCards';

const EventsPage = ({ teams, players = [], currentUser, events, setEvents, onEnterStats }) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeView, setActiveView] = useState('list'); // 'calendar', 'list', 'cards'
    const [activeTimeTab, setActiveTimeTab] = useState('upcoming'); // 'upcoming', 'past'
    const [showCanceledArchived, setShowCanceledArchived] = useState(false);

    // Get today's date at midnight for comparison
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    // Filter events by status (canceled/archived)
    const statusFilteredEvents = useMemo(() => {
        if (showCanceledArchived) return events;
        return events.filter(event => 
            event.status !== 'canceled' && 
            event.status !== 'cancelled' && 
            event.status !== 'archived'
        );
    }, [events, showCanceledArchived]);

    // Split events into upcoming and past
    const { upcomingEvents, pastEvents } = useMemo(() => {
        const upcoming = [];
        const past = [];
        
        statusFilteredEvents.forEach(event => {
            const eventDate = new Date(event.start_datetime || event.date || '2099-12-31');
            eventDate.setHours(0, 0, 0, 0);
            
            if (eventDate >= today) {
                upcoming.push(event);
            } else {
                past.push(event);
            }
        });
        
        // Sort upcoming by date ascending (soonest first)
        upcoming.sort((a, b) => {
            const dateA = new Date(a.start_datetime || a.date || '2099-12-31');
            const dateB = new Date(b.start_datetime || b.date || '2099-12-31');
            return dateA - dateB;
        });
        
        // Sort past by date descending (most recent first)
        past.sort((a, b) => {
            const dateA = new Date(a.start_datetime || a.date || '1970-01-01');
            const dateB = new Date(b.start_datetime || b.date || '1970-01-01');
            return dateB - dateA;
        });
        
        return { upcomingEvents: upcoming, pastEvents: past };
    }, [statusFilteredEvents, today]);

    // Get events to display based on active time tab
    const displayEvents = activeTimeTab === 'upcoming' ? upcomingEvents : pastEvents;

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
        setShowAddForm(false);
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            setEvents(events.filter(event => event.id !== eventId));
        }
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setShowEventModal(true);
    };

    const handleUpdateEvent = (updatedEvent) => {
        setEvents(events.map(event => 
            event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
        ));
    };

    const handleUpdateRSVP = (eventId, rsvpData) => {
        setEvents(events.map(event =>
            event.id === eventId ? { ...event, rsvps: rsvpData } : event
        ));
    };

    const handleUpdateGameStats = (eventId, gameStats) => {
        setEvents(events.map(event =>
            event.id === eventId ? { ...event, gameStats: gameStats } : event
        ));
    };

    const handleUpdateTournament = (eventId, tournamentData) => {
        setEvents(events.map(event =>
            event.id === eventId ? { ...event, tournamentData: tournamentData } : event
        ));
    };

    return (
        <div className="space-y-4 p-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <LacrosseIcon name="calendar" className="mr-3" style={{fontSize: '28px'}} />
                            Events & Schedule
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {upcomingEvents.length} upcoming • {pastEvents.length} past
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedEvent(null);
                            setShowAddForm(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                    >
                        <LacrosseIcon name="add" className="mr-2" style={{fontSize: '16px'}} />
                        Add Event
                    </button>
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveView('list')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeView === 'list'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                            }`}
                            data-testid="list-view-btn"
                        >
                            ☰ List
                        </button>
                        <button
                            onClick={() => setActiveView('cards')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeView === 'cards'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                            }`}
                            data-testid="cards-view-btn"
                        >
                            ▦ Cards
                        </button>
                        <button
                            onClick={() => setActiveView('calendar')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeView === 'calendar'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                            }`}
                            data-testid="calendar-view-btn"
                        >
                            📅 Calendar
                        </button>
                    </div>
                    
                    {/* Show Canceled Toggle */}
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showCanceledArchived}
                            onChange={(e) => setShowCanceledArchived(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        Show canceled/archived
                    </label>
                </div>
            </div>

            {/* Calendar View */}
            {activeView === 'calendar' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <AdvancedEventCalendar 
                            leagueSchedule={statusFilteredEvents}
                            teams={teams}
                            onEventClick={handleEventClick}
                            onEditEvent={(event) => {
                                setSelectedEvent(event);
                                setShowAddForm(true);
                            }}
                            onDeleteEvent={handleDeleteEvent}
                            currentUser={currentUser}
                        />
                    </div>
                    <div>
                        <EventStats events={statusFilteredEvents} upcomingCount={upcomingEvents.length} pastCount={pastEvents.length} />
                    </div>
                </div>
            )}

            {/* List or Cards View */}
            {(activeView === 'list' || activeView === 'cards') && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {/* Upcoming/Past Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTimeTab('upcoming')}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                activeTimeTab === 'upcoming'
                                    ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            🗓️ Upcoming
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                activeTimeTab === 'upcoming' ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                                {upcomingEvents.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTimeTab('past')}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                activeTimeTab === 'past'
                                    ? 'bg-slate-100 text-slate-700 border-b-2 border-slate-500'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            📜 Past
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                activeTimeTab === 'past' ? 'bg-slate-200' : 'bg-gray-100'
                            }`}>
                                {pastEvents.length}
                            </span>
                        </button>
                    </div>

                    {/* Events Content */}
                    <div className={activeView === 'cards' ? 'p-4' : ''}>
                        {displayEvents.length > 0 ? (
                            activeView === 'list' ? (
                                // Compact List View
                                <div className="divide-y divide-slate-100">
                                    {displayEvents.map(event => (
                                        <CompactEventRow 
                                            key={event.id} 
                                            event={event} 
                                            currentUser={currentUser}
                                            onEventClick={handleEventClick}
                                            onEnterStats={onEnterStats ? () => onEnterStats(event) : null}
                                        />
                                    ))}
                                </div>
                            ) : (
                                // Compact Cards Grid
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                    {displayEvents.map(event => (
                                        <CompactEventCard 
                                            key={event.id} 
                                            event={event} 
                                            currentUser={currentUser}
                                            onEventClick={handleEventClick}
                                            onEnterStats={onEnterStats ? () => onEnterStats(event) : null}
                                        />
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="text-center py-12">
                                <LacrosseIcon 
                                    name="calendar" 
                                    style={{fontSize: '48px'}} 
                                    className="text-gray-400 mx-auto mb-4" 
                                />
                                <p className="text-gray-500">
                                    {activeTimeTab === 'upcoming' 
                                        ? 'No upcoming events scheduled' 
                                        : 'No past events to display'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Event Detail Modal */}
            {showEventModal && selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    teams={teams}
                    currentUser={currentUser}
                    users={players}
                    leagueInfo={{}}
                    isOpen={showEventModal}
                    onClose={() => {
                        setShowEventModal(false);
                        setSelectedEvent(null);
                    }}
                    onUpdateEvent={handleUpdateEvent}
                    onUpdateRSVP={handleUpdateRSVP}
                    onUpdateGameStats={handleUpdateGameStats}
                    onUpdateTournament={handleUpdateTournament}
                    gameStats={selectedEvent?.gameStats}
                    tournamentData={selectedEvent?.tournamentData}
                />
            )}

            {/* Add/Edit Event Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {selectedEvent ? 'Edit Event' : 'Add New Event'}
                            </h2>
                            <button 
                                onClick={() => {
                                    setShowAddForm(false);
                                    setSelectedEvent(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4">
                            <SimpleEventForm 
                                teams={teams}
                                onSave={selectedEvent 
                                    ? (data) => handleEditEvent(selectedEvent.id, data) 
                                    : handleAddEvent
                                }
                                onCancel={() => {
                                    setShowAddForm(false);
                                    setSelectedEvent(null);
                                }}
                                initialEvent={selectedEvent}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Event Stats Component
const EventStats = ({ events, upcomingCount, pastCount }) => {
    const typeBreakdown = useMemo(() => {
        const counts = { game: 0, practice: 0, meeting: 0, tournament: 0, other: 0 };
        events.forEach(event => {
            const type = event.type?.toLowerCase() || 'other';
            if (counts[type] !== undefined) {
                counts[type]++;
            } else {
                counts.other++;
            }
        });
        return counts;
    }, [events]);

    return (
        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
            <h3 className="font-semibold text-slate-800">Event Summary</h3>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{upcomingCount}</div>
                    <div className="text-xs text-green-700">Upcoming</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-slate-600">{pastCount}</div>
                    <div className="text-xs text-slate-700">Past</div>
                </div>
            </div>

            <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-600">By Type</h4>
                {[
                    { key: 'game', label: 'Games', icon: '🏆', color: 'red' },
                    { key: 'practice', label: 'Practices', icon: '⚡', color: 'blue' },
                    { key: 'meeting', label: 'Meetings', icon: '📋', color: 'purple' },
                    { key: 'tournament', label: 'Tournaments', icon: '🏅', color: 'yellow' },
                ].map(({ key, label, icon, color }) => (
                    typeBreakdown[key] > 0 && (
                        <div key={key} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                                <span>{icon}</span>
                                <span className="text-slate-600">{label}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded bg-${color}-100 text-${color}-700 text-xs font-medium`}>
                                {typeBreakdown[key]}
                            </span>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default EventsPage;
