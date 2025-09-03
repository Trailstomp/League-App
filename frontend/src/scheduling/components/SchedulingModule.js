import React, { useState } from 'react';
import SchedulingDashboard from './SchedulingDashboard';
import EventTester from './EventTester';

/**
 * New Scheduling Module - Clean Architecture Entry Point
 * This will eventually replace the complex event management in App.js
 */
const SchedulingModule = ({ teams = [], leagueSchedule = [], setLeagueSchedule, currentUser, leagueLocations = [] }) => {
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'tester'
    
    return (
        <div className="scheduling-module">
            {/* Mode Toggle */}
            <div className="mb-6 flex justify-center">
                <div className="inline-flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                    <button
                        onClick={() => setViewMode('dashboard')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'dashboard'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        📅 Scheduling Dashboard
                    </button>
                    <button
                        onClick={() => setViewMode('tester')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'tester'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        🧪 Event Tester
                    </button>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'dashboard' ? (
                <SchedulingDashboard
                    teams={teams}
                    leagueSchedule={leagueSchedule}
                    setLeagueSchedule={setLeagueSchedule}
                    currentUser={currentUser}
                />
            ) : (
                <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-800 mb-2">🧪 Testing Mode</h3>
                        <p className="text-yellow-700 text-sm">
                            This is the original tester used to debug team selection persistence. 
                            The main dashboard above now includes all this functionality in a polished interface.
                        </p>
                    </div>
                    
                    <EventTester 
                        teams={teams}
                        leagueSchedule={leagueSchedule}
                        setLeagueSchedule={setLeagueSchedule}  
                        currentUser={currentUser}
                    />
                </div>
            )}
        </div>
    );
};

export default SchedulingModule;