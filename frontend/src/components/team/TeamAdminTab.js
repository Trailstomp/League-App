import React, { useState, useEffect } from 'react';
import { getFullImageUrl } from '../../utils/imageUtils';
import { getSportConfig } from '../../config/sportsConfig';
import TeamSettingsTab from './TeamSettingsTab';
import TeamFinanceTab from './TeamFinanceTab';
import TeamAdminHub from './TeamAdminHub';
import TeamLocationsManager from './TeamLocationsManager';
import EmailComposer from '../managers/EmailComposer';
import FileManager from '../managers/FileManager';

/**
 * TeamAdminTab - Comprehensive team administration for coaches/admins
 * Sections: Players, Recruiting, Roster Hub, Finance, Settings
 */
const TeamAdminTab = ({ team, currentUser, onTeamUpdate, sportType = 'lacrosse' }) => {
    const [activeSection, setActiveSection] = useState('players');
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    
    // Player management state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [addPlayerMode, setAddPlayerMode] = useState('search');
    const [newPlayerData, setNewPlayerData] = useState({
        name: '',
        email: '',
        phone: '',
        jerseyNumber: '',
        position: ''
    });
    
    // Recruiting state
    const [pendingRequests, setPendingRequests] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [sentInvites, setSentInvites] = useState([]);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const sportConfig = getSportConfig(sportType);
    
    const sections = [
        { id: 'players', label: 'Players', icon: '👥' },
        { id: 'recruiting', label: 'Recruiting', icon: '📨' },
        { id: 'email', label: 'Email', icon: '📧' },
        { id: 'documents', label: 'Documents', icon: '📁' },
        { id: 'locations', label: 'Locations', icon: '📍' },
        { id: 'roster-hub', label: 'Roster Hub', icon: '📊' },
        { id: 'finance', label: 'Finance', icon: '💰' },
        { id: 'settings', label: 'Settings', icon: '⚙️' }
    ];

    // Fetch team players
    const fetchPlayers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/players`);
            if (response.ok) {
                const data = await response.json();
                setPlayers(data || []);
            }
        } catch (error) {
            console.error('Error fetching players:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch pending join requests
    const fetchPendingRequests = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/requests`);
            if (response.ok) {
                const data = await response.json();
                setPendingRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    // Fetch sent invites
    const fetchSentInvites = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/invites`);
            if (response.ok) {
                const data = await response.json();
                setSentInvites(data.invites || []);
            }
        } catch (error) {
            console.error('Error fetching invites:', error);
        }
    };

    // Fetch available users for adding to team
    const fetchAvailableUsers = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/users`);
            if (response.ok) {
                const data = await response.json();
                const allUsers = data.users || data || [];
                const teamPlayerIds = players.map(p => p.id);
                const available = allUsers.filter(u => !teamPlayerIds.includes(u.id));
                setAvailableUsers(available);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        if (team?.id) {
            fetchPlayers();
            if (activeSection === 'recruiting') {
                fetchPendingRequests();
                fetchSentInvites();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team?.id, activeSection]);

    useEffect(() => {
        if (showAddModal) {
            fetchAvailableUsers();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAddModal]);

    // Add player to team
    const handleAddPlayer = async (userId) => {
        setSaving(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            
            if (response.ok) {
                setMessage('✅ Player added to team!');
                setShowAddModal(false);
                fetchPlayers();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to add player'}`);
            }
        } catch (error) {
            setMessage('❌ Error adding player');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Create a new player and add to team
    const handleCreateNewPlayer = async () => {
        if (!newPlayerData.name.trim()) {
            setMessage('❌ Player name is required');
            return;
        }
        
        setSaving(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/create-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPlayerData.name.trim(),
                    email: newPlayerData.email.trim(),
                    phone: newPlayerData.phone.trim(),
                    jerseyNumber: newPlayerData.jerseyNumber.trim(),
                    position: newPlayerData.position.trim()
                })
            });
            
            if (response.ok) {
                setMessage('✅ New player created and added to team!');
                setShowAddModal(false);
                setNewPlayerData({ name: '', email: '', phone: '', jerseyNumber: '', position: '' });
                setAddPlayerMode('search');
                fetchPlayers();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to create player'}`);
            }
        } catch (error) {
            setMessage('❌ Error creating player');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Remove player from team
    const handleRemovePlayer = async (playerId) => {
        if (!window.confirm('Remove this player from the team?')) return;
        
        setSaving(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/player/${playerId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setMessage('✅ Player removed from team');
                fetchPlayers();
            } else {
                setMessage('❌ Failed to remove player');
            }
        } catch (error) {
            setMessage('❌ Error removing player');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Handle photo upload
    const handlePhotoUpload = async (file) => {
        if (!file) return null;
        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(`${backendUrl}/api/upload/image`, {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                const data = await response.json();
                return data.url || data.filename;
            }
        } catch (error) {
            console.error('Photo upload error:', error);
        } finally {
            setUploadingPhoto(false);
        }
        return null;
    };

    // Update player details
    const handleUpdatePlayer = async (playerId, updateData) => {
        setSaving(true);
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
                fetchPlayers();
            } else {
                setMessage('❌ Failed to update player');
            }
        } catch (error) {
            setMessage('❌ Error updating player');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Update player availability
    const updatePlayerAvailability = async (playerId, availability) => {
        setSaving(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/player/${playerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availability })
            });
            
            if (response.ok) {
                setMessage('✅ Availability updated!');
                fetchPlayers();
            } else {
                setMessage('❌ Failed to update');
            }
        } catch (error) {
            setMessage('❌ Error updating');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Handle join request (approve/reject)
    const handleJoinRequest = async (requestId, action) => {
        setSaving(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/requests/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }) // 'approve' or 'reject'
            });
            
            if (response.ok) {
                setMessage(action === 'approve' ? '✅ Player approved and added to team!' : '✅ Request declined');
                fetchPendingRequests();
                if (action === 'approve') fetchPlayers();
            } else {
                setMessage('❌ Failed to process request');
            }
        } catch (error) {
            setMessage('❌ Error processing request');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Send invite
    const handleSendInvite = async () => {
        if (!inviteEmail) {
            setMessage('❌ Please enter an email address');
            return;
        }
        
        setSaving(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: inviteEmail,
                    message: inviteMessage,
                    invitedBy: currentUser?.id
                })
            });
            
            if (response.ok) {
                setMessage('✅ Invite sent!');
                setInviteEmail('');
                setInviteMessage('');
                fetchSentInvites();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to send invite'}`);
            }
        } catch (error) {
            setMessage('❌ Error sending invite');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Copy team invite link
    const copyInviteLink = () => {
        const link = `${window.location.origin}/join/${team.id}`;
        navigator.clipboard.writeText(link);
        setMessage('✅ Invite link copied to clipboard!');
        setTimeout(() => setMessage(''), 3000);
    };

    const filteredUsers = availableUsers.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Open edit modal with full player data
    const openEditModal = (player) => {
        setEditingPlayer({
            ...player,
            jerseyNumber: player.jerseyNumber || player.playerNumber || '',
            position: typeof player.position === 'object' ? player.position?.name : player.position || '',
            jerseySize: player.jerseySize || '',
            funFacts: player.funFacts || '',
            lacrosseHistory: {
                highSchool: { teamName: player.lacrosseHistory?.highSchool?.teamName || '', graduationYear: player.lacrosseHistory?.highSchool?.graduationYear || '' },
                college: { teamName: player.lacrosseHistory?.college?.teamName || '', graduationYear: player.lacrosseHistory?.college?.graduationYear || '' },
                postGrad: player.lacrosseHistory?.postGrad || []
            },
            socialMedia: {
                instagram: player.socialMedia?.instagram || '',
                twitter: player.socialMedia?.twitter || '',
                tiktok: player.socialMedia?.tiktok || '',
                facebook: player.socialMedia?.facebook || '',
                linkedin: player.socialMedia?.linkedin || ''
            },
            emergencyContactName: player.emergencyContactName || player.emergencyContact?.name || '',
            emergencyContactPhone: player.emergencyContactPhone || player.emergencyContact?.phone || '',
            emergencyContactRelationship: player.emergencyContactRelationship || player.emergencyContact?.relationship || ''
        });
        setShowEditModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Team Admin</h2>
                    <p className="text-slate-500 text-sm">{players.length} players on roster</p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Section Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-1">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                                activeSection === section.id
                                    ? 'bg-white border border-b-white border-slate-200 text-blue-600 -mb-px'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <span className="mr-1.5">{section.icon}</span>
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* PLAYERS SECTION */}
            {activeSection === 'players' && (
                <div className="space-y-4">
                    {/* Action Bar */}
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-600">Add, edit, or remove players from your team roster.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Player
                        </button>
                    </div>

                    {/* Players Table */}
                    <div className="bg-white border rounded-lg overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : players.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <p className="text-lg mb-2">No players on roster</p>
                                <p className="text-sm">Click &quot;Add Player&quot; to add your first team member.</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Player</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">Position</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Contact</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Availability</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {players.map(player => (
                                        <tr key={player.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                                                        {player.photoUrl ? (
                                                            <img src={getFullImageUrl(player.photoUrl)} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-sm">
                                                                {player.name?.charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-800">{player.name}</div>
                                                        <div className="text-xs text-slate-500">#{player.jerseyNumber || player.playerNumber || '?'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                                                {typeof player.position === 'object' ? player.position?.name || '-' : player.position || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                                                <div>{player.email || '-'}</div>
                                                {player.phone && <div className="text-xs text-slate-400">{player.phone}</div>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={player.availability || 'active'}
                                                    onChange={(e) => updatePlayerAvailability(player.id, e.target.value)}
                                                    disabled={saving}
                                                    className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer ${
                                                        player.availability === 'injured' ? 'bg-orange-100 text-orange-700' :
                                                        player.availability === 'leave' ? 'bg-purple-100 text-purple-700' :
                                                        player.availability === 'inactive' ? 'bg-slate-200 text-slate-600' :
                                                        'bg-green-100 text-green-700'
                                                    }`}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="injured">Injured</option>
                                                    <option value="leave">On Leave</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(player)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemovePlayer(player.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                        title="Remove"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* RECRUITING SECTION */}
            {activeSection === 'recruiting' && (
                <div className="space-y-6">
                    {/* Invite Link */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                        <h3 className="text-lg font-semibold mb-2">📨 Team Invite Link</h3>
                        <p className="text-blue-100 text-sm mb-4">Share this link to let players request to join your team.</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={`${window.location.origin}/join/${team.id}`}
                                readOnly
                                className="flex-1 px-3 py-2 rounded-lg bg-white/20 text-white placeholder-blue-200 border border-white/30"
                            />
                            <button
                                onClick={copyInviteLink}
                                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50"
                            >
                                📋 Copy
                            </button>
                        </div>
                    </div>

                    {/* Send Direct Invite */}
                    <div className="bg-white border rounded-lg p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">✉️ Send Direct Invite</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="player@email.com"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Personal Message (Optional)</label>
                                <textarea
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                    placeholder="Hey! We'd love to have you join our team..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    rows={3}
                                />
                            </div>
                            <button
                                onClick={handleSendInvite}
                                disabled={saving || !inviteEmail}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Sending...' : 'Send Invite'}
                            </button>
                        </div>
                    </div>

                    {/* Pending Requests */}
                    <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b">
                            <h3 className="font-semibold text-slate-800">
                                📥 Pending Join Requests 
                                {pendingRequests.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                                        {pendingRequests.length}
                                    </span>
                                )}
                            </h3>
                        </div>
                        {pendingRequests.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">
                                No pending join requests
                            </div>
                        ) : (
                            <div className="divide-y">
                                {pendingRequests.map(request => (
                                    <div key={request.id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-slate-800">{request.name || request.email}</div>
                                            <div className="text-sm text-slate-500">{request.email}</div>
                                            {request.message && (
                                                <div className="text-sm text-slate-600 mt-1 italic">&quot;{request.message}&quot;</div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleJoinRequest(request.id, 'approve')}
                                                disabled={saving}
                                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                                            >
                                                ✓ Approve
                                            </button>
                                            <button
                                                onClick={() => handleJoinRequest(request.id, 'reject')}
                                                disabled={saving}
                                                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300 disabled:opacity-50"
                                            >
                                                ✕ Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sent Invites */}
                    <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b">
                            <h3 className="font-semibold text-slate-800">📤 Sent Invites</h3>
                        </div>
                        {sentInvites.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">
                                No invites sent yet
                            </div>
                        ) : (
                            <div className="divide-y">
                                {sentInvites.map(invite => (
                                    <div key={invite.id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-slate-800">{invite.email}</div>
                                            <div className="text-xs text-slate-500">
                                                Sent {invite.sentAt ? new Date(invite.sentAt).toLocaleDateString() : 'recently'}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            invite.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                            invite.status === 'expired' ? 'bg-slate-100 text-slate-600' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {invite.status || 'Pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ADD PLAYER MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Add Player to Team</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        
                        {/* Tab Selection */}
                        <div className="flex border-b">
                            <button
                                onClick={() => setAddPlayerMode('search')}
                                className={`flex-1 px-4 py-3 text-sm font-medium ${addPlayerMode === 'search' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Search Existing
                            </button>
                            <button
                                onClick={() => setAddPlayerMode('create')}
                                className={`flex-1 px-4 py-3 text-sm font-medium ${addPlayerMode === 'create' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Create New Player
                            </button>
                        </div>
                        
                        <div className="p-4">
                            {addPlayerMode === 'search' ? (
                                <>
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
                                                        disabled={saving}
                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-slate-500 py-4">No users available to add</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={newPlayerData.name}
                                            onChange={(e) => setNewPlayerData({...newPlayerData, name: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="Player's full name"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={newPlayerData.email}
                                                onChange={(e) => setNewPlayerData({...newPlayerData, email: e.target.value})}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                placeholder="player@email.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                            <input
                                                type="tel"
                                                value={newPlayerData.phone}
                                                onChange={(e) => setNewPlayerData({...newPlayerData, phone: e.target.value})}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                placeholder="(555) 123-4567"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Jersey Number</label>
                                            <input
                                                type="text"
                                                value={newPlayerData.jerseyNumber}
                                                onChange={(e) => setNewPlayerData({...newPlayerData, jerseyNumber: e.target.value})}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                placeholder="e.g., 7"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                                            <input
                                                type="text"
                                                value={newPlayerData.position}
                                                onChange={(e) => setNewPlayerData({...newPlayerData, position: e.target.value})}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                placeholder="e.g., Attack"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCreateNewPlayer}
                                        disabled={saving || !newPlayerData.name.trim()}
                                        className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? 'Creating...' : 'Create & Add Player'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT PLAYER MODAL - Full Fields */}
            {showEditModal && editingPlayer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-lg">Edit Player</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                        </div>
                        <div className="p-4 space-y-6">
                            {/* Photo & Basic Info */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 mb-2">
                                        {editingPlayer.photoUrl ? (
                                            <img src={getFullImageUrl(editingPlayer.photoUrl)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl font-bold">
                                                {editingPlayer.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <label className="block">
                                        <span className="text-xs text-blue-600 cursor-pointer hover:underline">
                                            {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const url = await handlePhotoUpload(e.target.files[0]);
                                                if (url) setEditingPlayer({...editingPlayer, photoUrl: url});
                                            }}
                                        />
                                    </label>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                        <input type="text" value={editingPlayer.name || ''} onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Jersey #</label>
                                        <input type="text" value={editingPlayer.jerseyNumber || ''} onChange={(e) => setEditingPlayer({...editingPlayer, jerseyNumber: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Jersey Size</label>
                                        <select value={editingPlayer.jerseySize || ''} onChange={(e) => setEditingPlayer({...editingPlayer, jerseySize: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                            <option value="">Select Size</option>
                                            <option value="YS">Youth Small</option>
                                            <option value="YM">Youth Medium</option>
                                            <option value="YL">Youth Large</option>
                                            <option value="S">Adult Small</option>
                                            <option value="M">Adult Medium</option>
                                            <option value="L">Adult Large</option>
                                            <option value="XL">Adult XL</option>
                                            <option value="2XL">Adult 2XL</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Position & Contact */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                                    <select value={editingPlayer.position || ''} onChange={(e) => setEditingPlayer({...editingPlayer, position: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                        <option value="">Select Position</option>
                                        {sportConfig.positions.map(pos => (
                                            <option key={pos.id} value={pos.name}>{pos.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" value={editingPlayer.email || ''} onChange={(e) => setEditingPlayer({...editingPlayer, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input type="tel" value={editingPlayer.phone || ''} onChange={(e) => setEditingPlayer({...editingPlayer, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
                                    <select value={editingPlayer.availability || 'active'} onChange={(e) => setEditingPlayer({...editingPlayer, availability: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                        <option value="active">Active</option>
                                        <option value="injured">Injured</option>
                                        <option value="leave">On Leave</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-slate-800 mb-3">🚨 Emergency Contact</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Name</label>
                                        <input type="text" value={editingPlayer.emergencyContactName || ''} onChange={(e) => setEditingPlayer({...editingPlayer, emergencyContactName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Phone</label>
                                        <input type="tel" value={editingPlayer.emergencyContactPhone || ''} onChange={(e) => setEditingPlayer({...editingPlayer, emergencyContactPhone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Relationship</label>
                                        <input type="text" value={editingPlayer.emergencyContactRelationship || ''} onChange={(e) => setEditingPlayer({...editingPlayer, emergencyContactRelationship: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Parent, Spouse, etc." />
                                    </div>
                                </div>
                            </div>

                            {/* Lacrosse History */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-slate-800 mb-3">🥍 Lacrosse History</h4>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm text-slate-600 mb-1">High School Team</label>
                                            <input type="text" value={editingPlayer.lacrosseHistory?.highSchool?.teamName || ''} onChange={(e) => setEditingPlayer({...editingPlayer, lacrosseHistory: {...editingPlayer.lacrosseHistory, highSchool: {...editingPlayer.lacrosseHistory?.highSchool, teamName: e.target.value}}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-600 mb-1">HS Grad Year</label>
                                            <input type="text" value={editingPlayer.lacrosseHistory?.highSchool?.graduationYear || ''} onChange={(e) => setEditingPlayer({...editingPlayer, lacrosseHistory: {...editingPlayer.lacrosseHistory, highSchool: {...editingPlayer.lacrosseHistory?.highSchool, graduationYear: e.target.value}}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="2020" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm text-slate-600 mb-1">College Team</label>
                                            <input type="text" value={editingPlayer.lacrosseHistory?.college?.teamName || ''} onChange={(e) => setEditingPlayer({...editingPlayer, lacrosseHistory: {...editingPlayer.lacrosseHistory, college: {...editingPlayer.lacrosseHistory?.college, teamName: e.target.value}}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-600 mb-1">College Grad Year</label>
                                            <input type="text" value={editingPlayer.lacrosseHistory?.college?.graduationYear || ''} onChange={(e) => setEditingPlayer({...editingPlayer, lacrosseHistory: {...editingPlayer.lacrosseHistory, college: {...editingPlayer.lacrosseHistory?.college, graduationYear: e.target.value}}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="2024" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Media */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-slate-800 mb-3">📱 Social Media</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Instagram</label>
                                        <input type="text" value={editingPlayer.socialMedia?.instagram || ''} onChange={(e) => setEditingPlayer({...editingPlayer, socialMedia: {...editingPlayer.socialMedia, instagram: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="@username" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Twitter/X</label>
                                        <input type="text" value={editingPlayer.socialMedia?.twitter || ''} onChange={(e) => setEditingPlayer({...editingPlayer, socialMedia: {...editingPlayer.socialMedia, twitter: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="@username" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">TikTok</label>
                                        <input type="text" value={editingPlayer.socialMedia?.tiktok || ''} onChange={(e) => setEditingPlayer({...editingPlayer, socialMedia: {...editingPlayer.socialMedia, tiktok: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="@username" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Facebook</label>
                                        <input type="text" value={editingPlayer.socialMedia?.facebook || ''} onChange={(e) => setEditingPlayer({...editingPlayer, socialMedia: {...editingPlayer.socialMedia, facebook: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Profile URL" />
                                    </div>
                                </div>
                            </div>

                            {/* Fun Facts */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-slate-800 mb-3">🎉 Fun Facts</h4>
                                <textarea
                                    value={editingPlayer.funFacts || ''}
                                    onChange={(e) => setEditingPlayer({...editingPlayer, funFacts: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    rows={3}
                                    placeholder="Hobbies, favorite teams, fun facts about the player..."
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
                                <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleUpdatePlayer(editingPlayer.id, {
                                        name: editingPlayer.name,
                                        email: editingPlayer.email,
                                        phone: editingPlayer.phone,
                                        jerseyNumber: editingPlayer.jerseyNumber,
                                        jerseySize: editingPlayer.jerseySize,
                                        position: editingPlayer.position,
                                        availability: editingPlayer.availability,
                                        photoUrl: editingPlayer.photoUrl,
                                        emergencyContactName: editingPlayer.emergencyContactName,
                                        emergencyContactPhone: editingPlayer.emergencyContactPhone,
                                        emergencyContactRelationship: editingPlayer.emergencyContactRelationship,
                                        lacrosseHistory: editingPlayer.lacrosseHistory,
                                        socialMedia: editingPlayer.socialMedia,
                                        funFacts: editingPlayer.funFacts
                                    })}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Locations Section */}
            {activeSection === 'locations' && (
                <TeamLocationsManager team={team} />
            )}

            {/* Roster Hub Section - Payment Tracker & Availability */}
            {activeSection === 'roster-hub' && (
                <TeamAdminHub team={team} currentUser={currentUser} onTeamUpdate={onTeamUpdate} />
            )}

            {/* Finance Section */}
            {activeSection === 'finance' && (
                <TeamFinanceTab team={team} currentUser={currentUser} />
            )}

            {/* Email Section */}
            {activeSection === 'email' && (
                <EmailComposer currentUser={currentUser} teamId={team.id} teamName={team.name} />
            )}

            {/* Documents Section */}
            {activeSection === 'documents' && (
                <FileManager currentUser={currentUser} teamId={team.id} teamName={team.name} />
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
                <TeamSettingsTab team={team} onTeamUpdate={onTeamUpdate} />
            )}
        </div>
    );
};

export default TeamAdminTab;
