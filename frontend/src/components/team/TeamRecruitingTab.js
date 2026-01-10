import React, { useState, useEffect } from 'react';

/**
 * TeamRecruitingTab - Manage team invites and recruit new players
 */
const TeamRecruitingTab = ({ team, currentUser }) => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        method: 'email',
        position: '',
        message: ''
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team.id]);

    const loadInvites = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/invites`);
            if (response.ok) {
                const data = await response.json();
                setInvites(data.invites || []);
            }
        } catch (error) {
            console.error('Error loading invites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        console.log('📧 Attempting to send invite...', formData);
        
        if (!formData.name || !formData.email) {
            setMessage('❌ Please provide at least name and email');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        
        setSending(true);
        setMessage('');
        
        try {
            console.log('📧 Sending invite to:', `${backendUrl}/api/team/${team.id}/invites`);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/invites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    teamId: team.id,
                    teamName: team.name,
                    invitedBy: currentUser?.name || 'Team Admin',
                    invitedById: currentUser?.id
                })
            });
            
            console.log('📧 Response status:', response.status);
            const data = await response.json();
            console.log('📧 Response data:', data);
            
            if (response.ok) {
                setMessage(`✅ ${data.message || 'Invite sent successfully!'}`);
                setShowInviteForm(false);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    method: 'email',
                    position: '',
                    message: ''
                });
                loadInvites();
            } else {
                setMessage(`❌ ${data.detail || data.message || 'Failed to send invite'}`);
            }
        } catch (error) {
            console.error('Error sending invite:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setSending(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const handleResendInvite = async (inviteId) => {
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/invites/${inviteId}/resend`, {
                method: 'POST'
            });
            
            if (response.ok) {
                setMessage('✅ Invite resent!');
                loadInvites();
            } else {
                setMessage('❌ Failed to resend invite');
            }
        } catch (error) {
            setMessage('❌ Error resending invite');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleCancelInvite = async (inviteId) => {
        if (!window.confirm('Cancel this invite?')) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/team/${team.id}/invites/${inviteId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setMessage('✅ Invite cancelled');
                loadInvites();
            } else {
                setMessage('❌ Failed to cancel invite');
            }
        } catch (error) {
            setMessage('❌ Error cancelling invite');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'sent': return 'bg-blue-100 text-blue-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'declined': return 'bg-red-100 text-red-800';
            case 'expired': return 'bg-slate-100 text-slate-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Recruiting</h2>
                    <p className="text-sm text-slate-600">Invite new players to join your team</p>
                </div>
                <button
                    onClick={() => setShowInviteForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Send Invite
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Pending Invites */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b">
                    <h3 className="font-semibold text-slate-800">📨 Sent Invites</h3>
                </div>
                
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : invites.length > 0 ? (
                    <div className="divide-y">
                        {invites.map((invite) => (
                            <div key={invite.id} className="p-4 hover:bg-slate-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-slate-800">{invite.name}</h4>
                                        <p className="text-sm text-slate-500">{invite.email}</p>
                                        {invite.position && (
                                            <p className="text-sm text-slate-500">Position: {invite.position}</p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-1">
                                            Sent {new Date(invite.createdAt).toLocaleDateString()}
                                            {invite.sentVia && ` via ${invite.sentVia}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invite.status)}`}>
                                            {invite.status}
                                        </span>
                                        {invite.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleResendInvite(invite.id)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                                    title="Resend"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleCancelInvite(invite.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                                                    title="Cancel"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p>No invites sent yet</p>
                        <p className="text-sm mt-1">Click "Send Invite" to recruit new players</p>
                    </div>
                )}
            </div>

            {/* Invite Form Modal */}
            {showInviteForm && (
                <div 
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowInviteForm(false)}
                >
                    <div 
                        className="bg-white rounded-xl shadow-xl max-w-md w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b bg-slate-50 rounded-t-xl flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Send Team Invite</h3>
                            <button 
                                onClick={() => setShowInviteForm(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSendInvite} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Player name"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="player@email.com"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="555-123-4567"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                                <select
                                    value={formData.position}
                                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select position...</option>
                                    <option value="Attack">Attack</option>
                                    <option value="Midfield">Midfield</option>
                                    <option value="Defense">Defense</option>
                                    <option value="Goalie">Goalie</option>
                                    <option value="FOGO">FOGO</option>
                                    <option value="LSM">LSM</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Send via</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="method"
                                            value="email"
                                            checked={formData.method === 'email'}
                                            onChange={(e) => setFormData({...formData, method: e.target.value})}
                                            className="mr-2"
                                        />
                                        Email
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="method"
                                            value="sms"
                                            checked={formData.method === 'sms'}
                                            onChange={(e) => setFormData({...formData, method: e.target.value})}
                                            className="mr-2"
                                        />
                                        SMS
                                    </label>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Personal Message (optional)</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    placeholder="Add a personal note..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteForm(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {sending ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamRecruitingTab;
