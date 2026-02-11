import React, { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';

const VolunteerSignupForm = ({ onBack, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        interests: [],
        availability: '',
        experience: '',
        comments: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    const interestOptions = [
        { value: 'referee', label: 'Referee/Official', icon: '🏁' },
        { value: 'scorekeeper', label: 'Scorekeeper', icon: '📊' },
        { value: 'coach', label: 'Assistant Coach', icon: '🎓' },
        { value: 'event_help', label: 'Event Help', icon: '🎪' },
        { value: 'admin', label: 'Administrative', icon: '📋' },
        { value: 'sponsor', label: 'Sponsorship', icon: '💰' },
        { value: 'photography', label: 'Photography/Video', icon: '📸' },
        { value: 'medical', label: 'Medical/Athletic Training', icon: '🏥' },
        { value: 'other', label: 'Other', icon: '✨' }
    ];
    
    const availabilityOptions = [
        { value: 'weekdays', label: 'Weekdays Only' },
        { value: 'weekends', label: 'Weekends Only' },
        { value: 'both', label: 'Weekdays & Weekends' },
        { value: 'flexible', label: 'Flexible Schedule' }
    ];
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };
    
    const toggleInterest = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        // Validation
        if (!formData.name || !formData.email) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }
        
        if (formData.interests.length === 0) {
            setError('Please select at least one area of interest');
            setLoading(false);
            return;
        }
        
        try {
            const res = await fetch(`${backendUrl}/api/join-us/volunteer-signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.detail || 'Failed to submit signup');
            }
            
            setSuccess(true);
            if (onSuccess) onSuccess(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (success) {
        return (
            <div className="max-w-2xl mx-auto p-6" data-testid="volunteer-signup-success">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🎉</span>
                    </div>
                    <h2 className="text-2xl font-bold text-amber-800 mb-2">Thank You for Volunteering!</h2>
                    <p className="text-amber-700 mb-6">
                        We've received your signup and sent a confirmation to {formData.email}.
                    </p>
                    <p className="text-sm text-amber-600 mb-6">
                        A league administrator will be in touch soon to discuss how you can help!
                    </p>
                    <button
                        onClick={onBack}
                        className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        Back to Join Us
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-2xl mx-auto p-6" data-testid="volunteer-signup-form">
            {/* Back Button */}
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
            >
                <ChevronLeft className="w-5 h-5" />
                Back to Join Us
            </button>
            
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🙋</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Volunteer Sign Up</h1>
                <p className="text-slate-600">Join our volunteer team and help make the league great!</p>
            </div>
            
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Your Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="Your full name"
                            required
                            data-testid="volunteer-name-input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="you@example.com"
                            required
                            data-testid="volunteer-email-input"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="(555) 123-4567"
                        data-testid="volunteer-phone-input"
                    />
                </div>
                
                {/* Interests */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Areas of Interest <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-slate-500 mb-3">Select all that apply</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {interestOptions.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => toggleInterest(option.value)}
                                className={`p-3 border-2 rounded-lg text-left transition-all ${
                                    formData.interests.includes(option.value)
                                        ? 'border-amber-500 bg-amber-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                                data-testid={`interest-${option.value}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{option.icon}</span>
                                    <span className="text-sm font-medium text-slate-700">{option.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Availability */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Availability
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availabilityOptions.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, availability: option.value }))}
                                className={`p-3 border-2 rounded-lg text-center transition-all ${
                                    formData.availability === option.value
                                        ? 'border-amber-500 bg-amber-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                                data-testid={`availability-${option.value}`}
                            >
                                <span className="text-sm font-medium text-slate-700">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Experience */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Relevant Experience
                    </label>
                    <input
                        type="text"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="e.g., 5 years coaching youth lacrosse, certified referee, etc."
                        data-testid="volunteer-experience-input"
                    />
                </div>
                
                {/* Comments */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Additional Comments
                    </label>
                    <textarea
                        name="comments"
                        value={formData.comments}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Tell us anything else you'd like us to know..."
                        data-testid="volunteer-comments-input"
                    />
                </div>
                
                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    data-testid="submit-volunteer-signup"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        'Sign Up as Volunteer'
                    )}
                </button>
            </form>
        </div>
    );
};

export default VolunteerSignupForm;
