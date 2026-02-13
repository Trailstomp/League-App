import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import EventsTicker from './EventsTicker';
import BottomNavbar from './BottomNavbar';
import CachedImage from './CachedImage';

const Layout = ({ 
    children, 
    currentPage, 
    onNavigate, 
    onTeamNavigate,
    currentUser, 
    onLogin,
    onLogout,
    teams = [],
    websiteStyle = {},
    events = [],
    onEventClick,
    onTeamClick
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [isNavCollapsed, setIsNavCollapsed] = useState(false);
    
    // Check for mobile view on mount and resize
    useEffect(() => {
        const checkMobileView = () => {
            const isMobile = window.innerWidth < 768;
            console.log('🔍 Mobile check:', window.innerWidth, 'Mobile:', isMobile);
            setIsMobileView(isMobile);
        };
        
        // Initial check
        checkMobileView();
        
        // Add resize listener
        window.addEventListener('resize', checkMobileView);
        
        return () => window.removeEventListener('resize', checkMobileView);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            // Restore scrolling
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
        
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [isMobileMenuOpen]);

    // Apply active cycling template on mount
    useEffect(() => {
        const applyCyclingTemplate = async () => {
            try {
                const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
                const userId = (() => {
                    try { return JSON.parse(localStorage.getItem('mlbl_current_user') || '{}').id; } catch { return null; }
                })();
                
                const url = userId 
                    ? `${backendUrl}/api/design-templates/active?user_id=${userId}`
                    : `${backendUrl}/api/design-templates/active`;
                
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.template?.style && data.source !== 'none') {
                        // Store which template is active for session
                        sessionStorage.setItem('mlbl_cycling_template', JSON.stringify(data.template));
                        console.log(`🎨 Cycling template applied: ${data.template.name} (${data.source})`);
                    }
                }
            } catch (e) {
                // Cycling is optional, don't break the app
            }
        };
        applyCyclingTemplate();
    }, []);

    // Apply global website styling
    useEffect(() => {
        const applyGlobalStyling = () => {
            const root = document.documentElement;
            
            // Apply CSS variables for global styling
            if (websiteStyle.mainBackgroundColor) {
                root.style.setProperty('--main-bg-color', websiteStyle.mainBackgroundColor);
            }
            if (websiteStyle.primaryColor) {
                root.style.setProperty('--primary-color', websiteStyle.primaryColor);
            }
            if (websiteStyle.accentColor) {
                root.style.setProperty('--accent-color', websiteStyle.accentColor);
            }
            if (websiteStyle.mainFont) {
                root.style.setProperty('--main-font', websiteStyle.mainFont);
            }
            if (websiteStyle.mainTextColor) {
                root.style.setProperty('--main-text-color', websiteStyle.mainTextColor);
            }
            if (websiteStyle.inputTextColor) {
                root.style.setProperty('--input-text-color', websiteStyle.inputTextColor);
            }
            if (websiteStyle.secondaryTextColor) {
                root.style.setProperty('--secondary-text-color', websiteStyle.secondaryTextColor);
            }
            if (websiteStyle.accentTextColor) {
                root.style.setProperty('--accent-text-color', websiteStyle.accentTextColor);
            }

            // Apply banner background to body if banner image
            if (websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage) {
                document.body.style.setProperty('--banner-bg-image', `url(${websiteStyle.bannerBackgroundImage})`);
            }
            
            // Update browser favicon to use the league's logo (with cache busting)
            const logoUrl = websiteStyle.pwaIconUrl || websiteStyle.navLogoUrl || websiteStyle.logoUrl;
            if (logoUrl) {
                const cacheBuster = `?v=${Date.now()}`;
                const faviconUrl = logoUrl.includes('?') ? `${logoUrl}&_cb=${Date.now()}` : `${logoUrl}${cacheBuster}`;
                
                const existingFavicon = document.querySelector('link[rel="icon"]');
                if (existingFavicon) {
                    existingFavicon.href = faviconUrl;
                } else {
                    const link = document.createElement('link');
                    link.rel = 'icon';
                    link.type = 'image/png';
                    link.href = faviconUrl;
                    document.head.appendChild(link);
                }
                // Also update apple-touch-icon
                const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
                if (appleIcon) {
                    appleIcon.href = faviconUrl;
                }
                
                // Update PWA manifest dynamically for icon refresh
                try {
                    const manifestBlob = new Blob([JSON.stringify({
                        short_name: websiteStyle.navLeagueName || 'League',
                        name: websiteStyle.bannerTitle || websiteStyle.navLeagueName || 'League Portal',
                        icons: [
                            { src: logoUrl, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                            { src: logoUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
                        ],
                        start_url: '/',
                        display: 'standalone',
                        theme_color: websiteStyle.primaryColor || '#1e40af',
                        background_color: websiteStyle.mainBgColor || '#f8fafc'
                    })], { type: 'application/json' });
                    const manifestUrl = URL.createObjectURL(manifestBlob);
                    let manifestLink = document.querySelector('link[rel="manifest"]');
                    if (manifestLink) {
                        manifestLink.href = manifestUrl;
                    } else {
                        manifestLink = document.createElement('link');
                        manifestLink.rel = 'manifest';
                        manifestLink.href = manifestUrl;
                        document.head.appendChild(manifestLink);
                    }
                } catch (e) {
                    console.warn('Could not update manifest:', e);
                }
            }
        };

        applyGlobalStyling();
    }, [websiteStyle]);

    const handleNavigate = (page, teamId = null) => {
        if (page === 'team' && teamId && onTeamNavigate) {
            onTeamNavigate(teamId);
        } else if (onNavigate) {
            onNavigate(page);
        }
        // Close mobile menu on navigation
        setIsMobileMenuOpen(false);
    };

    // Get dynamic background style for the outer container
    const getBackgroundStyle = () => {
        const style = {};
        
        if (websiteStyle.mainBackgroundType === 'image' && websiteStyle.mainBackgroundImage) {
            style.backgroundImage = `url(${websiteStyle.mainBackgroundImage})`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
            style.backgroundColor = 'rgba(248, 250, 252, 0.9)'; // Fallback with opacity
        } else {
            style.backgroundColor = websiteStyle.mainBackgroundColor || '#f8fafc';
        }
        
        return style;
    };

    // Get content area background style (the "white" area user mentioned)
    const getContentBackgroundStyle = () => {
        const style = {};
        
        // Debug log
        console.log('🎨 Content Background Style:', {
            type: websiteStyle.contentBackgroundType,
            color: websiteStyle.contentBackgroundColor,
            image: websiteStyle.contentBackgroundImage
        });
        
        // Check if using image AND image is valid
        if (websiteStyle.contentBackgroundType === 'image' && websiteStyle.contentBackgroundImage) {
            style.backgroundImage = `url(${websiteStyle.contentBackgroundImage})`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
            style.backgroundAttachment = 'fixed';
        }
        
        // Always apply background color (as fallback or primary if type is 'color')
        if (websiteStyle.contentBackgroundColor && websiteStyle.contentBackgroundColor !== '#ffffff') {
            style.backgroundColor = websiteStyle.contentBackgroundColor;
        } else {
            style.backgroundColor = '#ffffff'; // Default white
        }
        
        // Add CSS custom properties for card backgrounds
        const cardBgColor = websiteStyle.cardBackgroundColor || '#ffffff';
        const cardOpacity = websiteStyle.cardBackgroundOpacity || 1;
        const isTransparent = websiteStyle.cardBackgroundType === 'transparent';
        
        // Convert hex to rgba for opacity support
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        style['--card-bg'] = isTransparent ? 'transparent' : hexToRgba(cardBgColor, cardOpacity);
        style['--card-bg-solid'] = isTransparent ? 'transparent' : cardBgColor;
        style['--card-opacity'] = isTransparent ? '0' : cardOpacity;
        
        // Typography CSS custom properties
        style['--content-font'] = websiteStyle.contentFont || 'Inter, sans-serif';
        style['--content-text-color'] = websiteStyle.contentTextColor || '#374151';
        style['--card-font'] = websiteStyle.cardFont === 'inherit' ? 'inherit' : (websiteStyle.cardFont || 'inherit');
        style['--card-text-color'] = websiteStyle.cardTextColor || '#374151';
        style['--card-heading-color'] = websiteStyle.cardHeadingColor || '#1f2937';
        
        return style;
    };

    return (
        <div className="min-h-screen" style={{...getBackgroundStyle()}}>
            {/* Desktop Header - ticker and banner */}
            {!isMobileView && (
                <div 
                    className="fixed top-0 right-0 z-50 transition-all duration-300"
                    style={{
                        left: isNavCollapsed ? '80px' : '320px',
                        height: '200px' // Ticker (120px) + Banner (80px)
                    }}
                >
                    {/* Event Ticker */}
                    <div 
                        className="w-full bg-slate-800 text-white shadow-sm" 
                        style={{ 
                            height: '120px',
                            display: 'block',
                            position: 'relative',
                            zIndex: 100,
                            overflow: 'hidden'
                        }}
                    >
                        <EventsTicker 
                            events={events}
                            teams={teams}
                            websiteStyle={websiteStyle}
                            onEventClick={onEventClick}
                            onTeamClick={onTeamClick}
                        />
                    </div>
                    
                    {/* League Banner */}
                    <div 
                        className="w-full px-4 py-3 border-b shadow-sm flex items-center"
                        style={{
                            height: '80px',
                            display: 'block',
                            position: 'relative',
                            zIndex: 99,
                            backgroundColor: websiteStyle.bannerBackgroundType === 'image' ? 'transparent' : (websiteStyle.bannerBackgroundColor || '#ffffff'),
                            backgroundImage: websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage 
                                ? `url(${websiteStyle.bannerBackgroundImage})` 
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {/* Overlay for image banners */}
                        {websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage && (
                            <div className="absolute inset-0 bg-black bg-opacity-30 z-0"></div>
                        )}
                        
                        <div className="flex items-center justify-between relative z-10 max-w-7xl mx-auto w-full">
                            <div className="flex items-center space-x-4">
                                <div className="text-3xl">🥍</div>
                                <div>
                                    <h1 
                                        className="text-xl md:text-2xl font-bold"
                                        style={{
                                            fontFamily: websiteStyle.bannerFont || 'Inter, sans-serif',
                                            color: websiteStyle.bannerTextColor || '#1f2937'
                                        }}
                                    >
                                        {websiteStyle.bannerTitle || 'Lacrosse League'}
                                    </h1>
                                    <p 
                                        className="text-sm hidden md:block"
                                        style={{
                                            fontFamily: websiteStyle.bannerFont || 'Inter, sans-serif',
                                            color: websiteStyle.bannerTextColor || '#6b7280'
                                        }}
                                    >
                                        {websiteStyle.bannerSubtitle || 'Manage your league with style and efficiency'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Header - Simplified with logo and league name */}
            {isMobileView && (
                <div className="fixed top-0 left-0 right-0 z-50 shadow-md">
                    {/* Mobile banner bar */}
                    <div
                        className="flex items-center justify-between px-4 relative"
                        style={{
                            height: '56px',
                            backgroundColor: websiteStyle.bannerBackgroundType === 'image' ? 'transparent' : (websiteStyle.bannerBackgroundColor || websiteStyle.primaryColor || '#1e40af'),
                            backgroundImage: websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage 
                                ? `url(${websiteStyle.bannerBackgroundImage})` 
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage && (
                            <div className="absolute inset-0 bg-black bg-opacity-40 z-0"></div>
                        )}
                        <div className="flex items-center space-x-3 relative z-10">
                            {websiteStyle.navLogoUrl ? (
                                <CachedImage 
                                    src={websiteStyle.navLogoUrl} 
                                    alt="Logo" 
                                    className="w-9 h-9 object-contain rounded-lg"
                                    fallback={<span className="text-xl">🥍</span>}
                                />
                            ) : (
                                <span className="text-xl">🥍</span>
                            )}
                            <h1 
                                className="text-base font-bold truncate max-w-[180px]"
                                style={{
                                    fontFamily: websiteStyle.bannerFont || 'Inter, sans-serif',
                                    color: websiteStyle.bannerTextColor || '#ffffff'
                                }}
                            >
                                {websiteStyle.navLeagueName || websiteStyle.bannerTitle || 'League'}
                            </h1>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 rounded-lg transition-colors relative z-10"
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                color: websiteStyle.bannerTextColor || '#ffffff'
                            }}
                            aria-label="Open menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Ticker - compact scrolling strip */}
                    <div
                        className="w-full overflow-hidden"
                        style={{ height: '48px', backgroundColor: '#1e293b' }}
                    >
                        <EventsTicker 
                            events={events}
                            teams={teams}
                            websiteStyle={websiteStyle}
                            onEventClick={onEventClick}
                            onTeamClick={onTeamClick}
                        />
                    </div>
                </div>
            )}

            {/* Mobile Navigation Overlay */}
            {isMobileView && isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    style={{top: '0'}} // Cover full screen
                    onClick={() => setIsMobileMenuOpen(false)}
                    onTouchStart={(e) => e.stopPropagation()}
                />
            )}
            
            {/* Navigation - Fixed position from TOP, full height */}
            {!isMobileView && (
                <div 
                    className="fixed left-0 top-0 z-60 overflow-hidden transition-all duration-300"
                    style={{
                        height: '100vh',
                        width: isNavCollapsed ? '80px' : '320px' // Fixed widths for consistent alignment
                    }}
                >
                    <Navigation 
                        currentPage={currentPage}
                        onNavigate={handleNavigate}
                        currentUser={currentUser}
                        onLogin={onLogin}
                        onLogout={onLogout}
                        teams={teams}
                        websiteStyle={websiteStyle}
                        onMobileClose={() => setIsMobileMenuOpen(false)}
                        onCollapseChange={setIsNavCollapsed}
                    />
                </div>
            )}
            
            {/* Mobile Navigation - Full height from top */}
            {isMobileView && (
                <div className={`
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                    fixed left-0 top-0 z-50 bg-white shadow-lg
                    transition-transform duration-300 ease-in-out
                    overflow-y-auto
                `}
            style={{
                height: '100vh',
                width: '75vw',
                maxWidth: '320px'
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}>
                <Navigation 
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    onLogin={onLogin}
                    onLogout={onLogout}
                    teams={teams}
                    websiteStyle={websiteStyle}
                    onMobileClose={() => setIsMobileMenuOpen(false)}
                />
                </div>
            )}
            
            {/* Main Content Area - starts at top with padding to account for fixed header */}
            <div 
                className="main-content-area transition-all duration-300" 
                style={{
                    marginLeft: isMobileView ? '0' : (isNavCollapsed ? '80px' : '320px'), // Use actual nav maxWidth
                    paddingTop: isMobileView ? '80px' : '200px', // Reduced for mobile (no ticker/banner)
                    paddingBottom: isMobileView ? '80px' : '0', // Space for bottom navbar on mobile
                    minHeight: '100vh',
                    width: isMobileView ? '100vw' : (isNavCollapsed ? 'calc(100vw - 80px)' : 'calc(100vw - 320px)')
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Main Content Container with customizable background */}
                    <main 
                        className="flex-1 overflow-x-hidden w-full"
                        style={{
                            fontFamily: websiteStyle.mainFont || 'Inter, sans-serif',
                            fontSize: websiteStyle.mainFontSize || '16px',
                            color: websiteStyle.mainTextColor || '#374151',
                            minHeight: isMobileView ? 'calc(100vh - 160px)' : 'calc(100vh - 200px)',
                            padding: '1rem',
                            ...getContentBackgroundStyle()
                        }}
                    >
                        {children}
                    </main>
                </div>
            </div>

            {/* Bottom Navigation Bar for Mobile */}
            {isMobileView && (
                <BottomNavbar
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    websiteStyle={websiteStyle}
                    onLogin={onLogin}
                />
            )}
        </div>
    );
};

export default Layout;