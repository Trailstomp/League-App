import React, { useState } from 'react';
import EventCalendar from './EventCalendar';
import EventStats from './EventStats';
import SimpleEventForm from './SimpleEventForm';

/**
 * Scheduling Dashboard - Complete scheduling interface
 * Combines calendar, stats, and event management
 */
const SchedulingDashboard = ({ 
    teams = [], 
    leagueSchedule = [], 
    setLeagueSchedule, 
    currentUser,
    leagueLocations = [],
    onEditEvent,
    onDeleteEvent,
    onEventClick
}) => {
    const [activeTab, setActiveTab] = useState('calendar');
    const [editingEvent, setEditingEvent] = useState(null);
    const [showEventForm, setShowEventForm] = useState(false);

    const handleCreateEvent = () => {
        console.log('📝 Creating new event');
        setEditingEvent(null);
        setShowEventForm(true);
        setActiveTab('form');
    };

    const handleEditEvent = (event) => {
        console.log('✏️ Editing event:', event);
        // Use the main app's edit handler if provided, otherwise fall back to local handler
        if (onEditEvent) {
            onEditEvent(event);
        } else {
            // Fallback to local form-based editing
            setEditingEvent(event);
            setShowEventForm(true);
            setActiveTab('form');
        }
    };

    const handleDeleteEvent = (eventId) => {
        // Use the main app's delete handler if provided, otherwise fall back to local handler
        if (onDeleteEvent) {
            onDeleteEvent(eventId);
        } else {
            // Fallback to local deletion
            if (window.confirm('Are you sure you want to delete this event?')) {
                console.log('🗑️ Deleting event:', eventId);
                setLeagueSchedule(prev => prev.filter(e => e.id !== eventId));
            }
        }
    };

    const handleSaveEvent = (savedEvent) => {
        console.log('💾 Event saved:', savedEvent);
        setShowEventForm(false);
        setEditingEvent(null);
        setActiveTab('calendar');
    };

    const handleCancelEvent = () => {
        console.log('🚫 Event form cancelled');
        setShowEventForm(false);
        setEditingEvent(null);
        setActiveTab('calendar');
    };

    const tabs = [
        { id: 'calendar', label: '📅 Calendar', count: leagueSchedule.length },
        { id: 'stats', label: '📊 Statistics', count: null },
        { id: 'form', label: '📝 Event Form', count: null }
    ];

    const canManage = currentUser && (currentUser.role === 'admin' || currentUser.roles?.includes('admin'));

    return (
        <div className="scheduling-dashboard">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg mb-6">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Scheduling Dashboard</h1>
                            <p className="text-gray-600 mt-1">
                                Complete event management with persistent team selections
                            </p>
                        </div>
                        
                        {canManage && (
                            <button
                                onClick={handleCreateEvent}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                            >
                                <span className="mr-2">+</span>
                                Create Event
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                            {tab.count !== null && (
                                <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'calendar' && (
                    <div>
                        <EventStats leagueSchedule={leagueSchedule} teams={teams} />
                        <EventCalendar
                            leagueSchedule={leagueSchedule}
                            teams={teams}
                            onEditEvent={handleEditEvent}
                            onDeleteEvent={handleDeleteEvent}
                            currentUser={currentUser}
                        />
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-bold mb-6">Detailed Statistics</h2>
                        <EventStats leagueSchedule={leagueSchedule} teams={teams} />
                        
                        {/* Additional stats can go here */}
                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold mb-3">Event Types Distribution</h3>
                                <div className="space-y-2">
                                    {['game', 'practice', 'tournament', 'event'].map(type => {
                                        const count = leagueSchedule.filter(e => e.type === type).length;
                                        const percentage = leagueSchedule.length > 0 ? Math.round((count / leagueSchedule.length) * 100) : 0;
                                        return (
                                            <div key={type} className="flex justify-between items-center">
                                                <span className="capitalize text-sm">{type}s:</span>
                                                <span className="text-sm font-medium">{count} ({percentage}%)</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold mb-3">Quick Info</h3>
                                <div className="space-y-2 text-sm">
                                    <div>Total Teams Available: <strong>{teams.length}</strong></div>
                                    <div>League Teams: <strong>{teams.filter(t => !t.isExternal).length}</strong></div>
                                    <div>External Teams: <strong>{teams.filter(t => t.isExternal).length}</strong></div>
                                    <div>Events Scheduled: <strong>{leagueSchedule.length}</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'form' && (
                    <SimpleEventForm
                        initialEvent={editingEvent}
                        teams={teams}
                        leagueSchedule={leagueSchedule}
                        setLeagueSchedule={setLeagueSchedule}
                        leagueLocations={leagueLocations}
                        onSave={handleSaveEvent}
                        onCancel={handleCancelEvent}
                    />
                )}
            </div>
        </div>
    );
};

export default SchedulingDashboard;