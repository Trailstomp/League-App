import { useCallback } from 'react';

/**
 * Clean event persistence - uses unified-events API as single source of truth
 * Handles all backend communication for events
 */
const useEventPersistence = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    const saveEventToSchedule = useCallback(async (eventData, leagueSchedule, setLeagueSchedule) => {
        try {
            console.log('💾 Saving event to unified-events:', eventData);
            
            // Check if this is a new event or update
            const isNewEvent = !eventData.id || eventData.id.startsWith('temp_');
            
            // Create clean event object for API
            const eventToSave = {
                id: eventData.id || `event_${Date.now()}`,
                title: eventData.title || 'Untitled Event',
                date: eventData.date || null,
                time: eventData.time || null,
                location: eventData.location || '',
                description: eventData.description || '',
                type: eventData.type || 'event',
                status: eventData.status || 'scheduled',
                imageUrl: eventData.imageUrl || '',
                teams: eventData.teams || eventData.teamIds || [],
                rsvp_enabled: eventData.rsvp_enabled ?? true,
                groupme_integration: eventData.groupme_integration ?? false,
                email_notifications: eventData.email_notifications ?? false,
            };
            
            console.log('💾 Final event to save:', eventToSave);
            
            let response;
            
            if (isNewEvent) {
                // Create new event via unified-events API
                console.log('➕ Creating new event via unified-events API');
                response = await fetch(`${backendUrl}/api/unified-events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventToSave)
                });
            } else {
                // Update existing event via unified-events API
                console.log('✏️ Updating existing event via unified-events API:', eventToSave.id);
                response = await fetch(`${backendUrl}/api/unified-events/${eventToSave.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventToSave)
                });
            }
            
            console.log('📡 API Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Failed to save event:', response.status, response.statusText, errorText);
                throw new Error(`Backend save failed: ${response.status} - ${errorText}`);
            }
            
            const savedEvent = await response.json();
            console.log('✅ Event saved successfully:', savedEvent);
            
            // Update local state
            if (isNewEvent) {
                setLeagueSchedule(prev => [...prev, savedEvent]);
            } else {
                setLeagueSchedule(prev => prev.map(e => e.id === savedEvent.id ? savedEvent : e));
            }
            
            return { success: true, event: savedEvent };
            
        } catch (error) {
            console.error('❌ Error saving event:', error);
            return { success: false, error: error.message };
        }
    }, [backendUrl]);

    const loadEventForEditing = useCallback((eventData) => {
        console.log('📖 Loading event for editing:', eventData);
        
        // Clean data preparation with legacy compatibility
        const cleanEventData = {
            id: eventData.id,
            title: eventData.title || '',
            date: eventData.date || '',
            time: eventData.time || '',
            location: eventData.location || '',
            description: eventData.description || '',
            type: eventData.type || 'event',
            status: eventData.status || 'scheduled',
            imageUrl: eventData.imageUrl || '',
            customLocation: eventData.customLocation || '',
            homeScore: eventData.homeScore || 0,
            awayScore: eventData.awayScore || 0,
            homeTeam: eventData.homeTeam || '',
            awayTeam: eventData.awayTeam || '',
            // Handle legacy teamId vs teamIds vs teams
            teamIds: (() => {
                if (eventData.teams && Array.isArray(eventData.teams)) {
                    return eventData.teams.map(t => typeof t === 'string' ? t : t.id);
                }
                if (eventData.teamIds && Array.isArray(eventData.teamIds)) {
                    return [...eventData.teamIds];
                } else if (eventData.teamId) {
                    return [eventData.teamId];
                }
                return [];
            })()
        };
        
        console.log('📖 Clean event data for editing:', cleanEventData);
        return cleanEventData;
    }, []);

    const deleteEventFromSchedule = useCallback(async (eventId, setLeagueSchedule) => {
        try {
            console.log('🗑️ Deleting event via unified-events API:', eventId);
            
            const response = await fetch(`${backendUrl}/api/unified-events/${eventId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Failed to delete event:', response.status, errorText);
                throw new Error(`Delete failed: ${response.status}`);
            }
            
            // Update local state
            setLeagueSchedule(prev => {
                const filtered = prev.filter(e => e.id !== eventId);
                console.log('🗑️ Schedule after deletion:', filtered.length, 'events remaining');
                return filtered;
            });
            
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting event:', error);
            return { success: false, error: error.message };
        }
    }, [backendUrl]);

    return {
        saveEventToSchedule,
        loadEventForEditing,
        deleteEventFromSchedule
    };
};

export default useEventPersistence;
