import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { HomePage, AdminPage, EventsPage } from './pages';
import TeamDetailPage from './pages/TeamDetailPage';
import TeamAdminPage from './pages/TeamAdminPage';
import TournamentPage from './pages/TournamentPage';
import UnifiedEventsPage from './pages/UnifiedEventsPage';
import RegistrationPage from './pages/RegistrationPage';
import RSVPHandler from './pages/RSVPHandler';
import AuthModal, { initialMockUsers } from './components/AuthSystem';
import OAuthCallback from './components/OAuthCallback';
import { isAdmin, canEditEvent, canEditTeam } from './components/PermissionsSystem';
import "./App.css";

import GroupMeChatUnified from './components/GroupMeChatUnified';
import QuickRSVPForm from './components/QuickRSVPForm';
import StandingsTable from './components/StandingsTable';
import LiveGamePage from './pages/LiveGamePage';
import GameStatsEntry from './components/GameStatsEntry';
import { PlayerFeeDashboard, PaymentSuccess } from './components/fees';

function App() {
  // Basic state management
  const [currentPage, setCurrentPage] = useState('home'); // Back to home as default
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Authentication state
  const [showLogin, setShowLogin] = useState(false);
  const [users, setUsers] = useState(initialMockUsers);
  
  // Stats entry state
  const [showStatsEntry, setShowStatsEntry] = useState(false);
  const [selectedEventForStats, setSelectedEventForStats] = useState(null);
  
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [websiteStyle, setWebsiteStyle] = useState({
    theme: 'professional',
    primaryColor: '#1e40af',
    accentColor: '#3b82f6',
    backgroundColor: '#f8fafc',
    leagueName: 'Midwest Lacrosse League',
    tagline: 'Professional Competition',
    logoUrl: '',
    bannerUrl: '',
    headerStyle: 'gradient',
    sidebarPosition: 'left',
    contentLayout: 'wide'
  });

  // Enhanced websiteStyle handler with API persistence
  const handleWebsiteStyleChange = async (newStyle) => {
    try {
      console.log('🎨 Saving websiteStyle changes:', newStyle);
      
      // Update local state immediately
      setWebsiteStyle(newStyle);
      
      // Save to API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/league-data/websiteStyle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStyle)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ WebsiteStyle saved to API successfully:', result);
        return { success: true, message: 'Saved successfully!' };
      } else {
        console.error('❌ Failed to save websiteStyle to API:', response.statusText);
        return { success: false, message: 'Failed to save to server' };
      }
    } catch (error) {
      console.error('❌ Error saving websiteStyle:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  // Enhanced navigation handler - supports team navigation
  const handleNavigate = (page, teamId = null) => {
    console.log('🧭 Navigation requested to:', page, teamId ? `with teamId: ${teamId}` : '');
    
    if (page === 'team' && teamId) {
      // Use team navigation handler for team pages
      handleTeamNavigate(teamId);
    } else {
      // Regular page navigation
      setCurrentPage(page);
      console.log('🧭 Current page set to:', page);
    }
  };

  // Team navigation handler with debugging
  const handleTeamNavigate = (teamId) => {
    console.log('🏆 Team navigation to:', teamId);
    console.log('🏆 Available teams:', teams.map(t => ({ id: t.id, name: t.name })));
    
    const team = teams.find(t => t.id === teamId);
    if (team) {
      console.log('🏆 Found team:', team.name);
      // Navigate to team detail page
      setCurrentPage('team');
      setSelectedTeam(team);
    } else {
      console.error('❌ Team not found with ID:', teamId);
      console.error('❌ Available team IDs:', teams.map(t => t.id));
      alert(`Team not found. ID: ${teamId}\nAvailable: ${teams.map(t => t.id).join(', ')}`);
    }
  };

  // Handle event click from ticker (navigate to events page and highlight event)
  const handleEventClick = (event) => {
    console.log('📅 Event clicked from ticker:', event);
    // Navigate to events page - the events page can handle highlighting the specific event
    setCurrentPage('events');
  };

  // Handle team click from ticker (navigate to team page)
  const handleTeamClick = (teamId) => {
    console.log('🏆 Team clicked from ticker:', teamId);
    handleTeamNavigate(teamId);
  };

  // Authentication handlers
  const handleLogin = (user) => {
    console.log('🔐 User logged in:', user);
    setCurrentUser(user);
    setShowLogin(false);
  };

  const handleLogout = () => {
    console.log('🔐 User logged out');
    setCurrentUser(null);
    setCurrentPage('home'); // Redirect to home after logout
  };

  const handleRegister = (newUser) => {
    console.log('📝 New user registered:', newUser);
    setUsers(prevUsers => [...prevUsers, newUser]);
    // Don't auto-login - user needs admin approval first
  };

  const handleShowLogin = () => {
    setShowLogin(true);
  };

  // Load data from API on mount - DEFENSIVE LOADING TO PREVENT OVERWRITES
  // Check URL on app load and sync with currentPage state
  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    console.log('🌐 Current URL path:', path, 'search:', search);
    
    // Check for RSVP parameters first - this takes priority
    if (search.includes('response=') && path.includes('/events/')) {
      console.log('📬 RSVP URL detected, will handle in renderPage');
      return; // Let renderPage handle RSVP
    }
    
    // Check for quick RSVP form URLs
    if (path.startsWith('/quick-rsvp/')) {
      setCurrentPage('quick-rsvp');
      return;
    }
    
    // Check for RSVP page URLs - redirect to backend
    if (path.startsWith('/rsvp/')) {
      const eventId = path.split('/rsvp/')[1];
      window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/rsvp/${eventId}`;
      return;
    }
    
    // Map URL paths to page names
    const urlToPage = {
      '/': 'home',
      '/home': 'home', 
      '/admin': 'admin',
      '/events': 'events',
      '/standings': 'standings',
      '/chat': 'chat',
      '/league_contact': 'league_contact',
      '/my-fees': 'my-fees',
      '/fees': 'my-fees'
    };
    
    const pageFromUrl = urlToPage[path] || 'home';
    
    if (pageFromUrl !== currentPage) {
      console.log('🔄 Syncing currentPage with URL:', pageFromUrl);
      setCurrentPage(pageFromUrl);
    }
  }, []); // Run once on mount

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Starting optimized dashboard data load...');
        const startTime = Date.now();
        
        // Use new optimized dashboard endpoint for faster loading
        const dashboardResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/dashboard-data`);
        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          const loadTime = Date.now() - startTime;
          console.log(`⚡ Dashboard data loaded in ${loadTime}ms`);
          console.log('📊 Dashboard data received:', {
            teams: dashboardData.teams?.length || 0,
            players: dashboardData.players?.length || 0,
            events: dashboardData.leagueSchedule?.length || 0,
            galleries: dashboardData.galleries?.length || 0,
            youtubeEnabled: dashboardData.youtubeConfig?.enabled || false
          });
          
          // Store galleries and YouTube config for child components BEFORE setting state
          // This ensures child components can access cached data immediately
          const cacheData = {
            galleries: dashboardData.galleries || [],
            youtubeConfig: dashboardData.youtubeConfig || { enabled: false }
          };
          window.dashboardData = cacheData;
          console.log('✅ Dashboard data cached for child components');
          
          // UNIFIED DATA SOURCE: Load teams from dashboard data
          if (dashboardData.teams && Array.isArray(dashboardData.teams)) {
            console.log('🏆 Setting teams from dashboard-data:', dashboardData.teams.map(t => t.name || 'Unnamed'));
            setTeams(dashboardData.teams);
          } else {
            console.log('📝 No teams in dashboard-data, starting with empty array');
            setTeams([]);
          }
          
          // UNIFIED DATA SOURCE: Load players from dashboard data
          if (dashboardData.players && Array.isArray(dashboardData.players)) {
            setPlayers(dashboardData.players);
            console.log('✅ Loaded players from dashboard-data:', dashboardData.players.length, 'players');
          } else {
            console.log('📝 No players in dashboard-data, starting with empty array');
            setPlayers([]);
          }
          
          // Load events from dashboard data
          if (dashboardData.leagueSchedule && Array.isArray(dashboardData.leagueSchedule)) {
            setEvents(dashboardData.leagueSchedule);
            console.log('✅ Loaded events from dashboard-data:', dashboardData.leagueSchedule.length, 'events');
            if (dashboardData.leagueSchedule.length > 0) {
              console.log('📅 Event titles:', dashboardData.leagueSchedule.map(e => e.title || e.id));
            }
          } else {
            console.log('📝 No leagueSchedule found in dashboard response, setting empty events array');
            setEvents([]);
          }
          
          // Load websiteStyle from dashboard data
          if (dashboardData.websiteStyle && typeof dashboardData.websiteStyle === 'object') {
            console.log('🎨 Loading saved websiteStyle with keys:', Object.keys(dashboardData.websiteStyle));
            setWebsiteStyle(prev => ({
              ...prev,
              ...dashboardData.websiteStyle
            }));
            console.log('✅ WebsiteStyle loaded and applied');
          } else {
            console.log('📝 No saved websiteStyle found, keeping current defaults');
          }
          
        } else {
          console.error('❌ Failed to load dashboard data, status:', dashboardResponse.status);
          // Fallback to individual API calls
          console.log('⚠️ Falling back to individual API calls...');
          await loadDataFallback();
        }

      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        console.log('⚠️ Falling back to individual API calls...');
        await loadDataFallback();
      }
    };

    // Fallback to original loading method if dashboard endpoint fails
    const loadDataFallback = async () => {
      try {
        // Load complete league data
        const leagueResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/league-data`);
        if (leagueResponse.ok) {
          const leagueData = await leagueResponse.json();
          
          if (leagueData.teams && Array.isArray(leagueData.teams)) {
            setTeams(leagueData.teams);
          } else {
            setTeams([]);
          }
          
          if (leagueData.players && Array.isArray(leagueData.players)) {
            setPlayers(leagueData.players);
          } else {
            setPlayers([]);
          }
          
          if (leagueData.leagueSchedule && Array.isArray(leagueData.leagueSchedule)) {
            setEvents(leagueData.leagueSchedule);
          } else {
            setEvents([]);
          }
          
          if (leagueData.websiteStyle && typeof leagueData.websiteStyle === 'object') {
            setWebsiteStyle(prev => ({
              ...prev,
              ...leagueData.websiteStyle
            }));
          }
        } else {
          setTeams([]);
          setPlayers([]);
          setEvents([]);
        }
        
        // Clear cached data since fallback doesn't include galleries/youtube
        window.dashboardData = { galleries: [], youtubeConfig: { enabled: false } };
        
      } catch (error) {
        console.error('❌ Fallback loading also failed:', error);
        setTeams([]);
        setPlayers([]);
        setEvents([]);
        window.dashboardData = { galleries: [], youtubeConfig: { enabled: false } };
      }
    };

    loadData();
  }, []); // Empty dependency array to run only once on mount

  // Simple page renderer
  const renderPage = () => {
    console.log('🔄 Rendering page:', currentPage);
    
    // Check if URL has RSVP parameters (both hash and query string formats)
    const hasRSVPParams = window.location.search.includes('response=') || 
                          window.location.hash.includes('response=');
    const hasEventsPath = window.location.pathname.includes('/events/') || 
                          window.location.hash.includes('/events/');
    
    if (hasRSVPParams && hasEventsPath) {
      console.log('📬 RSVP detected, rendering RSVPHandler');
      return <RSVPHandler />;
    }
    
    switch (currentPage) {
      case 'register':
        return <RegistrationPage />;
      case 'home':
        return <HomePage teams={teams} currentUser={currentUser} events={events} setEvents={setEvents} websiteStyle={websiteStyle} onNavigate={handleNavigate} />;
      case 'admin':
        console.log('🔍 Admin case reached - checking permissions...');
        // Debug the admin check
        console.log('🔍 Admin access check:', { 
          currentUser: currentUser, 
          hasCurrentUser: !!currentUser,
          isAdminResult: currentUser ? isAdmin(currentUser) : 'no user',
          userRoles: currentUser?.roles,
          userRole: currentUser?.role,
          userRoleIds: currentUser?.roleIds
        });
        
        // Check if user has admin permissions
        if (!currentUser || !isAdmin(currentUser)) {
          return (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Access Denied</h2>
              <p className="text-slate-600 mb-4">You must be logged in as an administrator to view this page.</p>
              <p className="text-sm text-gray-500 mb-4">
                Debug: User={currentUser?.name}, Roles={JSON.stringify(currentUser?.roles)}, 
                Role={currentUser?.role}, isAdmin={currentUser ? isAdmin(currentUser) : 'no user'}
              </p>
              <button 
                onClick={handleShowLogin}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            </div>
          );
        }
        return (
          <AdminPage 
            teams={teams} 
            setTeams={setTeams}
            players={players}
            setPlayers={setPlayers}
            currentUser={currentUser}
            users={users}
            setUsers={setUsers}
            websiteStyle={websiteStyle}
            setWebsiteStyle={handleWebsiteStyleChange}
            events={events}
            setEvents={setEvents}
          />
        );
      case 'events':
        console.log('🎯 Rendering Unified Events System');
        return (
          <UnifiedEventsPage
            teams={teams}
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );
      case 'standings':
        return (
          <div className="p-6">
            <StandingsTable 
              teams={teams}
              onTeamClick={(teamId) => handleNavigateToTeam(teamId)}
            />
          </div>
        );
      case 'live-game':
        return (
          <LiveGamePage 
            eventId={selectedTeam} // Reusing selectedTeam state to pass eventId
            onNavigate={(page) => setCurrentPage(page)}
          />
        );
      case 'chat':
        return (
          <div className="flex flex-col chat-container">
            <GroupMeChatUnified channelType="all" currentUser={currentUser} />
          </div>
        );
      case 'quick-rsvp':
        return <QuickRSVPForm />;
      case 'my-fees':
        return <PlayerFeeDashboard currentUser={currentUser} />;
      case 'team':
        return (
          <TeamDetailPage 
            team={selectedTeam} 
            teams={teams}
            events={events}
            players={players}
            onNavigate={handleNavigate}
          />
        );
      case 'team-admin':
        // Check if user has team admin or coach role
        if (!currentUser || (!currentUser.team_id && !isAdmin(currentUser))) {
          return (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Access Denied</h2>
              <p className="text-slate-600 mb-4">You must be a team coach to view this page.</p>
              <button 
                onClick={handleShowLogin}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            </div>
          );
        }
        return (
          <TeamAdminPage 
            currentUser={currentUser}
            teamId={selectedTeam?.id || currentUser.team_id}
          />
        );
      default:
        console.log('🔄 Rendering default (HomePage)');
        return <HomePage teams={teams} currentUser={currentUser} />;
    }
  };

  // Check if this is an OAuth callback (has 'code' parameter in URL)
  const urlParams = new URLSearchParams(window.location.search);
  const isOAuthCallback = urlParams.has('code') || urlParams.has('error');

  if (isOAuthCallback) {
    return (
      <div className="App">
        <OAuthCallback />
      </div>
    );
  }

  return (
    <>
      <Layout 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onTeamNavigate={handleTeamNavigate}
        currentUser={currentUser}
        onLogin={handleShowLogin}
        onLogout={handleLogout}
        teams={teams}
        websiteStyle={websiteStyle}
        events={events}
        onEventClick={handleEventClick}
        onTeamClick={handleTeamClick}
      >
        {renderPage()}
      </Layout>
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        users={users}
        teams={teams}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
      
      {/* Game Stats Entry Modal */}
      {showStatsEntry && selectedEventForStats && (
        <GameStatsEntry
          event={selectedEventForStats}
          teams={teams}
          players={players}
          currentUser={currentUser}
          onClose={() => {
            setShowStatsEntry(false);
            setSelectedEventForStats(null);
          }}
        />
      )}
    </>
  );
}

export default App;
