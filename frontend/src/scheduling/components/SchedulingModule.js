import React from 'react';
import EventTester from './EventTester';

/**
 * New Scheduling Module - Clean Architecture Entry Point
 * This will eventually replace the complex event management in App.js
 */
const SchedulingModule = ({ teams = [], leagueSchedule = [], setLeagueSchedule, currentUser }) => {
    
    return (
        <div className="scheduling-module">
            <div className="p-6 bg-white rounded-lg shadow mb-6">
                <h2 className="text-2xl font-bold mb-4">🚀 New Scheduling Module</h2>
                <div className="text-gray-600 mb-4">
                    Clean architecture - testing the solution to team selection persistence!
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded p-4">
                        <h3 className="font-semibold text-green-800">✅ Data Available:</h3>
                        <ul className="text-green-700 mt-2 text-sm">
                            <li>• Teams: {teams.length}</li>
                            <li>• Events: {leagueSchedule.length}</li>
                            <li>• User: {currentUser?.name || 'Not logged in'}</li>
                        </ul>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                        <h3 className="font-semibold text-blue-800">🏗️ Components Built:</h3>
                        <ul className="text-blue-700 mt-2 text-sm">
                            <li>• ✅ EventForm (clean)</li>
                            <li>• ✅ TeamSelector (dedicated)</li>
                            <li>• ✅ Event Hooks (single responsibility)</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded p-4">
                        <h3 className="font-semibold text-purple-800">🎯 Architecture:</h3>
                        <ul className="text-purple-700 mt-2 text-sm">
                            <li>• No dual-state confusion</li>
                            <li>• Single source of truth</li>
                            <li>• Clear data ownership</li>
                            <li>• Easy debugging</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Event Tester Component */}
            <EventTester 
                teams={teams}
                leagueSchedule={leagueSchedule}
                setLeagueSchedule={setLeagueSchedule}  
                currentUser={currentUser}
            />
        </div>
    );
};

export default SchedulingModule;