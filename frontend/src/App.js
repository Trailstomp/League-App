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

  // Simple navigation handler
  const handleNavigate = (page) => {
    console.log('🧭 Navigation requested to:', page);
    setCurrentPage(page);
    console.log('🧭 Current page set to:', page);
  };

  // Team navigation handler
  const handleTeamNavigate = (teamId) => {
    console.log('🏆 Team navigation to:', teamId);
    const team = teams.find(t => t.id === teamId);
    if (team) {
      console.log('🏆 Found team:', team.name);
      // Navigate to team detail page
      setCurrentPage('team');
      setSelectedTeam(team);
    }
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

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading league data from API...');
        
        // Load complete league data including websiteStyle
        const leagueResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/league-data`);
        if (leagueResponse.ok) {
          const leagueData = await leagueResponse.json();
          console.log('📊 Loaded complete league data:', leagueData);
          
          // Set all data from league-data endpoint
          if (leagueData.teams && leagueData.teams.length > 0) {
            setTeams(leagueData.teams);
            console.log('✅ Loaded teams:', leagueData.teams.length, 'teams');
          }
          
          if (leagueData.players && leagueData.players.length > 0) {
            setPlayers(leagueData.players);
            console.log('✅ Loaded players:', leagueData.players.length, 'players');
          }
          
          if (leagueData.leagueSchedule && leagueData.leagueSchedule.length > 0) {
            setEvents(leagueData.leagueSchedule);
            console.log('✅ Loaded events:', leagueData.leagueSchedule.length, 'events');
          }
          
          // Load websiteStyle - this is the critical fix!
          if (leagueData.websiteStyle) {
            console.log('🎨 Loading saved websiteStyle:', leagueData.websiteStyle);
            setWebsiteStyle(prev => ({
              ...prev,
              ...leagueData.websiteStyle
            }));
            console.log('✅ WebsiteStyle loaded and applied');
          } else {
            console.log('📝 No saved websiteStyle found, using defaults');
          }
          
        } else {
          console.warn('⚠️ Failed to load league data, falling back to individual endpoints');
          
          // Fallback: Load from individual endpoints if league-data fails
          const teamsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teams`);
          if (teamsResponse.ok) {
            const teamsData = await teamsResponse.json();
            console.log('📊 Fallback: Loaded teams from API:', teamsData.length, 'teams');
            setTeams(teamsData);
          }

          const playersResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/players`);
          if (playersResponse.ok) {
            const playersData = await playersResponse.json();
            console.log('📊 Fallback: Loaded players from API:', playersData.length, 'players');
            setPlayers(playersData);
          }

          const eventsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events`);
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            console.log('📊 Fallback: Loaded events from API:', eventsData.length, 'events');
            setEvents(eventsData);
          }
        }

      } catch (error) {
        console.error('❌ Error loading data from API:', error);
        console.log('📝 Using default values due to API error');
      }
    };

    loadData();
  }, []);

  // Simple page renderer
  const renderPage = () => {
    console.log('🔄 Rendering page:', currentPage);
    switch (currentPage) {
      case 'home':
        return <HomePage teams={teams} currentUser={currentUser} events={events} setEvents={setEvents} />;
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
            setWebsiteStyle={setWebsiteStyle}
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
