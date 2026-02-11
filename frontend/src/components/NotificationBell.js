import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';

const NotificationBell = ({ currentUser, onNavigate }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Fetch unread count
    useEffect(() => {
        if (!currentUser?.id) return;
        
        const fetchUnreadCount = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/join-us/notifications/${currentUser.id}/count`);
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.unread_count || 0);
                }
            } catch (e) {
                console.error('Error fetching notification count:', e);
            }
        };
        
        fetchUnreadCount();
        // Poll every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [backendUrl, currentUser?.id]);
    
    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (!isOpen || !currentUser?.id) return;
        
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${backendUrl}/api/join-us/notifications/${currentUser.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                }
            } catch (e) {
                console.error('Error fetching notifications:', e);
            } finally {
                setLoading(false);
            }
        };
        
        fetchNotifications();
    }, [isOpen, backendUrl, currentUser?.id]);
    
    const markAsRead = async (notificationId) => {
        try {
            const res = await fetch(`${backendUrl}/api/join-us/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            
            if (res.ok) {
                setNotifications(prev => 
                    prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (e) {
            console.error('Error marking notification as read:', e);
        }
    };
    
    const markAllAsRead = async () => {
        try {
            const res = await fetch(`${backendUrl}/api/join-us/notifications/${currentUser.id}/read-all`, {
                method: 'PUT'
            });
            
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (e) {
            console.error('Error marking all notifications as read:', e);
        }
    };
    
    const deleteNotification = async (notificationId) => {
        try {
            const res = await fetch(`${backendUrl}/api/join-us/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                const notification = notifications.find(n => n.id === notificationId);
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                if (!notification?.read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (e) {
            console.error('Error deleting notification:', e);
        }
    };
    
    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        
        if (notification.link && onNavigate) {
            // Parse the link and navigate
            if (notification.link.startsWith('/team/')) {
                const teamId = notification.link.split('/')[2].split('?')[0];
                onNavigate('team', teamId);
            } else if (notification.link.startsWith('/admin')) {
                onNavigate('admin');
            }
        }
        
        setIsOpen(false);
    };
    
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'team_registration':
                return '🏆';
            case 'player_application':
                return '🏃';
            case 'volunteer_signup':
                return '🙋';
            default:
                return '📬';
        }
    };
    
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };
    
    if (!currentUser?.id) return null;
    
    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                data-testid="notification-bell"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            
            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-slate-500">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-slate-500">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                                        !notification.read ? 'bg-blue-50/50' : ''
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="p-1 text-slate-400 hover:text-green-600"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="p-1 text-slate-400 hover:text-red-600"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
