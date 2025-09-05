import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { HomePage, AdminPage, EventsPage } from './pages';
import AuthModal, { initialMockUsers } from './components/AuthSystem';
import { isAdmin, canEditEvent, canEditTeam } from './components/PermissionsSystem';
import "./App.css";

function App() {
  // Basic state management
  const [currentPage, setCurrentPage] = useState('home'); // Back to home as default
  const [currentUser, setCurrentUser] = useState(null);
  
  // Authentication state
  const [showLogin, setShowLogin] = useState(false);
  const [users, setUsers] = useState(initialMockUsers);
  
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);

  // Simple navigation handler
  const handleNavigate = (page) => {
    console.log('🧭 Navigation requested to:', page);
    setCurrentPage(page);
    console.log('🧭 Current page set to:', page);
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

  // Load basic data on mount
  useEffect(() => {
    // Mock data for now - will connect to API later
    setTeams([
      { 
        id: '1', 
        name: 'OH10 Lacrosse', 
        division: 'Field', 
        wins: 8, 
        losses: 2, 
        ties: 0,
        coach: 'Coach Smith',
        homeField: 'Smith Field',
        contactEmail: 'coach@oh10lacrosse.com',
        active: true
      },
      { 
        id: '2', 
        name: 'American Dads', 
        division: 'Field', 
        wins: 6, 
        losses: 4, 
        ties: 1,
        coach: 'Coach Johnson',
        homeField: 'Johnson Park',
        contactEmail: 'coach@americandads.com',
        active: true
      },
      { 
        id: '3', 
        name: 'Cincinnati Trash Pandas', 
        division: 'Box', 
        wins: 7, 
        losses: 3, 
        ties: 0,
        coach: 'Coach Williams',
        homeField: 'Cincinnati Arena',
        contactEmail: 'coach@trashpandas.com',
        active: true
      },
      { 
        id: '4', 
        name: 'Columbus Ball Hawgs', 
        division: 'Field', 
        wins: 5, 
        losses: 5, 
        ties: 0,
        coach: 'Coach Davis',
        homeField: 'Columbus Stadium',
        contactEmail: 'coach@ballhawgs.com',
        active: true
      },
    ]);

    // Mock players
    setPlayers([
      {
        id: '1',
        name: 'Johnny Lacrosse Jr.',
        teamId: '1',
        position: 'Midfield',
        jerseyNumber: 12,
        email: 'johnny@example.com',
        phone: '555-0101',
        active: true
      },
      {
        id: '2',
        name: 'Mike Smith',
        teamId: '1',
        position: 'Attack',
        jerseyNumber: 7,
        email: 'mike@example.com',
        phone: '555-0102',
        active: true
      },
      {
        id: '3',
        name: 'Sarah Johnson',
        teamId: '2',
        position: 'Defense',
        jerseyNumber: 15,
        email: 'sarah@example.com',
        phone: '555-0103',
        active: true
      },
    ]);

    // Mock events  
    setEvents([
      {
        id: 'event_1',
        title: 'OH10 vs American Dads',
        type: 'game',
        date: '2025-01-15',
        time: '19:00',
        location: 'Smith Field',
        homeTeam: '1',
        awayTeam: '2',
        status: 'scheduled',
        description: 'Regular season matchup between division leaders'
      },
      {
        id: 'event_2',
        title: 'Spring Championship Tournament',
        type: 'tournament',
        date: '2025-01-22',
        time: '09:00',
        location: 'Columbus Stadium',
        teamIds: ['1', '2', '3', '4'],
        status: 'scheduled',
        description: 'Annual spring tournament featuring all league teams'
      },
      {
        id: 'event_3',
        title: 'Team Practice Session',
        type: 'practice',
        date: '2025-01-10',
        time: '18:00',
        location: 'Johnson Park',
        teamId: '2',
        status: 'scheduled',
        description: 'Weekly practice session focusing on offensive plays'
      },
    ]);

    // Mock user - will add proper auth later
    setCurrentUser({ name: 'Admin User', role: 'admin' });
  }, []);

  // Simple page renderer
  const renderPage = () => {
    console.log('🔄 Rendering page:', currentPage);
    switch (currentPage) {
      case 'home':
        return <HomePage teams={teams} currentUser={currentUser} />;
      case 'admin':
        return (
          <AdminPage 
            teams={teams} 
            setTeams={setTeams}
            players={players}
            setPlayers={setPlayers}
            currentUser={currentUser} 
          />
        );
      case 'events':
        console.log('🎯 Rendering EventsPage with', events.length, 'events');
        return (
          <EventsPage
            teams={teams}
            currentUser={currentUser}
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
      default:
        console.log('🔄 Rendering default (HomePage)');
        return <HomePage teams={teams} currentUser={currentUser} />;
    }
  };

  return (
    <Layout 
      currentPage={currentPage}
      onNavigate={handleNavigate}
      currentUser={currentUser}
      teams={teams}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
