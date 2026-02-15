import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'mlbl_user_prefs';

const getLocalPrefs = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
};

const saveLocalPrefs = (prefs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};

const MiniTemplatePreview = ({ style = {}, active }) => {
    const s = style;
    const navBg = s.navBackgroundColor || '#ffffff';
    const bannerBg = s.bannerBackgroundColor || '#1e40af';
    const mainBg = s.mainBackgroundColor || '#f8fafc';
    const contentBg = s.contentBackgroundColor || '#ffffff';
    const primary = s.primaryColor || '#1e40af';

    return (
        <div
            className={`rounded overflow-hidden border-2 transition-all ${active ? 'border-blue-500 shadow-md scale-105' : 'border-slate-200 hover:border-slate-400'}`}
            style={{ width: 72, height: 48, fontSize: 4 }}
        >
            <div style={{ background: navBg, height: 6, display: 'flex', alignItems: 'center', padding: '0 2px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: primary }} />
            </div>
            <div style={{ background: bannerBg, height: 10 }} />
            <div style={{ background: mainBg, display: 'flex', flex: 1, height: 32 }}>
                <div style={{ width: '25%', background: navBg, borderRight: '1px solid rgba(0,0,0,0.06)' }} />
                <div style={{ flex: 1, padding: 2 }}>
                    <div style={{ background: contentBg, borderRadius: 1, height: '100%' }} />
                </div>
            </div>
        </div>
    );
};

const UserPreferences = ({ websiteStyle, onStyleChange, currentUser, currentPage, onNavigate, templates: propTemplates }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [templates, setTemplates] = useState(propTemplates || []);
    const [activeTab, setActiveTab] = useState('theme');
    const [prefs, setPrefs] = useState(getLocalPrefs);
    const panelRef = useRef(null);
    const buttonRef = useRef(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Load templates
    useEffect(() => {
        if (propTemplates?.length) {
            setTemplates(propTemplates);
            return;
        }
        const fetchTemplates = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/design-templates/public`);
                if (res.ok) {
                    const data = await res.json();
                    setTemplates(data.templates || []);
                }
            } catch (e) {
                console.log('Could not load templates:', e.message);
            }
        };
        fetchTemplates();
    }, [backendUrl, propTemplates]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (isOpen && panelRef.current && !panelRef.current.contains(e.target) && !buttonRef.current?.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    // Apply persisted theme on mount
    useEffect(() => {
        const saved = getLocalPrefs();
        if (saved.pinnedTemplateId && templates.length > 0 && !saved.useRotating) {
            const tmpl = templates.find(t => t.id === saved.pinnedTemplateId);
            if (tmpl?.style && onStyleChange) {
                onStyleChange(prev => ({ ...prev, ...tmpl.style }));
            }
        }
        if (saved.defaultPage && onNavigate) {
            // Only navigate on initial page load
            if (currentPage === 'home' && saved.defaultPage !== 'home') {
                onNavigate(saved.defaultPage);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templates.length]);

    const updatePrefs = (updates) => {
        const newPrefs = { ...prefs, ...updates };
        setPrefs(newPrefs);
        saveLocalPrefs(newPrefs);

        // Save to server for logged-in users
        if (currentUser?.id) {
            fetch(`${backendUrl}/api/users/${currentUser.id}/template-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pinnedTemplateId: newPrefs.useRotating ? null : newPrefs.pinnedTemplateId,
                    defaultPage: newPrefs.defaultPage,
                    useRotating: newPrefs.useRotating
                })
            }).catch(() => {});
        }
    };

    const selectTemplate = (template) => {
        updatePrefs({ pinnedTemplateId: template.id, useRotating: false });
        if (onStyleChange && template.style) {
            onStyleChange(prev => ({ ...prev, ...template.style }));
        }
    };

    const enableRotating = () => {
        updatePrefs({ pinnedTemplateId: null, useRotating: true });
    };

    const setDefaultPage = (page) => {
        updatePrefs({ defaultPage: page });
    };

    const cycleNext = () => {
        if (!templates.length) return;
        const currentIdx = templates.findIndex(t => t.id === prefs.pinnedTemplateId);
        const nextIdx = (currentIdx + 1) % templates.length;
        selectTemplate(templates[nextIdx]);
    };

    const pages = [
        { id: 'home', label: 'Home', icon: '🏠' },
        { id: 'events', label: 'Events & Schedule', icon: '📅' },
        { id: 'standings', label: 'Standings', icon: '🏆' },
        { id: 'help', label: 'Help & Docs', icon: '📚' },
    ];

    const primaryColor = websiteStyle?.primaryColor || '#3b82f6';

    return (
        <>
            {/* Floating Action Button */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                data-testid="preferences-fab"
                className="fixed z-[9999] rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
                style={{
                    bottom: '24px',
                    right: '24px',
                    width: '52px',
                    height: '52px',
                    background: `linear-gradient(135deg, ${primaryColor}, ${websiteStyle?.accentColor || '#6366f1'})`,
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: `0 4px 20px ${primaryColor}44`
                }}
                title="Site Preferences"
            >
                {isOpen ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                )}
            </button>

            {/* Preferences Panel */}
            {isOpen && (
                <div
                    ref={panelRef}
                    data-testid="preferences-panel"
                    className="fixed z-[9998] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
                    style={{
                        bottom: '88px',
                        right: '24px',
                        width: '320px',
                        maxHeight: '480px',
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                    }}
                >
                    {/* Header */}
                    <div className="px-4 py-3 border-b" style={{ background: `linear-gradient(135deg, ${primaryColor}11, ${primaryColor}05)` }}>
                        <h3 className="font-bold text-sm" style={{ color: '#1e293b' }}>Site Preferences</h3>
                        <p className="text-xs" style={{ color: '#64748b' }}>Customize your viewing experience</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b" style={{ background: '#f8fafc' }}>
                        {[
                            { id: 'theme', label: 'Themes' },
                            { id: 'page', label: 'Default Page' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                data-testid={`prefs-tab-${tab.id}`}
                                className="flex-1 py-2 text-xs font-medium transition-all"
                                style={{
                                    color: activeTab === tab.id ? primaryColor : '#64748b',
                                    borderBottom: activeTab === tab.id ? `2px solid ${primaryColor}` : '2px solid transparent',
                                    background: 'transparent'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
                        {activeTab === 'theme' && (
                            <div className="p-3">
                                {/* Rotation toggle */}
                                <div className="mb-3 p-2.5 rounded-lg border" style={{ background: '#f8fafc', borderColor: prefs.useRotating ? primaryColor : '#e2e8f0' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-semibold" style={{ color: '#1e293b' }}>Auto-Rotate Themes</div>
                                            <div className="text-xs" style={{ color: '#64748b' }}>A new look every visit</div>
                                        </div>
                                        <button
                                            onClick={() => prefs.useRotating ? updatePrefs({ useRotating: false }) : enableRotating()}
                                            data-testid="toggle-rotating"
                                            className="relative w-10 h-5 rounded-full transition-colors"
                                            style={{ background: prefs.useRotating ? primaryColor : '#cbd5e1' }}
                                        >
                                            <div
                                                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                                                style={{ left: prefs.useRotating ? '22px' : '2px' }}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {!prefs.useRotating && (
                                    <>
                                        {/* Cycle button */}
                                        {templates.length > 1 && (
                                            <button
                                                onClick={cycleNext}
                                                data-testid="cycle-theme-btn"
                                                className="w-full mb-3 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all hover:shadow-sm"
                                                style={{
                                                    background: `${primaryColor}10`,
                                                    color: primaryColor,
                                                    border: `1px solid ${primaryColor}30`
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M23 4v6h-6M1 20v-6h6"/>
                                                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                                                </svg>
                                                Next Theme
                                            </button>
                                        )}

                                        {/* Template grid */}
                                        <div className="text-xs font-semibold mb-2" style={{ color: '#475569' }}>
                                            Choose a Theme {templates.length > 0 && `(${templates.length})`}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {templates.map(tmpl => (
                                                <button
                                                    key={tmpl.id}
                                                    onClick={() => selectTemplate(tmpl)}
                                                    data-testid={`template-${tmpl.id}`}
                                                    className="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all hover:bg-slate-50"
                                                    style={{
                                                        background: prefs.pinnedTemplateId === tmpl.id ? `${primaryColor}08` : 'transparent',
                                                        border: prefs.pinnedTemplateId === tmpl.id ? `1.5px solid ${primaryColor}` : '1.5px solid transparent'
                                                    }}
                                                >
                                                    <MiniTemplatePreview style={tmpl.style || {}} active={prefs.pinnedTemplateId === tmpl.id} />
                                                    <span className="text-xs truncate w-full text-center" style={{ color: '#374151' }}>
                                                        {tmpl.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        {templates.length === 0 && (
                                            <div className="text-center py-6 text-xs" style={{ color: '#94a3b8' }}>
                                                No themes available yet
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'page' && (
                            <div className="p-3">
                                <div className="text-xs font-semibold mb-2" style={{ color: '#475569' }}>
                                    Default Landing Page
                                </div>
                                <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                                    Which page should load first when you visit the site?
                                </p>
                                <div className="space-y-1.5">
                                    {pages.map(page => (
                                        <button
                                            key={page.id}
                                            onClick={() => setDefaultPage(page.id)}
                                            data-testid={`default-page-${page.id}`}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-xs"
                                            style={{
                                                background: (prefs.defaultPage || 'home') === page.id ? `${primaryColor}10` : 'transparent',
                                                color: (prefs.defaultPage || 'home') === page.id ? primaryColor : '#374151',
                                                border: (prefs.defaultPage || 'home') === page.id ? `1.5px solid ${primaryColor}40` : '1.5px solid #e2e8f0',
                                                fontWeight: (prefs.defaultPage || 'home') === page.id ? 600 : 400
                                            }}
                                        >
                                            <span>{page.icon}</span>
                                            <span>{page.label}</span>
                                            {(prefs.defaultPage || 'home') === page.id && (
                                                <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill={primaryColor} stroke={primaryColor} strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default UserPreferences;
