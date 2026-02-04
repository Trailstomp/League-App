import React, { useState } from 'react';
import ImageUploadCrop from '../ImageUploadCrop';
import { extractThemeColors } from '../../utils/colorExtractor';
import { fixGoogleDriveUrl } from '../../utils/imageUtils';
import AdvancedColorPicker from '../AdvancedColorPicker';

/**
 * TeamSettingsTab - Team settings for Social Media (including YouTube) and Appearance
 * Note: Payment Links moved to Finance tab
 */
const TeamSettingsTab = ({ team, onTeamUpdate }) => {
    const [activeSection, setActiveSection] = useState('social');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [extractingColors, setExtractingColors] = useState(false);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Social Media State (includes YouTube channel link)
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
        headerTextColor: team.style?.headerTextColor || '#ffffff',
        logoUrl: team.style?.logoUrl || '',
        bannerUrl: team.style?.bannerUrl || '',
        logoOpacity: team.style?.logoOpacity || 1,
        pageBackgroundType: team.style?.pageBackgroundType || 'color',
        pageBackgroundColor: team.style?.pageBackgroundColor || '#f8fafc',
        pageBackgroundImage: team.style?.pageBackgroundImage || ''
    });
    
    const sections = [
        { id: 'social', label: 'Social Media', icon: '📱' },
        { id: 'appearance', label: 'Appearance', icon: '🎨' }
    ];
    
    // Save social media
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
                setMessage('✅ Social media links saved!');
            } else {
                setMessage('❌ Failed to save');
            }
        } catch (error) {
            setMessage('❌ Error saving settings');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 4000);
        }
    };
    
    // Save appearance
    const handleSaveAppearance = async () => {
        console.log('🎨 Save Appearance clicked');
        console.log('Team ID:', team?.id);
        console.log('Team Style:', teamStyle);
        
        setSaving(true);
        setMessage('');
        try {
            const url = `${backendUrl}/api/league-data/teams/${team.id}`;
            console.log('🔄 Saving to:', url);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ style: teamStyle })
            });
            
            console.log('📡 Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Save successful:', data);
                setMessage('✅ Appearance settings saved!');
                // Refresh parent data
                if (onTeamUpdate) {
                    onTeamUpdate();
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Save failed:', errorData);
                setMessage(`❌ Failed to save: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error saving appearance:', error);
            setMessage('❌ Error saving settings');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 4000);
        }
    };
    
    // Handle logo upload
    const handleLogoUpload = async (url) => {
        setTeamStyle(prev => ({ ...prev, logoUrl: url }));
        // Auto-save after upload
        await saveTeamStyle({ ...teamStyle, logoUrl: url });
    };
    
    // Handle banner upload
    const handleBannerUpload = async (url) => {
        setTeamStyle(prev => ({ ...prev, bannerUrl: url }));
        // Auto-save after upload
        await saveTeamStyle({ ...teamStyle, bannerUrl: url });
    };
    
    // Helper to save team style
    const saveTeamStyle = async (styleData) => {
        try {
            const response = await fetch(`${backendUrl}/api/league-data/teams/${team.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ style: styleData })
            });
            
            if (response.ok) {
                setMessage('✅ Image saved!');
            } else {
                setMessage('⚠️ Image uploaded but failed to save to team');
            }
        } catch (error) {
            console.error('Error saving team style:', error);
            setMessage('⚠️ Image uploaded but failed to save');
        }
        setTimeout(() => setMessage(''), 3000);
    };
    
    // Extract colors from logo
    const handleUseLogoColors = async () => {
        if (!teamStyle.logoUrl) {
            setMessage('❌ Please upload a logo first');
            return;
        }
        
        setExtractingColors(true);
        setMessage('');
        
        try {
            let imageUrl = teamStyle.logoUrl;
            
            // If it's a relative URL, make it absolute
            if (imageUrl.startsWith('/api/uploads')) {
                imageUrl = `${backendUrl}${imageUrl}`;
            } else if (imageUrl.startsWith('http://localhost')) {
                imageUrl = `${backendUrl}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
            } else if (imageUrl.includes('drive.google.com') || imageUrl.includes('googleusercontent.com')) {
                const fixedUrl = fixGoogleDriveUrl(imageUrl);
                imageUrl = `${backendUrl}/api/proxy-image?url=${encodeURIComponent(fixedUrl)}`;
            }
            
            console.log('🎨 Extracting colors from:', imageUrl);
            const colors = await extractThemeColors(imageUrl);
            console.log('🎨 Extracted colors:', colors);
            
            if (colors && colors.primaryColor) {
                setTeamStyle(prev => ({
                    ...prev,
                    primaryColor: colors.primaryColor || prev.primaryColor,
                    accentColor: colors.accentColor || prev.accentColor
                }));
                setMessage('✅ Colors extracted from logo!');
            } else {
                setMessage('❌ Could not extract colors - try a different image');
            }
        } catch (error) {
            console.error('Error extracting colors:', error);
            setMessage('❌ Error extracting colors from logo');
        } finally {
            setExtractingColors(false);
            setTimeout(() => setMessage(''), 4000);
        }
    };
    
    return (
        <div className="space-y-6">
            {/* Section Navigation */}
            <div className="flex border-b border-slate-200">
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeSection === section.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-600 hover:text-slate-800'
                        }`}
                    >
                        <span className="mr-1.5">{section.icon}</span>
                        {section.label}
                    </button>
                ))}
            </div>
            
            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}
            
            {/* Social Media Section (includes YouTube) */}
            {activeSection === 'social' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">📱</span>
                            <div>
                                <p className="text-sm text-blue-800 font-medium">Social Media & YouTube</p>
                                <p className="text-xs text-blue-700 mt-1">Connect your team&apos;s social accounts. These will be displayed on your team page.</p>
                            </div>
                        </div>
                    </div>
                    
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
                                placeholder="facebook.com/yourpage"
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">📺 YouTube Channel</label>
                            <input
                                type="text"
                                value={socialMedia.youtube}
                                onChange={(e) => setSocialMedia({...socialMedia, youtube: e.target.value})}
                                placeholder="youtube.com/@yourchannel or channel URL"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Enter your YouTube channel URL to display your videos on the team page</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                            <input
                                type="url"
                                value={socialMedia.website}
                                onChange={(e) => setSocialMedia({...socialMedia, website: e.target.value})}
                                placeholder="https://yourteam.com"
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
                    {/* Logo & Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Team Logo</label>
                            <ImageUploadCrop
                                currentImage={teamStyle.logoUrl}
                                onImageSelected={handleLogoUpload}
                                aspectRatio={1}
                                uploadType="logo"
                            />
                            {teamStyle.logoUrl && (
                                <button
                                    onClick={handleUseLogoColors}
                                    disabled={extractingColors}
                                    className="mt-3 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium disabled:opacity-50"
                                >
                                    {extractingColors ? 'Extracting...' : '🎨 Extract Colors from Logo'}
                                </button>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Team Banner</label>
                            <ImageUploadCrop
                                currentImage={teamStyle.bannerUrl}
                                onImageSelected={handleBannerUpload}
                                aspectRatio={3}
                                uploadType="banner"
                            />
                        </div>
                    </div>
                    
                    {/* Colors */}
                    <div className="border-t pt-6">
                        <h3 className="font-medium text-slate-800 mb-4">Team Colors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AdvancedColorPicker
                                label="Primary Color"
                                color={teamStyle.primaryColor}
                                onChange={(color) => setTeamStyle({...teamStyle, primaryColor: color})}
                            />
                            
                            <AdvancedColorPicker
                                label="Accent Color"
                                color={teamStyle.accentColor}
                                onChange={(color) => setTeamStyle({...teamStyle, accentColor: color})}
                            />
                            
                            <AdvancedColorPicker
                                label="Background Color"
                                color={teamStyle.backgroundColor}
                                onChange={(color) => setTeamStyle({...teamStyle, backgroundColor: color})}
                            />
                            
                            <AdvancedColorPicker
                                label="Text Color"
                                color={teamStyle.textColor}
                                onChange={(color) => setTeamStyle({...teamStyle, textColor: color})}
                            />
                            
                            <AdvancedColorPicker
                                label="Header Text Color"
                                color={teamStyle.headerTextColor}
                                onChange={(color) => setTeamStyle({...teamStyle, headerTextColor: color})}
                            />
                        </div>
                    </div>
                    
                    {/* Color Preview */}
                    <div className="border-t pt-6">
                        <h3 className="font-medium text-slate-800 mb-4">Preview</h3>
                        <div 
                            className="rounded-xl overflow-hidden border shadow-sm"
                            style={{ backgroundColor: teamStyle.backgroundColor }}
                        >
                            <div 
                                className="p-4"
                                style={{ backgroundColor: teamStyle.primaryColor }}
                            >
                                <h4 className="text-lg font-bold" style={{ color: teamStyle.headerTextColor }}>
                                    {team.name || 'Team Name'}
                                </h4>
                            </div>
                            <div className="p-4">
                                <p style={{ color: teamStyle.textColor }}>
                                    This is sample body text showing how your content will look.
                                </p>
                                <button 
                                    className="mt-3 px-4 py-2 rounded-lg font-medium"
                                    style={{ backgroundColor: teamStyle.accentColor, color: teamStyle.headerTextColor }}
                                >
                                    Sample Button
                                </button>
                            </div>
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
