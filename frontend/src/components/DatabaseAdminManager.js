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
        <div className="h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b px-6 py-4 flex-shrink-0">
                <h1 className="text-3xl font-bold text-gray-800">Database Administration</h1>
                
                {/* Status Messages */}
                {error && (
                    <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mt-2 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
                        {success}
                    </div>
                )}
                {loading && (
                    <div className="mt-2 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
                        Loading...
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Collections */}
                <div className="w-80 bg-white border-r flex flex-col">
                    <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                        <h2 className="text-lg font-semibold text-gray-800">Collections</h2>
                        <p className="text-sm text-gray-600 mt-1">{collections.length} collections available</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-2">
                            {collections.map((collection) => (
                                <button
                                    key={collection}
                                    onClick={() => fetchDocuments(collection)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                                        selectedCollection === collection
                                            ? 'bg-blue-100 border-2 border-blue-300 shadow-sm'
                                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
                                    }`}
                                >
                                    <div className="font-medium text-gray-800">{collection}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {selectedCollection === collection ? 'Selected' : 'Click to view'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Middle Panel: Documents List */}
                <div className="flex-1 bg-white border-r flex flex-col">
                    <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {selectedCollection ? `Documents: ${selectedCollection}` : 'Select a Collection'}
                                </h3>
                                {selectedCollection && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {documents.length} document{documents.length !== 1 ? 's' : ''} found
                                    </p>
                                )}
                            </div>
                            {selectedCollection && (
                                <button
                                    onClick={createNewDocument}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                >
                                    ➕ New Document
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                        {!selectedCollection ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <div className="text-4xl mb-4">📁</div>
                                    <p className="text-lg">Select a collection to view documents</p>
                                </div>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <div className="text-4xl mb-4">📄</div>
                                    <p className="text-lg">No documents in this collection</p>
                                    <button
                                        onClick={createNewDocument}
                                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Create First Document
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {documents.map((doc, index) => (
                                    <div 
                                        key={doc._id || doc.id}
                                        className={`border rounded-lg p-4 transition-colors hover:border-blue-300 ${
                                            selectedDocument && (selectedDocument._id === doc._id || selectedDocument.id === doc.id)
                                                ? 'border-blue-300 bg-blue-50'
                                                : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                        #{index + 1}
                                                    </span>
                                                    <p className="font-mono text-sm text-gray-800 truncate">
                                                        {doc._id || doc.id}
                                                    </p>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    {doc.integration_name && (
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-medium">Integration:</span> {doc.integration_name}
                                                        </p>
                                                    )}
                                                    {(doc.display_name || doc.name) && (
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-medium">Name:</span> {doc.display_name || doc.name}
                                                        </p>
                                                    )}
                                                    {doc.channel_type && (
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-medium">Type:</span> {doc.channel_type}
                                                        </p>
                                                    )}
                                                    {doc.is_active !== undefined && (
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-medium">Active:</span> 
                                                            <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                                                                doc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {doc.is_active ? 'Yes' : 'No'}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex space-x-2 ml-4 flex-shrink-0">
                                                <button
                                                    onClick={() => {
                                                        setSelectedDocument(doc);
                                                        setEditingDocument(JSON.stringify(doc, null, 2));
                                                    }}
                                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 font-medium"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteDocument(doc._id || doc.id)}
                                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 font-medium"
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

                {/* Right Panel: Document Editor */}
                <div className="w-1/2 bg-white flex flex-col">
                    <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {editingDocument ? (selectedDocument ? 'Edit Document' : 'Create New Document') : 'Document Editor'}
                            </h3>
                            {editingDocument && (
                                <button
                                    onClick={() => {
                                        setEditingDocument(null);
                                        setSelectedDocument(null);
                                    }}
                                    className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                                >
                                    ❌ Close
                                </button>
                            )}
                        </div>
                        {selectedDocument && (
                            <p className="text-sm text-gray-600 mt-1 font-mono">
                                ID: {selectedDocument._id || selectedDocument.id}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex-1 flex flex-col p-4">
                        {!editingDocument ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <div className="text-4xl mb-4">✏️</div>
                                    <p className="text-lg">Select a document to edit</p>
                                    <p className="text-sm mt-2">or create a new document</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    value={editingDocument}
                                    onChange={(e) => setEditingDocument(e.target.value)}
                                    className="flex-1 font-mono text-sm border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Enter JSON document..."
                                />
                                <div className="flex space-x-3 mt-4 pt-4 border-t">
                                    <button
                                        onClick={saveDocument}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                        disabled={loading}
                                    >
                                        💾 Save Document
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (selectedDocument) {
                                                setEditingDocument(JSON.stringify(selectedDocument, null, 2));
                                            } else {
                                                setEditingDocument('');
                                            }
                                        }}
                                        className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                                    >
                                        🔄 Reset
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseAdminManager;