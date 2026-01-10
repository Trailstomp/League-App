import React, { useState, useEffect } from 'react';

/**
 * DataHealthWidget - Shows database health status at a glance
 * Displays orphaned data, user counts, and storage stats
 */
const DataHealthWidget = () => {
    const [stats, setStats] = useState(null);
    const [orphanedPreview, setOrphanedPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        fetchHealthData();
    }, []);

    const fetchHealthData = async () => {
        try {
            setLoading(true);
            
            // Fetch both stats and orphaned preview in parallel
            const [statsRes, orphanedRes] = await Promise.all([
                fetch(`${backendUrl}/api/cleanup/database-stats`),
                fetch(`${backendUrl}/api/cleanup/orphaned-players/preview`)
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (orphanedRes.ok) {
                const orphanedData = await orphanedRes.json();
                setOrphanedPreview(orphanedData);
            }

            setLastChecked(new Date());
        } catch (error) {
            console.error('Error fetching health data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Determine health status
    const getHealthStatus = () => {
        if (!stats || !orphanedPreview) return { status: 'unknown', color: 'slate', icon: '❓' };
        
        const issues = orphanedPreview.total_issues || 0;
        const legacyPlayers = stats.legacy_players || 0;
        const pendingUsers = stats.users?.pending || 0;
        
        if (issues > 5 || legacyPlayers > 10) {
            return { status: 'Needs Attention', color: 'red', icon: '⚠️' };
        } else if (issues > 0 || legacyPlayers > 0 || pendingUsers > 5) {
            return { status: 'Minor Issues', color: 'yellow', icon: '⚡' };
        }
        return { status: 'Healthy', color: 'green', icon: '✅' };
    };

    const health = getHealthStatus();

    if (loading) {
        return (
            <div className="bg-white border rounded-lg p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-slate-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-lg overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 bg-${health.color}-50 border-b border-${health.color}-200`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{health.icon}</span>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Database Health</h3>
                            <p className={`text-sm text-${health.color}-700`}>{health.status}</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchHealthData}
                        className="px-3 py-1.5 bg-white border rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Active Users */}
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {stats?.users?.active || 0}
                        </div>
                        <div className="text-sm text-green-700">Active Users</div>
                    </div>

                    {/* Pending Users */}
                    <div className={`rounded-lg p-4 text-center ${
                        (stats?.users?.pending || 0) > 0 ? 'bg-yellow-50' : 'bg-slate-50'
                    }`}>
                        <div className={`text-2xl font-bold ${
                            (stats?.users?.pending || 0) > 0 ? 'text-yellow-600' : 'text-slate-600'
                        }`}>
                            {stats?.users?.pending || 0}
                        </div>
                        <div className={`text-sm ${
                            (stats?.users?.pending || 0) > 0 ? 'text-yellow-700' : 'text-slate-600'
                        }`}>Pending Approval</div>
                    </div>

                    {/* Orphaned Data */}
                    <div className={`rounded-lg p-4 text-center ${
                        (orphanedPreview?.total_issues || 0) > 0 ? 'bg-red-50' : 'bg-slate-50'
                    }`}>
                        <div className={`text-2xl font-bold ${
                            (orphanedPreview?.total_issues || 0) > 0 ? 'text-red-600' : 'text-slate-600'
                        }`}>
                            {orphanedPreview?.total_issues || 0}
                        </div>
                        <div className={`text-sm ${
                            (orphanedPreview?.total_issues || 0) > 0 ? 'text-red-700' : 'text-slate-600'
                        }`}>Orphaned Records</div>
                    </div>

                    {/* Teams */}
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {stats?.teams?.total || 0}
                        </div>
                        <div className="text-sm text-blue-700">Teams</div>
                    </div>
                </div>

                {/* Issues Detail */}
                {(orphanedPreview?.total_issues > 0 || stats?.legacy_players > 0) && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="font-semibold text-amber-800 mb-2">Issues Found:</h4>
                        <ul className="text-sm text-amber-700 space-y-1">
                            {orphanedPreview?.legacy_players?.length > 0 && (
                                <li>• {orphanedPreview.legacy_players.length} legacy player(s) without user accounts</li>
                            )}
                            {orphanedPreview?.orphaned_team_assignments?.length > 0 && (
                                <li>• {orphanedPreview.orphaned_team_assignments.length} orphaned team roster entrie(s)</li>
                            )}
                            {orphanedPreview?.users_without_valid_teams?.length > 0 && (
                                <li>• {orphanedPreview.users_without_valid_teams.length} user(s) assigned to deleted teams</li>
                            )}
                            {stats?.legacy_players > 0 && (
                                <li>• {stats.legacy_players} record(s) in legacy players array</li>
                            )}
                        </ul>
                        <p className="text-xs text-amber-600 mt-2">
                            Go to Settings → Data Cleanup to resolve these issues
                        </p>
                    </div>
                )}

                {/* Last Checked */}
                {lastChecked && (
                    <p className="text-xs text-slate-400 mt-4 text-right">
                        Last checked: {lastChecked.toLocaleTimeString()}
                    </p>
                )}
            </div>
        </div>
    );
};

export default DataHealthWidget;
