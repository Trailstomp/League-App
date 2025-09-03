import { useState, useCallback, useEffect } from 'react';

/**
 * Dedicated team selection logic - No more data flow confusion!
 * This hook owns ALL team selection state and logic
 */
const useTeamSelection = (initialTeamIds = [], availableTeams = []) => {
    const [selectedTeamIds, setSelectedTeamIds] = useState(() => {
        // Handle legacy data formats
        if (Array.isArray(initialTeamIds)) {
            return [...initialTeamIds];
        }
        return [];
    });

    console.log('🏃 Team Selection Hook initialized with:', selectedTeamIds);

    // Simple team selection functions
    const selectTeam = useCallback((teamId) => {
        console.log('✅ Selecting team:', teamId);
        setSelectedTeamIds(prev => {
            if (prev.includes(teamId)) {
                return prev; // Already selected
            }
            return [...prev, teamId];
        });
    }, []);

    const deselectTeam = useCallback((teamId) => {
        console.log('❌ Deselecting team:', teamId);
        setSelectedTeamIds(prev => prev.filter(id => id !== teamId));
    }, []);

    const toggleTeam = useCallback((teamId) => {
        setSelectedTeamIds(prev => {
            const isSelected = prev.includes(teamId);
            console.log(`🔄 Toggling team ${teamId}: ${isSelected ? 'OFF' : 'ON'}`);
            return isSelected 
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId];
        });
    }, []);

    const selectAllTeams = useCallback((teamIds) => {
        console.log('🎯 Selecting all teams:', teamIds);
        setSelectedTeamIds([...teamIds]);
    }, []);

    const clearAllTeams = useCallback(() => {
        console.log('🧹 Clearing all team selections');
        setSelectedTeamIds([]);
    }, []);

    // Helper functions
    const isTeamSelected = useCallback((teamId) => {
        return selectedTeamIds.includes(teamId);
    }, [selectedTeamIds]);

    const getSelectedTeams = useCallback(() => {
        return availableTeams.filter(team => selectedTeamIds.includes(team.id));
    }, [selectedTeamIds, availableTeams]);

    const selectedCount = selectedTeamIds.length;

    // League vs External team helpers
    const getLeagueTeams = useCallback(() => {
        return availableTeams.filter(team => team.active && !team.isExternal);
    }, [availableTeams]);

    const getExternalTeams = useCallback(() => {
        return availableTeams.filter(team => team.isExternal);
    }, [availableTeams]);

    const selectAllLeagueTeams = useCallback(() => {
        const leagueTeams = getLeagueTeams();
        const externalTeamIds = selectedTeamIds.filter(id => 
            availableTeams.some(team => team.id === id && team.isExternal)
        );
        setSelectedTeamIds([...externalTeamIds, ...leagueTeams.map(t => t.id)]);
    }, [getLeagueTeams, selectedTeamIds, availableTeams]);

    const areAllLeagueTeamsSelected = useCallback(() => {
        const leagueTeams = getLeagueTeams();
        const selectedLeagueTeams = selectedTeamIds.filter(id => 
            leagueTeams.some(team => team.id === id)
        );
        return leagueTeams.length > 0 && selectedLeagueTeams.length === leagueTeams.length;
    }, [getLeagueTeams, selectedTeamIds]);

    return {
        // State
        selectedTeamIds,
        selectedCount,
        
        // Basic operations
        selectTeam,
        deselectTeam,  
        toggleTeam,
        selectAllTeams,
        clearAllTeams,
        
        // Helpers
        isTeamSelected,
        getSelectedTeams,
        
        // League/External specific
        getLeagueTeams,
        getExternalTeams,
        selectAllLeagueTeams,
        areAllLeagueTeamsSelected,
        
        // Direct setter for external updates
        setSelectedTeamIds
    };
};

export default useTeamSelection;