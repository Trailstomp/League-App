import React, { useState, useEffect } from 'react';
import { getFullImageUrl } from '../../utils/imageUtils';

/**
 * TeamAdminHub - Centralized admin dashboard for team managers
 * Features: Player management, payment tracking, availability, quick actions
 */
const TeamAdminHub = ({ team, currentUser, onTeamUpdate }) => {
    const [activeSection, setActiveSection] = useState('overview');
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    const sections = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'payments', label: 'Payment Tracker', icon: '💰' },
        { id: 'availability', label: 'Availability', icon: '📅' },
        { id: 'roster-actions', label: 'Roster Actions', icon: '👥' }
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

    useEffect(() => {
        if (team?.id) {
            fetchPlayers();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team?.id]);

    // Update player payment status
    const updatePlayerPayment = async (playerId, paymentData) => {
        setSaving(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/player/${playerId}/payment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            
            if (response.ok) {
                setMessage('✅ Payment status updated!');
                fetchPlayers();
                setShowPaymentModal(false);
                setSelectedPlayer(null);
            } else {
                setMessage('❌ Failed to update payment status');
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
                setMessage('❌ Failed to update availability');
            }
        } catch (error) {
            setMessage('❌ Error updating availability');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Calculate payment stats
    const paymentStats = {
        total: players.length,
        paid: players.filter(p => p.paymentStatus === 'paid').length,
        partial: players.filter(p => p.paymentStatus === 'partial').length,
        unpaid: players.filter(p => !p.paymentStatus || p.paymentStatus === 'unpaid').length,
        totalOwed: players.reduce((sum, p) => sum + (p.amountOwed || 0), 0),
        totalPaid: players.reduce((sum, p) => sum + (p.amountPaid || 0), 0)
    };

    // Calculate availability stats
    const availabilityStats = {
        active: players.filter(p => !p.availability || p.availability === 'active').length,
        injured: players.filter(p => p.availability === 'injured').length,
        inactive: players.filter(p => p.availability === 'inactive').length,
        leave: players.filter(p => p.availability === 'leave').length
    };

    // Filter players based on current filters
    const filteredPlayers = players.filter(p => {
        if (paymentFilter !== 'all') {
            const status = p.paymentStatus || 'unpaid';
            if (paymentFilter !== status) return false;
        }
        if (availabilityFilter !== 'all') {
            const avail = p.availability || 'active';
            if (availabilityFilter !== avail) return false;
        }
        return true;
    });

    // Get payment status badge
    const getPaymentBadge = (status) => {
        switch (status) {
            case 'paid':
                return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Paid</span>;
            case 'partial':
                return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Partial</span>;
            default:
                return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Unpaid</span>;
        }
    };

    // Get availability badge
    const getAvailabilityBadge = (availability) => {
        switch (availability) {
            case 'injured':
                return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">🤕 Injured</span>;
            case 'inactive':
                return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Inactive</span>;
            case 'leave':
                return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">On Leave</span>;
            default:
                return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Team Admin Hub</h2>
                    <p className="text-slate-600">Manage your team&apos;s players, payments, and availability</p>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`p-3 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Section Tabs */}
            <div className="flex flex-wrap gap-2 border-b pb-2">
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                            activeSection === section.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {section.icon} {section.label}
                    </button>
                ))}
            </div>

            {/* Overview Section */}
            {activeSection === 'overview' && (
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                            <div className="text-3xl font-bold">{players.length}</div>
                            <div className="text-blue-100 text-sm">Total Players</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                            <div className="text-3xl font-bold">{paymentStats.paid}</div>
                            <div className="text-green-100 text-sm">Fully Paid</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                            <div className="text-3xl font-bold">{availabilityStats.active}</div>
                            <div className="text-orange-100 text-sm">Active Players</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                            <div className="text-3xl font-bold">${paymentStats.totalPaid}</div>
                            <div className="text-purple-100 text-sm">Collected</div>
                        </div>
                    </div>

                    {/* Payment Summary Card */}
                    <div className="bg-white border rounded-xl p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">💰 Payment Summary</h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{paymentStats.paid}</div>
                                <div className="text-sm text-green-700">Paid</div>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-600">{paymentStats.partial}</div>
                                <div className="text-sm text-yellow-700">Partial</div>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{paymentStats.unpaid}</div>
                                <div className="text-sm text-red-700">Unpaid</div>
                            </div>
                        </div>
                        {paymentStats.unpaid > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                                ⚠️ {paymentStats.unpaid} player{paymentStats.unpaid > 1 ? 's' : ''} still need{paymentStats.unpaid === 1 ? 's' : ''} to pay
                            </div>
                        )}
                    </div>

                    {/* Availability Summary Card */}
                    <div className="bg-white border rounded-xl p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">📅 Roster Availability</h3>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{availabilityStats.active}</div>
                                <div className="text-sm text-green-700">Active</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                <div className="text-2xl font-bold text-orange-600">{availabilityStats.injured}</div>
                                <div className="text-sm text-orange-700">Injured</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">{availabilityStats.leave}</div>
                                <div className="text-sm text-purple-700">On Leave</div>
                            </div>
                            <div className="text-center p-3 bg-slate-100 rounded-lg">
                                <div className="text-2xl font-bold text-slate-600">{availabilityStats.inactive}</div>
                                <div className="text-sm text-slate-600">Inactive</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity - Placeholder */}
                    <div className="bg-white border rounded-xl p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">🔔 Quick Actions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button 
                                onClick={() => setActiveSection('payments')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                            >
                                💳 Manage Payments
                            </button>
                            <button 
                                onClick={() => setActiveSection('availability')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                            >
                                📋 Update Availability
                            </button>
                            <button 
                                onClick={() => setActiveSection('roster-actions')}
                                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                            >
                                ✉️ Message Team
                            </button>
                            <button 
                                onClick={() => {
                                    // Export roster functionality
                                    const csvContent = "Name,Email,Position,Jersey,Payment Status,Availability\n" + 
                                        players.map(p => 
                                            `"${p.name || ''}","${p.email || ''}","${p.position || ''}","${p.jerseyNumber || ''}","${p.paymentStatus || 'unpaid'}","${p.availability || 'active'}"`
                                        ).join("\n");
                                    const blob = new Blob([csvContent], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${team.name}_roster.csv`;
                                    a.click();
                                }}
                                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                            >
                                📥 Export Roster
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Tracker Section */}
            {activeSection === 'payments' && (
                <div className="space-y-4">
                    {/* Payment Overview */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Payment Collection</h3>
                                <div className="text-3xl font-bold">${paymentStats.totalPaid} <span className="text-lg font-normal text-green-100">/ ${paymentStats.totalOwed || 0}</span></div>
                            </div>
                            <div className="text-right">
                                <div className="text-green-100 text-sm">{paymentStats.paid} of {paymentStats.total} players paid</div>
                                <div className="w-32 h-2 bg-green-700 rounded-full mt-2 overflow-hidden">
                                    <div 
                                        className="h-full bg-white rounded-full transition-all"
                                        style={{ width: `${paymentStats.total > 0 ? (paymentStats.paid / paymentStats.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="flex gap-2 flex-wrap">
                        <span className="text-sm text-slate-600 py-2">Filter:</span>
                        {['all', 'paid', 'partial', 'unpaid'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setPaymentFilter(filter)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    paymentFilter === filter
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Player Payment List */}
                    <div className="bg-white border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800">Player Payments ({filteredPlayers.length})</h3>
                        </div>
                        
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : filteredPlayers.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No players match the filter</div>
                        ) : (
                            <div className="divide-y">
                                {filteredPlayers.map(player => (
                                    <div key={player.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                                                {player.photoUrl ? (
                                                    <img src={getFullImageUrl(player.photoUrl)} alt={player.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                                        {player.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">{player.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    #{player.jerseyNumber || '?'} • {player.position || 'Player'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                {getPaymentBadge(player.paymentStatus)}
                                                {player.amountPaid > 0 && (
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        ${player.amountPaid || 0} paid
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedPlayer(player);
                                                    setShowPaymentModal(true);
                                                }}
                                                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Availability Section */}
            {activeSection === 'availability' && (
                <div className="space-y-4">
                    {/* Filter */}
                    <div className="flex gap-2 flex-wrap">
                        <span className="text-sm text-slate-600 py-2">Filter:</span>
                        {['all', 'active', 'injured', 'leave', 'inactive'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setAvailabilityFilter(filter)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    availabilityFilter === filter
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {filter === 'leave' ? 'On Leave' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Player Availability List */}
                    <div className="bg-white border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b">
                            <h3 className="font-semibold text-slate-800">Player Availability ({filteredPlayers.length})</h3>
                        </div>
                        
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : filteredPlayers.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No players match the filter</div>
                        ) : (
                            <div className="divide-y">
                                {filteredPlayers.map(player => (
                                    <div key={player.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                                                {player.photoUrl ? (
                                                    <img src={getFullImageUrl(player.photoUrl)} alt={player.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                                        {player.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">{player.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    #{player.jerseyNumber || '?'} • {player.position || 'Player'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getAvailabilityBadge(player.availability)}
                                            <select
                                                value={player.availability || 'active'}
                                                onChange={(e) => updatePlayerAvailability(player.id, e.target.value)}
                                                disabled={saving}
                                                className="px-2 py-1 border border-slate-300 rounded-lg text-sm"
                                            >
                                                <option value="active">Active</option>
                                                <option value="injured">Injured</option>
                                                <option value="leave">On Leave</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Roster Actions Section */}
            {activeSection === 'roster-actions' && (
                <div className="space-y-6">
                    {/* Bulk Actions */}
                    <div className="bg-white border rounded-xl p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">Bulk Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    if (window.confirm('Mark all players as UNPAID? This will reset payment status.')) {
                                        players.forEach(p => updatePlayerPayment(p.id, { paymentStatus: 'unpaid', amountPaid: 0 }));
                                    }
                                }}
                                className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                            >
                                <div className="text-2xl mb-2">🔄</div>
                                <div className="font-medium">Reset All Payments</div>
                                <div className="text-xs text-slate-500">For new season</div>
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm('Mark all players as ACTIVE?')) {
                                        players.forEach(p => updatePlayerAvailability(p.id, 'active'));
                                    }
                                }}
                                className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-green-400 hover:text-green-600 transition-colors"
                            >
                                <div className="text-2xl mb-2">✅</div>
                                <div className="font-medium">Activate All Players</div>
                                <div className="text-xs text-slate-500">Set everyone to active</div>
                            </button>
                        </div>
                    </div>

                    {/* Communication */}
                    <div className="bg-white border rounded-xl p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">📧 Send Team Communication</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                💡 Copy email addresses to send bulk communications to your team
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        const emails = players.filter(p => p.email).map(p => p.email).join(', ');
                                        navigator.clipboard.writeText(emails);
                                        setMessage('✅ All player emails copied!');
                                        setTimeout(() => setMessage(''), 3000);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                    📋 Copy All Emails
                                </button>
                                <button
                                    onClick={() => {
                                        const unpaidEmails = players.filter(p => (!p.paymentStatus || p.paymentStatus === 'unpaid') && p.email).map(p => p.email).join(', ');
                                        navigator.clipboard.writeText(unpaidEmails);
                                        setMessage('✅ Unpaid player emails copied!');
                                        setTimeout(() => setMessage(''), 3000);
                                    }}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                                >
                                    📋 Copy Unpaid Emails
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Export Options */}
                    <div className="bg-white border rounded-xl p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">📥 Export Data</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <button
                                onClick={() => {
                                    const csvContent = "Name,Email,Phone,Position,Jersey,Payment Status,Amount Paid,Availability\n" + 
                                        players.map(p => 
                                            `"${p.name || ''}","${p.email || ''}","${p.phone || ''}","${p.position || ''}","${p.jerseyNumber || ''}","${p.paymentStatus || 'unpaid'}","${p.amountPaid || 0}","${p.availability || 'active'}"`
                                        ).join("\n");
                                    const blob = new Blob([csvContent], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${team.name}_full_roster.csv`;
                                    a.click();
                                    setMessage('✅ Full roster exported!');
                                    setTimeout(() => setMessage(''), 3000);
                                }}
                                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700"
                            >
                                Full Roster CSV
                            </button>
                            <button
                                onClick={() => {
                                    const csvContent = "Name,Email,Payment Status,Amount Paid\n" + 
                                        players.map(p => 
                                            `"${p.name || ''}","${p.email || ''}","${p.paymentStatus || 'unpaid'}","${p.amountPaid || 0}"`
                                        ).join("\n");
                                    const blob = new Blob([csvContent], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${team.name}_payment_report.csv`;
                                    a.click();
                                    setMessage('✅ Payment report exported!');
                                    setTimeout(() => setMessage(''), 3000);
                                }}
                                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700"
                            >
                                Payment Report CSV
                            </button>
                            <button
                                onClick={() => {
                                    const csvContent = "Name,Phone,Emergency Contact,Emergency Phone\n" + 
                                        players.map(p => 
                                            `"${p.name || ''}","${p.phone || ''}","${p.emergencyContactName || ''}","${p.emergencyContactPhone || ''}"`
                                        ).join("\n");
                                    const blob = new Blob([csvContent], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${team.name}_emergency_contacts.csv`;
                                    a.click();
                                    setMessage('✅ Emergency contacts exported!');
                                    setTimeout(() => setMessage(''), 3000);
                                }}
                                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700"
                            >
                                Emergency Contacts CSV
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Update Modal */}
            {showPaymentModal && selectedPlayer && (
                <PaymentUpdateModal
                    player={selectedPlayer}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedPlayer(null);
                    }}
                    onSave={updatePlayerPayment}
                    saving={saving}
                />
            )}
        </div>
    );
};

// Payment Update Modal Component
const PaymentUpdateModal = ({ player, onClose, onSave, saving }) => {
    const [paymentStatus, setPaymentStatus] = useState(player.paymentStatus || 'unpaid');
    const [amountPaid, setAmountPaid] = useState(player.amountPaid || 0);
    const [amountOwed, setAmountOwed] = useState(player.amountOwed || 0);
    const [paymentNotes, setPaymentNotes] = useState(player.paymentNotes || '');
    const [paymentDate, setPaymentDate] = useState(player.lastPaymentDate || '');

    const handleSave = () => {
        onSave(player.id, {
            paymentStatus,
            amountPaid: parseFloat(amountPaid) || 0,
            amountOwed: parseFloat(amountOwed) || 0,
            paymentNotes,
            lastPaymentDate: paymentDate || new Date().toISOString().split('T')[0]
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Update Payment - {player.name}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial Payment</option>
                            <option value="paid">Fully Paid</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount Owed ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={amountOwed}
                                onChange={(e) => setAmountOwed(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                placeholder="0.00"
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
                            placeholder="Payment notes (check #, Venmo, etc.)"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Payment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamAdminHub;
