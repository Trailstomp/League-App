import React, { useState, useEffect } from 'react';

const InstallPWABanner = ({ websiteStyle = {} }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if previously dismissed (within 7 days)
        const dismissedTime = localStorage.getItem('pwaInstallDismissed');
        if (dismissedTime) {
            const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                setDismissed(true);
            }
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for successful install
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowBanner(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        setDismissed(true);
        localStorage.setItem('pwaInstallDismissed', Date.now().toString());
    };

    // Don't show if installed, dismissed, or no prompt available
    if (isInstalled || dismissed || !showBanner) return null;

    const bannerBgColor = websiteStyle.pwaInstallBannerBgColor || '#1e40af';
    const bannerTextColor = websiteStyle.pwaInstallBannerTextColor || '#ffffff';
    const buttonColor = websiteStyle.pwaInstallBannerButtonColor || '#ffffff';
    const buttonTextColor = websiteStyle.pwaInstallBannerButtonTextColor || '#1e40af';
    const title = websiteStyle.pwaInstallBannerTitle || 'Install Our App';
    const text = websiteStyle.pwaInstallBannerText || 'Add to your home screen for quick access!';
    const iconUrl = websiteStyle.pwaIconUrl || websiteStyle.navLogoUrl;

    return (
        <div 
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 rounded-xl shadow-2xl overflow-hidden animate-slide-up"
            style={{ 
                background: `linear-gradient(135deg, ${bannerBgColor} 0%, ${bannerBgColor}dd 100%)`,
            }}
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* App Icon */}
                    <div className="flex-shrink-0">
                        {iconUrl ? (
                            <img 
                                src={iconUrl} 
                                alt="App Icon"
                                className="w-14 h-14 rounded-xl object-cover border-2 border-white/20"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                                📱
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 
                            className="font-bold text-lg leading-tight"
                            style={{ color: bannerTextColor }}
                        >
                            {title}
                        </h3>
                        <p 
                            className="text-sm opacity-90 mt-0.5"
                            style={{ color: bannerTextColor }}
                        >
                            {text}
                        </p>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                        style={{ color: bannerTextColor }}
                    >
                        ✕
                    </button>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleInstallClick}
                    className="w-full mt-3 px-4 py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ 
                        backgroundColor: buttonColor,
                        color: buttonTextColor
                    }}
                >
                    Install App
                </button>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

// Reinstall Instructions Component for Admin
export const PWAReinstallInstructions = () => {
    const [copied, setCopied] = useState(false);

    const copyInstructions = () => {
        const text = `To update the app with new settings:

iOS (iPhone/iPad):
1. Delete the app from your home screen
2. Open Safari and visit the website
3. Tap the Share button (box with arrow)
4. Scroll down and tap "Add to Home Screen"
5. Tap "Add"

Android:
1. Long-press the app icon and uninstall
2. Open Chrome and visit the website
3. Tap the menu (3 dots) → "Install app" or "Add to Home screen"
4. Tap "Install"

Desktop (Chrome):
1. Click the install icon in the address bar
2. Or go to Menu → "Install app"`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <span className="text-2xl">📲</span>
                <div className="flex-1">
                    <h4 className="font-semibold text-amber-900">How to Update the Installed App</h4>
                    <p className="text-sm text-amber-800 mt-1">
                        After changing app settings (icon, name, colors), users need to reinstall the app to see the changes.
                    </p>
                    
                    <div className="mt-3 space-y-2 text-sm text-amber-900">
                        <div className="font-medium">iOS (iPhone/iPad):</div>
                        <ol className="list-decimal list-inside space-y-1 ml-2 text-amber-800">
                            <li>Delete the app from home screen</li>
                            <li>Open Safari → visit website</li>
                            <li>Tap Share → "Add to Home Screen"</li>
                        </ol>
                        
                        <div className="font-medium mt-3">Android:</div>
                        <ol className="list-decimal list-inside space-y-1 ml-2 text-amber-800">
                            <li>Uninstall the app</li>
                            <li>Open Chrome → visit website</li>
                            <li>Menu → "Install app"</li>
                        </ol>

                        <div className="font-medium mt-3">Desktop (Chrome):</div>
                        <ol className="list-decimal list-inside space-y-1 ml-2 text-amber-800">
                            <li>Click install icon in address bar</li>
                            <li>Or Menu → "Install app"</li>
                        </ol>
                    </div>

                    <button
                        onClick={copyInstructions}
                        className="mt-3 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                    >
                        {copied ? '✓ Copied!' : '📋 Copy Instructions to Share'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPWABanner;
