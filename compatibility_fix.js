// COMPATIBILITY FIX for handleEditEvent function
// Replace the teamIds assignment in handleEditEvent with this code:

// COMPATIBILITY FIX: Handle both old (teamId) and new (teamIds) data formats
let compatibleTeamIds = [];
if (event.teamIds && Array.isArray(event.teamIds)) {
    // New format: teamIds array
    compatibleTeamIds = event.teamIds;
} else if (event.teamId) {
    // Legacy format: single teamId string -> convert to array
    compatibleTeamIds = [event.teamId];
} else {
    // No team data
    compatibleTeamIds = [];
}

console.log('🔍 COMPATIBILITY - Final teamIds:', compatibleTeamIds);

// Then use compatibleTeamIds instead of event.teamIds || []
// Change this line in setEditingEvent:
//   teamIds: event.teamIds || []
// To this:
//   teamIds: compatibleTeamIds