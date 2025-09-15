import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { HomePage, AdminPage, EventsPage } from './pages';
import TeamDetailPage from './pages/TeamDetailPage';
import AuthModal, { initialMockUsers } from './components/AuthSystem';
import { isAdmin, canEditEvent, canEditTeam } from './components/PermissionsSystem';
import "./App.css";

function App() {
  // Basic state management
  const [currentPage, setCurrentPage] = useState('home'); // Back to home as default
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Authentication state
  const [showLogin, setShowLogin] = useState(false);
  const [users, setUsers] = useState(initialMockUsers);
  
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
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Starting fresh data load from API...');
        
        // Load complete league data
        const leagueResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/league-data`);
        if (leagueResponse.ok) {
          const leagueData = await leagueResponse.json();
          console.log('📊 Raw league data received:', leagueData);
          console.log('🗂️ ALL FIELDS in league data:', Object.keys(leagueData));
          console.log('🏆 Teams in league data:', leagueData.teams?.length || 0);
          console.log('👥 Players in league data:', leagueData.players?.length || 0);
          console.log('📅 CRITICAL - leagueSchedule field details:', {
            exists: 'leagueSchedule' in leagueData,
            value: leagueData.leagueSchedule,
            type: typeof leagueData.leagueSchedule,
            isArray: Array.isArray(leagueData.leagueSchedule),
            length: leagueData.leagueSchedule?.length || 'N/A'
          });
          
          // UNIFIED DATA SOURCE: Load teams only from league-data
          if (leagueData.teams && Array.isArray(leagueData.teams)) {
            console.log('🏆 Teams in league data:', leagueData.teams.length);
            console.log('✅ Setting teams from league-data:', leagueData.teams.map(t => t.name || 'Unnamed'));
            setTeams(leagueData.teams);
          } else {
            console.log('📝 No teams in league-data, starting with empty array');
            setTeams([]);
          }
          
          // Load players safely - with fallback to individual endpoint
          if (leagueData.players && Array.isArray(leagueData.players) && leagueData.players.length > 0) {
            setPlayers(leagueData.players);
            console.log('✅ Loaded players from league-data:', leagueData.players.length, 'players');
          } else {
            console.log('📝 No players in league-data, loading from players endpoint');
            // Fallback: Load players from individual endpoint
            try {
              const playersResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/players`);
              if (playersResponse.ok) {
                const playersData = await playersResponse.json();
                if (playersData && playersData.length > 0) {
                  console.log('✅ Loaded players from players endpoint:', playersData.length, 'players');
                  setPlayers(playersData);
                } else {
                  console.log('📝 No players in individual endpoint either, starting empty');
                  setPlayers([]);
                }
              } else {
                console.log('📝 Players endpoint failed, starting empty');
                setPlayers([]);
              }
            } catch (error) {
              console.error('❌ Error loading players from individual endpoint:', error);
              setPlayers([]);
            }
          }
          
          // Load events safely with detailed logging
          console.log('📅 Event loading check:', {
            hasLeagueSchedule: !!leagueData.leagueSchedule,
            isArray: Array.isArray(leagueData.leagueSchedule),
            length: leagueData.leagueSchedule?.length || 0,
            leagueScheduleKeys: leagueData.leagueSchedule ? Object.keys(leagueData.leagueSchedule) : 'none'
          });
          
          if (leagueData.leagueSchedule && Array.isArray(leagueData.leagueSchedule)) {
            setEvents(leagueData.leagueSchedule);
            console.log('✅ Loaded events:', leagueData.leagueSchedule.length, 'events');
            if (leagueData.leagueSchedule.length > 0) {
              console.log('📅 Event titles:', leagueData.leagueSchedule.map(e => e.title || e.id));
            }
          } else {
            console.log('📝 No leagueSchedule found in API response, setting empty events array');
            setEvents([]);
          }
          
          // Load websiteStyle safely
          if (leagueData.websiteStyle && typeof leagueData.websiteStyle === 'object') {
            console.log('🎨 Loading saved websiteStyle with keys:', Object.keys(leagueData.websiteStyle));
            setWebsiteStyle(prev => ({
              ...prev,
              ...leagueData.websiteStyle
            }));
            console.log('✅ WebsiteStyle loaded and applied');
          } else {
            console.log('📝 No saved websiteStyle found, keeping current defaults');
          }
          
        } else {
          console.error('❌ Failed to load league data, status:', leagueResponse.status);
          // Do NOT fall back to anything - keep empty arrays to start fresh
          console.log('📝 Keeping empty arrays for fresh start');
          setTeams([]);
          setPlayers([]);
          setEvents([]);
        }

      } catch (error) {
        console.error('❌ Error loading data from API:', error);
        console.log('📝 Keeping empty arrays due to error - fresh start');
        // Keep empty arrays for fresh start
        setTeams([]);
        setPlayers([]);
        setEvents([]);
      }
    };

    loadData();
  }, []); // Empty dependency array to run only once on mount

  // Simple page renderer
  const renderPage = () => {
    console.log('🔄 Rendering page:', currentPage);
    switch (currentPage) {
      case 'home':
        return <HomePage teams={teams} currentUser={currentUser} events={events} setEvents={setEvents} websiteStyle={websiteStyle} onNavigate={handleNavigate} />;
      case 'admin':
        // Check if user has admin permissions
        if (!currentUser || !isAdmin(currentUser)) {
          return (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Access Denied</h2>
              <p className="text-slate-600 mb-4">You must be logged in as an administrator to view this page.</p>
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
        console.log('🎯 Rendering EventsPage with', events.length, 'events');
        return (
          <EventsPage
            teams={teams}
            currentUser={currentUser}
            websiteStyle={websiteStyle}
            setWebsiteStyle={setWebsiteStyle}
            events={events}
            setEvents={setEvents}
          />
        );
      case 'standings':
        return (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Team Standings</h2>
            <p className="text-slate-600">Coming soon...</p>
          </div>
        );
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
      default:
        console.log('🔄 Rendering default (HomePage)');
        return <HomePage teams={teams} currentUser={currentUser} />;
    }
  };

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
    </>
  );
}

export default App;
