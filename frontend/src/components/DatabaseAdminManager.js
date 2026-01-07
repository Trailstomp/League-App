import React, { useState, useEffect } from 'react';

const DatabaseAdminManager = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [message, setMessage] = useState('');
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [collectionData, setCollectionData] = useState(null);
    const [loadingCollection, setLoadingCollection] = useState(false);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    // Load stats on mount
    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/database/stats`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                setMessage('❌ Failed to load database stats');
            }
        } catch (error) {
            console.error('Error loading database stats:', error);
            setMessage('❌ Error loading database stats');
        } finally {
            setLoading(false);
        }
    };

    const loadCollectionData = async (collectionName) => {
        try {
            setLoadingCollection(true);
            setSelectedCollection(collectionName);
            const response = await fetch(`${backendUrl}/api/database/collections/${collectionName}?limit=50`);
            if (response.ok) {
                const data = await response.json();
                setCollectionData(data);
            }
        } catch (error) {
            console.error('Error loading collection:', error);
        } finally {
            setLoadingCollection(false);
        }
    };

    const handleBackup = async () => {
        try {
            setLoading(true);
            setMessage('');
            const response = await fetch(`${backendUrl}/api/database/backup`, {
                method: 'POST'
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(`ℹ️ ${data.message}`);
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
                    message.includes('✅') ? 'bg-green-50 text-green-800' : 
                    message.includes('ℹ️') ? 'bg-blue-50 text-blue-800' :
                    'bg-red-50 text-red-800'
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
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Database Overview</h3>
                            <button
                                onClick={loadStats}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin">⟳</span>
                                        Loading...
                                    </>
                                ) : (
                                    <>🔄 Refresh Stats</>
                                )}
                            </button>
                        </div>

                        {stats && (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <div className="text-3xl font-bold text-blue-600">{stats.collections || 0}</div>
                                        <div className="text-sm text-gray-600">Collections</div>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <div className="text-3xl font-bold text-green-600">{stats.documents?.toLocaleString() || 0}</div>
                                        <div className="text-sm text-gray-600">Total Documents</div>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-lg">
                                        <div className="text-3xl font-bold text-purple-600">{stats.size || 'N/A'}</div>
                                        <div className="text-sm text-gray-600">Database Size</div>
                                    </div>
                                </div>

                                {/* Collections Summary */}
                                <div>
                                    <h4 className="text-md font-semibold mb-3">Collections Summary</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left py-2 px-3 font-medium">Collection</th>
                                                    <th className="text-right py-2 px-3 font-medium">Documents</th>
                                                    <th className="text-right py-2 px-3 font-medium">Fields</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.collectionsInfo?.map((col, idx) => (
                                                    <tr key={col.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                        <td className="py-2 px-3">
                                                            <button 
                                                                onClick={() => {
                                                                    setActiveTab('collections');
                                                                    loadCollectionData(col.name);
                                                                }}
                                                                className="text-blue-600 hover:underline font-medium"
                                                            >
                                                                {col.name}
                                                            </button>
                                                        </td>
                                                        <td className="py-2 px-3 text-right">{col.documents?.toLocaleString()}</td>
                                                        <td className="py-2 px-3 text-right">{col.fieldCount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {!stats && !loading && (
                            <div className="text-center py-8 text-gray-500">
                                <p>Click "Refresh Stats" to load database information</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'collections' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                {selectedCollection ? `Collection: ${selectedCollection}` : 'Select a Collection'}
                            </h3>
                            {selectedCollection && (
                                <button
                                    onClick={() => {
                                        setSelectedCollection(null);
                                        setCollectionData(null);
                                    }}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    ← Back to list
                                </button>
                            )}
                        </div>

                        {!selectedCollection && stats?.collectionsInfo && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {stats.collectionsInfo.map(col => (
                                    <button
                                        key={col.name}
                                        onClick={() => loadCollectionData(col.name)}
                                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                                    >
                                        <div className="font-medium text-gray-800">{col.name}</div>
                                        <div className="text-sm text-gray-500">{col.documents} docs</div>
                                        <div className="text-xs text-gray-400 mt-1 truncate">
                                            {col.fields?.slice(0, 3).join(', ')}...
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {loadingCollection && (
                            <div className="text-center py-8">
                                <div className="animate-spin text-2xl">⟳</div>
                                <p className="text-gray-500 mt-2">Loading collection data...</p>
                            </div>
                        )}

                        {selectedCollection && collectionData && !loadingCollection && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>Total: {collectionData.totalDocuments} documents</span>
                                    <span>Showing: {collectionData.returnedDocuments}</span>
                                </div>

                                {/* Show fields */}
                                {collectionData.documents?.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Fields:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(collectionData.documents[0] || {}).map(field => (
                                                <span key={field} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                    {field}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Documents table */}
                                <div className="overflow-x-auto border rounded-lg">
                                    <div className="max-h-96 overflow-y-auto">
                                        {collectionData.documents?.map((doc, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`p-3 text-xs ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b`}
                                            >
                                                <pre className="whitespace-pre-wrap overflow-x-auto">
                                                    {JSON.stringify(doc, null, 2)}
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {collectionData.documents?.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No documents in this collection
                                    </div>
                                )}
                            </div>
                        )}

                        {!selectedCollection && !stats?.collectionsInfo && (
                            <div className="text-center py-8 text-gray-500">
                                <p>Load database stats from the Overview tab first</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'backup' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Database Backup</h3>
                        <p className="text-sm text-gray-600">
                            Database backups should be performed through MongoDB Atlas or using mongodump CLI tool.
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                                <div>
                                    <h4 className="font-medium text-yellow-800">Backup Recommendations</h4>
                                    <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                                        <li>Use MongoDB Atlas automated backups for production databases</li>
                                        <li>Run mongodump from command line for local backups</li>
                                        <li>Schedule regular backups based on your data update frequency</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleBackup}
                            disabled={loading}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : '💾 Check Backup Status'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseAdminManager;
