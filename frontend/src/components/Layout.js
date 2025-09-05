import React from 'react';
import Navigation from './Navigation';

const Layout = ({ 
    children, 
    currentPage, 
    onNavigate, 
    currentUser, 
    teams = [] 
}) => {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Navigation 
                currentPage={currentPage}
                onNavigate={onNavigate}
                currentUser={currentUser}
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