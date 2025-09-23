import React, { useState, useEffect } from 'react';

const EventRSVPViewer = ({ eventId, onClose }) => {
    const [rsvpData, setRsvpData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

    useEffect(() => {
        if (eventId) {
            loadEventRSVPs();
        }
    }, [eventId]);

    const loadEventRSVPs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/groupme/events/${eventId}/rsvps`);
            
            if (response.ok) {
                const data = await response.json();
                setRsvpData(data);
            } else {
                throw new Error('Failed to load RSVP data');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">RSVP Data</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="text-center text-red-600">
                        <p>Error: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!rsvpData) {
        return null;
    }

    const { event, summary, responses } = rsvpData;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">Event RSVPs</h3>
                        <p className="text-sm text-gray-600">{event.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{summary.total_responses}</div>
                        <div className="text-sm text-gray-600">Total Responses</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{summary.attending_count}</div>
                        <div className="text-sm text-gray-600">Attending</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{summary.not_attending_count}</div>
                        <div className="text-sm text-gray-600">Not Attending</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{summary.maybe_count}</div>
                        <div className="text-sm text-gray-600">Maybe</div>
                    </div>
                </div>

                {/* Detailed Responses */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Attending */}
                    <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Attending ({responses.attending.length})
                        </h4>
                        <div className="space-y-2">
                            {responses.attending.length === 0 ? (
                                <p className="text-sm text-gray-600">No responses yet</p>
                            ) : (
                                responses.attending.map((person, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        {person.avatar_url ? (
                                            <img
                                                src={person.avatar_url}
                                                alt={person.name}
                                                className="w-6 h-6 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center">
                                                <span className="text-xs text-green-800">
                                                    {person.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <span className="text-sm text-gray-900">{person.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Maybe */}
                    <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Maybe ({responses.maybe.length})
                        </h4>
                        <div className="space-y-2">
                            {responses.maybe.length === 0 ? (
                                <p className="text-sm text-gray-600">No responses yet</p>
                            ) : (
                                responses.maybe.map((person, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        {person.avatar_url ? (
                                            <img
                                                src={person.avatar_url}
                                                alt={person.name}
                                                className="w-6 h-6 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center">
                                                <span className="text-xs text-yellow-800">
                                                    {person.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <span className="text-sm text-gray-900">{person.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Not Attending */}
                    <div className="bg-red-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Not Attending ({responses.not_attending.length})
                        </h4>
                        <div className="space-y-2">
                            {responses.not_attending.length === 0 ? (
                                <p className="text-sm text-gray-600">No responses yet</p>
                            ) : (
                                responses.not_attending.map((person, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        {person.avatar_url ? (
                                            <img
                                                src={person.avatar_url}
                                                alt={person.name}
                                                className="w-6 h-6 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center">
                                                <span className="text-xs text-red-800">
                                                    {person.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <span className="text-sm text-gray-900">{person.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Print Summary
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventRSVPViewer;