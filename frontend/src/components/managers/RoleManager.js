import React, { useState } from 'react';
import { PERMISSIONS, SYSTEM_ROLES } from '../PermissionsSystem';
import { LacrosseIcon } from '../LacrosseIcons';

// Icons for buttons
const Plus = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

const Edit = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
);

const Trash2 = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="3,6 5,6 21,6"/>
        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2,-2V6m3,0V4a2,2 0 0,1,2,-2h4a2,2 0 0,1,2,2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);

// Get all roles (system + custom)
const getAllRoles = () => {
    // This would normally come from a database
    // For now, return system roles + any custom roles from localStorage
    const customRoles = JSON.parse(localStorage.getItem('customRoles') || '[]');
    return [...Object.values(SYSTEM_ROLES), ...customRoles];
};

const RoleManager = ({ users, setUsers }) => {
    const [editingRole, setEditingRole] = useState(null);
    const [roles, setRoles] = useState(() => getAllRoles());

    const handleSaveRole = (e) => {
        e.preventDefault();
        
        if (editingRole.id && !editingRole.isSystemRole) {
            // Edit existing custom role
            const updatedRoles = roles.map(r => 
                r.id === editingRole.id ? editingRole : r
            );
            setRoles(updatedRoles);
            
            // Save custom roles to localStorage
            const customRoles = updatedRoles.filter(r => !r.isSystemRole);
            localStorage.setItem('customRoles', JSON.stringify(customRoles));
        } else if (!editingRole.id) {
            // Create new role
            const newRole = {
                ...editingRole,
                id: `custom_${Date.now()}`,
                isSystemRole: false
            };
            
            const updatedRoles = [...roles, newRole];
            setRoles(updatedRoles);
            
            // Save custom roles to localStorage
            const customRoles = updatedRoles.filter(r => !r.isSystemRole);
            localStorage.setItem('customRoles', JSON.stringify(customRoles));
        }
        
        setEditingRole(null);
    };

    const handleDeleteRole = (roleId) => {
        const role = roles.find(r => r.id === roleId);
        if (role && !role.isSystemRole && window.confirm(`Delete role "${role.name}"?`)) {
            const updatedRoles = roles.filter(r => r.id !== roleId);
            setRoles(updatedRoles);
            
            // Update localStorage
            const customRoles = updatedRoles.filter(r => !r.isSystemRole);
            localStorage.setItem('customRoles', JSON.stringify(customRoles));
            
            // Update users who had this role
            setUsers(currentUsers => 
                currentUsers.map(user => ({
                    ...user,
                    roleIds: (user.roleIds || []).filter(id => id !== roleId)
                }))
            );
        }
    };

    const getPermissionsByCategory = () => {
        const categories = {};
        Object.entries(PERMISSIONS).forEach(([key, permission]) => {
            if (!categories[permission.category]) {
                categories[permission.category] = [];
            }
            categories[permission.category].push({ key, ...permission });
        });
        return categories;
    };

    const permissionCategories = getPermissionsByCategory();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Role Management</h3>
                <button 
                    onClick={() => setEditingRole({name: '', description: '', permissions: []})}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Create Role
                </button>
            </div>

            {/* Role List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {roles.map(role => (
                    <div key={role.id} className="bg-slate-50 p-4 rounded-lg border hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-grow">
                                <h4 className="font-semibold text-slate-800 mb-1">{role.name}</h4>
                                {role.isSystemRole && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">System Role</span>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => setEditingRole(role)}
                                    className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors"
                                    title={role.isSystemRole ? "View Permissions" : "Edit Role"}
                                >
                                    <Edit size={16} />
                                </button>
                                {!role.isSystemRole && (
                                    <button 
                                        onClick={() => handleDeleteRole(role.id)}
                                        className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors"
                                        title="Delete Role"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{role.description}</p>
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500">
                                {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                            </p>
                            <button 
                                onClick={() => setEditingRole(role)}
                                className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded transition-colors"
                            >
                                {role.isSystemRole ? 'View Details' : 'Edit Permissions'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Role Edit Modal */}
            {editingRole && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">
                            {editingRole.id ? 'Edit Role' : 'Create New Role'}
                        </h3>
                        
                        <form onSubmit={handleSaveRole}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Role Details */}
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                        <input 
                                            type="text"
                                            value={editingRole.name || ''}
                                            onChange={e => setEditingRole(prev => ({...prev, name: e.target.value}))}
                                            className="w-full p-2 border rounded"
                                            disabled={editingRole.isSystemRole}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea 
                                            value={editingRole.description || ''}
                                            onChange={e => setEditingRole(prev => ({...prev, description: e.target.value}))}
                                            className="w-full p-2 border rounded h-20"
                                            disabled={editingRole.isSystemRole}
                                            placeholder="Describe what this role can do..."
                                        />
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {Object.entries(permissionCategories).map(([category, permissions]) => (
                                            <div key={category} className="border rounded p-3">
                                                <h4 className="font-semibold text-sm text-slate-700 mb-2">{category}</h4>
                                                <div className="space-y-1">
                                                    {permissions.map(permission => (
                                                        <label key={permission.key} className="flex items-start space-x-2 text-sm">
                                                            <input 
                                                                type="checkbox"
                                                                checked={editingRole.permissions?.includes(permission.key) || false}
                                                                disabled={editingRole.isSystemRole}
                                                                onChange={e => {
                                                                    if (editingRole.isSystemRole) return;
                                                                    const permissions = editingRole.permissions || [];
                                                                    if (e.target.checked) {
                                                                        setEditingRole(prev => ({
                                                                            ...prev,
                                                                            permissions: [...permissions, permission.key]
                                                                        }));
                                                                    } else {
                                                                        setEditingRole(prev => ({
                                                                            ...prev,
                                                                            permissions: permissions.filter(p => p !== permission.key)
                                                                        }));
                                                                    }
                                                                }}
                                                                className="mt-1"
                                                            />
                                                            <div>
                                                                <div className="font-medium">{permission.name}</div>
                                                                <div className="text-xs text-slate-500">{permission.description}</div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingRole(null)}
                                    className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                {!editingRole.isSystemRole && (
                                    <button 
                                        type="submit"
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        {editingRole.id ? 'Update Role' : 'Create Role'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManager;