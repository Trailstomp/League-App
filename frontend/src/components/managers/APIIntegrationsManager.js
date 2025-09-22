import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';

const APIIntegrationsManager = () => {
    const [apiIntegrations, setApiIntegrations] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load API integrations on mount
    useEffect(() => {
        loadApiIntegrations();
    }, []);

    const loadApiIntegrations = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/api-integrations`);
            if (response.ok) {
                const data = await response.json();
                setApiIntegrations(data || {});
                console.log('✅ Loaded API integrations:', Object.keys(data));
            }
        } catch (error) {
            console.error('❌ Error loading API integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveApiIntegrations = async (integrationData) => {
        try {
            setSaving(true);
            console.log('🔧 Saving API integrations:', integrationData);
            
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/api-integrations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(integrationData)
            });
            
            if (response.ok) {
                setApiIntegrations(integrationData);
                console.log('✅ API integrations saved successfully');
                alert('API integrations saved successfully!');
            } else {
                console.error('❌ Failed to save API integrations:', response.statusText);
                alert('Failed to save API integrations. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error saving API integrations:', error);
            alert('Error saving API integrations. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <LacrosseIcon name="settings" className="text-4xl text-blue-600 mb-4" />
                    <p className="text-slate-600">Loading API integrations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800">API & Integrations</h2>
                <p className="text-slate-600">Configure API keys and third-party service integrations</p>
            </div>

            <APIIntegrationsForm
                apiIntegrations={apiIntegrations}
                onSave={handleSaveApiIntegrations}
                saving={saving}
            />
        </div>
    );
};

// API Integrations Form Component
const APIIntegrationsForm = ({ apiIntegrations, onSave, saving }) => {
    const [formData, setFormData] = useState({
        googleMapsApiKey: apiIntegrations?.googleMapsApiKey || '',
        emailApiKey: apiIntegrations?.emailApiKey || '',
        smsApiKey: apiIntegrations?.smsApiKey || '',
        socialMediaApiKeys: apiIntegrations?.socialMediaApiKeys || {}
    });

    useEffect(() => {
        setFormData({
            googleMapsApiKey: apiIntegrations?.googleMapsApiKey || '',
            emailApiKey: apiIntegrations?.emailApiKey || '',
            smsApiKey: apiIntegrations?.smsApiKey || '',
            socialMediaApiKeys: apiIntegrations?.socialMediaApiKeys || {}
        });
    }, [apiIntegrations]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: 'main_integrations'
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Google Maps API */}
                <div className="bg-slate-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <span className="text-3xl mr-4">🗺️</span>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">Google Maps Integration</h3>
                            <p className="text-sm text-slate-600">Required for location services, embedded maps, and address validation</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Google Maps API Key *
                            </label>
                            <input
                                type="text"
                                value={formData.googleMapsApiKey}
                                onChange={(e) => setFormData({...formData, googleMapsApiKey: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="AIzaSyBOTXGhvHj82av8eLrYP-FfyVQDk2qxTA"
                            />
                            <div className="mt-2 text-xs text-slate-500">
                                <p className="mb-1">
                                    Get your API key from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a>
                                </p>
                                <p>Required APIs: Maps Static API, Maps JavaScript API, Geocoding API</p>
                            </div>
                        </div>

                        {/* API Key Status */}
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${formData.googleMapsApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium">
                                {formData.googleMapsApiKey ? '✅ API Key Configured' : '❌ API Key Required'}
                            </span>
                        </div>

                        {/* Features Enabled */}
                        {formData.googleMapsApiKey && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h4 className="font-medium text-green-800 mb-2">🎯 Features Enabled:</h4>
                                <ul className="text-sm text-green-700 space-y-1">
                                    <li>• Embedded maps in location cards</li>
                                    <li>• Click-to-open Google Maps navigation</li>
                                    <li>• Static map previews in events and team pages</li>
                                    <li>• Address validation and geocoding</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Email API - Future */}
                <div className="bg-slate-50 rounded-lg p-6 opacity-60">
                    <div className="flex items-center mb-4">
                        <span className="text-3xl mr-4">📧</span>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">Email Integration</h3>
                            <p className="text-sm text-slate-600">For automated notifications and team communications</p>
                        </div>
                        <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                            Coming Soon
                        </span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email Service API Key
                        </label>
                        <input
                            type="text"
                            value={formData.emailApiKey}
                            onChange={(e) => setFormData({...formData, emailApiKey: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500"
                            placeholder="Email integration coming in future updates"
                            disabled
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Future features: Game reminders, team notifications, roster updates
                        </p>
                    </div>
                </div>

                {/* SMS API - Future */}
                <div className="bg-slate-50 rounded-lg p-6 opacity-60">
                    <div className="flex items-center mb-4">
                        <span className="text-3xl mr-4">📱</span>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">SMS Integration</h3>
                            <p className="text-sm text-slate-600">For text message notifications and alerts</p>
                        </div>
                        <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                            Coming Soon
                        </span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            SMS Service API Key
                        </label>
                        <input
                            type="text"
                            value={formData.smsApiKey}
                            onChange={(e) => setFormData({...formData, smsApiKey: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500"
                            placeholder="SMS integration coming in future updates"
                            disabled
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Future features: Game alerts, schedule changes, emergency notifications
                        </p>
                    </div>
                </div>

                {/* Social Media - Future */}
                <div className="bg-slate-50 rounded-lg p-6 opacity-60">
                    <div className="flex items-center mb-4">
                        <span className="text-3xl mr-4">📱</span>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">Social Media Integration</h3>
                            <p className="text-sm text-slate-600">Auto-post game results and team updates</p>
                        </div>
                        <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                            Coming Soon
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Twitter API</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500"
                                placeholder="Twitter integration coming soon"
                                disabled
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Facebook API</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500"
                                placeholder="Facebook integration coming soon"
                                disabled
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-slate-200">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? (
                            <>
                                <LacrosseIcon name="loading" className="mr-2 animate-spin" style={{fontSize: '16px'}} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <LacrosseIcon name="settings" className="mr-2" style={{fontSize: '16px'}} />
                                Save API Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default APIIntegrationsManager;