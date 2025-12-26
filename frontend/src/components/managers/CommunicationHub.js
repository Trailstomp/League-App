import React, { useState } from 'react';
import SMTPEmailSettings from './SMTPEmailSettings';
import GoogleManagement from './GoogleManagement';

const CommunicationHub = () => {
    const [activeTab, setActiveTab] = useState('smtp');

    const tabs = [
        { id: 'smtp', label: '📧 Email (SMTP)', description: 'Free email notifications' },
        { id: 'google', label: '🔵 Google (Calendar/Gmail)', description: 'Advanced Google integration' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    📬 Communication Settings
                </h2>
                <p className="text-gray-600">
                    Configure how event notifications are sent to your league members
                </p>
            </div>

            {/* Tab Selector */}
            <div className="bg-white rounded-lg shadow-sm border p-2">
                <div className="grid grid-cols-2 gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`p-4 rounded-lg text-left transition ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <div className="font-semibold mb-1">{tab.label}</div>
                            <div className={`text-xs ${
                                activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                                {tab.description}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recommendation Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                    <span className="text-2xl mr-3">⭐</span>
                    <div>
                        <h4 className="font-semibold text-green-900 mb-1">Recommended: SMTP Email</h4>
                        <p className="text-sm text-green-800">
                            For multi-league apps, SMTP is the best choice: $0 cost, each league uses their own email, 
                            simple setup, and includes calendar attachments. No quotas or API limits!
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                {activeTab === 'smtp' && <SMTPEmailSettings />}
                {activeTab === 'google' && <GoogleManagement />}
            </div>
        </div>
    );
};

export default CommunicationHub;
