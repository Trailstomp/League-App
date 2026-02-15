import React, { useState, useEffect } from 'react';
import EventManager from '../components/unified-events/EventManager';

const UnifiedEventsPage = ({ teams, currentUser, onNavigate, onEventClick, sportType = 'lacrosse' }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    // Load events on page load
    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            console.log('🎯 Loading events for unified events page...');
            
            const response = await fetch(`${backendUrl}/api/unified-events`);
            if (response.ok) {
                const data = await response.json();
                setEvents(data.events || []);
                console.log('✅ Loaded events for page:', data.events?.length || 0);
            } else {
                console.error('❌ Failed to load events:', response.status);
            }
        } catch (error) {
            console.error('❌ Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventUpdate = () => {
        loadEvents(); // Reload events when they're updated
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading events...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
            <EventManager 
                teams={teams}
                currentUser={currentUser}
                onEventUpdate={handleEventUpdate}
                initialEvents={events}
                onNavigate={onNavigate}
                sportType={sportType}
            />
        </div>
    );
};

export default UnifiedEventsPage;