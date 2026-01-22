import React, { useState } from 'react';
import { SPORTS, SPORT_CONFIG, getAvailableSports } from '../config/sportsConfig';

/**
 * SetupWizard - First-time setup wizard for new league admins
 * Guides through: Sport Selection → League Info → Admin Account → First Team (optional)
 */
const SetupWizard = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Wizard data
    const [wizardData, setWizardData] = useState({
        // Step 1: Sport
        sportType: 'lacrosse',
        
        // Step 2: League Info
        leagueName: '',
        leagueTagline: '',
        primaryColor: '#2563eb',
        accentColor: '#3b82f6',
        
        // Step 3: Admin Account
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        adminPasswordConfirm: '',
        
        // Step 4: First Team (optional)
        createFirstTeam: false,
        teamName: '',
        teamDivision: 'Division 1'
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const availableSports = getAvailableSports();
    const totalSteps = 4;

    const updateData = (updates) => {
        setWizardData(prev => ({ ...prev, ...updates }));
        setError('');
    };

    const validateStep = () => {
        switch (currentStep) {
            case 1:
                return !!wizardData.sportType;
            case 2:
                return wizardData.leagueName.trim().length >= 3;
            case 3:
                if (!wizardData.adminName.trim()) return false;
                if (!wizardData.adminEmail.includes('@')) return false;
                if (wizardData.adminPassword.length < 6) return false;
                if (wizardData.adminPassword !== wizardData.adminPasswordConfirm) {
                    setError('Passwords do not match');
                    return false;
                }
                return true;
            case 4:
                if (wizardData.createFirstTeam && !wizardData.teamName.trim()) return false;
                return true;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep()) {
            if (currentStep < totalSteps) {
                setCurrentStep(currentStep + 1);
            } else {
                handleComplete();
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        setError('');

        try {
            // 1. Create admin user
            const adminResponse = await fetch(`${backendUrl}/api/setup/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: wizardData.adminName,
                    email: wizardData.adminEmail,
                    password: wizardData.adminPassword
                })
            });

            if (!adminResponse.ok) {
                const err = await adminResponse.json();
                throw new Error(err.detail || 'Failed to create admin account');
            }

            // 2. Save league settings
            const settingsResponse = await fetch(`${backendUrl}/api/setup/league`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leagueName: wizardData.leagueName,
                    leagueTagline: wizardData.leagueTagline,
                    sportType: wizardData.sportType,
                    primaryColor: wizardData.primaryColor,
                    accentColor: wizardData.accentColor
                })
            });

            if (!settingsResponse.ok) {
                throw new Error('Failed to save league settings');
            }

            // 3. Create first team if requested
            if (wizardData.createFirstTeam && wizardData.teamName.trim()) {
                await fetch(`${backendUrl}/api/teams`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: wizardData.teamName,
                        division: wizardData.teamDivision
                    })
                });
            }

            // 4. Mark setup as complete
            await fetch(`${backendUrl}/api/setup/complete`, {
                method: 'POST'
            });

            // Notify parent component
            onComplete(wizardData);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Sport Selection
    const renderSportStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">What sport is your league?</h2>
                <p className="text-gray-600">This determines icons, positions, and scoring throughout the app</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {availableSports.map(sport => {
                    const config = SPORT_CONFIG[sport.id];
                    return (
                        <button
                            key={sport.id}
                            onClick={() => updateData({ sportType: sport.id })}
                            className={`p-6 rounded-xl border-2 transition-all text-left ${
                                wizardData.sportType === sport.id
                                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <div className="text-4xl mb-3">{sport.icon}</div>
                            <div className="font-bold text-lg mb-1">{sport.name}</div>
                            <div className="text-sm text-gray-500">
                                {config.periods} {config.periodName}s • {config.positions.length} positions
                            </div>
                            {wizardData.sportType === sport.id && (
                                <div className="mt-2 text-blue-600 text-sm font-medium">✓ Selected</div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // Step 2: League Info
    const renderLeagueStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Tell us about your league</h2>
                <p className="text-gray-600">This will appear on your homepage and navigation</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        League Name *
                    </label>
                    <input
                        type="text"
                        value={wizardData.leagueName}
                        onChange={(e) => updateData({ leagueName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Metro Lacrosse League"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tagline (optional)
                    </label>
                    <input
                        type="text"
                        value={wizardData.leagueTagline}
                        onChange={(e) => updateData({ leagueTagline: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Where champions are made"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Primary Color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={wizardData.primaryColor}
                                onChange={(e) => updateData({ primaryColor: e.target.value })}
                                className="w-12 h-12 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={wizardData.primaryColor}
                                onChange={(e) => updateData({ primaryColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Accent Color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={wizardData.accentColor}
                                onChange={(e) => updateData({ accentColor: e.target.value })}
                                className="w-12 h-12 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={wizardData.accentColor}
                                onChange={(e) => updateData({ accentColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 rounded-lg border-2" style={{ borderColor: wizardData.primaryColor }}>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{SPORT_CONFIG[wizardData.sportType]?.icon}</span>
                        <div>
                            <div className="font-bold" style={{ color: wizardData.primaryColor }}>
                                {wizardData.leagueName || 'Your League Name'}
                            </div>
                            <div className="text-sm text-gray-500">
                                {wizardData.leagueTagline || 'Your tagline here'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Step 3: Admin Account
    const renderAdminStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Create your admin account</h2>
                <p className="text-gray-600">You'll use this to manage your league</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                    </label>
                    <input
                        type="text"
                        value={wizardData.adminName}
                        onChange={(e) => updateData({ adminName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Smith"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                    </label>
                    <input
                        type="email"
                        value={wizardData.adminEmail}
                        onChange={(e) => updateData({ adminEmail: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="admin@yourleague.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password * (min 6 characters)
                    </label>
                    <input
                        type="password"
                        value={wizardData.adminPassword}
                        onChange={(e) => updateData({ adminPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="••••••••"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                    </label>
                    <input
                        type="password"
                        value={wizardData.adminPasswordConfirm}
                        onChange={(e) => updateData({ adminPasswordConfirm: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="••••••••"
                    />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-blue-600 text-xl">ℹ️</span>
                        <div className="text-sm text-blue-800">
                            <strong>Admin privileges include:</strong>
                            <ul className="mt-1 list-disc list-inside">
                                <li>Create and manage teams</li>
                                <li>Add players and assign roles</li>
                                <li>Schedule events and manage RSVPs</li>
                                <li>Track finances and fees</li>
                                <li>Customize league appearance</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Step 4: First Team (Optional)
    const renderTeamStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Create your first team?</h2>
                <p className="text-gray-600">You can always add more teams later</p>
            </div>

            <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                        type="checkbox"
                        checked={wizardData.createFirstTeam}
                        onChange={(e) => updateData({ createFirstTeam: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                    />
                    <div>
                        <div className="font-medium">Yes, create a team now</div>
                        <div className="text-sm text-gray-500">Get started right away with your first team</div>
                    </div>
                </label>

                {wizardData.createFirstTeam && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Team Name *
                            </label>
                            <input
                                type="text"
                                value={wizardData.teamName}
                                onChange={(e) => updateData({ teamName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Thunder"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Division
                            </label>
                            <select
                                value={wizardData.teamDivision}
                                onChange={(e) => updateData({ teamDivision: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option>Division 1</option>
                                <option>Division 2</option>
                                <option>Premier Division</option>
                                <option>Youth Division</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-bold text-green-800 mb-3">🎉 Ready to launch!</h3>
                <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Sport:</strong> {SPORT_CONFIG[wizardData.sportType]?.icon} {SPORT_CONFIG[wizardData.sportType]?.name}</p>
                    <p><strong>League:</strong> {wizardData.leagueName}</p>
                    <p><strong>Admin:</strong> {wizardData.adminEmail}</p>
                    {wizardData.createFirstTeam && (
                        <p><strong>First Team:</strong> {wizardData.teamName}</p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderStep = () => {
        switch (currentStep) {
            case 1: return renderSportStep();
            case 2: return renderLeagueStep();
            case 3: return renderAdminStep();
            case 4: return renderTeamStep();
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6">
                    <h1 className="text-2xl font-bold mb-1">Welcome to SportsDash! 🏆</h1>
                    <p className="text-blue-100">Let's set up your league in just a few steps</p>
                </div>

                {/* Progress */}
                <div className="px-8 py-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    step < currentStep ? 'bg-green-500 text-white' :
                                    step === currentStep ? 'bg-blue-600 text-white' :
                                    'bg-gray-200 text-gray-500'
                                }`}>
                                    {step < currentStep ? '✓' : step}
                                </div>
                                {step < 4 && (
                                    <div className={`w-16 h-1 mx-2 ${
                                        step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Sport</span>
                        <span>League</span>
                        <span>Admin</span>
                        <span>Team</span>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-6 min-h-[400px]">
                    {renderStep()}
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            ❌ {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-gray-50 border-t flex justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Back
                    </button>
                    
                    <button
                        onClick={handleNext}
                        disabled={loading || !validateStep()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span> Setting up...
                            </span>
                        ) : currentStep === totalSteps ? (
                            '🚀 Launch League'
                        ) : (
                            'Next →'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
