import React, { useState, useEffect } from 'react';

const InstallPWA = ({ websiteStyle = {} }) => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    // Get PWA settings from websiteStyle with defaults
    const pwaSettings = {
        appName: websiteStyle.pwaAppName || websiteStyle.navLeagueName || 'Install App',
        shortName: websiteStyle.pwaShortName || 'App',
        iconUrl: websiteStyle.pwaIconUrl || websiteStyle.navLogoUrl || '/icon-192.png',
        bannerTitle: websiteStyle.pwaInstallBannerTitle || 'Install Our App',
        bannerText: websiteStyle.pwaInstallBannerText || 'Add to your home screen for quick access!',
        bannerBgColor: websiteStyle.pwaInstallBannerBgColor || '#1e40af',
        bannerTextColor: websiteStyle.pwaInstallBannerTextColor || '#ffffff',
        buttonColor: websiteStyle.pwaInstallBannerButtonColor || '#ffffff',
        buttonTextColor: websiteStyle.pwaInstallBannerButtonTextColor || '#1e40af',
    };

    useEffect(() => {
        // Check if already installed (standalone mode)
        const standalone = window.matchMedia('(display-mode: standalone)').matches 
            || window.navigator.standalone 
            || document.referrer.includes('android-app://');
        setIsStandalone(standalone);

        // Check if iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            
            // Show banner if not already installed and not dismissed recently
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            const dismissedTime = dismissed ? parseInt(dismissed) : 0;
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            
            if (!standalone && daysSinceDismissed > 7) {
                setShowInstallBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Show iOS instructions if on iOS and not installed
        if (ios && !standalone) {
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            const dismissedTime = dismissed ? parseInt(dismissed) : 0;
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            
            if (daysSinceDismissed > 7) {
                setShowInstallBanner(true);
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;

        // Show the install prompt
        installPrompt.prompt();

        // Wait for user response
        const { outcome } = await installPrompt.userChoice;
        console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);

        // Clear the prompt
        setInstallPrompt(null);
        setShowInstallBanner(false);
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    // Don't show if already installed
    if (isStandalone || !showInstallBanner) {
        return null;
    }

    return (
        <div 
            className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 rounded-xl shadow-2xl p-4 z-50 animate-slide-up"
            style={{ 
                background: `linear-gradient(135deg, ${pwaSettings.bannerBgColor} 0%, ${pwaSettings.bannerBgColor}dd 100%)`,
                color: pwaSettings.bannerTextColor
            }}
        >
            <button 
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
                style={{ color: `${pwaSettings.bannerTextColor}aa` }}
                aria-label="Dismiss"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl shadow-lg overflow-hidden bg-white flex items-center justify-center">
                        {pwaSettings.iconUrl ? (
                            <img 
                                src={pwaSettings.iconUrl} 
                                alt={pwaSettings.shortName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <span className="text-2xl" style={{ display: pwaSettings.iconUrl ? 'none' : 'flex' }}>📱</span>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1">{pwaSettings.bannerTitle}</h3>
                    <p className="text-sm opacity-90 mb-3">
                        {isIOS 
                            ? pwaSettings.bannerText
                            : pwaSettings.bannerText
                        }
                    </p>

                    {isIOS ? (
                        <div 
                            className="rounded-lg p-3 text-sm"
                            style={{ backgroundColor: `${pwaSettings.bannerTextColor}15` }}
                        >
                            <p className="font-medium mb-2">To install:</p>
                            <ol className="list-decimal list-inside space-y-1 opacity-90">
                                <li>Tap the <span className="inline-flex items-center"><svg className="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 14V20H20V14"/></svg></span> Share button</li>
                                <li>Scroll and tap "Add to Home Screen"</li>
                                <li>Tap "Add" to confirm</li>
                            </ol>
                        </div>
                    ) : (
                        <button
                            onClick={handleInstallClick}
                            className="w-full py-2 px-4 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: pwaSettings.buttonColor,
                                color: pwaSettings.buttonTextColor
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Install App
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;
