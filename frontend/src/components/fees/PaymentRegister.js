import React, { useState } from 'react';

const PaymentRegister = ({ assignments, currentUser, onRefresh, canManage }) => {
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        payment_method: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
        transaction_id: ''
    });
    const [recording, setRecording] = useState(false);
    const [processingStripe, setProcessingStripe] = useState(null);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    const handleRecordPayment = async () => {
        if (!selectedAssignment || !paymentData.amount) return;
        
        setRecording(true);
        try {
            const response = await fetch(`${backendUrl}/api/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignment_id: selectedAssignment.id,
                    amount: parseFloat(paymentData.amount),
                    payment_method: paymentData.payment_method,
                    payment_date: paymentData.payment_date,
                    notes: paymentData.notes,
                    transaction_id: paymentData.transaction_id,
                    recorded_by: currentUser?.id || 'system'
                })
            });
            
            if (response.ok) {
                setShowRecordModal(false);
                setSelectedAssignment(null);
                setPaymentData({
                    amount: '',
                    payment_method: 'cash',
                    payment_date: new Date().toISOString().split('T')[0],
                    notes: '',
                    transaction_id: ''
                });
                onRefresh();
            }
        } catch (error) {
            console.error('Error recording payment:', error);
        }
        setRecording(false);
    };
    
    const handleStripeCheckout = async (assignment) => {
        setProcessingStripe(assignment.id);
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
                alert(error.detail || 'Error creating checkout session');
            }
        } catch (error) {
            console.error('Error creating Stripe checkout:', error);
            alert('Error connecting to payment service');
        }
        setProcessingStripe(null);
    };
    
    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'stripe': return '💳';
            case 'paypal': return '🌐';
            case 'venmo': return '📱';
            case 'zelle': return '🏦';
            case 'cash': return '💵';
            case 'check': return '📝';
            default: return '💰';
        }
    };
    
    // Filter assignments with outstanding balance
    const outstandingAssignments = assignments.filter(a => a.amount_due > 0);
    
    return (
        <div className="p-4">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Payment Register</h3>
                <p className="text-sm text-slate-600">Record and track payments for fee assignments</p>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="text-2xl font-bold text-amber-700">
                        {outstandingAssignments.length}
                    </div>
                    <div className="text-sm text-amber-600">Outstanding Invoices</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-700">
                        {assignments.filter(a => a.status === 'overdue').length}
                    </div>
                    <div className="text-sm text-red-600">Overdue</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">
                        ${assignments.filter(a => a.status === 'paid').reduce((sum, a) => sum + a.total_amount, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Collected This Period</div>
                </div>
            </div>
            
            {/* Outstanding Payments */}
            {outstandingAssignments.length === 0 ? (
                <div className="text-center py-12 bg-green-50 rounded-lg">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-lg font-medium text-green-800">All Caught Up!</h3>
                    <p className="text-green-600">No outstanding payments</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <h4 className="font-medium text-slate-700">Outstanding Payments</h4>
                    
                    {outstandingAssignments.map(assignment => (
                        <div key={assignment.id} className="p-4 bg-white rounded-lg border shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <div className="font-semibold text-slate-800">
                                        {assignment.player_name || assignment.team_name}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        {assignment.fee_name}
                                        {assignment.is_payment_plan && (
                                            <span className="ml-2 text-blue-600">
                                                • Payment Plan ({assignment.installments_paid}/{assignment.installments_total})
                                            </span>
                                        )}
                                    </div>
                                    {assignment.due_date && (
                                        <div className={`text-xs mt-1 ${
                                            assignment.status === 'overdue' ? 'text-red-600' : 'text-slate-500'
                                        }`}>
                                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                                            {assignment.status === 'overdue' && ' (OVERDUE)'}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-800">
                                            ${assignment.amount_due?.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            of ${assignment.total_amount?.toLocaleString()} total
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {/* Stripe Pay Button */}
                                        <button
                                            onClick={() => handleStripeCheckout(assignment)}
                                            disabled={processingStripe === assignment.id}
                                            className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            💳 {processingStripe === assignment.id ? 'Loading...' : 'Pay Online'}
                                        </button>
                                        
                                        {canManage && (
                                            <button
                                                onClick={() => {
                                                    setSelectedAssignment(assignment);
                                                    setPaymentData(prev => ({
                                                        ...prev,
                                                        amount: assignment.is_payment_plan 
                                                            ? assignment.next_installment_amount || (assignment.amount_due / (assignment.installments_total - assignment.installments_paid))
                                                            : assignment.amount_due
                                                    }));
                                                    setShowRecordModal(true);
                                                }}
                                                className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1"
                                            >
                                                ➕ Record Payment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Record Payment Modal */}
            {showRecordModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-slate-800">Record Payment</h2>
                            <p className="text-sm text-slate-600 mt-1">
                                {selectedAssignment.player_name || selectedAssignment.team_name} - {selectedAssignment.fee_name}
                            </p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                    <input
                                        type="number"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                                        max={selectedAssignment.amount_due}
                                        step="0.01"
                                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Outstanding: ${selectedAssignment.amount_due?.toLocaleString()}
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                                <select
                                    value={paymentData.payment_method}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="cash">💵 Cash</option>
                                    <option value="check">📝 Check</option>
                                    <option value="zelle">🏦 Zelle</option>
                                    <option value="venmo">📱 Venmo</option>
                                    <option value="paypal">🌐 PayPal</option>
                                    <option value="stripe">💳 Card (Stripe)</option>
                                    <option value="other">💰 Other</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                                <input
                                    type="date"
                                    value={paymentData.payment_date}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            
                            {['zelle', 'venmo', 'paypal', 'stripe'].includes(paymentData.payment_method) && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID</label>
                                    <input
                                        type="text"
                                        value={paymentData.transaction_id}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, transaction_id: e.target.value }))}
                                        placeholder="Optional - for reference"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    />
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                <textarea
                                    value={paymentData.notes}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Optional notes..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                        </div>
                        
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => { setShowRecordModal(false); setSelectedAssignment(null); }}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRecordPayment}
                                disabled={recording || !paymentData.amount}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {recording ? 'Recording...' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentRegister;
