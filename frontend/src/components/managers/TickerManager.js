import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

const TickerManager = ({ websiteStyle, setWebsiteStyle, teams, events }) => {
    const [tickerConfig, setTickerConfig] = useState({
        // Date range settings
        tickerLookBack: websiteStyle?.tickerLookBack || 7,
        tickerLookForward: websiteStyle?.tickerLookForward || 120,
        
        // Show cancelled events
        tickerShowCancelled: websiteStyle?.tickerShowCancelled || false,
        
        // Transparent background
        tickerTransparent: websiteStyle?.tickerTransparent || false,
        
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
    const [saving, setSaving] = useState(false);

    const saveConfig = async (configToSave) => {
        try {
            setSaving(true);
            const updatedWebsiteStyle = {
                ...websiteStyle,
                ...configToSave
            };

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
                setTimeout(() => setSaved(false), 2000);
            } else {
                console.error('Failed to save ticker configuration');
            }
        } catch (error) {
            console.error('Error saving ticker configuration:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = () => saveConfig(tickerConfig);

    const handleFilterChange = (filterType) => {
        const newConfig = {
            ...tickerConfig,
            tickerFilters: {
                ...tickerConfig.tickerFilters,
                [filterType]: !tickerConfig.tickerFilters[filterType]
            }
        };
        setTickerConfig(newConfig);
        saveConfig(newConfig);
    };

    const getEventCount = (eventType) => {
        if (!events || events.length === 0) return 0;
        
        if (eventType === 'games') {
            return events.filter(e => e.type === 'game').length;
        } else if (eventType === 'tournaments') {
            return events.filter(e => e.type === 'tournament').length;
        } else if (eventType === 'practices') {
            return events.filter(e => e.type === 'practice').length;
        } else if (eventType === 'meetings') {
            return events.filter(e => e.type === 'meeting').length;
        } else if (eventType === 'social') {
            return events.filter(e => e.type === 'social').length;
        } else if (eventType === 'other') {
            return events.filter(e => !['game', 'tournament', 'practice', 'meeting', 'social'].includes(e.type)).length;
        }
        return 0;
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
                        ⏰ Date Range Settings
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
                        
                        <div className="pt-2 border-t">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => {
                                            const newConfig = {
                                                ...tickerConfig,
                                                tickerShowCancelled: !tickerConfig.tickerShowCancelled
                                            };
                                            setTickerConfig(newConfig);
                                            saveConfig(newConfig);
                                        }}
                                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                            tickerConfig.tickerShowCancelled 
                                                ? 'bg-red-600 text-white' 
                                                : 'bg-slate-300 text-slate-600'
                                        }`}
                                    >
                                        {tickerConfig.tickerShowCancelled ? '👁️' : '❌'}
                                    </button>
                                    <div>
                                        <div className="font-medium text-slate-800">
                                            Show Cancelled Events
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Include cancelled/postponed events in the ticker
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    tickerConfig.tickerShowCancelled 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {tickerConfig.tickerShowCancelled ? 'Showing' : 'Hidden'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => {
                                            const newConfig = {
                                                ...tickerConfig,
                                                tickerTransparent: !tickerConfig.tickerTransparent
                                            };
                                            setTickerConfig(newConfig);
                                            saveConfig(newConfig);
                                        }}
                                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                            tickerConfig.tickerTransparent 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-slate-300 text-slate-600'
                                        }`}
                                        data-testid="ticker-transparent-toggle"
                                    >
                                        {tickerConfig.tickerTransparent ? '✓' : ''}
                                    </button>
                                    <div>
                                        <div className="font-medium text-slate-800">
                                            Transparent Ticker
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Let the banner show through behind the ticker
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    tickerConfig.tickerTransparent 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {tickerConfig.tickerTransparent ? 'Transparent' : 'Solid'}
                                </div>
                            </div>
                        </div>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        🔽 Event Type Filters
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
                                            {enabled ? '👁️' : '❌'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <p className="text-xs text-slate-500 mt-1">
                            Background color for the ticker bar
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Card Background
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
                        <p className="text-xs text-slate-500 mt-1">
                            Background color for event cards
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Card Border
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
                        <p className="text-xs text-slate-500 mt-1">
                            Border color for event cards
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Scrolling Speed
                    </label>
                    <div className="flex items-center space-x-3">
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={tickerConfig.tickerSpeed}
                            onChange={(e) => setTickerConfig(prev => ({
                                ...prev,
                                tickerSpeed: parseFloat(e.target.value)
                            }))}
                            className="flex-1"
                        />
                        <span className="text-sm text-slate-600 w-12">
                            {tickerConfig.tickerSpeed}x
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        How fast events scroll across the screen
                    </p>
                </div>
                
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Event Type Colors</h4>
                    <p className="text-xs text-slate-500 mb-3">
                        Event badges use predefined colors: Games (green), Tournaments (purple), Practices (blue), Meetings (yellow), Social (pink)
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded text-xs font-bold text-white bg-green-600">GAME</span>
                        <span className="px-2 py-1 rounded text-xs font-bold text-white bg-purple-600">TOURNAMENT</span>
                        <span className="px-2 py-1 rounded text-xs font-bold text-white bg-blue-600">PRACTICE</span>
                        <span className="px-2 py-1 rounded text-xs font-bold text-white bg-yellow-600">MEETING</span>
                        <span className="px-2 py-1 rounded text-xs font-bold text-white bg-pink-600">SOCIAL</span>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    Live Preview
                </h3>
                <div 
                    className="rounded-lg p-3"
                    style={{
                        backgroundColor: tickerConfig.tickerColor,
                        minHeight: '60px'
                    }}
                >
                    <div className="flex items-center space-x-4 overflow-hidden">
                        {/* Sample Game Event */}
                        <div 
                            className="flex-shrink-0 rounded-lg px-4 py-2 border"
                            style={{
                                backgroundColor: tickerConfig.tickerItemColor,
                                borderColor: tickerConfig.tickerBorderColor
                            }}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="px-2 py-1 rounded text-xs font-bold text-white bg-green-600">
                                    GAME
                                </span>
                                <div className="text-white">
                                    <div className="font-medium text-sm">Eagles vs Bears</div>
                                    <div className="text-xs text-slate-300">Sep 20 • 3:00 PM • Main Field</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Sample Tournament Event */}
                        <div 
                            className="flex-shrink-0 rounded-lg px-4 py-2 border"
                            style={{
                                backgroundColor: tickerConfig.tickerItemColor,
                                borderColor: tickerConfig.tickerBorderColor
                            }}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="px-2 py-1 rounded text-xs font-bold text-white bg-purple-600">
                                    TOURNAMENT
                                </span>
                                <div className="text-white">
                                    <div className="font-medium text-sm">Spring Championship</div>
                                    <div className="text-xs text-slate-300">Sep 25 • 10:00 AM • Championship Arena</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Sample Practice Event */}
                        <div 
                            className="flex-shrink-0 rounded-lg px-4 py-2 border"
                            style={{
                                backgroundColor: tickerConfig.tickerItemColor,
                                borderColor: tickerConfig.tickerBorderColor
                            }}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="px-2 py-1 rounded text-xs font-bold text-white bg-blue-600">
                                    PRACTICE
                                </span>
                                <div className="text-white">
                                    <div className="font-medium text-sm">Team Practice</div>
                                    <div className="text-xs text-slate-300">Sep 18 • 6:00 PM • Practice Field</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Live preview of your ticker design. Events display with color-coded badges and scroll horizontally when there are many events.
                </p>
            </div>
        </div>
    );
};

export default TickerManager;