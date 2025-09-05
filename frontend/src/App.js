import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { HomePage } from './pages';
import "./App.css";

function App() {
  // Basic state management
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [teams, setTeams] = useState([]);

  // Simple navigation handler
  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  // Load basic data on mount
  useEffect(() => {
    // Mock data for now - will connect to API later
    setTeams([
      { id: '1', name: 'OH10 Lacrosse', division: 'Field', wins: 8, losses: 2, ties: 0 },
      { id: '2', name: 'American Dads', division: 'Field', wins: 6, losses: 4, ties: 1 },
      { id: '3', name: 'Cincinnati Trash Pandas', division: 'Box', wins: 7, losses: 3, ties: 0 },
      { id: '4', name: 'Columbus Ball Hawgs', division: 'Field', wins: 5, losses: 5, ties: 0 },
    ]);

    // Mock user - will add proper auth later
    setCurrentUser({ name: 'Admin User', role: 'admin' });
  }, []);

  // Simple page renderer
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage teams={teams} currentUser={currentUser} />;
      case 'events':
        return (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Events & Schedule</h2>
            <p className="text-slate-600">Coming soon in Phase 3...</p>
          </div>
        );
      case 'standings':
        return (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Team Standings</h2>
            <p className="text-slate-600">Coming soon...</p>
          </div>
        );
      case 'admin':
        return (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Admin Portal</h2>
            <p className="text-slate-600">Coming soon in Phase 2...</p>
          </div>
        );
      default:
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
