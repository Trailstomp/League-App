import React, { useState, useEffect } from 'react';
import { getFullImageUrl } from '../../utils/imageUtils';
import { getSportConfig } from '../../config/sportsConfig';

/**
 * TeamAdminTab - Comprehensive team administration for coaches/admins
 * Sections: Players, Availability, Recruiting
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
    
    // Availability state
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    
    // Recruiting state
    const [pendingRequests, setPendingRequests] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [sentInvites, setSentInvites] = useState([]);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const sportConfig = getSportConfig(sportType);
    
    const sections = [
        { id: 'players', label: 'Manage Players', icon: '👥' },
        { id: 'availability', label: 'Availability', icon: '📋' },
        { id: 'recruiting', label: 'Recruiting', icon: '📨' }
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
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team?.id]);

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

    // Calculate availability stats
    const availabilityStats = {
        active: players.filter(p => !p.availability || p.availability === 'active').length,
        injured: players.filter(p => p.availability === 'injured').length,
        inactive: players.filter(p => p.availability === 'inactive').length,
        leave: players.filter(p => p.availability === 'leave').length
    };

    // Filter players
    const getFilteredPlayers = () => {
        let filtered = [...players];
        if (activeSection === 'availability' && availabilityFilter !== 'all') {
            filtered = filtered.filter(p => (p.availability || 'active') === availabilityFilter);
        }
        return filtered;
    };

    const filteredPlayers = getFilteredPlayers();
    const filteredUsers = availableUsers.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Badge helpers
    const getAvailabilityBadge = (availability) => {
        const badges = {
            active: <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>,
            injured: <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Injured</span>,
            leave: <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">On Leave</span>,
            inactive: <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs font-medium">Inactive</span>
        };
        return badges[availability] || badges.active;
    };

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
                
                {/* Quick Stats */}
                <div className="flex gap-3 text-sm">
                    <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                        <span className="font-bold">{availabilityStats.active}</span> active
                    </div>
                    <div className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg">
                        <span className="font-bold">{availabilityStats.injured}</span> injured
                    </div>
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
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
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
                                                {getAvailabilityBadge(player.availability)}
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

            {/* AVAILABILITY SECTION */}
            {activeSection === 'availability' && (
                <div className="space-y-4">
                    {/* Availability Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{availabilityStats.active}</div>
                            <div className="text-xs text-green-700">Active</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{availabilityStats.injured}</div>
                            <div className="text-xs text-orange-700">Injured</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">{availabilityStats.leave}</div>
                            <div className="text-xs text-purple-700">On Leave</div>
                        </div>
                        <div className="bg-slate-100 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-slate-600">{availabilityStats.inactive}</div>
                            <div className="text-xs text-slate-500">Inactive</div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Show:</span>
                        {['all', 'active', 'injured', 'leave', 'inactive'].map(f => (
                            <button
                                key={f}
                                onClick={() => setAvailabilityFilter(f)}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                    availabilityFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {f === 'leave' ? 'On Leave' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Availability List */}
                    <div className="bg-white border rounded-lg divide-y">
                        {filteredPlayers.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">No players match filter</div>
                        ) : (
                            filteredPlayers.map(player => (
                                <div key={player.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                                            {player.photoUrl ? (
                                                <img src={getFullImageUrl(player.photoUrl)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                                    {player.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-800">{player.name}</div>
                                            <div className="text-xs text-slate-500">#{player.jerseyNumber || player.playerNumber || '?'} • {typeof player.position === 'object' ? player.position?.name : player.position || 'Player'}</div>
                                        </div>
                                    </div>
                                    <select
                                        value={player.availability || 'active'}
                                        onChange={(e) => updatePlayerAvailability(player.id, e.target.value)}
                                        disabled={saving}
                                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                                    >
                                        <option value="active">Active</option>
                                        <option value="injured">Injured</option>
                                        <option value="leave">On Leave</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ADD PLAYER MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Add Player to Team</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
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
        </div>
    );
};

export default TeamAdminTab;
