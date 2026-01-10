import React, { useState, useEffect } from 'react';
import { fixGoogleDriveUrl } from '../../utils/imageUtils';

/**
 * PlayerCardPopup - Displays a flippable player card with stats and bio
 */
const PlayerCardPopup = ({ player, team, isFlipped, onFlip, onClose, onPrint, onDownload }) => {
    const [statsByYear, setStatsByYear] = useState({});
    const [loadingStats, setLoadingStats] = useState(false);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Fetch stats by year when card opens
    useEffect(() => {
        if (player?.id) {
            const fetchStats = async () => {
                setLoadingStats(true);
                try {
                    const response = await fetch(`${backendUrl}/api/players/${player.id}/stats-by-year`);
                    if (response.ok) {
                        const data = await response.json();
                        setStatsByYear(data.statsByYear || {});
                    }
                } catch (error) {
                    console.error('Error fetching player stats:', error);
                } finally {
                    setLoadingStats(false);
                }
            };
            fetchStats();
        }
    }, [player?.id, backendUrl]);
    
    if (!player) return null;

    const teamColor = team?.style?.primaryColor || '#2563eb';
    const accentColor = team?.style?.accentColor || '#3b82f6';

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative max-w-sm w-full">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 z-20 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                >
                    <span className="text-gray-600 text-xl">✕</span>
                </button>

                {/* Card Container with 3D Flip */}
                <div 
                    className="relative w-full cursor-pointer"
                    style={{ 
                        perspective: '1500px',
                        height: '580px'
                    }}
                    onClick={onFlip}
                >
                    <div 
                        className="relative w-full h-full"
                        style={{ 
                            transformStyle: 'preserve-3d',
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            transition: 'transform 0.8s ease-in-out'
                        }}
                    >
                        {/* FRONT OF CARD */}
                        <div 
                            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl"
                            style={{ 
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                border: `3px solid ${teamColor}`,
                                background: `linear-gradient(135deg, white 0%, ${team?.style?.backgroundColor || '#f8fafc'} 100%)`
                            }}
                        >
                            {/* Header with Team Name */}
                            <div 
                                className="h-10 w-full flex items-center justify-center"
                                style={{ background: `linear-gradient(90deg, ${teamColor} 0%, ${accentColor} 100%)` }}
                            >
                                <span className="text-white font-bold text-sm tracking-wide">{team?.name || 'Team'}</span>
                            </div>
                            
                            {/* Player Photo */}
                            <div className="relative h-72 bg-gradient-to-br from-slate-100 to-slate-200 flex items-start justify-center overflow-hidden">
                                {player.photoUrl ? (
                                    <img 
                                        src={player.photoUrl} 
                                        alt={player.name} 
                                        className="w-full h-auto max-h-full object-contain"
                                        style={{ objectPosition: 'center top' }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${team?.style?.backgroundColor || '#f8fafc'} 0%, ${teamColor}15 100%)` }}>
                                        <svg className="w-24 h-24 opacity-30" fill="currentColor" viewBox="0 0 24 24" style={{ color: teamColor }}>
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                    </div>
                                )}
                                
                                {/* Team Logo */}
                                <div className="absolute top-3 left-3">
                                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                                        {team?.style?.logoUrl ? (
                                            <img src={fixGoogleDriveUrl(team.style.logoUrl)} alt={team.name} className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: teamColor }}>
                                                <span className="text-white font-bold">{team?.name?.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Jersey Number */}
                                <div className="absolute bottom-3 right-3">
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-white shadow-lg" style={{ backgroundColor: teamColor }}>
                                        {player.jerseyNumber || '?'}
                                    </div>
                                </div>
                                
                                {/* Position Badge */}
                                <div className="absolute top-3 right-3">
                                    <div className="px-3 py-1 bg-white/90 rounded-full text-sm font-bold shadow-sm" style={{ color: teamColor }}>
                                        {player.position || 'Player'}
                                    </div>
                                </div>
                            </div>

                            {/* Player Info */}
                            <div className="p-4 bg-white text-center">
                                <h2 className="font-bold text-xl mb-2" style={{ color: teamColor }}>
                                    {player.name}
                                </h2>
                                <div className="inline-block px-4 py-1 rounded-full text-white text-sm font-medium" style={{ backgroundColor: accentColor }}>
                                    {player.position || 'Player'}
                                </div>
                                <p className="text-slate-400 text-sm mt-3">
                                    Tap card to flip →
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="h-3 w-full" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, ${teamColor} 100%)` }}></div>
                        </div>

                        {/* BACK OF CARD */}
                        <div 
                            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl"
                            style={{ 
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                border: `3px solid ${teamColor}`,
                                background: `linear-gradient(135deg, ${teamColor}08 0%, #f8fafc 50%, ${accentColor}08 100%)`
                            }}
                        >
                            {/* Header */}
                            <div className="h-10 w-full flex items-center justify-center" style={{ background: `linear-gradient(90deg, ${teamColor} 0%, ${accentColor} 100%)` }}>
                                <span className="text-white font-bold text-sm tracking-wide">Player Bio & Stats</span>
                            </div>
                            
                            <div className="p-4 h-[calc(100%-52px)] overflow-y-auto">
                                {/* Header with mini photo */}
                                <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: teamColor }}>
                                        {player.photoUrl ? (
                                            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 text-lg font-bold">
                                                {player.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg" style={{ color: teamColor }}>{player.name}</h3>
                                        <p className="text-sm text-slate-500">#{player.jerseyNumber || '?'} • {player.position || 'Player'}</p>
                                    </div>
                                </div>

                                {/* Current Season Stats */}
                                {(player.goals > 0 || player.assists > 0) && (
                                    <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${teamColor}08` }}>
                                        <div className="text-xs font-semibold text-slate-600 uppercase mb-2">📊 Current Season</div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-white rounded p-2 shadow-sm">
                                                <div className="text-xl font-bold" style={{ color: teamColor }}>{player.goals || 0}</div>
                                                <div className="text-xs text-slate-500">Goals</div>
                                            </div>
                                            <div className="bg-white rounded p-2 shadow-sm">
                                                <div className="text-xl font-bold" style={{ color: teamColor }}>{player.assists || 0}</div>
                                                <div className="text-xs text-slate-500">Assists</div>
                                            </div>
                                            <div className="bg-white rounded p-2 shadow-sm">
                                                <div className="text-xl font-bold" style={{ color: teamColor }}>{(player.goals || 0) + (player.assists || 0)}</div>
                                                <div className="text-xs text-slate-500">Points</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Stats By Year */}
                                {Object.keys(statsByYear).length > 0 && (
                                    <div className="mb-4 p-3 rounded-lg border border-slate-200">
                                        <div className="text-xs font-semibold text-slate-600 uppercase mb-2">📅 Career Stats by Year</div>
                                        {loadingStats ? (
                                            <div className="text-center text-slate-400 py-2">Loading...</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {Object.keys(statsByYear).sort().reverse().slice(0, 5).map(year => {
                                                    const yearStats = statsByYear[year];
                                                    return (
                                                        <div key={year} className="flex items-center justify-between bg-white rounded p-2 shadow-sm">
                                                            <span className="font-bold text-sm" style={{ color: teamColor }}>{year}</span>
                                                            <div className="flex gap-3 text-xs text-slate-600">
                                                                <span><strong>{yearStats.goals || 0}</strong> G</span>
                                                                <span><strong>{yearStats.assists || 0}</strong> A</span>
                                                                <span><strong>{yearStats.gamesPlayed || 0}</strong> GP</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Bio Info */}
                                <div className="space-y-3 text-sm">
                                    {player.lacrosseHistory?.highSchool?.teamName && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg">🏫</span>
                                            <div>
                                                <div className="font-semibold text-slate-700">High School</div>
                                                <div className="text-slate-600">{player.lacrosseHistory.highSchool.teamName} {player.lacrosseHistory.highSchool.graduationYear && `'${player.lacrosseHistory.highSchool.graduationYear.toString().slice(-2)}`}</div>
                                            </div>
                                        </div>
                                    )}
                                    {player.lacrosseHistory?.college?.teamName && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg">🎓</span>
                                            <div>
                                                <div className="font-semibold text-slate-700">College</div>
                                                <div className="text-slate-600">{player.lacrosseHistory.college.teamName} {player.lacrosseHistory.college.graduationYear && `'${player.lacrosseHistory.college.graduationYear.toString().slice(-2)}`}</div>
                                            </div>
                                        </div>
                                    )}
                                    {player.lacrosseHistory?.postGrad?.length > 0 && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg">🏆</span>
                                            <div>
                                                <div className="font-semibold text-slate-700">Post-Grad</div>
                                                {player.lacrosseHistory.postGrad.map((t, i) => (
                                                    <div key={i} className="text-slate-600">{t.teamName} {t.years && `(${t.years})`}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {player.funFacts && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg">✨</span>
                                            <div>
                                                <div className="font-semibold text-slate-700">Fun Facts</div>
                                                <div className="text-slate-600">{player.funFacts}</div>
                                            </div>
                                        </div>
                                    )}
                                    {player.socialMedia && Object.values(player.socialMedia).some(v => v) && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg">📱</span>
                                            <div>
                                                <div className="font-semibold text-slate-700 mb-1">Social</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {player.socialMedia.instagram && <a href={`https://instagram.com/${player.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200" onClick={e => e.stopPropagation()}>📸 @{player.socialMedia.instagram}</a>}
                                                    {player.socialMedia.twitter && <a href={`https://twitter.com/${player.socialMedia.twitter}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-blue-100 text-blue-500 rounded-full hover:bg-blue-200" onClick={e => e.stopPropagation()}>🐦 @{player.socialMedia.twitter}</a>}
                                                    {player.socialMedia.tiktok && <a href={`https://tiktok.com/@${player.socialMedia.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200" onClick={e => e.stopPropagation()}>🎵 @{player.socialMedia.tiktok}</a>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Empty state */}
                                    {!player.lacrosseHistory?.highSchool?.teamName && 
                                     !player.lacrosseHistory?.college?.teamName && 
                                     !player.funFacts &&
                                     !(player.goals > 0 || player.assists > 0) && (
                                        <div className="text-center text-slate-400 py-4">
                                            <p>No bio information yet</p>
                                        </div>
                                    )}
                                </div>

                                <p className="text-center text-slate-400 text-sm mt-3">
                                    ← Tap to flip back
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="h-3 w-full absolute bottom-0" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, ${teamColor} 100%)` }}></div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-3 mt-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPrint(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                    >
                        🖨️ Print
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDownload(statsByYear); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                    >
                        📥 Save PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlayerCardPopup;
