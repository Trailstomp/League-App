import React, { useState } from 'react';
import GoogleCredentialsSetup from './GoogleCredentialsSetup';
import GoogleReauthorization from './GoogleReauthorization';
import GoogleCommunicationSettings from './GoogleCommunicationSettings';

const GoogleManagement = () => {
    const [activeSection, setActiveSection] = useState('credentials');

    const sections = [
        { id: 'credentials', label: '🔑 Setup Credentials', component: GoogleCredentialsSetup },
        { id: 'authorize', label: '🔓 Re-Authorization', component: GoogleReauthorization },
        { id: 'settings', label: '⚙️ Communication Settings', component: GoogleCommunicationSettings }
    ];

    const ActiveComponent = sections.find(s => s.id === activeSection)?.component;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    📧 Google Integration Management
                </h2>
                <p className="text-gray-600">
                    Configure Google Calendar, Gmail, and Drive integration
                </p>
            </div>

            {/* Sub-navigation */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b px-6 py-3">
                    <div className="flex gap-4">
                        {sections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    activeSection === section.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Active Section Content */}
                <div className="p-6">
                    {ActiveComponent && <ActiveComponent />}
                </div>
            </div>

            {/* Quick Setup Guide */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <span className="text-2xl mr-2">📖</span>
                    Quick Setup Guide
                </h3>
                <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div>
                        <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-2">
                                1
                            </div>
                            <h4 className="font-semibold text-blue-900">Setup Credentials</h4>
                        </div>
                        <p className="text-blue-800 ml-10">
                            Get Client ID and Secret from Google Cloud Console and save them here
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-2">
                                2
                            </div>
                            <h4 className="font-semibold text-purple-900">Re-Authorization</h4>
                        </div>
                        <p className="text-purple-800 ml-10">
                            Click "Re-Authorize" to grant Google Calendar and Gmail permissions
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-2">
                                3
                            </div>
                            <h4 className="font-semibold text-green-900">Enable Services</h4>
                        </div>
                        <p className="text-green-800 ml-10">
                            Toggle on Calendar, Gmail, and/or GroupMe notifications
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleManagement;
