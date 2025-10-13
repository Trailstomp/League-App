import React, { useState, useEffect } from 'react';
import EventCreator from './EventCreator';
import EventsList from './EventsList';
import TournamentBracketBuilder from './TournamentBracketBuilder';
import ScoringSelector from './ScoringSelector';
import ImprovedLiveStatsEntry from './ImprovedLiveStatsEntry';
import QuickScoreEntry from './QuickScoreEntry';

const EventManager = ({ teams, currentUser, onEventUpdate, initialEvents, onNavigate }) => {
    const [events, setEvents] = useState(initialEvents || []);
    const [activeView, setActiveView] = useState('list'); // list, create, tournament, scoring-selector, live-stats, quick-score
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(false);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    // Load events on component mount (only if no initial events provided)
    useEffect(() => {
        if (!initialEvents || initialEvents.length === 0) {
            loadEvents();
        }
    }, []);

    // Update events when initialEvents changes
    useEffect(() => {
        if (initialEvents) {
            setEvents(initialEvents);
        }
    }, [initialEvents]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            console.log('📅 Loading unified events...');
            
            const response = await fetch(`${backendUrl}/api/unified-events`);
            if (response.ok) {
                const data = await response.json();
                setEvents(data.events || []);
                console.log('✅ Loaded unified events:', data.events?.length || 0);
            } else {
                console.error('❌ Failed to load events:', response.status);
            }
        } catch (error) {
            console.error('❌ Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventCreate = async (eventData) => {
        try {
            console.log('🎯 Creating new event:', eventData);
            
            const response = await fetch(`${backendUrl}/api/unified-events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                const newEvent = await response.json();
                setEvents(prev => [newEvent, ...prev]);
                setActiveView('list');
                
                // Notify parent component
                if (onEventUpdate) onEventUpdate();
                
                console.log('✅ Event created successfully');
                return newEvent;
            } else {
                const error = await response.text();
                console.error('❌ Failed to create event:', error);
                throw new Error(error);
            }
        } catch (error) {
            console.error('❌ Error creating event:', error);
            throw error;
        }
    };

    const handleEventUpdate = async (eventId, updates) => {
        try {
            console.log('📝 Updating event:', eventId, updates);
            
            const response = await fetch(`${backendUrl}/api/unified-events/${eventId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const updatedEvent = await response.json();
                setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
                
                // Notify parent component
                if (onEventUpdate) onEventUpdate();
                
                console.log('✅ Event updated successfully');
                return updatedEvent;
            } else {
                const error = await response.text();
                console.error('❌ Failed to update event:', error);
                throw new Error(error);
            }
        } catch (error) {
            console.error('❌ Error updating event:', error);
            throw error;
        }
    };

    const handleScoreSubmit = async (eventId, scoreData) => {
        try {
            console.log('🏆 Submitting scores for event:', eventId, scoreData);
            
            // Update event with scores
            await handleEventUpdate(eventId, { 
                scores: scoreData,
                status: 'completed'
            });

            // Create game stats record
            const statsResponse = await fetch(`${backendUrl}/api/game-stats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_id: eventId,
                    ...scoreData,
                    created_at: new Date().toISOString()
                })
            });

            if (statsResponse.ok) {
                console.log('✅ Game stats created successfully');
            }

            setActiveView('list');
        } catch (error) {
            console.error('❌ Error submitting scores:', error);
            throw error;
        }
    };

    const renderActiveView = () => {
        switch (activeView) {
            case 'create':
                return (
                    <EventCreator
                        teams={teams}
                        currentUser={currentUser}
                        onEventCreate={handleEventCreate}
                        onCancel={() => setActiveView('list')}
                    />
                );
            
            case 'tournament':
                return (
                    <TournamentBracketBuilder
                        event={selectedEvent}
                        teams={teams}
                        onUpdate={(updates) => handleEventUpdate(selectedEvent.id, updates)}
                        onBack={() => setActiveView('list')}
                    />
                );
            
            case 'scoring-selector':
                return (
                    <ScoringSelector
                        event={selectedEvent}
                        teams={teams}
                        onLiveStats={(event) => {
                            setSelectedEvent(event);
                            setActiveView('live-stats');
                        }}
                        onQuickScore={(event) => {
                            setSelectedEvent(event);
                            setActiveView('quick-score');
                        }}
                        onCancel={() => setActiveView('list')}
                    />
                );
            
            case 'live-stats':
                return (
                    <ImprovedLiveStatsEntry
                        event={selectedEvent}
                        teams={teams}
                        onSubmit={(statsData) => handleScoreSubmit(selectedEvent.id, statsData)}
                        onCancel={() => setActiveView('list')}
                    />
                );
            
            case 'quick-score':
                return (
                    <QuickScoreEntry
                        event={selectedEvent}
                        teams={teams}
                        onSubmit={(scoreData) => handleScoreSubmit(selectedEvent.id, scoreData)}
                        onCancel={() => setActiveView('list')}
                    />
                );
            
            default:
                return (
                    <EventsList
                        events={events}
                        teams={teams}
                        currentUser={currentUser}
                        loading={loading}
                        onEventSelect={setSelectedEvent}
                        onEventUpdate={handleEventUpdate}
                        onCreateEvent={() => setActiveView('create')}
                        onManageTournament={(event) => {
                            setSelectedEvent(event);
                            setActiveView('tournament');
                        }}
                        onEnterScoring={(event) => {
                            setSelectedEvent(event);
                            setActiveView('scoring-selector');
                        }}
                        onViewLive={(event) => {
                            // TODO: Implement live spectator view
                            console.log('Live view for:', event.title);
                        }}
                        onEventSelect={(event) => {
                            // TODO: Implement event editing
                            console.log('Edit event:', event.title);
                        }}
                        onRefresh={loadEvents}
                    />
                );
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {activeView === 'list' && 'Events Management'}
                            {activeView === 'create' && 'Create New Event'}
                            {activeView === 'tournament' && 'Tournament Bracket'}
                            {activeView === 'scoring-selector' && 'Choose Scoring Method'}
                            {activeView === 'live-stats' && 'Live Stats Entry'}
                            {activeView === 'quick-score' && 'Quick Score Entry'}
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Unified event management with scoring, tournaments, and RSVP integration
                        </p>
                    </div>
                    
                    {activeView === 'list' && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActiveView('create')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                ➕ Create Event
                            </button>
                            <button
                                onClick={loadEvents}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                                disabled={loading}
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {renderActiveView()}
            </div>
        </div>
    );
};

export default EventManager;