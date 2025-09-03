// COMPREHENSIVE TEAM SELECTION DEBUG SCRIPT
// This will be injected into the browser to trace exactly what's happening

// Step 1: Monitor all state changes related to editingEvent and teams
const originalSetEditingEvent = window.setEditingEvent;
if (originalSetEditingEvent) {
    window.setEditingEvent = function(newState) {
        console.log('🔍 STEP 1 - setEditingEvent called with:', newState);
        if (newState && newState.teamIds) {
            console.log('🔍 STEP 1 - teamIds in new state:', newState.teamIds);
        }
        return originalSetEditingEvent(newState);
    };
}

// Step 2: Monitor leagueSchedule updates
const originalSetLeagueSchedule = window.setLeagueSchedule;
if (originalSetLeagueSchedule) {
    window.setLeagueSchedule = function(updater) {
        console.log('🔍 STEP 2 - setLeagueSchedule called');
        
        if (typeof updater === 'function') {
            const originalUpdater = updater;
            updater = function(prevSchedule) {
                const result = originalUpdater(prevSchedule);
                console.log('🔍 STEP 2 - leagueSchedule updated, new schedule:', result);
                // Check for events with teamIds
                result.forEach((event, index) => {
                    if (event.teamIds) {
                        console.log(`🔍 STEP 2 - Event ${index} teamIds:`, event.teamIds);
                    }
                });
                return result;
            };
        }
        
        return originalSetLeagueSchedule(updater);
    };
}

// Step 3: Monitor checkbox changes
document.addEventListener('change', function(e) {
    if (e.target.type === 'checkbox' && e.target.closest('form')) {
        console.log('🔍 STEP 3 - Checkbox changed:', {
            checked: e.target.checked,
            value: e.target.value,
            name: e.target.name,
            nearbyText: e.target.closest('label')?.textContent?.trim()
        });
    }
});

// Step 4: Monitor all fetch requests to see what's actually being saved
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    if (url && url.includes('/api/league-data')) {
        console.log('🔍 STEP 4 - API call to:', url);
        if (options.method === 'POST' && options.body) {
            try {
                const body = JSON.parse(options.body);
                console.log('🔍 STEP 4 - POST body:', body);
                
                // Check if this is leagueSchedule data
                if (Array.isArray(body)) {
                    body.forEach((event, index) => {
                        if (event.teamIds) {
                            console.log(`🔍 STEP 4 - Saving event ${index} with teamIds:`, event.teamIds);
                        }
                    });
                }
            } catch (e) {
                console.log('🔍 STEP 4 - Could not parse POST body');
            }
        }
    }
    
    return originalFetch.apply(this, args).then(response => {
        if (url && url.includes('/api/league-data') && response.ok) {
            console.log('🔍 STEP 4 - API response successful for:', url, response.status);
        }
        return response;
    });
};

console.log('🚀 TEAM SELECTION DEBUG SCRIPT LOADED - Ready to trace data flow!');