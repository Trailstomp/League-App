import React, { useState } from 'react';
import SimpleTeamSelector from './SimpleTeamSelector'; 

/**
 * Simple Event Form - Direct state management, no complex hooks
 * This should finally solve the team selection persistence!
 */
const SimpleEventForm = ({ 
    initialEvent = null, 
    teams = [], 
    leagueSchedule = [], 
    setLeagueSchedule,
    onSave,
    onCancel 
}) => {
    // Direct state management - no hooks confusion!
    const [eventData, setEventData] = useState(() => {
        console.log('🚀 SimpleEventForm initializing with:', initialEvent);
        
        const baseData = {
            id: initialEvent?.id || null,
            title: initialEvent?.title || '',
            date: initialEvent?.date || '',
            time: initialEvent?.time || '',
            location: initialEvent?.location || '',
            description: initialEvent?.description || '',
            type: initialEvent?.type || 'event',
        };

        // Handle team IDs - support both formats
        let teamIds = [];
        if (initialEvent?.teamIds && Array.isArray(initialEvent.teamIds)) {
            teamIds = [...initialEvent.teamIds];
        } else if (initialEvent?.teamId) {
            teamIds = [initialEvent.teamId];
        }

        console.log('🚀 Extracted teamIds:', teamIds);
        
        return {
            ...baseData,
            teamIds: teamIds
        };
    });

    const isNewEvent = !eventData.id || eventData.id.startsWith('event_');

    const updateField = (field, value) => {
        console.log(`📝 Updating ${field}:`, value);
        setEventData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTeamToggle = (teamId) => {
        console.log('🔄 handleTeamToggle called with:', teamId);
        setEventData(prev => {
            const isSelected = prev.teamIds.includes(teamId);
            const newTeamIds = isSelected 
                ? prev.teamIds.filter(id => id !== teamId)
                : [...prev.teamIds, teamId];
            
            console.log('🔄 Team toggle result:', { 
                teamId, 
                wasSelected: isSelected, 
                oldTeamIds: prev.teamIds, 
                newTeamIds 
            });

            return {
                ...prev,
                teamIds: newTeamIds
            };
        });
    };

    const handleSave = () => {
        try {
            console.log('💾 SIMPLE SAVE - Starting save process');
            console.log('💾 Event data to save:', eventData);

            // Create event with proper ID
            const eventToSave = {
                ...eventData,
                id: eventData.id || `event_${Date.now()}`,
                teamIds: [...eventData.teamIds] // Ensure array copy
            };

            console.log('💾 Final event to save:', eventToSave);

            // Save directly to schedule (no API calls for now)
            if (isNewEvent) {
                console.log('➕ Adding new event');
                setLeagueSchedule(prev => {
                    const newSchedule = [...prev, eventToSave];
                    console.log('💾 New schedule length:', newSchedule.length);
                    return newSchedule;
                });
            } else {
                console.log('✏️ Updating existing event');
                setLeagueSchedule(prev => {
                    const updated = prev.map(e => 
                        e.id === eventData.id ? eventToSave : e
                    );
                    console.log('💾 Updated schedule, found match:', updated.some(e => e.id === eventData.id));
                    return updated;
                });
            }

            console.log('✅ SIMPLE SAVE - Success!');
            onSave && onSave(eventToSave);

        } catch (error) {
            console.error('❌ SIMPLE SAVE - Error:', error);
        }
    };

    const handleCancel = () => {
        console.log('🚫 SIMPLE CANCEL');
        onCancel && onCancel();
    };

    return (
        <div className="simple-event-form bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    🎯 {isNewEvent ? 'Create New Event' : 'Edit Event'} (Simple Version)
                </h2>
                <p className="text-gray-600">Direct state management - no hooks complexity</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Event Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Event Details</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Title *
                        </label>
                        <input
                            type="text"
                            value={eventData.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter event title"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={eventData.date}
                                onChange={(e) => updateField('date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time
                            </label>
                            <input
                                type="time"
                                value={eventData.time}
                                onChange={(e) => updateField('time', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                        </label>
                        <input
                            type="text"
                            value={eventData.location}
                            onChange={(e) => updateField('location', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Event location"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Type
                        </label>
                        <select
                            value={eventData.type}
                            onChange={(e) => updateField('type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="event">General Event</option>
                            <option value="game">Game</option>
                            <option value="practice">Practice</option>
                            <option value="tournament">Tournament</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Image/Logo URL
                        </label>
                        <input
                            type="url"
                            value={eventData.imageUrl || ''}
                            onChange={(e) => updateField('imageUrl', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/event-image.jpg"
                        />
                        {eventData.imageUrl && (
                            <div className="mt-2">
                                <img 
                                    src={eventData.imageUrl} 
                                    alt="Event preview"
                                    className="w-full h-32 object-cover rounded border border-gray-200"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={eventData.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Event description..."
                        />
                    </div>
                </div>

                {/* Team Selection - Simple Component */}
                <div>
                    <SimpleTeamSelector 
                        teams={teams}
                        selectedTeamIds={eventData.teamIds}
                        onTeamToggle={handleTeamToggle}
                        title="Participating Teams"
                    />
                </div>
            </div>

            {/* Debug Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-gray-700 mb-2">🔍 Debug Info:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <div><strong>Event ID:</strong> {eventData.id || 'New Event'}</div>
                        <div><strong>Title:</strong> {eventData.title || 'Empty'}</div>
                        <div><strong>Date:</strong> {eventData.date || 'Not set'}</div>
                        <div><strong>Location:</strong> {eventData.location || 'Not set'}</div>
                    </div>
                    <div>
                        <div><strong>Teams Selected:</strong> {eventData.teamIds.length}</div>
                        <div><strong>Team IDs:</strong> [{eventData.teamIds.join(', ') || 'None'}]</div>
                        <div><strong>Form Valid:</strong> {eventData.title ? '✅ Yes' : '❌ Missing title'}</div>
                        <div><strong>Is New:</strong> {isNewEvent ? '✅ Yes' : '❌ Editing existing'}</div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-4">
                <button
                    onClick={handleCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={!eventData.title}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isNewEvent ? '💾 Create Event' : '💾 Update Event'}
                </button>
            </div>
        </div>
    );
};

export default SimpleEventForm;