import React from 'react';

/**
 * Dedicated TeamSelector Component - Single Responsibility
 * Handles ONLY team selection UI and logic
 */
const TeamSelector = ({ teams = [], teamSelection, title = "Select Teams" }) => {
    
    const leagueTeams = teamSelection.getLeagueTeams();
    const externalTeams = teamSelection.getExternalTeams();

    console.log('🏃 TeamSelector rendered:', {
        totalTeams: teams.length,
        leagueTeams: leagueTeams.length,
        externalTeams: externalTeams.length,
        selectedCount: teamSelection.selectedCount
    });

    return (
        <div className="team-selector">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            
            {/* Selection Summary */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                    <strong>{teamSelection.selectedCount}</strong> teams selected
                </div>
                {teamSelection.selectedCount > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                        Selected: {teamSelection.getSelectedTeams().map(t => t.name).join(', ')}
                    </div>
                )}
            </div>

            {/* League Teams */}
            {leagueTeams.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-700">League Teams</h4>
                        <label className="flex items-center text-sm">
                            <input
                                type="checkbox"
                                checked={teamSelection.areAllLeagueTeamsSelected()}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        teamSelection.selectAllLeagueTeams();
                                    } else {
                                        // Clear only league teams, keep external teams
                                        const externalTeamIds = teamSelection.selectedTeamIds.filter(id => 
                                            teams.some(team => team.id === id && team.isExternal)
                                        );
                                        teamSelection.setSelectedTeamIds(externalTeamIds);
                                    }
                                }}
                                className="mr-2 rounded"
                            />
                            Select All League Teams
                        </label>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {leagueTeams.map(team => (
                            <label key={team.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                                <input
                                    type="checkbox"
                                    checked={teamSelection.isTeamSelected(team.id)}
                                    onChange={() => teamSelection.toggleTeam(team.id)}
                                    className="mr-3 rounded"
                                />
                                <div className="flex items-center flex-1">
                                    {team.style?.logoUrl && (
                                        <img 
                                            src={team.style.logoUrl} 
                                            alt={`${team.name} logo`}
                                            className="w-6 h-6 rounded mr-2"
                                        />
                                    )}
                                    <span className="font-medium">{team.name}</span>
                                    {team.division && (
                                        <span className="ml-2 text-sm text-gray-500">({team.division})</span>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* External Teams */}
            {externalTeams.length > 0 && (
                <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-3">External Teams</h4>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {externalTeams.map(team => (
                            <label key={team.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                                <input
                                    type="checkbox"
                                    checked={teamSelection.isTeamSelected(team.id)}
                                    onChange={() => teamSelection.toggleTeam(team.id)}
                                    className="mr-3 rounded"
                                />
                                <div className="flex items-center flex-1">
                                    {team.style?.logoUrl && (
                                        <img 
                                            src={team.style.logoUrl} 
                                            alt={`${team.name} logo`}
                                            className="w-6 h-6 rounded mr-2"
                                        />
                                    )}
                                    <span className="font-medium">{team.name}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex space-x-2">
                <button
                    onClick={() => teamSelection.clearAllTeams()}
                    disabled={teamSelection.selectedCount === 0}
                    className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Clear All
                </button>
                <button
                    onClick={() => teamSelection.selectAllTeams(teams.map(t => t.id))}
                    disabled={teamSelection.selectedCount === teams.length}
                    className="px-3 py-1 text-sm border border-green-300 text-green-700 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Select All Teams
                </button>
            </div>
        </div>
    );
};

export default TeamSelector;