import React from 'react';

const FeeList = ({ fees, onEdit, onDelete, onAssign, canManage }) => {
    const getFeeTypeIcon = (type) => {
        switch (type) {
            case 'league_fee': return '🏆';
            case 'team_fee': return '👥';
            case 'uniform': return '👕';
            case 'tournament': return '🎯';
            case 'equipment': return '🥍';
            default: return '📋';
        }
    };
    
    const getFeeTypeLabel = (type) => {
        return type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Custom';
    };
    
    if (fees.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No Fees Created</h3>
                <p className="text-slate-600">Create your first fee to start tracking payments</p>
            </div>
        );
    }
    
    return (
        <div className="divide-y divide-slate-200">
            {fees.map(fee => (
                <div key={fee.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">{getFeeTypeIcon(fee.fee_type)}</span>
                            <div>
                                <h3 className="font-semibold text-slate-800">{fee.name}</h3>
                                <p className="text-sm text-slate-600">{fee.description}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded">
                                        {getFeeTypeLabel(fee.fee_type)}
                                    </span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                        {fee.assignment_type === 'per_player' ? 'Per Player' : 'Per Team'}
                                    </span>
                                    {fee.allow_payment_plan && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                            Payment Plan Available ({fee.max_installments} installments)
                                        </span>
                                    )}
                                    {fee.due_date && (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                                            Due: {new Date(fee.due_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <div className="text-xl font-bold text-slate-800">
                                ${fee.amount?.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">{fee.currency}</div>
                            
                            {canManage && (
                                <div className="flex gap-2 mt-2 justify-end">
                                    <button
                                        onClick={() => onAssign(fee)}
                                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        Assign
                                    </button>
                                    <button
                                        onClick={() => onEdit(fee)}
                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDelete(fee.id)}
                                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                        Archive
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FeeList;
