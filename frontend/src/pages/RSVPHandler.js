import React, { useEffect, useState, useCallback } from 'react';

const RSVPHandler = () => {
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('');
    const [eventDetails, setEventDetails] = useState(null);
    const [rsvpList, setRsvpList] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [eventId, setEventId] = useState('');
    const [userResponse, setUserResponse] = useState('');
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    const handleRSVP = useCallback(async () => {
        try {
            // Parse URL parameters from window.location
            const urlParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
            
            // Get parameters
            let response = urlParams.get('response') || hashParams.get('response');
            let email = urlParams.get('email') || hashParams.get('email');
            let evtId = urlParams.get('event_id') || hashParams.get('event_id');
            
            // Extract event_id from path if not in params
            const pathParts = window.location.pathname.split('/');
            if (!evtId) {
                const eventsIdx = pathParts.indexOf('events');
                if (eventsIdx !== -1 && pathParts[eventsIdx + 1]) {
                    evtId = pathParts[eventsIdx + 1].split('?')[0];
                }
            }

            console.log('📬 RSVP Handler - Parsed params:', { response, email, evtId });
            
            setUserEmail(email || '');
            setEventId(evtId || '');
            setUserResponse(response || '');

            if (!response || !email || !evtId) {
                setStatus('error');
                setMessage('Invalid RSVP link. Missing required parameters.');
                return;
            }

            // Submit RSVP to backend
            const rsvpResponse = await fetch(`${backendUrl}/api/events/${evtId}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_email: email,
                    response: response
                })
            });

            if (rsvpResponse.ok) {
                setStatus('success');
                const responseText = {
                    'going': "You're going!",
                    'maybe': "You might attend",
                    'not_going': "You can't make it"
                };
                setMessage(responseText[response] || 'RSVP recorded');
                
                // Now fetch event details and RSVPs
                await fetchEventDetails(evtId);
                await fetchRSVPs(evtId);
            } else {
                setStatus('error');
                setMessage('Failed to record RSVP. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error processing RSVP:', error);
            setStatus('error');
            setMessage('Error processing RSVP. Please try again.');
        }
    }, [backendUrl]);

    const fetchEventDetails = async (evtId) => {
        try {
            const response = await fetch(`${backendUrl}/api/unified-events`);
            if (response.ok) {
                const data = await response.json();
                const event = data.events?.find(e => e.id === evtId);
                if (event) {
                    setEventDetails(event);
                }
            }
        } catch (error) {
            console.error('Error fetching event:', error);
        }
    };

    const fetchRSVPs = async (evtId) => {
        try {
            const response = await fetch(`${backendUrl}/api/events/${evtId}/rsvps`);
            if (response.ok) {
                const data = await response.json();
                setRsvpList(data);
            }
        } catch (error) {
            console.error('Error fetching RSVPs:', error);
        }
    };

    const handleChangeResponse = async (newResponse) => {
        if (!eventId || !userEmail) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/events/${eventId}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_email: userEmail,
                    response: newResponse
                })
            });
            
            if (response.ok) {
                setUserResponse(newResponse);
                const responseText = {
                    'going': "You're going!",
                    'maybe': "You might attend",
                    'not_going': "You can't make it"
                };
                setMessage(responseText[newResponse] || 'RSVP updated');
                await fetchRSVPs(eventId);
            }
        } catch (error) {
            console.error('Error updating RSVP:', error);
        }
    };

    useEffect(() => {
        handleRSVP();
    }, [handleRSVP]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-2xl mx-auto">
                {/* Processing State */}
                {status === 'processing' && (
                    <div className="bg-white rounded-xl shadow-xl p-8 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Processing your RSVP...</p>
                    </div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <div className="bg-white rounded-xl shadow-xl p-8 text-center">
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                        <p className="text-gray-600 mb-4">{message}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Success State - Show Event Details and RSVP Form */}
                {status === 'success' && (
                    <>
                        {/* Success Banner */}
                        <div className="bg-green-500 text-white rounded-t-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-2xl">✅</span>
                                <span className="font-semibold text-lg">{message}</span>
                            </div>
                        </div>

                        {/* Event Details Card */}
                        <div className="bg-white shadow-xl rounded-b-xl overflow-hidden">
                            {eventDetails ? (
                                <>
                                    {/* Event Image */}
                                    {eventDetails.image_url && (
                                        <div className="w-full h-48 overflow-hidden">
                                            <img 
                                                src={eventDetails.image_url} 
                                                alt={eventDetails.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Event Info */}
                                    <div className="p-6">
                                        <h1 className="text-2xl font-bold text-gray-800 mb-4">
                                            {eventDetails.title}
                                        </h1>
                                        
                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <span className="text-xl">📅</span>
                                                <span>{formatDate(eventDetails.date)}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <span className="text-xl">🕐</span>
                                                <span>{formatTime(eventDetails.time)}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <span className="text-xl">📍</span>
                                                <span>{eventDetails.location}</span>
                                            </div>
                                        </div>

                                        {eventDetails.description && (
                                            <p className="text-gray-600 mb-6 border-t pt-4">
                                                {eventDetails.description}
                                            </p>
                                        )}

                                        {/* RSVP Buttons - Allow changing response */}
                                        <div className="border-t pt-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                                Your Response ({userEmail})
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    onClick={() => handleChangeResponse('going')}
                                                    className={`flex-1 min-w-[100px] px-4 py-3 rounded-lg font-medium transition-all ${
                                                        userResponse === 'going'
                                                            ? 'bg-green-500 text-white shadow-lg scale-105'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }`}
                                                >
                                                    ✅ Going
                                                </button>
                                                <button
                                                    onClick={() => handleChangeResponse('maybe')}
                                                    className={`flex-1 min-w-[100px] px-4 py-3 rounded-lg font-medium transition-all ${
                                                        userResponse === 'maybe'
                                                            ? 'bg-yellow-500 text-white shadow-lg scale-105'
                                                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                    }`}
                                                >
                                                    ❓ Maybe
                                                </button>
                                                <button
                                                    onClick={() => handleChangeResponse('not_going')}
                                                    className={`flex-1 min-w-[100px] px-4 py-3 rounded-lg font-medium transition-all ${
                                                        userResponse === 'not_going'
                                                            ? 'bg-red-500 text-white shadow-lg scale-105'
                                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                                >
                                                    ❌ Can't Go
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-6">
                                    <div className="animate-pulse">
                                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                    </div>
                                </div>
                            )}

                            {/* RSVP Responses Summary */}
                            {rsvpList && (
                                <div className="border-t bg-gray-50 p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                        Responses ({rsvpList.summary?.total || 0})
                                    </h3>
                                    
                                    {/* Summary Stats */}
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-green-100 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {rsvpList.summary?.going || 0}
                                            </div>
                                            <div className="text-sm text-green-700">Going</div>
                                        </div>
                                        <div className="bg-yellow-100 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-yellow-600">
                                                {rsvpList.summary?.maybe || 0}
                                            </div>
                                            <div className="text-sm text-yellow-700">Maybe</div>
                                        </div>
                                        <div className="bg-red-100 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-red-600">
                                                {rsvpList.summary?.not_going || 0}
                                            </div>
                                            <div className="text-sm text-red-700">Can't Go</div>
                                        </div>
                                    </div>

                                    {/* Response Lists */}
                                    {rsvpList.details && (
                                        <div className="space-y-4">
                                            {/* Going */}
                                            {rsvpList.details.going?.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-green-700 mb-2">
                                                        ✅ Going ({rsvpList.details.going.length})
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {rsvpList.details.going.map((rsvp, idx) => (
                                                            <span 
                                                                key={idx}
                                                                className={`px-3 py-1 rounded-full text-sm ${
                                                                    rsvp.user_email === userEmail 
                                                                        ? 'bg-green-500 text-white font-medium' 
                                                                        : 'bg-green-100 text-green-800'
                                                                }`}
                                                            >
                                                                {rsvp.user_name || rsvp.user_email}
                                                                {rsvp.user_email === userEmail && ' (You)'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Maybe */}
                                            {rsvpList.details.maybe?.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-yellow-700 mb-2">
                                                        ❓ Maybe ({rsvpList.details.maybe.length})
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {rsvpList.details.maybe.map((rsvp, idx) => (
                                                            <span 
                                                                key={idx}
                                                                className={`px-3 py-1 rounded-full text-sm ${
                                                                    rsvp.user_email === userEmail 
                                                                        ? 'bg-yellow-500 text-white font-medium' 
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                }`}
                                                            >
                                                                {rsvp.user_name || rsvp.user_email}
                                                                {rsvp.user_email === userEmail && ' (You)'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Not Going */}
                                            {rsvpList.details.not_going?.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-red-700 mb-2">
                                                        ❌ Can't Go ({rsvpList.details.not_going.length})
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {rsvpList.details.not_going.map((rsvp, idx) => (
                                                            <span 
                                                                key={idx}
                                                                className={`px-3 py-1 rounded-full text-sm ${
                                                                    rsvp.user_email === userEmail 
                                                                        ? 'bg-red-500 text-white font-medium' 
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}
                                                            >
                                                                {rsvp.user_name || rsvp.user_email}
                                                                {rsvp.user_email === userEmail && ' (You)'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RSVPHandler;
