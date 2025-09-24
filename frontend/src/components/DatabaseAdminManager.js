import React, { useState, useEffect } from 'react';

const DatabaseAdminManager = () => {
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState('');
    const [documents, setDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [editingDocument, setEditingDocument] = useState(null);
    const [newDocument, setNewDocument] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

    // Get available collections
    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/admin/collections`);
            if (response.ok) {
                const data = await response.json();
                setCollections(data.collections);
            } else {
                setError('Failed to fetch collections');
            }
        } catch (err) {
            setError('Error fetching collections: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch documents from selected collection
    const fetchDocuments = async (collectionName) => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/admin/collections/${collectionName}/documents`);
            if (response.ok) {
                const data = await response.json();
                setDocuments(data.documents);
                setSelectedCollection(collectionName);
                setSelectedDocument(null);
                setEditingDocument(null);
            } else {
                setError('Failed to fetch documents');
            }
        } catch (err) {
            setError('Error fetching documents: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Save document (create or update)
    const saveDocument = async () => {
        try {
            let documentData;
            try {
                documentData = JSON.parse(editingDocument);
            } catch (err) {
                setError('Invalid JSON format');
                return;
            }

            setLoading(true);
            const isUpdate = documentData._id || documentData.id;
            const url = isUpdate 
                ? `${backendUrl}/api/admin/collections/${selectedCollection}/documents/${documentData._id || documentData.id}`
                : `${backendUrl}/api/admin/collections/${selectedCollection}/documents`;
            
            const response = await fetch(url, {
                method: isUpdate ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(documentData)
            });

            if (response.ok) {
                setSuccess(isUpdate ? 'Document updated successfully' : 'Document created successfully');
                fetchDocuments(selectedCollection);
                setEditingDocument(null);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const errorData = await response.json();
                setError('Failed to save document: ' + (errorData.detail || 'Unknown error'));
            }
        } catch (err) {
            setError('Error saving document: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete document
    const deleteDocument = async (documentId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/admin/collections/${selectedCollection}/documents/${documentId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSuccess('Document deleted successfully');
                fetchDocuments(selectedCollection);
                setSelectedDocument(null);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError('Failed to delete document');
            }
        } catch (err) {
            setError('Error deleting document: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Create new document
    const createNewDocument = () => {
        const template = {
            // Add common fields based on collection
            ...(selectedCollection === 'api_integrations' && {
                id: '',
                integration_name: 'groupme',
                display_name: '',
                encrypted_credentials: '',
                settings: {},
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: null
            }),
            ...(selectedCollection === 'groupme_channels' && {
                id: '',
                name: '',
                groupme_group_id: '',
                groupme_bot_id: '',
                channel_type: 'league',
                is_active: true,
                notification_settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        };
        
        setEditingDocument(JSON.stringify(template, null, 2));
        setSelectedDocument(null);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Administration</h2>
                <p className="text-gray-600">View and manage your database collections and documents</p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{error}</p>
                    <button 
                        onClick={() => setError('')}
                        className="mt-2 text-red-600 hover:text-red-800 text-sm"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700">{success}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Collections Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow border">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold">Collections</h3>
                            <button 
                                onClick={fetchCollections}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                                disabled={loading}
                            >
                                🔄 Refresh Collections
                            </button>
                        </div>
                        <div className="p-4">
                            {loading && <p className="text-gray-500">Loading...</p>}
                            {collections.map((collection) => (
                                <button
                                    key={collection}
                                    onClick={() => fetchDocuments(collection)}
                                    className={`w-full text-left p-3 rounded mb-2 transition-colors ${
                                        selectedCollection === collection
                                            ? 'bg-blue-100 border border-blue-300'
                                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                >
                                    <div className="font-medium">{collection}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Documents Panel */}
                <div className="lg:col-span-2">
                    {selectedCollection && (
                        <div className="bg-white rounded-lg shadow border">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="text-lg font-semibold">
                                    Documents in: {selectedCollection}
                                </h3>
                                <button
                                    onClick={createNewDocument}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    ➕ New Document
                                </button>
                            </div>
                            <div className="p-4">
                                {documents.length === 0 ? (
                                    <p className="text-gray-500">No documents found in this collection</p>
                                ) : (
                                    <div className="space-y-2">
                                        {documents.map((doc) => (
                                            <div 
                                                key={doc._id || doc.id}
                                                className="border border-gray-200 rounded p-3"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">
                                                            ID: {doc._id || doc.id}
                                                        </p>
                                                        {doc.integration_name && (
                                                            <p className="text-sm text-gray-600">
                                                                Integration: {doc.integration_name}
                                                            </p>
                                                        )}
                                                        {doc.display_name && (
                                                            <p className="text-sm text-gray-600">
                                                                Name: {doc.display_name}
                                                            </p>
                                                        )}
                                                        {doc.name && (
                                                            <p className="text-sm text-gray-600">
                                                                Name: {doc.name}
                                                            </p>
                                                        )}
                                                        {doc.channel_type && (
                                                            <p className="text-sm text-gray-600">
                                                                Type: {doc.channel_type}
                                                            </p>
                                                        )}
                                                        {doc.is_active !== undefined && (
                                                            <p className="text-sm text-gray-600">
                                                                Active: {doc.is_active ? 'Yes' : 'No'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDocument(doc);
                                                                setEditingDocument(JSON.stringify(doc, null, 2));
                                                            }}
                                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteDocument(doc._id || doc.id)}
                                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Document Editor */}
                    {editingDocument && (
                        <div className="mt-6 bg-white rounded-lg shadow border">
                            <div className="p-4 border-b">
                                <h3 className="text-lg font-semibold">
                                    {selectedDocument ? 'Edit Document' : 'Create New Document'}
                                </h3>
                            </div>
                            <div className="p-4">
                                <textarea
                                    value={editingDocument}
                                    onChange={(e) => setEditingDocument(e.target.value)}
                                    className="w-full h-96 font-mono text-sm border border-gray-300 rounded p-3"
                                    placeholder="Enter JSON document..."
                                />
                                <div className="flex space-x-3 mt-4">
                                    <button
                                        onClick={saveDocument}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        disabled={loading}
                                    >
                                        💾 Save Document
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingDocument(null);
                                            setSelectedDocument(null);
                                        }}
                                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                    >
                                        ❌ Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DatabaseAdminManager;