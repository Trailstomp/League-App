import React from 'react';
import Navigation from './Navigation';

const Layout = ({ 
    children, 
    currentPage, 
    onNavigate, 
    onTeamNavigate,
    currentUser, 
    onLogin,
    onLogout,
    teams = [] 
}) => {
    const handleNavigate = (page, teamId = null) => {
        if (page === 'team' && teamId && onTeamNavigate) {
            onTeamNavigate(teamId);
        } else if (onNavigate) {
            onNavigate(page);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Navigation 
                currentPage={currentPage}
                onNavigate={handleNavigate}
                currentUser={currentUser}
                onLogin={onLogin}
                onLogout={onLogout}
                teams={teams}
            />
            
            <div className="flex-1 flex flex-col">
                {/* Main Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;