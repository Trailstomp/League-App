import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, Eye, TrendingUp, Calendar, Filter } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const ROLE_COLORS = {
    guest: '#94a3b8',
    player: '#3b82f6',
    team_coach: '#f59e0b',
    league_admin: '#ef4444',
    admin: '#ef4444',
    coach: '#f59e0b',
    commissioner: '#8b5cf6'
};

const PAGE_LABELS = {
    home: 'League Home',
    events: 'Events & Schedule',
    'live-game': 'Live Game View',
    standings: 'Standings',
    team: 'Team Page',
    email: 'Email',
    chat: 'League Chat',
    help: 'Help & Docs',
    'player-dashboard': 'Player Dashboard'
};

const VisitTracker = () => {
    const [summary, setSummary] = useState(null);
    const [trends, setTrends] = useState(null);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [trendFilter, setTrendFilter] = useState('all'); // all, or specific page

    useEffect(() => {
        loadData();
    }, [days]);

    useEffect(() => {
        loadTrends();
    }, [days, trendFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/analytics/summary?days=${days}`);
            const data = await res.json();
            setSummary(data);
        } catch (e) {
            console.error('Error loading analytics:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadTrends = async () => {
        try {
            const params = new URLSearchParams({ days: days.toString() });
            if (trendFilter !== 'all') params.set('page', trendFilter);
            const res = await fetch(`${BACKEND_URL}/api/analytics/trends?${params}`);
            const data = await res.json();
            setTrends(data.trends || []);
        } catch (e) {
            console.error('Error loading trends:', e);
        }
    };

    // Separate pages into site pages and team pages
    const { sitePages, teamPages, allRoles } = useMemo(() => {
        if (!summary?.pages) return { sitePages: [], teamPages: [], allRoles: [] };
        const site = [];
        const teams = [];
        const roleSet = new Set();

        summary.pages.forEach(p => {
            Object.keys(p.roles || {}).forEach(r => roleSet.add(r));
            if (p.page === 'team' && p.team_name) {
                teams.push(p);
            } else {
                site.push(p);
            }
        });
        // Sort site pages by total visits desc
        site.sort((a, b) => b.total - a.total);
        teams.sort((a, b) => b.total - a.total);
        return { sitePages: site, teamPages: teams, allRoles: Array.from(roleSet).sort() };
    }, [summary]);

    // Trend chart max for scaling
    const trendMax = useMemo(() => {
        if (!trends?.length) return 1;
        return Math.max(...trends.map(t => t.total), 1);
    }, [trends]);

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <span className="ml-3 text-gray-500">Loading analytics...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="visit-tracker">
            {/* Header with period selector */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <BarChart3 size={22} className="text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-800">Visit Tracker</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <select
                        value={days}
                        onChange={e => setDays(Number(e.target.value))}
                        className="text-sm border rounded-lg px-3 py-1.5"
                        data-testid="period-selector"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SummaryCard
                    icon={<Eye size={20} />}
                    label="Total Views"
                    value={summary?.total_visits || 0}
                    color="blue"
                />
                <SummaryCard
                    icon={<Users size={20} />}
                    label="Guest Views"
                    value={sitePages.concat(teamPages).reduce((s, p) => s + p.guests, 0)}
                    color="slate"
                />
                <SummaryCard
                    icon={<Users size={20} />}
                    label="Logged-in Views"
                    value={sitePages.concat(teamPages).reduce((s, p) => s + p.logged_in, 0)}
                    color="green"
                />
                <SummaryCard
                    icon={<TrendingUp size={20} />}
                    label="Avg/Day"
                    value={days > 0 ? Math.round((summary?.total_visits || 0) / days) : 0}
                    color="purple"
                />
            </div>

            {/* Trend Chart */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Daily Visits</h3>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <select
                            value={trendFilter}
                            onChange={e => setTrendFilter(e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                            data-testid="trend-filter"
                        >
                            <option value="all">All Pages</option>
                            <option value="home">Home</option>
                            <option value="events">Events</option>
                            <option value="live-game">Live View</option>
                            <option value="standings">Standings</option>
                            <option value="team">Team Pages</option>
                        </select>
                    </div>
                </div>

                {trends && trends.length > 0 ? (
                    <div className="flex items-end gap-px" style={{ height: '160px' }} data-testid="trend-chart">
                        {trends.map((day, i) => {
                            const guestH = trendMax > 0 ? (day.guests / trendMax) * 140 : 0;
                            const loggedH = trendMax > 0 ? (day.logged_in / trendMax) * 140 : 0;
                            const isToday = day.date === new Date().toISOString().split('T')[0];
                            return (
                                <div
                                    key={day.date}
                                    className="flex-1 flex flex-col items-center justify-end group relative"
                                    style={{ minWidth: '4px' }}
                                >
                                    {/* Tooltip */}
                                    <div className="hidden group-hover:block absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                                        <div className="font-medium">{new Date(day.date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                                        <div>Total: {day.total} | Guests: {day.guests} | Users: {day.logged_in}</div>
                                    </div>
                                    {/* Stacked bar */}
                                    <div
                                        className="w-full rounded-t-sm transition-all"
                                        style={{ height: `${loggedH}px`, backgroundColor: '#3b82f6', minHeight: day.logged_in > 0 ? '2px' : 0 }}
                                    />
                                    <div
                                        className="w-full"
                                        style={{ height: `${guestH}px`, backgroundColor: '#cbd5e1', minHeight: day.guests > 0 ? '2px' : 0 }}
                                    />
                                    {/* Date label - show every 7th or on hover */}
                                    {(i % 7 === 0 || isToday) && (
                                        <span className="text-[9px] text-gray-400 mt-1 transform -rotate-45 origin-top-left">
                                            {new Date(day.date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No visit data yet</div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#3b82f6' }} />
                        Logged-in Users
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#cbd5e1' }} />
                        Guests
                    </div>
                </div>
            </div>

            {/* Site Pages Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700">Page Views Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="page-views-table">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="px-4 py-2.5 font-medium text-gray-600">Page</th>
                                <th className="px-3 py-2.5 font-medium text-gray-600 text-right">Total</th>
                                <th className="px-3 py-2.5 font-medium text-gray-600 text-right">Guests</th>
                                <th className="px-3 py-2.5 font-medium text-gray-600 text-right">Logged In</th>
                                {allRoles.map(role => (
                                    <th key={role} className="px-3 py-2.5 font-medium text-gray-600 text-right whitespace-nowrap">
                                        <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: ROLE_COLORS[role] || '#94a3b8' }} />
                                        {role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sitePages.map(page => (
                                <tr key={page.page} className="border-t hover:bg-blue-50/30">
                                    <td className="px-4 py-2.5 font-medium text-gray-800">{PAGE_LABELS[page.page] || page.page}</td>
                                    <td className="px-3 py-2.5 text-right font-semibold">{page.total}</td>
                                    <td className="px-3 py-2.5 text-right text-gray-500">{page.guests}</td>
                                    <td className="px-3 py-2.5 text-right text-blue-600">{page.logged_in}</td>
                                    {allRoles.map(role => (
                                        <td key={role} className="px-3 py-2.5 text-right text-gray-500">
                                            {page.roles?.[role] || 0}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {sitePages.length === 0 && (
                                <tr><td colSpan={4 + allRoles.length} className="px-4 py-8 text-center text-gray-400">No page view data yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Team Pages Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700">Team Page Views</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="team-views-table">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="px-4 py-2.5 font-medium text-gray-600">Team</th>
                                <th className="px-3 py-2.5 font-medium text-gray-600 text-right">Total</th>
                                <th className="px-3 py-2.5 font-medium text-gray-600 text-right">Guests</th>
                                <th className="px-3 py-2.5 font-medium text-gray-600 text-right">Logged In</th>
                                {allRoles.map(role => (
                                    <th key={role} className="px-3 py-2.5 font-medium text-gray-600 text-right whitespace-nowrap">
                                        <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: ROLE_COLORS[role] || '#94a3b8' }} />
                                        {role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {teamPages.map(page => (
                                <tr key={page.team_id} className="border-t hover:bg-blue-50/30">
                                    <td className="px-4 py-2.5 font-medium text-gray-800">{page.team_name}</td>
                                    <td className="px-3 py-2.5 text-right font-semibold">{page.total}</td>
                                    <td className="px-3 py-2.5 text-right text-gray-500">{page.guests}</td>
                                    <td className="px-3 py-2.5 text-right text-blue-600">{page.logged_in}</td>
                                    {allRoles.map(role => (
                                        <td key={role} className="px-3 py-2.5 text-right text-gray-500">
                                            {page.roles?.[role] || 0}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {teamPages.length === 0 && (
                                <tr><td colSpan={4 + allRoles.length} className="px-4 py-8 text-center text-gray-400">No team page view data yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ icon, label, value, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        slate: 'bg-slate-50 text-slate-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600'
    };
    return (
        <div className="bg-white rounded-xl border shadow-sm p-4">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-2 ${colors[color] || colors.blue}`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
    );
};

export default VisitTracker;
