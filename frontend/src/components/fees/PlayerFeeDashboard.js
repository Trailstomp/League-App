import React, { useState, useEffect, useCallback } from 'react';

const PlayerFeeDashboard = ({ currentUser, playerId = null }) => {
    const [fees, setFees] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(null);
    const [activeTab, setActiveTab] = useState('outstanding');
    const [paymentConfig, setPaymentConfig] = useState(null);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const userId = playerId || currentUser?.id;
    
    const loadFees = useCallback(async () => {
        if (!userId) return;
        
        try {
            setLoading(true);
            
            // Load player's fee assignments
            const [assignmentsRes, paymentsRes, configRes] = await Promise.all([
                fetch(`${backendUrl}/api/fee-assignments?player_id=${userId}`),
                fetch(`${backendUrl}/api/payments?player_id=${userId}`),
                fetch(`${backendUrl}/api/payment-config`)
            ]);
            
            if (assignmentsRes.ok) {
                const data = await assignmentsRes.json();
                setFees(data.assignments || []);
            }
            
            if (paymentsRes.ok) {
                const data = await paymentsRes.json();
                // Filter payments for this user's assignments
                const userPayments = data.payments || [];
                setPayments(userPayments);
            }
            
            if (configRes.ok) {
                const data = await configRes.json();
                setPaymentConfig(data);
            }
        } catch (error) {
            console.error('Error loading fees:', error);
        }
        setLoading(false);
    }, [backendUrl, userId]);
    
    useEffect(() => {
        loadFees();
    }, [loadFees]);
    
    // Check for payment success from URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const assignmentId = urlParams.get('assignment_id');
        
        if (sessionId && assignmentId) {
            // Verify the payment
            verifyPayment(sessionId, assignmentId);
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);
    
    const verifyPayment = async (sessionId, assignmentId) => {
        try {
            const response = await fetch(`${backendUrl}/api/payments/stripe/status/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.payment_status === 'paid') {
                    alert('✅ Payment successful! Thank you.');
                    loadFees(); // Refresh the data
                }
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
        }
    };
    
    const handleStripePayment = async (assignment) => {
        setProcessingPayment(assignment.id);
        try {
            const response = await fetch(`${backendUrl}/api/payments/stripe/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignment_id: assignment.id,
                    origin_url: window.location.origin
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                // Redirect to Stripe checkout
                window.location.href = data.checkout_url;
            } else {
                const error = await response.json();
                alert(error.detail || 'Error creating payment session');
            }
        } catch (error) {
            console.error('Stripe checkout error:', error);
            alert('Error connecting to payment service');
        }
        setProcessingPayment(null);
    };
    
    const getStatusBadge = (status) => {
        const styles = {
            paid: 'bg-green-100 text-green-700',
            partial: 'bg-amber-100 text-amber-700',
            unpaid: 'bg-blue-100 text-blue-700',
            overdue: 'bg-red-100 text-red-700',
            waived: 'bg-slate-100 text-slate-500'
        };
        return styles[status] || 'bg-slate-100 text-slate-600';
    };
    
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };
    
    // Calculate totals
    const totalDue = fees.reduce((sum, f) => sum + (f.amount_due || 0), 0);
    const totalPaid = fees.reduce((sum, f) => sum + (f.amount_paid || 0), 0);
    const outstandingFees = fees.filter(f => f.amount_due > 0);
    const paidFees = fees.filter(f => f.status === 'paid');
    const overdueFees = fees.filter(f => f.status === 'overdue');
    
    if (!currentUser && !playerId) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-4">🔒</div>
                    <h2 className="text-xl font-bold text-amber-800 mb-2">Login Required</h2>
                    <p className="text-amber-700">Please log in to view your fees and make payments.</p>
                </div>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">💰 My Fees</h1>
                <p className="text-slate-600">View and pay your outstanding fees</p>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDue)}</div>
                    <div className="text-sm text-slate-600">Total Due</div>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                    <div className="text-sm text-slate-600">Total Paid</div>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-2xl font-bold text-amber-600">{outstandingFees.length}</div>
                    <div className="text-sm text-slate-600">Outstanding</div>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-2xl font-bold text-red-600">{overdueFees.length}</div>
                    <div className="text-sm text-slate-600">Overdue</div>
                </div>
            </div>
            
            {/* Alert for overdue */}
            {overdueFees.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <h3 className="font-semibold text-red-800">You have {overdueFees.length} overdue fee(s)</h3>
                        <p className="text-sm text-red-700">Please make payment as soon as possible to avoid penalties.</p>
                    </div>
                </div>
            )}
            
            {/* Payment Methods Info */}
            {paymentConfig && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">💳 Accepted Payment Methods</h3>
                    <div className="flex flex-wrap gap-2">
                        {paymentConfig.stripe_enabled && (
                            <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border">💳 Credit/Debit Card</span>
                        )}
                        {paymentConfig.paypal_enabled && (
                            <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border">🌐 PayPal</span>
                        )}
                        {paymentConfig.venmo_enabled && (
                            <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border">📱 Venmo {paymentConfig.venmo_username && `(${paymentConfig.venmo_username})`}</span>
                        )}
                        {paymentConfig.zelle_enabled && (
                            <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border">🏦 Zelle {paymentConfig.zelle_email && `(${paymentConfig.zelle_email})`}</span>
                        )}
                        {paymentConfig.cash_enabled && (
                            <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border">💵 Cash</span>
                        )}
                        {paymentConfig.check_enabled && (
                            <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border">📝 Check</span>
                        )}
                    </div>
                    {paymentConfig.payment_instructions && (
                        <p className="mt-2 text-sm text-blue-700">{paymentConfig.payment_instructions}</p>
                    )}
                </div>
            )}
            
            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('outstanding')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'outstanding'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Outstanding ({outstandingFees.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('paid')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'paid'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Paid ({paidFees.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'history'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Payment History ({payments.length})
                    </button>
                </nav>
            </div>
            
            {/* Content */}
            <div className="bg-white rounded-lg border shadow-sm">
                {/* Outstanding Fees */}
                {activeTab === 'outstanding' && (
                    <div className="divide-y divide-slate-200">
                        {outstandingFees.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-4xl mb-4">🎉</div>
                                <h3 className="text-lg font-medium text-slate-800">All Caught Up!</h3>
                                <p className="text-slate-600">You have no outstanding fees.</p>
                            </div>
                        ) : (
                            outstandingFees.map(fee => (
                                <div key={fee.id} className="p-4 md:p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-slate-800">{fee.fee_name}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(fee.status)}`}>
                                                    {fee.status?.toUpperCase()}
                                                </span>
                                            </div>
                                            
                                            <div className="text-sm text-slate-600 space-y-1">
                                                {fee.due_date && (
                                                    <p className={fee.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                                                        Due: {formatDate(fee.due_date)}
                                                        {fee.status === 'overdue' && ' (OVERDUE)'}
                                                    </p>
                                                )}
                                                
                                                {fee.is_payment_plan && (
                                                    <p className="text-blue-600">
                                                        Payment Plan: {fee.installments_paid} of {fee.installments_total} payments made
                                                    </p>
                                                )}
                                                
                                                <div className="flex gap-4 text-sm">
                                                    <span>Total: {formatCurrency(fee.total_amount)}</span>
                                                    <span className="text-green-600">Paid: {formatCurrency(fee.amount_paid)}</span>
                                                    <span className="text-red-600 font-medium">Due: {formatCurrency(fee.amount_due)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2">
                                            {/* Online Payment Button */}
                                            {paymentConfig?.stripe_enabled && (
                                                <button
                                                    onClick={() => handleStripePayment(fee)}
                                                    disabled={processingPayment === fee.id}
                                                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                                                >
                                                    {processingPayment === fee.id ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            💳 Pay {formatCurrency(fee.is_payment_plan ? fee.next_installment_amount || fee.amount_due : fee.amount_due)} Online
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            
                                            {/* Alternative payment info */}
                                            {(paymentConfig?.venmo_enabled || paymentConfig?.zelle_enabled) && (
                                                <div className="text-xs text-slate-500 text-center">
                                                    or pay via {paymentConfig.venmo_enabled ? 'Venmo' : ''} {paymentConfig.venmo_enabled && paymentConfig.zelle_enabled ? '/' : ''} {paymentConfig.zelle_enabled ? 'Zelle' : ''}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                
                {/* Paid Fees */}
                {activeTab === 'paid' && (
                    <div className="divide-y divide-slate-200">
                        {paidFees.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-4xl mb-4">📋</div>
                                <h3 className="text-lg font-medium text-slate-800">No Paid Fees</h3>
                                <p className="text-slate-600">Your paid fees will appear here.</p>
                            </div>
                        ) : (
                            paidFees.map(fee => (
                                <div key={fee.id} className="p-4 md:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-slate-800">{fee.fee_name}</h3>
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                    ✓ PAID
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600">
                                                Paid on: {formatDate(fee.last_payment_date)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-green-600">{formatCurrency(fee.total_amount)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                
                {/* Payment History */}
                {activeTab === 'history' && (
                    <div className="divide-y divide-slate-200">
                        {payments.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-4xl mb-4">📜</div>
                                <h3 className="text-lg font-medium text-slate-800">No Payment History</h3>
                                <p className="text-slate-600">Your payment history will appear here.</p>
                            </div>
                        ) : (
                            payments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date)).map(payment => (
                                <div key={payment.id} className="p-4 md:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">
                                                    {payment.payment_method === 'stripe' ? '💳' : 
                                                     payment.payment_method === 'paypal' ? '🌐' :
                                                     payment.payment_method === 'venmo' ? '📱' :
                                                     payment.payment_method === 'zelle' ? '🏦' :
                                                     payment.payment_method === 'cash' ? '💵' :
                                                     payment.payment_method === 'check' ? '📝' : '💰'}
                                                </span>
                                                <span className="font-medium text-slate-800">{formatCurrency(payment.amount)}</span>
                                                <span className="text-slate-500">via {payment.payment_method}</span>
                                            </div>
                                            <p className="text-sm text-slate-600">{formatDate(payment.payment_date)}</p>
                                            {payment.notes && (
                                                <p className="text-xs text-slate-500 mt-1">{payment.notes}</p>
                                            )}
                                        </div>
                                        <div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            
            {/* Help Section */}
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
                <h4 className="font-medium text-slate-800 mb-2">Need Help?</h4>
                <p>
                    If you have questions about your fees or need to set up a payment plan, 
                    please contact your team coach or league administrator.
                </p>
            </div>
        </div>
    );
};

export default PlayerFeeDashboard;
