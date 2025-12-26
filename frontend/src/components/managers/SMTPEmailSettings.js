import React, { useState, useEffect } from 'react';

const SMTPEmailSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [config, setConfig] = useState({
        email: '',
        password: '',
        sender_name: '',
        host: '',
        port: 587
    });
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [testResult, setTestResult] = useState(null);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/smtp-config/status`);
            const data = await response.json();
            
            if (data.configured) {
                setConfig(prev => ({
                    ...prev,
                    email: data.email,
                    sender_name: data.sender_name,
                    host: data.host,
                    port: data.port
                }));
            }
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        try {
            setTesting(true);
            setTestResult(null);

            const response = await fetch(`${backendUrl}/api/smtp-config/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const result = await response.json();
            setTestResult(result);

        } catch (error) {
            setTestResult({
                status: 'error',
                message: 'Network error testing connection'
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage('');

            if (!config.email || !config.password) {
                setMessage('❌ Email and password are required');
                setSaving(false);
                return;
            }

            const response = await fetch(`${backendUrl}/api/smtp-config/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                setMessage('✅ SMTP settings saved successfully!');
                await loadConfig();
                setTimeout(() => setMessage(''), 5000);
            } else {
                const error = await response.json();
                setMessage(`❌ Failed to save: ${error.detail}`);
            }
        } catch (error) {
            setMessage('❌ Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    📧 SMTP Email Configuration
                </h3>
                <p className="text-gray-600">
                    Configure email settings for sending event notifications
                </p>
            </div>

            {/* Setup Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Quick Setup Guide</h4>
                <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>For Gmail/Google Workspace:</strong></p>
                    <ol className="list-decimal list-inside ml-4 space-y-1">
                        <li>Use your email: admin@mlbl.org</li>
                        <li>Create an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-semibold">App Password</a></li>
                        <li>Use the app password (not your regular password)</li>
                        <li>Host auto-detected: smtp.gmail.com</li>
                    </ol>
                </div>
            </div>

            {/* SMTP Form */}
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        value={config.email}
                        onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="admin@mlbl.org"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-2">(Use App Password for Gmail)</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={config.password}
                            onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Enter password or app password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-20"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                        >
                            {showPassword ? '👁️ Hide' : '👁️ Show'}
                        </button>
                    </div>
                </div>

                {/* Sender Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sender Name
                    </label>
                    <input
                        type="text"
                        value={config.sender_name}
                        onChange={(e) => setConfig(prev => ({ ...prev, sender_name: e.target.value }))}
                        placeholder="Midwest Lacrosse League"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Display name shown in recipient's inbox
                    </p>
                </div>

                {/* Advanced Settings */}
                <details className="border-t pt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                        ⚙️ Advanced Settings (Auto-detected)
                    </summary>
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SMTP Host
                                </label>
                                <input
                                    type="text"
                                    value={config.host}
                                    onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                                    placeholder="smtp.gmail.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SMTP Port
                                </label>
                                <input
                                    type="number"
                                    value={config.port}
                                    onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </details>
            </div>

            {/* Test Result */}
            {testResult && (
                <div className={`p-4 rounded-lg border ${
                    testResult.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                }`}>
                    <p className={`font-medium ${
                        testResult.status === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                        {testResult.message}
                    </p>
                </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleTest}
                    disabled={testing || !config.email || !config.password}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium"
                >
                    {testing ? 'Testing...' : '🧪 Test Connection'}
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || !config.email || !config.password}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                    {saving ? 'Saving...' : '💾 Save Settings'}
                </button>
            </div>

            {message && (
                <p className={`text-sm font-medium ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </p>
            )}

            {/* Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">💡 Tips</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li><strong>Gmail users:</strong> Must use App Password (not regular password)</li>
                    <li><strong>Google Workspace:</strong> May need to enable "Less secure app access"</li>
                    <li>Test connection before saving to verify settings work</li>
                    <li>SMTP host and port are auto-detected based on your email domain</li>
                </ul>
            </div>
        </div>
    );
};

export default SMTPEmailSettings;
