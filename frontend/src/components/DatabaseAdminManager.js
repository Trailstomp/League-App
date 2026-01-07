import React, { useState, useEffect } from 'react';

const DatabaseAdminManager = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [message, setMessage] = useState('');
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [collectionData, setCollectionData] = useState(null);
    const [loadingCollection, setLoadingCollection] = useState(false);
    
    // Edit/View modal state
    const [editingRecord, setEditingRecord] = useState(null);
    const [editedData, setEditedData] = useState('');
    const [viewMode, setViewMode] = useState('view'); // 'view' or 'edit'
    const [saving, setSaving] = useState(false);
    
    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

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
            const response = await fetch(`${backendUrl}/api/database/collections/${collectionName}?limit=100`);
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

    const openRecordModal = (record, mode = 'view') => {
        setEditingRecord(record);
        setEditedData(JSON.stringify(record, null, 2));
        setViewMode(mode);
    };

    const closeRecordModal = () => {
        setEditingRecord(null);
        setEditedData('');
        setViewMode('view');
    };

    const handleSaveRecord = async () => {
        try {
            setSaving(true);
            let parsedData;
            try {
                parsedData = JSON.parse(editedData);
            } catch (e) {
                setMessage('❌ Invalid JSON format');
                setSaving(false);
                return;
            }

            const recordId = editingRecord.id || editingRecord._id;
            const response = await fetch(`${backendUrl}/api/database/collections/${selectedCollection}/${recordId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedData)
            });

            if (response.ok) {
                setMessage('✅ Record updated successfully');
                closeRecordModal();
                loadCollectionData(selectedCollection);
            } else {
                const error = await response.json();
                setMessage(`❌ Failed to update: ${error.detail}`);
            }
        } catch (error) {
            setMessage('❌ Error updating record');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRecord = async (record) => {
        try {
            const recordId = record.id || record._id;
            const response = await fetch(`${backendUrl}/api/database/collections/${selectedCollection}/${recordId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMessage('✅ Record deleted successfully');
                setDeleteConfirm(null);
                loadCollectionData(selectedCollection);
            } else {
                const error = await response.json();
                setMessage(`❌ Failed to delete: ${error.detail}`);
            }
        } catch (error) {
            setMessage('❌ Error deleting record');
        }
    };

    // Get table columns from first document
    const getColumns = () => {
        if (!collectionData?.documents?.length) return [];
        const firstDoc = collectionData.documents[0];
        // Prioritize common fields, then add others
        const priorityFields = ['id', 'name', 'title', 'email', 'status', 'type', 'date', 'createdAt'];
        const allFields = Object.keys(firstDoc);
        const orderedFields = priorityFields.filter(f => allFields.includes(f));
        const otherFields = allFields.filter(f => !priorityFields.includes(f));
        return [...orderedFields, ...otherFields].slice(0, 8); // Limit to 8 columns
    };

    // Format cell value for display
    const formatCellValue = (value) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? '✓' : '✗';
        if (typeof value === 'object') {
            if (Array.isArray(value)) return `[${value.length} items]`;
            return '{...}';
        }
        const str = String(value);
        return str.length > 40 ? str.substring(0, 40) + '...' : str;
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Database Administration</h2>
                <p className="text-slate-600 mt-1">View, edit, and manage database records</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex justify-between items-center ${
                    message.includes('✅') ? 'bg-green-50 text-green-800' : 
                    message.includes('ℹ️') ? 'bg-blue-50 text-blue-800' :
                    'bg-red-50 text-red-800'
                }`}>
                    <span>{message}</span>
                    <button onClick={() => setMessage('')} className="text-lg">×</button>
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
                                {loading ? '⟳ Loading...' : '🔄 Refresh Stats'}
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

                                <div>
                                    <h4 className="text-md font-semibold mb-3">Collections Summary</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left py-2 px-3 font-medium">Collection</th>
                                                    <th className="text-right py-2 px-3 font-medium">Documents</th>
                                                    <th className="text-right py-2 px-3 font-medium">Fields</th>
                                                    <th className="text-right py-2 px-3 font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.collectionsInfo?.map((col, idx) => (
                                                    <tr key={col.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                        <td className="py-2 px-3">
                                                            <span className="font-medium text-gray-800">{col.name}</span>
                                                        </td>
                                                        <td className="py-2 px-3 text-right">{col.documents?.toLocaleString()}</td>
                                                        <td className="py-2 px-3 text-right">{col.fieldCount}</td>
                                                        <td className="py-2 px-3 text-right">
                                                            <button 
                                                                onClick={() => {
                                                                    setActiveTab('collections');
                                                                    loadCollectionData(col.name);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                                            >
                                                                View →
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'collections' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {selectedCollection && (
                                    <button
                                        onClick={() => {
                                            setSelectedCollection(null);
                                            setCollectionData(null);
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        ← Back
                                    </button>
                                )}
                                <h3 className="text-lg font-semibold">
                                    {selectedCollection ? `📁 ${selectedCollection}` : 'Select a Collection'}
                                </h3>
                                {collectionData && (
                                    <span className="text-sm text-gray-500">
                                        ({collectionData.totalDocuments} records)
                                    </span>
                                )}
                            </div>
                            {selectedCollection && (
                                <button
                                    onClick={() => loadCollectionData(selectedCollection)}
                                    className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                                >
                                    🔄 Refresh
                                </button>
                            )}
                        </div>

                        {!selectedCollection && stats?.collectionsInfo && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {stats.collectionsInfo.map(col => (
                                    <button
                                        key={col.name}
                                        onClick={() => loadCollectionData(col.name)}
                                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left border hover:border-blue-300"
                                    >
                                        <div className="font-medium text-gray-800">📁 {col.name}</div>
                                        <div className="text-sm text-gray-500">{col.documents} documents</div>
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
                                {/* Data Table */}
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 sticky top-0">
                                            <tr>
                                                {getColumns().map(col => (
                                                    <th key={col} className="text-left py-2 px-3 font-medium text-gray-700 whitespace-nowrap">
                                                        {col}
                                                    </th>
                                                ))}
                                                <th className="text-center py-2 px-3 font-medium text-gray-700 w-32">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {collectionData.documents?.map((doc, idx) => (
                                                <tr key={doc.id || doc._id || idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                                                    {getColumns().map(col => (
                                                        <td key={col} className="py-2 px-3 text-gray-600 max-w-xs truncate">
                                                            {formatCellValue(doc[col])}
                                                        </td>
                                                    ))}
                                                    <td className="py-2 px-3 text-center whitespace-nowrap">
                                                        <button
                                                            onClick={() => openRecordModal(doc, 'view')}
                                                            className="text-blue-600 hover:text-blue-800 mx-1"
                                                            title="View"
                                                        >
                                                            👁️
                                                        </button>
                                                        <button
                                                            onClick={() => openRecordModal(doc, 'edit')}
                                                            className="text-green-600 hover:text-green-800 mx-1"
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(doc)}
                                                            className="text-red-600 hover:text-red-800 mx-1"
                                                            title="Delete"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {collectionData.documents?.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No documents in this collection
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'backup' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Database Backup</h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                                <div>
                                    <h4 className="font-medium text-yellow-800">Backup Recommendations</h4>
                                    <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                                        <li>Use MongoDB Atlas automated backups for production</li>
                                        <li>Run mongodump from CLI for local backups</li>
                                        <li>Export individual collections via the Collections tab</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* View/Edit Record Modal */}
            {editingRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                            <h3 className="font-semibold text-lg">
                                {viewMode === 'view' ? '👁️ View Record' : '✏️ Edit Record'}
                            </h3>
                            <div className="flex items-center gap-2">
                                {viewMode === 'view' && (
                                    <button
                                        onClick={() => setViewMode('edit')}
                                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                    >
                                        ✏️ Edit
                                    </button>
                                )}
                                <button onClick={closeRecordModal} className="text-gray-500 hover:text-gray-700 text-xl">
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            {viewMode === 'view' ? (
                                <div className="space-y-3">
                                    {Object.entries(editingRecord).map(([key, value]) => (
                                        <div key={key} className="border-b pb-2">
                                            <div className="text-xs font-medium text-gray-500 uppercase">{key}</div>
                                            <div className="text-sm text-gray-800 mt-1">
                                                {typeof value === 'object' ? (
                                                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                                                        {JSON.stringify(value, null, 2)}
                                                    </pre>
                                                ) : (
                                                    String(value ?? '-')
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <textarea
                                    value={editedData}
                                    onChange={(e) => setEditedData(e.target.value)}
                                    className="w-full h-96 font-mono text-sm p-3 border rounded-lg"
                                    spellCheck={false}
                                />
                            )}
                        </div>
                        {viewMode === 'edit' && (
                            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                                <button
                                    onClick={closeRecordModal}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveRecord}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : '💾 Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-red-600 mb-4">⚠️ Confirm Delete</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete this record? This action cannot be undone.
                        </p>
                        <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                            <div><strong>ID:</strong> {deleteConfirm.id || deleteConfirm._id}</div>
                            {deleteConfirm.name && <div><strong>Name:</strong> {deleteConfirm.name}</div>}
                            {deleteConfirm.title && <div><strong>Title:</strong> {deleteConfirm.title}</div>}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteRecord(deleteConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatabaseAdminManager;
