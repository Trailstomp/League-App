import React, { useState, useEffect } from 'react';

const GoogleCommunicationSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);
    const [settings, setSettings] = useState({
        useGoogleCalendar: false,
        useGmail: false,
        useGroupMe: true,
        senderEmail: 'admin@mlbl.org',
        senderName: 'Midwest Lacrosse League'
    });
    const [message, setMessage] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/google-communication/status`);
            
            if (response.ok) {
                const data = await response.json();
                setStatus(data);
                setSettings(prev => ({
                    ...prev,
                    useGoogleCalendar: data.services.calendar,
                    useGmail: data.services.gmail,
                    useGroupMe: data.services.groupme,
                    senderEmail: data.sender_email || prev.senderEmail
                }));
            }
        } catch (error) {
            console.error('Error loading status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage('');

            const response = await fetch(`${backendUrl}/api/google-communication/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                setMessage('✅ Settings saved successfully!');
                await loadStatus();
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('❌ Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage('❌ Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    📧 Communication Settings
                </h2>
                <p className="text-gray-600">
                    Configure how event notifications are sent to your league members
                </p>
            </div>

            {/* Google Status */}
            {status && (
                <div className={`p-4 rounded-lg border ${
                    status.configured 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                }`}>
                    <div className="flex items-center">
                        {status.configured ? (
                            <>
                                <span className="text-2xl mr-3">✅</span>
                                <div>
                                    <p className="font-semibold text-green-800">
                                        Google Integration Connected
                                    </p>
                                    <p className="text-sm text-green-600">
                                        Calendar and Gmail services are available
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="text-2xl mr-3">⚠️</span>
                                <div>
                                    <p className="font-semibold text-yellow-800">
                                        Google Not Configured
                                    </p>
                                    <p className="text-sm text-yellow-600">
                                        Complete Google OAuth setup to enable Calendar and Gmail
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Communication Channels */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Communication Channels
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                    Enable the channels you want to use for event notifications. All enabled channels will receive notifications when events are created or updated.
                </p>

                <div className="space-y-4">
                    {/* Google Calendar */}
                    <div className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition">
                        <div className="flex items-center h-6">
                            <input
                                type="checkbox"
                                id="googleCalendar"
                                checked={settings.useGoogleCalendar}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    useGoogleCalendar: e.target.checked
                                }))}
                                disabled={!status?.configured}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </div>
                        <div className="ml-4 flex-1">
                            <label htmlFor="googleCalendar" className="flex items-center font-medium text-gray-900 cursor-pointer">
                                📅 Google Calendar
                                {settings.useGoogleCalendar && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                        Active
                                    </span>
                                )}
                            </label>
                            <p className="text-sm text-gray-600 mt-1">
                                Send calendar invites with built-in RSVP buttons. Events automatically added to users' calendars with reminders.
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                                ✅ Calendar invites • ✅ Auto-reminders • ✅ RSVP tracking
                            </div>
                        </div>
                    </div>

                    {/* Gmail */}
                    <div className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition">
                        <div className="flex items-center h-6">
                            <input
                                type="checkbox"
                                id="gmail"
                                checked={settings.useGmail}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    useGmail: e.target.checked
                                }))}
                                disabled={!status?.configured}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </div>
                        <div className="ml-4 flex-1">
                            <label htmlFor="gmail" className="flex items-center font-medium text-gray-900 cursor-pointer">
                                📧 Gmail Notifications
                                {settings.useGmail && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                        Active
                                    </span>
                                )}
                            </label>
                            <p className="text-sm text-gray-600 mt-1">
                                Send rich HTML emails with event details, team logos, and RSVP buttons.
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                                ✅ Professional emails • ✅ Rich formatting • ✅ Team logos
                            </div>
                        </div>
                    </div>

                    {/* GroupMe */}
                    <div className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition">
                        <div className="flex items-center h-6">
                            <input
                                type="checkbox"
                                id="groupme"
                                checked={settings.useGroupMe}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    useGroupMe: e.target.checked
                                }))}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </div>
                        <div className="ml-4 flex-1">
                            <label htmlFor="groupme" className="flex items-center font-medium text-gray-900 cursor-pointer">
                                💬 GroupMe Messages
                                {settings.useGroupMe && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                        Active
                                    </span>
                                )}
                            </label>
                            <p className="text-sm text-gray-600 mt-1">
                                Send notifications to GroupMe channels configured for teams.
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                                ✅ Team chats • ✅ Quick messaging • ✅ Existing integration
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gmail Settings */}
            {settings.useGmail && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Gmail Configuration
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sender Email Address
                            </label>
                            <input
                                type="email"
                                value={settings.senderEmail}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    senderEmail: e.target.value
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="admin@mlbl.org"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Google Workspace email address that notifications will be sent from
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sender Name
                            </label>
                            <input
                                type="text"
                                value={settings.senderName}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    senderName: e.target.value
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Midwest Lacrosse League"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Display name shown in recipient's inbox
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <span className="text-2xl">💡</span>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            How it works
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                                <li>When you create or update an event, notifications are sent via all enabled channels</li>
                                <li>Users receive calendar invites, emails, and/or GroupMe messages based on your settings</li>
                                <li>RSVP responses from Google Calendar are automatically synced to your database</li>
                                <li>You can enable multiple channels to maximize reach</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between">
                <div>
                    {message && (
                        <p className={`text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                            {message}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-3 rounded-lg font-medium text-white transition ${
                        saving
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {saving ? 'Saving...' : '💾 Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default GoogleCommunicationSettings;
