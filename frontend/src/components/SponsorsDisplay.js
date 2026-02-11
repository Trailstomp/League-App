import React, { useState, useEffect } from 'react';
import CachedImage from './CachedImage';

const SponsorsDisplay = ({ teamId = null, currentUser = null, editable = false }) => {
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSponsor, setEditingSponsor] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', message: '', imageUrl: '', websiteUrl: '',
        socials: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' }
    });
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    const isAdmin = currentUser && (
        currentUser.role === 'admin' ||
        currentUser.roles?.includes('admin') ||
        currentUser.roles?.includes('league_admin') ||
        currentUser.roles?.includes('coach')
    );
    const canEdit = editable && isAdmin;

    useEffect(() => { loadSponsors(); }, [teamId]);

    const loadSponsors = async () => {
        try {
            setLoading(true);
            const url = teamId
                ? `${backendUrl}/api/teams/${teamId}/sponsors`
                : `${backendUrl}/api/sponsors`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setSponsors(data.sponsors || []);
            }
        } catch (e) {
            console.error('Error loading sponsors:', e);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ name: '', message: '', imageUrl: '', websiteUrl: '', socials: { facebook: '', instagram: '', twitter: '', linkedin: '' } });
        setEditingSponsor(null);
        setShowForm(false);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            const payload = { ...form, scope: teamId ? 'team' : 'league', teamId: teamId || undefined };
            const url = editingSponsor
                ? `${backendUrl}/api/sponsors/${editingSponsor.id}`
                : `${backendUrl}/api/sponsors`;
            const method = editingSponsor ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) {
                loadSponsors();
                resetForm();
            }
        } catch (e) {
            console.error('Error saving sponsor:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this sponsor?')) return;
        try {
            await fetch(`${backendUrl}/api/sponsors/${id}`, { method: 'DELETE' });
            loadSponsors();
        } catch (e) {
            console.error('Error deleting sponsor:', e);
        }
    };

    const handleEdit = (sponsor) => {
        setForm({
            name: sponsor.name || '',
            message: sponsor.message || '',
            imageUrl: sponsor.imageUrl || '',
            websiteUrl: sponsor.websiteUrl || '',
            socials: sponsor.socials || { facebook: '', instagram: '', twitter: '', linkedin: '' }
        });
        setEditingSponsor(sponsor);
        setShowForm(true);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setForm(f => ({ ...f, imageUrl: reader.result }));
        reader.readAsDataURL(file);
    };

    const socialIcons = {
        facebook: { label: 'Facebook', color: '#1877f2' },
        instagram: { label: 'Instagram', color: '#e4405f' },
        twitter: { label: 'X/Twitter', color: '#1da1f2' },
        linkedin: { label: 'LinkedIn', color: '#0077b5' }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div data-testid="sponsors-display">
            {/* Header with Add button */}
            {canEdit && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        data-testid="add-sponsor-btn"
                    >
                        + Add Sponsor
                    </button>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && canEdit && (
                <div className="bg-white rounded-xl border shadow-sm p-5 mb-6" data-testid="sponsor-form">
                    <h3 className="text-lg font-semibold mb-4">{editingSponsor ? 'Edit' : 'Add'} Sponsor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                            <input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                placeholder="Sponsor name"
                                data-testid="sponsor-name-input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                            <input
                                value={form.websiteUrl}
                                onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                placeholder="https://..."
                                data-testid="sponsor-website-input"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Message / Description</label>
                            <textarea
                                value={form.message}
                                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                rows={3}
                                placeholder="A thank you message or description of this sponsor..."
                                data-testid="sponsor-message-input"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Logo / Image</label>
                            <div className="flex items-center gap-3">
                                {form.imageUrl && (
                                    <img src={form.imageUrl} alt="Preview" className="h-16 w-16 object-contain rounded border" />
                                )}
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Social Links</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(socialIcons).map(([key, { label }]) => (
                                    <input
                                        key={key}
                                        value={form.socials[key] || ''}
                                        onChange={e => setForm(f => ({ ...f, socials: { ...f.socials, [key]: e.target.value } }))}
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                        placeholder={`${label} URL`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving || !form.name.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                            data-testid="save-sponsor-btn"
                        >
                            {saving ? 'Saving...' : (editingSponsor ? 'Update' : 'Add Sponsor')}
                        </button>
                        <button onClick={resetForm} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Sponsors Grid */}
            {sponsors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sponsors.map(sponsor => (
                        <div key={sponsor.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow" data-testid={`sponsor-card-${sponsor.id}`}>
                            {sponsor.imageUrl && (
                                <div className="h-32 bg-slate-50 flex items-center justify-center p-4">
                                    <CachedImage src={sponsor.imageUrl} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
                                </div>
                            )}
                            <div className="p-4">
                                <h4 className="font-semibold text-slate-800 text-base">{sponsor.name}</h4>
                                {sponsor.message && (
                                    <p className="text-sm text-slate-600 mt-1 line-clamp-3">{sponsor.message}</p>
                                )}

                                {/* Links */}
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {sponsor.websiteUrl && (
                                        <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            Website
                                        </a>
                                    )}
                                    {Object.entries(sponsor.socials || {}).filter(([, v]) => v).map(([key, url]) => (
                                        <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium hover:opacity-80"
                                            style={{ backgroundColor: socialIcons[key]?.color + '15', color: socialIcons[key]?.color }}>
                                            {socialIcons[key]?.label || key}
                                        </a>
                                    ))}
                                </div>

                                {/* Admin controls */}
                                {canEdit && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t">
                                        <button onClick={() => handleEdit(sponsor)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                        <button onClick={() => handleDelete(sponsor.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Remove</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-slate-500">
                    <div className="text-3xl mb-2">🤝</div>
                    <p className="font-medium">No sponsors yet</p>
                    {canEdit && <p className="text-sm mt-1">Click "Add Sponsor" to feature your friends and sponsors here</p>}
                </div>
            )}
        </div>
    );
};

export default SponsorsDisplay;
