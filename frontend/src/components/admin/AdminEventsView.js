import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Search, Filter, ChevronDown, ChevronUp, RefreshCw,
    MoreVertical, Edit, Copy, Trash2, Tv, CheckCircle, XCircle,
    Clock, MapPin, Users, ArrowUpDown, X
} from 'lucide-react';

const TYPE_COLORS = {
    game: { border: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    practice: { border: 'border-l-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    tournament: { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    meeting: { border: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    social: { border: 'border-l-pink-500', bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
    hold: { border: 'border-l-slate-400', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
    external: { border: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
    other: { border: 'border-l-slate-300', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-300' },
};

const STATUS_STYLES = {
    scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
    in_progress: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
    completed: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' },
    canceled: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200' },
    archived: { bg: 'bg-slate-200', text: 'text-slate-500', ring: 'ring-slate-200' },
};

/* ─── tiny action dropdown ─── */
const ActionMenu = ({ event, onEdit, onDuplicate, onDelete, onViewLive, onStatusChange, actionLoading }) => {
    const [open, setOpen] = useState(false);
    const isLoading = actionLoading === event.id;

    return (
        <div className="relative" data-testid={`event-action-menu-${event.id}`}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
                className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                data-testid={`event-action-btn-${event.id}`}
            >
                <MoreVertical size={16} className="text-slate-500" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-50 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-sm">
                        {event.status === 'in_progress' && onViewLive && (
                            <button onClick={() => { onViewLive(event); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-emerald-700" disabled={isLoading}>
                                <Tv size={14} /> View Live
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={() => { onEdit(event); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700" disabled={isLoading} data-testid={`event-edit-${event.id}`}>
                                <Edit size={14} /> Edit
                            </button>
                        )}
                        <button onClick={() => { onDuplicate(event); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700" disabled={isLoading} data-testid={`event-duplicate-${event.id}`}>
                            <Copy size={14} /> Duplicate
                        </button>

                        <div className="border-t my-1" />
                        <div className="px-3 py-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Status</div>
                        {['scheduled', 'in_progress', 'completed', 'canceled'].map(s => (
                            <button
                                key={s}
                                onClick={() => { onStatusChange(event.id, s); setOpen(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-xs ${event.status === s ? 'font-semibold text-blue-600' : 'text-slate-600'}`}
                                disabled={isLoading}
                            >
                                {event.status === s ? <CheckCircle size={12} /> : <span className="w-3" />}
                                {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </button>
                        ))}

                        <div className="border-t my-1" />
                        <button onClick={() => { onDelete(event.id); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600" disabled={isLoading} data-testid={`event-delete-${event.id}`}>
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

/* ─── event card (mobile) ─── */
const EventCard = ({ event, teams, selected, onSelect, onEdit, onDuplicate, onDelete, onViewLive, onStatusChange, actionLoading }) => {
    const tc = TYPE_COLORS[event.type] || TYPE_COLORS.other;
    const sc = STATUS_STYLES[event.status] || STATUS_STYLES.scheduled;
    const getTeamName = (id) => teams.find(t => t.id === id)?.name || id || '';

    return (
        <div
            className={`bg-white rounded-lg border border-l-4 ${tc.border} shadow-sm hover:shadow-md transition-shadow ${selected ? 'ring-2 ring-blue-300' : ''}`}
            data-testid={`event-card-${event.id}`}
        >
            <div className="p-3">
                {/* Row 1: checkbox + title + type badge + actions */}
                <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => onSelect(event.id, e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded flex-shrink-0"
                        data-testid={`event-checkbox-${event.id}`}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800 text-sm leading-tight truncate">{event.title}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${tc.bg} ${tc.text}`}>
                                {event.type || 'other'}
                            </span>
                            {event.status === 'in_progress' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> LIVE
                                </span>
                            )}
                        </div>
                    </div>
                    <ActionMenu
                        event={event}
                        onEdit={onEdit}
                        onDuplicate={onDuplicate}
                        onDelete={onDelete}
                        onViewLive={onViewLive}
                        onStatusChange={onStatusChange}
                        actionLoading={actionLoading}
                    />
                </div>

                {/* Row 2: date + time + location */}
                <div className="mt-2 ml-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {event.date && (
                        <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {formatDateShort(event.date)}
                        </span>
                    )}
                    {event.time && (
                        <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {event.time}
                        </span>
                    )}
                    {event.location && (
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                            <MapPin size={12} className="text-slate-400" />
                            {event.location}
                        </span>
                    )}
                </div>

                {/* Row 3: teams (games) + status + rsvp */}
                <div className="mt-2 ml-6 flex items-center gap-2 flex-wrap">
                    {event.type === 'game' && (event.homeTeam || event.awayTeam) && (
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                            <Users size={12} className="text-slate-400" />
                            {getTeamName(event.homeTeam)} <span className="text-slate-400">vs</span> {getTeamName(event.awayTeam)}
                        </span>
                    )}
                    {event.type !== 'game' && event.team_id && (
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                            <Users size={12} className="text-slate-400" />
                            {getTeamName(event.team_id)}
                        </span>
                    )}
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ring-1 ${sc.bg} ${sc.text} ${sc.ring}`}>
                        {(event.status || 'scheduled').replace('_', ' ')}
                    </span>
                    {event.rsvps?.length > 0 && (
                        <span className="text-[10px] text-slate-500">
                            {event.rsvps.filter(r => r.status === 'yes').length} going
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─── date helpers ─── */
const formatDateShort = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const isThisYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        ...(isThisYear ? {} : { year: 'numeric' })
    });
};

/* ─── main component ─── */
const AdminEventsView = ({ teams = [], currentUser, onEditEvent, onViewLive }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [filter, setFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('asc');
    const [actionLoading, setActionLoading] = useState(null);
    const [stats, setStats] = useState({ total: 0, upcoming: 0, inProgress: 0, completed: 0 });
    const [activeTab, setActiveTab] = useState('upcoming');
    const [filtersOpen, setFiltersOpen] = useState(false);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    const loadEvents = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/unified-events`);
            if (response.ok) {
                const data = await response.json();
                const eventList = data.events || [];
                setEvents(eventList);
                const now = new Date();
                setStats({
                    total: eventList.length,
                    upcoming: eventList.filter(e => e.status === 'scheduled' && new Date(e.date + 'T00:00:00') > now).length,
                    inProgress: eventList.filter(e => e.status === 'in_progress').length,
                    completed: eventList.filter(e => e.status === 'completed').length,
                    canceled: eventList.filter(e => e.status === 'canceled' || e.status === 'cancelled').length
                });
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
        setLoading(false);
    }, [backendUrl]);

    useEffect(() => { loadEvents(); }, [loadEvents]);

    /* ─── filtering & sorting ─── */
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const filteredEvents = events
        .filter(event => {
            const eventDate = event.date ? new Date(event.date + 'T00:00:00') : null;
            const isPast = eventDate && eventDate < now;
            const isCompleted = event.status === 'completed' || event.status === 'canceled' || event.status === 'cancelled';
            if (activeTab === 'past') return isPast || isCompleted;
            return !isPast || event.status === 'in_progress' || event.status === 'scheduled';
        })
        .filter(event => {
            if (filter === 'active' && ['canceled', 'cancelled', 'archived'].includes(event.status)) return false;
            if (filter !== 'all' && filter !== 'active' && event.status !== filter) return false;
            if (typeFilter !== 'all' && event.type !== typeFilter) return false;
            if (teamFilter !== 'all') {
                const teamIds = [event.homeTeam, event.awayTeam, event.team_id].filter(Boolean);
                if (!teamIds.includes(teamFilter)) return false;
            }
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (![event.title, event.location, event.type].some(v => v?.toLowerCase().includes(q))) return false;
            }
            return true;
        })
        .sort((a, b) => {
            let c = 0;
            if (sortBy === 'date') c = new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00');
            else if (sortBy === 'title') c = (a.title || '').localeCompare(b.title || '');
            else if (sortBy === 'type') c = (a.type || '').localeCompare(b.type || '');
            else if (sortBy === 'status') c = (a.status || '').localeCompare(b.status || '');
            return sortOrder === 'asc' ? c : -c;
        });

    const uniqueTypes = [...new Set(events.map(e => e.type).filter(Boolean))];
    const hasActiveFilters = filter !== 'all' || typeFilter !== 'all' || teamFilter !== 'all' || searchQuery;

    /* ─── handlers ─── */
    const handleSelectAll = (checked) => setSelectedEvents(checked ? filteredEvents.map(e => e.id) : []);
    const handleSelectEvent = (id, checked) => setSelectedEvents(prev => checked ? [...prev, id] : prev.filter(x => x !== id));

    const handleBulkAction = async (action) => {
        if (!selectedEvents.length) return;
        const msgs = { delete: `Delete ${selectedEvents.length} event(s)?`, cancel: `Cancel ${selectedEvents.length} event(s)?`, complete: `Mark ${selectedEvents.length} event(s) as completed?` };
        if (!window.confirm(msgs[action])) return;
        setActionLoading('bulk');
        try {
            for (const eid of selectedEvents) {
                if (action === 'delete') await fetch(`${backendUrl}/api/unified-events/${eid}`, { method: 'DELETE' });
                else await fetch(`${backendUrl}/api/unified-events/${eid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: action === 'cancel' ? 'canceled' : 'completed' }) });
            }
            setSelectedEvents([]);
            loadEvents();
        } catch (e) { console.error('Bulk action error:', e); }
        setActionLoading(null);
    };

    const handleStatusChange = async (id, status) => {
        setActionLoading(id);
        try {
            const r = await fetch(`${backendUrl}/api/unified-events/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
            if (r.ok) loadEvents();
        } catch (e) { console.error(e); }
        setActionLoading(null);
    };

    const handleDuplicate = async (event) => {
        setActionLoading(event.id);
        try {
            const newEvent = { ...event, id: undefined, title: `${event.title} (Copy)`, status: 'scheduled', date: new Date(new Date(event.date + 'T00:00:00').getTime() + 7 * 86400000).toISOString().split('T')[0], rsvps: [], google_event_id: null, google_calendar_link: null };
            const r = await fetch(`${backendUrl}/api/unified-events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newEvent) });
            if (r.ok) loadEvents();
        } catch (e) { console.error(e); }
        setActionLoading(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        setActionLoading(id);
        try { await fetch(`${backendUrl}/api/unified-events/${id}`, { method: 'DELETE' }); loadEvents(); } catch (e) { console.error(e); }
        setActionLoading(null);
    };

    const getTeamName = (id) => teams.find(t => t.id === id)?.name || id || '-';

    /* ─── render ─── */
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16" data-testid="events-loading">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-3" data-testid="admin-events-view">
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-800" data-testid="events-title">Events</h2>
                    <span className="text-xs text-slate-400 hidden sm:inline">({stats.total})</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Compact stat pills */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs">
                        {stats.inProgress > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {stats.inProgress} live
                            </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{stats.upcoming} upcoming</span>
                    </div>
                    <button
                        onClick={loadEvents}
                        className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                        title="Refresh"
                        data-testid="events-refresh-btn"
                    >
                        <RefreshCw size={16} className="text-slate-500" />
                    </button>
                </div>
            </div>

            {/* ── Tabs: upcoming / past ── */}
            <div className="flex border-b border-slate-200" data-testid="events-tabs">
                {[
                    { key: 'upcoming', label: 'Upcoming' },
                    { key: 'past', label: 'Past' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.key
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                        data-testid={`events-tab-${tab.key}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Search + Filter toggle ── */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search events..."
                        className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        data-testid="events-search-input"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                            <X size={14} className="text-slate-400 hover:text-slate-600" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setFiltersOpen(o => !o)}
                    className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-sm transition-colors ${
                        hasActiveFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    data-testid="events-filter-toggle"
                >
                    <Filter size={14} />
                    <span className="hidden sm:inline">Filters</span>
                    {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button
                    onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                    title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                    data-testid="events-sort-btn"
                >
                    <ArrowUpDown size={14} />
                </button>
            </div>

            {/* ── Collapsible Filters ── */}
            {filtersOpen && (
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2" data-testid="events-filters-panel">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-md text-sm bg-white" data-testid="events-status-filter">
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                        </select>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-md text-sm bg-white" data-testid="events-type-filter">
                            <option value="all">All Types</option>
                            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-md text-sm bg-white" data-testid="events-team-filter">
                            <option value="all">All Teams</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-md text-sm bg-white" data-testid="events-sort-select">
                            <option value="date">Sort: Date</option>
                            <option value="title">Sort: Title</option>
                            <option value="type">Sort: Type</option>
                            <option value="status">Sort: Status</option>
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={() => { setFilter('all'); setTypeFilter('all'); setTeamFilter('all'); setSearchQuery(''); }}
                            className="text-xs text-blue-600 hover:underline"
                            data-testid="events-clear-filters"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            )}

            {/* ── Bulk Actions ── */}
            {selectedEvents.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 text-sm" data-testid="events-bulk-actions">
                    <span className="text-blue-700 font-medium">{selectedEvents.length} selected</span>
                    <div className="flex-1" />
                    <button onClick={() => handleBulkAction('complete')} disabled={actionLoading === 'bulk'} className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50" data-testid="bulk-complete-btn">
                        <CheckCircle size={12} className="inline mr-1" /> Complete
                    </button>
                    <button onClick={() => handleBulkAction('cancel')} disabled={actionLoading === 'bulk'} className="px-2.5 py-1 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 disabled:opacity-50" data-testid="bulk-cancel-btn">
                        <XCircle size={12} className="inline mr-1" /> Cancel
                    </button>
                    <button onClick={() => handleBulkAction('delete')} disabled={actionLoading === 'bulk'} className="px-2.5 py-1 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50" data-testid="bulk-delete-btn">
                        <Trash2 size={12} className="inline mr-1" /> Delete
                    </button>
                    <button onClick={() => setSelectedEvents([])} className="px-2 py-1 text-xs text-slate-600 hover:text-slate-800">
                        <X size={12} />
                    </button>
                </div>
            )}

            {/* ── Select all row ── */}
            {filteredEvents.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                    <input
                        type="checkbox"
                        checked={selectedEvents.length === filteredEvents.length}
                        onChange={e => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                        data-testid="events-select-all"
                    />
                    <span className="text-xs text-slate-500">
                        {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* ── Events List (Card layout — responsive) ── */}
            {filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-400" data-testid="events-empty">
                    <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No events match your filters</p>
                </div>
            ) : (
                <>
                    {/* Mobile: Card layout */}
                    <div className="lg:hidden space-y-2" data-testid="events-cards-mobile">
                        {filteredEvents.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                teams={teams}
                                selected={selectedEvents.includes(event.id)}
                                onSelect={handleSelectEvent}
                                onEdit={onEditEvent}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDelete}
                                onViewLive={onViewLive}
                                onStatusChange={handleStatusChange}
                                actionLoading={actionLoading}
                            />
                        ))}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden lg:block bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden" data-testid="events-table-desktop">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="w-10 px-3 py-2.5">
                                        <input type="checkbox" checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0} onChange={e => handleSelectAll(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Event</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Date</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Type</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Teams</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Status</th>
                                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEvents.map(event => {
                                    const tc = TYPE_COLORS[event.type] || TYPE_COLORS.other;
                                    const sc = STATUS_STYLES[event.status] || STATUS_STYLES.scheduled;
                                    return (
                                        <tr key={event.id} className={`hover:bg-slate-50/50 transition-colors ${selectedEvents.includes(event.id) ? 'bg-blue-50/50' : ''}`} data-testid={`event-row-${event.id}`}>
                                            <td className="px-3 py-2.5">
                                                <input type="checkbox" checked={selectedEvents.includes(event.id)} onChange={e => handleSelectEvent(event.id, e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="font-medium text-sm text-slate-800">{event.title}</div>
                                                {event.location && <div className="text-xs text-slate-400 truncate max-w-[250px] flex items-center gap-1 mt-0.5"><MapPin size={10} /> {event.location}</div>}
                                            </td>
                                            <td className="px-3 py-2.5 text-sm text-slate-700">
                                                <div>{formatDateShort(event.date)}</div>
                                                {event.time && <div className="text-xs text-slate-400">{event.time}</div>}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${tc.bg} ${tc.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                                                    {event.type || 'other'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-slate-600">
                                                {event.type === 'game' ? (
                                                    <>{getTeamName(event.homeTeam)} <span className="text-slate-400">vs</span> {getTeamName(event.awayTeam)}</>
                                                ) : (
                                                    getTeamName(event.team_id)
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ${sc.bg} ${sc.text} ${sc.ring}`}>
                                                    {event.status === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />}
                                                    {(event.status || 'scheduled').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <ActionMenu
                                                    event={event}
                                                    onEdit={onEditEvent}
                                                    onDuplicate={handleDuplicate}
                                                    onDelete={handleDelete}
                                                    onViewLive={onViewLive}
                                                    onStatusChange={handleStatusChange}
                                                    actionLoading={actionLoading}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ── Footer ── */}
            <div className="text-xs text-slate-400 text-center pt-1" data-testid="events-footer">
                {filteredEvents.length} of {events.length} events
            </div>
        </div>
    );
};

export default AdminEventsView;
