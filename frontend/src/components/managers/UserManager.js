import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

const UserManager = ({ teams = [] }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'player',
        teamId: '',
        phone: '',
        playerNumber: '',
        position: '',
        jerseySize: '',
        emergencyContact: ''
    });
    const [message, setMessage] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/users`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        try {
            if (!newUser.name || !newUser.email || !newUser.password) {
                alert('Name, email, and password are required');
                return;
            }

            const response = await fetch(`${backendUrl}/api/users/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (response.ok) {
                setMessage('✅ User created successfully!');
                setShowCreateModal(false);
                setNewUser({ name: '', email: '', password: '', role: 'player', teamId: '', phone: '', playerNumber: '', position: '', jerseySize: '', emergencyContact: '' });
                await loadUsers();
                setTimeout(() => setMessage(''), 3000);
            } else {
                const error = await response.json();
                alert(`Failed to create user: ${error.detail}`);
            }
        } catch (error) {
            alert('Error creating user');
        }
    };

    const handleApprove = async (user) => {
        try {
            const response = await fetch(`${backendUrl}/api/users/${user.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: user.requestedRole,
                    teamId: user.requestedTeam,
                    approvedBy: 'admin'
                })
            });

            if (response.ok) {
                setMessage(`✅ ${user.name} approved as ${user.requestedRole}!`);
                await loadUsers();
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            alert('Error approving user');
        }
    };

    const handleReject = async (userId) => {
        if (!window.confirm('Are you sure you want to reject this user?')) return;

        try {
            const response = await fetch(`${backendUrl}/api/users/${userId}/reject`, {
                method: 'POST'
            });

            if (response.ok) {
                setMessage('✅ User request rejected');
                await loadUsers();
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            alert('Error rejecting user');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`${backendUrl}/api/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMessage('✅ User deleted');
                await loadUsers();
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            alert('Error deleting user');
        }
    };

    const handleUpdateUser = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingUser.name,
                    email: editingUser.email,
                    role: editingUser.role,
                    teamId: editingUser.teamId,
                    status: editingUser.status,
                    phone: editingUser.phone,
                    playerNumber: editingUser.playerNumber,
                    position: editingUser.position,
                    jerseySize: editingUser.jerseySize,
                    emergencyContact: editingUser.emergencyContact
                })
            });

            if (response.ok) {
                setMessage('✅ User updated successfully!');
                setEditingUser(null);
                await loadUsers();
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            alert('Error updating user');
        }
    };

    const handleResetPassword = async (userId) => {
        const newPassword = prompt('Enter new password (minimum 6 characters):');
        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/users/${userId}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });

            if (response.ok) {
                alert('✅ Password reset successfully!');
            } else {
                alert('Failed to reset password');
            }
        } catch (error) {
            alert('Error resetting password');
        }
    };

    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team?.name || 'No Team';
    };

    const activeUsers = users.filter(u => u.status === 'active' || u.status === 'guest');
    const pendingUsers = users.filter(u => u.status === 'pending');

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'coach': return 'bg-purple-100 text-purple-800';
            case 'player': return 'bg-blue-100 text-blue-800';
            case 'guest': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <LacrosseIcon name="admin" className="mr-3" size={28} />
                        User Management
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Manage league members, approve requests, and assign teams
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    ➕ Create User
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${
                    message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {message}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="text-2xl font-bold text-blue-600">{activeUsers.length}</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</div>
                    <div className="text-sm text-gray-600">Pending Approval</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'coach').length}</div>
                    <div className="text-sm text-gray-600">Coaches</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b px-6 py-3">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`pb-2 px-3 font-medium transition border-b-2 ${
                                activeTab === 'active'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Active Users ({activeUsers.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`pb-2 px-3 font-medium transition border-b-2 ${
                                activeTab === 'pending'
                                    ? 'border-yellow-600 text-yellow-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Pending Approval ({pendingUsers.length})
                            {pendingUsers.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                    {pendingUsers.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Active Users Tab */}
                {activeTab === 'active' && (
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : activeUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">👥</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Yet</h3>
                                <p className="text-gray-600 mb-4">Create users or wait for registrations</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create First User
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Desktop: Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {activeUsers.map(user => (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-gray-900">{user.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">{user.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">
                                                            {user.teamName || getTeamName(user.teamId)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-mono text-gray-900">
                                                            {user.playerNumber || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                                                            user.status === 'guest' ? 'bg-blue-100 text-blue-800' :
                                                            user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setEditingUser(user)}
                                                                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                                                            >
                                                                ✏️ Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleResetPassword(user.id)}
                                                                className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                                            >
                                                                🔑 Reset PW
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(user.id)}
                                                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile: Card View */}
                                <div className="md:hidden space-y-4">
                                    {activeUsers.map(user => (
                                        <div key={user.id} className="bg-white border rounded-lg p-4 shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{user.name}</h4>
                                                    <p className="text-sm text-gray-600">{user.email}</p>
                                                </div>
                                                {user.playerNumber && (
                                                    <div className="text-2xl font-bold text-gray-400">#{user.playerNumber}</div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                                <div>
                                                    <span className="text-gray-500">Role:</span>
                                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Status:</span>
                                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                                                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        user.status === 'guest' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {user.status}
                                                    </span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-gray-500">Team:</span>
                                                    <span className="ml-2 font-medium">{user.teamName || getTeamName(user.teamId)}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="flex-1 px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user.id)}
                                                    className="flex-1 px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                                >
                                                    🔑 PW
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Pending Approvals Tab */}
                {activeTab === 'pending' && (
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                            </div>
                        ) : pendingUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">✅</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
                                <p className="text-gray-600">All caught up!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingUsers.map(user => (
                                    <div key={user.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                                                        <p className="text-sm text-gray-600">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Requested Role:</span>
                                                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.requestedRole)}`}>
                                                            {user.requestedRole}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Desired Team:</span>
                                                        <span className="ml-2 font-medium text-gray-900">
                                                            {getTeamName(user.requestedTeam)}
                                                        </span>
                                                    </div>
                                                    {user.phone && (
                                                        <div>
                                                            <span className="text-gray-600">Phone:</span>
                                                            <span className="ml-2 font-medium text-gray-900">{user.phone}</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-gray-600">Registered:</span>
                                                        <span className="ml-2 font-medium text-gray-900">
                                                            {new Date(user.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => handleApprove(user)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                                >
                                                    ✅ Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(user.id)}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                                >
                                                    ❌ Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto md:rounded-lg sm:rounded-none sm:max-h-screen">
                        <div className="sticky top-0 bg-white border-b p-4 md:p-6">
                            <h3 className="text-xl font-bold">Create New User</h3>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Minimum 6 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="(123) 456-7890"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="guest">Guest</option>
                                    <option value="player">Player</option>
                                    <option value="coach">Coach</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                                <select
                                    value={newUser.teamId}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, teamId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">No Team</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Player Attributes (for players) */}
                            {(newUser.role === 'player' || newUser.role === 'coach') && (
                                <>
                                    <div className="col-span-2 border-t pt-4">
                                        <h4 className="font-medium text-gray-700 mb-3">Player Details</h4>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jersey #</label>
                                        <input
                                            type="text"
                                            value={newUser.playerNumber}
                                            onChange={(e) => setNewUser(prev => ({ ...prev, playerNumber: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="12"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                        <input
                                            type="text"
                                            value={newUser.position}
                                            onChange={(e) => setNewUser(prev => ({ ...prev, position: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Attack, Defense, Midfield, Goalie"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Size</label>
                                        <select
                                            value={newUser.jerseySize}
                                            onChange={(e) => setNewUser(prev => ({ ...prev, jerseySize: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">Select size</option>
                                            <option value="S">Small</option>
                                            <option value="M">Medium</option>
                                            <option value="L">Large</option>
                                            <option value="XL">XL</option>
                                            <option value="XXL">XXL</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                                        <input
                                            type="text"
                                            value={newUser.emergencyContact}
                                            onChange={(e) => setNewUser(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Contact name & phone"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateUser}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Edit User: {editingUser.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={editingUser.phone || ''}
                                    onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="guest">Guest</option>
                                    <option value="player">Player</option>
                                    <option value="coach">Coach</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                                <select
                                    value={editingUser.teamId || ''}
                                    onChange={(e) => setEditingUser(prev => ({ ...prev, teamId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">No Team</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={editingUser.status}
                                    onChange={(e) => setEditingUser(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="guest">Guest</option>
                                    <option value="pending">Pending</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            
                            {/* Player Attributes */}
                            {(editingUser.role === 'player' || editingUser.role === 'coach') && (
                                <>
                                    <div className="col-span-2 border-t pt-4">
                                        <h4 className="font-medium text-gray-700 mb-3">Player Details</h4>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jersey #</label>
                                        <input
                                            type="text"
                                            value={editingUser.playerNumber || ''}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, playerNumber: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                        <input
                                            type="text"
                                            value={editingUser.position || ''}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, position: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Size</label>
                                        <select
                                            value={editingUser.jerseySize || ''}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, jerseySize: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">Select size</option>
                                            <option value="S">Small</option>
                                            <option value="M">Medium</option>
                                            <option value="L">Large</option>
                                            <option value="XL">XL</option>
                                            <option value="XXL">XXL</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                                        <input
                                            type="text"
                                            value={editingUser.emergencyContact || ''}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Update User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;
