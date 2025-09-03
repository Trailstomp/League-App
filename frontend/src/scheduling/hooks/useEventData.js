import { useState, useCallback } from 'react';

/**
 * Single source of truth for event data
 * Clean, focused hook that manages event state without complex merging
 */
const useEventData = (initialEvent = null) => {
    // Simple, clear state structure
    const [eventData, setEventData] = useState({
        id: initialEvent?.id || null,
        title: initialEvent?.title || '',
        date: initialEvent?.date || '',
        time: initialEvent?.time || '',
        location: initialEvent?.location || '',
        description: initialEvent?.description || '',
        type: initialEvent?.type || 'event',
        status: initialEvent?.status || 'scheduled',
        // Legacy compatibility
        teamIds: initialEvent?.teamIds || initialEvent?.teamId ? [initialEvent.teamId] : [],
        imageUrl: initialEvent?.imageUrl || '',
        customLocation: initialEvent?.customLocation || '',
        homeScore: initialEvent?.homeScore || 0,
        awayScore: initialEvent?.awayScore || 0,
        homeTeam: initialEvent?.homeTeam || '',
        awayTeam: initialEvent?.awayTeam || '',
    });

    // Simple, direct update functions
    const updateField = useCallback((field, value) => {
        console.log(`📝 Updating ${field}:`, value);
        setEventData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const updateMultipleFields = useCallback((updates) => {
        console.log('📝 Updating multiple fields:', updates);
        setEventData(prev => ({
            ...prev,
            ...updates
        }));
    }, []);

    const resetEvent = useCallback(() => {
        console.log('🔄 Resetting event data');
        setEventData({
            id: null,
            title: '',
            date: '',
            time: '',
            location: '',
            description: '',
            type: 'event',
            status: 'scheduled',
            teamIds: [],
            imageUrl: '',
            customLocation: '',
            homeScore: 0,
            awayScore: 0,
            homeTeam: '',
            awayTeam: '',
        });
    }, []);

    return {
        eventData,
        updateField,
        updateMultipleFields,
        resetEvent,
        isNewEvent: !eventData.id || eventData.id.startsWith('temp_')
    };
};

export default useEventData;