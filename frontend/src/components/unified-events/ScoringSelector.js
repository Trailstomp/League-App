import React, { useState } from 'react';

const ScoringSelector = ({ event, teams, onLiveStats, onStatsOnly, onQuickScore, onCancel }) => {
    const [selectedMode, setSelectedMode] = useState(null);
    
    const scoringModes = [
        {
            id: 'live',
            title: 'Live Stats Entry',
            description: 'Full game tracking with timer, player stats, and real-time updates',
            features: [
                'Game timer with periods',
                'Individual player statistics',
                'Live spectator view',
                'Social chat integration'
            ],
            color: 'bg-green-50 border-green-200 text-green-900',
            buttonColor: 'bg-green-600 hover:bg-green-700'
        },
        {
            id: 'stats_only',
            title: 'Stats Only',
            description: 'Track player stats without clocks — perfect for casual or untimed games',
            features: [
                'No game clock or shot clock',
                'Full player stat tracking',
                'Quick goal/assist/shot entry',
                'Live spectator view'
            ],
            color: 'bg-amber-50 border-amber-200 text-amber-900',
            buttonColor: 'bg-amber-600 hover:bg-amber-700'
        },
        {
            id: 'quick',
            title: 'Quick Score Entry',
            description: 'Simple final score entry for completed games',
            features: [
                'Fast score input',
                'Winner determination',
                'Basic game statistics',
                'Instant standings update'
            ],
            color: 'bg-blue-50 border-blue-200 text-blue-900',
            buttonColor: 'bg-blue-600 hover:bg-blue-700'
        }
    ];

    const handleModeSelect = (mode) => {
        if (mode === 'live') {
            onLiveStats(event);
        } else if (mode === 'stats_only') {
            if (onStatsOnly) {
                onStatsOnly(event);
            } else {
                onLiveStats(event, { statsOnly: true });
            }
        } else if (mode === 'quick') {
            onQuickScore(event);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Scoring Method</h2>
                    <p className="text-gray-600">{event.title}</p>
                    <div className="text-sm text-gray-500 mt-1">
                        📅 {event.date} • 🕒 {event.time} • 📍 {event.location}
                    </div>
                </div>

                {/* Scoring Mode Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {scoringModes.map(mode => (
                        <div
                            key={mode.id}
                            className={`rounded-lg border-2 p-6 cursor-pointer transition-all ${
                                selectedMode === mode.id
                                    ? mode.color + ' ring-2 ring-offset-2 ring-current'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedMode(mode.id)}
                        >
                            <h3 className="text-xl font-semibold mb-3">{mode.title}</h3>
                            <p className="text-gray-600 mb-4">{mode.description}</p>
                            
                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-800">Features:</h4>
                                <ul className="space-y-1">
                                    {mode.features.map((feature, index) => (
                                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {selectedMode === mode.id && (
                                <button
                                    onClick={() => handleModeSelect(mode.id)}
                                    className={`w-full mt-4 px-4 py-2 text-white rounded-lg font-medium ${mode.buttonColor}`}
                                >
                                    Start {mode.id === 'live' ? 'Live Stats' : 'Quick Entry'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Game Info */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Game Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <span className="text-sm font-medium text-gray-600">Type:</span>
                            <p className="capitalize">{event.type?.replace('_', ' ')}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600">Status:</span>
                            <p className="capitalize">{event.status?.replace('_', ' ')}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600">Teams:</span>
                            <p>{event.teams?.length || 0} teams</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        ← Back to Events
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScoringSelector;