import React, { useState, useEffect } from 'react';

const TeamLocationsManager = ({ team }) => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [form, setForm] = useState({
        name: '', address: '', types: [], indoor: false, surface: 'grass', notes: ''
    });
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    const locationTypes = [
        { id: 'home_field', label: 'Home Field' },
        { id: 'practice_field', label: 'Practice Field' },
        { id: 'game_field', label: 'Game Field' },
        { id: 'meeting_point', label: 'Meeting Point' },
        { id: 'indoor_facility', label: 'Indoor Facility' },
        { id: 'gym', label: 'Gym / Training' },
        { id: 'other', label: 'Other' }
    ];

    const surfaceTypes = ['grass', 'turf', 'artificial_turf', 'indoor', 'dirt', 'court', 'other'];

    useEffect(() => { loadLocations(); }, [team?.id]);

    const loadLocations = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${backendUrl}/api/locations?team_id=${team.id}`);
            if (res.ok) {
                const data = await res.json();
                setLocations(data || []);
            }
        } catch (e) {
            console.error('Error loading locations:', e);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ name: '', address: '', types: [], indoor: false, surface: 'grass', notes: '' });
        setEditingLocation(null);
        setShowForm(false);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.address.trim()) return;
        setSaving(true);
        try {
            const payload = { ...form, teamId: team.id, team_id: team.id };
            const url = editingLocation
                ? `${backendUrl}/api/locations/${editingLocation.id}`
                : `${backendUrl}/api/locations`;
            const method = editingLocation ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                loadLocations();
                resetForm();
            }
        } catch (e) {
            console.error('Error saving location:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this location?')) return;
        try {
            await fetch(`${backendUrl}/api/locations/${id}`, { method: 'DELETE' });
            loadLocations();
        } catch (e) {
            console.error('Error deleting location:', e);
        }
    };

    const handleEdit = (loc) => {
        setForm({
            name: loc.name || '',
            address: loc.address || '',
            types: loc.types || [],
            indoor: loc.indoor || false,
            surface: loc.surface || 'grass',
            notes: loc.notes || ''
        });
        setEditingLocation(loc);
        setShowForm(true);
    };

    const toggleType = (typeId) => {
        setForm(f => ({
            ...f,
            types: f.types.includes(typeId) ? f.types.filter(t => t !== typeId) : [...f.types, typeId]
        }));
    };

    const getMapsUrl = (address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    const getEmbedUrl = (address) => `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

    if (loading) {
        return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div data-testid="team-locations-manager">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Team Locations</h3>
                    <p className="text-sm text-slate-500">Manage fields, venues, and meeting points for {team.name}</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    data-testid="add-location-btn"
                >
                    + Add Location
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-xl border shadow-sm p-5 mb-6" data-testid="location-form">
                    <h4 className="font-semibold text-slate-800 mb-4">{editingLocation ? 'Edit' : 'Add'} Location</h4>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                    placeholder="e.g. Main Field, Johnson Park"
                                    data-testid="location-name-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                                <input
                                    value={form.address}
                                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                    placeholder="Full street address"
                                    data-testid="location-address-input"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Location Type</label>
                            <div className="flex flex-wrap gap-2">
                                {locationTypes.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => toggleType(type.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                            form.types.includes(type.id)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-slate-700">Indoor/Outdoor</label>
                                <button
                                    onClick={() => setForm(f => ({ ...f, indoor: !f.indoor }))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                        form.indoor ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                    }`}
                                >
                                    {form.indoor ? '🏢 Indoor' : '🌤️ Outdoor'}
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Surface</label>
                                <select
                                    value={form.surface}
                                    onChange={e => setForm(f => ({ ...f, surface: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                >
                                    {surfaceTypes.map(s => (
                                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                rows={2}
                                placeholder="Parking info, field number, etc."
                            />
                        </div>

                        {/* Map Preview */}
                        {form.address && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Map Preview</label>
                                <iframe
                                    title="Map preview"
                                    src={getEmbedUrl(form.address)}
                                    className="w-full h-48 rounded-lg border"
                                    allowFullScreen
                                    loading="lazy"
                                />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name.trim() || !form.address.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                                data-testid="save-location-btn"
                            >
                                {saving ? 'Saving...' : (editingLocation ? 'Update Location' : 'Add Location')}
                            </button>
                            <button onClick={resetForm} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Locations List */}
            {locations.length > 0 ? (
                <div className="space-y-4">
                    {locations.map(loc => (
                        <div key={loc.id} className="bg-white rounded-xl border shadow-sm overflow-hidden" data-testid={`location-card-${loc.id}`}>
                            <div className="flex flex-col lg:flex-row">
                                {/* Map embed */}
                                <div className="lg:w-72 h-48 lg:h-auto flex-shrink-0">
                                    <iframe
                                        title={loc.name}
                                        src={getEmbedUrl(loc.address)}
                                        className="w-full h-full border-0"
                                        allowFullScreen
                                        loading="lazy"
                                    />
                                </div>
                                {/* Details */}
                                <div className="flex-1 p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold text-slate-800 text-base">{loc.name}</h4>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(loc.types || []).map((type, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {type.replace(/_/g, ' ')}
                                                    </span>
                                                ))}
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    loc.indoor ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {loc.indoor ? 'Indoor' : 'Outdoor'}
                                                </span>
                                                {loc.surface && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                        {loc.surface.replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {loc.address && (
                                        <p className="text-sm text-slate-600 mt-2">{loc.address}</p>
                                    )}
                                    {loc.notes && (
                                        <p className="text-sm text-slate-500 mt-1 italic">{loc.notes}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-3">
                                        <a
                                            href={getMapsUrl(loc.address)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                                            data-testid={`directions-btn-${loc.id}`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            Get Directions
                                        </a>
                                        <button onClick={() => handleEdit(loc)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                        <button onClick={() => handleDelete(loc.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Remove</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl">
                    <div className="text-3xl mb-2">📍</div>
                    <p className="font-medium text-slate-600">No locations added yet</p>
                    <p className="text-sm text-slate-500 mt-1">Add your team's fields, venues, and meeting points</p>
                </div>
            )}
        </div>
    );
};

export default TeamLocationsManager;
