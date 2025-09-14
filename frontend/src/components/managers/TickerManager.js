import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

const TickerManager = ({ websiteStyle, setWebsiteStyle, teams, events }) => {
    const [tickerConfig, setTickerConfig] = useState({
        // Date range settings
        tickerLookBack: websiteStyle?.tickerLookBack || 7,
        tickerLookForward: websiteStyle?.tickerLookForward || 120,
        
        // Event type filters
        tickerFilters: websiteStyle?.tickerFilters || {
            games: true,
            tournaments: true,
            practices: true,
            meetings: true,
            social: true,
            other: true
        },
        
        // Visual settings
        tickerColor: websiteStyle?.tickerColor || '#1e293b',
        tickerItemColor: websiteStyle?.tickerItemColor || '#334155',
        tickerBorderColor: websiteStyle?.tickerBorderColor || '#475569',
        tickerTextColor: websiteStyle?.tickerTextColor || '#94a3b8',
        tickerSpeed: websiteStyle?.tickerSpeed || 1
    });

    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        try {
            const updatedWebsiteStyle = {
                ...websiteStyle,
                ...tickerConfig
            };

            // Save to backend
            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
            const response = await fetch(`${backendUrl}/api/league-data/websiteStyle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedWebsiteStyle)
            });

            if (response.ok) {
                setWebsiteStyle(updatedWebsiteStyle);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                console.error('Failed to save ticker configuration');
            }
        } catch (error) {
            console.error('Error saving ticker configuration:', error);
        }
    };

    const handleFilterChange = (filterType) => {
        setTickerConfig(prev => ({
            ...prev,
            tickerFilters: {
                ...prev.tickerFilters,
                [filterType]: !prev.tickerFilters[filterType]
            }
        }));
    };

    const getEventCount = (eventType) => {
        if (!events || events.length === 0) return 0;
        
        if (eventType === 'games') {
            return events.filter(e => e.type === 'game').length;
        } else if (eventType === 'tournaments') {
            return events.filter(e => e.type === 'tournament').length;
        } else {
            return events.filter(e => {
                const type = e.type?.toLowerCase() || 'other';
                if (eventType === 'practices') return type.includes('practice');
                if (eventType === 'meetings') return type.includes('meeting');
                if (eventType === 'social') return type.includes('social');
                if (eventType === 'other') return !type.includes('practice') && !type.includes('meeting') && !type.includes('social') && type !== 'game' && type !== 'tournament';
                return false;
            }).length;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <LacrosseIcon name="settings" className="mr-3" size={28} />
                        Event Ticker Configuration
                    </h2>
                    <p className="text-slate-600 mt-2">
                        Configure how events are displayed in the scrolling ticker at the top of your league homepage
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                        saved 
                            ? 'bg-green-600 text-white' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    ✓
                    {saved ? 'Saved!' : 'Save Configuration'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Date Range Settings */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Clock className="mr-2" size={20} />
                        Date Range Settings
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Look Back Days
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="365"
                                value={tickerConfig.tickerLookBack}
                                onChange={(e) => setTickerConfig(prev => ({
                                    ...prev,
                                    tickerLookBack: parseInt(e.target.value) || 0
                                }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                How many days in the past to show events (0 = only future events)
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Look Forward Days
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={tickerConfig.tickerLookForward}
                                onChange={(e) => setTickerConfig(prev => ({
                                    ...prev,
                                    tickerLookForward: parseInt(e.target.value) || 30
                                }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                How many days in the future to show events
                            </p>
                        </div>
                    </div>
                </div>

                {/* Event Type Filters */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Filter className="mr-2" size={20} />
                        Event Type Filters
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(tickerConfig.tickerFilters).map(([filterType, enabled]) => {
                            const eventCount = getEventCount(filterType);
                            const filterLabels = {
                                games: 'Games & Matches',
                                tournaments: 'Tournaments', 
                                practices: 'Practices',
                                meetings: 'Team Meetings',
                                social: 'Social Events',
                                other: 'Other Events'
                            };
                            
                            return (
                                <div key={filterType} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => handleFilterChange(filterType)}
                                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                                enabled 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'bg-slate-300 text-slate-600'
                                            }`}
                                        >
                                            {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <div>
                                            <div className="font-medium text-slate-800">
                                                {filterLabels[filterType]}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {eventCount} event{eventCount !== 1 ? 's' : ''} available
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                                        enabled 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        {enabled ? 'Showing' : 'Hidden'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Visual Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    Visual Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Ticker Background
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={tickerConfig.tickerColor}
                                onChange={(e) => setTickerConfig(prev => ({
                                    ...prev,
                                    tickerColor: e.target.value
                                }))}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={tickerConfig.tickerColor}
                                onChange={(e) => setTickerConfig(prev => ({
                                    ...prev,
                                    tickerColor: e.target.value
                                }))}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Item Background
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={tickerConfig.tickerItemColor}
                                onChange={(e) => setTickerConfig(prev => ({
                                    ...prev,
                                    tickerItemColor: e.target.value
                                }))}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={tickerConfig.tickerItemColor}
                                onChange={(e) => setTickerConfig(prev => ({
                                    ...prev,
                                    tickerItemColor: e.target.value
                                }))}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Border Color
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={tickerConfig.tickerBorderColor}
                                onChange={(e) => setTickerConfig(prev => ({
                                    ...prev,
                                    tickerBorderColor: e.target.value
                                }))}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={tickerConfig.tickerBorderColor}
                                onChange={(e) => setTickerConfig(prev => ({
                                    ...prev,
                                    tickerBorderColor: e.target.value
                                }))}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Text Color
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={tickerConfig.tickerTextColor}
                                onChange={(e) => setTickerConfig(prev => ({
                                    ...prev,
                                    tickerTextColor: e.target.value
                                }))}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={tickerConfig.tickerTextColor}
                                onChange={(e) => setTickerConfig(prev => ({
                                    ...prev,
                                    tickerTextColor: e.target.value
                                }))}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    Preview
                </h3>
                <div 
                    className="rounded-lg p-4 border-2"
                    style={{
                        backgroundColor: tickerConfig.tickerColor,
                        borderColor: tickerConfig.tickerBorderColor
                    }}
                >
                    <div className="flex items-center space-x-4 overflow-hidden">
                        <div 
                            className="px-4 py-2 rounded-lg whitespace-nowrap"
                            style={{
                                backgroundColor: tickerConfig.tickerItemColor,
                                color: tickerConfig.tickerTextColor
                            }}
                        >
                            ⚡ Sample Event: Eagles vs Test Team 2 - Tomorrow 3:00 PM
                        </div>
                        <div 
                            className="px-4 py-2 rounded-lg whitespace-nowrap"
                            style={{
                                backgroundColor: tickerConfig.tickerItemColor,
                                color: tickerConfig.tickerTextColor
                            }}
                        >
                            🏆 Tournament: Spring Championship - This Weekend
                        </div>
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    This is how your ticker will look with the current settings. Events will scroll from right to left.
                </p>
            </div>
        </div>
    );
};

export default TickerManager;