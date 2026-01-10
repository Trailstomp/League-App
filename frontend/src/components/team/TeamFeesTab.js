import React, { useState, useEffect } from 'react';

const TeamFeesTab = ({ team, currentUser }) => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        dueDate: '',
        description: ''
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadFees();
    }, [team.id]);

    const loadFees = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/fees?teamId=${team.id}`);
            if (response.ok) {
                const data = await response.json();
                setFees(data.fees || []);
            }
        } catch (error) {
            console.error('Error loading fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFee = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.amount) {
            setMessage('❌ Name and amount are required');
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/fees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    amount: parseFloat(formData.amount),
                    dueDate: formData.dueDate || null,
                    description: formData.description,
                    teamId: team.id,
                    teamName: team.name,
                    scope: 'team',
                    createdBy: currentUser?.id
                })
            });

            if (response.ok) {
                setMessage('✅ Fee created successfully!');
                setShowAddForm(false);
                setFormData({ name: '', amount: '', dueDate: '', description: '' });
                loadFees();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to create fee'}`);
            }
        } catch (error) {
            setMessage('❌ Network error');
        }
        setTimeout(() => setMessage(''), 4000);
    };

    const handleDeleteFee = async (feeId) => {
        if (!window.confirm('Delete this fee?')) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/fees/${feeId}`, { method: 'DELETE' });
            if (response.ok) {
                setMessage('✅ Fee deleted');
                loadFees();
            }
        } catch (error) {
            setMessage('❌ Error deleting fee');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Team Fees</h2>
                    <p className="text-slate-600">Manage fees for {team.name}</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                    <span>+</span> Add Fee
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Add Fee Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Create Team Fee</h3>
                                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>

                            <form onSubmit={handleAddFee} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fee Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        placeholder="Season Registration, Tournament Fee, etc."
                                        required
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="100.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        rows={2}
                                        placeholder="Details about the fee..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        Create Fee
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Fees List */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b">
                    <h3 className="font-semibold text-slate-800">Team Fees</h3>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : fees.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">💰</div>
                        <p className="text-slate-600">No fees set up yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {fees.map(fee => (
                            <div key={fee.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-800">{fee.name}</div>
                                    <div className="text-sm text-slate-500">
                                        ${fee.amount?.toFixed(2) || '0.00'}
                                        {fee.dueDate && ` • Due: ${new Date(fee.dueDate).toLocaleDateString()}`}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteFee(fee.id)}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamFeesTab;
