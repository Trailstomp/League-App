import React, { useState } from 'react';
import SimpleEventForm from './SimpleEventForm';

/**
 * EventTester - Test the clean EventForm workflow
 * This will prove our new architecture solves the team selection persistence issue!
 */
const EventTester = ({ teams = [], leagueSchedule = [], setLeagueSchedule, currentUser }) => {
    const [editingEvent, setEditingEvent] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const handleCreateNew = () => {
        console.log('🆕 Creating new event');
        setEditingEvent(null);
        setShowForm(true);
    };

    const handleEditEvent = (event) => {
        console.log('✏️ Editing event:', event);
        setEditingEvent(event);
        setShowForm(true);
    };

    const handleSave = (savedEvent) => {
        console.log('💾 Event saved successfully:', savedEvent);
        setShowForm(false);
        setEditingEvent(null);
    };

    const handleCancel = () => {
        console.log('🚫 Form cancelled');
        setShowForm(false);
        setEditingEvent(null);
    };

    return (
        <div className="event-tester p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">🧪 Event Form Tester</h2>
                <div className="text-gray-600 mb-4">
                    Test the new clean EventForm architecture - team selections should persist!
                </div>
            </div>

            {!showForm ? (
                <div className="space-y-6">
                    {/* Create New Event */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-green-800 mb-2">Create New Event</h3>
                        <p className="text-green-700 mb-4">Test creating a new event with team selections.</p>
                        <button
                            onClick={handleCreateNew}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            + Create New Event
                        </button>
                    </div>

                    {/* Existing Events */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Existing Events ({leagueSchedule.length})</h3>
                        {leagueSchedule.length === 0 ? (
                            <p className="text-blue-700">No events yet. Create one to test editing!</p>
                        ) : (
                            <div className="space-y-2">
                                {leagueSchedule.slice(0, 5).map(event => (
                                    <div key={event.id} className="bg-white p-4 rounded border border-blue-200 flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">{event.title}</div>
                                            <div className="text-sm text-gray-600">
                                                {event.date} | Teams: {event.teamIds?.length || 0}
                                            </div>
                                            {event.teamIds && event.teamIds.length > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Team IDs: {event.teamIds.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleEditEvent(event)}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                        >
                                            Edit & Test
                                        </button>
                                    </div>
                                ))}
                                {leagueSchedule.length > 5 && (
                                    <div className="text-sm text-gray-500">
                                        ... and {leagueSchedule.length - 5} more events
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Testing Instructions */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🧪 Testing Instructions</h3>
                        <ol className="text-yellow-700 list-decimal list-inside space-y-1">
                            <li>Create a new event and select 2-3 teams</li>
                            <li>Save the event</li>
                            <li>Click "Edit & Test" on the saved event</li>
                            <li>✅ <strong>Verify the teams are still selected!</strong></li>
                            <li>Make changes and save again</li>
                            <li>Edit again to verify persistence</li>
                        </ol>
                    </div>
                </div>
            ) : (
                <EventForm
                    initialEvent={editingEvent}
                    teams={teams}
                    leagueSchedule={leagueSchedule}
                    setLeagueSchedule={setLeagueSchedule}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
};

export default EventTester;