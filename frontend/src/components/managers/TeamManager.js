import React, { useState, useCallback } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';
import AdvancedColorPicker from '../AdvancedColorPicker';
import ColorExtractor from '../ColorExtractor';
import SimpleCropTool from '../SimpleCropTool';

// Icons
const Edit = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
);

const Trash2 = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="3,6 5,6 21,6"/>
        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2,-2V6m3,0V4a2,2 0 0,1,2,-2h4a2,2 0 0,1,2,2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);

const Palette = ({ size = 16, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="13.5" cy="6.5" r=".5"/>
        <circle cx="17.5" cy="10.5" r=".5"/>
        <circle cx="8.5" cy="7.5" r=".5"/>
        <circle cx="6.5" cy="12.5" r=".5"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
);

const TeamManager = ({ teams, setTeams, websiteStyle = {}, seasons = [], currentSeason }) => {
    const [editingTeam, setEditingTeam] = useState(null);
    const [showExternalTeams, setShowExternalTeams] = useState(false);
    const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'style'
    const [showCropTool, setShowCropTool] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState('');

    // Get form background color from website style or default
    const formBackgroundColor = websiteStyle?.formBackgroundColor || '#f8fafc';

    const handleInputChange = useCallback((field, value) => {
        setEditingTeam(prev => ({...prev, [field]: value}));
    }, []);

    const handleStyleChange = useCallback((field, value) => {
        console.log('🎨 Style change:', field, value);
        setEditingTeam(prev => {
            if (!prev) {
                console.error('❌ No editing team to update - creating temporary team');
                // Create temporary team if null to prevent crashes
                return {
                    id: 'temp-' + Date.now(),
                    name: 'Temporary Team',
                    style: { [field]: value }
                };
            }
            const updatedTeam = {
                ...prev, 
                style: { 
                    ...(prev.style || {}), 
                    [field]: value 
                }
            };
            console.log('✅ Team style updated:', updatedTeam.name, field, value);
            return updatedTeam;
        });
    }, []);

    const handleSave = useCallback((e) => {
        e.preventDefault();
        if (editingTeam?.id) {
            // Update existing team
            const updatedTeams = teams.map(t => t.id === editingTeam.id ? editingTeam : t);
            setTeams(updatedTeams); // This calls the protected save function
        } else {
            if (!editingTeam?.name || editingTeam.name.trim() === '') {
                alert('Please enter a team name');
                return;
            }
            
            const newTeam = {
                ...editingTeam,
                id: editingTeam.id || editingTeam.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                wins: 0, losses: 0, ties: 0, pf: 0, pa: 0,
                active: true, media: [], calendar: [],
                social: { twitter: '', instagram: '', facebook: '', youtube: '' },
                style: { 
                    bannerUrl: '', 
                    primaryColor: '#dc2626', 
                    backgroundColor: '#fef2f2',
                    logoUrl: '',
                    logoOpacity: 1,
                    ...editingTeam.style
                }
            };
            // Add new team
            const updatedTeams = [...teams, newTeam];
            setTeams(updatedTeams); // This calls the protected save function
        }
        setEditingTeam(null);
    }, [editingTeam, setTeams, teams]);

    const toggleActive = useCallback((team) => {
        const updatedTeams = teams.map(t => t.id === team.id ? {...t, active: !t.active} : t);
        setTeams(updatedTeams); // This calls the protected save function
    }, [setTeams, teams]);

    const handleDelete = useCallback((team) => {
        if (window.confirm(`Are you sure you want to delete ${team.name}? This action cannot be undone.`)) {
            const updatedTeams = teams.filter(t => t.id !== team.id);
            setTeams(updatedTeams); // This calls the protected save function
        }
    }, [setTeams, teams]);

    const handleCropComplete = useCallback((croppedImageData) => {
        console.log('✅ Team crop completed');
        // This function will be called when crop is completed
        // The actual handling is done in the TeamStyleTab component
        setShowCropTool(false);
        setCropImageUrl('');
    }, []);

    const TeamsTabContent = () => {
        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="teamType"
                                checked={!showExternalTeams}
                                onChange={() => setShowExternalTeams(false)}
                                className="rounded"
                            />
                            <span>League Teams</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="teamType"
                                checked={showExternalTeams}
                                onChange={() => setShowExternalTeams(true)}
                                className="rounded"
                            />
                            <span>External Teams</span>
                        </label>
                    </div>
                    <button 
                        onClick={() => {
                            setEditingTeam({
                                name: '', 
                                contactEmail: '', 
                                division: showExternalTeams ? 'External' : 'Field', 
                                isExternal: showExternalTeams,
                                style: {
                                    primaryColor: '#dc2626',
                                    backgroundColor: '#fef2f2',
                                    accentColor: '#7c2d12',
                                    logoUrl: '',
                                    logoOpacity: 1
                                }
                            });
                            setActiveTab('basic');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                        <LacrosseIcon name="add" style={{fontSize: '16px'}} />
                        Add Team
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams
                        .filter(team => showExternalTeams ? team.isExternal : !team.isExternal)
                        .map(team => (
                            <TeamCard 
                                key={team.id} 
                                team={team}
                                onEdit={() => {
                                    setEditingTeam(team);
                                    setActiveTab('basic');
                                }}
                                onStyle={() => {
                                    setEditingTeam(team);
                                    setActiveTab('style');
                                }}
                                onToggleActive={() => toggleActive(team)}
                                onDelete={() => handleDelete(team)}
                            />
                        ))
                    }
                    {teams.filter(team => showExternalTeams ? team.isExternal : !team.isExternal).length === 0 && (
                        <div className="col-span-full text-center py-8 text-slate-500">
                            <LacrosseIcon name="teams" className="mx-auto mb-4" style={{fontSize: '48px'}} />
                            <p>No {showExternalTeams ? 'external' : 'league'} teams yet</p>
                            <p className="text-sm">Add your first team to get started</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div>
            {editingTeam && (
                <TeamFormModal 
                    editingTeam={editingTeam}
                    handleInputChange={handleInputChange}
                    handleStyleChange={handleStyleChange}
                    handleSave={handleSave}
                    setEditingTeam={setEditingTeam}
                    formBackgroundColor={formBackgroundColor}
                    seasons={seasons}
                    currentSeason={currentSeason}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            )}
            
            <TeamsTabContent />
        </div>
    );
};

// Team Card Component
const TeamCard = ({ team, onEdit, onStyle, onToggleActive, onDelete }) => {
    const teamStyle = team.style || {};
    
    return (
        <div 
            className="bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all overflow-hidden"
            style={{ 
                borderColor: teamStyle.primaryColor || '#e2e8f0',
                backgroundColor: teamStyle.backgroundColor || '#ffffff'
            }}
        >
            {/* Team Header with Logo */}
            <div 
                className="p-4 text-white relative overflow-hidden"
                style={{ 
                    backgroundColor: teamStyle.primaryColor || '#64748b',
                    backgroundImage: teamStyle.logoUrl ? `url(${teamStyle.logoUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {teamStyle.logoUrl && (
                    <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                )}
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            {teamStyle.logoUrl ? (
                                <img 
                                    src={teamStyle.logoUrl} 
                                    alt={team.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white"
                                    style={{ opacity: teamStyle.logoOpacity || 1 }}
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                                    <LacrosseIcon name="stick" style={{fontSize: '20px'}} />
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-lg">{team.name}</h3>
                                <p className="text-sm opacity-90">{team.division || 'Field'}</p>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            team.active !== false ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                            {team.active !== false ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Team Stats */}
            <div className="p-4">
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div>
                        <div className="text-lg font-bold text-green-600">{team.wins || 0}</div>
                        <div className="text-xs text-slate-500">Wins</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-red-600">{team.losses || 0}</div>
                        <div className="text-xs text-slate-500">Losses</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-yellow-600">{team.ties || 0}</div>
                        <div className="text-xs text-slate-500">Ties</div>
                    </div>
                </div>

                {/* Team Actions */}
                <div className="flex space-x-2">
                    <button
                        onClick={onEdit}
                        className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                    >
                        <Edit size={14} />
                        Edit
                    </button>
                    <button
                        onClick={onStyle}
                        className="flex-1 bg-purple-100 text-purple-700 px-3 py-2 rounded text-sm hover:bg-purple-200 transition-colors flex items-center justify-center gap-1"
                    >
                        <Palette size={14} />
                        Style
                    </button>
                    <button
                        onClick={onToggleActive}
                        className={`px-3 py-2 rounded text-sm transition-colors ${
                            team.active !== false 
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    >
                        {team.active !== false ? '⏸️' : '▶️'}
                    </button>
                    <button
                        onClick={onDelete}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Team Form Modal Component with Tabs
const TeamFormModal = ({ 
    editingTeam, 
    handleInputChange, 
    handleStyleChange,
    handleSave, 
    setEditingTeam, 
    formBackgroundColor, 
    seasons, 
    currentSeason,
    activeTab,
    setActiveTab
}) => {
    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: 'teams' },
        { id: 'style', label: 'Team Style', icon: 'view' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div 
                className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl"
                style={{ backgroundColor: formBackgroundColor }}
            >
                {/* Modal Header */}
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-800">
                        {editingTeam?.id ? 'Edit Team' : 'Add Team'}: {editingTeam?.name || 'New Team'}
                    </h3>
                    
                    {/* Tab Navigation */}
                    <div className="flex space-x-4 mt-4 border-b">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <LacrosseIcon name={tab.icon} className="mr-2" style={{fontSize: '16px'}} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <form onSubmit={handleSave}>
                        {activeTab === 'basic' && (
                            <BasicInfoTab 
                                editingTeam={editingTeam}
                                handleInputChange={handleInputChange}
                                seasons={seasons}
                                currentSeason={currentSeason}
                            />
                        )}

                        {activeTab === 'style' && (
                            <TeamStyleTab 
                                editingTeam={editingTeam}
                                handleStyleChange={handleStyleChange}
                            />
                        )}

                        {/* Form Actions */}
                        <div className="flex space-x-3 pt-6 border-t mt-6">
                            <button 
                                type="button"
                                onClick={() => setEditingTeam(null)}
                                className="flex-1 bg-slate-500 text-white py-2 px-4 rounded hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                            >
                                Save Team
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Basic Info Tab
const BasicInfoTab = ({ editingTeam, handleInputChange, seasons, currentSeason }) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
            <input 
                type="text" 
                value={editingTeam?.name || ''} 
                onChange={e => handleInputChange('name', e.target.value)} 
                placeholder="Enter team name" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                required 
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
                <select 
                    value={editingTeam?.division || 'Field'} 
                    onChange={e => handleInputChange('division', e.target.value)} 
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                >
                    <option value="Field">Field Lacrosse</option>
                    <option value="Box">Box Lacrosse</option>
                    <option value="External">External Team</option>
                </select>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                <select 
                    value={editingTeam?.seasonId || currentSeason || ''} 
                    onChange={e => handleInputChange('seasonId', e.target.value)} 
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Current Season</option>
                    {seasons.map(season => (
                        <option key={season.id} value={season.id}>
                            {season.name} {season.id === currentSeason ? '(Current)' : ''}
                        </option>
                    ))}
                </select>
            </div>
        </div>
        
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input 
                type="email" 
                value={editingTeam?.contactEmail || ''} 
                onChange={e => handleInputChange('contactEmail', e.target.value)} 
                placeholder="team@example.com" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coach Name</label>
            <input 
                type="text" 
                value={editingTeam?.coach || ''} 
                onChange={e => handleInputChange('coach', e.target.value)} 
                placeholder="Head coach name" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Home Field</label>
            <input 
                type="text" 
                value={editingTeam?.homeField || ''} 
                onChange={e => handleInputChange('homeField', e.target.value)} 
                placeholder="Home field or venue" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
        </div>
    </div>
);

// Team Style Tab with Advanced Color Picker and Smart Color Extraction
const TeamStyleTab = ({ editingTeam, handleStyleChange }) => {
    // CRITICAL FIX: Add null check for editingTeam
    const teamStyle = (editingTeam && editingTeam.style) ? editingTeam.style : {};
    const [extractedColors, setExtractedColors] = useState([]);
    const [showCropTool, setShowCropTool] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState('');
    const [cropTargetField, setCropTargetField] = useState('');

    // Early return if no editing team
    if (!editingTeam) {
        return <div className="text-center py-8 text-slate-500">No team selected for editing</div>;
    }

    // Handle crop completion for teams
    const handleCropComplete = (croppedImageData) => {
        console.log('✅ Team crop completed for field:', cropTargetField);
        handleStyleChange(cropTargetField, croppedImageData);
        setShowCropTool(false);
        setCropImageUrl('');
    };

    // Handle colors extracted from logo
    const handleColorsExtracted = (colors) => {
        setExtractedColors(colors);
        
        // Auto-assign extracted colors to team style
        colors.forEach(colorAssignment => {
            if (colorAssignment.key === 'primaryColor') {
                handleStyleChange('primaryColor', colorAssignment.hex);
            } else if (colorAssignment.key === 'backgroundColor') {
                handleStyleChange('backgroundColor', colorAssignment.hex);
            } else if (colorAssignment.key === 'accentColor') {
                handleStyleChange('accentColor', colorAssignment.hex);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🎨 Team Branding & Style</h4>
                <p className="text-sm text-blue-700">
                    Customize your team's visual identity with colors, logos, and styling that will appear 
                    throughout the league system including team cards, event displays, and tournament brackets.
                </p>
            </div>

            {/* Logo Opacity */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Opacity: {Math.round((teamStyle.logoOpacity || 1) * 100)}%
                </label>
                <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={teamStyle.logoOpacity || 1}
                    onChange={e => handleStyleChange('logoOpacity', parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>

            {/* Manual Color Pickers */}
            <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    🎛️ Manual Color Controls
                    <span className="text-xs font-normal text-gray-500 ml-2">(Override extracted colors)</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AdvancedColorPicker
                        label="Primary Color"
                        value={teamStyle.primaryColor || '#dc2626'}
                        onChange={color => handleStyleChange('primaryColor', color)}
                        showEyedropper={true}
                        presetColors={extractedColors.map(c => c.originalHex || c.hex).filter(Boolean)}
                    />

                    <AdvancedColorPicker
                        label="Background Color"
                        value={teamStyle.backgroundColor || '#fef2f2'}
                        onChange={color => handleStyleChange('backgroundColor', color)}
                        showEyedropper={true}
                        presetColors={extractedColors.map(c => c.originalHex || c.hex).filter(Boolean)}
                    />

                    <AdvancedColorPicker
                        label="Accent Color"
                        value={teamStyle.accentColor || '#7c2d12'}
                        onChange={color => handleStyleChange('accentColor', color)}
                        showEyedropper={true}
                        presetColors={extractedColors.map(c => c.originalHex || c.hex).filter(Boolean)}
                    />
                </div>
            </div>

            {/* Team Logo with Crop Options */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Logo</label>
                <div className="space-y-3">
                    {teamStyle.logoUrl ? (
                        <div className="space-y-2">
                            <img 
                                src={teamStyle.logoUrl} 
                                alt="Team Logo preview" 
                                className="w-24 h-24 object-contain rounded-lg border-2 border-slate-300 bg-white mx-auto"
                            />
                            <div className="flex justify-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => handleStyleChange('logoUrl', '')}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Remove Logo
                                </button>
                                <span className="text-slate-400">|</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        console.log('🎯 Opening crop tool for existing team logo');
                                        setCropImageUrl(teamStyle.logoUrl);
                                        setCropTargetField('logoUrl');
                                        setShowCropTool(true);
                                    }}
                                    className="text-green-600 hover:text-green-800 text-sm"
                                >
                                    📐 Edit/Crop Logo
                                </button>
                                <span className="text-slate-400">|</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Trigger color extraction from existing logo
                                        setExtractedColors([]);
                                        console.log('🎨 Triggering color extraction from logo');
                                        // This would trigger the ColorExtractor component
                                    }}
                                    className="text-purple-600 hover:text-purple-800 text-sm"
                                >
                                    🎨 Extract Colors
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs text-slate-500 mb-3">Upload team logo (recommended square format)</p>
                            <div className="flex justify-center space-x-3">
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            console.log('📸 Team logo upload (direct):', file.name, file.size);
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                                const logoData = e.target.result;
                                                handleStyleChange('logoUrl', logoData);
                                                console.log('✅ Team logo converted to data URL');
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="hidden"
                                    id="team-logo-direct"
                                />
                                <label 
                                    htmlFor="team-logo-direct"
                                    className="bg-blue-600 text-white px-3 py-2 text-sm rounded hover:bg-blue-700 transition-colors cursor-pointer"
                                >
                                    Upload Direct
                                </label>
                                
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            console.log('📸 Team logo upload (crop):', file.name, file.size);
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                                console.log('🎯 Opening crop tool for new team logo');
                                                setCropImageUrl(e.target.result);
                                                setCropTargetField('logoUrl');
                                                setShowCropTool(true);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="hidden"
                                    id="team-logo-crop"
                                />
                                <label 
                                    htmlFor="team-logo-crop"
                                    className="bg-green-600 text-white px-3 py-2 text-sm rounded hover:bg-green-700 transition-colors cursor-pointer"
                                >
                                    📐 Crop & Upload
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Team Banner with Crop Options */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Banner</label>
                <div className="space-y-3">
                    {teamStyle.bannerUrl ? (
                        <div className="space-y-2">
                            <img 
                                src={teamStyle.bannerUrl} 
                                alt="Team Banner preview" 
                                className="w-full h-32 object-cover rounded-lg border-2 border-slate-300"
                            />
                            <div className="flex justify-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => handleStyleChange('bannerUrl', '')}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Remove Banner
                                </button>
                                <span className="text-slate-400">|</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        console.log('🎯 Opening crop tool for existing team banner');
                                        setCropImageUrl(teamStyle.bannerUrl);
                                        setCropTargetField('bannerUrl');
                                        setShowCropTool(true);
                                    }}
                                    className="text-green-600 hover:text-green-800 text-sm"
                                >
                                    📐 Edit/Crop Banner
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs text-slate-500 mb-3">Upload team banner (recommended wide format 1200x400)</p>
                            <div className="flex justify-center space-x-3">
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            console.log('📸 Team banner upload (direct):', file.name, file.size);
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                                const bannerData = e.target.result;
                                                handleStyleChange('bannerUrl', bannerData);
                                                console.log('✅ Team banner converted to data URL');
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="hidden"
                                    id="team-banner-direct"
                                />
                                <label 
                                    htmlFor="team-banner-direct"
                                    className="bg-blue-600 text-white px-3 py-2 text-sm rounded hover:bg-blue-700 transition-colors cursor-pointer"
                                >
                                    Upload Direct
                                </label>
                                
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            console.log('📸 Team banner upload (crop):', file.name, file.size);
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                                console.log('🎯 Opening crop tool for new team banner');
                                                setCropImageUrl(e.target.result);
                                                setCropTargetField('bannerUrl');
                                                setShowCropTool(true);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="hidden"
                                    id="team-banner-crop"
                                />
                                <label 
                                    htmlFor="team-banner-crop"
                                    className="bg-green-600 text-white px-3 py-2 text-sm rounded hover:bg-green-700 transition-colors cursor-pointer"
                                >
                                    📐 Crop & Upload
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Team Form Background Controls */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Form Background</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Form Background Color</label>
                        <AdvancedColorPicker
                            label="Form Background"
                            value={teamStyle.formBackgroundColor || '#ffffff'}
                            onChange={color => handleStyleChange('formBackgroundColor', color)}
                            showEyedropper={true}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Form Text Color</label>
                        <AdvancedColorPicker
                            label="Form Text"
                            value={teamStyle.formTextColor || '#374151'}
                            onChange={color => handleStyleChange('formTextColor', color)}
                            showEyedropper={true}
                        />
                    </div>
                </div>
            </div>

            {/* Enhanced Style Preview */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Style Preview</label>
                <div 
                    className="p-4 rounded-lg border-2 shadow-sm"
                    style={{ 
                        borderColor: teamStyle.primaryColor || '#e2e8f0',
                        backgroundColor: teamStyle.formBackgroundColor || teamStyle.backgroundColor || '#ffffff'
                    }}
                >
                    <div 
                        className="p-3 rounded text-white text-center font-bold relative overflow-hidden"
                        style={{ backgroundColor: teamStyle.primaryColor || '#64748b' }}
                    >
                        {teamStyle.logoUrl && (
                            <img 
                                src={teamStyle.logoUrl} 
                                alt="Logo" 
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full object-cover"
                                style={{ opacity: teamStyle.logoOpacity || 1 }}
                            />
                        )}
                        <div className="pl-12">
                            {editingTeam?.name || 'Team Name'} Preview
                        </div>
                        {teamStyle.accentColor && (
                            <div 
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full"
                                style={{ backgroundColor: teamStyle.accentColor }}
                            />
                        )}
                    </div>
                    <div className="text-center mt-2 text-sm text-slate-600">
                        This is how your team will appear in cards and displays
                    </div>
                    {extractedColors.length > 0 && (
                        <div className="mt-3 flex justify-center space-x-2">
                            <span className="text-xs text-green-600 font-medium">
                                ✨ Colors extracted from logo and auto-applied
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* SimpleCropTool for Team Logo/Banner */}
            {showCropTool && (
                <SimpleCropTool
                    imageUrl={cropImageUrl}
                    onCrop={handleCropComplete}
                    onCancel={() => {
                        setShowCropTool(false);
                        setCropImageUrl('');
                    }}
                    targetType="logo"
                />
            )}
        </div>
    );
};

export default TeamManager;