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
        setForm({ name: '', message: '', imageUrl: '', websiteUrl: '', socials: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' } });
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
            socials: sponsor.socials || { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' }
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
        facebook: { label: 'Facebook', color: '#1877f2', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
        instagram: { label: 'Instagram', color: '#e4405f', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
        twitter: { label: 'X', color: '#000000', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
        linkedin: { label: 'LinkedIn', color: '#0077b5', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
        youtube: { label: 'YouTube', color: '#ff0000', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> }
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {sponsors.map(sponsor => (
                        <div key={sponsor.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow" data-testid={`sponsor-card-${sponsor.id}`}>
                            {/* Large Logo */}
                            {sponsor.imageUrl && (
                                <div className="aspect-square bg-slate-50 flex items-center justify-center p-3">
                                    <CachedImage src={sponsor.imageUrl} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
                                </div>
                            )}
                            <div className="p-3">
                                <h4 className="font-semibold text-slate-800 text-sm truncate">{sponsor.name}</h4>
                                {sponsor.message && (
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{sponsor.message}</p>
                                )}

                                {/* Icon links row */}
                                <div className="flex items-center gap-1.5 mt-2">
                                    {sponsor.websiteUrl && (
                                        <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer"
                                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                                            title="Website">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
                                        </a>
                                    )}
                                    {Object.entries(sponsor.socials || {}).filter(([, v]) => v).map(([key, url]) => (
                                        <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                                            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                                            style={{ color: socialIcons[key]?.color }}
                                            title={socialIcons[key]?.label || key}>
                                            {socialIcons[key]?.icon || <span className="text-xs">{key}</span>}
                                        </a>
                                    ))}
                                </div>

                                {/* Admin controls */}
                                {canEdit && (
                                    <div className="flex gap-2 mt-2 pt-2 border-t">
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
