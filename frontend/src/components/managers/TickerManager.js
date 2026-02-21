import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

const TickerManager = ({ websiteStyle, setWebsiteStyle, teams, events, tickerConfig: parentTickerConfig, onTickerConfigChange }) => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    // Functional settings (stored separately from templates)
    const [tickerConfig, setTickerConfig] = useState({
        tickerLookBack: 7,
        tickerLookForward: 120,
        tickerShowCancelled: false,
        tickerFilters: {
            games: true,
            tournaments: true,
            practices: true,
            meetings: true,
            social: true,
            other: true
        }
    });

    // Visual settings (part of websiteStyle/templates)
    const [visualConfig, setVisualConfig] = useState({
        tickerTransparent: websiteStyle?.tickerTransparent || false,
        tickerColor: websiteStyle?.tickerColor || '#1e293b',
        tickerItemColor: websiteStyle?.tickerItemColor || '#334155',
        tickerBorderColor: websiteStyle?.tickerBorderColor || '#475569',
        tickerTextColor: websiteStyle?.tickerTextColor || '#94a3b8',
        tickerSpeed: websiteStyle?.tickerSpeed || 1
    });

    const [saved, setSaved] = useState(false);
    const [configSaved, setConfigSaved] = useState(false);

    // Load ticker config from separate endpoint on mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/league-data/tickerConfig`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && Object.keys(data).length > 0) {
                        setTickerConfig(prev => ({
                            ...prev,
                            tickerLookBack: data.tickerLookBack ?? prev.tickerLookBack,
                            tickerLookForward: data.tickerLookForward ?? prev.tickerLookForward,
                            tickerShowCancelled: data.tickerShowCancelled ?? prev.tickerShowCancelled,
                            tickerFilters: data.tickerFilters ? { ...prev.tickerFilters, ...data.tickerFilters } : prev.tickerFilters
                        }));
                    }
                }
            } catch (err) {
                console.error('Error loading ticker config:', err);
            }
        };
        loadConfig();
    }, [backendUrl]);

    // Also sync if parent provides config
    useEffect(() => {
        if (parentTickerConfig && Object.keys(parentTickerConfig).length > 0) {
            setTickerConfig(prev => ({
                ...prev,
                tickerLookBack: parentTickerConfig.tickerLookBack ?? prev.tickerLookBack,
                tickerLookForward: parentTickerConfig.tickerLookForward ?? prev.tickerLookForward,
                tickerShowCancelled: parentTickerConfig.tickerShowCancelled ?? prev.tickerShowCancelled,
                tickerFilters: parentTickerConfig.tickerFilters ? { ...prev.tickerFilters, ...parentTickerConfig.tickerFilters } : prev.tickerFilters
            }));
        }
    }, [parentTickerConfig]);

    // Save functional config to separate endpoint
    const saveTickerConfig = async (configToSave) => {
        try {
            const res = await fetch(`${backendUrl}/api/league-data/tickerConfig`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configToSave)
            });
            if (res.ok) {
                setConfigSaved(true);
                setTimeout(() => setConfigSaved(false), 2000);
                if (onTickerConfigChange) onTickerConfigChange(configToSave);
            }
        } catch (err) {
            console.error('Error saving ticker config:', err);
        }
    };

    // Save visual settings to websiteStyle
    const saveVisualConfig = async () => {
        try {
            const updatedStyle = { ...websiteStyle, ...visualConfig };
            const res = await fetch(`${backendUrl}/api/league-data/websiteStyle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedStyle)
            });
            if (res.ok) {
                setWebsiteStyle(updatedStyle);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (err) {
            console.error('Error saving visual config:', err);
        }
    };

    const handleFilterChange = (filterType) => {
        const newConfig = {
            ...tickerConfig,
            tickerFilters: {
                ...tickerConfig.tickerFilters,
                [filterType]: !tickerConfig.tickerFilters[filterType]
            }
        };
        setTickerConfig(newConfig);
        saveTickerConfig(newConfig);
    };

    const getEventCount = (eventType) => {
        if (!events || events.length === 0) return 0;
        const typeMap = {
            games: e => e.type === 'game' || e.type === 'regular_game',
            tournaments: e => e.type === 'tournament',
            practices: e => e.type === 'practice',
            meetings: e => e.type === 'meeting',
            social: e => e.type === 'social',
            other: e => !['game', 'regular_game', 'tournament', 'practice', 'meeting', 'social'].includes(e.type)
        };
        return events.filter(typeMap[eventType] || (() => false)).length;
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
                        Configure how events are displayed in the scrolling ticker
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Functional Settings - saved independently */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                            ⏰ Date Range & Filters
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">Admin Setting</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">These settings apply globally and are independent of style templates.</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Look Back Days</label>
                            <input
                                type="number" min="0" max="365"
                                value={tickerConfig.tickerLookBack}
                                onChange={(e) => {
                                    const newConfig = { ...tickerConfig, tickerLookBack: parseInt(e.target.value) || 0 };
                                    setTickerConfig(newConfig);
                                }}
                                onBlur={() => saveTickerConfig(tickerConfig)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-testid="ticker-lookback-input"
                            />
                            <p className="text-xs text-slate-500 mt-1">How many days in the past to show events (0 = future only)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Look Forward Days</label>
                            <input
                                type="number" min="1" max="365"
                                value={tickerConfig.tickerLookForward}
                                onChange={(e) => {
                                    const newConfig = { ...tickerConfig, tickerLookForward: parseInt(e.target.value) || 30 };
                                    setTickerConfig(newConfig);
                                }}
                                onBlur={() => saveTickerConfig(tickerConfig)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-testid="ticker-lookforward-input"
                            />
                            <p className="text-xs text-slate-500 mt-1">How many days in the future to show events</p>
                        </div>
                        <div className="pt-2 border-t">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => {
                                            const newConfig = { ...tickerConfig, tickerShowCancelled: !tickerConfig.tickerShowCancelled };
                                            setTickerConfig(newConfig);
                                            saveTickerConfig(newConfig);
                                        }}
                                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                            tickerConfig.tickerShowCancelled ? 'bg-red-600 text-white' : 'bg-slate-300 text-slate-600'
                                        }`}
                                        data-testid="ticker-show-cancelled-toggle"
                                    >
                                        {tickerConfig.tickerShowCancelled ? '✓' : ''}
                                    </button>
                                    <div>
                                        <div className="font-medium text-slate-800">Show Cancelled Events</div>
                                        <div className="text-xs text-slate-500">Include cancelled/postponed events</div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    tickerConfig.tickerShowCancelled ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {tickerConfig.tickerShowCancelled ? 'Showing' : 'Hidden'}
                                </div>
                            </div>
                        </div>
                        {configSaved && <div className="text-green-600 text-sm font-medium text-center">Saved!</div>}
                    </div>
                </div>

                {/* Event Type Filters - saved independently */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                            Event Type Filters
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">Admin Setting</span>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(tickerConfig.tickerFilters).map(([filterType, enabled]) => {
                            const filterLabels = {
                                games: 'Games & Matches',
                                tournaments: 'Tournaments',
                                practices: 'Practices',
                                meetings: 'Team Meetings',
                                social: 'Social Events',
                                other: 'Other Events'
                            };
                            const eventCount = getEventCount(filterType);
                            return (
                                <div key={filterType} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => handleFilterChange(filterType)}
                                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                                enabled ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-600'
                                            }`}
                                            data-testid={`ticker-filter-${filterType}`}
                                        >
                                            {enabled ? '✓' : ''}
                                        </button>
                                        <div>
                                            <div className="font-medium text-slate-800">{filterLabels[filterType]}</div>
                                            <div className="text-xs text-slate-500">{eventCount} event{eventCount !== 1 ? 's' : ''} available</div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                                        enabled ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        {enabled ? 'Showing' : 'Hidden'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Visual Settings - part of template/websiteStyle */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Visual Settings</h3>
                    <button
                        onClick={saveVisualConfig}
                        className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-all ${
                            saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        data-testid="ticker-save-visual-btn"
                    >
                        {saved ? 'Saved!' : 'Save Visual'}
                    </button>
                </div>
                <div className="pt-2 mb-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setVisualConfig(prev => ({ ...prev, tickerTransparent: !prev.tickerTransparent }))}
                                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                    visualConfig.tickerTransparent ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                                }`}
                                data-testid="ticker-transparent-toggle"
                            >
                                {visualConfig.tickerTransparent ? '✓' : ''}
                            </button>
                            <div>
                                <div className="font-medium text-slate-800">Transparent Ticker</div>
                                <div className="text-xs text-slate-500">Let the banner show through behind the ticker</div>
                            </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                            visualConfig.tickerTransparent ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                            {visualConfig.tickerTransparent ? 'Transparent' : 'Solid'}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { key: 'tickerColor', label: 'Ticker Background' },
                        { key: 'tickerItemColor', label: 'Card Background' },
                        { key: 'tickerBorderColor', label: 'Card Border' }
                    ].map(({ key, label }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
                            <div className="flex items-center space-x-2">
                                <input type="color" value={visualConfig[key]} onChange={(e) => setVisualConfig(prev => ({ ...prev, [key]: e.target.value }))} className="w-12 h-10 border border-slate-300 rounded cursor-pointer" />
                                <input type="text" value={visualConfig[key]} onChange={(e) => setVisualConfig(prev => ({ ...prev, [key]: e.target.value }))} className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Scrolling Speed</label>
                    <div className="flex items-center space-x-3">
                        <input type="range" min="0.5" max="3" step="0.1" value={visualConfig.tickerSpeed} onChange={(e) => setVisualConfig(prev => ({ ...prev, tickerSpeed: parseFloat(e.target.value) }))} className="flex-1" />
                        <span className="text-sm text-slate-600 w-12">{visualConfig.tickerSpeed}x</span>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Live Preview</h3>
                <div className="rounded-lg p-3" style={{ backgroundColor: visualConfig.tickerColor, minHeight: '60px' }}>
                    <div className="flex items-center space-x-4 overflow-hidden">
                        {[
                            { label: 'GAME', bg: 'bg-green-600', title: 'Eagles vs Bears', sub: 'Sep 20 - 3:00 PM' },
                            { label: 'TOURNAMENT', bg: 'bg-purple-600', title: 'Spring Championship', sub: 'Sep 25 - 10:00 AM' },
                            { label: 'PRACTICE', bg: 'bg-blue-600', title: 'Team Practice', sub: 'Sep 18 - 6:00 PM' }
                        ].map(({ label, bg, title, sub }) => (
                            <div key={label} className="flex-shrink-0 rounded-lg px-4 py-2 border" style={{ backgroundColor: visualConfig.tickerItemColor, borderColor: visualConfig.tickerBorderColor }}>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold text-white ${bg}`}>{label}</span>
                                    <div className="text-white">
                                        <div className="font-medium text-sm">{title}</div>
                                        <div className="text-xs text-slate-300">{sub}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TickerManager;
