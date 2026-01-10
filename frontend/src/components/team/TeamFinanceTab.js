import React, { useState, useEffect } from 'react';

/**
 * TeamFinanceTab - Finance register for tracking team income and expenses
 */
const TeamFinanceTab = ({ team, currentUser }) => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [categories, setCategories] = useState({ income: [], expense: [] });
    const [filter, setFilter] = useState('all'); // all, income, expense
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    const [formData, setFormData] = useState({
        type: 'income',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
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

    // Fetch transactions
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                scope: 'team',
                scope_id: team.id
            });
            if (filter !== 'all') {
                params.append('type', filter);
            }
            
            const response = await fetch(`${backendUrl}/api/finance/transactions?${params}`);
            if (response.ok) {
                const data = await response.json();
                setTransactions(data.transactions || []);
                setSummary(data.summary || {});
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (team?.id) {
            fetchTransactions();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team?.id, filter]);

    // Handle form submission
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
                team_id: team.id,
                scope: 'team',
                created_by: currentUser?.id,
                created_by_name: currentUser?.name
            };

            const url = editingTransaction 
                ? `${backendUrl}/api/finance/transactions/${editingTransaction.id}`
                : `${backendUrl}/api/finance/transactions`;
            
            const method = editingTransaction ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setMessage(editingTransaction ? '✅ Transaction updated!' : '✅ Transaction added!');
                setShowAddForm(false);
                setEditingTransaction(null);
                setFormData({
                    type: 'income',
                    amount: '',
                    category: '',
                    date: new Date().toISOString().split('T')[0],
                    description: ''
                });
                fetchTransactions();
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
                fetchTransactions();
            } else {
                setMessage('❌ Failed to delete transaction');
            }
        } catch (error) {
            setMessage('❌ Error deleting transaction');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    // Handle edit
    const handleEdit = (transaction) => {
        setFormData({
            type: transaction.type,
            amount: transaction.amount.toString(),
            category: transaction.category,
            date: transaction.date,
            description: transaction.description || ''
        });
        setEditingTransaction(transaction);
        setShowAddForm(true);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    if (loading && transactions.length === 0) {
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
                    <h2 className="text-2xl font-bold text-slate-800">Finance Register</h2>
                    <p className="text-sm text-slate-600">Track team income and expenses</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTransaction(null);
                        setFormData({
                            type: 'income',
                            amount: '',
                            category: '',
                            date: new Date().toISOString().split('T')[0],
                            description: ''
                        });
                        setShowAddForm(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    data-testid="add-transaction-btn"
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium">Total Income</div>
                    <div className="text-2xl font-bold text-green-700">{formatCurrency(summary.total_income)}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-sm text-red-600 font-medium">Total Expenses</div>
                    <div className="text-2xl font-bold text-red-700">{formatCurrency(summary.total_expense)}</div>
                </div>
                <div className={`${(summary.balance || 0) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
                    <div className={`text-sm font-medium ${(summary.balance || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Balance</div>
                    <div className={`text-2xl font-bold ${(summary.balance || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(summary.balance)}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-600 font-medium">Transactions</div>
                    <div className="text-2xl font-bold text-slate-700">{summary.transaction_count || 0}</div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('income')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'income' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                >
                    Income
                </button>
                <button
                    onClick={() => setFilter('expense')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'expense' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                >
                    Expenses
                </button>
            </div>

            {/* Transactions Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Added By</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.length > 0 ? (
                                transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-slate-600">{t.date}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {t.type === 'income' ? '↑ Income' : '↓ Expense'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-800">{t.category}</td>
                                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{t.description || '—'}</td>
                                        <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-sm">{t.created_by_name || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(t)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p>No transactions recorded yet</p>
                                        <p className="text-sm mt-1">Click "Add Transaction" to get started</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Transaction Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                            </h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Type Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Type</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, type: 'income', category: ''})}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${formData.type === 'income' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                    >
                                        ↑ Income
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, type: 'expense', category: ''})}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${formData.type === 'expense' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                    >
                                        ↓ Expense
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
                                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select a category...</option>
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setEditingTransaction(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${formData.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                >
                                    {saving ? 'Saving...' : editingTransaction ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamFinanceTab;
