import React, { useState, useEffect } from 'react';
import { getFullImageUrl } from '../../utils/imageUtils';

/**
 * TeamFinanceTab - Finance register for tracking team income, expenses, fees, player payments, and payment links
 * Includes sub-tabs: Transactions | Fees | Player Payments | Payment Links
 */
const TeamFinanceTab = ({ team, currentUser }) => {
    const [activeSubTab, setActiveSubTab] = useState('transactions');
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [categories, setCategories] = useState({ income: [], expense: [] });
    const [filter, setFilter] = useState('all'); // all, income, expense
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    
    // Fees state
    const [fees, setFees] = useState([]);
    const [feesLoading, setFeesLoading] = useState(true);
    const [showAddFeeForm, setShowAddFeeForm] = useState(false);
    const [feeFormData, setFeeFormData] = useState({
        name: '',
        amount: '',
        dueDate: '',
        description: ''
    });

    // Player payments state
    const [players, setPlayers] = useState([]);
    const [playersLoading, setPlayersLoading] = useState(true);
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    // Payment links state
    const [paymentLinks, setPaymentLinks] = useState({
        venmo: team?.paymentLinks?.venmo || '',
        paypal: team?.paymentLinks?.paypal || '',
        zelle: team?.paymentLinks?.zelle || '',
        cashapp: team?.paymentLinks?.cashapp || '',
        stripe: team?.paymentLinks?.stripe || '',
        customPaymentUrl: team?.paymentLinks?.customPaymentUrl || '',
        customPaymentLabel: team?.paymentLinks?.customPaymentLabel || ''
    });
    
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
            loadFees();
            loadPlayers();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team?.id, filter]);

    // Load Players for payment tracking
    const loadPlayers = async () => {
        try {
            setPlayersLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/players`);
            if (response.ok) {
                const data = await response.json();
                setPlayers(data || []);
            }
        } catch (error) {
            console.error('Error loading players:', error);
        } finally {
            setPlayersLoading(false);
        }
    };

    // Update player payment
    const updatePlayerPayment = async (playerId, paymentData) => {
        setSaving(true);
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/player/${playerId}/payment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            
            if (response.ok) {
                setMessage('✅ Payment updated!');
                loadPlayers();
                setShowPaymentModal(false);
                setSelectedPlayer(null);
            } else {
                setMessage('❌ Failed to update payment');
            }
        } catch (error) {
            setMessage('❌ Error updating payment');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Save payment links
    const handleSavePaymentLinks = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${backendUrl}/api/league-data/teams/${team.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentLinks })
            });
            
            if (response.ok) {
                setMessage('✅ Payment links saved!');
            } else {
                setMessage('❌ Failed to save payment links');
            }
        } catch (error) {
            setMessage('❌ Error saving payment links');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Payment stats
    const paymentStats = {
        total: players.length,
        paid: players.filter(p => p.paymentStatus === 'paid').length,
        partial: players.filter(p => p.paymentStatus === 'partial').length,
        unpaid: players.filter(p => !p.paymentStatus || p.paymentStatus === 'unpaid').length,
        totalPaid: players.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
        totalOwed: players.reduce((sum, p) => sum + (p.amountOwed || 0), 0)
    };

    // Filter players by payment status
    const filteredPlayers = paymentFilter === 'all' 
        ? players 
        : players.filter(p => (p.paymentStatus || 'unpaid') === paymentFilter);

    // Load Fees
    const loadFees = async () => {
        try {
            setFeesLoading(true);
            const response = await fetch(`${backendUrl}/api/fees?teamId=${team.id}`);
            if (response.ok) {
                const data = await response.json();
                setFees(data.fees || []);
            }
        } catch (error) {
            console.error('Error loading fees:', error);
        } finally {
            setFeesLoading(false);
        }
    };

    // Handle Add Fee
    const handleAddFee = async (e) => {
        e.preventDefault();
        
        if (!feeFormData.name.trim() || !feeFormData.amount) {
            setMessage('❌ Name and amount are required');
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/fees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: feeFormData.name,
                    amount: parseFloat(feeFormData.amount),
                    dueDate: feeFormData.dueDate || null,
                    description: feeFormData.description,
                    teamId: team.id,
                    teamName: team.name,
                    scope: 'team',
                    createdBy: currentUser?.id
                })
            });

            if (response.ok) {
                setMessage('✅ Fee created successfully!');
                setShowAddFeeForm(false);
                setFeeFormData({ name: '', amount: '', dueDate: '', description: '' });
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

    // Handle Delete Fee
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

    // Export to CSV
    const handleExportCSV = () => {
        if (transactions.length === 0) {
            setMessage('❌ No transactions to export');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Added By'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(t => [
                t.date,
                t.type,
                `"${t.category}"`,
                `"${(t.description || '').replace(/"/g, '""')}"`,
                t.type === 'income' ? t.amount : -t.amount,
                `"${t.created_by_name || 'Unknown'}"`
            ].join(','))
        ].join('\n');

        // Add summary at the bottom
        const summaryRows = [
            '',
            'Summary',
            `Total Income,${summary.total_income || 0}`,
            `Total Expenses,${summary.total_expense || 0}`,
            `Balance,${summary.balance || 0}`,
            `Total Transactions,${summary.transaction_count || 0}`
        ].join('\n');

        const blob = new Blob([csvContent + '\n' + summaryRows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${team.name.replace(/\s+/g, '_')}_finance_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        setMessage('✅ Report exported successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    if (loading && transactions.length === 0 && activeSubTab === 'transactions') {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Render Fees Sub-Tab
    const renderFeesTab = () => (
        <div className="space-y-6">
            {/* Fees Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Team Fees</h3>
                    <p className="text-slate-600">Manage fees for {team.name}</p>
                </div>
                <button
                    onClick={() => setShowAddFeeForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                    <span>+</span> Add Fee
                </button>
            </div>

            {/* Add Fee Form Modal */}
            {showAddFeeForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Create Team Fee</h3>
                                <button onClick={() => setShowAddFeeForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>

                            <form onSubmit={handleAddFee} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fee Name *</label>
                                    <input
                                        type="text"
                                        value={feeFormData.name}
                                        onChange={(e) => setFeeFormData({...feeFormData, name: e.target.value})}
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
                                            value={feeFormData.amount}
                                            onChange={(e) => setFeeFormData({...feeFormData, amount: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="100.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={feeFormData.dueDate}
                                            onChange={(e) => setFeeFormData({...feeFormData, dueDate: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea
                                        value={feeFormData.description}
                                        onChange={(e) => setFeeFormData({...feeFormData, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        rows={2}
                                        placeholder="Details about the fee..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowAddFeeForm(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg">
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
                    <h3 className="font-semibold text-slate-800">Active Fees</h3>
                </div>
                
                {feesLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : fees.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">💰</div>
                        <p className="text-slate-600">No fees set up yet</p>
                        <p className="text-sm text-slate-500 mt-2">Create a fee to start collecting payments</p>
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
                                    {fee.description && (
                                        <div className="text-xs text-slate-400 mt-1">{fee.description}</div>
                                    )}
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

    return (
        <div className="space-y-6">
            {/* Sub-Tab Navigation */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveSubTab('transactions')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                        activeSubTab === 'transactions'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                >
                    📊 Transactions
                </button>
                <button
                    onClick={() => setActiveSubTab('fees')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                        activeSubTab === 'fees'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                >
                    💰 Fees & Payments
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Render active sub-tab */}
            {activeSubTab === 'fees' ? renderFeesTab() : (
            <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Finance Register</h2>
                    <p className="text-sm text-slate-600">Track team income and expenses</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        disabled={transactions.length === 0}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="export-csv-btn"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </button>
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
                                        <p className="text-sm mt-1">Click &quot;Add Transaction&quot; to get started</p>
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
            </>
            )}
        </div>
    );
};

export default TeamFinanceTab;
