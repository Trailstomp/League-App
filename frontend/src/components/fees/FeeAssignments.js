import React, { useState } from 'react';

const FeeAssignments = ({ assignments, fees, teams, players, currentUser, onRefresh, canManage }) => {
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState('');
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [usePaymentPlan, setUsePaymentPlan] = useState(false);
    const [installments, setInstallments] = useState(3);
    const [filter, setFilter] = useState('all');
    const [assigning, setAssigning] = useState(false);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    const handleAssign = async () => {
        if (!selectedFee) return;
        
        setAssigning(true);
        try {
            const response = await fetch(`${backendUrl}/api/fees/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fee_id: selectedFee,
                    player_ids: selectedPlayers,
                    team_ids: selectedTeams,
                    use_payment_plan: usePaymentPlan,
                    installments,
                    assigned_by: currentUser?.id || 'system'
                })
            });
            
            if (response.ok) {
                setShowAssignModal(false);
                setSelectedFee('');
                setSelectedPlayers([]);
                setSelectedTeams([]);
                onRefresh();
            }
        } catch (error) {
            console.error('Error assigning fee:', error);
        }
        setAssigning(false);
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'partial': return 'bg-amber-100 text-amber-700';
            case 'overdue': return 'bg-red-100 text-red-700';
            case 'waived': return 'bg-slate-100 text-slate-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };
    
    const filteredAssignments = assignments.filter(a => {
        if (filter === 'all') return true;
        return a.status === filter;
    });
    
    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                    </select>
                    <span className="text-sm text-slate-600">
                        {filteredAssignments.length} assignments
                    </span>
                </div>
                
                {canManage && (
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        ➕ Assign Fee
                    </button>
                )}
            </div>
            
            {/* Assignments Table */}
            {filteredAssignments.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-slate-800">No Fee Assignments</h3>
                    <p className="text-slate-600">Assign fees to players or teams to track payments</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assigned To</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fee</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Paid</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Due</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredAssignments.map(assignment => (
                                <tr key={assignment.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-800">
                                            {assignment.player_name || assignment.team_name || 'Unknown'}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {assignment.assignment_type === 'per_player' ? 'Player' : 'Team'}
                                            {assignment.is_payment_plan && ` • ${assignment.installments_paid}/${assignment.installments_total} payments`}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {assignment.fee_name}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">
                                        ${assignment.total_amount?.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right text-green-600">
                                        ${assignment.amount_paid?.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right text-amber-600">
                                        ${assignment.amount_due?.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                                            {assignment.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-slate-800">Assign Fee</h2>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Select Fee */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Fee *</label>
                                <select
                                    value={selectedFee}
                                    onChange={(e) => setSelectedFee(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="">Choose a fee...</option>
                                    {fees.map(fee => (
                                        <option key={fee.id} value={fee.id}>
                                            {fee.name} - ${fee.amount}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {selectedFee && (() => {
                                const fee = fees.find(f => f.id === selectedFee);
                                return fee?.assignment_type === 'per_player' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Players</label>
                                        <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                                            {players.map(player => (
                                                <label key={player.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPlayers.includes(player.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedPlayers(prev => [...prev, player.id]);
                                                            } else {
                                                                setSelectedPlayers(prev => prev.filter(id => id !== player.id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm">{player.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{selectedPlayers.length} selected</p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Teams</label>
                                        <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                                            {teams.map(team => (
                                                <label key={team.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTeams.includes(team.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedTeams(prev => [...prev, team.id]);
                                                            } else {
                                                                setSelectedTeams(prev => prev.filter(id => id !== team.id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm">{team.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{selectedTeams.length} selected</p>
                                    </div>
                                );
                            })()}
                            
                            {/* Payment Plan */}
                            {selectedFee && fees.find(f => f.id === selectedFee)?.allow_payment_plan && (
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={usePaymentPlan}
                                            onChange={(e) => setUsePaymentPlan(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Use Payment Plan</span>
                                    </label>
                                    
                                    {usePaymentPlan && (
                                        <div className="mt-3 ml-7">
                                            <label className="text-sm text-slate-600">Number of Installments</label>
                                            <select
                                                value={installments}
                                                onChange={(e) => setInstallments(parseInt(e.target.value))}
                                                className="ml-2 px-2 py-1 border rounded"
                                            >
                                                {[2, 3, 4, 5, 6].map(n => (
                                                    <option key={n} value={n}>{n}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={assigning || !selectedFee || (selectedPlayers.length === 0 && selectedTeams.length === 0)}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {assigning ? 'Assigning...' : 'Assign Fee'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeeAssignments;
