import React, { useEffect, useState } from 'react';

const RSVPHandler = () => {
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('');
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        handleRSVP();
    }, []);

    const handleRSVP = async () => {
        try {
            // Parse URL parameters from window.location since we may not have React Router
            const urlParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
            
            // Try to get parameters from query string first, then from hash
            let response = urlParams.get('response') || hashParams.get('response');
            let email = urlParams.get('email') || hashParams.get('email');
            let eventId = urlParams.get('event_id') || hashParams.get('event_id');
            
            // Also try to extract event_id from the path if not in params
            const pathParts = window.location.pathname.split('/');
            const hashParts = window.location.hash.split('/');
            
            // Look for event ID in path like /rsvp-handler or /events/{event_id}
            if (!eventId) {
                // Check if path has events/{id}
                const eventsIdx = pathParts.indexOf('events');
                if (eventsIdx !== -1 && pathParts[eventsIdx + 1]) {
                    eventId = pathParts[eventsIdx + 1].split('?')[0];
                }
                // Check hash path
                const hashEventsIdx = hashParts.indexOf('events');
                if (!eventId && hashEventsIdx !== -1 && hashParts[hashEventsIdx + 1]) {
                    eventId = hashParts[hashEventsIdx + 1].split('?')[0];
                }
            }

            console.log('📬 RSVP Handler - Parsed params:', { response, email, eventId });

            if (!response || !email || !eventId) {
                setStatus('error');
                setMessage('Invalid RSVP link. Missing required parameters.');
                console.error('❌ RSVP missing params:', { response, email, eventId });
                return;
            }

            // Submit RSVP to backend
            console.log('📬 Submitting RSVP to:', `${backendUrl}/api/events/${eventId}/rsvp`);
            
            const rsvpResponse = await fetch(`${backendUrl}/api/events/${eventId}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_email: email,
                    response: response
                })
            });

            console.log('📬 RSVP Response status:', rsvpResponse.status);

            if (rsvpResponse.ok) {
                setStatus('success');
                const responseText = {
                    'going': "You're going!",
                    'maybe': "You might attend",
                    'not_going': "You can't make it"
                };
                setMessage(responseText[response] || 'RSVP recorded');
                console.log('✅ RSVP recorded successfully');
            } else {
                const errorData = await rsvpResponse.text();
                console.error('❌ RSVP failed:', errorData);
                setStatus('error');
                setMessage('Failed to record RSVP. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error processing RSVP:', error);
            setStatus('error');
            setMessage('Error processing RSVP. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                {status === 'processing' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Processing your RSVP...</p>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-green-600 mb-4">RSVP Confirmed!</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <p className="text-sm text-gray-500">You can close this window now.</p>
                    </>
                )}
                
                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                        <p className="text-gray-600 mb-4">{message}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default RSVPHandler;
