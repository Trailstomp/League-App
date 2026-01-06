import React, { useState, useEffect, useCallback } from 'react';

const PaymentConfig = ({ scope, teamId, currentUser, canManage, isLeagueAdmin, teams = [] }) => {
    const [selectedTeamId, setSelectedTeamId] = useState(teamId || '');
    const [config, setConfig] = useState({
        stripe_enabled: false,
        stripe_publishable_key: '',
        paypal_enabled: false,
        paypal_client_id: '',
        paypal_secret: '',
        paypal_mode: 'sandbox',
        paypal_email: '',
        venmo_enabled: false,
        venmo_username: '',
        zelle_enabled: false,
        zelle_email: '',
        zelle_phone: '',
        cash_enabled: true,
        check_enabled: true,
        check_payable_to: '',
        payment_instructions: '',
        send_reminders: true,
        reminder_days_before: [7, 3, 1]
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    const effectiveTeamId = selectedTeamId || teamId;
    
    const loadConfig = useCallback(async () => {
        try {
            const params = new URLSearchParams({ scope: effectiveTeamId ? 'team' : 'league' });
            if (effectiveTeamId) params.append('team_id', effectiveTeamId);
            
            const response = await fetch(`${backendUrl}/api/payment-config?${params}`);
            if (response.ok) {
                const data = await response.json();
                setConfig(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Error loading payment config:', error);
        }
        setLoading(false);
    }, [backendUrl, effectiveTeamId]);
    
    useEffect(() => {
        loadConfig();
    }, [loadConfig]);
    
    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${backendUrl}/api/payment-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...config,
                    scope: effectiveTeamId ? 'team' : 'league',
                    team_id: effectiveTeamId,
                    updated_by: currentUser?.id
                })
            });
            
            if (response.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Error saving payment config:', error);
        }
        setSaving(false);
    };
    
    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
        );
    }
    
    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Payment Methods Configuration</h3>
                    <p className="text-sm text-slate-600">
                        {effectiveTeamId 
                            ? `Configure payment methods for ${teams.find(t => t.id === effectiveTeamId)?.name || 'this team'}'s fees`
                            : 'Configure league-wide payment methods'}
                    </p>
                </div>
                
                {/* Team Selection for Coaches */}
                {teams.length > 0 && (
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700">Configure for:</label>
                        <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm"
                        >
                            {isLeagueAdmin && <option value="">League-wide Settings</option>}
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            
            {/* Scope Badge */}
            <div className="flex items-center gap-2">
                {effectiveTeamId ? (
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        🏆 Team Payment Settings
                    </span>
                ) : (
                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        👑 League-wide Payment Settings
                    </span>
                )}
            </div>
            
            {/* Stripe */}
            <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">💳</span>
                        <div>
                            <h4 className="font-medium text-slate-800">Stripe</h4>
                            <p className="text-sm text-slate-600">Accept cards, Apple Pay, Google Pay</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.stripe_enabled}
                            onChange={(e) => setConfig(prev => ({ ...prev, stripe_enabled: e.target.checked }))}
                            disabled={!canManage}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                {config.stripe_enabled && (
                    <div className="ml-9 space-y-3">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Publishable Key</label>
                            <input
                                type="text"
                                value={config.stripe_publishable_key || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                                placeholder="pk_live_..."
                                disabled={!canManage}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono disabled:bg-slate-100"
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            Get your keys from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Stripe Dashboard</a>
                        </p>
                    </div>
                )}
            </div>
            
            {/* PayPal */}
            <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🌐</span>
                        <div>
                            <h4 className="font-medium text-slate-800">PayPal</h4>
                            <p className="text-sm text-slate-600">Accept PayPal payments online</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.paypal_enabled}
                            onChange={(e) => setConfig(prev => ({ ...prev, paypal_enabled: e.target.checked }))}
                            disabled={!canManage}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                {config.paypal_enabled && (
                    <div className="ml-9 space-y-3">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">PayPal Client ID</label>
                            <input
                                type="text"
                                value={config.paypal_client_id || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, paypal_client_id: e.target.value }))}
                                placeholder="AW..."
                                disabled={!canManage}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono disabled:bg-slate-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">PayPal Secret</label>
                            <input
                                type="password"
                                value={config.paypal_secret || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, paypal_secret: e.target.value }))}
                                placeholder="••••••••"
                                disabled={!canManage}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono disabled:bg-slate-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Mode</label>
                            <select
                                value={config.paypal_mode || 'sandbox'}
                                onChange={(e) => setConfig(prev => ({ ...prev, paypal_mode: e.target.value }))}
                                disabled={!canManage}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                            >
                                <option value="sandbox">Sandbox (Testing)</option>
                                <option value="live">Live (Production)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">PayPal Email (optional - for manual tracking)</label>
                            <input
                                type="email"
                                value={config.paypal_email || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, paypal_email: e.target.value }))}
                                placeholder="payments@yourleague.com"
                                disabled={!canManage}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            Get your credentials from <a href="https://developer.paypal.com/developer/applications" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">PayPal Developer Dashboard</a>
                        </p>
                    </div>
                )}
            </div>
            
            {/* Venmo */}
            <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📱</span>
                        <div>
                            <h4 className="font-medium text-slate-800">Venmo</h4>
                            <p className="text-sm text-slate-600">Accept Venmo payments (manual tracking)</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.venmo_enabled}
                            onChange={(e) => setConfig(prev => ({ ...prev, venmo_enabled: e.target.checked }))}
                            disabled={!canManage}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                {config.venmo_enabled && (
                    <div className="ml-9">
                        <label className="block text-sm text-slate-600 mb-1">Venmo Username</label>
                        <input
                            type="text"
                            value={config.venmo_username || ''}
                            onChange={(e) => setConfig(prev => ({ ...prev, venmo_username: e.target.value }))}
                            placeholder="@YourLeague"
                            disabled={!canManage}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                        />
                    </div>
                )}
            </div>
            
            {/* Zelle */}
            <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🏦</span>
                        <div>
                            <h4 className="font-medium text-slate-800">Zelle</h4>
                            <p className="text-sm text-slate-600">Accept Zelle bank transfers (manual tracking)</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.zelle_enabled}
                            onChange={(e) => setConfig(prev => ({ ...prev, zelle_enabled: e.target.checked }))}
                            disabled={!canManage}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                {config.zelle_enabled && (
                    <div className="ml-9 grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Zelle Email</label>
                            <input
                                type="email"
                                value={config.zelle_email || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, zelle_email: e.target.value }))}
                                placeholder="treasurer@league.com"
                                disabled={!canManage}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Zelle Phone</label>
                            <input
                                type="tel"
                                value={config.zelle_phone || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, zelle_phone: e.target.value }))}
                                placeholder="555-123-4567"
                                disabled={!canManage}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                            />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Cash & Check */}
            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-medium text-slate-800">Manual Payment Methods</h4>
                
                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={config.cash_enabled}
                            onChange={(e) => setConfig(prev => ({ ...prev, cash_enabled: e.target.checked }))}
                            disabled={!canManage}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-slate-700">💵 Cash</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={config.check_enabled}
                            onChange={(e) => setConfig(prev => ({ ...prev, check_enabled: e.target.checked }))}
                            disabled={!canManage}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-slate-700">📝 Check</span>
                    </label>
                </div>
                
                {config.check_enabled && (
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Make Checks Payable To</label>
                        <input
                            type="text"
                            value={config.check_payable_to || ''}
                            onChange={(e) => setConfig(prev => ({ ...prev, check_payable_to: e.target.value }))}
                            placeholder="Your League Name"
                            disabled={!canManage}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                        />
                    </div>
                )}
            </div>
            
            {/* Payment Instructions */}
            <div className="p-4 border rounded-lg">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Payment Instructions (shown to payers)
                </label>
                <textarea
                    value={config.payment_instructions || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, payment_instructions: e.target.value }))}
                    placeholder="Add any special instructions for payments..."
                    rows={3}
                    disabled={!canManage}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                />
            </div>
            
            {/* Reminders */}
            <div className="p-4 border rounded-lg space-y-3">
                <label className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={config.send_reminders}
                        onChange={(e) => setConfig(prev => ({ ...prev, send_reminders: e.target.checked }))}
                        disabled={!canManage}
                        className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-medium text-slate-700">Send Payment Reminders</span>
                </label>
                
                {config.send_reminders && (
                    <p className="text-sm text-slate-600 ml-7">
                        Reminders sent 7, 3, and 1 day(s) before due date
                    </p>
                )}
            </div>
            
            {/* Save Button */}
            {canManage && (
                <div className="flex justify-end gap-3">
                    {saved && (
                        <span className="text-green-600 flex items-center gap-1">
                            ✅ Saved!
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentConfig;
