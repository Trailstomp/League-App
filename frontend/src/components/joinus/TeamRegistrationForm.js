import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Upload, Loader2, X, Image } from 'lucide-react';

const TeamRegistrationForm = ({ onBack, onSuccess }) => {
    const [formData, setFormData] = useState({
        team_name: '',
        primary_contact_name: '',
        primary_contact_email: '',
        primary_contact_phone: '',
        lacrosse_type: '',
        preferred_division: '',
        logo_url: '',
        home_field_location: '',
        estimated_roster_size: '',
        comments: ''
    });
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Load divisions
    useEffect(() => {
        const fetchDivisions = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/divisions`);
                if (res.ok) {
                    const data = await res.json();
                    setDivisions(data.divisions || []);
                }
            } catch (e) {
                console.error('Error loading divisions:', e);
            }
        };
        fetchDivisions();
    }, [backendUrl]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };
    
    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (PNG, JPG, etc.)');
            return;
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setError('Logo file must be less than 5MB');
            return;
        }
        
        setUploadingLogo(true);
        setError('');
        
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('type', 'team_registration_logo');
            
            const res = await fetch(`${backendUrl}/api/upload/image`, {
                method: 'POST',
                body: uploadFormData
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.detail || 'Failed to upload logo');
            }
            
            // Set the logo URL from the response
            setFormData(prev => ({ ...prev, logo_url: data.url }));
        } catch (err) {
            setError(err.message || 'Failed to upload logo');
        } finally {
            setUploadingLogo(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    const removeLogo = () => {
        setFormData(prev => ({ ...prev, logo_url: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        // Validation
        if (!formData.team_name || !formData.primary_contact_name || !formData.primary_contact_email || !formData.lacrosse_type) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }
        
        try {
            const res = await fetch(`${backendUrl}/api/join-us/team-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    estimated_roster_size: formData.estimated_roster_size ? parseInt(formData.estimated_roster_size) : null
                })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.detail || 'Failed to submit registration');
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
            <div className="max-w-2xl mx-auto p-6" data-testid="team-registration-success">
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🎉</span>
                    </div>
                    <h2 className="text-2xl font-bold text-green-800 mb-2">Registration Submitted!</h2>
                    <p className="text-green-700 mb-6">
                        Thank you for registering {formData.team_name}! We've sent a confirmation email to {formData.primary_contact_email}.
                    </p>
                    <p className="text-sm text-green-600 mb-6">
                        A league administrator will review your registration and get back to you soon.
                    </p>
                    <button
                        onClick={onBack}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Back to Join Us
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-2xl mx-auto p-6" data-testid="team-registration-form">
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
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🏆</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Register Your Team</h1>
                <p className="text-slate-600">Fill out the form below to register your team with the league</p>
            </div>
            
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Team Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Team Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="team_name"
                        value={formData.team_name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., Thunder Hawks"
                        required
                        data-testid="team-name-input"
                    />
                </div>
                
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Contact Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="primary_contact_name"
                            value={formData.primary_contact_name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Your name"
                            required
                            data-testid="contact-name-input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="primary_contact_email"
                            value={formData.primary_contact_email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="you@example.com"
                            required
                            data-testid="contact-email-input"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        name="primary_contact_phone"
                        value={formData.primary_contact_phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="(555) 123-4567"
                        data-testid="contact-phone-input"
                    />
                </div>
                
                {/* Lacrosse Type */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Type of Lacrosse <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: 'field', label: 'Field', icon: '🏟️' },
                            { value: 'box', label: 'Box', icon: '🏒' },
                            { value: 'both', label: 'Both', icon: '🎯' }
                        ].map(option => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, lacrosse_type: option.value }))}
                                className={`p-4 border-2 rounded-lg text-center transition-all ${
                                    formData.lacrosse_type === option.value
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                                data-testid={`lacrosse-type-${option.value}`}
                            >
                                <div className="text-2xl mb-1">{option.icon}</div>
                                <div className="font-medium text-slate-700">{option.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Division and Roster Size */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Preferred Division
                        </label>
                        <select
                            name="preferred_division"
                            value={formData.preferred_division}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            data-testid="division-select"
                        >
                            <option value="">Select a division...</option>
                            {divisions.map(div => (
                                <option key={div.id} value={div.name}>{div.name}</option>
                            ))}
                            <option value="Not Sure">Not Sure</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Estimated Roster Size
                        </label>
                        <input
                            type="number"
                            name="estimated_roster_size"
                            value={formData.estimated_roster_size}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., 18"
                            min="1"
                            max="50"
                            data-testid="roster-size-input"
                        />
                    </div>
                </div>
                
                {/* Logo URL */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Team Logo URL (Optional)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            name="logo_url"
                            value={formData.logo_url}
                            onChange={handleChange}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="https://example.com/logo.png"
                            data-testid="logo-url-input"
                        />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Paste a link to your team's logo image</p>
                    {formData.logo_url && (
                        <div className="mt-2">
                            <img 
                                src={formData.logo_url} 
                                alt="Logo preview" 
                                className="w-20 h-20 object-contain border rounded-lg"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        </div>
                    )}
                </div>
                
                {/* Home Field */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Home Field Location
                    </label>
                    <input
                        type="text"
                        name="home_field_location"
                        value={formData.home_field_location}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., Memorial Park, Chicago, IL"
                        data-testid="home-field-input"
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
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Tell us anything else about your team..."
                        data-testid="comments-input"
                    />
                </div>
                
                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    data-testid="submit-team-registration"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        'Submit Registration'
                    )}
                </button>
            </form>
        </div>
    );
};

export default TeamRegistrationForm;
