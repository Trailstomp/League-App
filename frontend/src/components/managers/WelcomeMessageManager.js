import React, { useState, useEffect } from 'react';

const FONT_OPTIONS = [
    { value: 'Inter, system-ui, sans-serif', label: 'Inter (Modern)' },
    { value: 'Georgia, serif', label: 'Georgia (Classic)' },
    { value: 'Arial, sans-serif', label: 'Arial (Clean)' },
    { value: '"Playfair Display", serif', label: 'Playfair Display (Elegant)' },
    { value: '"Roboto", sans-serif', label: 'Roboto (Friendly)' },
    { value: '"Montserrat", sans-serif', label: 'Montserrat (Bold)' },
    { value: '"Open Sans", sans-serif', label: 'Open Sans (Readable)' },
    { value: '"Lato", sans-serif', label: 'Lato (Professional)' },
];

const WelcomeMessageManager = ({ currentUser }) => {
    const [welcomeMessage, setWelcomeMessage] = useState({
        title: '',
        content: '',
        backgroundColor: '#eff6ff',
        textColor: '#1e293b',
        titleColor: '#1e40af',
        fontFamily: 'Inter, system-ui, sans-serif',
        imageUrl: '',
        imagePosition: 'right' // 'left', 'right', 'top', 'background'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    
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
                    content: data.content || '',
                    backgroundColor: data.backgroundColor || '#eff6ff',
                    textColor: data.textColor || '#1e293b',
                    titleColor: data.titleColor || '#1e40af',
                    fontFamily: data.fontFamily || 'Inter, system-ui, sans-serif',
                    imageUrl: data.imageUrl || '',
                    imagePosition: data.imagePosition || 'right'
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

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${backendUrl}/api/upload/image`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setWelcomeMessage(prev => ({ ...prev, imageUrl: data.url }));
                setMessage('✅ Image uploaded successfully!');
            } else {
                setMessage('❌ Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            setMessage('❌ Error uploading image');
        } finally {
            setUploading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleChange = (field, value) => {
        setWelcomeMessage(prev => ({ ...prev, [field]: value }));
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Content */}
                <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Content</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Welcome Title
                        </label>
                        <input
                            type="text"
                            value={welcomeMessage.title}
                            onChange={(e) => handleChange('title', e.target.value)}
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
                            onChange={(e) => handleChange('content', e.target.value)}
                            placeholder="Write a welcoming message for visitors to your league website..."
                            rows={6}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            data-testid="welcome-content-input"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Use line breaks to separate paragraphs.
                        </p>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Welcome Image
                        </label>
                        <div className="flex items-center gap-4">
                            {welcomeMessage.imageUrl ? (
                                <div className="relative">
                                    <img 
                                        src={welcomeMessage.imageUrl} 
                                        alt="Welcome" 
                                        className="w-24 h-24 object-cover rounded-lg border"
                                    />
                                    <button
                                        onClick={() => handleChange('imageUrl', '')}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                    No image
                                </div>
                            )}
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="welcome-image-upload"
                                />
                                <label
                                    htmlFor="welcome-image-upload"
                                    className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                                        uploading 
                                            ? 'bg-slate-200 text-slate-500' 
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Image'}
                                </label>
                            </div>
                        </div>
                        {welcomeMessage.imageUrl && (
                            <div className="mt-3">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Image Position</label>
                                <select
                                    value={welcomeMessage.imagePosition}
                                    onChange={(e) => handleChange('imagePosition', e.target.value)}
                                    className="px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="right">Right of text</option>
                                    <option value="left">Left of text</option>
                                    <option value="top">Above text</option>
                                    <option value="background">Background (overlay)</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Styling */}
                <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Styling</h3>

                    {/* Font */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Font Family
                        </label>
                        <select
                            value={welcomeMessage.fontFamily}
                            onChange={(e) => handleChange('fontFamily', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            style={{ fontFamily: welcomeMessage.fontFamily }}
                        >
                            {FONT_OPTIONS.map(font => (
                                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                    {font.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Background Color
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={welcomeMessage.backgroundColor}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer border"
                                />
                                <input
                                    type="text"
                                    value={welcomeMessage.backgroundColor}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    placeholder="#eff6ff"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Title Color
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={welcomeMessage.titleColor}
                                    onChange={(e) => handleChange('titleColor', e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer border"
                                />
                                <input
                                    type="text"
                                    value={welcomeMessage.titleColor}
                                    onChange={(e) => handleChange('titleColor', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    placeholder="#1e40af"
                                />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Text Color
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={welcomeMessage.textColor}
                                    onChange={(e) => handleChange('textColor', e.target.value)}
                                    className="w-12 h-10 rounded cursor-pointer border"
                                />
                                <input
                                    type="text"
                                    value={welcomeMessage.textColor}
                                    onChange={(e) => handleChange('textColor', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    placeholder="#1e293b"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Quick Presets
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setWelcomeMessage(prev => ({
                                    ...prev,
                                    backgroundColor: '#eff6ff',
                                    titleColor: '#1e40af',
                                    textColor: '#1e293b'
                                }))}
                                className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                                Blue Classic
                            </button>
                            <button
                                onClick={() => setWelcomeMessage(prev => ({
                                    ...prev,
                                    backgroundColor: '#f0fdf4',
                                    titleColor: '#166534',
                                    textColor: '#14532d'
                                }))}
                                className="px-3 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200"
                            >
                                Green Fresh
                            </button>
                            <button
                                onClick={() => setWelcomeMessage(prev => ({
                                    ...prev,
                                    backgroundColor: '#1e293b',
                                    titleColor: '#f8fafc',
                                    textColor: '#cbd5e1'
                                }))}
                                className="px-3 py-1 text-xs rounded bg-slate-700 text-white hover:bg-slate-800"
                            >
                                Dark Mode
                            </button>
                            <button
                                onClick={() => setWelcomeMessage(prev => ({
                                    ...prev,
                                    backgroundColor: '#fef3c7',
                                    titleColor: '#92400e',
                                    textColor: '#78350f'
                                }))}
                                className="px-3 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200"
                            >
                                Warm Gold
                            </button>
                            <button
                                onClick={() => setWelcomeMessage(prev => ({
                                    ...prev,
                                    backgroundColor: '#fce7f3',
                                    titleColor: '#9d174d',
                                    textColor: '#831843'
                                }))}
                                className="px-3 py-1 text-xs rounded bg-pink-100 text-pink-700 hover:bg-pink-200"
                            >
                                Pink Pop
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
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

            {/* Preview Section */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Live Preview</h3>
                <div 
                    className="rounded-xl p-6 border relative overflow-hidden"
                    style={{ 
                        backgroundColor: welcomeMessage.backgroundColor,
                        fontFamily: welcomeMessage.fontFamily
                    }}
                >
                    {/* Background Image */}
                    {welcomeMessage.imageUrl && welcomeMessage.imagePosition === 'background' && (
                        <div 
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: `url(${welcomeMessage.imageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                    )}

                    <div className={`relative z-10 flex ${
                        welcomeMessage.imagePosition === 'top' ? 'flex-col' :
                        welcomeMessage.imagePosition === 'left' ? 'flex-row-reverse' :
                        'flex-row'
                    } gap-6`}>
                        {/* Content */}
                        <div className="flex-1">
                            <h2 
                                className="text-2xl font-bold mb-4 flex items-center"
                                style={{ color: welcomeMessage.titleColor }}
                            >
                                <span className="mr-3">👋</span>
                                {welcomeMessage.title || 'Welcome to Our League!'}
                            </h2>
                            {welcomeMessage.content ? (
                                <div 
                                    className="prose max-w-none"
                                    style={{ color: welcomeMessage.textColor }}
                                    dangerouslySetInnerHTML={{ __html: welcomeMessage.content.replace(/\n/g, '<br/>') }}
                                />
                            ) : (
                                <p style={{ color: welcomeMessage.textColor }} className="opacity-60 italic">
                                    No content yet. Add your welcome message above.
                                </p>
                            )}
                        </div>

                        {/* Image (if not background) */}
                        {welcomeMessage.imageUrl && welcomeMessage.imagePosition !== 'background' && (
                            <div className={`flex-shrink-0 ${
                                welcomeMessage.imagePosition === 'top' ? 'w-full max-h-48' : 'w-48'
                            }`}>
                                <img 
                                    src={welcomeMessage.imageUrl} 
                                    alt="Welcome"
                                    className={`rounded-lg shadow-lg object-cover ${
                                        welcomeMessage.imagePosition === 'top' ? 'w-full h-48' : 'w-48 h-48'
                                    }`}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeMessageManager;
