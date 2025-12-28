import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const RSVPHandler = () => {
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('');
    const location = useLocation();
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        handleRSVP();
    }, []);

    const handleRSVP = async () => {
        try {
            // Parse URL parameters
            const params = new URLSearchParams(location.search);
            const response = params.get('response');
            const email = params.get('email');
            const eventId = location.pathname.split('/').pop();

            if (!response || !email) {
                setStatus('error');
                setMessage('Invalid RSVP link');
                return;
            }

            // Submit RSVP
            const rsvpResponse = await fetch(`${backendUrl}/api/events/${eventId}/rsvp`, {
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
            } else {
                setStatus('error');
                setMessage('Failed to record RSVP');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Error processing RSVP');
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
                        <p className="text-gray-600">{message}</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default RSVPHandler;
