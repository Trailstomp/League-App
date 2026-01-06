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
    const [selectedScope, setSelectedScope] = useState(scope);
    const [selectedTeamId, setSelectedTeamId] = useState(teamId);
    const [feeType, setFeeType] = useState('all'); // 'all', 'player', 'team'
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Determine user permissions
    const isLeagueAdmin = currentUser?.role === 'admin' || 
                          currentUser?.roles?.includes('admin') ||
                          currentUser?.isAdmin;
    
    const isTeamCoachOrAdmin = (tId) => {
        if (isLeagueAdmin) return true;
        
        // Check if user is coach/admin for this specific team
        const userRoles = currentUser?.roles || [currentUser?.role];
        const isCoach = userRoles.includes('coach');
        
        // Check team assignments
        const userTeams = currentUser?.teamAssignments?.map(a => a.teamId) || [];
        if (currentUser?.teamId) userTeams.push(currentUser.teamId);
        
        return isCoach && userTeams.includes(tId);
    };
    
    // Teams the current user can manage
    const manageableTeams = teams.filter(t => isTeamCoachOrAdmin(t.id));
    
    const canManageFees = isLeagueAdmin || manageableTeams.length > 0;
    const canManageTeamFees = isLeagueAdmin; // Only league admin can create team-level fees
    const canManagePlayerFees = canManageFees; // Both league admin and team coaches can manage player fees
    
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Build query params based on selected scope
            const feesParams = new URLSearchParams();
            if (selectedScope) feesParams.append('scope', selectedScope);
            if (selectedTeamId) feesParams.append('team_id', selectedTeamId);
            if (feeType !== 'all') feesParams.append('fee_type', feeType);
            
            const assignmentParams = new URLSearchParams();
            if (selectedTeamId) assignmentParams.append('team_id', selectedTeamId);
            
            const [feesRes, assignmentsRes, summaryRes] = await Promise.all([
                fetch(`${backendUrl}/api/fees?${feesParams}`),
                fetch(`${backendUrl}/api/fee-assignments?${assignmentParams}`),
                fetch(`${backendUrl}/api/fees/summary?${assignmentParams}`)
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
    }, [backendUrl, selectedScope, selectedTeamId, feeType]);
    
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
                    scope: selectedScope,
                    team_id: selectedTeamId,
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        💰 Fee Management
                    </h2>
                    <p className="text-slate-600">
                        {isLeagueAdmin 
                            ? 'Manage league and team fees, payments, and invoicing'
                            : 'Manage player fees for your team(s)'}
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
            
            {/* Scope & Filter Controls */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Scope Selection - League Admin Only */}
                    {isLeagueAdmin && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">Scope:</label>
                            <select
                                value={selectedScope}
                                onChange={(e) => {
                                    setSelectedScope(e.target.value);
                                    if (e.target.value === 'league') setSelectedTeamId(null);
                                }}
                                className="px-3 py-1.5 border rounded-lg text-sm"
                            >
                                <option value="league">League-wide</option>
                                <option value="team">Team-specific</option>
                            </select>
                        </div>
                    )}
                    
                    {/* Team Selection */}
                    {(selectedScope === 'team' || !isLeagueAdmin) && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">Team:</label>
                            <select
                                value={selectedTeamId || ''}
                                onChange={(e) => setSelectedTeamId(e.target.value || null)}
                                className="px-3 py-1.5 border rounded-lg text-sm"
                            >
                                {isLeagueAdmin ? (
                                    <>
                                        <option value="">All Teams</option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {manageableTeams.length === 0 ? (
                                            <option value="">No teams assigned</option>
                                        ) : (
                                            manageableTeams.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))
                                        )}
                                    </>
                                )}
                            </select>
                        </div>
                    )}
                    
                    {/* Fee Type Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700">Fee Type:</label>
                        <select
                            value={feeType}
                            onChange={(e) => setFeeType(e.target.value)}
                            className="px-3 py-1.5 border rounded-lg text-sm"
                        >
                            <option value="all">All Fees</option>
                            <option value="player">Player Fees</option>
                            {isLeagueAdmin && <option value="team">Team Fees</option>}
                        </select>
                    </div>
                </div>
                
                {/* Permission Indicator */}
                <div className="flex items-center gap-2 text-sm">
                    {isLeagueAdmin ? (
                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            👑 League Admin - Full access to all fees
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            🏆 Team Coach/Admin - Manage player fees for your team(s)
                        </span>
                    )}
                </div>
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
                    {[
                        { id: 'fees', label: 'Fees', icon: '📋' },
                        { id: 'assignments', label: 'Assignments', icon: '👥' },
                        { id: 'payments', label: 'Payments', icon: '💳' },
                        { id: 'settings', label: 'Payment Methods', icon: '⚙️' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.icon} {tab.label}
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
                        isLeagueAdmin={isLeagueAdmin}
                    />
                )}
                
                {activeTab === 'assignments' && (
                    <FeeAssignments
                        assignments={assignments}
                        fees={fees}
                        teams={isLeagueAdmin ? teams : manageableTeams}
                        players={players}
                        currentUser={currentUser}
                        onRefresh={loadData}
                        canManage={canManageFees}
                        selectedTeamId={selectedTeamId}
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
                        scope={selectedScope}
                        teamId={selectedTeamId}
                        currentUser={currentUser}
                        canManage={canManageFees}
                        isLeagueAdmin={isLeagueAdmin}
                        teams={isLeagueAdmin ? teams : manageableTeams}
                    />
                )}
            </div>
            
            {/* Fee Form Modal */}
            {showFeeForm && (
                <FeeForm
                    fee={editingFee}
                    onSubmit={editingFee ? (data) => handleUpdateFee(editingFee.id, data) : handleCreateFee}
                    onClose={() => { setShowFeeForm(false); setEditingFee(null); }}
                    teams={isLeagueAdmin ? teams : manageableTeams}
                    isLeagueAdmin={isLeagueAdmin}
                    selectedTeamId={selectedTeamId}
                />
            )}
        </div>
    );
};

export default FeeManager;
