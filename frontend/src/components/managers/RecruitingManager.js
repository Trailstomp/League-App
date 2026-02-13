import React, { useState, useEffect } from 'react';
import { Check, X, Mail, Phone, MapPin, Users, Calendar, Eye, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

/**
 * RecruitingManager - Admin component to review/approve/reject
 * team registrations, player applications, and volunteer signups
 */
const RecruitingManager = ({ currentUser, teams = [] }) => {
    const [activeSubTab, setActiveSubTab] = useState('teams'); // 'teams', 'players', 'volunteers', 'invite'
    const [registrations, setRegistrations] = useState([]);
    const [applications, setApplications] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending');
    
    // Invite form state
    const [inviteForm, setInviteForm] = useState({
        name: '', email: '', phone: '', role: 'player', teamId: '', position: '', message: ''
    });
    const [sendingInvite, setSendingInvite] = useState(false);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Load all data on mount
    useEffect(() => {
        loadAllData();
    }, []);
    
    const loadAllData = async () => {
        setLoading(true);
        try {
            const [regsRes, appsRes, volsRes] = await Promise.all([
                fetch(`${backendUrl}/api/join-us/registrations`),
                fetch(`${backendUrl}/api/join-us/applications`),
                fetch(`${backendUrl}/api/join-us/volunteers`)
            ]);
            
            if (regsRes.ok) {
                const data = await regsRes.json();
                setRegistrations(data.registrations || []);
            }
            if (appsRes.ok) {
                const data = await appsRes.json();
                setApplications(data.applications || []);
            }
            if (volsRes.ok) {
                const data = await volsRes.json();
                setVolunteers(data.volunteers || []);
            }
        } catch (e) {
            console.error('Error loading recruiting data:', e);
        } finally {
            setLoading(false);
        }
    };
    
    const [successMsg, setSuccessMsg] = useState('');
    
    const updateStatus = async (type, id, newStatus) => {
        setActionLoading(id);
        setSuccessMsg('');
        try {
            const endpoint = type === 'registration' 
                ? `/api/join-us/registrations/${id}`
                : type === 'application'
                ? `/api/join-us/applications/${id}`
                : `/api/join-us/volunteers/${id}`;
            
            const res = await fetch(`${backendUrl}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (res.ok) {
                const result = await res.json();
                // Update local state
                if (type === 'registration') {
                    setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
                    if (newStatus === 'approved' && result.created_team_id) {
                        setSuccessMsg(`Team created and added to the league! The primary contact has been set up as team coach.`);
                    }
                } else if (type === 'application') {
                    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
                    if (newStatus === 'approved' && result.added_to_team) {
                        setSuccessMsg(`Player has been added to the team roster!`);
                    }
                } else {
                    setVolunteers(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v));
                }
                
                if (newStatus === 'rejected') {
                    setSuccessMsg(`Request has been declined.`);
                }
                
                setTimeout(() => setSuccessMsg(''), 5000);
            }
        } catch (e) {
            console.error('Error updating status:', e);
        } finally {
            setActionLoading(null);
        }
    };
    
    const handleSendInvite = async (e) => {
        e.preventDefault();
        if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
            setSuccessMsg(''); 
            return;
        }
        
        setSendingInvite(true);
        try {
            // If a team is selected, send as a team invite
            if (inviteForm.teamId) {
                const res = await fetch(`${backendUrl}/api/team/${inviteForm.teamId}/invites`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: inviteForm.name.trim(),
                        email: inviteForm.email.trim(),
                        phone: inviteForm.phone.trim(),
                        position: inviteForm.role === 'coach' ? 'Coach' : inviteForm.position,
                        method: 'email',
                        message: inviteForm.message,
                        teamId: inviteForm.teamId,
                        teamName: teams.find(t => t.id === inviteForm.teamId)?.name || '',
                        invitedBy: currentUser?.name || 'League Admin',
                        invitedById: currentUser?.id,
                        role: inviteForm.role
                    })
                });
                
                if (res.ok) {
                    const teamName = teams.find(t => t.id === inviteForm.teamId)?.name || 'team';
                    setSuccessMsg(`Invite sent to ${inviteForm.name} for ${teamName} as ${inviteForm.role}!`);
                    setInviteForm({ name: '', email: '', phone: '', role: 'player', teamId: '', position: '', message: '' });
                } else {
                    const err = await res.json();
                    setSuccessMsg(err.detail || 'Failed to send invite');
                }
            } else {
                // General league invite via email compose
                const res = await fetch(`${backendUrl}/api/email/compose`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to_emails: [inviteForm.email.trim()],
                        subject: `You're Invited to Join the League!`,
                        body: `Hi ${inviteForm.name},\n\n${inviteForm.message || `We'd love to have you join our league as a ${inviteForm.role}!`}\n\nVisit our website to sign up and learn more.\n\nBest regards,\n${currentUser?.name || 'League Admin'}`,
                        sender_name: currentUser?.name || 'League Admin'
                    })
                });
                
                if (res.ok) {
                    setSuccessMsg(`Recruitment email sent to ${inviteForm.name}!`);
                    setInviteForm({ name: '', email: '', phone: '', role: 'player', teamId: '', position: '', message: '' });
                } else {
                    const err = await res.json();
                    setSuccessMsg(err.detail || 'Failed to send email');
                }
            }
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (e) {
            console.error('Error sending invite:', e);
            setSuccessMsg('Error sending invite');
        } finally {
            setSendingInvite(false);
        }
    };
    
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            contacted: 'bg-blue-100 text-blue-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };
    
    // Count stats
    const stats = {
        teams: {
            pending: registrations.filter(r => r.status === 'pending').length,
            total: registrations.length
        },
        players: {
            pending: applications.filter(a => a.status === 'pending').length,
            total: applications.length
        },
        volunteers: {
            pending: volunteers.filter(v => v.status === 'pending').length,
            total: volunteers.length
        }
    };
    
    const filteredData = () => {
        let data = activeSubTab === 'teams' ? registrations 
            : activeSubTab === 'players' ? applications 
            : volunteers;
        
        if (statusFilter !== 'all') {
            data = data.filter(item => item.status === statusFilter);
        }
        
        return data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6" data-testid="recruiting-manager">
            {/* Success Message */}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2" data-testid="recruiting-success-msg">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-medium">{successMsg}</span>
                </div>
            )}
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div 
                    onClick={() => setActiveSubTab('teams')}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                        activeSubTab === 'teams' ? 'bg-green-100 border-2 border-green-500' : 'bg-white border border-slate-200 hover:border-green-300'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">🏆</div>
                        <div>
                            <div className="text-sm text-slate-600">Team Registrations</div>
                            <div className="text-xl font-bold">
                                {stats.teams.pending > 0 && (
                                    <span className="text-yellow-600">{stats.teams.pending} pending</span>
                                )}
                                {stats.teams.pending === 0 && (
                                    <span className="text-slate-700">{stats.teams.total} total</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div 
                    onClick={() => setActiveSubTab('players')}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                        activeSubTab === 'players' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white border border-slate-200 hover:border-blue-300'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">🏃</div>
                        <div>
                            <div className="text-sm text-slate-600">Player Applications</div>
                            <div className="text-xl font-bold">
                                {stats.players.pending > 0 && (
                                    <span className="text-yellow-600">{stats.players.pending} pending</span>
                                )}
                                {stats.players.pending === 0 && (
                                    <span className="text-slate-700">{stats.players.total} total</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div 
                    onClick={() => setActiveSubTab('volunteers')}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                        activeSubTab === 'volunteers' ? 'bg-amber-100 border-2 border-amber-500' : 'bg-white border border-slate-200 hover:border-amber-300'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">🙋</div>
                        <div>
                            <div className="text-sm text-slate-600">Volunteer Signups</div>
                            <div className="text-xl font-bold">
                                {stats.volunteers.pending > 0 && (
                                    <span className="text-yellow-600">{stats.volunteers.pending} pending</span>
                                )}
                                {stats.volunteers.pending === 0 && (
                                    <span className="text-slate-700">{stats.volunteers.total} total</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Filter */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                    {activeSubTab === 'teams' && '🏆 Team Registrations'}
                    {activeSubTab === 'players' && '🏃 Player Applications'}
                    {activeSubTab === 'volunteers' && '🙋 Volunteer Signups'}
                </h2>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                    <option value="pending">Pending Only</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="all">All Statuses</option>
                </select>
            </div>
            
            {/* List */}
            <div className="space-y-3">
                {filteredData().length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl">
                        <div className="text-4xl mb-3">📭</div>
                        <p className="text-slate-600">No {statusFilter === 'all' ? '' : statusFilter} {activeSubTab} found</p>
                    </div>
                ) : (
                    filteredData().map(item => (
                        <div 
                            key={item.id} 
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                        >
                            {/* Header Row */}
                            <div 
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon/Logo */}
                                    {activeSubTab === 'teams' && item.logo_url ? (
                                        <img src={item.logo_url} alt="" className="w-12 h-12 object-contain bg-slate-100 rounded-lg" />
                                    ) : (
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                                            activeSubTab === 'teams' ? 'bg-green-100' :
                                            activeSubTab === 'players' ? 'bg-blue-100' : 'bg-amber-100'
                                        }`}>
                                            {activeSubTab === 'teams' ? '🏆' : activeSubTab === 'players' ? '🏃' : '🙋'}
                                        </div>
                                    )}
                                    
                                    {/* Name & Info */}
                                    <div>
                                        <div className="font-semibold text-slate-800">
                                            {activeSubTab === 'teams' ? item.team_name : item.name}
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-2">
                                            {activeSubTab === 'teams' && (
                                                <>
                                                    <span>{item.primary_contact_name}</span>
                                                    <span>•</span>
                                                    <span>{item.lacrosse_type?.toUpperCase()}</span>
                                                </>
                                            )}
                                            {activeSubTab === 'players' && (
                                                <>
                                                    <span>→ {item.team_name}</span>
                                                    {item.position && <span>• {item.position}</span>}
                                                </>
                                            )}
                                            {activeSubTab === 'volunteers' && (
                                                <span>{item.interests?.map(i => i.replace('_', ' ')).join(', ') || 'Various interests'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(item.status)}
                                    <div className="text-xs text-slate-400">
                                        {formatDate(item.created_at)}
                                    </div>
                                    {expandedId === item.id ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                            </div>
                            
                            {/* Expanded Details */}
                            {expandedId === item.id && (
                                <div className="border-t border-slate-200 p-4 bg-slate-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {/* Contact Info */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-slate-700">Contact Information</h4>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                                <a href={`mailto:${activeSubTab === 'teams' ? item.primary_contact_email : item.email}`} className="text-blue-600 hover:underline">
                                                    {activeSubTab === 'teams' ? item.primary_contact_email : item.email}
                                                </a>
                                            </div>
                                            {(activeSubTab === 'teams' ? item.primary_contact_phone : item.phone) && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                    <a href={`tel:${activeSubTab === 'teams' ? item.primary_contact_phone : item.phone}`} className="text-blue-600 hover:underline">
                                                        {activeSubTab === 'teams' ? item.primary_contact_phone : item.phone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Additional Details */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-slate-700">Details</h4>
                                            
                                            {activeSubTab === 'teams' && (
                                                <>
                                                    {item.preferred_division && (
                                                        <div className="text-sm"><span className="text-slate-500">Division:</span> {item.preferred_division}</div>
                                                    )}
                                                    {item.home_field_location && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <MapPin className="w-4 h-4 text-slate-400" />
                                                            {item.home_field_location}
                                                        </div>
                                                    )}
                                                    {item.estimated_roster_size && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Users className="w-4 h-4 text-slate-400" />
                                                            ~{item.estimated_roster_size} players
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            
                                            {activeSubTab === 'players' && (
                                                <>
                                                    {item.experience_level && (
                                                        <div className="text-sm"><span className="text-slate-500">Experience:</span> {item.experience_level}</div>
                                                    )}
                                                    {item.age && (
                                                        <div className="text-sm"><span className="text-slate-500">Age:</span> {item.age}</div>
                                                    )}
                                                    {item.previous_teams && (
                                                        <div className="text-sm"><span className="text-slate-500">Previous Teams:</span> {item.previous_teams}</div>
                                                    )}
                                                </>
                                            )}
                                            
                                            {activeSubTab === 'volunteers' && (
                                                <>
                                                    {item.availability && (
                                                        <div className="text-sm"><span className="text-slate-500">Availability:</span> {item.availability}</div>
                                                    )}
                                                    {item.experience && (
                                                        <div className="text-sm"><span className="text-slate-500">Experience:</span> {item.experience}</div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Comments */}
                                    {item.comments && (
                                        <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
                                            <h4 className="text-sm font-medium text-slate-700 mb-1">Comments</h4>
                                            <p className="text-sm text-slate-600 italic">"{item.comments}"</p>
                                        </div>
                                    )}
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                                        {item.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(
                                                        activeSubTab === 'teams' ? 'registration' : 
                                                        activeSubTab === 'players' ? 'application' : 'volunteer',
                                                        item.id, 
                                                        'approved'
                                                    )}
                                                    disabled={actionLoading === item.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                    data-testid={`approve-${item.id}`}
                                                >
                                                    {actionLoading === item.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(
                                                        activeSubTab === 'teams' ? 'registration' : 
                                                        activeSubTab === 'players' ? 'application' : 'volunteer',
                                                        item.id, 
                                                        'rejected'
                                                    )}
                                                    disabled={actionLoading === item.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                    data-testid={`reject-${item.id}`}
                                                >
                                                    <X className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        
                                        {item.status !== 'pending' && (
                                            <button
                                                onClick={() => updateStatus(
                                                    activeSubTab === 'teams' ? 'registration' : 
                                                    activeSubTab === 'players' ? 'application' : 'volunteer',
                                                    item.id, 
                                                    'pending'
                                                )}
                                                disabled={actionLoading === item.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                            >
                                                Reset to Pending
                                            </button>
                                        )}
                                        
                                        <a 
                                            href={`mailto:${activeSubTab === 'teams' ? item.primary_contact_email : item.email}`}
                                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Contact
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecruitingManager;
