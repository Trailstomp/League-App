import React, { useState } from 'react';

const FeeForm = ({ fee, onSubmit, onClose, teams }) => {
    const [formData, setFormData] = useState({
        name: fee?.name || '',
        description: fee?.description || '',
        fee_type: fee?.fee_type || 'custom',
        assignment_type: fee?.assignment_type || 'per_player',
        amount: fee?.amount || '',
        currency: fee?.currency || 'USD',
        due_date: fee?.due_date?.split('T')[0] || '',
        allow_payment_plan: fee?.allow_payment_plan || false,
        max_installments: fee?.max_installments || 3,
        installment_frequency_days: fee?.installment_frequency_days || 30,
        auto_assign_new_players: fee?.auto_assign_new_players || false,
        auto_assign_teams: fee?.auto_assign_teams || []
    });
    
    const [saving, setSaving] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        const submitData = {
            ...formData,
            amount: parseFloat(formData.amount),
            due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
        };
        
        await onSubmit(submitData);
        setSaving(false);
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-slate-800">
                        {fee ? 'Edit Fee' : 'Create New Fee'}
                    </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fee Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Spring 2025 League Fee"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe what this fee covers..."
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fee Type</label>
                            <select
                                value={formData.fee_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, fee_type: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="league_fee">🏆 League Fee</option>
                                <option value="team_fee">👥 Team Fee</option>
                                <option value="uniform">👕 Uniform</option>
                                <option value="tournament">🎯 Tournament</option>
                                <option value="equipment">🥍 Equipment</option>
                                <option value="custom">📋 Custom</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assignment Type</label>
                            <select
                                value={formData.assignment_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, assignment_type: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="per_player">Per Player</option>
                                <option value="per_team">Per Team</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    {/* Payment Plan Options */}
                    <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={formData.allow_payment_plan}
                                onChange={(e) => setFormData(prev => ({ ...prev, allow_payment_plan: e.target.checked }))}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="font-medium text-slate-700">Allow Payment Plans</span>
                        </label>
                        
                        {formData.allow_payment_plan && (
                            <div className="grid grid-cols-2 gap-4 ml-7">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Max Installments</label>
                                    <select
                                        value={formData.max_installments}
                                        onChange={(e) => setFormData(prev => ({ ...prev, max_installments: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    >
                                        {[2, 3, 4, 5, 6, 12].map(n => (
                                            <option key={n} value={n}>{n} payments</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Payment Frequency</label>
                                    <select
                                        value={formData.installment_frequency_days}
                                        onChange={(e) => setFormData(prev => ({ ...prev, installment_frequency_days: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    >
                                        <option value={7}>Weekly</option>
                                        <option value={14}>Bi-weekly</option>
                                        <option value={30}>Monthly</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Auto-assign Options */}
                    {teams.length > 0 && formData.assignment_type === 'per_player' && (
                        <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.auto_assign_new_players}
                                    onChange={(e) => setFormData(prev => ({ ...prev, auto_assign_new_players: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-slate-700">Auto-assign to new players</span>
                            </label>
                        </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : (fee ? 'Update Fee' : 'Create Fee')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeeForm;
