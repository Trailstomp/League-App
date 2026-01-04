import React, { useState, useMemo } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import AdvancedEventCalendar from '../scheduling/components/EventCalendar';
import EventDetailModal from '../scheduling/components/EventDetailModal';
import SimpleEventForm from '../scheduling/components/SimpleEventForm';
import EnhancedEventCardWithGroupMe from '../components/EnhancedEventCardWithGroupMe';

const EventsPage = ({ teams, players = [], currentUser, events, setEvents, onEnterStats }) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeView, setActiveView] = useState('calendar'); // 'calendar', 'list'
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
        const updatedEvents = events.map(event => 
            event.id === eventId ? { ...event, ...eventData } : event
        );
        setEvents(updatedEvents);
        
        if (selectedEvent && selectedEvent.id === eventId) {
            setSelectedEvent({ ...selectedEvent, ...eventData });
        }
        
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
                        <p className="text-slate-600 mt-2">Manage league events, games, tournaments, and send RSVPs</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <LacrosseIcon name="add" className="mr-2" style={{fontSize: '16px'}} />
                        Add Event
                    </button>
                </div>
                
                {/* View Navigation (Calendar/List) */}
                <div className="border-t border-gray-200 mt-4 pt-4">
                    <nav className="flex items-center justify-between">
                        <div className="flex space-x-8">
                            <button
                                onClick={() => setActiveView('calendar')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeView === 'calendar'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                📅 Calendar View
                            </button>
                            <button
                                onClick={() => setActiveView('list')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeView === 'list'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                📋 List View with RSVPs
                            </button>
                        </div>
                        
                        {/* Show Canceled/Archived Toggle */}
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showCanceledArchived}
                                onChange={(e) => setShowCanceledArchived(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            Show canceled/archived
                        </label>
                    </nav>
                </div>
            </div>

            {/* Calendar View */}
            {activeView === 'calendar' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Advanced Events Calendar */}
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

                    {/* Event Stats Sidebar */}
                    <div className="space-y-4">
                        <EventStats events={statusFilteredEvents} upcomingCount={upcomingEvents.length} pastCount={pastEvents.length} />
                    </div>
                </div>
            )}

            {/* List View with Upcoming/Past Tabs */}
            {activeView === 'list' && (
                <div className="bg-white rounded-lg shadow-sm border">
                    {/* Upcoming/Past Tabs */}
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTimeTab('upcoming')}
                                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                                    activeTimeTab === 'upcoming'
                                        ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-lg">🗓️ Upcoming Events</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                                    activeTimeTab === 'upcoming' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {upcomingEvents.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTimeTab('past')}
                                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                                    activeTimeTab === 'past'
                                        ? 'bg-slate-100 text-slate-700 border-b-2 border-slate-500'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-lg">📜 Past Events</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                                    activeTimeTab === 'past' 
                                        ? 'bg-slate-200 text-slate-800' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {pastEvents.length}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Events Grid */}
                    <div className="p-4">
                        {displayEvents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {displayEvents.map(event => (
                                    <EnhancedEventCardWithGroupMe 
                                        key={event.id} 
                                        event={event} 
                                        currentUser={currentUser}
                                        showRSVP={true}
                                        onEnterStats={onEnterStats ? () => onEnterStats(event) : null}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <LacrosseIcon 
                                    name="calendar" 
                                    style={{fontSize: '48px'}} 
                                    className="text-gray-400 mx-auto mb-4" 
                                />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {activeTimeTab === 'upcoming' ? 'No Upcoming Events' : 'No Past Events'}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {activeTimeTab === 'upcoming' 
                                        ? 'Create an event to get started with scheduling'
                                        : 'Past events will appear here after they occur'
                                    }
                                </p>
                                {activeTimeTab === 'upcoming' && (
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <LacrosseIcon name="add" style={{fontSize: '20px'}} className="mr-2" />
                                        Add Event
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Advanced Event Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <SimpleEventForm
                            initialEvent={selectedEvent}
                            teams={teams}
                            leagueSchedule={events}
                            setLeagueSchedule={setEvents}
                            leagueLocations={[]}
                            onSave={(event) => {
                                if (selectedEvent) {
                                    handleEditEvent(selectedEvent.id, event);
                                } else {
                                    handleAddEvent(event);
                                }
                                setShowAddForm(false);
                                setSelectedEvent(null);
                            }}
                            onCancel={() => {
                                setShowAddForm(false);
                                setSelectedEvent(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Advanced Event Detail Modal */}
            {showEventModal && selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    teams={teams}
                    currentUser={currentUser}
                    users={[]}
                    leagueInfo={{}}
                    isOpen={showEventModal}
                    onClose={() => {
                        setShowEventModal(false);
                        setSelectedEvent(null);
                    }}
                    onUpdateEvent={(updatedEvent) => {
                        handleEditEvent(selectedEvent.id, updatedEvent);
                    }}
                    onUpdateRSVP={(eventId, rsvpData) => {
                        const updatedEvents = events.map(event =>
                            event.id === eventId ? { ...event, rsvps: rsvpData } : event
                        );
                        setEvents(updatedEvents);
                    }}
                    onUpdateGameStats={(eventId, gameStats) => {
                        const updatedEvents = events.map(event =>
                            event.id === eventId ? { ...event, gameStats: gameStats } : event
                        );
                        setEvents(updatedEvents);
                        
                        if (selectedEvent && selectedEvent.id === eventId) {
                            setSelectedEvent({ ...selectedEvent, gameStats: gameStats });
                        }
                    }}
                    onUpdateTournament={(eventId, tournamentData) => {
                        const updatedEvents = events.map(event =>
                            event.id === eventId ? { ...event, tournamentData: tournamentData } : event
                        );
                        setEvents(updatedEvents);
                        
                        if (selectedEvent && selectedEvent.id === eventId) {
                            setSelectedEvent({ ...selectedEvent, tournamentData: tournamentData });
                        }
                    }}
                    gameStats={selectedEvent?.gameStats}
                    tournamentData={selectedEvent?.tournamentData}
                />
            )}
        </div>
    );
};

// Event Stats Component
const EventStats = ({ events, upcomingCount, pastCount }) => {
    const stats = {
        total: events.length,
        upcoming: upcomingCount,
        past: pastCount,
        games: events.filter(e => e.type === 'game' || e.type === 'regular_game').length,
        tournaments: events.filter(e => e.type === 'tournament').length,
        practices: events.filter(e => e.type === 'practice').length,
        external: events.filter(e => e.type === 'external' || e.is_external).length,
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
                    <span className="text-slate-600">🗓️ Upcoming</span>
                    <span className="font-semibold text-green-600">{stats.upcoming}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-600">📜 Past</span>
                    <span className="font-semibold text-slate-500">{stats.past}</span>
                </div>
                <hr className="my-2" />
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
                {stats.external > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">External</span>
                        <span className="font-semibold text-orange-600">{stats.external}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPage;
