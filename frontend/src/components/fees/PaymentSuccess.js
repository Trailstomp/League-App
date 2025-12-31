import React, { useState, useEffect } from 'react';

const PaymentSuccess = ({ onNavigate }) => {
    const [status, setStatus] = useState('verifying');
    const [paymentDetails, setPaymentDetails] = useState(null);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    useEffect(() => {
        const verifyPayment = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('session_id');
            const assignmentId = urlParams.get('assignment_id');
            
            if (!sessionId) {
                setStatus('error');
                return;
            }
            
            try {
                const response = await fetch(`${backendUrl}/api/payments/stripe/status/${sessionId}`);
                if (response.ok) {
                    const data = await response.json();
                    setPaymentDetails(data);
                    setStatus(data.payment_status === 'paid' ? 'success' : 'pending');
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Error verifying payment:', error);
                setStatus('error');
            }
        };
        
        verifyPayment();
    }, [backendUrl]);
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format((amount || 0) / 100); // Stripe amounts are in cents
    };
    
    return (
        <div className="max-w-lg mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                {status === 'verifying' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Verifying Payment...</h2>
                        <p className="text-slate-600">Please wait while we confirm your payment.</p>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h2>
                        <p className="text-slate-600 mb-4">Thank you for your payment.</p>
                        
                        {paymentDetails && (
                            <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
                                <div className="flex justify-between mb-2">
                                    <span className="text-slate-600">Amount Paid:</span>
                                    <span className="font-bold text-green-700">{formatCurrency(paymentDetails.amount_total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Status:</span>
                                    <span className="text-green-600 font-medium">Confirmed</span>
                                </div>
                            </div>
                        )}
                        
                        <button
                            onClick={() => onNavigate ? onNavigate('my-fees') : window.location.href = '/my-fees'}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            View My Fees
                        </button>
                    </>
                )}
                
                {status === 'pending' && (
                    <>
                        <div className="text-6xl mb-4">⏳</div>
                        <h2 className="text-xl font-bold text-amber-700 mb-2">Payment Processing</h2>
                        <p className="text-slate-600 mb-4">
                            Your payment is being processed. This may take a few moments.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                        >
                            Check Again
                        </button>
                    </>
                )}
                
                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-xl font-bold text-red-700 mb-2">Payment Error</h2>
                        <p className="text-slate-600 mb-4">
                            We could not verify your payment. Please contact support if you were charged.
                        </p>
                        <button
                            onClick={() => onNavigate ? onNavigate('my-fees') : window.location.href = '/my-fees'}
                            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                        >
                            Back to My Fees
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
