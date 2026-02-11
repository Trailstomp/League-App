import React, { useState, useEffect } from 'react';
import EventCreator from '../unified-events/EventCreator';
import EventsList from '../unified-events/EventsList';
import ScoringSelector from '../unified-events/ScoringSelector';
import EnhancedLiveStatsEntry from '../unified-events/EnhancedLiveStatsEntry';
import QuickScoreEntry from '../unified-events/QuickScoreEntry';
import LiveSpectatorView from '../../pages/LiveSpectatorView';

/**
 * TeamScheduleTab - Uses the same UI as EventManager but filtered for a specific team
 * Only league admins or team admins/coaches can CRUD events
 */
const TeamScheduleTab = ({ team, events = [], teams = [], currentUser, onEventsUpdate, sportType = 'lacrosse' }) => {
    const [teamEvents, setTeamEvents] = useState([]);
    const [activeView, setActiveView] = useState('list');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showSpectatorView, setShowSpectatorView] = useState(false);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Check if user can manage events (league admin or team admin/coach)
    const canManageEvents = currentUser && (
        currentUser.role === 'admin' ||
        currentUser.roles?.includes('admin') ||
        currentUser.roles?.includes('league_admin') ||
        (currentUser.roles?.includes('coach') && (
            currentUser.teamId === team?.id ||
            currentUser.teamAssignments?.some(a => a.teamId === team?.id)
        )) ||
        (currentUser.roles?.includes('team_admin') && (
            currentUser.teamId === team?.id ||
            currentUser.teamAssignments?.some(a => a.teamId === team?.id)
        ))
    );

    // Filter and sort events for this team
    useEffect(() => {
        const filtered = events.filter(event => 
            event.teams?.includes(team.id) || 
            event.teamIds?.includes(team.id) ||
            event.homeTeam === team.id || 
            event.awayTeam === team.id ||
            event.team_id === team.id
        );

        // Sort by date (upcoming first)
        const sorted = [...filtered].sort((a, b) => {
            const dateA = new Date(a.start_datetime || a.date || '1970-01-01');
            const dateB = new Date(b.start_datetime || b.date || '1970-01-01');
            return dateA - dateB;
        });

        setTeamEvents(sorted);
    }, [events, team.id]);

    // Load events from backend
    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/unified-events`);
            if (response.ok) {
                const data = await response.json();
                // Filter for this team
                const allEvents = data.events || [];
                const filtered = allEvents.filter(event => 
                    event.teams?.includes(team.id) || 
                    event.teamIds?.includes(team.id) ||
                    event.homeTeam === team.id || 
                    event.awayTeam === team.id ||
                    event.team_id === team.id
                );
                setTeamEvents(filtered);
                
                // Also notify parent to refresh
                if (onEventsUpdate) {
                    onEventsUpdate();
                }
            }
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle event creation
    const handleEventCreated = async (newEvent) => {
        // Ensure the team is included in the event
        const eventWithTeam = {
            ...newEvent,
            teams: newEvent.teams?.includes(team.id) ? newEvent.teams : [...(newEvent.teams || []), team.id],
            teamIds: newEvent.teamIds?.includes(team.id) ? newEvent.teamIds : [...(newEvent.teamIds || []), team.id]
        };

        try {
            const response = await fetch(`${backendUrl}/api/unified-events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventWithTeam)
            });

            if (response.ok) {
                await loadEvents();
                setActiveView('list');
            }
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    // Handle event update
    const handleEventUpdated = async (updatedEvent) => {
        try {
            const response = await fetch(`${backendUrl}/api/unified-events/${updatedEvent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedEvent)
            });

            if (response.ok) {
                await loadEvents();
                setActiveView('list');
                setSelectedEvent(null);
            }
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    // Handle event deletion
    const handleEventDeleted = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            const response = await fetch(`${backendUrl}/api/unified-events/${eventId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadEvents();
                setActiveView('list');
                setSelectedEvent(null);
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    // Render content based on active view
    const renderContent = () => {
        // Spectator view modal
        if (showSpectatorView && selectedEvent) {
            return (
                <LiveSpectatorView
                    event={selectedEvent}
                    teams={teams}
                    onClose={() => {
                        setShowSpectatorView(false);
                        setSelectedEvent(null);
                    }}
                    sportType={sportType}
                />
            );
        }

        switch (activeView) {
            case 'create':
                return (
                    <EventCreator
                        teams={teams}
                        currentUser={currentUser}
                        onEventCreated={handleEventCreated}
                        onCancel={() => setActiveView('list')}
                        defaultTeamId={team.id}
                        sportType={sportType}
                    />
                );

            case 'edit':
                return selectedEvent ? (
                    <EventCreator
                        teams={teams}
                        currentUser={currentUser}
                        event={selectedEvent}
                        onEventCreated={handleEventUpdated}
                        onCancel={() => {
                            setActiveView('list');
                            setSelectedEvent(null);
                        }}
                        sportType={sportType}
                    />
                ) : null;

            case 'scoring-selector':
                return selectedEvent ? (
                    <ScoringSelector
                        event={selectedEvent}
                        teams={teams}
                        currentUser={currentUser}
                        onSelectMethod={(method) => {
                            if (method === 'live-stats') {
                                setActiveView('live-stats');
                            } else if (method === 'quick-score') {
                                setActiveView('quick-score');
                            }
                        }}
                        onBack={() => {
                            setActiveView('list');
                            setSelectedEvent(null);
                        }}
                        sportType={sportType}
                    />
                ) : null;

            case 'live-stats':
                return selectedEvent ? (
                    <EnhancedLiveStatsEntry
                        event={selectedEvent}
                        teams={teams}
                        currentUser={currentUser}
                        onBack={() => setActiveView('scoring-selector')}
                        onComplete={() => {
                            loadEvents();
                            setActiveView('list');
                            setSelectedEvent(null);
                        }}
                        sportType={sportType}
                    />
                ) : null;

            case 'quick-score':
                return selectedEvent ? (
                    <QuickScoreEntry
                        event={selectedEvent}
                        teams={teams}
                        currentUser={currentUser}
                        onBack={() => setActiveView('scoring-selector')}
                        onComplete={() => {
                            loadEvents();
                            setActiveView('list');
                            setSelectedEvent(null);
                        }}
                        sportType={sportType}
                    />
                ) : null;

            case 'list':
            default:
                return (
                    <EventsList
                        events={teamEvents}
                        teams={teams}
                        currentUser={currentUser}
                        loading={loading}
                        canManage={canManageEvents}
                        onEventSelect={(event) => {
                            setSelectedEvent(event);
                            if (canManageEvents) {
                                setActiveView('edit');
                            } else {
                                // Non-admins see spectator view
                                setShowSpectatorView(true);
                            }
                        }}
                        onStartScoring={(event) => {
                            setSelectedEvent(event);
                            setActiveView('scoring-selector');
                        }}
                        onViewLive={(event) => {
                            setSelectedEvent(event);
                            setShowSpectatorView(true);
                        }}
                        onDeleteEvent={canManageEvents ? handleEventDeleted : null}
                        onRefresh={loadEvents}
                        sportType={sportType}
                    />
                );
        }
    };

    return (
        <div className="space-y-6" data-testid="team-schedule-tab">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Team Schedule</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        {teamEvents.length} event{teamEvents.length !== 1 ? 's' : ''} for {team.name}
                    </p>
                </div>

                {/* Action Buttons - Only for admins/coaches */}
                {activeView === 'list' && (
                    <div className="flex gap-3">
                        {canManageEvents && (
                            <button
                                onClick={() => setActiveView('create')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                data-testid="create-team-event-btn"
                            >
                                ➕ Create Event
                            </button>
                        )}
                        <button
                            onClick={loadEvents}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                            disabled={loading}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                )}

                {/* Back button for other views */}
                {activeView !== 'list' && (
                    <button
                        onClick={() => {
                            setActiveView('list');
                            setSelectedEvent(null);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                        ← Back to Schedule
                    </button>
                )}
            </div>

            {/* Content */}
            {renderContent()}

            {/* Empty state */}
            {activeView === 'list' && teamEvents.length === 0 && !loading && (
                <div className="text-center py-16 bg-slate-50 rounded-xl">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No Events Scheduled</h3>
                    <p className="text-slate-600 mb-6">
                        {canManageEvents 
                            ? "Create your first event to get started"
                            : "No upcoming events for this team"}
                    </p>
                    {canManageEvents && (
                        <button
                            onClick={() => setActiveView('create')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            ➕ Create First Event
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamScheduleTab;
