import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import AdvancedEventCalendar from '../scheduling/components/EventCalendar';
import EventDetailModal from '../scheduling/components/EventDetailModal';
import SimpleEventForm from '../scheduling/components/SimpleEventForm';
import EnhancedEventCardWithGroupMe from '../components/EnhancedEventCardWithGroupMe';

const EventsPage = ({ teams, players = [], currentUser, events, setEvents, onEnterStats }) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeTab, setActiveTab] = useState('calendar');

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
        
        // Update selectedEvent if it's the event being updated
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
                
                {/* Tab Navigation */}
                <div className="border-t border-gray-200 mt-4 pt-4">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'calendar'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            📅 Calendar View
                        </button>
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'list'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            📋 List View with RSVPs
                        </button>
                    </nav>
                </div>
            </div>

            {/* Calendar View */}
            {activeTab === 'calendar' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Advanced Events Calendar */}
                    <div className="lg:col-span-2">
                        <AdvancedEventCalendar 
                            leagueSchedule={events}
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
                        <EventStats events={events} />
                    </div>
                </div>
            )}

            {/* List View with Enhanced Event Cards */}
            {activeTab === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {events.length > 0 ? (
                        events
                            .sort((a, b) => new Date(a.start_datetime || a.date) - new Date(b.start_datetime || b.date))
                            .map(event => (
                                <EnhancedEventCardWithGroupMe 
                                    key={event.id} 
                                    event={event} 
                                    currentUser={currentUser}
                                    showRSVP={true}
                                />
                            ))
                    ) : (
                        <div className="col-span-full bg-white rounded-lg shadow-sm border p-8 text-center">
                            <LacrosseIcon name="calendar" style={{fontSize: '48px'}} className="text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Yet</h3>
                            <p className="text-gray-500 mb-4">Create your first event to get started with RSVP management</p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <LacrosseIcon name="add" style={{fontSize: '20px'}} className="mr-2" />
                                Add First Event
                            </button>
                        </div>
                    )}
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
                        // Handle RSVP updates
                        const updatedEvents = events.map(event =>
                            event.id === eventId ? { ...event, rsvps: rsvpData } : event
                        );
                        setEvents(updatedEvents);
                    }}
                    onUpdateGameStats={(eventId, gameStats) => {
                        // Handle game statistics/scores updates
                        console.log('🏆 onUpdateGameStats called:', { eventId, gameStats });
                        const updatedEvents = events.map(event =>
                            event.id === eventId ? { ...event, gameStats: gameStats } : event
                        );
                        setEvents(updatedEvents);
                        
                        // Update selectedEvent with new gameStats
                        if (selectedEvent && selectedEvent.id === eventId) {
                            const updatedSelectedEvent = { ...selectedEvent, gameStats: gameStats };
                            setSelectedEvent(updatedSelectedEvent);
                            console.log('🏆 Updated selectedEvent with gameStats:', updatedSelectedEvent);
                        }
                        
                        console.log('🏆 Game stats updated for event:', eventId, gameStats);
                        console.log('🏆 Updated events array:', updatedEvents);
                    }}
                    onUpdateTournament={(eventId, tournamentData) => {
                        // Handle tournament bracket updates
                        console.log('🏁 onUpdateTournament called:', { eventId, tournamentData });
                        const updatedEvents = events.map(event =>
                            event.id === eventId ? { ...event, tournamentData: tournamentData } : event
                        );
                        setEvents(updatedEvents);
                        
                        // Update selectedEvent with new tournamentData
                        if (selectedEvent && selectedEvent.id === eventId) {
                            const updatedSelectedEvent = { ...selectedEvent, tournamentData: tournamentData };
                            setSelectedEvent(updatedSelectedEvent);
                            console.log('🏁 Updated selectedEvent with tournamentData:', updatedSelectedEvent);
                        }
                        
                        console.log('🏁 Tournament data updated for event:', eventId, tournamentData);
                        console.log('🏁 Updated events array:', updatedEvents);
                    }}
                    gameStats={selectedEvent?.gameStats}
                    tournamentData={selectedEvent?.tournamentData}
                />
            )}
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

// Upcoming Events Component with Enhanced Cards
const UpcomingEvents = ({ events, teams, currentUser }) => {
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    const upcomingEvents = events
        .filter(event => new Date(event.start_datetime || event.date) >= new Date())
        .sort((a, b) => new Date(a.start_datetime || a.date) - new Date(b.start_datetime || b.date))
        .slice(0, 5);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Upcoming Events</h3>
            
            {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                    {upcomingEvents.map(event => (
                        <EnhancedEventCardWithGroupMe 
                            key={event.id} 
                            event={event} 
                            currentUser={currentUser}
                            showRSVP={true}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <p className="text-slate-500 text-sm">No upcoming events</p>
                </div>
            )}
        </div>
    );
};

export default EventsPage;