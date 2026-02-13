import React, { useState, useEffect, useRef } from 'react';
import { User, Camera, Mail, Phone, Bell, Shield, Save, Loader2, CheckCircle, Eye, EyeOff, Palette } from 'lucide-react';

const AccountSettings = ({ currentUser, onUserUpdate }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // Theme preference state
    const [availableTemplates, setAvailableTemplates] = useState([]);
    const [pinnedTemplateId, setPinnedTemplateId] = useState(null);
    
    // Profile form
    const [profile, setProfile] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        position: currentUser?.position || '',
        jerseyNumber: currentUser?.playerNumber || currentUser?.jerseyNumber || '',
        emergencyContact: currentUser?.emergencyContact || { name: '', phone: '', relationship: '' },
        funFacts: currentUser?.funFacts || { bio: '', favoritePlayer: '', yearsPlaying: '' }
    });
    
    // Communication preferences
    const [commPrefs, setCommPrefs] = useState({
        emailNotifications: true,
        smsNotifications: false,
        eventReminders: true,
        scoreUpdates: true,
        teamAnnouncements: true,
        leagueNews: true,
        recruitingUpdates: false
    });
    
    // Password change
    const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
    const [showPasswords, setShowPasswords] = useState(false);
    
    const photoInputRef = useRef(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    useEffect(() => {
        if (currentUser) {
            setProfile({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                position: currentUser.position || '',
                jerseyNumber: currentUser.playerNumber || currentUser.jerseyNumber || '',
                emergencyContact: currentUser.emergencyContact || { name: '', phone: '', relationship: '' },
                funFacts: currentUser.funFacts || { bio: '', favoritePlayer: '', yearsPlaying: '' }
            });
            
            const prefs = currentUser.notificationPreferences || {};
            setCommPrefs(prev => ({ ...prev, ...prefs }));
        }
    }, [currentUser]);
    
    const loadCommPrefs = async () => {
        try {
            const res = await fetch(`${backendUrl}/api/users/${currentUser.id}/communication-preferences`);
            if (res.ok) {
                const data = await res.json();
                if (data.preferences) setCommPrefs(prev => ({ ...prev, ...data.preferences }));
            }
        } catch (e) { console.error(e); }
    };
    
    useEffect(() => { if (currentUser?.id) loadCommPrefs(); }, [currentUser?.id]);
    
    useEffect(() => {
        if (currentUser?.id) {
            // Load visible templates
            fetch(`${backendUrl}/api/design-templates`).then(r => r.json()).then(d => {
                setAvailableTemplates((d.templates || []).filter(t => t.visibleToUsers !== false));
            }).catch(() => {});
            // Load user's pinned preference
            fetch(`${backendUrl}/api/users/${currentUser.id}/template-preference`).then(r => r.json()).then(d => {
                setPinnedTemplateId(d.pinnedTemplateId || null);
            }).catch(() => {});
        }
    }, [currentUser?.id]);
    
    const handleSaveThemePref = async (templateId) => {
        setPinnedTemplateId(templateId);
        try {
            await fetch(`${backendUrl}/api/users/${currentUser.id}/template-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pinnedTemplateId: templateId })
            });
            setResult({ type: 'success', message: templateId ? 'Theme pinned!' : 'Using rotation mode' });
            setTimeout(() => setResult(null), 3000);
        } catch (e) { console.error(e); }
    };
    
    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${backendUrl}/api/users/${currentUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: profile.name,
                    phone: profile.phone,
                    position: profile.position,
                    playerNumber: profile.jerseyNumber,
                    emergencyContact: profile.emergencyContact,
                    funFacts: profile.funFacts
                })
            });
            if (res.ok) {
                setResult({ type: 'success', message: 'Profile updated!' });
                if (onUserUpdate) {
                    onUserUpdate({ ...currentUser, ...profile, playerNumber: profile.jerseyNumber });
                }
            } else {
                setResult({ type: 'error', message: 'Failed to save profile' });
            }
        } catch (e) {
            setResult({ type: 'error', message: e.message });
        } finally {
            setSaving(false);
            setTimeout(() => setResult(null), 4000);
        }
    };
    
    const handleSaveCommPrefs = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${backendUrl}/api/users/${currentUser.id}/communication-preferences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commPrefs)
            });
            if (res.ok) {
                setResult({ type: 'success', message: 'Communication preferences saved!' });
            }
        } catch (e) {
            setResult({ type: 'error', message: e.message });
        } finally {
            setSaving(false);
            setTimeout(() => setResult(null), 4000);
        }
    };
    
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'player_photo');
            
            const uploadRes = await fetch(`${backendUrl}/api/upload/image`, { method: 'POST', body: formData });
            if (uploadRes.ok) {
                const data = await uploadRes.json();
                // Update user photo
                await fetch(`${backendUrl}/api/users/${currentUser.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ photoUrl: data.url })
                });
                setResult({ type: 'success', message: 'Photo updated!' });
                if (onUserUpdate) onUserUpdate({ ...currentUser, photoUrl: data.url });
            }
        } catch (e) {
            setResult({ type: 'error', message: 'Failed to upload photo' });
        } finally {
            setUploading(false);
            setTimeout(() => setResult(null), 4000);
        }
    };
    
    const handleChangePassword = async () => {
        if (passwordForm.newPass.length < 6) {
            setResult({ type: 'error', message: 'Password must be at least 6 characters' }); return;
        }
        if (passwordForm.newPass !== passwordForm.confirm) {
            setResult({ type: 'error', message: 'Passwords do not match' }); return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${backendUrl}/api/users/${currentUser.id}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_password: passwordForm.newPass })
            });
            if (res.ok) {
                setResult({ type: 'success', message: 'Password changed!' });
                setPasswordForm({ current: '', newPass: '', confirm: '' });
            } else {
                const err = await res.json();
                setResult({ type: 'error', message: err.detail || 'Failed to change password' });
            }
        } catch (e) {
            setResult({ type: 'error', message: e.message });
        } finally {
            setSaving(false);
            setTimeout(() => setResult(null), 4000);
        }
    };
    
    if (!currentUser) {
        return <div className="text-center py-12 text-slate-500">Please log in to view account settings.</div>;
    }
    
    const photoUrl = currentUser.photoUrl ? 
        (currentUser.photoUrl.startsWith('http') ? currentUser.photoUrl : `${backendUrl}${currentUser.photoUrl}`) 
        : null;
    
    return (
        <div className="max-w-3xl mx-auto space-y-6" data-testid="account-settings">
            {/* Header with Photo */}
            <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        {photoUrl ? (
                            <img src={photoUrl} alt={currentUser.name} className="w-20 h-20 rounded-full object-cover border-4 border-slate-200" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 border-4 border-slate-200">
                                {currentUser.name?.charAt(0) || '?'}
                            </div>
                        )}
                        <button
                            onClick={() => photoInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 shadow-lg"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        </button>
                        <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{currentUser.name}</h2>
                        <p className="text-sm text-slate-500">{currentUser.email}</p>
                        <div className="flex gap-2 mt-1">
                            {(currentUser.roles || [currentUser.role]).map(r => (
                                <span key={r} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{r}</span>
                            ))}
                            {currentUser.teamName && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{currentUser.teamName}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Result Banner */}
            {result && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {result.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    <span className="font-medium">{result.message}</span>
                </div>
            )}
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                {[
                    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
                    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
                    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
                    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
                <div className="bg-white rounded-xl border p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input type="text" value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" value={profile.email} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))} placeholder="555-123-4567" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                            <select value={profile.position} onChange={e => setProfile(p => ({...p, position: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                <option value="">Select...</option>
                                <option value="Attack">Attack</option>
                                <option value="Midfield">Midfield</option>
                                <option value="Defense">Defense</option>
                                <option value="Goalie">Goalie</option>
                                <option value="FOGO">FOGO</option>
                                <option value="LSM">LSM</option>
                                <option value="Coach">Coach</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Jersey Number</label>
                            <input type="text" value={profile.jerseyNumber} onChange={e => setProfile(p => ({...p, jerseyNumber: e.target.value}))} placeholder="#" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                    </div>
                    
                    {/* Emergency Contact */}
                    <div className="border-t pt-5">
                        <h4 className="font-medium text-slate-800 mb-3">Emergency Contact</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" value={profile.emergencyContact?.name || ''} onChange={e => setProfile(p => ({...p, emergencyContact: {...p.emergencyContact, name: e.target.value}}))} placeholder="Contact name" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            <input type="tel" value={profile.emergencyContact?.phone || ''} onChange={e => setProfile(p => ({...p, emergencyContact: {...p.emergencyContact, phone: e.target.value}}))} placeholder="Phone number" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            <input type="text" value={profile.emergencyContact?.relationship || ''} onChange={e => setProfile(p => ({...p, emergencyContact: {...p.emergencyContact, relationship: e.target.value}}))} placeholder="Relationship" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                    </div>
                    
                    {/* Bio */}
                    <div className="border-t pt-5">
                        <h4 className="font-medium text-slate-800 mb-3">About Me</h4>
                        <textarea value={profile.funFacts?.bio || ''} onChange={e => setProfile(p => ({...p, funFacts: {...p.funFacts, bio: e.target.value}}))} placeholder="Tell us about yourself..." rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                    </div>
                    
                    <div className="flex justify-end">
                        <button onClick={handleSaveProfile} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Profile
                        </button>
                    </div>
                </div>
            )}
            
            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
                <div className="bg-white rounded-xl border p-6 space-y-4">
                    <h4 className="font-medium text-slate-800">Communication Preferences</h4>
                    <p className="text-sm text-slate-500">Choose how you want to receive updates</p>
                    
                    <div className="space-y-3">
                        {[
                            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                            { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive text message alerts' },
                            { key: 'eventReminders', label: 'Event Reminders', desc: 'Get reminders before games and practices' },
                            { key: 'scoreUpdates', label: 'Score Updates', desc: 'Live score notifications during games' },
                            { key: 'teamAnnouncements', label: 'Team Announcements', desc: 'News and updates from your team' },
                            { key: 'leagueNews', label: 'League News', desc: 'General league announcements' },
                            { key: 'recruitingUpdates', label: 'Recruiting Updates', desc: 'New player/team application alerts' }
                        ].map(pref => (
                            <label key={pref.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
                                <div>
                                    <div className="font-medium text-sm text-slate-800">{pref.label}</div>
                                    <div className="text-xs text-slate-500">{pref.desc}</div>
                                </div>
                                <div className={`relative w-11 h-6 rounded-full transition-colors ${commPrefs[pref.key] ? 'bg-blue-600' : 'bg-slate-300'}`} onClick={() => setCommPrefs(prev => ({...prev, [pref.key]: !prev[pref.key]}))}>
                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${commPrefs[pref.key] ? 'translate-x-5.5 left-[22px]' : 'left-0.5'}`} />
                                </div>
                            </label>
                        ))}
                    </div>
                    
                    <div className="flex justify-end pt-3">
                        <button onClick={handleSaveCommPrefs} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Preferences
                        </button>
                    </div>
                </div>
            )}
            
            {/* SECURITY TAB */}
            {activeTab === 'security' && (
                <div className="bg-white rounded-xl border p-6 space-y-5">
                    <div>
                        <h4 className="font-medium text-slate-800 mb-1">Change Password</h4>
                        <p className="text-sm text-slate-500">Update your account password</p>
                    </div>
                    
                    <div className="space-y-3 max-w-sm">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                            <div className="relative">
                                <input type={showPasswords ? 'text' : 'password'} value={passwordForm.newPass} onChange={e => setPasswordForm(p => ({...p, newPass: e.target.value}))} placeholder="Min 6 characters" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm pr-10" />
                                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                            <input type={showPasswords ? 'text' : 'password'} value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({...p, confirm: e.target.value}))} placeholder="Confirm new password" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                    </div>
                    
                    <button onClick={handleChangePassword} disabled={saving || !passwordForm.newPass} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        Change Password
                    </button>
                    
                    <div className="border-t pt-5">
                        <h4 className="font-medium text-slate-800 mb-2">Account Info</h4>
                        <div className="text-sm text-slate-600 space-y-1">
                            <p>Account ID: <span className="font-mono text-xs text-slate-400">{currentUser.id}</span></p>
                            <p>Created: {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}</p>
                            <p>Role: {(currentUser.roles || [currentUser.role]).join(', ')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountSettings;
