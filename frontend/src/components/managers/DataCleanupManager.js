import React, { useState, useEffect } from 'react';
import HealthAlertSettings from './HealthAlertSettings';

/**
 * DataCleanupManager - Utility for cleaning up orphaned data in the database
 * Helps remove retired users, orphaned player references, etc.
 */
const DataCleanupManager = () => {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [preview, setPreview] = useState(null);
    const [cleanupResult, setCleanupResult] = useState(null);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('cleanup');
    const [teamId, setTeamId] = useState('');
    const [teamSources, setTeamSources] = useState(null);
    const [teams, setTeams] = useState([]);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Fetch database stats and teams on mount
    useEffect(() => {
        fetchStats();
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/league-data`);
            if (response.ok) {
                const data = await response.json();
                setTeams(data.teams || []);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/cleanup/database-stats`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            setMessage('❌ Error fetching database statistics');
        } finally {
            setLoading(false);
        }
    };

    const checkTeamPlayerSources = async (id) => {
        if (!id) return;
        try {
            setLoading(true);
            setMessage('');
            const response = await fetch(`${backendUrl}/api/cleanup/team/${id}/player-sources`);
            if (response.ok) {
                const data = await response.json();
                setTeamSources(data);
            } else {
                setMessage('❌ Error fetching player sources');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('❌ Network error');
        } finally {
            setLoading(false);
        }
    };

    const clearAllTeamPlayers = async (id) => {
        if (!window.confirm(`Are you sure you want to clear ALL player references for this team? This cannot be undone.`)) {
            return;
        }
        try {
            setLoading(true);
            setMessage('');
            const response = await fetch(`${backendUrl}/api/cleanup/team/${id}/clear-all-players?confirm=true`, {
                method: 'POST'
            });
            if (response.ok) {
                const data = await response.json();
                setMessage(`✅ Cleared ${data.total_cleared} player references`);
                setCleanupResult(data.results);
                // Refresh sources
                await checkTeamPlayerSources(id);
                await fetchStats();
            } else {
                setMessage('❌ Error clearing players');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('❌ Network error');
        } finally {
            setLoading(false);
        }
    };

    const previewOrphanedData = async () => {
        try {
            setLoading(true);
            setMessage('');
            const response = await fetch(`${backendUrl}/api/cleanup/orphaned-players/preview`);
            if (response.ok) {
                const data = await response.json();
                setPreview(data);
                if (data.total_issues === 0) {
                    setMessage('✅ No orphaned data found! Your database is clean.');
                }
            } else {
                setMessage('❌ Error previewing orphaned data');
            }
        } catch (error) {
            console.error('Error previewing:', error);
            setMessage('❌ Error previewing orphaned data');
        } finally {
            setLoading(false);
        }
    };

    const cleanOrphanedData = async () => {
        if (!window.confirm('Are you sure you want to clean up orphaned data? This cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            setMessage('');
            const response = await fetch(`${backendUrl}/api/cleanup/orphaned-players/clean`, {
                method: 'POST'
            });
            if (response.ok) {
                const data = await response.json();
                setCleanupResult(data);
                setMessage(`✅ ${data.message}`);
                // Refresh stats and preview
                await fetchStats();
                setPreview(null);
            } else {
                setMessage('❌ Error cleaning orphaned data');
            }
        } catch (error) {
            console.error('Error cleaning:', error);
            setMessage('❌ Error cleaning orphaned data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('cleanup')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'cleanup'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                >
                    🧹 Data Cleanup
                </button>
                <button
                    onClick={() => setActiveTab('team-players')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'team-players'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                >
                    👥 Team Players
                </button>
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'alerts'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                >
                    📧 Health Alerts
                </button>
            </div>

            {activeTab === 'alerts' ? (
                <HealthAlertSettings />
            ) : activeTab === 'team-players' ? (
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">👥 Team Player Sources</h3>
                        <p className="text-blue-700 text-sm">
                            This tool shows ALL sources where players are stored for a team.
                            Use this to find and clear phantom players that appear even after deletion.
                        </p>
                    </div>

                    {/* Team Selector */}
                    <div className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">Select a Team to Inspect</h4>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Team</label>
                                <select
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="">Select a team...</option>
                                    {teams.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => checkTeamPlayerSources(teamId)}
                                disabled={!teamId || loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? '⏳ Loading...' : '🔍 Check Sources'}
                            </button>
                        </div>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {message}
                        </div>
                    )}

                    {/* Team Sources Results */}
                    {teamSources && (
                        <div className="bg-white border rounded-lg overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center">
                                <h3 className="font-semibold text-slate-800">
                                    Player Sources for Team: {teams.find(t => t.id === teamSources.team_id)?.name || teamSources.team_id}
                                </h3>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                    {teamSources.total_unique_players} unique players
                                </span>
                            </div>
                            
                            <div className="p-4 space-y-4">
                                {/* Source 1: Users with teamId */}
                                <div className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-medium text-slate-800">
                                            📁 Source 1: Users with teamId field
                                        </h5>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            teamSources.users_with_teamId?.length > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {teamSources.users_with_teamId?.length || 0} found
                                        </span>
                                    </div>
                                    {teamSources.users_with_teamId?.length > 0 && (
                                        <ul className="text-sm text-slate-600 space-y-1">
                                            {teamSources.users_with_teamId.map((u, i) => (
                                                <li key={i}>• {u.name} ({u.email}) - status: {u.status}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Source 2: Users with teamAssignments */}
                                <div className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-medium text-slate-800">
                                            📁 Source 2: Users with teamAssignments
                                        </h5>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            teamSources.users_with_teamAssignment?.length > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {teamSources.users_with_teamAssignment?.length || 0} found
                                        </span>
                                    </div>
                                    {teamSources.users_with_teamAssignment?.length > 0 && (
                                        <ul className="text-sm text-slate-600 space-y-1">
                                            {teamSources.users_with_teamAssignment.map((u, i) => (
                                                <li key={i}>• {u.name} ({u.email}) - status: {u.status}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Source 3: Legacy league_data.players */}
                                <div className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-medium text-slate-800">
                                            📁 Source 3: Legacy league_data.players array
                                        </h5>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            teamSources.legacy_league_data_players?.length > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {teamSources.legacy_league_data_players?.length || 0} found
                                        </span>
                                    </div>
                                    {teamSources.legacy_league_data_players?.length > 0 && (
                                        <ul className="text-sm text-slate-600 space-y-1">
                                            {teamSources.legacy_league_data_players.map((p, i) => (
                                                <li key={i}>• {p.name} ({p.email || 'no email'})</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Source 4: Team roster array */}
                                <div className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-medium text-slate-800">
                                            📁 Source 4: Team roster array
                                        </h5>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            teamSources.team_roster_array?.length > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {teamSources.team_roster_array?.length || 0} found
                                        </span>
                                    </div>
                                    {teamSources.team_roster_array?.length > 0 && (
                                        <pre className="text-xs text-slate-600 bg-slate-50 p-2 rounded overflow-auto max-h-32">
                                            {JSON.stringify(teamSources.team_roster_array, null, 2)}
                                        </pre>
                                    )}
                                </div>

                                {/* Source 5: Team players array */}
                                <div className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-medium text-slate-800">
                                            📁 Source 5: Team players array
                                        </h5>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            teamSources.team_players_array?.length > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {teamSources.team_players_array?.length || 0} found
                                        </span>
                                    </div>
                                    {teamSources.team_players_array?.length > 0 && (
                                        <pre className="text-xs text-slate-600 bg-slate-50 p-2 rounded overflow-auto max-h-32">
                                            {JSON.stringify(teamSources.team_players_array, null, 2)}
                                        </pre>
                                    )}
                                </div>

                                {/* Clear All Button */}
                                {teamSources.total_unique_players > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h5 className="font-semibold text-red-800 mb-2">🗑️ Clear All Player References</h5>
                                        <p className="text-sm text-red-700 mb-4">
                                            This will remove ALL player references for this team from ALL sources above.
                                            This action cannot be undone.
                                        </p>
                                        <button
                                            onClick={() => clearAllTeamPlayers(teamSources.team_id)}
                                            disabled={loading}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                        >
                                            {loading ? '⏳ Clearing...' : '🗑️ Clear All Players from This Team'}
                                        </button>
                                    </div>
                                )}

                                {/* Cleanup Results */}
                                {cleanupResult && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h5 className="font-semibold text-green-800 mb-2">✅ Cleanup Complete</h5>
                                        <ul className="text-sm text-green-700 space-y-1">
                                            <li>• Users with teamId cleared: {cleanupResult.users_teamId_cleared}</li>
                                            <li>• Users with teamAssignment cleared: {cleanupResult.users_teamAssignment_cleared}</li>
                                            <li>• Legacy players cleared: {cleanupResult.legacy_players_cleared}</li>
                                            <li>• Team roster entries cleared: {cleanupResult.team_roster_cleared}</li>
                                            <li>• Team players entries cleared: {cleanupResult.team_players_cleared}</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
            ) : (
            <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">🧹 Data Cleanup Utility</h3>
                <p className="text-amber-700 text-sm">
                    This tool helps you find and remove orphaned data from the database - such as 
                    deleted users that still appear in team rosters, or legacy player entries that 
                    no longer have valid accounts.
                </p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Database Statistics */}
            <div className="bg-white border rounded-lg p-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-4">📊 Database Statistics</h4>
                {stats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.users.total}</div>
                            <div className="text-sm text-blue-700">Total Users</div>
                            <div className="text-xs text-blue-600 mt-1">
                                {stats.users.active} active • {stats.users.pending} pending
                            </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-green-600">{stats.teams.total}</div>
                            <div className="text-sm text-green-700">Teams</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-purple-600">{stats.legacy_players}</div>
                            <div className="text-sm text-purple-700">Legacy Players</div>
                            <div className="text-xs text-purple-600 mt-1">Old data structure</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-orange-600">{stats.team_roster_entries}</div>
                            <div className="text-sm text-orange-700">Roster Entries</div>
                            <div className="text-xs text-orange-600 mt-1">In team objects</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-500">
                        {loading ? 'Loading statistics...' : 'No statistics available'}
                    </div>
                )}
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                >
                    🔄 Refresh Stats
                </button>
            </div>

            {/* Orphaned Data Preview */}
            <div className="bg-white border rounded-lg p-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-4">🔍 Find Orphaned Data</h4>
                <p className="text-slate-600 text-sm mb-4">
                    Scan the database for players that were deleted but still appear in team rosters 
                    or other areas. This is a preview - no data will be modified.
                </p>
                
                <button
                    onClick={previewOrphanedData}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? '⏳ Scanning...' : '🔍 Scan for Orphaned Data'}
                </button>

                {preview && preview.total_issues > 0 && (
                    <div className="mt-6 space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="text-lg font-semibold text-yellow-800">
                                Found {preview.total_issues} issue(s)
                            </div>
                        </div>

                        {/* Legacy Players */}
                        {preview.legacy_players.length > 0 && (
                            <div className="border rounded-lg p-4">
                                <h5 className="font-semibold text-slate-700 mb-2">
                                    📋 Legacy Players ({preview.legacy_players.length})
                                </h5>
                                <p className="text-sm text-slate-500 mb-3">
                                    These entries exist in the old players array but no longer have active user accounts.
                                </p>
                                <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="text-left p-2">Name</th>
                                                <th className="text-left p-2">Email</th>
                                                <th className="text-left p-2">Team</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.legacy_players.map((p, idx) => (
                                                <tr key={idx} className="border-t">
                                                    <td className="p-2">{p.name}</td>
                                                    <td className="p-2 text-slate-500">{p.email || '-'}</td>
                                                    <td className="p-2 text-slate-500">{p.teamId || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Orphaned Team Assignments */}
                        {preview.orphaned_team_assignments.length > 0 && (
                            <div className="border rounded-lg p-4">
                                <h5 className="font-semibold text-slate-700 mb-2">
                                    👥 Orphaned Team Roster Entries ({preview.orphaned_team_assignments.length})
                                </h5>
                                <p className="text-sm text-slate-500 mb-3">
                                    These team roster entries reference users that no longer exist.
                                </p>
                                <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="text-left p-2">Team</th>
                                                <th className="text-left p-2">Player</th>
                                                <th className="text-left p-2">Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.orphaned_team_assignments.map((a, idx) => (
                                                <tr key={idx} className="border-t">
                                                    <td className="p-2">{a.teamName}</td>
                                                    <td className="p-2">{a.playerName || a.playerId?.substring(0, 8) + '...'}</td>
                                                    <td className="p-2 text-slate-500 text-xs">{a.reason}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Invalid Team Assignments */}
                        {preview.users_without_valid_teams.length > 0 && (
                            <div className="border rounded-lg p-4">
                                <h5 className="font-semibold text-slate-700 mb-2">
                                    ⚠️ Invalid Team Assignments ({preview.users_without_valid_teams.length})
                                </h5>
                                <p className="text-sm text-slate-500 mb-3">
                                    These users have team assignments referencing teams that no longer exist.
                                </p>
                                <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="text-left p-2">User</th>
                                                <th className="text-left p-2">Invalid Team ID</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.users_without_valid_teams.map((u, idx) => (
                                                <tr key={idx} className="border-t">
                                                    <td className="p-2">{u.userName}</td>
                                                    <td className="p-2 text-slate-500 font-mono text-xs">{u.invalidTeamId}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Cleanup Button */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h5 className="font-semibold text-red-800 mb-2">🗑️ Clean Up Orphaned Data</h5>
                            <p className="text-sm text-red-700 mb-4">
                                This will permanently remove all orphaned data shown above. 
                                This action cannot be undone.
                            </p>
                            <button
                                onClick={cleanOrphanedData}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {loading ? '⏳ Cleaning...' : '🗑️ Clean Up Now'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Cleanup Results */}
            {cleanupResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-green-800 mb-4">✅ Cleanup Complete</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{cleanupResult.legacy_players_removed}</div>
                            <div className="text-sm text-slate-600">Legacy Players Removed</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{cleanupResult.team_roster_entries_removed}</div>
                            <div className="text-sm text-slate-600">Roster Entries Removed</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{cleanupResult.invalid_team_assignments_removed}</div>
                            <div className="text-sm text-slate-600">Invalid Assignments Removed</div>
                        </div>
                    </div>
                </div>
            )}
            </>
            )}
        </div>
    );
};

export default DataCleanupManager;
