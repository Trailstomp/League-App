import React, { useState } from 'react';
import YouTubeSettings from '../managers/YouTubeSettings';
import ImageUploadCrop from '../ImageUploadCrop';
import { extractThemeColors } from '../../utils/colorExtractor';
import { fixGoogleDriveUrl } from '../../utils/imageUtils';

/**
 * TeamSettingsTab - Team admin settings for YouTube, Social Media, and Appearance
 */
const TeamSettingsTab = ({ team, onTeamUpdate }) => {
    const [activeSection, setActiveSection] = useState('youtube');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [extractingColors, setExtractingColors] = useState(false);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Social Media State
    const [socialMedia, setSocialMedia] = useState({
        instagram: team.socialMedia?.instagram || '',
        twitter: team.socialMedia?.twitter || '',
        facebook: team.socialMedia?.facebook || '',
        tiktok: team.socialMedia?.tiktok || '',
        youtube: team.socialMedia?.youtube || '',
        website: team.socialMedia?.website || ''
    });
    
    // Appearance/Style State
    const [teamStyle, setTeamStyle] = useState({
        primaryColor: team.style?.primaryColor || '#2563eb',
        accentColor: team.style?.accentColor || '#3b82f6',
        backgroundColor: team.style?.backgroundColor || '#f8fafc',
        textColor: team.style?.textColor || '#1e293b',
        logoUrl: team.style?.logoUrl || '',
        bannerUrl: team.style?.bannerUrl || '',
        logoOpacity: team.style?.logoOpacity || 1,
        pageBackgroundType: team.style?.pageBackgroundType || 'color',
        pageBackgroundColor: team.style?.pageBackgroundColor || '#f8fafc',
        pageBackgroundImage: team.style?.pageBackgroundImage || ''
    });
    
    const sections = [
        { id: 'youtube', label: 'YouTube Channel', icon: '📺' },
        { id: 'social', label: 'Social Media', icon: '📱' },
        { id: 'appearance', label: 'Appearance', icon: '🎨' }
    ];
    
    // Save social media settings
    const handleSaveSocialMedia = async () => {
        setSaving(true);
        setMessage('');
        try {
            const response = await fetch(`${backendUrl}/api/league-data/teams/${team.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ socialMedia })
            });
            
            if (response.ok) {
                setMessage('✅ Social media settings saved!');
                if (onTeamUpdate) onTeamUpdate();
            } else {
                setMessage('❌ Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving social media:', error);
            setMessage('❌ Error saving settings');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };
    
    // Save appearance settings
    const handleSaveAppearance = async () => {
        setSaving(true);
        setMessage('');
        try {
            const response = await fetch(`${backendUrl}/api/league-data/teams/${team.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ style: teamStyle })
            });
            
            if (response.ok) {
                setMessage('✅ Appearance settings saved!');
                if (onTeamUpdate) onTeamUpdate();
            } else {
                setMessage('❌ Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving appearance:', error);
            setMessage('❌ Error saving settings');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };
    
    // Extract colors from logo and apply to theme
    const handleUseLogoColors = async () => {
        if (!teamStyle.logoUrl) {
            setMessage('❌ Please upload a logo first');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        
        setExtractingColors(true);
        setMessage('');
        
        try {
            // Use the proxy endpoint for CORS-safe image loading
            const proxyUrl = `${backendUrl}/api/proxy-image?url=${encodeURIComponent(fixGoogleDriveUrl(teamStyle.logoUrl))}`;
            const colors = await extractThemeColors(proxyUrl);
            
            if (colors) {
                setTeamStyle(prev => ({
                    ...prev,
                    primaryColor: colors.primaryColor,
                    accentColor: colors.accentColor,
                    backgroundColor: colors.backgroundColor,
                    textColor: colors.textColor
                }));
                setMessage('✅ Colors extracted from logo! Click "Save Appearance" to apply.');
            } else {
                setMessage('❌ Could not extract colors from logo');
            }
        } catch (error) {
            console.error('Error extracting colors:', error);
            setMessage('❌ Error extracting colors from logo');
        } finally {
            setExtractingColors(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };
    
    // Handle logo upload
    const handleLogoUpload = (url) => {
        setTeamStyle(prev => ({ ...prev, logoUrl: url }));
    };
    
    // Handle banner upload
    const handleBannerUpload = (url) => {
        setTeamStyle(prev => ({ ...prev, bannerUrl: url }));
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Team Settings</h2>
            
            {/* Section Tabs */}
            <div className="flex flex-wrap gap-2 border-b pb-2">
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                            activeSection === section.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {section.icon} {section.label}
                    </button>
                ))}
            </div>
            
            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}
            
            {/* YouTube Settings Section */}
            {activeSection === 'youtube' && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">ℹ️</span>
                            <div>
                                <p className="text-sm text-blue-800 font-medium">Team YouTube Settings</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    Configure a YouTube channel specific to this team. Videos from both the team channel 
                                    and the league channel will be shown on your team page.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <YouTubeSettings teamId={team.id} onSave={() => setMessage('✅ YouTube settings saved!')} />
                    </div>
                </div>
            )}
            
            {/* Social Media Section */}
            {activeSection === 'social' && (
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Connect your team's social media accounts to display on your team page.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
                            <div className="flex">
                                <span className="bg-slate-100 px-3 py-2 border border-r-0 border-slate-300 rounded-l-lg text-slate-500">@</span>
                                <input
                                    type="text"
                                    value={socialMedia.instagram}
                                    onChange={(e) => setSocialMedia({...socialMedia, instagram: e.target.value})}
                                    placeholder="username"
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Twitter / X</label>
                            <div className="flex">
                                <span className="bg-slate-100 px-3 py-2 border border-r-0 border-slate-300 rounded-l-lg text-slate-500">@</span>
                                <input
                                    type="text"
                                    value={socialMedia.twitter}
                                    onChange={(e) => setSocialMedia({...socialMedia, twitter: e.target.value})}
                                    placeholder="username"
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Facebook</label>
                            <input
                                type="text"
                                value={socialMedia.facebook}
                                onChange={(e) => setSocialMedia({...socialMedia, facebook: e.target.value})}
                                placeholder="facebook.com/..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">TikTok</label>
                            <div className="flex">
                                <span className="bg-slate-100 px-3 py-2 border border-r-0 border-slate-300 rounded-l-lg text-slate-500">@</span>
                                <input
                                    type="text"
                                    value={socialMedia.tiktok}
                                    onChange={(e) => setSocialMedia({...socialMedia, tiktok: e.target.value})}
                                    placeholder="username"
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">YouTube Channel</label>
                            <input
                                type="text"
                                value={socialMedia.youtube}
                                onChange={(e) => setSocialMedia({...socialMedia, youtube: e.target.value})}
                                placeholder="youtube.com/..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                            <input
                                type="url"
                                value={socialMedia.website}
                                onChange={(e) => setSocialMedia({...socialMedia, website: e.target.value})}
                                placeholder="https://..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    
                    <button
                        onClick={handleSaveSocialMedia}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Social Media'}
                    </button>
                </div>
            )}
            
            {/* Appearance Section */}
            {activeSection === 'appearance' && (
                <div className="space-y-6">
                    <p className="text-sm text-slate-600">Customize your team's colors and branding.</p>
                    
                    {/* Team Colors */}
                    <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-slate-800">🎨 Team Colors</h4>
                            {teamStyle.logoUrl && (
                                <button
                                    onClick={handleUseLogoColors}
                                    disabled={extractingColors}
                                    className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    {extractingColors ? '⏳ Extracting...' : '🎨 Use Logo Colors'}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={teamStyle.primaryColor}
                                        onChange={(e) => setTeamStyle({...teamStyle, primaryColor: e.target.value})}
                                        className="w-12 h-10 rounded border-2 border-slate-300 cursor-pointer p-0.5"
                                        style={{ WebkitAppearance: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        value={teamStyle.primaryColor}
                                        onChange={(e) => setTeamStyle({...teamStyle, primaryColor: e.target.value})}
                                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                                        placeholder="#2563eb"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Accent Color</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={teamStyle.accentColor}
                                        onChange={(e) => setTeamStyle({...teamStyle, accentColor: e.target.value})}
                                        className="w-12 h-10 rounded border-2 border-slate-300 cursor-pointer p-0.5"
                                        style={{ WebkitAppearance: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        value={teamStyle.accentColor}
                                        onChange={(e) => setTeamStyle({...teamStyle, accentColor: e.target.value})}
                                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                                        placeholder="#3b82f6"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Background</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={teamStyle.backgroundColor}
                                        onChange={(e) => setTeamStyle({...teamStyle, backgroundColor: e.target.value})}
                                        className="w-12 h-10 rounded border-2 border-slate-300 cursor-pointer p-0.5"
                                        style={{ WebkitAppearance: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        value={teamStyle.backgroundColor}
                                        onChange={(e) => setTeamStyle({...teamStyle, backgroundColor: e.target.value})}
                                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                                        placeholder="#f8fafc"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Text Color</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={teamStyle.textColor}
                                        onChange={(e) => setTeamStyle({...teamStyle, textColor: e.target.value})}
                                        className="w-12 h-10 rounded border-2 border-slate-300 cursor-pointer p-0.5"
                                        style={{ WebkitAppearance: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        value={teamStyle.textColor}
                                        onChange={(e) => setTeamStyle({...teamStyle, textColor: e.target.value})}
                                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                                        placeholder="#1e293b"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Logo & Banner Section */}
                    <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-slate-800 mb-4">🖼️ Logo & Banner</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Team Logo</label>
                                <ImageUploadCrop
                                    currentImage={teamStyle.logoUrl ? fixGoogleDriveUrl(teamStyle.logoUrl) : ''}
                                    onImageSelected={handleLogoUpload}
                                    aspectRatio={1}
                                    label="Upload Logo"
                                    uploadType="team_logo"
                                    maxSize={5}
                                    circularCrop={false}
                                />
                                <p className="text-xs text-slate-500 mt-2">Square format recommended. Click to upload and crop.</p>
                                
                                {/* Alternative: URL input */}
                                <div className="mt-3">
                                    <label className="text-xs text-slate-500">Or paste URL:</label>
                                    <input
                                        type="url"
                                        value={teamStyle.logoUrl}
                                        onChange={(e) => setTeamStyle({...teamStyle, logoUrl: e.target.value})}
                                        placeholder="https://... or Google Drive link"
                                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm mt-1"
                                    />
                                </div>
                            </div>
                            
                            {/* Banner Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Team Banner</label>
                                <ImageUploadCrop
                                    currentImage={teamStyle.bannerUrl ? fixGoogleDriveUrl(teamStyle.bannerUrl) : ''}
                                    onImageSelected={handleBannerUpload}
                                    aspectRatio={16/9}
                                    label="Upload Banner"
                                    uploadType="team_banner"
                                    maxSize={10}
                                    circularCrop={false}
                                />
                                <p className="text-xs text-slate-500 mt-2">Wide format (16:9) recommended. Click to upload and crop.</p>
                                
                                {/* Alternative: URL input */}
                                <div className="mt-3">
                                    <label className="text-xs text-slate-500">Or paste URL:</label>
                                    <input
                                        type="url"
                                        value={teamStyle.bannerUrl}
                                        onChange={(e) => setTeamStyle({...teamStyle, bannerUrl: e.target.value})}
                                        placeholder="https://... or Google Drive link"
                                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm mt-1"
                                    />
                                </div>
                            </div>
                            
                            {/* Logo Opacity */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Logo Opacity: {(teamStyle.logoOpacity * 100).toFixed(0)}%</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={teamStyle.logoOpacity}
                                    onChange={(e) => setTeamStyle({...teamStyle, logoOpacity: parseFloat(e.target.value)})}
                                    className="w-full max-w-xs"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Color Preview */}
                    <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-slate-800 mb-4">👁️ Preview</h4>
                        <div 
                            className="rounded-lg p-4 border"
                            style={{ 
                                backgroundColor: teamStyle.backgroundColor,
                                color: teamStyle.textColor
                            }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                {teamStyle.logoUrl && (
                                    <img 
                                        src={fixGoogleDriveUrl(teamStyle.logoUrl)} 
                                        alt="Logo preview" 
                                        className="w-12 h-12 object-contain rounded"
                                        style={{ opacity: teamStyle.logoOpacity }}
                                        onError={(e) => e.target.style.display='none'}
                                    />
                                )}
                                <div>
                                    <h3 className="font-bold text-lg" style={{ color: teamStyle.primaryColor }}>{team.name}</h3>
                                    <p className="text-sm" style={{ color: teamStyle.accentColor }}>{team.division || 'Division'}</p>
                                </div>
                            </div>
                            <p className="text-sm">This is how your team's colors will appear on the team page.</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleSaveAppearance}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Appearance'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TeamSettingsTab;
