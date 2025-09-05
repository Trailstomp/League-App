import React, { useState } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import GameTicker from '../components/GameTicker';
import EventDetailModal from '../scheduling/components/EventDetailModal';

const HomePage = ({ teams = [], currentUser, events = [], setEvents }) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const stats = {
        totalTeams: teams.length,
        activeEvents: 0, // Will be connected later
        totalPlayers: 0, // Will be connected later
    };

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            Welcome to the Lacrosse League
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Manage your league with style and efficiency
                        </p>
                    </div>
                    <div className="text-6xl">🥍</div>
                </div>
            </div>

            {/* Game Ticker */}
            <GameTicker 
                teams={teams}
                leagueSchedule={events}
                onTeamClick={(teamId) => {
                    console.log('🏆 Team clicked:', teamId);
                    // Future: Navigate to team page
                }}
                onEventClick={(event) => {
                    console.log('📅 Event clicked:', event);
                    // Future: Open event detail modal
                }}
                websiteStyle={{
                    tickerColor: '#1e293b',
                    tickerItemColor: '#334155',
                    tickerBorderColor: '#475569',
                    tickerTextColor: '#94a3b8',
                    tickerFilters: {
                        games: true,
                        tournaments: true,
                        practices: true,
                        meetings: true,
                        social: true,
                        other: true
                    },
                    tickerLookBack: 7,
                    tickerLookForward: 120
                }}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <LacrosseIcon name="teams" style={{fontSize: '32px'}} className="text-blue-500 mr-4" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stats.totalTeams}</div>
                            <div className="text-sm text-slate-600">Total Teams</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <LacrosseIcon name="calendar" style={{fontSize: '32px'}} className="text-green-500 mr-4" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stats.activeEvents}</div>
                            <div className="text-sm text-slate-600">Active Events</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <LacrosseIcon name="players" style={{fontSize: '32px'}} className="text-purple-500 mr-4" />
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stats.totalPlayers}</div>
                            <div className="text-sm text-slate-600">Total Players</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Teams */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">League Teams</h2>
                {teams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teams.slice(0, 6).map(team => (
                            <div key={team.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                <div className="flex items-center mb-2">
                                    <div className="w-8 h-8 bg-slate-200 rounded mr-3 flex-shrink-0 flex items-center justify-center">
                                        🏆
                                    </div>
                                    <h3 className="font-medium text-slate-800 truncate">{team.name}</h3>
                                </div>
                                <div className="text-sm text-slate-600">
                                    Division: {team.division || 'Field'}
                                </div>
                                <div className="text-sm text-slate-600">
                                    Record: {team.wins || 0}-{team.losses || 0}-{team.ties || 0}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <LacrosseIcon name="teams" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                        <p>No teams available. Add teams through the Admin Portal.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;