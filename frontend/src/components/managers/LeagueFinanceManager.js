import React, { useState, useEffect } from 'react';

/**
 * LeagueFinanceManager - League-wide finance overview for admins
 * Shows all team finances and league-level income/expenses
 */
const LeagueFinanceManager = ({ teams, currentUser }) => {
    const [leagueSummary, setLeagueSummary] = useState(null);
    const [allTransactions, setAllTransactions] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamTransactions, setTeamTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [categories, setCategories] = useState({ income: [], expense: [] });
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('all');
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    const [formData, setFormData] = useState({
        type: 'income',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        team_id: '',
        scope: 'league'
    });

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${backendUrl}/api/finance/categories`);
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, [backendUrl]);

    // Fetch league finance summary
    const fetchLeagueSummary = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/finance/league/summary`);
            if (response.ok) {
                const data = await response.json();
                setLeagueSummary(data);
            }
        } catch (error) {
            console.error('Error fetching league summary:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all transactions
    const fetchAllTransactions = async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') {
                params.append('type', filter);
            }
            const response = await fetch(`${backendUrl}/api/finance/transactions?${params}`);
            if (response.ok) {
                const data = await response.json();
                setAllTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    // Fetch team transactions
    const fetchTeamTransactions = async (teamId) => {
        if (!teamId) return;
        try {
            const response = await fetch(`${backendUrl}/api/finance/transactions?scope=team&scope_id=${teamId}`);
            if (response.ok) {
                const data = await response.json();
                setTeamTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error('Error fetching team transactions:', error);
        }
    };

    useEffect(() => {
        fetchLeagueSummary();
        fetchAllTransactions();
    }, [filter]);

    useEffect(() => {
        if (selectedTeam) {
            fetchTeamTransactions(selectedTeam.team_id);
        }
    }, [selectedTeam]);

    // Handle form submission (for league-level transactions)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.category) {
            setMessage('Please fill in all required fields');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
                team_id: formData.team_id || null,
                scope: formData.team_id ? 'team' : 'league',
                created_by: currentUser?.id,
                created_by_name: currentUser?.name
            };

            const response = await fetch(`${backendUrl}/api/finance/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setMessage('✅ Transaction added!');
                setShowAddForm(false);
                setFormData({
                    type: 'income',
                    amount: '',
                    category: '',
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    team_id: '',
                    scope: 'league'
                });
                fetchLeagueSummary();
                fetchAllTransactions();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to save transaction'}`);
            }
        } catch (error) {
            setMessage('❌ Error saving transaction');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Handle delete
    const handleDelete = async (transactionId) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;

        try {
            const response = await fetch(`${backendUrl}/api/finance/transactions/${transactionId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMessage('✅ Transaction deleted');
                fetchLeagueSummary();
                fetchAllTransactions();
                if (selectedTeam) {
                    fetchTeamTransactions(selectedTeam.team_id);
                }
            } else {
                setMessage('❌ Failed to delete transaction');
            }
        } catch (error) {
            setMessage('❌ Error deleting transaction');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    // Get team name by ID
    const getTeamName = (teamId) => {
        if (!teamId) return 'League';
        const team = teams?.find(t => t.id === teamId);
        return team?.name || teamId;
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">League Finance</h2>
                    <p className="text-sm text-slate-600">Overview of all team and league finances</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({
                            type: 'income',
                            amount: '',
                            category: '',
                            date: new Date().toISOString().split('T')[0],
                            description: '',
                            team_id: '',
                            scope: 'league'
                        });
                        setShowAddForm(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    data-testid="add-league-transaction-btn"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Transaction
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* League Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium">Total Income (All)</div>
                    <div className="text-2xl font-bold text-green-700">{formatCurrency(leagueSummary?.total_income)}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm text-red-600 font-medium">Total Expenses (All)</div>
                    <div className="text-2xl font-bold text-red-700">{formatCurrency(leagueSummary?.total_expense)}</div>
                </div>
                <div className={`${(leagueSummary?.total_balance || 0) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
                    <div className={`text-sm font-medium ${(leagueSummary?.total_balance || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Overall Balance</div>
                    <div className={`text-2xl font-bold ${(leagueSummary?.total_balance || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(leagueSummary?.total_balance)}</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-sm text-purple-600 font-medium">League-Level Balance</div>
                    <div className="text-2xl font-bold text-purple-700">{formatCurrency(leagueSummary?.league_balance)}</div>
                </div>
            </div>

            {/* Team Summaries */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Team Finance Summary</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Team</th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-700">Income</th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-700">Expenses</th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-700">Balance</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-700">Transactions</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leagueSummary?.team_summaries?.length > 0 ? (
                                leagueSummary.team_summaries.map((ts) => (
                                    <tr key={ts.team_id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{getTeamName(ts.team_id)}</td>
                                        <td className="px-4 py-3 text-right text-green-600">{formatCurrency(ts.total_income)}</td>
                                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(ts.total_expense)}</td>
                                        <td className={`px-4 py-3 text-right font-semibold ${ts.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {formatCurrency(ts.balance)}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-600">{ts.transaction_count}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setSelectedTeam(ts)}
                                                className="px-3 py-1 text-blue-600 hover:bg-blue-100 rounded transition-colors text-sm"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                        No team finance data yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* All Transactions */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">All Transactions</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('income')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${filter === 'income' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}
                        >
                            Income
                        </button>
                        <button
                            onClick={() => setFilter('expense')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${filter === 'expense' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}
                        >
                            Expenses
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Team/Scope</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allTransactions.length > 0 ? (
                                allTransactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-slate-600">{t.date}</td>
                                        <td className="px-4 py-3 text-slate-800">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.scope === 'league' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {t.scope === 'league' ? 'League' : getTeamName(t.team_id)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {t.type === 'income' ? '↑' : '↓'} {t.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-800">{t.category}</td>
                                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{t.description || '—'}</td>
                                        <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                        No transactions recorded yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Team Detail Modal */}
            {selectedTeam && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTeam(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{getTeamName(selectedTeam.team_id)} - Finance Details</h3>
                                <p className="text-sm text-slate-600">
                                    Balance: <span className={selectedTeam.balance >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(selectedTeam.balance)}</span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedTeam(null)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Date</th>
                                        <th className="px-4 py-2 text-left">Type</th>
                                        <th className="px-4 py-2 text-left">Category</th>
                                        <th className="px-4 py-2 text-left">Description</th>
                                        <th className="px-4 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {teamTransactions.map(t => (
                                        <tr key={t.id}>
                                            <td className="px-4 py-2">{t.date}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-0.5 rounded text-xs ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">{t.category}</td>
                                            <td className="px-4 py-2 text-slate-600">{t.description || '—'}</td>
                                            <td className={`px-4 py-2 text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(t.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Transaction Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-lg text-slate-800">Add Transaction</h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Scope Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                                <select
                                    value={formData.team_id}
                                    onChange={(e) => setFormData({...formData, team_id: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">League Level</option>
                                    {teams?.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Type Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, type: 'income', category: ''})}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${formData.type === 'income' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                                    >
                                        Income
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, type: 'expense', category: ''})}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${formData.type === 'expense' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                                    >
                                        Expense
                                    </button>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    required
                                >
                                    <option value="">Select category...</option>
                                    {categories[formData.type]?.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Optional notes..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${formData.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                >
                                    {saving ? 'Saving...' : 'Add Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeagueFinanceManager;
