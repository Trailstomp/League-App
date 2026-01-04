import React, { useState, useEffect } from 'react';

const TeamCoachNotifier = ({ teams = [], events = [] }) => {
    const [coaches, setCoaches] = useState([]);
    const [coachesByTeam, setCoachesByTeam] = useState({});
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [includeRsvp, setIncludeRsvp] = useState(true);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        loadCoaches();
    }, []);

    const loadCoaches = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/coaches`);
            if (response.ok) {
                const data = await response.json();
                setCoaches(data.coaches || []);
                setCoachesByTeam(data.coaches_by_team || {});
            }
        } catch (err) {
            console.error('Error loading coaches:', err);
            setError('Failed to load coaches');
        } finally {
            setLoading(false);
        }
    };

    const handleTeamToggle = (teamId) => {
        setSelectedTeams(prev => 
            prev.includes(teamId) 
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId]
        );
    };

    const handleSelectAllTeams = () => {
        if (selectedTeams.length === teams.length) {
            setSelectedTeams([]);
        } else {
            setSelectedTeams(teams.map(t => t.id));
        }
    };

    const getSelectedCoaches = () => {
        const coachSet = new Set();
        const result = [];
        
        selectedTeams.forEach(teamId => {
            const teamCoaches = coachesByTeam[teamId] || [];
            teamCoaches.forEach(coach => {
                if (!coachSet.has(coach.id)) {
                    coachSet.add(coach.id);
                    result.push(coach);
                }
            });
        });
        
        return result;
    };

    const sendNotification = async () => {
        if (selectedTeams.length === 0) {
            setError('Please select at least one team');
            return;
        }
        
        if (!message.trim()) {
            setError('Please enter a message');
            return;
        }

        try {
            setSending(true);
            setError('');
            setResult(null);
            
            // If an event is selected, use the event-specific endpoint
            if (selectedEvent) {
                const response = await fetch(`${backendUrl}/api/events/${selectedEvent}/notify-coaches`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        subject: subject || 'League Notification',
                        include_rsvp: includeRsvp,
                        base_url: window.location.origin
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setResult(data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.detail || 'Failed to send notifications');
                }
            } else {
                // Send to coaches of selected teams directly
                const selectedCoaches = getSelectedCoaches();
                
                // Use bulk notification endpoint
                const response = await fetch(`${backendUrl}/api/notifications/send-bulk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient_ids: selectedCoaches.map(c => c.id),
                        message: message,
                        subject: subject || 'League Notification',
                        notification_type: 'coach_message'
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setResult({
                        success: true,
                        results: {
                            coaches_notified: selectedCoaches.map(c => ({
                                name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email,
                                email: c.email
                            })),
                            email_sent: data.sent || selectedCoaches.length
                        }
                    });
                } else {
                    setError('Failed to send notifications');
                }
            }
        } catch (err) {
            console.error('Error sending notification:', err);
            setError(err.message || 'Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    const selectedCoaches = getSelectedCoaches();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    👨‍🏫 Team Coach Communication
                </h3>
                <p className="text-sm text-gray-600">
                    Send messages and RSVP requests directly to team coaches
                </p>
            </div>

            {/* Team Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Select Teams</h4>
                    <button
                        onClick={handleSelectAllTeams}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        {selectedTeams.length === teams.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {teams.map(team => {
                        const teamCoachCount = (coachesByTeam[team.id] || []).length;
                        const isSelected = selectedTeams.includes(team.id);
                        
                        return (
                            <button
                                key={team.id}
                                onClick={() => handleTeamToggle(team.id)}
                                className={`p-2 rounded-lg text-left text-sm transition-colors ${
                                    isSelected
                                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-800'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <div className="font-medium truncate">{team.name}</div>
                                <div className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {teamCoachCount} coach{teamCoachCount !== 1 ? 'es' : ''}
                                </div>
                            </button>
                        );
                    })}
                </div>
                
                {teams.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                        No teams available
                    </p>
                )}
            </div>

            {/* Selected Coaches Preview */}
            {selectedCoaches.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">
                        📧 {selectedCoaches.length} Coach{selectedCoaches.length !== 1 ? 'es' : ''} Selected
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedCoaches.map(coach => (
                            <span
                                key={coach.id}
                                className="inline-flex items-center px-2 py-1 bg-white rounded-full text-sm text-green-700 border border-green-200"
                            >
                                {coach.firstName || ''} {coach.lastName || coach.email}
                                {coach.email && (
                                    <span className="ml-1 text-xs text-green-500">
                                        ({coach.email})
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Event Selection (Optional) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link to Event (Optional)
                </label>
                <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">-- No event (send general message) --</option>
                    {events.map(event => (
                        <option key={event.id} value={event.id}>
                            {event.title || 'Untitled'} - {event.date || 'No date'}
                        </option>
                    ))}
                </select>
            </div>

            {/* Message Form */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Game Reminder, Schedule Update"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter your message to coaches..."
                        rows={4}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {selectedEvent && (
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={includeRsvp}
                            onChange={(e) => setIncludeRsvp(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Include RSVP link</span>
                    </label>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Success Result */}
            {result?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">✅ Notifications Sent</h4>
                    <div className="text-sm text-green-700 space-y-1">
                        <p>📧 Emails sent: {result.results?.email_sent || 0}</p>
                        {result.results?.sms_sent > 0 && (
                            <p>📱 SMS sent: {result.results.sms_sent}</p>
                        )}
                        {result.results?.coaches_notified?.length > 0 && (
                            <div className="mt-2">
                                <p className="font-medium">Notified:</p>
                                <ul className="list-disc list-inside ml-2">
                                    {result.results.coaches_notified.slice(0, 5).map((coach, idx) => (
                                        <li key={idx}>{coach.name} ({coach.method || 'email'})</li>
                                    ))}
                                    {result.results.coaches_notified.length > 5 && (
                                        <li>... and {result.results.coaches_notified.length - 5} more</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Send Button */}
            <button
                onClick={sendNotification}
                disabled={sending || selectedTeams.length === 0 || !message.trim()}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    sending || selectedTeams.length === 0 || !message.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
                {sending ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Sending...
                    </span>
                ) : (
                    `Send to ${selectedCoaches.length} Coach${selectedCoaches.length !== 1 ? 'es' : ''}`
                )}
            </button>
        </div>
    );
};

export default TeamCoachNotifier;
