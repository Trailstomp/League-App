import React, { useState } from 'react';

const DatabaseAdminManager = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [message, setMessage] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/database/stats`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error loading database stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            setLoading(true);
            setMessage('');
            const response = await fetch(`${backendUrl}/api/database/backup`, {
                method: 'POST'
            });

            if (response.ok) {
                setMessage('✅ Backup initiated successfully');
            } else {
                setMessage('❌ Backup failed');
            }
        } catch (error) {
            setMessage('❌ Error initiating backup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Database Administration</h2>
                <p className="text-slate-600 mt-1">Monitor and manage database operations</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${
                    message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                    {message}
                </div>
            )}

            <div className="flex gap-4 border-b">
                {['overview', 'collections', 'backup'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-4 font-medium transition ${
                            activeTab === tab
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <button
                            onClick={loadStats}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : '🔄 Load Database Stats'}
                        </button>

                        {stats && (
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{stats.collections || 0}</div>
                                    <div className="text-sm text-gray-600">Collections</div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{stats.documents || 0}</div>
                                    <div className="text-sm text-gray-600">Documents</div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{stats.size || '0 MB'}</div>
                                    <div className="text-sm text-gray-600">Database Size</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'backup' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Database Backup</h3>
                        <p className="text-sm text-gray-600">Create a backup of your database</p>
                        <button
                            onClick={handleBackup}
                            disabled={loading}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating Backup...' : '💾 Create Backup'}
                        </button>
                    </div>
                )}

                {activeTab === 'collections' && (
                    <div className="text-center py-12 text-gray-500">
                        <p>Collection management coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseAdminManager;
