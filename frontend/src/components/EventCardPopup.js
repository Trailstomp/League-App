import React, { useState, useRef } from 'react';
import GameStatsView from './unified-events/GameStatsView';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
};

const getEventTypeLabel = (type) => {
    const labels = {
        regular_game: 'Game',
        tournament: 'Tournament',
        practice: 'Practice',
        hold: 'Hold',
        external: 'Event',
        social: 'Social Event',
        meeting: 'Meeting'
    };
    return labels[type] || type || 'Event';
};

const getEventTypeColor = (type) => {
    const colors = {
        regular_game: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
        tournament: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
        practice: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        external: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
        social: { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
        hold: { bg: '#f1f5f9', text: '#475569', border: '#94a3b8' },
        meeting: { bg: '#f3e8ff', text: '#6b21a8', border: '#c4b5fd' },
    };
    return colors[type] || colors.external;
};

const generateICS = (event, teams) => {
    const teamNames = (event.teams || []).map(tid => {
        const t = teams.find(team => team.id === tid);
        return t?.name || tid;
    });
    const title = event.title || teamNames.join(' vs ') || 'Event';
    const start = event.date && event.time
        ? `${event.date.replace(/-/g, '')}T${event.time.replace(/:/g, '')}00`
        : `${(event.date || '20250101').replace(/-/g, '')}T120000`;
    const desc = (event.description || '').replace(/\n/g, '\\n');
    const loc = event.location || '';

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//League Portal//Event//EN',
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${desc}`,
        `LOCATION:${loc}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
};

const EventCardPopup = ({ event, onClose, teams = [], websiteStyle = {}, onNavigate }) => {
    const [showMap, setShowMap] = useState(true);
    const cardRef = useRef(null);

    if (!event) return null;

    const teamNames = (event.teams || []).map(tid => {
        const t = teams.find(team => team.id === tid);
        return t?.name || tid;
    });

    const title = event.title || teamNames.join(' vs ') || 'Event';
    const typeColor = getEventTypeColor(event.type);
    const hasScores = event.scores?.home_team || event.scores?.away_team;
    const homeScore = event.scores?.home_team?.goals_for ?? null;
    const awayScore = event.scores?.away_team?.goals_for ?? null;
    const homeTeam = event.scores?.home_team?.name || teamNames[0] || 'Home';
    const awayTeam = event.scores?.away_team?.name || teamNames[1] || 'Away';
    const primaryColor = websiteStyle?.primaryColor || '#1e40af';

    const handlePrint = () => {
        const printContent = cardRef.current;
        if (!printContent) return;
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>${title}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; }
                .header { text-align: center; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
                .score-box { display: flex; justify-content: center; gap: 32px; align-items: center; padding: 20px; }
                .team-score { text-align: center; }
                .team-name { font-size: 18px; font-weight: 600; }
                .score { font-size: 48px; font-weight: 800; }
                .vs { font-size: 14px; color: #94a3b8; font-weight: 600; }
                .details { margin-top: 16px; }
                .detail-row { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
                .detail-label { font-weight: 600; color: #475569; min-width: 80px; }
                .detail-value { color: #1e293b; }
                .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                @media print { body { padding: 20px; } }
            </style></head><body>${printContent.innerHTML}</body></html>`);
        win.document.close();
        win.print();
    };

    const handleDownload = () => {
        const printContent = cardRef.current;
        if (!printContent) return;
        const html = `<html><head><title>${title}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; }
                .header { text-align: center; padding: 24px; border-radius: 12px; margin-bottom: 24px; background: ${primaryColor}; color: white; }
                .score-box { display: flex; justify-content: center; gap: 32px; align-items: center; padding: 20px; }
                .team-score { text-align: center; }
                .team-name { font-size: 18px; font-weight: 600; }
                .score { font-size: 48px; font-weight: 800; }
                .vs { font-size: 14px; color: #94a3b8; font-weight: 600; }
                .details { margin-top: 16px; }
                .detail-row { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
                .detail-label { font-weight: 600; color: #475569; min-width: 80px; }
                .detail-value { color: #1e293b; }
                .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            </style></head><body>${printContent.innerHTML}</body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAddToCalendar = (type) => {
        const startDate = event.date || '2025-01-01';
        const startTime = event.time || '12:00';
        const loc = event.location || '';
        const desc = event.description || '';

        if (type === 'google') {
            const start = `${startDate.replace(/-/g, '')}T${startTime.replace(/:/g, '')}00`;
            const end = `${startDate.replace(/-/g, '')}T${(parseInt(startTime.split(':')[0]) + 2).toString().padStart(2, '0')}${startTime.split(':')[1]}00`;
            const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(loc)}`;
            window.open(url, '_blank');
        } else {
            const ics = generateICS(event, teams);
            const blob = new Blob([ics], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const mapQuery = encodeURIComponent(event.location || '');
    const mapUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            data-testid="event-card-overlay"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
                data-testid="event-card-popup"
                style={{ animation: 'slideUp 0.3s ease-out' }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    data-testid="close-event-popup"
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/30 z-10"
                    style={{ color: '#fff' }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                {/* Printable card content */}
                <div ref={cardRef}>
                    {/* Header */}
                    <div
                        className="header rounded-t-2xl p-6 text-center relative"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, color: '#fff' }}
                    >
                        <span
                            className="badge inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
                            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
                        >
                            {getEventTypeLabel(event.type)}
                        </span>
                        <h2 className="text-xl font-bold" style={{ color: '#fff' }}>{title}</h2>
                        <p className="text-sm mt-1 opacity-80" style={{ color: '#fff' }}>{formatDate(event.date)}</p>
                    </div>

                    {/* Scores (if game) */}
                    {hasScores && (
                        <div className="score-box flex items-center justify-center gap-6 py-5 border-b" style={{ borderColor: '#e2e8f0' }}>
                            <div className="team-score text-center">
                                <div className="team-name text-sm font-semibold" style={{ color: '#334155' }}>{homeTeam}</div>
                                <div className="score text-4xl font-extrabold" style={{ color: primaryColor }}>{homeScore ?? '-'}</div>
                            </div>
                            <div className="vs text-xs font-bold" style={{ color: '#94a3b8' }}>VS</div>
                            <div className="team-score text-center">
                                <div className="team-name text-sm font-semibold" style={{ color: '#334155' }}>{awayTeam}</div>
                                <div className="score text-4xl font-extrabold" style={{ color: primaryColor }}>{awayScore ?? '-'}</div>
                            </div>
                        </div>
                    )}

                    {/* Event Details */}
                    <div className="details px-6 py-4 space-y-0">
                        {event.time && (
                            <div className="detail-row flex items-center gap-3 py-2.5 border-b" style={{ borderColor: '#f1f5f9' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                <span className="detail-label text-xs font-semibold" style={{ color: '#64748b' }}>Time</span>
                                <span className="detail-value text-sm font-medium" style={{ color: '#1e293b' }}>{formatTime(event.time)}</span>
                            </div>
                        )}
                        {event.location && (
                            <div className="detail-row flex items-center gap-3 py-2.5 border-b" style={{ borderColor: '#f1f5f9' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span className="detail-label text-xs font-semibold" style={{ color: '#64748b' }}>Location</span>
                                <span className="detail-value text-sm font-medium" style={{ color: '#1e293b' }}>{event.location}</span>
                            </div>
                        )}
                        {event.status && (
                            <div className="detail-row flex items-center gap-3 py-2.5 border-b" style={{ borderColor: '#f1f5f9' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                <span className="detail-label text-xs font-semibold" style={{ color: '#64748b' }}>Status</span>
                                <span
                                    className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                                    style={{ background: typeColor.bg, color: typeColor.text }}
                                >
                                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </span>
                            </div>
                        )}
                        {teamNames.length > 0 && !hasScores && (
                            <div className="detail-row flex items-center gap-3 py-2.5 border-b" style={{ borderColor: '#f1f5f9' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                                <span className="detail-label text-xs font-semibold" style={{ color: '#64748b' }}>Teams</span>
                                <span className="detail-value text-sm font-medium" style={{ color: '#1e293b' }}>{teamNames.join(' vs ')}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="px-6 pb-4">
                            <div className="p-3 rounded-lg" style={{ background: '#f8fafc' }}>
                                <p className="text-sm" style={{ color: '#475569', lineHeight: '1.6' }}>{event.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Game Stats for completed games */}
                    {(event.type === 'regular_game' || event.type === 'game' || event.type === 'tournament') && 
                     (event.status === 'completed' || event.status === 'in_progress') && (
                        <div className="px-4 pb-4" data-testid="popup-game-stats">
                            <GameStatsView eventId={event.id} teams={teams} compact={false} />
                        </div>
                    )}

                    {/* Map */}
                    {event.location && showMap && (
                        <div className="px-6 pb-4">
                            <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
                                <iframe
                                    title="Event Location"
                                    width="100%"
                                    height="180"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    src={mapUrl}
                                    allowFullScreen
                                    data-testid="event-map"
                                />
                            </div>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs mt-1 inline-block hover:underline"
                                style={{ color: primaryColor }}
                                data-testid="open-in-maps"
                            >
                                Open in Google Maps
                            </a>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-5 space-y-2">
                    {/* Watch Live / View Stats Button */}
                    {(event.type === 'regular_game' || event.type === 'game' || event.type === 'tournament') && 
                     (event.status === 'in_progress' || event.status === 'completed') && onNavigate && (
                        <button
                            onClick={() => { onNavigate('live-game', event.id); onClose(); }}
                            data-testid="popup-watch-live-btn"
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                                event.status === 'in_progress'
                                    ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                                    : 'bg-slate-700 text-white hover:bg-slate-800'
                            }`}
                        >
                            {event.status === 'in_progress' ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-white" />
                                    Watch Live
                                </>
                            ) : (
                                'View Game Stats'
                            )}
                        </button>
                    )}

                    {/* Calendar buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAddToCalendar('google')}
                            data-testid="add-google-cal"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all hover:shadow-sm"
                            style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            Google Calendar
                        </button>
                        <button
                            onClick={() => handleAddToCalendar('ics')}
                            data-testid="add-ical"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all hover:shadow-sm"
                            style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            iCal / Outlook
                        </button>
                    </div>

                    {/* Print / Download */}
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            data-testid="print-event"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all hover:shadow-sm"
                            style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            Print
                        </button>
                        <button
                            onClick={handleDownload}
                            data-testid="download-event"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all hover:shadow-sm"
                            style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download
                        </button>
                    </div>
                </div>

            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default EventCardPopup;
