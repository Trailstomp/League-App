import React, { useState } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

const TeamScheduleTab = ({ team, events = [], teams = [], currentUser, onEventsUpdate }) => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Check if user can create events (admin or coach for this team)
    const canCreateEvents = currentUser && (
        currentUser.roles?.includes('admin') ||
        (currentUser.roles?.includes('coach') && (
            currentUser.teamId === team?.id ||
            currentUser.teamAssignments?.some(a => a.teamId === team?.id)
        ))
    );
    
    // Filter events for this team
    const teamEvents = events.filter(event => 
        (event.teams?.includes(team.id) || 
        event.teamIds?.includes(team.id) ||
        event.homeTeam === team.id || 
        event.awayTeam === team.id ||
        event.team_id === team.id) &&
        event.status !== 'canceled' &&
        event.status !== 'cancelled' &&
        event.status !== 'archived'
    );

    // Sort by date
    const sortedEvents = [...teamEvents].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });

    // New event form state
    const [newEvent, setNewEvent] = useState({
        title: '',
        type: 'practice',
        date: '',
        time: '',
        location: '',
        description: '',
        homeTeam: team?.id || '',
        awayTeam: ''
    });

    const handleInputChange = (field, value) => {
        setNewEvent(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateEvent = async () => {
        if (!newEvent.title || !newEvent.date) {
            setMessage('❌ Please fill in title and date');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            // Build the event object - using unified events format
            const eventToCreate = {
                title: newEvent.title,
                type: newEvent.type,
                date: newEvent.date,
                time: newEvent.time,
                location: newEvent.location,
                description: newEvent.description,
                teamIds: newEvent.type === 'game' && newEvent.awayTeam 
                    ? [newEvent.homeTeam, newEvent.awayTeam]
                    : [team.id],
                teams: newEvent.type === 'game' && newEvent.awayTeam 
                    ? [newEvent.homeTeam, newEvent.awayTeam]
                    : [team.id],
                homeTeam: newEvent.type === 'game' ? newEvent.homeTeam : null,
                awayTeam: newEvent.type === 'game' ? newEvent.awayTeam : null,
                createdBy: currentUser?.id,
                status: 'scheduled'
            };

            console.log('📅 Creating unified event:', eventToCreate);

            // Save to unified events endpoint
            const response = await fetch(`${backendUrl}/api/unified-events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventToCreate)
            });

            if (response.ok) {
                const savedEvent = await response.json();
                console.log('✅ Event created:', savedEvent);
                setMessage('✅ Event created successfully!');
                
                // Reset form
                setNewEvent({
                    title: '',
                    type: 'practice',
                    date: '',
                    time: '',
                    location: '',
                    description: '',
                    homeTeam: team?.id || '',
                    awayTeam: ''
                });
                setShowCreateForm(false);
                
                // Notify parent to refresh events
                if (onEventsUpdate) {
                    onEventsUpdate();
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Failed to create event:', errorData);
                setMessage(`❌ Failed to create: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error creating event:', error);
            setMessage('❌ Error creating event');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 4000);
        }
    };

    // Get other teams for game opponent selection
    const otherTeams = (teams || []).filter(t => t.id !== team?.id && !t.isExternal);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Schedule</h2>
                {canCreateEvents && (
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        data-testid="create-event-btn"
                    >
                        <span className="mr-2">{showCreateForm ? '✕' : '+'}</span>
                        {showCreateForm ? 'Cancel' : 'Create Event'}
                    </button>
                )}
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Create Event Form */}
            {showCreateForm && canCreateEvents && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6" data-testid="create-event-form">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Create New Event</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Event Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Event Type *</label>
                            <select
                                value={newEvent.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-testid="event-type-select"
                            >
                                <option value="practice">Practice</option>
                                <option value="game">Game</option>
                                <option value="tournament">Tournament</option>
                                <option value="meeting">Team Meeting</option>
                                <option value="event">Other Event</option>
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                            <input
                                type="text"
                                value={newEvent.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder={newEvent.type === 'practice' ? 'Team Practice' : newEvent.type === 'game' ? 'Game vs ...' : 'Event Title'}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-testid="event-title-input"
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                            <input
                                type="date"
                                value={newEvent.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-testid="event-date-input"
                            />
                        </div>

                        {/* Time */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                            <input
                                type="time"
                                value={newEvent.time}
                                onChange={(e) => handleInputChange('time', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-testid="event-time-input"
                            />
                        </div>

                        {/* Opponent (for games) */}
                        {newEvent.type === 'game' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Opponent Team</label>
                                <select
                                    value={newEvent.awayTeam}
                                    onChange={(e) => handleInputChange('awayTeam', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    data-testid="opponent-select"
                                >
                                    <option value="">Select opponent...</option>
                                    {otherTeams.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Location */}
                        <div className={newEvent.type === 'game' ? '' : 'md:col-span-2'}>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                            <input
                                type="text"
                                value={newEvent.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                placeholder="Enter location"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-testid="event-location-input"
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={newEvent.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Optional notes..."
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-testid="event-description-input"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="px-4 py-2 text-slate-600 hover:text-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateEvent}
                            disabled={saving || !newEvent.title || !newEvent.date}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            data-testid="save-event-btn"
                        >
                            {saving ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </div>
            )}

            {/* Events List */}
            {sortedEvents.length > 0 ? (
                <div className="space-y-4">
                    {sortedEvents.map(event => (
                        <div key={event.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50" data-testid={`event-card-${event.id}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-800">{event.title}</h3>
                                    <p className="text-sm text-slate-600">
                                        {event.date ? new Date(event.date).toLocaleDateString() : 'TBD'} 
                                        {event.time ? ` at ${event.time}` : ''}
                                    </p>
                                    {event.location && (
                                        <p className="text-sm text-slate-500">{event.location}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        event.type === 'game' ? 'bg-red-100 text-red-800' :
                                        event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                        event.type === 'tournament' ? 'bg-purple-100 text-purple-800' :
                                        event.type === 'meeting' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-slate-100 text-slate-800'
                                    }`}>
                                        {event.type || 'Event'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 p-8 rounded-lg text-center text-slate-500">
                    <LacrosseIcon name="calendar" style={{fontSize: '48px'}} className="mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No scheduled events</h3>
                    <p>Check back later for upcoming games and practices</p>
                    {canCreateEvents && (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            data-testid="create-first-event-btn"
                        >
                            Create First Event
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamScheduleTab;
