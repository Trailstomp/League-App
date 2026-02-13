import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';

const NotificationBell = ({ currentUser, onNavigate }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showPanel, setShowPanel] = useState(false);
    const [showToast, setShowToast] = useState(null);
    const panelRef = useRef(null);
    const prevCountRef = useRef(0);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Poll for new notifications
    useEffect(() => {
        if (!currentUser?.id) return;
        
        const checkNotifications = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/join-us/notifications/${currentUser.id}/count`);
                if (res.ok) {
                    const data = await res.json();
                    const newCount = data.unread_count || 0;
                    
                    // Show toast if count increased
                    if (newCount > prevCountRef.current && prevCountRef.current >= 0) {
                        const nRes = await fetch(`${backendUrl}/api/join-us/notifications/${currentUser.id}?unread_only=true`);
                        if (nRes.ok) {
                            const nData = await nRes.json();
                            const latest = nData.notifications?.[0];
                            if (latest && prevCountRef.current > 0) {
                                setShowToast({ title: latest.title, message: latest.message });
                                setTimeout(() => setShowToast(null), 5000);
                            }
                        }
                    }
                    
                    prevCountRef.current = newCount;
                    setUnreadCount(newCount);
                }
            } catch (e) { /* silent */ }
        };
        
        checkNotifications();
        const interval = setInterval(checkNotifications, 30000);
        return () => clearInterval(interval);
    }, [currentUser?.id, backendUrl]);
    
    // Close panel on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setShowPanel(false);
            }
        };
        if (showPanel) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showPanel]);
    
    const loadNotifications = async () => {
        try {
            const res = await fetch(`${backendUrl}/api/join-us/notifications/${currentUser.id}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (e) { console.error(e); }
    };
    
    const markRead = async (id) => {
        try {
            await fetch(`${backendUrl}/api/join-us/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { console.error(e); }
    };
    
    const markAllRead = async () => {
        const unread = notifications.filter(n => !n.read);
        await Promise.all(unread.map(n => 
            fetch(`${backendUrl}/api/join-us/notifications/${n.id}/read`, { method: 'PUT' }).catch(() => {})
        ));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };
    
    const handleBellClick = () => {
        if (!showPanel) loadNotifications();
        setShowPanel(!showPanel);
    };
    
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diff = (now - d) / 1000;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    if (!currentUser) return null;
    
    return (
        <>
            {/* Bell Button */}
            <div className="relative" ref={panelRef}>
                <button
                    onClick={handleBellClick}
                    className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
                    data-testid="notification-bell"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
                
                {/* Dropdown Panel */}
                {showPanel && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden" data-testid="notification-panel">
                        <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                    Mark all read
                                </button>
                            )}
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.slice(0, 20).map(n => (
                                    <div 
                                        key={n.id} 
                                        className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}
                                        onClick={() => { markRead(n.id); if (n.link && onNavigate) onNavigate(n.link); }}
                                    >
                                        <div className="flex items-start gap-2">
                                            {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate">{n.title}</p>
                                                <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                                                <p className="text-xs text-slate-400 mt-1">{formatTime(n.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-slate-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Toast Popup */}
            {showToast && (
                <div className="fixed top-4 right-4 z-[100]" data-testid="notification-toast">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 max-w-sm flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Bell className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{showToast.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{showToast.message}</p>
                        </div>
                        <button onClick={() => setShowToast(null)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default NotificationBell;
