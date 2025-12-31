import React, { useState, useEffect, useCallback } from 'react';
import FeeList from './FeeList';
import FeeForm from './FeeForm';
import FeeAssignments from './FeeAssignments';
import PaymentRegister from './PaymentRegister';
import PaymentConfig from './PaymentConfig';

const FeeManager = ({ teams = [], players = [], currentUser, scope = 'league', teamId = null }) => {
    const [activeTab, setActiveTab] = useState('fees');
    const [fees, setFees] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFeeForm, setShowFeeForm] = useState(false);
    const [editingFee, setEditingFee] = useState(null);
    const [summary, setSummary] = useState(null);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Load fees
            const feesParams = new URLSearchParams();
            if (scope) feesParams.append('scope', scope);
            if (teamId) feesParams.append('team_id', teamId);
            
            const [feesRes, assignmentsRes, summaryRes] = await Promise.all([
                fetch(`${backendUrl}/api/fees?${feesParams}`),
                fetch(`${backendUrl}/api/fee-assignments${teamId ? `?team_id=${teamId}` : ''}`),
                fetch(`${backendUrl}/api/fees/summary${teamId ? `?team_id=${teamId}` : ''}`)
            ]);
            
            if (feesRes.ok) {
                const data = await feesRes.json();
                setFees(data.fees || []);
            }
            
            if (assignmentsRes.ok) {
                const data = await assignmentsRes.json();
                setAssignments(data.assignments || []);
            }
            
            if (summaryRes.ok) {
                const data = await summaryRes.json();
                setSummary(data);
            }
        } catch (error) {
            console.error('Error loading fee data:', error);
        } finally {
            setLoading(false);
        }
    }, [backendUrl, scope, teamId]);
    
    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleCreateFee = async (feeData) => {
        try {
            const response = await fetch(`${backendUrl}/api/fees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...feeData,
                    scope,
                    team_id: teamId,
                    created_by: currentUser?.id || 'system'
                })
            });
            
            if (response.ok) {
                setShowFeeForm(false);
                setEditingFee(null);
                loadData();
            }
        } catch (error) {
            console.error('Error creating fee:', error);
        }
    };
    
    const handleUpdateFee = async (feeId, updates) => {
        try {
            const response = await fetch(`${backendUrl}/api/fees/${feeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...updates,
                    updated_by: currentUser?.id || 'system'
                })
            });
            
            if (response.ok) {
                setShowFeeForm(false);
                setEditingFee(null);
                loadData();
            }
        } catch (error) {
            console.error('Error updating fee:', error);
        }
    };
    
    const handleDeleteFee = async (feeId) => {
        if (!window.confirm('Are you sure you want to archive this fee?')) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/fees/${feeId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                loadData();
            }
        } catch (error) {
            console.error('Error deleting fee:', error);
        }
    };
    
    const canManageFees = currentUser?.role === 'admin' || 
                          currentUser?.role === 'coach' || 
                          currentUser?.role === 'captain' ||
                          currentUser?.isAdmin;
    
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        💰 Fee Management
                    </h2>
                    <p className="text-slate-600">
                        {scope === 'team' ? 'Team' : 'League'} fees, payments, and invoicing
                    </p>
                </div>
                
                {canManageFees && (
                    <button
                        onClick={() => { setEditingFee(null); setShowFeeForm(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span>➕</span> Create Fee
                    </button>
                )}
            </div>
            
            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-2xl font-bold text-slate-800">
                            ${summary.total_amount?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-slate-600">Total Fees</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-2xl font-bold text-green-600">
                            ${summary.total_collected?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-slate-600">Collected</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-2xl font-bold text-amber-600">
                            ${summary.total_outstanding?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-slate-600">Outstanding</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">
                            {summary.collection_rate?.toFixed(1) || 0}%
                        </div>
                        <div className="text-sm text-slate-600">Collection Rate</div>
                    </div>
                </div>
            )}
            
            {/* Tab Navigation */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-8">
                    {['fees', 'assignments', 'payments', 'settings'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 px-1 border-b-2 font-medium text-sm capitalize ${
                                activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab === 'fees' && '📋 '}
                            {tab === 'assignments' && '👥 '}
                            {tab === 'payments' && '💳 '}
                            {tab === 'settings' && '⚙️ '}
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            
            {/* Tab Content */}
            <div className="bg-white rounded-lg border shadow-sm">
                {activeTab === 'fees' && (
                    <FeeList
                        fees={fees}
                        onEdit={(fee) => { setEditingFee(fee); setShowFeeForm(true); }}
                        onDelete={handleDeleteFee}
                        onAssign={(fee) => setActiveTab('assignments')}
                        canManage={canManageFees}
                    />
                )}
                
                {activeTab === 'assignments' && (
                    <FeeAssignments
                        assignments={assignments}
                        fees={fees}
                        teams={teams}
                        players={players}
                        currentUser={currentUser}
                        onRefresh={loadData}
                        canManage={canManageFees}
                    />
                )}
                
                {activeTab === 'payments' && (
                    <PaymentRegister
                        assignments={assignments}
                        currentUser={currentUser}
                        onRefresh={loadData}
                        canManage={canManageFees}
                    />
                )}
                
                {activeTab === 'settings' && (
                    <PaymentConfig
                        scope={scope}
                        teamId={teamId}
                        currentUser={currentUser}
                        canManage={canManageFees}
                    />
                )}
            </div>
            
            {/* Fee Form Modal */}
            {showFeeForm && (
                <FeeForm
                    fee={editingFee}
                    onSubmit={editingFee ? (data) => handleUpdateFee(editingFee.id, data) : handleCreateFee}
                    onClose={() => { setShowFeeForm(false); setEditingFee(null); }}
                    teams={teams}
                />
            )}
        </div>
    );
};

export default FeeManager;
