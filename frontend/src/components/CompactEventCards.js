import React, { useState, useEffect } from 'react';
import { isAdmin, isCoach } from './PermissionsSystem';

// Compact Event Row for list/table view
export const CompactEventRow = ({ event, currentUser, onEventClick, onEnterStats }) => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch {
            return dateString || 'TBD';
        }
    };

    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            });
        } catch {
            return 'TBD';
        }
    };

    const getEventTypeStyles = (type) => {
        switch (type?.toLowerCase()) {
            case 'game': return { bg: 'bg-red-100', text: 'text-red-700', icon: '🏆' };
            case 'practice': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: '⚡' };
            case 'meeting': return { bg: 'bg-purple-100', text: 'text-purple-700', icon: '📋' };
            case 'tournament': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🏅' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📅' };
        }
    };

    const styles = getEventTypeStyles(event.type);
    const eventDate = new Date((event.start_datetime || event.date) + (event.start_datetime ? '' : 'T00:00:00'));
    const isPast = eventDate < new Date();

    return (
        <div 
            className={`flex items-center gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${isPast ? 'opacity-60' : ''}`}
            onClick={() => onEventClick && onEventClick(event)}
            data-testid={`compact-event-${event.id}`}
        >
            {/* Type Icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${styles.bg} flex-shrink-0`}>
                {styles.icon}
            </div>

            {/* Date/Time Column */}
            <div className="w-24 flex-shrink-0 text-center">
                <div className="text-sm font-medium text-slate-800">{formatDate(event.start_datetime || event.date)}</div>
                <div className="text-xs text-slate-500">{formatTime(event.start_datetime || event.date)}</div>
            </div>

            {/* Event Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles.bg} ${styles.text}`}>
                        {event.type || 'Event'}
                    </span>
                    <h4 className="font-medium text-slate-800 truncate">{event.title}</h4>
                </div>
                {event.location && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">📍 {event.location}</p>
                )}
            </div>

            {/* Quick Actions (admin/coach only) */}
            {(isAdmin(currentUser) || isCoach(currentUser)) && (
                <div className="flex items-center gap-1 flex-shrink-0">
                    {onEnterStats && (event.type === 'game' || event.type === 'Game') && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEnterStats(event); }}
                            className="p-1.5 text-purple-600 hover:bg-purple-100 rounded"
                            title="Enter Stats"
                        >
                            📊
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Compact Card for grid view (smaller than original)
export const CompactEventCard = ({ event, currentUser, onEventClick, onEnterStats }) => {
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch {
            return dateString || 'TBD';
        }
    };

    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            });
        } catch {
            return 'TBD';
        }
    };

    const getEventTypeStyles = (type) => {
        switch (type?.toLowerCase()) {
            case 'game': return { bg: 'bg-red-500', light: 'bg-red-50', text: 'text-red-700', icon: '🏆' };
            case 'practice': return { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', icon: '⚡' };
            case 'meeting': return { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', icon: '📋' };
            case 'tournament': return { bg: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-700', icon: '🏅' };
            default: return { bg: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-700', icon: '📅' };
        }
    };

    const styles = getEventTypeStyles(event.type);
    const eventDate = new Date((event.start_datetime || event.date) + (event.start_datetime ? '' : 'T00:00:00'));
    const isPast = eventDate < new Date();

    return (
        <div 
            className={`bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md cursor-pointer transition-all ${isPast ? 'opacity-60' : ''}`}
            onClick={() => onEventClick && onEventClick(event)}
            data-testid={`compact-card-${event.id}`}
        >
            {/* Colored Header Bar */}
            <div className={`${styles.bg} h-1.5`}></div>
            
            <div className="p-3">
                {/* Type & Date Row */}
                <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles.light} ${styles.text} flex items-center gap-1`}>
                        <span>{styles.icon}</span>
                        {event.type || 'Event'}
                    </span>
                    <span className="text-xs text-slate-500">{formatDate(event.start_datetime || event.date)}</span>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-slate-800 text-sm truncate mb-1">{event.title}</h4>

                {/* Time & Location */}
                <div className="flex items-center text-xs text-slate-500 gap-3">
                    <span>🕒 {formatTime(event.start_datetime || event.date)}</span>
                    {event.location && (
                        <span className="truncate">📍 {event.location}</span>
                    )}
                </div>

                {/* Admin Actions */}
                {(isAdmin(currentUser) || isCoach(currentUser)) && onEnterStats && (event.type === 'game' || event.type === 'Game') && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onEnterStats(event); }}
                        className="mt-2 w-full py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                    >
                        📊 Enter Stats
                    </button>
                )}
            </div>
        </div>
    );
};

export default CompactEventCard;
