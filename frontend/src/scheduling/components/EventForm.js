import React from 'react';
import useEventData from '../hooks/useEventData';
import useTeamSelection from '../hooks/useTeamSelection';
import useEventPersistence from '../hooks/useEventPersistence';
import TeamSelector from './TeamSelector';

/**
 * Clean EventForm - Single responsibility, clear data flow
 * NO MORE DUAL-STATE CONFUSION!
 */
const EventForm = ({ 
    initialEvent = null, 
    teams = [], 
    leagueSchedule = [], 
    setLeagueSchedule,
    onSave,
    onCancel 
}) => {
    // Clean hook usage - each hook has single responsibility
    const { eventData, updateField, updateMultipleFields, resetEvent, isNewEvent } = useEventData(initialEvent);
    const teamSelection = useTeamSelection(eventData.teamIds, teams);
    const { saveEventToSchedule } = useEventPersistence();

    console.log('🎯 CLEAN EventForm rendered:', { eventData, selectedTeams: teamSelection.selectedTeamIds.length });

    const handleSave = async () => {
        try {
            console.log('💾 CLEAN SAVE - Starting save process');
            console.log('💾 Event data:', eventData);
            console.log('💾 Selected teams:', teamSelection.selectedTeamIds);

            // Create complete event with team selections
            const completeEvent = {
                ...eventData,
                teamIds: [...teamSelection.selectedTeamIds], // Ensure we get latest team selections
                id: eventData.id || `event_${Date.now()}`
            };

            console.log('💾 Complete event to save:', completeEvent);

            // Save to schedule
            const result = await saveEventToSchedule(completeEvent, leagueSchedule, setLeagueSchedule);
            
            if (result.success) {
                console.log('✅ CLEAN SAVE - Success!', result.event);
                onSave && onSave(result.event);
                resetEvent();
                teamSelection.clearAllTeams();
            } else {
                console.error('❌ CLEAN SAVE - Failed:', result.error);
            }

        } catch (error) {
            console.error('❌ CLEAN SAVE - Error:', error);
        }
    };

    const handleCancel = () => {
        console.log('🚫 CLEAN CANCEL - Resetting form');
        resetEvent();
        teamSelection.clearAllTeams();
        onCancel && onCancel();
    };

    return (
        <div className="clean-event-form bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    🚀 {isNewEvent ? 'Create New Event' : 'Edit Event'}
                </h2>
                <p className="text-gray-600">Clean architecture - single responsibility components</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                {/* Team Selection - Clean Component */}
                <div className="space-y-4">
                    <TeamSelector 
                        teams={teams}
                        teamSelection={teamSelection}
                        title="Participating Teams"
                    />
                </div>
            </div>

            {/* Debug Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">🔍 Debug Info:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                    <div>Event ID: {eventData.id || 'New Event'}</div>
                    <div>Teams Selected: {teamSelection.selectedCount}</div>
                    <div>Selected Team IDs: {JSON.stringify(teamSelection.selectedTeamIds)}</div>
                    <div>Form Valid: {eventData.title ? '✅' : '❌ Missing title'}</div>
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
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isNewEvent ? 'Create Event' : 'Update Event'}
                </button>
            </div>
        </div>
    );
};

export default EventForm;