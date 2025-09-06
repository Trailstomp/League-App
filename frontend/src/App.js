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
        active: true,
        style: {
          primaryColor: '#dc2626',
          backgroundColor: '#fef2f2',
          accentColor: '#7c2d12',
          logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNkYzI2MjYiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Im0xMiAyIDQuMjQgNi4yMUwyMyA5bC0xLjY4IDQuMjEgNC4yNCAyLjc5aC01LjI0TDEyIDIyIDMuNjggMTZIMi4zNmw0LjI0LTIuNzlMMCAxMmw0LjI0LTIuNzlMMi4zNiA1aDE1LjI4TDEyIDJ6Ii8+Cjwvc3ZnPgo8L3N2Zz4K',
          logoOpacity: 1
        }
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
        active: true,
        style: {
          primaryColor: '#2563eb',
          backgroundColor: '#eff6ff',
          accentColor: '#1d4ed8',
          logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiMyNTYzZWIiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0yMSA5SDNsMy4wNSA1LjE5IDEuNDctMS44OCAzLjA1IDUuMTlMMTIgMTNsMS40OCAzLjUgMy4wNS01LjE5IDEuNDcgMS44OEwyMSA5eiIvPgo8L3N2Zz4KPC9zdmc+Cg==',
          logoOpacity: 1
        }
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
        active: true,
        style: {
          primaryColor: '#059669',
          backgroundColor: '#ecfdf5',
          accentColor: '#047857',
          logoUrl: '',
          logoOpacity: 1
        }
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
        active: true,
        style: {
          primaryColor: '#7c3aed',
          backgroundColor: '#f3e8ff',
          accentColor: '#6d28d9',
          logoUrl: '',
          logoOpacity: 1
        }
      },
      { 
        id: '5', 
        name: 'Indiana Lacrosse Club', 
        division: 'Field', 
        wins: 4, 
        losses: 6, 
        ties: 0,
        coach: 'Coach Miller',
        homeField: 'Indiana Field',
        contactEmail: 'coach@indianalax.com',
        active: true,
        style: {
          primaryColor: '#ea580c',
          backgroundColor: '#fff7ed',
          accentColor: '#c2410c',
          logoUrl: '',
          logoOpacity: 1
        }
      },
      { 
        id: '6', 
        name: 'Dayton Eagles', 
        division: 'Box', 
        wins: 9, 
        losses: 1, 
        ties: 0,
        coach: 'Coach Brown',
        homeField: 'Eagle Stadium',
        contactEmail: 'coach@daytonlax.com',
        active: true,
        style: {
          primaryColor: '#0891b2',
          backgroundColor: '#f0f9ff',
          accentColor: '#0e7490',
          logoUrl: '',
          logoOpacity: 1
        }
      },
      { 
        id: '7', 
        name: 'Toledo Thunder', 
        division: 'Field', 
        wins: 3, 
        losses: 7, 
        ties: 0,
        coach: 'Coach Wilson',
        homeField: 'Thunder Park',
        contactEmail: 'coach@toledothunder.com',
        active: true,
        style: {
          primaryColor: '#be123c',
          backgroundColor: '#fdf2f8',
          accentColor: '#9f1239',
          logoUrl: '',
          logoOpacity: 1
        }
      },
      { 
        id: '8', 
        name: 'Cleveland Storm', 
        division: 'Box', 
        wins: 6, 
        losses: 4, 
        ties: 0,
        coach: 'Coach Taylor',
        homeField: 'Storm Arena',
        contactEmail: 'coach@clevelandstorm.com',
        active: true,
        style: {
          primaryColor: '#7c2d12',
          backgroundColor: '#fef7f0',
          accentColor: '#92400e',
          logoUrl: '',
          logoOpacity: 1
        }
      },
      { 
        id: '9', 
        name: 'Akron Wolves', 
        division: 'Field', 
        wins: 2, 
        losses: 8, 
        ties: 0,
        coach: 'Coach Anderson',
        homeField: 'Wolves Den',
        contactEmail: 'coach@akronwolves.com',
        active: true,
        style: {
          primaryColor: '#4338ca',
          backgroundColor: '#eef2ff',
          accentColor: '#3730a3',
          logoUrl: '',
          logoOpacity: 1
        }
      },
      { 
        id: '10', 
        name: 'Youngstown Steelers', 
        division: 'Box', 
        wins: 7, 
        losses: 3, 
        ties: 0,
        coach: 'Coach Thomas',
        homeField: 'Steel Field',
        contactEmail: 'coach@youngstownsteelers.com',
        active: true,
        style: {
          primaryColor: '#374151',
          backgroundColor: '#f9fafb',
          accentColor: '#1f2937',
          logoUrl: '',
          logoOpacity: 1
        }
      }
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
        title: 'Team Practice Session',
        type: 'practice',
        date: '2025-09-10',
        time: '18:00',
        location: 'Smith Field',
        description: 'Weekly team practice session',
        teamId: '1',
        teamName: 'OH10 Lacrosse',
        status: 'scheduled'
      },
      {
        id: 'event_2', 
        title: 'OH10 vs American Dads',
        type: 'game',
        date: '2025-09-15',
        time: '19:30',
        location: 'Central Stadium',
        description: 'League championship game',
        homeTeam: '1',
        awayTeam: '2',
        homeScore: 0,
        awayScore: 0,
        status: 'scheduled'
      },
      {
        id: 'event_3',
        title: 'Spring Championship Tournament',
        type: 'tournament', 
        date: '2025-09-22',
        time: '10:00',
        location: 'Tournament Center',
        description: 'Annual spring tournament with all teams',
        teamIds: ['1', '2', '3', '4'],
        allTeams: [
          { id: '1', name: 'OH10 Lacrosse' },
          { id: '2', name: 'American Dads' },
          { id: '3', name: 'Cincinnati Trash Pandas' },
          { id: '4', name: 'Columbus Ball Hawgs' }
        ],
        status: 'scheduled'
      }
    ]);

    // Don't auto-login a mock user anymore - require proper authentication
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
