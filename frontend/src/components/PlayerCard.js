import React, { useState, useRef } from 'react';
import { fixGoogleDriveUrl } from '../utils/imageUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Social media icons
const SocialIcons = {
    instagram: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
    ),
    twitter: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
    ),
    facebook: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
    ),
    tiktok: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
    ),
    linkedin: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
    )
};

const PlayerCard = ({ player, team, currentUser, onUpdate, showEditButton = true }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const cardRef = useRef(null);
    
    // Check if current user can edit this player
    const canEdit = currentUser && (
        currentUser.id === player.id || 
        currentUser.role === 'admin' || 
        currentUser.roles?.includes('admin') ||
        currentUser.roles?.includes('coach')
    );

    const handlePrint = () => {
        const printContent = cardRef.current;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
            <head>
                <title>${player.name} - Player Card</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        gap: 20px;
                    }
                    .card {
                        width: 300px;
                        border: 2px solid #ccc;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .card-front, .card-back {
                        padding: 16px;
                        background: white;
                    }
                    .card-back {
                        background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                    }
                    .player-photo {
                        width: 150px;
                        height: 150px;
                        border-radius: 50%;
                        object-fit: cover;
                        margin: 0 auto 16px;
                        display: block;
                        border: 4px solid ${team?.style?.primaryColor || '#2563eb'};
                    }
                    .player-name {
                        font-size: 24px;
                        font-weight: bold;
                        text-align: center;
                        color: ${team?.style?.primaryColor || '#2563eb'};
                        margin-bottom: 8px;
                    }
                    .player-info {
                        text-align: center;
                        color: #64748b;
                        font-size: 14px;
                        margin-bottom: 4px;
                    }
                    .section-title {
                        font-weight: bold;
                        color: #334155;
                        margin-top: 12px;
                        margin-bottom: 4px;
                        font-size: 12px;
                        text-transform: uppercase;
                    }
                    .section-content {
                        color: #64748b;
                        font-size: 13px;
                    }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="card-front">
                        ${player.photoUrl ? `<img src="${player.photoUrl}" class="player-photo" />` : ''}
                        <div class="player-name">${player.name || `${player.firstName} ${player.lastName}`}</div>
                        <div class="player-info">#${player.jerseyNumber || '?'} | ${player.position || 'Player'}</div>
                        <div class="player-info">${team?.name || ''}</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-back">
                        <div class="player-name" style="font-size: 18px;">${player.name || `${player.firstName} ${player.lastName}`}</div>
                        ${player.lacrosseHistory?.highSchool?.teamName ? `
                            <div class="section-title">High School</div>
                            <div class="section-content">${player.lacrosseHistory.highSchool.teamName} (${player.lacrosseHistory.highSchool.graduationYear || ''})</div>
                        ` : ''}
                        ${player.lacrosseHistory?.college?.teamName ? `
                            <div class="section-title">College</div>
                            <div class="section-content">${player.lacrosseHistory.college.teamName} (${player.lacrosseHistory.college.graduationYear || ''})</div>
                        ` : ''}
                        ${player.lacrosseHistory?.postGrad?.length > 0 ? `
                            <div class="section-title">Post-Grad Teams</div>
                            <div class="section-content">${player.lacrosseHistory.postGrad.map(t => `${t.teamName} (${t.years})`).join(', ')}</div>
                        ` : ''}
                        ${player.funFacts ? `
                            <div class="section-title">Fun Facts</div>
                            <div class="section-content">${player.funFacts}</div>
                        ` : ''}
                    </div>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    };

    const handleDownload = async () => {
        // Generate PDF with front and back of card
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [90, 130] // Card-size format
            });
            
            const playerName = player.name || `${player.firstName} ${player.lastName}`;
            const teamColorHex = teamColor.replace('#', '');
            const r = parseInt(teamColorHex.substr(0, 2), 16);
            const g = parseInt(teamColorHex.substr(2, 2), 16);
            const b = parseInt(teamColorHex.substr(4, 2), 16);
            
            // === FRONT OF CARD ===
            // Header with team color
            pdf.setFillColor(r, g, b);
            pdf.rect(0, 0, 90, 35, 'F');
            
            // Player photo placeholder or initials
            pdf.setFillColor(255, 255, 255);
            pdf.circle(45, 40, 20, 'F');
            
            if (!player.photoUrl) {
                pdf.setFontSize(20);
                pdf.setTextColor(r, g, b);
                pdf.text(playerName.charAt(0).toUpperCase(), 45, 45, { align: 'center' });
            }
            
            // Jersey number badge
            pdf.setFillColor(r, g, b);
            pdf.circle(70, 55, 8, 'F');
            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            pdf.text(player.jerseyNumber || '?', 70, 58, { align: 'center' });
            
            // Player name
            pdf.setFontSize(14);
            pdf.setTextColor(r, g, b);
            pdf.text(playerName, 45, 70, { align: 'center', maxWidth: 80 });
            
            // Position
            pdf.setFontSize(10);
            pdf.setTextColor(100, 116, 139);
            pdf.text(player.position || 'Player', 45, 78, { align: 'center' });
            
            // Team name
            pdf.setFontSize(9);
            pdf.text(team?.name || 'Team', 45, 85, { align: 'center' });
            
            // Social media icons (text representation)
            let socialY = 95;
            if (player.socialMedia) {
                const socials = [];
                if (player.socialMedia.instagram) socials.push(`@${player.socialMedia.instagram}`);
                if (player.socialMedia.twitter) socials.push(`@${player.socialMedia.twitter}`);
                if (socials.length > 0) {
                    pdf.setFontSize(7);
                    pdf.setTextColor(150, 150, 150);
                    pdf.text(socials.join(' • '), 45, socialY, { align: 'center', maxWidth: 80 });
                }
            }
            
            // "Flip to see bio" text
            pdf.setFontSize(6);
            pdf.setTextColor(180, 180, 180);
            pdf.text('(See back for player bio)', 45, 120, { align: 'center' });
            
            // === BACK OF CARD (new page) ===
            pdf.addPage([90, 130]);
            
            // Header
            pdf.setFillColor(248, 250, 252);
            pdf.rect(0, 0, 90, 130, 'F');
            
            // Title
            pdf.setFontSize(12);
            pdf.setTextColor(r, g, b);
            pdf.text(playerName, 45, 15, { align: 'center', maxWidth: 80 });
            
            pdf.setFontSize(8);
            pdf.setTextColor(100, 116, 139);
            pdf.text('Player Bio', 45, 22, { align: 'center' });
            
            // Line separator
            pdf.setDrawColor(200, 200, 200);
            pdf.line(10, 26, 80, 26);
            
            let yPos = 35;
            
            // High School
            if (player.lacrosseHistory?.highSchool?.teamName) {
                pdf.setFontSize(7);
                pdf.setTextColor(71, 85, 105);
                pdf.text('HIGH SCHOOL', 10, yPos);
                yPos += 5;
                pdf.setFontSize(9);
                pdf.setTextColor(51, 65, 85);
                const hsText = `${player.lacrosseHistory.highSchool.teamName}${player.lacrosseHistory.highSchool.graduationYear ? ` '${player.lacrosseHistory.highSchool.graduationYear.toString().slice(-2)}` : ''}`;
                pdf.text(hsText, 10, yPos, { maxWidth: 70 });
                yPos += 10;
            }
            
            // College
            if (player.lacrosseHistory?.college?.teamName) {
                pdf.setFontSize(7);
                pdf.setTextColor(71, 85, 105);
                pdf.text('COLLEGE', 10, yPos);
                yPos += 5;
                pdf.setFontSize(9);
                pdf.setTextColor(51, 65, 85);
                const colText = `${player.lacrosseHistory.college.teamName}${player.lacrosseHistory.college.graduationYear ? ` '${player.lacrosseHistory.college.graduationYear.toString().slice(-2)}` : ''}`;
                pdf.text(colText, 10, yPos, { maxWidth: 70 });
                yPos += 10;
            }
            
            // Post-Grad Teams
            if (player.lacrosseHistory?.postGrad?.length > 0) {
                pdf.setFontSize(7);
                pdf.setTextColor(71, 85, 105);
                pdf.text('POST-GRAD TEAMS', 10, yPos);
                yPos += 5;
                pdf.setFontSize(9);
                pdf.setTextColor(51, 65, 85);
                player.lacrosseHistory.postGrad.forEach(t => {
                    pdf.text(`${t.teamName} (${t.years})`, 10, yPos, { maxWidth: 70 });
                    yPos += 5;
                });
                yPos += 5;
            }
            
            // Fun Facts
            if (player.funFacts && yPos < 100) {
                pdf.setFontSize(7);
                pdf.setTextColor(71, 85, 105);
                pdf.text('FUN FACTS', 10, yPos);
                yPos += 5;
                pdf.setFontSize(8);
                pdf.setTextColor(51, 65, 85);
                const lines = pdf.splitTextToSize(player.funFacts, 70);
                pdf.text(lines.slice(0, 4), 10, yPos); // Limit to 4 lines
            }
            
            // Save PDF
            pdf.save(`${playerName.replace(/\s+/g, '_')}_player_card.pdf`);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback to print
            handlePrint();
        }
    };

    const teamColor = team?.style?.primaryColor || '#2563eb';
    const accentColor = team?.style?.accentColor || '#3b82f6';

    return (
        <div className="relative perspective-1000">
            {/* Card Container */}
            <div 
                ref={cardRef}
                className={`relative w-full transition-transform duration-500 transform-style-preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                style={{ 
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.6s'
                }}
                onClick={() => !isEditing && setIsFlipped(!isFlipped)}
            >
                {/* Front of Card */}
                <div 
                    className="w-full rounded-xl overflow-hidden shadow-lg"
                    style={{ 
                        backfaceVisibility: 'hidden',
                        background: `linear-gradient(135deg, ${teamColor}22 0%, white 50%, ${accentColor}22 100%)`
                    }}
                >
                    {/* Photo Section */}
                    <div 
                        className="relative h-48 bg-gradient-to-br overflow-hidden"
                        style={{ 
                            background: `linear-gradient(135deg, ${teamColor} 0%, ${accentColor} 100%)`
                        }}
                    >
                        {player.photoUrl ? (
                            <img 
                                src={fixGoogleDriveUrl(player.photoUrl)} 
                                alt={player.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-24 h-24 opacity-30 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                        )}
                        
                        {/* Team Logo - SMALLER (was w-20 h-20, now w-12 h-12) */}
                        <div className="absolute top-2 left-2">
                            <div 
                                className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-md"
                            >
                                {team?.style?.logoUrl ? (
                                    <img 
                                        src={fixGoogleDriveUrl(team.style.logoUrl)} 
                                        alt={team.name}
                                        className="w-full h-full object-contain p-0.5"
                                    />
                                ) : (
                                    <div 
                                        className="w-full h-full rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: teamColor }}
                                    >
                                        <span className="text-white font-bold text-sm">
                                            {team?.name?.charAt(0) || 'T'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Jersey Number */}
                        <div className="absolute bottom-2 right-2">
                            <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-md"
                                style={{ backgroundColor: teamColor }}
                            >
                                {player.jerseyNumber || '?'}
                            </div>
                        </div>

                        {/* Position Badge */}
                        <div className="absolute top-2 right-2">
                            <div 
                                className="px-2 py-1 bg-white/90 rounded-full text-xs font-bold shadow-sm"
                                style={{ color: teamColor }}
                            >
                                {player.position || 'Player'}
                            </div>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="p-4 bg-white">
                        <h3 
                            className="font-bold text-center text-lg mb-1 truncate"
                            style={{ color: teamColor }}
                        >
                            {player.name || `${player.firstName} ${player.lastName}`}
                        </h3>
                        <p className="text-center text-sm text-slate-500 mb-2">
                            {team?.name || 'Team'}
                        </p>
                        
                        {/* Social Media Icons */}
                        {player.socialMedia && Object.keys(player.socialMedia).some(k => player.socialMedia[k]) && (
                            <div className="flex justify-center gap-2 mt-2">
                                {player.socialMedia.instagram && (
                                    <a href={`https://instagram.com/${player.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-pink-100 rounded-full text-pink-600 hover:bg-pink-200" onClick={e => e.stopPropagation()}>
                                        {SocialIcons.instagram}
                                    </a>
                                )}
                                {player.socialMedia.twitter && (
                                    <a href={`https://twitter.com/${player.socialMedia.twitter}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-blue-100 rounded-full text-blue-500 hover:bg-blue-200" onClick={e => e.stopPropagation()}>
                                        {SocialIcons.twitter}
                                    </a>
                                )}
                                {player.socialMedia.tiktok && (
                                    <a href={`https://tiktok.com/@${player.socialMedia.tiktok}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-slate-100 rounded-full text-slate-700 hover:bg-slate-200" onClick={e => e.stopPropagation()}>
                                        {SocialIcons.tiktok}
                                    </a>
                                )}
                            </div>
                        )}
                        
                        <p className="text-center text-xs text-slate-400 mt-2">
                            Click to flip →
                        </p>
                    </div>
                </div>

                {/* Back of Card */}
                <div 
                    className="absolute inset-0 w-full rounded-xl overflow-hidden shadow-lg"
                    style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: `linear-gradient(135deg, ${teamColor}11 0%, #f8fafc 50%, ${accentColor}11 100%)`
                    }}
                >
                    <div className="p-4 h-full overflow-y-auto">
                        {/* Header */}
                        <div className="text-center mb-4 pb-3 border-b">
                            <h3 
                                className="font-bold text-lg"
                                style={{ color: teamColor }}
                            >
                                {player.name || `${player.firstName} ${player.lastName}`}
                            </h3>
                            <p className="text-sm text-slate-500">Player Bio</p>
                        </div>

                        {/* Lacrosse History */}
                        <div className="space-y-3 text-sm">
                            {player.lacrosseHistory?.highSchool?.teamName && (
                                <div>
                                    <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider">🏫 High School</div>
                                    <div className="text-slate-600">
                                        {player.lacrosseHistory.highSchool.teamName}
                                        {player.lacrosseHistory.highSchool.graduationYear && ` '${player.lacrosseHistory.highSchool.graduationYear.toString().slice(-2)}`}
                                    </div>
                                </div>
                            )}

                            {player.lacrosseHistory?.college?.teamName && (
                                <div>
                                    <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider">🎓 College</div>
                                    <div className="text-slate-600">
                                        {player.lacrosseHistory.college.teamName}
                                        {player.lacrosseHistory.college.graduationYear && ` '${player.lacrosseHistory.college.graduationYear.toString().slice(-2)}`}
                                    </div>
                                </div>
                            )}

                            {player.lacrosseHistory?.postGrad?.length > 0 && (
                                <div>
                                    <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider">🏆 Post-Grad Teams</div>
                                    <div className="text-slate-600">
                                        {player.lacrosseHistory.postGrad.map((t, i) => (
                                            <div key={i}>{t.teamName} ({t.years})</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {player.funFacts && (
                                <div>
                                    <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider">✨ Fun Facts</div>
                                    <div className="text-slate-600 text-xs">{player.funFacts}</div>
                                </div>
                            )}

                            {/* Social Media on Back */}
                            {player.socialMedia && Object.keys(player.socialMedia).some(k => player.socialMedia[k]) && (
                                <div>
                                    <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">📱 Social Media</div>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(player.socialMedia).map(([platform, handle]) => handle && (
                                            <a 
                                                key={platform}
                                                href={platform === 'instagram' ? `https://instagram.com/${handle}` : 
                                                      platform === 'twitter' ? `https://twitter.com/${handle}` :
                                                      platform === 'tiktok' ? `https://tiktok.com/@${handle}` :
                                                      platform === 'facebook' ? `https://facebook.com/${handle}` :
                                                      `https://linkedin.com/in/${handle}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                @{handle}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {!player.lacrosseHistory?.highSchool?.teamName && 
                             !player.lacrosseHistory?.college?.teamName && 
                             !player.funFacts && (
                                <div className="text-center text-slate-400 py-4">
                                    <p className="text-sm">No bio information yet</p>
                                    {canEdit && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                            className="mt-2 text-xs text-blue-600 hover:underline"
                                        >
                                            Add your info →
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <p className="text-center text-xs text-slate-400 mt-4">
                            ← Click to flip back
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); handlePrint(); }}
                    className="p-1.5 bg-white rounded-full shadow-md hover:bg-slate-50 text-slate-600"
                    title="Print Card"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                </button>
                {canEdit && showEditButton && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="p-1.5 bg-white rounded-full shadow-md hover:bg-slate-50 text-blue-600"
                        title="Edit Profile"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <PlayerProfileEditor 
                    player={player}
                    onSave={(updates) => {
                        if (onUpdate) onUpdate(player.id, updates);
                        setIsEditing(false);
                    }}
                    onClose={() => setIsEditing(false)}
                />
            )}
        </div>
    );
};

// Player Profile Editor Modal
const PlayerProfileEditor = ({ player, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        lacrosseHistory: {
            highSchool: {
                teamName: player.lacrosseHistory?.highSchool?.teamName || '',
                graduationYear: player.lacrosseHistory?.highSchool?.graduationYear || ''
            },
            college: {
                teamName: player.lacrosseHistory?.college?.teamName || '',
                graduationYear: player.lacrosseHistory?.college?.graduationYear || ''
            },
            postGrad: player.lacrosseHistory?.postGrad || []
        },
        funFacts: player.funFacts || '',
        socialMedia: {
            instagram: player.socialMedia?.instagram || '',
            twitter: player.socialMedia?.twitter || '',
            tiktok: player.socialMedia?.tiktok || '',
            facebook: player.socialMedia?.facebook || '',
            linkedin: player.socialMedia?.linkedin || ''
        }
    });

    const addPostGradTeam = () => {
        setFormData(prev => ({
            ...prev,
            lacrosseHistory: {
                ...prev.lacrosseHistory,
                postGrad: [...prev.lacrosseHistory.postGrad, { teamName: '', years: '' }]
            }
        }));
    };

    const removePostGradTeam = (index) => {
        setFormData(prev => ({
            ...prev,
            lacrosseHistory: {
                ...prev.lacrosseHistory,
                postGrad: prev.lacrosseHistory.postGrad.filter((_, i) => i !== index)
            }
        }));
    };

    const updatePostGradTeam = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            lacrosseHistory: {
                ...prev.lacrosseHistory,
                postGrad: prev.lacrosseHistory.postGrad.map((t, i) => 
                    i === index ? { ...t, [field]: value } : t
                )
            }
        }));
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">Edit Player Profile</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* High School Section */}
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-2">🏫 High School Lacrosse</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">School/Team Name</label>
                                <input
                                    type="text"
                                    value={formData.lacrosseHistory.highSchool.teamName}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        lacrosseHistory: {
                                            ...prev.lacrosseHistory,
                                            highSchool: { ...prev.lacrosseHistory.highSchool, teamName: e.target.value }
                                        }
                                    }))}
                                    placeholder="e.g., Lincoln High School"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Graduation Year</label>
                                <input
                                    type="text"
                                    value={formData.lacrosseHistory.highSchool.graduationYear}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        lacrosseHistory: {
                                            ...prev.lacrosseHistory,
                                            highSchool: { ...prev.lacrosseHistory.highSchool, graduationYear: e.target.value }
                                        }
                                    }))}
                                    placeholder="e.g., 2018"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* College Section */}
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-2">🎓 College Lacrosse</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">College/Team Name</label>
                                <input
                                    type="text"
                                    value={formData.lacrosseHistory.college.teamName}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        lacrosseHistory: {
                                            ...prev.lacrosseHistory,
                                            college: { ...prev.lacrosseHistory.college, teamName: e.target.value }
                                        }
                                    }))}
                                    placeholder="e.g., Syracuse University"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Graduation Year</label>
                                <input
                                    type="text"
                                    value={formData.lacrosseHistory.college.graduationYear}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        lacrosseHistory: {
                                            ...prev.lacrosseHistory,
                                            college: { ...prev.lacrosseHistory.college, graduationYear: e.target.value }
                                        }
                                    }))}
                                    placeholder="e.g., 2022"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Post-Grad Teams */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-700">🏆 Post-Graduation Teams</h4>
                            <button
                                onClick={addPostGradTeam}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                + Add Team
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.lacrosseHistory.postGrad.map((team, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <input
                                        type="text"
                                        value={team.teamName}
                                        onChange={(e) => updatePostGradTeam(index, 'teamName', e.target.value)}
                                        placeholder="Team name"
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    />
                                    <input
                                        type="text"
                                        value={team.years}
                                        onChange={(e) => updatePostGradTeam(index, 'years', e.target.value)}
                                        placeholder="Years (e.g., 2022-2024)"
                                        className="w-32 px-3 py-2 border rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => removePostGradTeam(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            {formData.lacrosseHistory.postGrad.length === 0 && (
                                <p className="text-sm text-slate-400">No post-grad teams added</p>
                            )}
                        </div>
                    </div>

                    {/* Fun Facts */}
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-2">✨ Fun Facts</h4>
                        <textarea
                            value={formData.funFacts}
                            onChange={(e) => setFormData(prev => ({ ...prev, funFacts: e.target.value }))}
                            placeholder="Share something interesting about yourself..."
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                    </div>

                    {/* Social Media */}
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-2">📱 Social Media</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Instagram</label>
                                <div className="flex items-center">
                                    <span className="text-slate-400 text-sm mr-1">@</span>
                                    <input
                                        type="text"
                                        value={formData.socialMedia.instagram}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                                        }))}
                                        placeholder="username"
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Twitter/X</label>
                                <div className="flex items-center">
                                    <span className="text-slate-400 text-sm mr-1">@</span>
                                    <input
                                        type="text"
                                        value={formData.socialMedia.twitter}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                                        }))}
                                        placeholder="username"
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">TikTok</label>
                                <div className="flex items-center">
                                    <span className="text-slate-400 text-sm mr-1">@</span>
                                    <input
                                        type="text"
                                        value={formData.socialMedia.tiktok}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            socialMedia: { ...prev.socialMedia, tiktok: e.target.value }
                                        }))}
                                        placeholder="username"
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">Facebook</label>
                                <input
                                    type="text"
                                    value={formData.socialMedia.facebook}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                                    }))}
                                    placeholder="profile name or ID"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlayerCard;
export { PlayerProfileEditor };
