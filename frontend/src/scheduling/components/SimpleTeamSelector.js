import React from 'react';

/**
 * Simple Team Selector - Using buttons instead of checkboxes
 * Much easier to debug and control!
 */
const SimpleTeamSelector = ({ teams = [], selectedTeamIds = [], onTeamToggle, title = "Select Teams" }) => {
    
    console.log('🎯 SimpleTeamSelector props:', { 
        teamsCount: teams.length, 
        selectedTeamIds, 
        selectedCount: selectedTeamIds.length 
    });

    const leagueTeams = teams.filter(t => t.active && !t.isExternal);
    const externalTeams = teams.filter(t => t.isExternal);

    const isSelected = (teamId) => selectedTeamIds.includes(teamId);

    const handleTeamClick = (team) => {
        console.log('🔥 TEAM CLICKED:', { id: team.id, name: team.name, currentlySelected: isSelected(team.id) });
        onTeamToggle(team.id);
    };

    return (
        <div className="simple-team-selector">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            
            {/* Selection Summary */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                    <strong>{selectedTeamIds.length}</strong> teams selected
                </div>
                {selectedTeamIds.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                        Selected IDs: [{selectedTeamIds.join(', ')}]
                    </div>
                )}
            </div>

            {/* League Teams */}
            {leagueTeams.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">League Teams ({leagueTeams.length})</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {leagueTeams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => handleTeamClick(team)}
                                className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                                    isSelected(team.id)
                                        ? 'border-blue-500 bg-blue-100 text-blue-800'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded mr-3 border-2 ${
                                        isSelected(team.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                    }`}>
                                        {isSelected(team.id) && (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                    {team.style?.logoUrl && (
                                        <img 
                                            src={team.style.logoUrl} 
                                            alt={`${team.name} logo`}
                                            className="w-6 h-6 rounded mr-2"
                                        />
                                    )}
                                    <div>
                                        <div className="font-medium">{team.name}</div>
                                        <div className="text-xs text-gray-500">ID: {team.id}</div>
                                        {team.division && (
                                            <div className="text-xs text-gray-500">({team.division})</div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* External Teams */}
            {externalTeams.length > 0 && (
                <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-3">External Teams ({externalTeams.length})</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {externalTeams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => handleTeamClick(team)}
                                className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                                    isSelected(team.id)
                                        ? 'border-green-500 bg-green-100 text-green-800'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded mr-3 border-2 ${
                                        isSelected(team.id) ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                    }`}>
                                        {isSelected(team.id) && (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                    {team.style?.logoUrl && (
                                        <img 
                                            src={team.style.logoUrl} 
                                            alt={`${team.name} logo`}
                                            className="w-6 h-6 rounded mr-2"
                                        />
                                    )}
                                    <div>
                                        <div className="font-medium">{team.name}</div>
                                        <div className="text-xs text-gray-500">ID: {team.id}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex space-x-2 mt-4">
                <button
                    onClick={() => {
                        console.log('🧹 CLEAR ALL clicked');
                        selectedTeamIds.forEach(teamId => onTeamToggle(teamId));
                    }}
                    disabled={selectedTeamIds.length === 0}
                    className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Clear All ({selectedTeamIds.length})
                </button>
            </div>
        </div>
    );
};

export default SimpleTeamSelector;