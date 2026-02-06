import React, { useState, useEffect } from 'react';

const DivisionManager = ({ teams = [] }) => {
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingDivision, setEditingDivision] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        level: 1,
        color: '#3b82f6'
    });

    useEffect(() => {
        loadDivisions();
    }, []);

    const loadDivisions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/divisions`);
            if (response.ok) {
                const data = await response.json();
                setDivisions(data.divisions || []);
            } else {
                // If no divisions endpoint, extract from teams
                const uniqueDivisions = [...new Set(teams.map(t => t.division).filter(Boolean))];
                const divisionObjects = uniqueDivisions.map((name, index) => ({
                    id: `div_${name.toLowerCase().replace(/\s+/g, '_')}`,
                    name,
                    level: index + 1,
                    teamCount: teams.filter(t => t.division === name).length
                }));
                setDivisions(divisionObjects);
            }
        } catch (error) {
            console.error('Error loading divisions:', error);
            // Extract from teams as fallback
            const uniqueDivisions = [...new Set(teams.map(t => t.division).filter(Boolean))];
            const divisionObjects = uniqueDivisions.map((name, index) => ({
                id: `div_${name.toLowerCase().replace(/\s+/g, '_')}`,
                name,
                level: index + 1,
                teamCount: teams.filter(t => t.division === name).length
            }));
            setDivisions(divisionObjects);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setMessage('❌ Division name is required');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const divisionData = {
                id: editingDivision?.id || `div_${Date.now()}`,
                name: formData.name.trim(),
                description: formData.description.trim(),
                level: parseInt(formData.level) || 1,
                color: formData.color,
                createdAt: editingDivision?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const method = editingDivision ? 'PUT' : 'POST';
            const url = editingDivision 
                ? `${backendUrl}/api/divisions/${editingDivision.id}`
                : `${backendUrl}/api/divisions`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(divisionData)
            });

            if (response.ok) {
                setMessage(`✅ Division ${editingDivision ? 'updated' : 'created'} successfully!`);
                resetForm();
                await loadDivisions();
            } else {
                const errorData = await response.json().catch(() => ({}));
                setMessage(`❌ Failed: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving division:', error);
            setMessage('❌ Error saving division');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 4000);
        }
    };

    const handleEdit = (division) => {
        setEditingDivision(division);
        setFormData({
            name: division.name || '',
            description: division.description || '',
            level: division.level || 1,
            color: division.color || '#3b82f6'
        });
        setShowForm(true);
    };

    const handleDelete = async (divisionId, divisionName) => {
        // Check if division has teams
        const teamsInDivision = teams.filter(t => t.division === divisionName);
        if (teamsInDivision.length > 0) {
            setMessage(`❌ Cannot delete: ${teamsInDivision.length} team(s) are in this division. Reassign them first.`);
            setTimeout(() => setMessage(''), 5000);
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the "${divisionName}" division?`)) {
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/divisions/${divisionId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMessage('✅ Division deleted successfully');
                await loadDivisions();
            } else {
                setMessage('❌ Failed to delete division');
            }
        } catch (error) {
            console.error('Error deleting division:', error);
            setMessage('❌ Error deleting division');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', level: 1, color: '#3b82f6' });
        setEditingDivision(null);
        setShowForm(false);
    };

    // Get team count for a division
    const getTeamCount = (divisionName) => {
        return teams.filter(t => t.division === divisionName && !t.isExternal).length;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Division Manager</h2>
                    <p className="text-slate-600">Create and manage league divisions</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    data-testid="create-division-btn"
                >
                    <span className="mr-2">{showForm ? '✕' : '+'}</span>
                    {showForm ? 'Cancel' : 'Create Division'}
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                    {message}
                </div>
            )}

            {/* Create/Edit Form */}
            {showForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6" data-testid="division-form">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        {editingDivision ? 'Edit Division' : 'Create New Division'}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Division Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="e.g., Premier League, Division 1, Youth"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    data-testid="division-name-input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Level/Order
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.level}
                                    onChange={(e) => handleInputChange('level', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    data-testid="division-level-input"
                                />
                                <p className="text-xs text-slate-500 mt-1">Lower numbers appear first in lists</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Division Color
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => handleInputChange('color', e.target.value)}
                                        className="w-12 h-10 rounded cursor-pointer"
                                        data-testid="division-color-input"
                                    />
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={(e) => handleInputChange('color', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                                        placeholder="#3b82f6"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Optional description..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    data-testid="division-description-input"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-slate-600 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !formData.name.trim()}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                data-testid="save-division-btn"
                            >
                                {saving ? 'Saving...' : editingDivision ? 'Update Division' : 'Create Division'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Divisions List */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">
                        Current Divisions ({divisions.length})
                    </h3>
                </div>
                
                {divisions.length > 0 ? (
                    <div className="divide-y divide-slate-200">
                        {divisions
                            .sort((a, b) => (a.level || 999) - (b.level || 999))
                            .map(division => (
                            <div 
                                key={division.id} 
                                className="p-4 hover:bg-slate-50 flex items-center justify-between"
                                data-testid={`division-item-${division.id}`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div 
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: division.color || '#3b82f6' }}
                                    />
                                    <div>
                                        <h4 className="font-semibold text-slate-800">{division.name}</h4>
                                        <div className="flex items-center space-x-3 text-sm text-slate-500">
                                            <span>Level: {division.level || 1}</span>
                                            <span>•</span>
                                            <span>{getTeamCount(division.name)} team(s)</span>
                                            {division.description && (
                                                <>
                                                    <span>•</span>
                                                    <span>{division.description}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleEdit(division)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit division"
                                        data-testid={`edit-division-${division.id}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(division.id, division.name)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete division"
                                        data-testid={`delete-division-${division.id}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        <div className="text-4xl mb-4">🏆</div>
                        <h3 className="text-lg font-medium mb-2">No divisions yet</h3>
                        <p className="text-sm">Create your first division to organize teams</p>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <span className="text-2xl">💡</span>
                    <div>
                        <h4 className="font-medium text-amber-800">About Divisions</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            Divisions help organize teams into competitive groups. After creating divisions,
                            assign teams to them in the Teams manager. Divisions appear in navigation, 
                            standings, and scheduling filters.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DivisionManager;
