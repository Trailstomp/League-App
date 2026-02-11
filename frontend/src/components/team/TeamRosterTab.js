import React, { useState, useEffect, useRef } from 'react';
import { fixGoogleDriveUrl, getFullImageUrl } from '../../utils/imageUtils';
import PlayerCardPopup from './PlayerCardPopup';
import jsPDF from 'jspdf';
import { getSportConfig } from '../../config/sportsConfig';

/**
 * TeamRosterTab - Displays team roster with player cards and management controls
 */
const TeamRosterTab = ({ team, players = [], currentUser, sportType = 'lacrosse' }) => {
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [teamPlayers, setTeamPlayers] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const cardRef = useRef(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Get sport-specific configuration
    const sportConfig = getSportConfig(sportType);
    
    // Get sport-specific stat labels
    const getStatLabels = () => {
        if (sportType === 'volleyball') {
            return { primary: 'Kills', secondary: 'Aces', primaryKey: 'kills', secondaryKey: 'aces' };
        }
        return { primary: 'Goals', secondary: 'Assists', primaryKey: 'goals', secondaryKey: 'assists' };
    };
    const statLabels = getStatLabels();
    
    // Check if current user is a team admin or league admin
    const isTeamAdmin = currentUser && (
        currentUser.roles?.includes('admin') ||
        currentUser.roles?.includes('league_admin') ||
        (currentUser.roles?.includes('coach') && (
            currentUser.teamId === team.id ||
            currentUser.teamAssignments?.some(a => a.teamId === team.id)
        ))
    );
    
    // Fetch players directly from API to ensure we get multi-team players
    const fetchTeamPlayers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/players`);
            if (response.ok) {
                const data = await response.json();
                setTeamPlayers(data || []);
            } else {
                // Fallback to prop-based filtering
                const filtered = players.filter(player => 
                    player.teamId === team.id || 
                    player.teamAssignments?.some(ta => ta.teamId === team.id)
                );
                setTeamPlayers(filtered);
            }
        } catch (error) {
            console.error('Error fetching team players:', error);
            // Fallback to prop-based filtering
            const filtered = players.filter(player => 
                player.teamId === team.id || 
                player.teamAssignments?.some(ta => ta.teamId === team.id)
            );
            setTeamPlayers(filtered);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (team?.id) {
            fetchTeamPlayers();
            fetchCoaches();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team?.id, players]);

    const fetchCoaches = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/teams/${team.id}/coaches`);
            if (response.ok) {
                const data = await response.json();
                setCoaches(data.coaches || []);
            }
        } catch (e) {
            console.error('Error fetching coaches:', e);
        }
    };

    // Fetch available users for adding to team
    const fetchAvailableUsers = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/users`);
            if (response.ok) {
                const allUsers = await response.json();
                // Filter out users already on this team
                const teamPlayerIds = teamPlayers.map(p => p.id);
                const available = allUsers.filter(u => !teamPlayerIds.includes(u.id));
                setAvailableUsers(available);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        if (showAddModal) {
            fetchAvailableUsers();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAddModal]);

    // Get team-specific info for a player
    const getPlayerTeamInfo = (player) => {
        if (player.teamAssignments && player.teamAssignments.length > 0) {
            const assignment = player.teamAssignments.find(a => a.teamId === team.id);
            if (assignment) {
                return {
                    jerseyNumber: assignment.playerNumber || player.jerseyNumber,
                    position: assignment.position || player.position
                };
            }
        }
        return {
            jerseyNumber: player.jerseyNumber,
            position: player.position
        };
    };

    const openPlayerCard = (player) => {
        const teamInfo = getPlayerTeamInfo(player);
        setSelectedPlayer({
            ...player,
            jerseyNumber: teamInfo.jerseyNumber,
            position: teamInfo.position
        });
        setIsFlipped(false);
    };

    const closePlayerCard = () => {
        setSelectedPlayer(null);
        setIsFlipped(false);
    };

    const toggleFlip = () => {
        setIsFlipped(!isFlipped);
    };
    
    const handlePrint = () => {
        if (!selectedPlayer) return;
        const printContent = cardRef.current;
        if (printContent) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${selectedPlayer.name} - Player Card</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .card { border: 2px solid ${team?.style?.primaryColor || '#2563eb'}; border-radius: 16px; overflow: hidden; max-width: 350px; }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };
    
    const handleDownloadPDF = async (statsByYear = {}) => {
        if (!selectedPlayer) return;
        
        const teamColor = team?.style?.primaryColor || '#2563eb';
        const accentColor = team?.style?.accentColor || '#3b82f6';
        
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [90, 140]
        });
        
        // FRONT OF CARD
        // Background
        pdf.setFillColor(248, 250, 252);
        pdf.rect(0, 0, 90, 140, 'F');
        
        // Header bar
        pdf.setFillColor(parseInt(teamColor.slice(1,3), 16), parseInt(teamColor.slice(3,5), 16), parseInt(teamColor.slice(5,7), 16));
        pdf.rect(0, 0, 90, 10, 'F');
        
        // Team name in header
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(team?.name || 'Team', 45, 7, { align: 'center' });
        
        // Player placeholder area
        pdf.setFillColor(230, 230, 230);
        pdf.rect(5, 15, 80, 70, 'F');
        
        // Jersey number circle
        pdf.setFillColor(parseInt(teamColor.slice(1,3), 16), parseInt(teamColor.slice(3,5), 16), parseInt(teamColor.slice(5,7), 16));
        pdf.circle(75, 75, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.text(String(selectedPlayer.jerseyNumber || '?'), 75, 78, { align: 'center' });
        
        // Player name
        pdf.setTextColor(parseInt(teamColor.slice(1,3), 16), parseInt(teamColor.slice(3,5), 16), parseInt(teamColor.slice(5,7), 16));
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(selectedPlayer.name || 'Player', 45, 100, { align: 'center' });
        
        // Position badge
        pdf.setFillColor(parseInt(accentColor.slice(1,3), 16), parseInt(accentColor.slice(3,5), 16), parseInt(accentColor.slice(5,7), 16));
        const posText = selectedPlayer.position || 'Player';
        const posWidth = pdf.getTextWidth(posText) + 10;
        pdf.roundedRect(45 - posWidth/2, 105, posWidth, 8, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.text(posText, 45, 110, { align: 'center' });
        
        // Footer bar
        pdf.setFillColor(parseInt(accentColor.slice(1,3), 16), parseInt(accentColor.slice(3,5), 16), parseInt(accentColor.slice(5,7), 16));
        pdf.rect(0, 137, 90, 3, 'F');
        
        // BACK OF CARD - Add new page
        pdf.addPage([90, 140]);
        
        // Background
        pdf.setFillColor(248, 250, 252);
        pdf.rect(0, 0, 90, 140, 'F');
        
        // Header bar
        pdf.setFillColor(parseInt(teamColor.slice(1,3), 16), parseInt(teamColor.slice(3,5), 16), parseInt(teamColor.slice(5,7), 16));
        pdf.rect(0, 0, 90, 10, 'F');
        
        // Header text
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Player Bio & Stats', 45, 7, { align: 'center' });
        
        // Player name and number
        pdf.setTextColor(parseInt(teamColor.slice(1,3), 16), parseInt(teamColor.slice(3,5), 16), parseInt(teamColor.slice(5,7), 16));
        pdf.setFontSize(12);
        pdf.text(selectedPlayer.name || 'Player', 5, 18);
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`#${selectedPlayer.jerseyNumber || '?'} • ${selectedPlayer.position || 'Player'}`, 5, 24);
        
        let yPos = 32;
        
        // Current season stats - sport-specific
        const hasPrimaryStats = (selectedPlayer[statLabels.primaryKey] || 0) > 0 || (selectedPlayer[statLabels.secondaryKey] || 0) > 0;
        if (hasPrimaryStats) {
            pdf.setFillColor(240, 245, 255);
            pdf.rect(5, yPos, 80, 20, 'F');
            pdf.setTextColor(parseInt(teamColor.slice(1,3), 16), parseInt(teamColor.slice(3,5), 16), parseInt(teamColor.slice(5,7), 16));
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text('CURRENT SEASON', 45, yPos + 5, { align: 'center' });
            pdf.setFontSize(10);
            const primaryVal = selectedPlayer[statLabels.primaryKey] || 0;
            const secondaryVal = selectedPlayer[statLabels.secondaryKey] || 0;
            pdf.text(`${primaryVal} ${statLabels.primary.charAt(0)}`, 20, yPos + 14, { align: 'center' });
            pdf.text(`${secondaryVal} ${statLabels.secondary.charAt(0)}`, 45, yPos + 14, { align: 'center' });
            pdf.text(`${primaryVal + secondaryVal} Pts`, 70, yPos + 14, { align: 'center' });
            yPos += 25;
        }
        
        // Stats by year - sport-specific
        if (statsByYear && Object.keys(statsByYear).length > 0) {
            pdf.setTextColor(80, 80, 80);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text('CAREER STATS BY YEAR', 5, yPos);
            yPos += 5;
            
            Object.keys(statsByYear).sort().reverse().slice(0, 4).forEach(year => {
                const yearStats = statsByYear[year];
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(8);
                const primaryVal = yearStats[statLabels.primaryKey] || 0;
                const secondaryVal = yearStats[statLabels.secondaryKey] || 0;
                pdf.text(`${year}: ${primaryVal}${statLabels.primary.charAt(0)}, ${secondaryVal}${statLabels.secondary.charAt(0)}, ${yearStats.gamesPlayed || 0}GP`, 5, yPos);
                yPos += 5;
            });
            yPos += 3;
        }
        
        // Bio info
        pdf.setTextColor(80, 80, 80);
        pdf.setFontSize(8);
        
        if (selectedPlayer.lacrosseHistory?.highSchool?.teamName) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('High School:', 5, yPos);
            pdf.setFont('helvetica', 'normal');
            pdf.text(selectedPlayer.lacrosseHistory.highSchool.teamName, 30, yPos);
            yPos += 6;
        }
        
        if (selectedPlayer.lacrosseHistory?.college?.teamName) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('College:', 5, yPos);
            pdf.setFont('helvetica', 'normal');
            pdf.text(selectedPlayer.lacrosseHistory.college.teamName, 22, yPos);
            yPos += 6;
        }
        
        if (selectedPlayer.funFacts) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Fun Facts:', 5, yPos);
            yPos += 4;
            pdf.setFont('helvetica', 'normal');
            const lines = pdf.splitTextToSize(selectedPlayer.funFacts, 80);
            lines.slice(0, 3).forEach(line => {
                pdf.text(line, 5, yPos);
                yPos += 4;
            });
        }
        
        // Footer bar
        pdf.setFillColor(parseInt(accentColor.slice(1,3), 16), parseInt(accentColor.slice(3,5), 16), parseInt(accentColor.slice(5,7), 16));
        pdf.rect(0, 137, 90, 3, 'F');
        
        // Save the PDF
        pdf.save(`${selectedPlayer.name.replace(/\s+/g, '_')}_player_card.pdf`);
    };

    // Add player to team
    const handleAddPlayer = async (userId) => {
        setActionLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            
            if (response.ok) {
                setMessage('✅ Player added to team!');
                setShowAddModal(false);
                fetchTeamPlayers();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to add player'}`);
            }
        } catch (error) {
            setMessage('❌ Error adding player');
        } finally {
            setActionLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Remove player from team
    const handleRemovePlayer = async (playerId) => {
        if (!window.confirm('Remove this player from the team?')) return;
        
        setActionLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/player/${playerId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setMessage('✅ Player removed from team');
                fetchTeamPlayers();
            } else {
                setMessage('❌ Failed to remove player');
            }
        } catch (error) {
            setMessage('❌ Error removing player');
        } finally {
            setActionLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Update player on team
    const handleUpdatePlayer = async (playerId, updateData) => {
        setActionLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/player/${playerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                setMessage('✅ Player updated!');
                setShowEditModal(false);
                setEditingPlayer(null);
                fetchTeamPlayers();
            } else {
                setMessage('❌ Failed to update player');
            }
        } catch (error) {
            setMessage('❌ Error updating player');
        } finally {
            setActionLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Filter available users by search
    const filteredUsers = availableUsers.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Message Toast */}
            {message && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                    message.startsWith('✅') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    {message}
                </div>
            )}
            
            <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Team Roster</h2>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-500">
                        {loading ? 'Loading...' : `${teamPlayers.length} player${teamPlayers.length !== 1 ? 's' : ''}`}
                    </div>
                    {isTeamAdmin && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
                            data-testid="add-player-btn"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Player
                        </button>
                    )}
                </div>
            </div>
            
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Coaching Staff Section */}
                    {coaches.length > 0 && (
                        <div className="mb-6" data-testid="coaches-section">
                            <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/></svg>
                                Coaching Staff
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                                {coaches.map(coach => (
                                    <div key={coach.id || coach.email} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl overflow-hidden shadow-sm border border-amber-200">
                                        <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden flex items-center justify-center">
                                            {coach.photoUrl ? (
                                                <img src={getFullImageUrl(coach.photoUrl)} alt={coach.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center">
                                                    <span className="text-2xl font-bold text-amber-700">{(coach.name || '?')[0]}</span>
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">Coach</div>
                                        </div>
                                        <div className="p-3 text-center">
                                            <div className="font-semibold text-slate-800 text-sm truncate">{coach.name}</div>
                                            {coach.title && <div className="text-xs text-amber-600 mt-0.5">{coach.title}</div>}
                                            {coach.email && <div className="text-xs text-slate-500 mt-0.5 truncate">{coach.email}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Players Section */}
                    {teamPlayers.length > 0 ? (
                        <>
                            {coaches.length > 0 && (
                                <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
                                    Players
                                </h3>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                                {teamPlayers.map((player) => {
                        const teamInfo = getPlayerTeamInfo(player);
                        return (
                            <div 
                                key={player.id}
                                className="group cursor-pointer"
                                onClick={() => openPlayerCard(player)}
                            >
                                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-blue-300">
                                    {/* Player Photo */}
                                    <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden flex items-start justify-center">
                                        {player.photoUrl ? (
                                            <>
                                                <img 
                                                    src={getFullImageUrl(player.photoUrl)} 
                                                    alt={player.name}
                                                    className="w-full h-auto max-h-full object-contain"
                                                    style={{ objectPosition: 'center top' }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className="w-full h-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300" style={{ display: 'none' }}>
                                                    <svg className="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                    </svg>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                                                <svg className="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                </svg>
                                            </div>
                                        )}
                                        
                                        {/* Position Badge */}
                                        {teamInfo.position && (
                                            <div className="absolute top-2 right-2">
                                                <span className="bg-white/90 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm" style={{ color: team?.style?.primaryColor || '#2563eb' }}>
                                                    {teamInfo.position.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Team Logo */}
                                        {team?.style?.logoUrl && (
                                            <div className="absolute top-2 left-2">
                                                <img 
                                                    src={fixGoogleDriveUrl(team.style.logoUrl)} 
                                                    alt={team.name}
                                                    className="w-8 h-8 rounded-full bg-white p-0.5 shadow-sm object-contain"
                                                    style={{ opacity: team.style?.logoOpacity || 1 }}
                                                    onError={(e) => e.target.style.display='none'}
                                                />
                                            </div>
                                        )}
                                        
                                        {/* Admin controls */}
                                        {isTeamAdmin && (
                                            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingPlayer({...player, ...teamInfo});
                                                        setShowEditModal(true);
                                                    }}
                                                    className="p-1.5 bg-white/90 rounded-full hover:bg-white shadow-sm"
                                                    title="Edit"
                                                >
                                                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemovePlayer(player.id);
                                                    }}
                                                    className="p-1.5 bg-white/90 rounded-full hover:bg-white shadow-sm"
                                                    title="Remove"
                                                >
                                                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Player Info */}
                                    <div className="p-2 sm:p-3">
                                        <div className="flex items-center gap-2">
                                            <span 
                                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                                style={{ backgroundColor: team?.style?.primaryColor || '#2563eb' }}
                                            >
                                                {teamInfo.jerseyNumber || '?'}
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-slate-800 text-sm truncate">{player.name}</h3>
                                                <p className="text-xs text-slate-500 truncate">{teamInfo.position || 'Player'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-xl">
                            <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-slate-600 font-medium">No players on this team yet</p>
                            <p className="text-sm text-slate-500 mt-1">Players will appear here once assigned to this team</p>
                            {isTeamAdmin && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    data-testid="add-first-player-btn"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-4"
                                >
                                    Add First Player
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Player Detail Modal */}
            {selectedPlayer && (
                <PlayerCardPopup 
                    player={selectedPlayer} 
                    team={team}
                    isFlipped={isFlipped}
                    onFlip={toggleFlip}
                    onClose={closePlayerCard}
                    onPrint={handlePrint}
                    onDownload={handleDownloadPDF}
                    sportType={sportType}
                />
            )}
            
            {/* Add Player Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Add Player to Team</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-3"
                            />
                            
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100">
                                            <div>
                                                <div className="font-medium text-slate-800">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                            <button
                                                onClick={() => handleAddPlayer(user.id)}
                                                disabled={actionLoading}
                                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-500 py-4">No available users found</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Edit Player Modal */}
            {showEditModal && editingPlayer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-bold text-lg text-slate-800">Edit Player</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            {/* Player Photo */}
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                                    {editingPlayer.photoUrl ? (
                                        <img src={editingPlayer.photoUrl} alt={editingPlayer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                                            {editingPlayer.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Photo URL</label>
                                    <input
                                        type="url"
                                        value={editingPlayer.photoUrl || ''}
                                        onChange={(e) => setEditingPlayer({...editingPlayer, photoUrl: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        value={editingPlayer.name || ''}
                                        onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editingPlayer.email || ''}
                                        onChange={(e) => setEditingPlayer({...editingPlayer, email: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={editingPlayer.phone || ''}
                                        onChange={(e) => setEditingPlayer({...editingPlayer, phone: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>

                            {/* Team-specific Info */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-slate-800 mb-3">Team Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Jersey Number</label>
                                        <input
                                            type="text"
                                            value={editingPlayer.jerseyNumber || ''}
                                            onChange={(e) => setEditingPlayer({...editingPlayer, jerseyNumber: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                                        <select
                                            value={editingPlayer.position || ''}
                                            onChange={(e) => setEditingPlayer({...editingPlayer, position: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        >
                                            <option value="">Select Position</option>
                                            <option value="Attack">Attack</option>
                                            <option value="Midfield">Midfield</option>
                                            <option value="Defense">Defense</option>
                                            <option value="Goalie">Goalie</option>
                                            <option value="FOGO">FOGO</option>
                                            <option value="LSM">LSM</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-slate-800 mb-3">Additional Info</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Graduation Year</label>
                                        <input
                                            type="text"
                                            value={editingPlayer.graduationYear || ''}
                                            onChange={(e) => setEditingPlayer({...editingPlayer, graduationYear: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="2025"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Height</label>
                                        <input
                                            type="text"
                                            value={editingPlayer.height || ''}
                                            onChange={(e) => setEditingPlayer({...editingPlayer, height: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="5'10&quot;"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Weight</label>
                                        <input
                                            type="text"
                                            value={editingPlayer.weight || ''}
                                            onChange={(e) => setEditingPlayer({...editingPlayer, weight: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="165 lbs"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">School</label>
                                        <input
                                            type="text"
                                            value={editingPlayer.school || ''}
                                            onChange={(e) => setEditingPlayer({...editingPlayer, school: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-slate-800 mb-3">Emergency Contact</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                                        <input
                                            type="text"
                                            value={editingPlayer.emergencyContactName || ''}
                                            onChange={(e) => setEditingPlayer({...editingPlayer, emergencyContactName: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                                        <input
                                            type="tel"
                                            value={editingPlayer.emergencyContactPhone || ''}
                                            onChange={(e) => setEditingPlayer({...editingPlayer, emergencyContactPhone: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleUpdatePlayer(editingPlayer.id, {
                                        name: editingPlayer.name,
                                        email: editingPlayer.email,
                                        phone: editingPlayer.phone,
                                        photoUrl: editingPlayer.photoUrl,
                                        jerseyNumber: editingPlayer.jerseyNumber,
                                        position: editingPlayer.position,
                                        graduationYear: editingPlayer.graduationYear,
                                        height: editingPlayer.height,
                                        weight: editingPlayer.weight,
                                        school: editingPlayer.school,
                                        emergencyContactName: editingPlayer.emergencyContactName,
                                        emergencyContactPhone: editingPlayer.emergencyContactPhone
                                    })}
                                    disabled={actionLoading || !editingPlayer.name?.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamRosterTab;
