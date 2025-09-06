import React, { useState } from 'react';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleNavigate = (page, teamId = null) => {
        if (page === 'team' && teamId && onTeamNavigate) {
            onTeamNavigate(teamId);
        } else if (onNavigate) {
            onNavigate(page);
        }
        // Close mobile menu on navigation
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Mobile Navigation Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            
            {/* Navigation - Hidden on mobile, shown on md+ */}
            <div className="hidden md:block">
                <Navigation 
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    onLogin={onLogin}
                    onLogout={onLogout}
                    teams={teams}
                    onMobileClose={() => setIsMobileMenuOpen(false)}
                />
            </div>
            
            {/* Mobile Navigation - Slide in from left */}
            <div className={`
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                fixed inset-y-0 left-0 z-50 md:hidden
                transition-transform duration-300 ease-in-out
            `}>
                <Navigation 
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    onLogin={onLogin}
                    onLogout={onLogout}
                    teams={teams}
                    onMobileClose={() => setIsMobileMenuOpen(false)}
                />
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col w-full min-w-0">
                {/* Mobile Header - Only shown on mobile */}
                <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label="Open navigation menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-bold text-slate-800">🥍 Lacrosse League</h1>
                    <div className="w-10"></div> {/* Spacer for centering */}
                </div>

                {/* Main Content */}
                <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">
                    <div className="w-full max-w-none">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
};

export default Layout;