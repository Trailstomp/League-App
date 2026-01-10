import React, { useState } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import { fixGoogleDriveUrl } from '../utils/imageUtils';
import CachedImage from '../components/CachedImage';
// Import all team tab components
import {
    TeamFinanceTab,
    TeamSettingsTab,
    TeamRosterTab,
    MyDashboardTab,
    TeamRecruitingTab,
    TeamHomeTab,
    TeamScheduleTab,
    TeamStatsTab,
    TeamMediaTab,
    TeamContactTab,
    TeamChatTab,
    TeamRosterManageTab,
    TeamFeesTab
} from '../components/team';

const TeamDetailPage = ({ team, teams, events, players, currentUser, onNavigate, onUserUpdate }) => {
    const [activeTab, setActiveTab] = useState(() => {
        // Check if user has a default tab for this team
        if (currentUser?.defaultLandingPage?.type === 'team' && 
            currentUser?.defaultLandingPage?.teamId === team?.id &&
            currentUser?.defaultLandingPage?.tabId) {
            return currentUser.defaultLandingPage.tabId;
        }
        return 'home';
    });
    const [settingDefault, setSettingDefault] = useState(false);
    const [defaultPageMessage, setDefaultPageMessage] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Set this tab as the default landing page
    const handleSetDefaultPage = async (tabId) => {
        if (!currentUser) {
            alert('Please log in to set your default landing page');
            return;
        }

        setSettingDefault(true);
        try {
            const landingPage = {
                type: 'team',
                teamId: team.id,
                teamName: team.name,
                tabId: tabId
            };

            const response = await fetch(`${backendUrl}/api/users/${currentUser.id}/default-landing-page`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(landingPage)
            });

            if (response.ok) {
                const data = await response.json();
                setDefaultPageMessage('⭐ Set as your default landing page!');
                // Update the current user in parent component
                if (onUserUpdate && data.user) {
                    onUserUpdate(data.user);
                }
            } else {
                setDefaultPageMessage('❌ Failed to set default page');
            }
        } catch (error) {
            console.error('Error setting default page:', error);
            setDefaultPageMessage('❌ Error saving preference');
        } finally {
            setSettingDefault(false);
            setTimeout(() => setDefaultPageMessage(''), 3000);
        }
    };

    if (!team) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <LacrosseIcon name="teams" style={{fontSize: '48px'}} />
                    <h2 className="text-xl font-semibold text-slate-800 mt-4">Team not found</h2>
                    <p className="text-slate-600 mt-2">The team you're looking for doesn't exist.</p>
                    <button 
                        onClick={() => onNavigate('home')}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Check if current user is a coach or admin for this team
    const isTeamCoachOrAdmin = currentUser && (
        currentUser.roles?.includes('admin') ||
        (currentUser.roles?.includes('coach') && (
            currentUser.teamId === team.id ||
            currentUser.teamAssignments?.some(a => a.teamId === team.id)
        ))
    );

    // Check if user is a player or coach for this team
    const isPlayerOrCoach = currentUser && (
        (currentUser.roles?.includes('player') || currentUser.roles?.includes('coach') || 
         currentUser.role === 'player' || currentUser.role === 'coach') &&
        (currentUser.teamAssignments?.some(ta => ta.teamId === team?.id) || currentUser.teamId === team?.id)
    );

    const tabs = [
        { id: 'home', label: 'Home', icon: 'venue' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'roster', label: 'Roster', icon: 'teams' },
        { id: 'stats', label: 'Stats', icon: 'trophy' },
        { id: 'chat', label: 'Team Chat', icon: 'email' },
        { id: 'media', label: 'Photos & Vids', icon: 'view' },
        { id: 'contact', label: 'Contact', icon: 'email' },
        // Player/Coach personal dashboard tab
        ...(isPlayerOrCoach ? [
            { id: 'my-dashboard', label: 'My Dashboard', icon: 'admin', playerOnly: true }
        ] : []),
        // Coach/Admin only tabs
        ...(isTeamCoachOrAdmin ? [
            { id: 'manage-roster', label: 'Manage Roster', icon: 'admin', coachOnly: true },
            { id: 'recruiting', label: 'Recruiting', icon: 'add', coachOnly: true },
            { id: 'team-fees', label: 'Fees', icon: '💰', coachOnly: true },
            { id: 'finance', label: 'Finance', icon: '📊', coachOnly: true },
        ] : []),
        { id: 'settings', label: 'Settings', icon: 'settings', adminOnly: true }
    ];

    const teamStyle = team.style || {};

    return (
        <div 
            className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 min-h-screen"
            style={{
                background: teamStyle.pageBackgroundType === 'image' && teamStyle.pageBackgroundImage
                    ? `url(${teamStyle.pageBackgroundImage})`
                    : `linear-gradient(135deg, ${teamStyle.pageBackgroundColor || teamStyle.backgroundColor || '#f8fafc'} 0%, rgba(255,255,255,0.8) 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* Team Header */}
            <div 
                className="relative bg-gradient-to-r from-slate-800 to-slate-600 text-white rounded-lg overflow-hidden mb-4 sm:mb-6"
                style={{
                    backgroundColor: teamStyle.primaryColor || '#64748b',
                    backgroundImage: teamStyle.bannerUrl ? `url(${teamStyle.bannerUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {teamStyle.bannerUrl && <div className="absolute inset-0 bg-black bg-opacity-40"></div>}
                <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        {/* Team Logo */}
                        <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-xl overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-white">
                            {teamStyle.logoUrl ? (
                                <CachedImage 
                                    src={fixGoogleDriveUrl(teamStyle.logoUrl)} 
                                    alt={`${team.name} logo`}
                                    className="w-full h-full object-contain p-2"
                                    style={{ opacity: teamStyle.logoOpacity || 1 }}
                                    fallback={
                                        <div 
                                            className="w-full h-full flex items-center justify-center rounded-xl"
                                            style={{ backgroundColor: teamStyle.primaryColor || '#dc2626' }}
                                        >
                                            <LacrosseIcon name="stick" style={{fontSize: '64px', color: 'white'}} />
                                        </div>
                                    }
                                />
                            ) : (
                                <div 
                                    className="w-full h-full flex items-center justify-center rounded-xl"
                                    style={{ backgroundColor: teamStyle.primaryColor || '#dc2626' }}
                                >
                                    <LacrosseIcon name="stick" style={{fontSize: '64px', color: 'white'}} />
                                </div>
                            )}
                        </div>
                        
                        {/* Team Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 break-words">{team.name}</h1>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                                <div>
                                    <span className="text-blue-200">Division:</span>
                                    <div className="font-semibold truncate">{team.division || 'Field'}</div>
                                </div>
                                <div>
                                    <span className="text-blue-200">Record:</span>
                                    <div className="font-semibold">{team.wins || 0}-{team.losses || 0}-{team.ties || 0}</div>
                                </div>
                                <div>
                                    <span className="text-blue-200">Coach:</span>
                                    <div className="font-semibold truncate">{team.coach || 'TBD'}</div>
                                </div>
                                <div>
                                    <span className="text-blue-200">Home Field:</span>
                                    <div className="font-semibold truncate">{team.homeField || 'TBD'}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Back Button */}
                        <button 
                            onClick={() => onNavigate('home')}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors text-sm flex-shrink-0"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-4 sm:mb-6">
                {/* Default page message */}
                {defaultPageMessage && (
                    <div className="bg-yellow-50 text-yellow-800 text-sm px-4 py-2 text-center">
                        {defaultPageMessage}
                    </div>
                )}
                <div className="flex overflow-x-auto">
                    {tabs.map(tab => {
                        const isThisTabDefault = currentUser?.defaultLandingPage?.type === 'team' && 
                                                  currentUser?.defaultLandingPage?.teamId === team?.id &&
                                                  currentUser?.defaultLandingPage?.tabId === tab.id;
                        return (
                            <div key={tab.id} className="relative group">
                                <button
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <LacrosseIcon name={tab.icon} className="mr-1 sm:mr-2" style={{fontSize: '14px'}} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                                    {isThisTabDefault && (
                                        <span className="ml-1 text-yellow-500" title="Your default landing page">⭐</span>
                                    )}
                                </button>
                                {/* Star button - visible on hover or when active */}
                                {currentUser && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetDefaultPage(tab.id);
                                        }}
                                        disabled={settingDefault}
                                        className={`absolute top-1 right-1 p-1 rounded-full transition-all ${
                                            isThisTabDefault 
                                                ? 'text-yellow-500 bg-yellow-50' 
                                                : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50 opacity-0 group-hover:opacity-100'
                                        }`}
                                        title={isThisTabDefault ? 'This is your default page' : 'Set as default landing page'}
                                    >
                                        {settingDefault ? (
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill={isThisTabDefault ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-6 overflow-x-hidden">
                {activeTab === 'home' && <TeamHomeTab team={team} teams={teams} events={events} onNavigate={onNavigate} />}
                {activeTab === 'schedule' && <TeamScheduleTab team={team} events={events} />}
                {activeTab === 'roster' && <TeamRosterTab team={team} players={players} currentUser={currentUser} />}
                {activeTab === 'stats' && <TeamStatsTab team={team} events={events} />}
                {activeTab === 'chat' && <TeamChatTab team={team} />}
                {activeTab === 'media' && <TeamMediaTab team={team} />}
                {activeTab === 'contact' && <TeamContactTab team={team} />}
                {activeTab === 'my-dashboard' && <MyDashboardTab team={team} currentUser={currentUser} />}
                {activeTab === 'manage-roster' && <TeamRosterManageTab team={team} currentUser={currentUser} />}
                {activeTab === 'recruiting' && <TeamRecruitingTab team={team} currentUser={currentUser} />}
                {activeTab === 'team-fees' && <TeamFeesTab team={team} currentUser={currentUser} />}
                {activeTab === 'finance' && <TeamFinanceTab team={team} currentUser={currentUser} />}
                {activeTab === 'settings' && <TeamSettingsTab team={team} />}
            </div>
        </div>
    );
};

export default TeamDetailPage;
