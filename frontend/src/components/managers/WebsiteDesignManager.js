import React, { useState } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';
import EnhancedColorPicker from '../EnhancedColorPicker';

const WebsiteDesignManager = ({ websiteStyle = {}, setWebsiteStyle }) => {
    const [activeSection, setActiveSection] = useState('theme');
    const [isEditing, setIsEditing] = useState(false);
    const [editingStyle, setEditingStyle] = useState(websiteStyle);

    const designSections = [
        { id: 'theme', label: 'Theme & Colors', icon: 'view' },
        { id: 'branding', label: 'Branding & Logos', icon: 'image' },
        { id: 'layout', label: 'Layout Settings', icon: 'settings' },
        { id: 'typography', label: 'Typography', icon: 'text' },
        { id: 'components', label: 'Component Styles', icon: 'customize' }
    ];

    const themes = [
        { id: 'professional', name: 'Professional', colors: { primary: '#1e40af', accent: '#3b82f6', background: '#f8fafc' } },
        { id: 'sport', name: 'Sport Dynamic', colors: { primary: '#dc2626', accent: '#ef4444', background: '#fef2f2' } },
        { id: 'modern', name: 'Modern Clean', colors: { primary: '#059669', accent: '#10b981', background: '#ecfdf5' } },
        { id: 'classic', name: 'Classic Blue', colors: { primary: '#2563eb', accent: '#3b82f6', background: '#eff6ff' } },
        { id: 'dark', name: 'Dark Mode', colors: { primary: '#6366f1', accent: '#8b5cf6', background: '#1e293b' } }
    ];

    const handleSave = () => {
        setWebsiteStyle(editingStyle);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditingStyle(websiteStyle);
        setIsEditing(false);
    };

    const handleThemeSelect = (theme) => {
        setEditingStyle({
            ...editingStyle,
            theme: theme.id,
            primaryColor: theme.colors.primary,
            accentColor: theme.colors.accent,
            backgroundColor: theme.colors.background
        });
    };

    const renderThemeSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Pre-built Themes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {themes.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeSelect(theme)}
                            className={`p-4 border-2 rounded-lg text-left transition-colors ${
                                editingStyle.theme === theme.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-slate-800">{theme.name}</h4>
                                {editingStyle.theme === theme.id && (
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.primary }}></div>
                                <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.accent }}></div>
                                <div className="w-8 h-8 rounded border" style={{ backgroundColor: theme.colors.background }}></div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Custom Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Primary Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.primaryColor || '#1e40af'}
                            onChange={(color) => setEditingStyle({...editingStyle, primaryColor: color})}
                            label="Primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.accentColor || '#3b82f6'}
                            onChange={(color) => setEditingStyle({...editingStyle, accentColor: color})}
                            label="Accent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.backgroundColor || '#f8fafc'}
                            onChange={(color) => setEditingStyle({...editingStyle, backgroundColor: color})}
                            label="Background"
                        />
                    </div>
                </div>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Preview</h3>
                <div 
                    className="border rounded-lg p-6 min-h-32"
                    style={{ 
                        backgroundColor: editingStyle.backgroundColor || '#f8fafc',
                        color: editingStyle.primaryColor || '#1e40af'
                    }}
                >
                    <h4 className="text-xl font-bold mb-2" style={{ color: editingStyle.primaryColor }}>
                        Sample Header
                    </h4>
                    <p className="text-slate-600 mb-3">This is how your website content will look with the selected colors.</p>
                    <button 
                        className="px-4 py-2 rounded-lg text-white"
                        style={{ backgroundColor: editingStyle.accentColor || '#3b82f6' }}
                    >
                        Sample Button
                    </button>
                </div>
            </div>
        </div>
    );

    const renderBrandingSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">League Branding</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">League Name</label>
                        <input
                            type="text"
                            value={editingStyle.leagueName || ''}
                            onChange={(e) => setEditingStyle({...editingStyle, leagueName: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Midwest Lacrosse League"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tagline</label>
                        <input
                            type="text"
                            value={editingStyle.tagline || ''}
                            onChange={(e) => setEditingStyle({...editingStyle, tagline: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Professional Competition"
                        />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Logo & Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">League Logo</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                            {editingStyle.logoUrl ? (
                                <div>
                                    <img src={editingStyle.logoUrl} alt="League Logo" className="w-20 h-20 mx-auto mb-3 object-contain" />
                                    <button 
                                        onClick={() => setEditingStyle({...editingStyle, logoUrl: ''})}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove Logo
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                    <p className="text-slate-600 mb-3">Upload league logo</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (e) => setEditingStyle({...editingStyle, logoUrl: e.target.result});
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <label 
                                        htmlFor="logo-upload"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                        Choose File
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Banner Image</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                            {editingStyle.bannerUrl ? (
                                <div>
                                    <img src={editingStyle.bannerUrl} alt="Banner" className="w-full h-20 mx-auto mb-3 object-cover rounded" />
                                    <button 
                                        onClick={() => setEditingStyle({...editingStyle, bannerUrl: ''})}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove Banner
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                    <p className="text-slate-600 mb-3">Upload banner image</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (e) => setEditingStyle({...editingStyle, bannerUrl: e.target.result});
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="hidden"
                                        id="banner-upload"
                                    />
                                    <label 
                                        htmlFor="banner-upload"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                        Choose File
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderLayoutSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Layout Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Header Style</label>
                        <select
                            value={editingStyle.headerStyle || 'gradient'}
                            onChange={(e) => setEditingStyle({...editingStyle, headerStyle: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="gradient">Gradient</option>
                            <option value="solid">Solid Color</option>
                            <option value="image">Background Image</option>
                            <option value="minimal">Minimal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Sidebar Position</label>
                        <select
                            value={editingStyle.sidebarPosition || 'left'}
                            onChange={(e) => setEditingStyle({...editingStyle, sidebarPosition: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                            <option value="top">Top Navigation</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Content Layout</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['boxed', 'wide', 'full-width'].map(layout => (
                        <button
                            key={layout}
                            onClick={() => setEditingStyle({...editingStyle, contentLayout: layout})}
                            className={`p-4 border-2 rounded-lg text-center transition-colors ${
                                editingStyle.contentLayout === layout
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="mb-2">
                                <div className={`mx-auto border bg-slate-100 ${
                                    layout === 'boxed' ? 'w-12 h-8' :
                                    layout === 'wide' ? 'w-16 h-8' : 'w-full h-8'
                                }`}></div>
                            </div>
                            <span className="text-sm font-medium capitalize">{layout.replace('-', ' ')}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Website Design</h2>
                <div className="space-x-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <LacrosseIcon name="edit" className="mr-2" style={{fontSize: '16px'}} />
                            Edit Design
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                {/* Section Navigation */}
                <div className="border-b">
                    <div className="flex overflow-x-auto">
                        {designSections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                    activeSection === section.id
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <LacrosseIcon name={section.icon} className="mr-2" style={{fontSize: '16px'}} />
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section Content */}
                <div className="p-6">
                    {!isEditing ? (
                        <div className="text-center py-8 text-slate-500">
                            <LacrosseIcon name="customize" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                            <p>Click "Edit Design" to customize your website appearance</p>
                        </div>
                    ) : (
                        <>
                            {activeSection === 'theme' && renderThemeSection()}
                            {activeSection === 'branding' && renderBrandingSection()}
                            {activeSection === 'layout' && renderLayoutSection()}
                            {activeSection === 'typography' && (
                                <div className="text-center py-8 text-slate-500">
                                    <LacrosseIcon name="text" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                                    <p>Typography customization coming soon...</p>
                                </div>
                            )}
                            {activeSection === 'components' && (
                                <div className="text-center py-8 text-slate-500">
                                    <LacrosseIcon name="customize" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                                    <p>Component styling options coming soon...</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WebsiteDesignManager;