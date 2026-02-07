import React, { useState, useEffect } from 'react';

const WelcomeMessageManager = ({ currentUser }) => {
    const [welcomeMessage, setWelcomeMessage] = useState({
        title: '',
        content: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        loadWelcomeMessage();
    }, []);

    const loadWelcomeMessage = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/league-settings/welcome-message`);
            if (response.ok) {
                const data = await response.json();
                setWelcomeMessage({
                    title: data.title || '',
                    content: data.content || ''
                });
            }
        } catch (error) {
            console.error('Error loading welcome message:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        
        try {
            const response = await fetch(`${backendUrl}/api/league-settings/welcome-message`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...welcomeMessage,
                    updatedBy: currentUser?.id
                })
            });
            
            if (response.ok) {
                setMessage('✅ Welcome message saved successfully!');
            } else {
                setMessage('❌ Failed to save welcome message');
            }
        } catch (error) {
            console.error('Error saving welcome message:', error);
            setMessage('❌ Error saving welcome message');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 4000);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Welcome Message</h2>
                <p className="text-slate-600">Customize the welcome message shown on the home page</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                    {message}
                </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Welcome Title
                    </label>
                    <input
                        type="text"
                        value={welcomeMessage.title}
                        onChange={(e) => setWelcomeMessage(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Welcome to Our League!"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="welcome-title-input"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Welcome Message Content
                    </label>
                    <textarea
                        value={welcomeMessage.content}
                        onChange={(e) => setWelcomeMessage(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write a welcoming message for visitors to your league website..."
                        rows={8}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="welcome-content-input"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        You can use line breaks to separate paragraphs. HTML is not supported.
                    </p>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        data-testid="save-welcome-btn"
                    >
                        {saving ? 'Saving...' : 'Save Welcome Message'}
                    </button>
                </div>
            </div>

            {/* Preview Section */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Preview</h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="mr-3">👋</span>
                        {welcomeMessage.title || 'Welcome to Our League!'}
                    </h2>
                    {welcomeMessage.content ? (
                        <div 
                            className="prose prose-slate max-w-none text-slate-700"
                            dangerouslySetInnerHTML={{ __html: welcomeMessage.content.replace(/\n/g, '<br/>') }}
                        />
                    ) : (
                        <p className="text-slate-500 italic">
                            No content yet. Add your welcome message above.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WelcomeMessageManager;
