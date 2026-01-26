import React, { useState, useEffect } from 'react';
import { getFullImageUrl } from '../../utils/imageUtils';
import { getSportConfig } from '../../config/sportsConfig';

/**
 * TeamAdminTab - Comprehensive team administration for coaches/admins
 * Sections: Players, Payments, Availability
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
    
    // Payment state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [paymentFilter, setPaymentFilter] = useState('all');
    
    // Availability state
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const sportConfig = getSportConfig(sportType);
    
    const sections = [
        { id: 'players', label: 'Manage Players', icon: '👥' },
        { id: 'payments', label: 'Payment Tracking', icon: '💳' },
        { id: 'availability', label: 'Availability', icon: '📋' }
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

    // Fetch available users for adding to team
    const fetchAvailableUsers = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/users`);
            if (response.ok) {
                const allUsers = await response.json();
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

    // Update player payment
    const updatePlayerPayment = async (playerId, paymentData) => {
        setSaving(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/player/${playerId}/payment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            
            if (response.ok) {
                setMessage('✅ Payment updated!');
                fetchPlayers();
                setShowPaymentModal(false);
                setSelectedPlayer(null);
            } else {
                setMessage('❌ Failed to update payment');
            }
        } catch (error) {
            setMessage('❌ Error updating payment');
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

    // Calculate stats
    const paymentStats = {
        total: players.length,
        paid: players.filter(p => p.paymentStatus === 'paid').length,
        partial: players.filter(p => p.paymentStatus === 'partial').length,
        unpaid: players.filter(p => !p.paymentStatus || p.paymentStatus === 'unpaid').length,
        totalPaid: players.reduce((sum, p) => sum + (p.amountPaid || 0), 0)
    };

    const availabilityStats = {
        active: players.filter(p => !p.availability || p.availability === 'active').length,
        injured: players.filter(p => p.availability === 'injured').length,
        inactive: players.filter(p => p.availability === 'inactive').length,
        leave: players.filter(p => p.availability === 'leave').length
    };

    // Filter players
    const getFilteredPlayers = () => {
        let filtered = [...players];
        if (activeSection === 'payments' && paymentFilter !== 'all') {
            filtered = filtered.filter(p => (p.paymentStatus || 'unpaid') === paymentFilter);
        }
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
    const getPaymentBadge = (status) => {
        const badges = {
            paid: <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Paid</span>,
            partial: <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Partial</span>,
            unpaid: <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Unpaid</span>
        };
        return badges[status] || badges.unpaid;
    };

    const getAvailabilityBadge = (availability) => {
        const badges = {
            active: <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>,
            injured: <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Injured</span>,
            leave: <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">On Leave</span>,
            inactive: <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs font-medium">Inactive</span>
        };
        return badges[availability] || badges.active;
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
                    <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                        <span className="font-bold">{paymentStats.paid}</span> paid
                    </div>
                    <div className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg">
                        <span className="font-bold">{paymentStats.unpaid}</span> unpaid
                    </div>
                    <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                        <span className="font-bold">{availabilityStats.active}</span> active
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
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Email</th>
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
                                                        <div className="text-xs text-slate-500">#{player.jerseyNumber || '?'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">{player.position || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{player.email || '-'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    {getAvailabilityBadge(player.availability)}
                                                    {getPaymentBadge(player.paymentStatus)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingPlayer(player);
                                                            setShowEditModal(true);
                                                        }}
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

            {/* PAYMENTS SECTION */}
            {activeSection === 'payments' && (
                <div className="space-y-4">
                    {/* Payment Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-slate-800">{paymentStats.total}</div>
                            <div className="text-xs text-slate-500">Total Players</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{paymentStats.paid}</div>
                            <div className="text-xs text-green-700">Paid</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{paymentStats.partial}</div>
                            <div className="text-xs text-yellow-700">Partial</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{paymentStats.unpaid}</div>
                            <div className="text-xs text-red-700">Unpaid</div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Show:</span>
                        {['all', 'paid', 'partial', 'unpaid'].map(f => (
                            <button
                                key={f}
                                onClick={() => setPaymentFilter(f)}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                    paymentFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Payment List */}
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
                                            <div className="text-xs text-slate-500">
                                                {player.amountPaid > 0 && `$${player.amountPaid} paid`}
                                                {player.amountOwed > 0 && ` / $${player.amountOwed} owed`}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getPaymentBadge(player.paymentStatus)}
                                        <button
                                            onClick={() => {
                                                setSelectedPlayer(player);
                                                setShowPaymentModal(true);
                                            }}
                                            className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => {
                                const unpaidEmails = players.filter(p => (!p.paymentStatus || p.paymentStatus === 'unpaid') && p.email).map(p => p.email).join(', ');
                                navigator.clipboard.writeText(unpaidEmails);
                                setMessage('✅ Unpaid player emails copied!');
                                setTimeout(() => setMessage(''), 3000);
                            }}
                            className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                        >
                            📋 Copy Unpaid Emails
                        </button>
                        <button
                            onClick={() => {
                                const csvContent = "Name,Email,Status,Paid,Owed,Notes\n" + 
                                    players.map(p => `"${p.name}","${p.email || ''}","${p.paymentStatus || 'unpaid'}","${p.amountPaid || 0}","${p.amountOwed || 0}","${p.paymentNotes || ''}"`).join("\n");
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${team.name}_payments.csv`;
                                a.click();
                                setMessage('✅ Payment report exported!');
                                setTimeout(() => setMessage(''), 3000);
                            }}
                            className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                        >
                            📥 Export CSV
                        </button>
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
                                            <div className="text-xs text-slate-500">#{player.jerseyNumber || '?'} • {player.position || 'Player'}</div>
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

            {/* EDIT PLAYER MODAL */}
            {showEditModal && editingPlayer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="font-bold text-lg">Edit Player</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={editingPlayer.name || ''}
                                        onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Jersey #</label>
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
                                        value={typeof editingPlayer.position === 'object' ? editingPlayer.position?.name || '' : editingPlayer.position || ''}
                                        onChange={(e) => setEditingPlayer({...editingPlayer, position: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    >
                                        <option value="">Select Position</option>
                                        {sportConfig.positions.map(pos => (
                                            <option key={pos.id} value={pos.name}>{pos.name}</option>
                                        ))}
                                    </select>
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
                                    />
                                </div>
                            </div>
                            
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-slate-700 mb-3">Emergency Contact</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={editingPlayer.emergencyContactName || ''}
                                            onChange={(e) => setEditingPlayer({...editingPlayer, emergencyContactName: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={editingPlayer.emergencyContactPhone || ''}
                                            onChange={(e) => setEditingPlayer({...editingPlayer, emergencyContactPhone: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

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
                                        jerseyNumber: editingPlayer.jerseyNumber,
                                        position: editingPlayer.position,
                                        emergencyContactName: editingPlayer.emergencyContactName,
                                        emergencyContactPhone: editingPlayer.emergencyContactPhone
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

            {/* PAYMENT MODAL */}
            {showPaymentModal && selectedPlayer && (
                <PaymentModal
                    player={selectedPlayer}
                    onClose={() => { setShowPaymentModal(false); setSelectedPlayer(null); }}
                    onSave={updatePlayerPayment}
                    saving={saving}
                />
            )}
        </div>
    );
};

// Payment Modal Component
const PaymentModal = ({ player, onClose, onSave, saving }) => {
    const [paymentStatus, setPaymentStatus] = useState(player.paymentStatus || 'unpaid');
    const [amountPaid, setAmountPaid] = useState(player.amountPaid || 0);
    const [amountOwed, setAmountOwed] = useState(player.amountOwed || 0);
    const [paymentNotes, setPaymentNotes] = useState(player.paymentNotes || '');
    const [paymentDate, setPaymentDate] = useState(player.lastPaymentDate || '');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold">Payment - {player.name}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount Owed ($)</label>
                            <input
                                type="number"
                                value={amountOwed}
                                onChange={(e) => setAmountOwed(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid ($)</label>
                            <input
                                type="number"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Payment Date</label>
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            rows={2}
                            placeholder="Venmo, check #, etc."
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave(player.id, { paymentStatus, amountPaid: parseFloat(amountPaid) || 0, amountOwed: parseFloat(amountOwed) || 0, paymentNotes, lastPaymentDate: paymentDate })}
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamAdminTab;
