import React, { useState, useEffect, useRef } from 'react';

const QuickRSVPForm = () => {
    // Extract eventId from URL path
    const path = window.location.pathname;
    const eventId = path.split('/quick-rsvp/')[1] || '';
    
    // Extract search parameters manually
    const urlParams = new URLSearchParams(window.location.search);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [autoSubmitAttempted, setAutoSubmitAttempted] = useState(false);
    const hasAutoSubmitted = useRef(false);
    const [formData, setFormData] = useState({
        name: '',
        response: '',
        notes: ''
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    const channelId = urlParams.get('channel');
    const userName = urlParams.get('name') || '';
    
    // One-click RSVP parameters
    const autoResponse = urlParams.get('response'); // yes, no, maybe
    const userEmail = urlParams.get('email');
    const token = urlParams.get('token');

    useEffect(() => {
        loadEvent();
        // Pre-fill name if provided in URL
        if (userName) {
            setFormData(prev => ({ ...prev, name: userName }));
        }
        // Pre-fill response if provided in URL (for one-click)
        if (autoResponse) {
            setFormData(prev => ({ ...prev, response: autoResponse }));
        }
    }, [eventId, userName, autoResponse]);
    
    // Auto-submit for one-click RSVP
    useEffect(() => {
        // Check if this is a one-click RSVP link
        if (!hasAutoSubmitted.current && autoResponse && (userName || userEmail) && event && !autoSubmitAttempted) {
            hasAutoSubmitted.current = true;
            setAutoSubmitAttempted(true);
            console.log('🚀 Auto-submitting one-click RSVP:', { autoResponse, userName, userEmail, eventId });
            autoSubmitRSVP();
        }
    }, [event, autoResponse, userName, userEmail, autoSubmitAttempted]);
    
    const autoSubmitRSVP = async () => {
        const name = userName || userEmail?.split('@')[0] || 'Guest';
        
        try {
            setSubmitting(true);
            const response = await fetch(`${backendUrl}/api/quick-rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: eventId,
                    channel_id: channelId,
                    user_name: name,
                    user_email: userEmail,
                    response: autoResponse,
                    notes: 'One-click RSVP',
                    source: 'one_click'
                })
            });

            if (response.ok) {
                setFormData(prev => ({ ...prev, name, response: autoResponse }));
                setSubmitted(true);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to submit RSVP');
            }
        } catch (err) {
            setError('Failed to submit RSVP: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const loadEvent = async () => {
        try {
            setLoading(true);
            
            // First try to get from unified-events (primary source)
            let targetEvent = null;
            
            try {
                const unifiedResponse = await fetch(`${backendUrl}/api/unified-events/${eventId}`);
                if (unifiedResponse.ok) {
                    targetEvent = await unifiedResponse.json();
                }
            } catch (err) {
                console.log('Event not found in unified-events, checking leagueSchedule...');
            }
            
            // Fall back to leagueSchedule if not found
            if (!targetEvent) {
                const response = await fetch(`${backendUrl}/api/league-data`);
                if (response.ok) {
                    const data = await response.json();
                    targetEvent = data.leagueSchedule?.find(e => e.id === eventId);
                }
            }
            
            if (targetEvent) {
                setEvent(targetEvent);
            } else {
                setError('Event not found');
            }
        } catch (err) {
            setError('Failed to load event: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const submitRSVP = async () => {
        if (!formData.name.trim() || !formData.response) {
            setError('Please fill in your name and response');
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch(`${backendUrl}/api/quick-rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: eventId,
                    channel_id: channelId,
                    user_name: formData.name.trim(),
                    response: formData.response,
                    notes: formData.notes.trim(),
                    source: 'quick_form'
                })
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to submit RSVP');
            }
        } catch (err) {
            setError('Failed to submit RSVP: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDateTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return dateString;
        }
    };

    const getEventIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'game': return '🏆';
            case 'practice': return '⚡';
            case 'meeting': return '📋';
            case 'tournament': return '🏅';
            default: return '📅';
        }
    };

    const getResponseEmoji = (response) => {
        switch (response) {
            case 'yes': return '✅';
            case 'no': return '❌';
            case 'maybe': return '❓';
            default: return '';
        }
    };

    const getResponseColor = (response) => {
        switch (response) {
            case 'yes': return 'bg-green-500 hover:bg-green-600';
            case 'no': return 'bg-red-500 hover:bg-red-600';
            case 'maybe': return 'bg-yellow-500 hover:bg-yellow-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-gray-600">Loading event...</div>
                </div>
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">😕</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-500 mb-6">
                        This event may have been deleted or the link may be outdated.
                    </p>
                    <a 
                        href="/"
                        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Home Page
                    </a>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">🎉</div>
                    <h1 className="text-2xl font-bold text-green-600 mb-2">RSVP Submitted!</h1>
                    <p className="text-gray-600 mb-4">
                        Thank you, {formData.name}! Your response "{formData.response.toUpperCase()}" 
                        for {event?.title} has been recorded.
                    </p>
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="flex items-center justify-center space-x-2">
                            <span className="text-2xl">{getResponseEmoji(formData.response)}</span>
                            <span className="text-lg font-medium capitalize">{formData.response}</span>
                        </div>
                        {formData.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                                Note: {formData.notes}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Quick RSVP</h1>
                    <p className="text-gray-600">Tap your response below</p>
                </div>

                {/* Event Details */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="text-center">
                        <div className="text-3xl mb-2">{getEventIcon(event?.type)}</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">{event?.title}</h2>
                        <div className="text-gray-600 mb-2">
                            📅 {formatDateTime(event?.start_datetime)}
                        </div>
                        {event?.location && (
                            <div className="text-gray-600 mb-2">
                                📍 {event.location}
                            </div>
                        )}
                        {event?.description && (
                            <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 mt-3">
                                {event.description}
                            </div>
                        )}
                    </div>
                </div>

                {/* RSVP Form */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Name Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        />
                    </div>

                    {/* Response Buttons */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Will you attend?
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { value: 'yes', label: 'Yes, I\'ll be there!', emoji: '✅' },
                                { value: 'no', label: 'Sorry, can\'t make it', emoji: '❌' },
                                { value: 'maybe', label: 'Maybe / Tentative', emoji: '❓' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setFormData({ ...formData, response: option.value })}
                                    className={`w-full py-4 px-4 rounded-lg text-white font-medium text-left flex items-center space-x-3 transition-colors ${
                                        formData.response === option.value 
                                            ? getResponseColor(option.value) + ' ring-2 ring-white ring-opacity-60'
                                            : 'bg-gray-400 hover:bg-gray-500'
                                    }`}
                                >
                                    <span className="text-xl">{option.emoji}</span>
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Optional Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any additional notes..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows="3"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={submitRSVP}
                        disabled={submitting || !formData.name.trim() || !formData.response}
                        className={`w-full py-4 px-4 rounded-lg font-semibold text-lg transition-colors ${
                            submitting || !formData.name.trim() || !formData.response
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {submitting ? 'Submitting...' : 'Submit RSVP'}
                    </button>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-gray-500">
                    Powered by League Management
                </div>
            </div>
        </div>
    );
};

export default QuickRSVPForm;