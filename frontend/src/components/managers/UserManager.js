import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

// Multi-Role Selector Component
const RoleSelector = ({ selectedRoles = [], onChange }) => {
    const availableRoles = [
        { id: 'player', label: '🏃 Player', color: 'green' },
        { id: 'coach', label: '📋 Coach', color: 'blue' },
        { id: 'admin', label: '👑 Admin', color: 'purple' },
        { id: 'guest', label: '👤 Guest', color: 'gray' }
    ];

    const toggleRole = (roleId) => {
        if (selectedRoles.includes(roleId)) {
            // Remove role (but keep at least one)
            if (selectedRoles.length > 1) {
                onChange(selectedRoles.filter(r => r !== roleId));
            }
        } else {
            // Add role (remove guest if adding other roles)
            let newRoles = [...selectedRoles, roleId];
            if (roleId !== 'guest' && newRoles.includes('guest')) {
                newRoles = newRoles.filter(r => r !== 'guest');
            }
            if (roleId === 'guest') {
                newRoles = ['guest'];
            }
            onChange(newRoles);
        }
    };

    const getColorClasses = (role, isSelected) => {
        const colors = {
            green: isSelected ? 'bg-green-500 text-white border-green-500' : 'bg-white text-green-700 border-green-300 hover:bg-green-50',
            blue: isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50',
            purple: isSelected ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50',
            gray: isSelected ? 'bg-gray-500 text-white border-gray-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        };
        return colors[role.color] || colors.gray;
    };

    return (
        <div className="flex flex-wrap gap-2">
            {availableRoles.map(role => {
                const isSelected = selectedRoles.includes(role.id);
                return (
                    <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all ${getColorClasses(role, isSelected)}`}
                    >
                        {isSelected && <span className="mr-1">✓</span>}
                        {role.label}
                    </button>
                );
            })}
        </div>
    );
};

// Multi-Team Assignment Component
const TeamAssignmentEditor = ({ assignments = [], teams = [], onChange }) => {
    const addAssignment = () => {
        onChange([...assignments, { teamId: '', playerNumber: '', position: '', isPrimary: assignments.length === 0 }]);
    };

    const removeAssignment = (index) => {
        const updated = assignments.filter((_, i) => i !== index);
        // If we removed the primary, make the first one primary
        if (updated.length > 0 && !updated.some(a => a.isPrimary)) {
            updated[0].isPrimary = true;
        }
        onChange(updated);
    };

    const updateAssignment = (index, field, value) => {
        const updated = [...assignments];
        updated[index] = { ...updated[index], [field]: value };
        
        // If setting this as primary, unset others
        if (field === 'isPrimary' && value) {
            updated.forEach((a, i) => {
                if (i !== index) a.isPrimary = false;
            });
        }
        
        // Auto-fill team name
        if (field === 'teamId') {
            const team = teams.find(t => t.id === value);
            updated[index].teamName = team?.name || '';
        }
        
        onChange(updated);
    };

    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team?.name || teamId;
    };

    const positionOptions = [
        'Attack', 'Midfield', 'Defense', 'Goalie', 'FOGO', 'LSM', 'Coach', 'Assistant Coach'
    ];

    return (
        <div className="space-y-3">
            {assignments.map((assignment, index) => (
                <div key={index} className="p-3 border rounded-lg bg-gray-50 relative">
                    {/* Primary badge */}
                    {assignment.isPrimary && (
                        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            Primary
                        </span>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {/* Team Selection */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Team</label>
                            <select
                                value={assignment.teamId || ''}
                                onChange={(e) => updateAssignment(index, 'teamId', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                            >
                                <option value="">Select Team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name} {team.division ? `(${team.division})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Jersey Number */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Jersey #</label>
                            <input
                                type="text"
                                value={assignment.playerNumber || ''}
                                onChange={(e) => updateAssignment(index, 'playerNumber', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                placeholder="12"
                            />
                        </div>

                        {/* Position */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                            <select
                                value={assignment.position || ''}
                                onChange={(e) => updateAssignment(index, 'position', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                            >
                                <option value="">Select Position</option>
                                {positionOptions.map(pos => (
                                    <option key={pos} value={pos}>{pos}</option>
                                ))}
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex items-end gap-2">
                            {!assignment.isPrimary && assignments.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => updateAssignment(index, 'isPrimary', true)}
                                    className="px-2 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    title="Set as primary team"
                                >
                                    Set Primary
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => removeAssignment(index)}
                                className="px-2 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                title="Remove team"
                            >
                                ✕ Remove
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addAssignment}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
                <span className="text-lg">+</span> Add Team Assignment
            </button>
        </div>
    );
};

const UserManager = ({ teams = [] }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        roles: ['player'],
        phone: '',
        jerseySize: '',
        photoUrl: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
        teamAssignments: []
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

            // Build user data with team assignments and roles
            const userData = {
                ...newUser,
                // Set primary team for legacy compatibility
                teamId: newUser.teamAssignments.find(a => a.isPrimary)?.teamId || newUser.teamAssignments[0]?.teamId || '',
                playerNumber: newUser.teamAssignments.find(a => a.isPrimary)?.playerNumber || newUser.teamAssignments[0]?.playerNumber || '',
                position: newUser.teamAssignments.find(a => a.isPrimary)?.position || newUser.teamAssignments[0]?.position || ''
            };

            const response = await fetch(`${backendUrl}/api/users/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                setMessage('✅ User created successfully!');
                setShowCreateModal(false);
                setNewUser({
                    name: '', email: '', password: '', roles: ['player'], phone: '',
                    jerseySize: '', emergencyContact: '', teamAssignments: []
                });
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
                })
            });

            if (response.ok) {
                setMessage(`✅ ${user.name} has been approved!`);
                await loadUsers();
                setTimeout(() => setMessage(''), 3000);
            } else {
                const error = await response.json();
                alert(`Failed to approve user: ${error.detail}`);
            }
        } catch (error) {
            alert('Error approving user');
        }
    };

    const handleReject = async (user) => {
        if (!window.confirm(`Are you sure you want to reject ${user.name}'s request?`)) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/users/${user.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMessage(`User ${user.name} has been rejected and removed`);
                await loadUsers();
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            alert('Error rejecting user');
        }
    };

    const handleSaveEdit = async () => {
        try {
            // Build update data with team assignments and roles
            const updateData = {
                name: editingUser.name,
                email: editingUser.email,
                phone: editingUser.phone,
                roles: editingUser.roles || [editingUser.role || 'guest'],
                status: editingUser.status,
                jerseySize: editingUser.jerseySize,
                emergencyContact: editingUser.emergencyContact,
                teamAssignments: editingUser.teamAssignments || [],
                // Set primary team for legacy compatibility
                teamId: editingUser.teamAssignments?.find(a => a.isPrimary)?.teamId || editingUser.teamAssignments?.[0]?.teamId || editingUser.teamId || '',
                playerNumber: editingUser.teamAssignments?.find(a => a.isPrimary)?.playerNumber || editingUser.teamAssignments?.[0]?.playerNumber || editingUser.playerNumber || '',
                position: editingUser.teamAssignments?.find(a => a.isPrimary)?.position || editingUser.teamAssignments?.[0]?.position || editingUser.position || ''
            };

            const response = await fetch(`${backendUrl}/api/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                setMessage('✅ User updated successfully!');
                setEditingUser(null);
                await loadUsers();
                setTimeout(() => setMessage(''), 3000);
            } else {
                const error = await response.json();
                alert(`Failed to update user: ${error.detail}`);
            }
        } catch (error) {
            alert('Error updating user');
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/users/${user.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMessage(`User ${user.name} has been deleted`);
                await loadUsers();
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            alert('Error deleting user');
        }
    };

    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    const getTeamBadge = (teamId, division) => {
        const colors = {
            'Field': 'bg-green-100 text-green-800',
            'Box': 'bg-orange-100 text-orange-800',
            'default': 'bg-blue-100 text-blue-800'
        };
        const team = teams.find(t => t.id === teamId);
        const colorClass = colors[team?.division] || colors['default'];
        return colorClass;
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            'admin': 'bg-purple-100 text-purple-800',
            'coach': 'bg-blue-100 text-blue-800',
            'player': 'bg-green-100 text-green-800',
            'guest': 'bg-gray-100 text-gray-800'
        };
        return colors[role] || colors['guest'];
    };

    // Filter users by tab
    const filteredUsers = users.filter(user => {
        if (activeTab === 'pending') return user.status === 'pending';
        if (activeTab === 'active') return user.status === 'active';
        if (activeTab === 'all') return true;
        return user.status === activeTab;
    });

    const pendingCount = users.filter(u => u.status === 'pending').length;
    const activeCount = users.filter(u => u.status === 'active').length;

    // Prepare user for editing - migrate legacy single team/role to new structure
    const prepareUserForEdit = (user) => {
        let teamAssignments = user.teamAssignments || [];
        
        // If no team assignments but has legacy teamId, create one
        if (teamAssignments.length === 0 && user.teamId) {
            teamAssignments = [{
                teamId: user.teamId,
                teamName: user.teamName || getTeamName(user.teamId),
                playerNumber: user.playerNumber || '',
                position: user.position || '',
                isPrimary: true
            }];
        }

        // Migrate legacy single role to roles array
        let roles = user.roles || [];
        if (roles.length === 0 && user.role) {
            roles = [user.role];
        }

        setEditingUser({
            ...user,
            teamAssignments,
            roles
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                    <p className="text-gray-600">Manage players, coaches, and admins</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <LacrosseIcon name="add" style={{fontSize: '16px'}} />
                    Add User
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {message}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                    {[
                        { id: 'active', label: 'Active', count: activeCount },
                        { id: 'pending', label: 'Pending', count: pendingCount },
                        { id: 'all', label: 'All Users', count: users.length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                    tab.id === 'pending' && tab.count > 0 
                                        ? 'bg-orange-100 text-orange-800' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <LacrosseIcon name="players" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                        <p>No users found</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="p-4 hover:bg-gray-50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    {/* User Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-gray-900">{user.name}</span>
                                            {/* Display multiple roles */}
                                            {(user.roles?.length > 0 ? user.roles : [user.role]).map((role, idx) => (
                                                <span key={idx} className={`px-2 py-0.5 rounded-full text-xs ${getRoleBadgeColor(role)}`}>
                                                    {role}
                                                </span>
                                            ))}
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                user.status === 'active' ? 'bg-green-100 text-green-800' :
                                                user.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {user.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        
                                        {/* Team Assignments Display */}
                                        {(user.teamAssignments?.length > 0 || user.teamId) && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {user.teamAssignments?.length > 0 ? (
                                                    user.teamAssignments.map((assignment, idx) => (
                                                        <span 
                                                            key={idx}
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getTeamBadge(assignment.teamId)}`}
                                                        >
                                                            {assignment.isPrimary && <span className="text-yellow-500">★</span>}
                                                            {assignment.teamName || getTeamName(assignment.teamId)}
                                                            {assignment.playerNumber && <span className="font-bold">#{assignment.playerNumber}</span>}
                                                            {assignment.position && <span className="opacity-75">({assignment.position})</span>}
                                                        </span>
                                                    ))
                                                ) : user.teamId && (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getTeamBadge(user.teamId)}`}>
                                                        {user.teamName || getTeamName(user.teamId)}
                                                        {user.playerNumber && <span className="font-bold">#{user.playerNumber}</span>}
                                                        {user.position && <span className="opacity-75">({user.position})</span>}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {user.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(user)}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(user)}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                >
                                                    ✕ Reject
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => prepareUserForEdit(user)}
                                                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-4 md:p-6">
                            <h3 className="text-xl font-bold">Create New User</h3>
                        </div>
                        <div className="p-4 md:p-6 space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="John Smith"
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
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={newUser.phone}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Roles (select all that apply)</label>
                                    <RoleSelector
                                        selectedRoles={newUser.roles}
                                        onChange={(roles) => setNewUser(prev => ({ ...prev, roles }))}
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
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                                    <input
                                        type="text"
                                        value={newUser.emergencyContact}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Contact name & phone"
                                    />
                                </div>
                            </div>

                            {/* Team Assignments Section */}
                            {(newUser.roles.includes('player') || newUser.roles.includes('coach')) && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        🏆 Team Assignments
                                        <span className="text-sm font-normal text-gray-500">
                                            (Can play for multiple teams)
                                        </span>
                                    </h4>
                                    <TeamAssignmentEditor
                                        assignments={newUser.teamAssignments}
                                        teams={teams}
                                        onChange={(assignments) => setNewUser(prev => ({ ...prev, teamAssignments: assignments }))}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="sticky bottom-0 bg-white border-t p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row gap-3">
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
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-4 md:p-6">
                            <h3 className="text-xl font-bold">Edit User: {editingUser.name}</h3>
                        </div>
                        <div className="p-4 md:p-6 space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Roles (select all that apply)</label>
                                    <RoleSelector
                                        selectedRoles={editingUser.roles || [editingUser.role]}
                                        onChange={(roles) => setEditingUser(prev => ({ ...prev, roles }))}
                                    />
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
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                                    <input
                                        type="text"
                                        value={editingUser.emergencyContact || ''}
                                        onChange={(e) => setEditingUser(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Team Assignments Section */}
                            {(editingUser.roles?.includes('player') || editingUser.roles?.includes('coach') || editingUser.role === 'player' || editingUser.role === 'coach') && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        🏆 Team Assignments
                                        <span className="text-sm font-normal text-gray-500">
                                            (Can play for multiple teams with different numbers/positions)
                                        </span>
                                    </h4>
                                    <TeamAssignmentEditor
                                        assignments={editingUser.teamAssignments || []}
                                        teams={teams}
                                        onChange={(assignments) => setEditingUser(prev => ({ ...prev, teamAssignments: assignments }))}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="sticky bottom-0 bg-white border-t p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;
