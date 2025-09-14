import { useCallback } from 'react';

/**
 * Clean event persistence - no more complex save/load cycles!
 * Handles all backend communication for events
 */
const useEventPersistence = () => {
    
    const saveEventToSchedule = useCallback(async (eventData, leagueSchedule, setLeagueSchedule) => {
        try {
            console.log('💾 Saving event to schedule:', eventData);
            
            // Create clean event object
            const eventToSave = {
                ...eventData,
                id: eventData.id || `event_${Date.now()}`,
                teamIds: eventData.teamIds || [], // Ensure teamIds is always an array
            };
            
            console.log('💾 Final event to save:', eventToSave);
            
            let updatedSchedule;
            
            if (!eventData.id || eventData.id.startsWith('temp_') || eventData.id.startsWith('event_')) {
                // New event
                console.log('➕ Adding new event to schedule');
                updatedSchedule = [...leagueSchedule, eventToSave];
                setLeagueSchedule(updatedSchedule);
                console.log('💾 New schedule with added event:', updatedSchedule.length, 'events');
            } else {
                // Update existing event
                console.log('✏️ Updating existing event in schedule');
                updatedSchedule = leagueSchedule.map(e => 
                    e.id === eventData.id ? eventToSave : e
                );
                setLeagueSchedule(updatedSchedule);
                console.log('💾 Schedule updated, found existing event:', updatedSchedule.some(e => e.id === eventData.id));
            }
            
            // CRITICAL FIX: Save to backend API
            console.log('🔄 Saving schedule to backend API...');
            const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
            const response = await fetch(`${backendUrl}/api/league-data/leagueSchedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedSchedule)
            });
            
            if (!response.ok) {
                console.error('❌ Failed to save events to backend:', response.status, response.statusText);
                throw new Error(`Backend save failed: ${response.status}`);
            }
            
            console.log('✅ Events successfully saved to backend');
            
            return { success: true, event: eventToSave };
            
            return { success: true, event: eventToSave };
            
        } catch (error) {
            console.error('❌ Error saving event:', error);
            return { success: false, error: error.message };
        }
    }, []);

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
            // Handle legacy teamId vs teamIds
            teamIds: (() => {
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

    const deleteEventFromSchedule = useCallback((eventId, setLeagueSchedule) => {
        try {
            console.log('🗑️ Deleting event from schedule:', eventId);
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
    }, []);

    return {
        saveEventToSchedule,
        loadEventForEditing,
        deleteEventFromSchedule
    };
};

export default useEventPersistence;