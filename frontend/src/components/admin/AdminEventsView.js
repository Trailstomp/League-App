import React, { useState, useEffect, useCallback } from 'react';

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
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [stats, setStats] = useState({ total: 0, upcoming: 0, inProgress: 0, completed: 0 });
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    const loadEvents = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/unified-events`);
            if (response.ok) {
                const data = await response.json();
                const eventList = data.events || [];
                setEvents(eventList);
                
                // Calculate stats
                const now = new Date();
                setStats({
                    total: eventList.length,
                    upcoming: eventList.filter(e => e.status === 'scheduled' && new Date(e.date) > now).length,
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
    
    useEffect(() => {
        const fetchEvents = async () => {
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
                        upcoming: eventList.filter(e => e.status === 'scheduled' && new Date(e.date) > now).length,
                        inProgress: eventList.filter(e => e.status === 'in_progress').length,
                        completed: eventList.filter(e => e.status === 'completed').length,
                        canceled: eventList.filter(e => e.status === 'canceled' || e.status === 'cancelled').length
                    });
                }
            } catch (error) {
                console.error('Error loading events:', error);
            }
            setLoading(false);
        };
        
        fetchEvents();
    }, [backendUrl]);
    
    // Filter and sort events
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    // First filter by past/upcoming tab
    const tabFilteredEvents = events.filter(event => {
        const eventDate = event.date ? new Date(event.date) : null;
        const isPast = eventDate && eventDate < now;
        const isCompleted = event.status === 'completed' || event.status === 'canceled' || event.status === 'cancelled';
        
        if (activeTab === 'past') {
            return isPast || isCompleted;
        } else {
            // Upcoming/Current - show future events and in-progress events
            return !isPast || event.status === 'in_progress' || event.status === 'scheduled';
        }
    });
    
    const filteredEvents = tabFilteredEvents
        .filter(event => {
            // Status filter
            if (filter === 'active') {
                if (event.status === 'canceled' || event.status === 'cancelled' || event.status === 'archived') return false;
            } else if (filter !== 'all') {
                if (event.status !== filter) return false;
            }
            
            // Type filter
            if (typeFilter !== 'all' && event.type !== typeFilter) return false;
            
            // Team filter
            if (teamFilter !== 'all') {
                const teamIds = [event.homeTeam, event.awayTeam, event.team_id].filter(Boolean);
                if (!teamIds.includes(teamFilter)) return false;
            }
            
            // Search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchTitle = event.title?.toLowerCase().includes(query);
                const matchLocation = event.location?.toLowerCase().includes(query);
                const matchType = event.type?.toLowerCase().includes(query);
                if (!matchTitle && !matchLocation && !matchType) return false;
            }
            
            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.date) - new Date(b.date);
                    break;
                case 'title':
                    comparison = (a.title || '').localeCompare(b.title || '');
                    break;
                case 'type':
                    comparison = (a.type || '').localeCompare(b.type || '');
                    break;
                case 'status':
                    comparison = (a.status || '').localeCompare(b.status || '');
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedEvents(filteredEvents.map(e => e.id));
        } else {
            setSelectedEvents([]);
        }
    };
    
    const handleSelectEvent = (eventId, checked) => {
        if (checked) {
            setSelectedEvents(prev => [...prev, eventId]);
        } else {
            setSelectedEvents(prev => prev.filter(id => id !== eventId));
        }
    };
    
    const handleBulkAction = async (action) => {
        if (selectedEvents.length === 0) return;
        
        const confirmMessage = {
            delete: `Delete ${selectedEvents.length} event(s)?`,
            cancel: `Cancel ${selectedEvents.length} event(s)?`,
            complete: `Mark ${selectedEvents.length} event(s) as completed?`
        };
        
        if (!window.confirm(confirmMessage[action])) return;
        
        setActionLoading('bulk');
        try {
            for (const eventId of selectedEvents) {
                if (action === 'delete') {
                    await fetch(`${backendUrl}/api/unified-events/${eventId}`, { method: 'DELETE' });
                } else {
                    const status = action === 'cancel' ? 'canceled' : 'completed';
                    await fetch(`${backendUrl}/api/unified-events/${eventId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status })
                    });
                }
            }
            setSelectedEvents([]);
            loadEvents();
        } catch (error) {
            console.error('Bulk action error:', error);
            alert('Error performing bulk action');
        }
        setActionLoading(null);
    };
    
    const handleStatusChange = async (eventId, newStatus) => {
        setActionLoading(eventId);
        try {
            const response = await fetch(`${backendUrl}/api/unified-events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                loadEvents();
            }
        } catch (error) {
            console.error('Status change error:', error);
        }
        setActionLoading(null);
    };
    
    const handleDuplicateEvent = async (event) => {
        setActionLoading(event.id);
        try {
            const newEvent = {
                ...event,
                id: undefined,
                title: `${event.title} (Copy)`,
                status: 'scheduled',
                date: new Date(new Date(event.date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                rsvps: [],
                google_event_id: null,
                google_calendar_link: null
            };
            
            const response = await fetch(`${backendUrl}/api/unified-events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvent)
            });
            
            if (response.ok) {
                loadEvents();
            }
        } catch (error) {
            console.error('Duplicate error:', error);
        }
        setActionLoading(null);
    };
    
    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        
        setActionLoading(eventId);
        try {
            await fetch(`${backendUrl}/api/unified-events/${eventId}`, { method: 'DELETE' });
            loadEvents();
        } catch (error) {
            console.error('Delete error:', error);
        }
        setActionLoading(null);
    };
    
    const getStatusBadge = (status) => {
        const styles = {
            scheduled: 'bg-blue-100 text-blue-700',
            in_progress: 'bg-green-100 text-green-700 animate-pulse',
            completed: 'bg-slate-100 text-slate-700',
            canceled: 'bg-red-100 text-red-700',
            cancelled: 'bg-red-100 text-red-700',
            archived: 'bg-slate-200 text-slate-500'
        };
        return styles[status] || 'bg-slate-100 text-slate-600';
    };
    
    const getTypeBadge = (type) => {
        const styles = {
            game: 'bg-purple-100 text-purple-700',
            practice: 'bg-cyan-100 text-cyan-700',
            tournament: 'bg-amber-100 text-amber-700',
            meeting: 'bg-indigo-100 text-indigo-700',
            social: 'bg-pink-100 text-pink-700',
            other: 'bg-slate-100 text-slate-600'
        };
        return styles[type] || 'bg-slate-100 text-slate-600';
    };
    
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team?.name || teamId || '-';
    };
    
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };
    
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        return timeStr;
    };
    
    const uniqueTypes = [...new Set(events.map(e => e.type).filter(Boolean))];
    
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {/* Header & Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">📅 Events Management</h2>
                    <p className="text-sm text-slate-600">Quick view and manage all events</p>
                </div>
                
                {/* Quick Stats */}
                <div className="flex gap-2 text-sm">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                        {stats.upcoming} Upcoming
                    </span>
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full">
                        {stats.inProgress} Live
                    </span>
                    <span className="px-3 py-1 bg-slate-50 text-slate-700 rounded-full">
                        {stats.completed} Done
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                        {stats.total} Total
                    </span>
                </div>
            </div>
            
            {/* Upcoming/Past Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'upcoming'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    📆 Upcoming & Current
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'past'
                            ? 'border-slate-600 text-slate-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    📋 Past Events
                </button>
            </div>
            
            {/* Filters & Actions Bar */}
            <div className="bg-white rounded-lg border shadow-sm p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search events..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                        </select>
                        
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                            <option value="all">All Types</option>
                            {uniqueTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        
                        <select
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                            <option value="all">All Teams</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Sort */}
                    <div className="flex items-center gap-1">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="title">Sort by Title</option>
                            <option value="type">Sort by Type</option>
                            <option value="status">Sort by Status</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                    
                    {/* Refresh */}
                    <button
                        onClick={loadEvents}
                        className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
                    >
                        🔄 Refresh
                    </button>
                </div>
                
                {/* Bulk Actions */}
                {selectedEvents.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex items-center gap-3">
                        <span className="text-sm text-slate-600">
                            {selectedEvents.length} selected
                        </span>
                        <button
                            onClick={() => handleBulkAction('complete')}
                            disabled={actionLoading === 'bulk'}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            ✓ Mark Complete
                        </button>
                        <button
                            onClick={() => handleBulkAction('cancel')}
                            disabled={actionLoading === 'bulk'}
                            className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 disabled:opacity-50"
                        >
                            ✕ Cancel
                        </button>
                        <button
                            onClick={() => handleBulkAction('delete')}
                            disabled={actionLoading === 'bulk'}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            🗑 Delete
                        </button>
                        <button
                            onClick={() => setSelectedEvents([])}
                            className="px-3 py-1.5 border border-slate-300 text-sm rounded hover:bg-slate-50"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>
            
            {/* Events Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="w-10 px-3 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Event</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date/Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Teams</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">RSVPs</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-12 text-center text-slate-500">
                                        No events found matching your filters
                                    </td>
                                </tr>
                            ) : (
                                filteredEvents.map(event => (
                                    <tr key={event.id} className={`hover:bg-slate-50 ${selectedEvents.includes(event.id) ? 'bg-blue-50' : ''}`}>
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedEvents.includes(event.id)}
                                                onChange={(e) => handleSelectEvent(event.id, e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800 text-sm">{event.title}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[200px]">{event.location || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="text-slate-800">{formatDate(event.date)}</div>
                                            <div className="text-xs text-slate-500">{formatTime(event.time)}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadge(event.type)}`}>
                                                {event.type || 'other'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {event.type === 'game' ? (
                                                <div className="text-xs">
                                                    <span className="text-slate-700">{getTeamName(event.homeTeam)}</span>
                                                    <span className="text-slate-400 mx-1">vs</span>
                                                    <span className="text-slate-700">{getTeamName(event.awayTeam)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-600 text-xs">{getTeamName(event.team_id)}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={event.status}
                                                onChange={(e) => handleStatusChange(event.id, e.target.value)}
                                                disabled={actionLoading === event.id}
                                                className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${getStatusBadge(event.status)}`}
                                            >
                                                <option value="scheduled">Scheduled</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                                <option value="canceled">Canceled</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {event.rsvps?.length > 0 ? (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="text-green-600">{event.rsvps.filter(r => r.status === 'yes').length}✓</span>
                                                    <span className="text-red-600">{event.rsvps.filter(r => r.status === 'no').length}✗</span>
                                                    <span className="text-amber-600">{event.rsvps.filter(r => r.status === 'maybe').length}?</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {event.status === 'in_progress' && onViewLive && (
                                                    <button
                                                        onClick={() => onViewLive(event)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                                        title="View Live"
                                                    >
                                                        📺
                                                    </button>
                                                )}
                                                {onEditEvent && (
                                                    <button
                                                        onClick={() => onEditEvent(event)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDuplicateEvent(event)}
                                                    disabled={actionLoading === event.id}
                                                    className="p-1.5 text-slate-600 hover:bg-slate-50 rounded"
                                                    title="Duplicate"
                                                >
                                                    📋
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    disabled={actionLoading === event.id}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer */}
                <div className="px-4 py-3 bg-slate-50 border-t text-sm text-slate-600">
                    Showing {filteredEvents.length} of {events.length} events
                </div>
            </div>
        </div>
    );
};

export default AdminEventsView;
