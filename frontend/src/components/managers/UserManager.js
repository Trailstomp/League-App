import React, { useState } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

// Icons
const Edit = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
);

const UserCheck = ({ size = 48, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <polyline points="16,11 18,13 22,9"/>
    </svg>
);

const UserManager = ({ users, setUsers, teams }) => {
    const [editingUser, setEditingUser] = useState(null);
    const [viewTab, setViewTab] = useState('active'); // 'active', 'pending'

    // User approval/rejection handlers
    const handleApproveUser = (userId) => {
        setUsers(users.map(u => {
            if (u.id === userId) {
                const approvedUser = {
                    ...u,
                    status: 'active',
                    roles: [u.preferredRole || 'player'],
                    roleIds: u.preferredRole === 'coach' ? ['team_coach'] : ['player'],
                    approvedAt: new Date().toISOString().split('T')[0]
                };
                return approvedUser;
            }
            return u;
        }));
    };

    const handleRejectUser = (userId) => {
        if (window.confirm('Are you sure you want to reject this user registration?')) {
            setUsers(users.filter(u => u.id !== userId));
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        setEditingUser(null);
    };

    const handleRoleChange = (role, checked) => {
        const currentRoles = editingUser.roles || [];
        if (checked) {
            setEditingUser({...editingUser, roles: [...currentRoles, role]});
        } else {
            setEditingUser({...editingUser, roles: currentRoles.filter(r => r !== role)});
        }
    };

    const activeUsers = users.filter(u => u.status === 'active');
    const pendingUsers = users.filter(u => u.status === 'pending');

    const UserForm = () => (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={() => setEditingUser(null)}
        >
            <div 
                className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold mb-4">Edit User: {editingUser.name}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block font-semibold mb-2">Roles</label>
                        <div className="grid grid-cols-2 gap-2">
                           {['player', 'coach', 'player/coach', 'admin'].map(role => (
                               <label key={role} className="flex items-center space-x-2">
                                   <input 
                                       type="checkbox" 
                                       checked={editingUser.roles && editingUser.roles.includes(role)} 
                                       onChange={e => handleRoleChange(role, e.target.checked)} 
                                   />
                                   <span className="capitalize">{role}</span>
                               </label>
                           ))}
                        </div>
                    </div>
                    <div>
                        <label className="block font-semibold">Team</label>
                        <select 
                            value={editingUser.teamId || ''} 
                            onChange={e => setEditingUser({...editingUser, teamId: e.target.value})} 
                            className="w-full p-2 border rounded"
                        >
                            <option value="">(No Team)</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold">Email</label>
                        <input
                            type="email"
                            value={editingUser.email || ''}
                            onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button 
                            type="button" 
                            onClick={() => setEditingUser(null)} 
                            className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div>
            {editingUser && <UserForm />}
            
            {/* Tab Navigation */}
            <div className="flex space-x-4 border-b mb-4">
                <button 
                    className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                        viewTab === 'active' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-600 hover:text-blue-600'
                    }`}
                    onClick={() => setViewTab('active')}
                >
                    Active Users ({activeUsers.length})
                </button>
                <button 
                    className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                        viewTab === 'pending' 
                            ? 'border-orange-600 text-orange-600' 
                            : 'border-transparent text-slate-600 hover:text-orange-600'
                    }`}
                    onClick={() => setViewTab('pending')}
                >
                    Pending Approval ({pendingUsers.length})
                </button>
            </div>

            {/* Active Users Tab */}
            {viewTab === 'active' && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Active Users</h3>
                    {activeUsers.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No active users found.</p>
                    ) : (
                        <ul className="space-y-2">
                            {activeUsers.map(user => (
                                <li key={user.id} className="flex items-center p-3 border rounded-lg bg-white shadow-sm">
                                    <div className="flex-grow">
                                        <p className="font-bold">{user.name}</p>
                                        <p className="text-sm text-slate-500">{user.email}</p>
                                        {user.teamId && (
                                            <p className="text-xs text-slate-400">
                                                Team: {teams.find(t => t.id === user.teamId)?.name || 'Unknown'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 ml-4 flex items-center gap-4">
                                        <span className={`font-semibold capitalize px-2 py-1 rounded-full text-xs ${(user.roles && user.roles.length > 0) || user.role ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {user.roles && user.roles.length > 0 ? user.roles.join(', ') : user.role || 'Unassigned'}
                                        </span>
                                        <button 
                                            onClick={() => setEditingUser(user)} 
                                            className="text-slate-500 hover:text-slate-700 p-1"
                                        >
                                            <Edit size={18}/>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Pending Users Tab */}
            {viewTab === 'pending' && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Pending Approval</h3>
                    {pendingUsers.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <UserCheck size={48} className="mx-auto mb-4" />
                            <p>No pending user requests.</p>
                            <p className="text-sm">New registration requests will appear here.</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {pendingUsers.map(user => (
                                <li key={user.id} className="border rounded-lg bg-yellow-50 border-yellow-200 p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-lg">{user.name}</h4>
                                            <p className="text-slate-600">{user.email}</p>
                                            {user.phone && (
                                                <p className="text-sm text-slate-500">Phone: {user.phone}</p>
                                            )}
                                        </div>
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                                            PENDING
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                                        <div>
                                            <strong>Preferred Role:</strong>
                                            <span className="ml-2 capitalize">{user.preferredRole}</span>
                                        </div>
                                        <div>
                                            <strong>Interested Team:</strong>
                                            <span className="ml-2">
                                                {user.teamId ? teams.find(t => t.id === user.teamId)?.name || 'Unknown' : 'No preference'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {user.reasonForJoining && (
                                        <div className="mb-4">
                                            <strong className="text-sm">Why they want to join:</strong>
                                            <p className="text-sm text-slate-700 bg-white p-2 rounded border mt-1">
                                                {user.reasonForJoining}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-500">
                                            Applied: {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleRejectUser(user.id)}
                                                className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApproveUser(user.id)}
                                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                            >
                                                Approve as {user.preferredRole}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserManager;