import React, { useState, useMemo } from 'react';
import EventRSVPDashboard from '../EventRSVPDashboard';
import AdvancedEventCalendar from '../../scheduling/components/EventCalendar';

// Compact Event Row Component for list view
const CompactEventRow = ({ 
    event, 
    teams, 
    currentUser, 
    onEventSelect, 
    onEnterScoring, 
    onViewLive, 
    onManageTournament,
    onNavigate,
    getEventTypeIcon,
    getStatusColor 
}) => {
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch {
            return dateString || 'TBD';
        }
    };

    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            });
        } catch {
            return 'TBD';
        }
    };

    // Get team info for the event
    const getEventTeams = () => {
        const eventTeamIds = event.teams || event.teamIds || [];
        if (event.homeTeam) eventTeamIds.push(event.homeTeam);
        if (event.awayTeam) eventTeamIds.push(event.awayTeam);
        
        const uniqueIds = [...new Set(eventTeamIds)];
        return uniqueIds.map(id => teams.find(t => t.id === id)).filter(Boolean).slice(0, 2);
    };

    const eventTeams = getEventTeams();
    const eventDate = new Date((event.start_datetime || event.date) + (event.start_datetime ? '' : 'T00:00:00'));
    const isPast = eventDate < new Date();
    const isAdmin = currentUser?.role === 'admin' || currentUser?.roles?.includes('admin');
    const isCoach = currentUser?.role === 'coach' || currentUser?.roles?.includes('coach');
    const canManage = isAdmin || isCoach;
    const isGame = event.type === 'regular_game' || event.type === 'game' || event.type === 'tournament';
    const isLive = event.status === 'in_progress';

    return (
        <div 
            className={`flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors ${isPast ? 'opacity-60' : ''} ${isLive ? 'bg-green-50/50 border-l-2 border-l-green-500' : ''}`}
            onClick={() => onEventSelect && onEventSelect(event)}
            data-testid={`compact-event-${event.id}`}
        >
            {/* Team Logo(s) or Type Icon */}
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                {eventTeams.length > 0 ? (
                    <div className="flex -space-x-2">
                        {eventTeams.map((team, idx) => (
                            team.style?.logoUrl ? (
                                <img 
                                    key={team.id}
                                    src={team.style.logoUrl}
                                    alt={team.name}
                                    className="w-10 h-10 rounded-full object-contain bg-white border-2 border-white shadow-sm"
                                    style={{ zIndex: eventTeams.length - idx }}
                                />
                            ) : (
                                <div 
                                    key={team.id}
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-sm"
                                    style={{ 
                                        backgroundColor: team.style?.primaryColor || '#3b82f6',
                                        zIndex: eventTeams.length - idx 
                                    }}
                                >
                                    {team.name?.charAt(0) || '?'}
                                </div>
                            )
                        ))}
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-slate-100">
                        {getEventTypeIcon(event.type)}
                    </div>
                )}
            </div>

            {/* Date/Time Column */}
            <div className="w-24 flex-shrink-0 text-center">
                <div className="text-sm font-medium text-slate-800">{formatDate(event.start_datetime || event.date)}</div>
                <div className="text-xs text-slate-500">{formatTime(event.start_datetime || event.date)}</div>
            </div>

            {/* Event Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {isLive ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white animate-pulse">LIVE</span>
                    ) : (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                            {event.status?.replace('_', ' ') || 'scheduled'}
                        </span>
                    )}
                    <h4 className="font-medium text-slate-800 truncate">{event.title}</h4>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    {eventTeams.length > 0 && (
                        <span className="text-xs text-slate-600">
                            {eventTeams.map(t => t.name).join(' vs ')}
                        </span>
                    )}
                    {event.location && (
                        <span className="text-xs text-slate-500 truncate">
                            {event.location}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {/* Watch Live - visible to EVERYONE for live games */}
                {isGame && isLive && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onNavigate ? onNavigate('live-game', event.id) : onViewLive?.(event); }}
                        className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold flex items-center gap-1 animate-pulse"
                        title="Watch Live"
                        data-testid={`watch-live-btn-${event.id}`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        Watch
                    </button>
                )}
                {/* View Stats - for completed games (everyone) */}
                {isGame && event.status === 'completed' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onNavigate ? onNavigate('live-game', event.id) : onViewLive?.(event); }}
                        className="px-2 py-1 text-xs bg-slate-600 text-white rounded-md hover:bg-slate-700"
                        title="View Game Stats"
                        data-testid={`view-stats-btn-${event.id}`}
                    >
                        Stats
                    </button>
                )}
                {/* Admin-only actions */}
                {canManage && (
                    <>
                        {isGame && !isLive && event.status !== 'completed' && onViewLive && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onNavigate ? onNavigate('live-game', event.id) : onViewLive(event); }}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                title="Live View"
                                data-testid={`live-view-btn-${event.id}`}
                            >
                                Live
                            </button>
                        )}
                        {isGame && onEnterScoring && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEnterScoring(event); }}
                                className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                                title="Enter Scores"
                            >
                                Score
                            </button>
                        )}
                        {event.type === 'tournament' && onManageTournament && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onManageTournament(event); }}
                                className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                                title="Manage Bracket"
                            >
                                Bracket
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const EventsList = ({ 
    events, 
    teams, 
    currentUser, 
    loading, 
    onEventSelect, 
    onEventUpdate,
    onCreateEvent,
    onManageTournament,
    onEnterScoring,
    onViewLive,
    onNavigate,
    onRefresh 
}) => {
    const [filter, setFilter] = useState('active'); // active (excludes canceled/archived), all, scheduled, in_progress, completed, canceled, archived
    const [sortBy, setSortBy] = useState('date'); // date, title, type
    const [timeFilter, setTimeFilter] = useState('upcoming'); // upcoming, past
    const [viewMode, setViewMode] = useState('compact'); // compact, detailed, calendar
    const [sendingNotifications, setSendingNotifications] = useState({});
    const [viewingRSVPs, setViewingRSVPs] = useState(null);
    const [changingStatus, setChangingStatus] = useState(null);
    const [notifyMenuOpen, setNotifyMenuOpen] = useState(null);
    const [groupmeChannels, setGroupmeChannels] = useState([]);
    const [showGroupmeModal, setShowGroupmeModal] = useState(null);
    const [showSmsModal, setShowSmsModal] = useState(null);
    const [smsConfig, setSmsConfig] = useState(null);
    const [groupmeForm, setGroupmeForm] = useState({
        channel_ids: [],
        notification_type: 'event_announcement',
        include_image: true,
        include_calendar_link: true,
        include_rsvp: true
    });
    const [smsForm, setSmsForm] = useState({
        notification_type: 'event_reminder',
        target_users: 'all', // all, going, maybe
        custom_message: ''
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    // Get today's date at midnight for comparison
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    // Split events into upcoming and past
    const { upcomingEvents, pastEvents, upcomingCount, pastCount } = useMemo(() => {
        // First filter by status
        const statusFiltered = events.filter(event => {
            if (filter === 'active') {
                return event.status !== 'canceled' && 
                       event.status !== 'cancelled' && 
                       event.status !== 'archived';
            }
            if (filter === 'all') return true;
            return event.status === filter;
        });

        const upcoming = [];
        const past = [];
        
        statusFiltered.forEach(event => {
            const eventDate = new Date(event.start_datetime || event.date || '2099-12-31');
            eventDate.setHours(0, 0, 0, 0);
            
            if (eventDate >= today) {
                upcoming.push(event);
            } else {
                past.push(event);
            }
        });
        
        // Sort upcoming by date ascending (soonest first)
        upcoming.sort((a, b) => {
            const dateA = new Date(a.start_datetime || a.date || '2099-12-31');
            const dateB = new Date(b.start_datetime || b.date || '2099-12-31');
            return dateA - dateB;
        });
        
        // Sort past by date descending (most recent first)
        past.sort((a, b) => {
            const dateA = new Date(a.start_datetime || a.date || '1970-01-01');
            const dateB = new Date(b.start_datetime || b.date || '1970-01-01');
            return dateB - dateA;
        });
        
        return { 
            upcomingEvents: upcoming, 
            pastEvents: past,
            upcomingCount: upcoming.length,
            pastCount: past.length
        };
    }, [events, filter, today]);

    // Get displayed events based on time filter
    const displayedEvents = useMemo(() => {
        const eventsToShow = timeFilter === 'upcoming' ? upcomingEvents : pastEvents;
        
        // Apply secondary sort
        return eventsToShow.sort((a, b) => {
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            if (sortBy === 'type') return (a.type || '').localeCompare(b.type || '');
            return 0; // Keep date sort from above
        });
    }, [timeFilter, upcomingEvents, pastEvents, sortBy]);

    const handleStatusChange = async (eventId, newStatus) => {
        try {
            const response = await fetch(`${backendUrl}/api/unified-events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setChangingStatus(null);
                if (onRefresh) onRefresh();
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            alert('Error updating status');
        }
    };

    const handleSendNotifications = async (eventId) => {
        try {
            setSendingNotifications(prev => ({ ...prev, [eventId]: true }));
            
            const response = await fetch(`${backendUrl}/api/events/${eventId}/send-email-notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (response.ok) {
                alert('✅ Email notifications sent successfully!');
            } else {
                const error = await response.json();
                alert(`❌ Failed to send: ${error.detail}`);
            }
        } catch (error) {
            alert('❌ Error sending notifications');
        } finally {
            setSendingNotifications(prev => ({ ...prev, [eventId]: false }));
            setNotifyMenuOpen(null);
        }
    };

    // Load SMS configuration
    const loadSmsConfig = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/sms-config`);
            if (response.ok) {
                const data = await response.json();
                setSmsConfig(data);
            }
        } catch (err) {
            console.error('Error loading SMS config:', err);
        }
    };

    // Open SMS notification modal
    const openSmsModal = async (event) => {
        console.log('📱 Opening SMS modal for event:', event.title);
        setNotifyMenuOpen(null);
        setSmsForm({
            notification_type: 'event_reminder',
            target_users: 'all',
            custom_message: ''
        });
        setShowSmsModal(event);
        await loadSmsConfig();
    };

    // Send SMS notification
    const handleSendSmsNotification = async () => {
        if (!showSmsModal) return;
        
        try {
            setSendingNotifications(prev => ({ ...prev, [showSmsModal.id]: true }));
            
            const response = await fetch(`${backendUrl}/api/events/${showSmsModal.id}/send-sms-notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(smsForm)
            });

            if (response.ok) {
                const result = await response.json();
                alert(`✅ SMS sent to ${result.sent_count} recipients!${result.failed_count > 0 ? ` (${result.failed_count} failed)` : ''}`);
                setShowSmsModal(null);
            } else {
                const error = await response.json();
                alert(`❌ Failed to send: ${error.detail}`);
            }
        } catch (error) {
            alert('❌ Error sending SMS notifications');
        } finally {
            setSendingNotifications(prev => ({ ...prev, [showSmsModal.id]: false }));
        }
    };

    // Load GroupMe channels when modal opens
    const loadGroupmeChannels = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/groupme/channels?active_only=true`);
            if (response.ok) {
                const data = await response.json();
                setGroupmeChannels(data.channels || []);
            }
        } catch (err) {
            console.error('Error loading GroupMe channels:', err);
        }
    };

    // Open GroupMe notification modal for an event
    const openGroupmeModal = async (event) => {
        console.log('📢 Opening GroupMe modal for event:', event.title);
        setNotifyMenuOpen(null);
        setGroupmeForm({
            channel_ids: [],
            notification_type: 'event_announcement',
            include_image: true,
            include_calendar_link: true,
            include_rsvp: true
        });
        setShowGroupmeModal(event);
        // Load channels after showing modal
        await loadGroupmeChannels();
    };

    // Send enhanced GroupMe notification
    const handleSendGroupmeNotification = async () => {
        if (!showGroupmeModal || groupmeForm.channel_ids.length === 0) return;
        
        try {
            setSendingNotifications(prev => ({ ...prev, [showGroupmeModal.id]: true }));
            
            const formData = new FormData();
            formData.append('event_id', showGroupmeModal.id);
            formData.append('channel_ids', JSON.stringify(groupmeForm.channel_ids));
            formData.append('notification_type', groupmeForm.notification_type);
            formData.append('include_image', groupmeForm.include_image);
            formData.append('include_calendar_link', groupmeForm.include_calendar_link);
            formData.append('include_rsvp', groupmeForm.include_rsvp);
            
            const response = await fetch(`${backendUrl}/api/groupme/send-enhanced-notification`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                alert(`✅ GroupMe notification sent to ${result.success_channels?.length || 0} channels!`);
                setShowGroupmeModal(null);
            } else {
                const error = await response.json();
                alert(`❌ Failed to send: ${error.detail}`);
            }
        } catch (error) {
            alert('❌ Error sending GroupMe notification');
        } finally {
            setSendingNotifications(prev => ({ ...prev, [showGroupmeModal.id]: false }));
        }
    };

    // Get team name by ID
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    // Get team logo by ID
    const getTeamLogo = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team?.style?.logoUrl;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getEventTypeIcon = (type) => {
        switch (type) {
            case 'regular_game': return '🏆';
            case 'tournament': return '🏅';
            case 'practice': return '🏃';
            case 'social': return '🎉';
            default: return '📅';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const canManageEvent = (event) => {
        // Only allow admins or coaches to manage events
        if (!currentUser) return false;
        const isAdmin = currentUser.role === 'admin' || currentUser.roles?.includes('admin');
        const isCoach = currentUser.role === 'coach' || currentUser.roles?.includes('coach');
        const isCreator = event.created_by === currentUser.id;
        return isAdmin || isCoach || isCreator;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading events...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col" style={{ backgroundColor: 'transparent' }}>
            {/* Upcoming / Past Tabs */}
            <div className="bg-white/95 backdrop-blur-sm border-b">
                <div className="flex">
                    <button
                        onClick={() => setTimeFilter('upcoming')}
                        className={`flex-1 py-2 px-3 sm:py-3 sm:px-6 text-center font-medium transition-all ${
                            timeFilter === 'upcoming'
                                ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        data-testid="upcoming-events-tab"
                    >
                        <span className="text-xs sm:text-sm">Upcoming</span>
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                            timeFilter === 'upcoming' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                            {upcomingCount}
                        </span>
                    </button>
                    <button
                        onClick={() => setTimeFilter('past')}
                        className={`flex-1 py-2 px-3 sm:py-3 sm:px-6 text-center font-medium transition-all ${
                            timeFilter === 'past'
                                ? 'bg-slate-100 text-slate-700 border-b-2 border-slate-500'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        data-testid="past-events-tab"
                    >
                        <span className="text-xs sm:text-sm">Past</span>
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                            timeFilter === 'past' 
                                ? 'bg-slate-200 text-slate-800' 
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                            {pastCount}
                        </span>
                    </button>
                </div>
            </div>

            {/* Filters and Controls - Mobile Optimized */}
            <div className="bg-white/90 backdrop-blur-sm border-b px-3 py-2 sm:px-6 sm:py-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100 rounded-md p-0.5">
                        <button
                            onClick={() => setViewMode('compact')}
                            className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                                viewMode === 'compact'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                            }`}
                            data-testid="compact-view-btn"
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('detailed')}
                            className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                                viewMode === 'detailed'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                            }`}
                            data-testid="detailed-view-btn"
                        >
                            Detail
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                                viewMode === 'calendar'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                            }`}
                            data-testid="calendar-view-btn"
                        >
                            Cal
                        </button>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-2 py-1 border border-gray-200 rounded-md text-[10px] sm:text-xs bg-white"
                        data-testid="status-filter-select"
                    >
                        <option value="active">Active</option>
                        <option value="all">All</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="canceled">Canceled</option>
                        <option value="archived">Archived</option>
                    </select>

                    {/* Sort By */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-2 py-1 border border-gray-200 rounded-md text-[10px] sm:text-xs bg-white"
                        data-testid="sort-by-select"
                    >
                        <option value="date">Date</option>
                        <option value="title">Title</option>
                        <option value="type">Type</option>
                    </select>

                    <span className="text-[10px] sm:text-xs text-gray-500 ml-auto">
                        {displayedEvents.length} events
                    </span>
                </div>
            </div>

            {/* Events Display Area */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-6">
                {/* Live Now Banner */}
                {(() => {
                    const liveEvents = events.filter(e => e.status === 'in_progress' && (e.type === 'game' || e.type === 'regular_game' || e.type === 'tournament'));
                    if (liveEvents.length === 0) return null;
                    return (
                        <div className="mb-3 bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-3 text-white shadow-lg" data-testid="live-now-banner">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-wider">Live Now</span>
                            </div>
                            <div className="space-y-2">
                                {liveEvents.map(event => {
                                    const teamIds = [event.homeTeam, event.awayTeam].filter(Boolean);
                                    const fallbackIds = teamIds.length ? teamIds : (event.teams || []).slice(0, 2);
                                    const homeTeam = teams.find(t => t.id === fallbackIds[0]);
                                    const awayTeam = teams.find(t => t.id === fallbackIds[1]);
                                    return (
                                        <div
                                            key={event.id}
                                            className="flex items-center justify-between bg-white/10 rounded-md px-3 py-2 cursor-pointer hover:bg-white/20 transition-colors"
                                            onClick={() => onViewLive && onViewLive(event)}
                                            data-testid={`live-banner-event-${event.id}`}
                                        >
                                            <div className="flex items-center gap-2 text-sm font-medium min-w-0">
                                                {homeTeam?.style?.logoUrl && <img src={homeTeam.style.logoUrl} alt="" className="w-5 h-5 rounded-full object-contain bg-white flex-shrink-0" />}
                                                <span className="truncate">{homeTeam?.name || 'Home'}</span>
                                                <span className="text-white/60 flex-shrink-0">vs</span>
                                                <span className="truncate">{awayTeam?.name || 'Away'}</span>
                                                {awayTeam?.style?.logoUrl && <img src={awayTeam.style.logoUrl} alt="" className="w-5 h-5 rounded-full object-contain bg-white flex-shrink-0" />}
                                            </div>
                                            <button className="px-2.5 py-1 bg-white text-red-600 text-xs font-bold rounded-md hover:bg-red-50 flex-shrink-0 ml-2">
                                                Watch
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
                {/* Calendar View */}
                {viewMode === 'calendar' && (
                    <AdvancedEventCalendar 
                        leagueSchedule={displayedEvents}
                        teams={teams}
                        onEventClick={(event) => onEventSelect && onEventSelect(event)}
                        currentUser={currentUser}
                    />
                )}

                {/* Compact or Detailed View */}
                {viewMode !== 'calendar' && (
                    <>
                        {displayedEvents.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">{timeFilter === 'upcoming' ? '🗓️' : '📜'}</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {timeFilter === 'upcoming' ? 'No Upcoming Events' : 'No Past Events'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {timeFilter === 'upcoming' 
                                        ? 'Create a new event to get started'
                                        : 'Past events will appear here after they occur'
                                    }
                                </p>
                                {timeFilter === 'upcoming' && (
                                    <button
                                        onClick={onCreateEvent}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Create Event
                                    </button>
                                )}
                            </div>
                        ) : viewMode === 'compact' ? (
                            /* Compact List View */
                            <div className="bg-white rounded-lg border divide-y divide-slate-100">
                                {displayedEvents.map((event) => (
                                    <CompactEventRow 
                                        key={event.id}
                                        event={event}
                                        teams={teams}
                                        currentUser={currentUser}
                                        onEventSelect={onEventSelect}
                                        onEnterScoring={onEnterScoring}
                                        onViewLive={onViewLive}
                                        onManageTournament={onManageTournament}
                                        onNavigate={onNavigate}
                                        getEventTypeIcon={getEventTypeIcon}
                                        getStatusColor={getStatusColor}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* Detailed View - Original Cards */
                            <div className="space-y-3 sm:space-y-4">
                                {displayedEvents.map((event, index) => (
                            <div
                                key={event.id}
                                className="bg-white/90 backdrop-blur-sm rounded-lg shadow border hover:shadow-md transition-shadow relative"
                                style={{ zIndex: notifyMenuOpen === event.id ? 100 : 1 }}
                            >
                                {/* Mobile-first Card Layout */}
                                <div className="p-3 sm:p-6">
                                    {/* Header Row - Status Badge and Type Icon */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl sm:text-2xl">
                                                {getEventTypeIcon(event.type)}
                                            </span>
                                            <div className="relative">
                                                {/* Status - Only clickable for admins/coaches */}
                                                {canManageEvent(event) ? (
                                                    <>
                                                        <button
                                                            onClick={() => setChangingStatus(event.id === changingStatus ? null : event.id)}
                                                            className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)} cursor-pointer hover:opacity-80`}
                                                        >
                                                            {event.status.replace('_', ' ').toUpperCase()} ▼
                                                        </button>
                                                        {changingStatus === event.id && (
                                                            <div className="absolute left-0 mt-1 bg-white rounded-lg shadow-lg border z-10 py-1 min-w-[120px]">
                                                                {['scheduled', 'in_progress', 'completed', 'cancelled'].map(status => (
                                                                    <button
                                                                        key={status}
                                                                        onClick={() => handleStatusChange(event.id, status)}
                                                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-xs sm:text-sm"
                                                                    >
                                                                        {status.replace('_', ' ')}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    /* Read-only status for regular users */
                                                    <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                                        {event.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Quick Action - Live View */}
                                        {(event.type === 'regular_game' || event.type === 'tournament') && 
                                         (event.status === 'in_progress' || event.status === 'scheduled') && (
                                            <button
                                                onClick={() => onViewLive ? onViewLive(event) : null}
                                                className="px-2 py-1 text-xs sm:px-3 sm:text-sm bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                                            >
                                                📺 Live
                                            </button>
                                        )}
                                    </div>

                                    {/* Event Title */}
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                                        {event.title}
                                    </h3>

                                    {/* Event Details - Stacked on Mobile */}
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600 mb-3">
                                        <span>📅 {formatDate(event.date)}</span>
                                        <span>🕒 {formatTime(event.time)}</span>
                                        <span className="truncate max-w-[150px] sm:max-w-none">📍 {event.location}</span>
                                    </div>

                                    {/* Teams - Compact on Mobile */}
                                    {event.teams && event.teams.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1 mb-3">
                                            {event.teams.slice(0, 3).map((teamId, index) => (
                                                <div key={teamId} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                                                    {getTeamLogo(teamId) && (
                                                        <img
                                                            src={getTeamLogo(teamId)}
                                                            alt={getTeamName(teamId)}
                                                            className="w-4 h-4 sm:w-5 sm:h-5 object-cover rounded"
                                                        />
                                                    )}
                                                    <span className="text-xs sm:text-sm text-gray-800 truncate max-w-[80px]">
                                                        {getTeamName(teamId)}
                                                    </span>
                                                </div>
                                            ))}
                                            {event.teams.length > 3 && (
                                                <span className="text-xs text-gray-500 px-2">
                                                    +{event.teams.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Scores (if completed) */}
                                    {event.scores && (
                                        <div className="bg-gray-50 rounded p-2 mb-3">
                                            <div className="text-sm sm:text-base font-semibold text-gray-900 text-center">
                                                {event.scores.home_team?.name} {event.scores.home_team?.score} - {event.scores.away_team?.score} {event.scores.away_team?.name}
                                            </div>
                                        </div>
                                    )}

                                    {/* Admin Actions - Compact on Mobile */}
                                    {canManageEvent(event) && (
                                        <div className="flex flex-wrap gap-1 sm:gap-2 pt-2 sm:pt-3 border-t">
                                            <button
                                                onClick={() => onEventSelect ? onEventSelect(event) : null}
                                                className="px-1.5 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                                            >
                                                Edit
                                            </button>

                                            {event.type === 'tournament' && (
                                                <button
                                                    onClick={() => onManageTournament(event)}
                                                    className="px-1.5 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                                                >
                                                    Bracket
                                                </button>
                                            )}

                                            {(event.type === 'regular_game' || event.type === 'tournament') && (
                                                <button
                                                    onClick={() => {
                                                        if (onEnterScoring) onEnterScoring(event);
                                                    }}
                                                    className="px-1.5 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    Score
                                                </button>
                                            )}
                                            
                                            <div className="relative z-[60]">
                                                <button
                                                    onClick={() => setNotifyMenuOpen(notifyMenuOpen === event.id ? null : event.id)}
                                                    disabled={sendingNotifications[event.id]}
                                                    className="px-2 py-1.5 text-xs sm:px-3 sm:text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    {sendingNotifications[event.id] ? '⏳...' : '📢 Notify'} 
                                                    <span className="text-xs">▼</span>
                                                </button>
                                                
                                                {notifyMenuOpen === event.id && (
                                                    <div 
                                                        className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border z-[100]"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
                                                    >
                                                        <button
                                                            onClick={() => handleSendNotifications(event.id)}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-t-lg flex items-center gap-2"
                                                        >
                                                            📧 Send Email
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openSmsModal(event);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 border-t"
                                                        >
                                                            📱 Send SMS
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                console.log('💬 GroupMe button clicked, event:', event.id, event.title);
                                                                openGroupmeModal(event);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-b-lg flex items-center gap-2 border-t"
                                                        >
                                                            💬 Send to GroupMe
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {event.rsvp_enabled && (
                                                <button
                                                    onClick={() => setViewingRSVPs(event)}
                                                    className="px-2 py-1.5 text-xs sm:px-3 sm:text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                                                >
                                                    📊 RSVPs
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                        )}
                    </>
                )}
            </div>

            {/* RSVP Modal */}
            {viewingRSVPs && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">Event RSVPs</h3>
                            <button
                                onClick={() => setViewingRSVPs(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                ✕ Close
                            </button>
                        </div>
                        <div className="p-6">
                            <EventRSVPDashboard 
                                eventId={viewingRSVPs.id} 
                                eventTitle={viewingRSVPs.title}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* GroupMe Notification Modal */}
            {showGroupmeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4" onClick={() => setShowGroupmeModal(null)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">📢 Send to GroupMe</h3>
                            <button
                                onClick={() => setShowGroupmeModal(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Event Info */}
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="font-medium text-blue-800">{showGroupmeModal.title}</div>
                                <div className="text-sm text-blue-600">
                                    {showGroupmeModal.start_datetime ? new Date(showGroupmeModal.start_datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : (showGroupmeModal.date ? `${showGroupmeModal.date} ${showGroupmeModal.time || ''}` : 'TBD')}
                                </div>
                            </div>

                            {/* Channel Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Channels</label>
                                {groupmeChannels.length === 0 ? (
                                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                                        No GroupMe channels configured. Set up channels in Admin → GroupMe.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                                        {groupmeChannels.map((channel) => (
                                            <label key={channel.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={groupmeForm.channel_ids.includes(channel.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setGroupmeForm(prev => ({
                                                                ...prev,
                                                                channel_ids: [...prev.channel_ids, channel.id]
                                                            }));
                                                        } else {
                                                            setGroupmeForm(prev => ({
                                                                ...prev,
                                                                channel_ids: prev.channel_ids.filter(id => id !== channel.id)
                                                            }));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600"
                                                />
                                                <span className="text-sm">{channel.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Notification Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
                                <select
                                    value={groupmeForm.notification_type}
                                    onChange={(e) => setGroupmeForm(prev => ({...prev, notification_type: e.target.value}))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="event_announcement">📢 Event Announcement</option>
                                    <option value="rsvp_reminder">⏰ RSVP Reminder</option>
                                    <option value="event_update">✏️ Event Update</option>
                                    <option value="last_call">🚨 Last Call for RSVPs</option>
                                </select>
                            </div>

                            {/* Message Options */}
                            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-700 mb-2">Message Options</div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={groupmeForm.include_image}
                                        onChange={(e) => setGroupmeForm(prev => ({...prev, include_image: e.target.checked}))}
                                        className="rounded border-gray-300 text-blue-600"
                                    />
                                    <span className="text-sm">🖼️ Include visual event card</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={groupmeForm.include_calendar_link}
                                        onChange={(e) => setGroupmeForm(prev => ({...prev, include_calendar_link: e.target.checked}))}
                                        className="rounded border-gray-300 text-blue-600"
                                    />
                                    <span className="text-sm">📆 Include Google Calendar link</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={groupmeForm.include_rsvp}
                                        onChange={(e) => setGroupmeForm(prev => ({...prev, include_rsvp: e.target.checked}))}
                                        className="rounded border-gray-300 text-blue-600"
                                    />
                                    <span className="text-sm">🎯 Include RSVP link</span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="border-t px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowGroupmeModal(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendGroupmeNotification}
                                disabled={groupmeForm.channel_ids.length === 0 || sendingNotifications[showGroupmeModal.id]}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingNotifications[showGroupmeModal.id] ? '⏳ Sending...' : '💬 Send to GroupMe'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SMS Notification Modal */}
            {showSmsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4" onClick={() => setShowSmsModal(null)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">📱 Send SMS Notification</h3>
                            <button
                                onClick={() => setShowSmsModal(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Event Info */}
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="font-medium text-blue-800">{showSmsModal.title}</div>
                                <div className="text-sm text-blue-600">
                                    {showSmsModal.date ? `${showSmsModal.date} ${showSmsModal.time || ''}` : 'TBD'}
                                </div>
                            </div>

                            {/* SMS Config Status */}
                            {smsConfig && !smsConfig.enabled && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                    ⚠️ SMS notifications are disabled. Enable them in Admin → SMS Notifications.
                                </div>
                            )}

                            {smsConfig && !smsConfig.auth_token_configured && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                                    ❌ Twilio credentials not configured. Set up in Admin → SMS Notifications.
                                </div>
                            )}

                            {/* Notification Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
                                <select
                                    value={smsForm.notification_type}
                                    onChange={(e) => setSmsForm(prev => ({...prev, notification_type: e.target.value}))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="event_reminder">📅 Event Reminder</option>
                                    <option value="rsvp_confirmation">✅ RSVP Confirmation</option>
                                    <option value="custom">✏️ Custom Message</option>
                                </select>
                            </div>

                            {/* Target Users */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                                <select
                                    value={smsForm.target_users}
                                    onChange={(e) => setSmsForm(prev => ({...prev, target_users: e.target.value}))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="all">👥 All Players (with phone numbers)</option>
                                    <option value="going">✅ Confirmed RSVPs Only</option>
                                    <option value="maybe">🤔 Maybe RSVPs Only</option>
                                </select>
                            </div>

                            {/* Custom Message */}
                            {smsForm.notification_type === 'custom' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Message</label>
                                    <textarea
                                        value={smsForm.custom_message}
                                        onChange={(e) => setSmsForm(prev => ({...prev, custom_message: e.target.value}))}
                                        rows={3}
                                        placeholder="Enter your custom message..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Characters: {smsForm.custom_message.length}/160
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="border-t px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSmsModal(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendSmsNotification}
                                disabled={!smsConfig?.enabled || !smsConfig?.auth_token_configured || sendingNotifications[showSmsModal.id]}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingNotifications[showSmsModal.id] ? '⏳ Sending...' : '📱 Send SMS'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsList;