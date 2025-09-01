#!/usr/bin/env python3
"""
Enhanced Website Style Manager Backend Testing Suite
Tests backend API functionality for the enhanced websiteStyle system with advanced color picker and theme system.
"""

import requests
import json
import sys
from datetime import datetime
import time

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

class WebsiteStyleBackendTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Enhanced Website Style Manager Backend at: {self.api_base}")
        print("=" * 80)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            print(f"    Response: {response_data}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response': response_data
        })
        
        if not success:
            self.failed_tests.append(test_name)
        print()

    def test_enhanced_websitestyle_data_persistence(self):
        """Test enhanced websiteStyle data structure persistence with advanced features"""
        try:
            # Create comprehensive websiteStyle data with all enhanced features
            enhanced_websitestyle = {
                # Banner customization
                "bannerType": "color",
                "bannerColor": "#1e40af",
                "bannerImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
                "bannerText": "Major League Box Lacrosse",
                "bannerOpacity": 0.8,
                
                # Logo management with advanced settings
                "logoUrl": "https://example.com/main-logo.png",
                "sidebarLogoUrl": "https://example.com/sidebar-logo.png", 
                "bannerLogoUrl": "https://example.com/banner-logo.png",
                "overlayLogoUrl": "https://example.com/overlay-logo.png",
                "logoDisplayStyle": "fit",
                
                # Advanced color system
                "primaryColor": "#3b82f6",
                "secondaryColor": "#ef4444",
                "accentColor": "#10b981",
                "textColor": "#1f2937",
                "backgroundColor": "#f9fafb",
                
                # Theme system
                "currentTheme": "professional_blue",
                "customThemes": {
                    "professional_blue": {
                        "name": "Professional Blue",
                        "primary": "#1e40af",
                        "secondary": "#3b82f6", 
                        "accent": "#60a5fa",
                        "background": "#f8fafc",
                        "text": "#1e293b"
                    },
                    "sports_red": {
                        "name": "Sports Red",
                        "primary": "#dc2626",
                        "secondary": "#ef4444",
                        "accent": "#f87171", 
                        "background": "#fef2f2",
                        "text": "#7f1d1d"
                    }
                },
                
                # Background system
                "backgroundImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
                "backgroundOpacity": 0.3,
                "backgroundMode": "cover",
                
                # Sidebar customization
                "sidebarBackgroundImage": "https://example.com/sidebar-bg.jpg",
                "sidebarOpacity": 0.7,
                
                # Form styling
                "formBackgroundColor": "#ffffff",
                "formBorderColor": "#d1d5db",
                "formTextColor": "#374151",
                
                # Advanced features
                "eyedropperSupported": True,
                "colorExtractionEnabled": True,
                "themeAutoGeneration": True,
                
                # Test metadata
                "testId": f"websitestyle_test_{int(time.time())}",
                "lastModified": datetime.utcnow().isoformat()
            }
            
            # Test saving enhanced websiteStyle via POST /api/league-data/websiteStyle
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle",
                json=enhanced_websitestyle,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                save_data = response.json()
                if save_data.get('message') == 'websiteStyle updated successfully':
                    self.log_test(
                        "Enhanced WebsiteStyle Data Persistence - Save",
                        True,
                        f"Successfully saved enhanced websiteStyle with {len(enhanced_websitestyle)} properties",
                        {"message": save_data.get('message'), "properties_count": len(enhanced_websitestyle)}
                    )
                    return True, enhanced_websitestyle
                else:
                    self.log_test(
                        "Enhanced WebsiteStyle Data Persistence - Save",
                        False,
                        f"Unexpected save response: {save_data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Enhanced WebsiteStyle Data Persistence - Save",
                    False,
                    f"Save failed - HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Enhanced WebsiteStyle Data Persistence - Save",
                False,
                f"Connection error during save: {str(e)}"
            )
            return False, None

    def test_websitestyle_api_endpoints(self):
        """Test GET /api/league-data and websiteStyle data retrieval"""
        try:
            # Test GET /api/league-data endpoint
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify websiteStyle is included in response
                if 'websiteStyle' in data:
                    websitestyle = data['websiteStyle']
                    
                    # Check for enhanced websiteStyle structure
                    enhanced_fields = [
                        'bannerType', 'bannerColor', 'bannerText', 'logoUrl', 
                        'primaryColor', 'secondaryColor', 'currentTheme',
                        'backgroundImage', 'backgroundOpacity'
                    ]
                    
                    present_fields = [field for field in enhanced_fields if field in websitestyle]
                    
                    if len(present_fields) >= 5:  # At least 5 enhanced fields should be present
                        self.log_test(
                            "WebsiteStyle API Endpoints - GET /api/league-data",
                            True,
                            f"websiteStyle included in response with {len(present_fields)}/{len(enhanced_fields)} enhanced fields",
                            {"present_fields": present_fields, "websiteStyle_keys": len(websitestyle)}
                        )
                        return True, websitestyle
                    else:
                        self.log_test(
                            "WebsiteStyle API Endpoints - GET /api/league-data",
                            False,
                            f"websiteStyle missing enhanced fields. Found: {present_fields}"
                        )
                        return False, None
                else:
                    self.log_test(
                        "WebsiteStyle API Endpoints - GET /api/league-data",
                        False,
                        "websiteStyle field missing from league data response"
                    )
                    return False, None
            else:
                self.log_test(
                    "WebsiteStyle API Endpoints - GET /api/league-data",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "WebsiteStyle API Endpoints - GET /api/league-data",
                False,
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_color_data_storage_integrity(self):
        """Test color values in various formats are stored and retrieved without corruption"""
        try:
            # Test various color formats
            color_test_data = {
                "hexColors": {
                    "primary": "#3b82f6",
                    "secondary": "#ef4444", 
                    "accent": "#10b981"
                },
                "rgbaColors": {
                    "background": "rgba(59, 130, 246, 0.1)",
                    "overlay": "rgba(239, 68, 68, 0.8)",
                    "text": "rgba(31, 41, 55, 1.0)"
                },
                "hslColors": {
                    "highlight": "hsl(217, 91%, 60%)",
                    "muted": "hsl(0, 84%, 60%)"
                },
                "namedColors": {
                    "error": "red",
                    "success": "green",
                    "warning": "orange"
                },
                "testId": f"color_integrity_test_{int(time.time())}"
            }
            
            # Save color data
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle",
                json=color_test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Retrieve and verify color data
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    retrieved_data = get_response.json()
                    retrieved_websitestyle = retrieved_data.get('websiteStyle', {})
                    
                    # Verify all color formats are preserved
                    color_categories = ['hexColors', 'rgbaColors', 'hslColors', 'namedColors']
                    preserved_categories = []
                    
                    for category in color_categories:
                        if category in retrieved_websitestyle:
                            original_colors = color_test_data[category]
                            retrieved_colors = retrieved_websitestyle[category]
                            
                            # Check if colors match exactly
                            if original_colors == retrieved_colors:
                                preserved_categories.append(category)
                    
                    if len(preserved_categories) == len(color_categories):
                        self.log_test(
                            "Color Data Storage Integrity",
                            True,
                            f"All {len(color_categories)} color format categories preserved without corruption",
                            {"preserved_categories": preserved_categories}
                        )
                        return True
                    else:
                        missing = [cat for cat in color_categories if cat not in preserved_categories]
                        self.log_test(
                            "Color Data Storage Integrity",
                            False,
                            f"Color corruption detected. Missing/corrupted categories: {missing}"
                        )
                        return False
                else:
                    self.log_test(
                        "Color Data Storage Integrity",
                        False,
                        f"Failed to retrieve data for verification - HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Color Data Storage Integrity",
                    False,
                    f"Failed to save color data - HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Color Data Storage Integrity",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_theme_data_handling(self):
        """Test theme configurations with multiple color properties persist correctly"""
        try:
            # Create complex theme data
            theme_test_data = {
                "currentTheme": "custom_lacrosse_theme",
                "customThemes": {
                    "custom_lacrosse_theme": {
                        "name": "Custom Lacrosse Theme",
                        "primary": "#1e40af",
                        "secondary": "#3b82f6",
                        "accent": "#60a5fa",
                        "background": "#f8fafc",
                        "text": "#1e293b",
                        "success": "#10b981",
                        "warning": "#f59e0b",
                        "error": "#ef4444",
                        "muted": "#6b7280"
                    },
                    "team_colors_theme": {
                        "name": "Team Colors Theme", 
                        "primary": "#dc2626",
                        "secondary": "#ef4444",
                        "accent": "#f87171",
                        "background": "#fef2f2",
                        "text": "#7f1d1d",
                        "gradient": "linear-gradient(135deg, #dc2626, #ef4444)"
                    }
                },
                "themeSettings": {
                    "autoApply": True,
                    "extractFromLogo": True,
                    "fallbackTheme": "professional_blue"
                },
                "testId": f"theme_test_{int(time.time())}"
            }
            
            # Save theme data
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle",
                json=theme_test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Retrieve and verify theme data
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    retrieved_data = get_response.json()
                    retrieved_websitestyle = retrieved_data.get('websiteStyle', {})
                    
                    # Verify theme structure
                    theme_checks = []
                    
                    # Check current theme
                    if retrieved_websitestyle.get('currentTheme') == theme_test_data['currentTheme']:
                        theme_checks.append('currentTheme')
                    
                    # Check custom themes
                    if 'customThemes' in retrieved_websitestyle:
                        custom_themes = retrieved_websitestyle['customThemes']
                        
                        # Verify both themes exist with all properties
                        for theme_name, theme_data in theme_test_data['customThemes'].items():
                            if theme_name in custom_themes:
                                retrieved_theme = custom_themes[theme_name]
                                
                                # Check all color properties
                                if all(key in retrieved_theme and retrieved_theme[key] == theme_data[key] 
                                      for key in theme_data.keys()):
                                    theme_checks.append(f'theme_{theme_name}')
                    
                    # Check theme settings
                    if 'themeSettings' in retrieved_websitestyle:
                        settings = retrieved_websitestyle['themeSettings']
                        original_settings = theme_test_data['themeSettings']
                        
                        if all(key in settings and settings[key] == original_settings[key] 
                              for key in original_settings.keys()):
                            theme_checks.append('themeSettings')
                    
                    if len(theme_checks) >= 4:  # currentTheme + 2 custom themes + themeSettings
                        self.log_test(
                            "Theme Data Handling",
                            True,
                            f"Theme configurations persist correctly. Verified: {theme_checks}",
                            {"verified_components": theme_checks, "theme_count": len(theme_test_data['customThemes'])}
                        )
                        return True
                    else:
                        self.log_test(
                            "Theme Data Handling",
                            False,
                            f"Theme data incomplete. Only verified: {theme_checks}"
                        )
                        return False
                else:
                    self.log_test(
                        "Theme Data Handling",
                        False,
                        f"Failed to retrieve theme data - HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Theme Data Handling",
                    False,
                    f"Failed to save theme data - HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Theme Data Handling",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_logo_url_storage(self):
        """Test that logo URLs (main, sidebar, banner, overlay) are properly handled"""
        try:
            # Test various logo URL formats
            logo_test_data = {
                "logoUrl": "https://example.com/main-logo.png",
                "sidebarLogoUrl": "https://cdn.example.com/sidebar-logo.svg",
                "bannerLogoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "overlayLogoUrl": "/assets/overlay-logo.jpg",
                "logoSettings": {
                    "displayStyle": "fit",
                    "maxWidth": "200px",
                    "maxHeight": "100px",
                    "opacity": 1.0
                },
                "logoMetadata": {
                    "mainLogoSize": "1024x512",
                    "sidebarLogoSize": "64x64", 
                    "bannerLogoSize": "300x150",
                    "overlayLogoSize": "128x128"
                },
                "testId": f"logo_test_{int(time.time())}"
            }
            
            # Save logo data
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle",
                json=logo_test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Retrieve and verify logo data
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    retrieved_data = get_response.json()
                    retrieved_websitestyle = retrieved_data.get('websiteStyle', {})
                    
                    # Verify all logo URLs are preserved
                    logo_fields = ['logoUrl', 'sidebarLogoUrl', 'bannerLogoUrl', 'overlayLogoUrl']
                    preserved_logos = []
                    
                    for logo_field in logo_fields:
                        if (logo_field in retrieved_websitestyle and 
                            retrieved_websitestyle[logo_field] == logo_test_data[logo_field]):
                            preserved_logos.append(logo_field)
                    
                    # Verify logo settings and metadata
                    settings_preserved = ('logoSettings' in retrieved_websitestyle and 
                                        retrieved_websitestyle['logoSettings'] == logo_test_data['logoSettings'])
                    
                    metadata_preserved = ('logoMetadata' in retrieved_websitestyle and
                                        retrieved_websitestyle['logoMetadata'] == logo_test_data['logoMetadata'])
                    
                    if len(preserved_logos) == len(logo_fields) and settings_preserved and metadata_preserved:
                        self.log_test(
                            "Logo URL Storage",
                            True,
                            f"All {len(logo_fields)} logo URLs and settings preserved correctly",
                            {"preserved_logos": preserved_logos, "settings_ok": settings_preserved, "metadata_ok": metadata_preserved}
                        )
                        return True
                    else:
                        missing_logos = [field for field in logo_fields if field not in preserved_logos]
                        self.log_test(
                            "Logo URL Storage",
                            False,
                            f"Logo data incomplete. Missing: {missing_logos}, Settings: {settings_preserved}, Metadata: {metadata_preserved}"
                        )
                        return False
                else:
                    self.log_test(
                        "Logo URL Storage",
                        False,
                        f"Failed to retrieve logo data - HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Logo URL Storage",
                    False,
                    f"Failed to save logo data - HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Logo URL Storage",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_background_image_data(self):
        """Test background images and their associated settings (opacity, mode) save correctly"""
        try:
            # Test background image data with various settings
            background_test_data = {
                "backgroundImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
                "backgroundOpacity": 0.75,
                "backgroundMode": "cover",
                "backgroundPosition": "center center",
                "backgroundRepeat": "no-repeat",
                "sidebarBackgroundImage": "https://example.com/sidebar-background.jpg",
                "sidebarOpacity": 0.6,
                "sidebarBackgroundMode": "contain",
                "bannerBackgroundImage": "https://cdn.example.com/banner-bg.png",
                "bannerBackgroundOpacity": 0.9,
                "backgroundSettings": {
                    "enableParallax": True,
                    "blurEffect": False,
                    "overlayColor": "rgba(0, 0, 0, 0.2)",
                    "animationDuration": "3s"
                },
                "testId": f"background_test_{int(time.time())}"
            }
            
            # Save background data
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle",
                json=background_test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Retrieve and verify background data
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    retrieved_data = get_response.json()
                    retrieved_websitestyle = retrieved_data.get('websiteStyle', {})
                    
                    # Verify background image fields
                    background_fields = [
                        'backgroundImage', 'backgroundOpacity', 'backgroundMode', 'backgroundPosition',
                        'sidebarBackgroundImage', 'sidebarOpacity', 'bannerBackgroundImage', 'bannerBackgroundOpacity'
                    ]
                    
                    preserved_fields = []
                    for field in background_fields:
                        if (field in retrieved_websitestyle and 
                            retrieved_websitestyle[field] == background_test_data[field]):
                            preserved_fields.append(field)
                    
                    # Verify background settings
                    settings_preserved = ('backgroundSettings' in retrieved_websitestyle and
                                        retrieved_websitestyle['backgroundSettings'] == background_test_data['backgroundSettings'])
                    
                    # Check opacity values are preserved as numbers
                    opacity_fields = ['backgroundOpacity', 'sidebarOpacity', 'bannerBackgroundOpacity']
                    opacity_preserved = all(
                        field in retrieved_websitestyle and 
                        isinstance(retrieved_websitestyle[field], (int, float)) and
                        retrieved_websitestyle[field] == background_test_data[field]
                        for field in opacity_fields if field in background_test_data
                    )
                    
                    if (len(preserved_fields) >= 6 and settings_preserved and opacity_preserved):
                        self.log_test(
                            "Background Image Data",
                            True,
                            f"Background images and settings preserved correctly. {len(preserved_fields)}/{len(background_fields)} fields preserved",
                            {"preserved_fields": preserved_fields, "settings_ok": settings_preserved, "opacity_ok": opacity_preserved}
                        )
                        return True
                    else:
                        missing_fields = [field for field in background_fields if field not in preserved_fields]
                        self.log_test(
                            "Background Image Data",
                            False,
                            f"Background data incomplete. Missing: {missing_fields}, Settings: {settings_preserved}, Opacity: {opacity_preserved}"
                        )
                        return False
                else:
                    self.log_test(
                        "Background Image Data",
                        False,
                        f"Failed to retrieve background data - HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Background Image Data",
                    False,
                    f"Failed to save background data - HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Background Image Data",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_database_integrity_expanded_schema(self):
        """Test that expanded websiteStyle schema doesn't break existing data persistence"""
        try:
            # First, get current league data to preserve existing data
            get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if get_response.status_code == 200:
                current_data = get_response.json()
                
                # Create expanded websiteStyle that includes both old and new fields
                expanded_websitestyle = {
                    # Legacy fields (should be preserved)
                    "theme": "default",
                    "primaryColor": "#3b82f6",
                    "secondaryColor": "#ef4444",
                    
                    # Enhanced fields (new functionality)
                    "bannerType": "image",
                    "bannerColor": "#1e40af",
                    "bannerText": "Enhanced League Management",
                    "currentTheme": "professional_blue",
                    "customThemes": {
                        "test_theme": {
                            "name": "Test Theme",
                            "primary": "#059669",
                            "secondary": "#10b981"
                        }
                    },
                    "logoDisplayStyle": "fit",
                    "backgroundOpacity": 0.8,
                    "eyedropperSupported": True,
                    
                    # Integration test fields
                    "integrationTestId": f"schema_test_{int(time.time())}",
                    "schemaVersion": "2.0"
                }
                
                # Update websiteStyle while preserving other league data
                current_data['websiteStyle'] = expanded_websitestyle
                
                # Save the complete league data with expanded websiteStyle
                save_response = requests.post(
                    f"{self.api_base}/league-data",
                    json=current_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if save_response.status_code == 200:
                    # Retrieve and verify data integrity
                    verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    
                    if verify_response.status_code == 200:
                        verified_data = verify_response.json()
                        
                        # Check that all league data sections are preserved
                        required_sections = ['teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
                        preserved_sections = [section for section in required_sections if section in verified_data]
                        
                        # Check websiteStyle has both legacy and new fields
                        websitestyle = verified_data.get('websiteStyle', {})
                        legacy_fields = ['theme', 'primaryColor', 'secondaryColor']
                        enhanced_fields = ['bannerType', 'currentTheme', 'customThemes', 'eyedropperSupported']
                        
                        legacy_preserved = all(field in websitestyle for field in legacy_fields)
                        enhanced_preserved = all(field in websitestyle for field in enhanced_fields)
                        
                        if (len(preserved_sections) == len(required_sections) and 
                            legacy_preserved and enhanced_preserved):
                            self.log_test(
                                "Database Integrity - Expanded Schema",
                                True,
                                f"Expanded websiteStyle schema preserves data integrity. All {len(required_sections)} sections preserved",
                                {"preserved_sections": preserved_sections, "legacy_ok": legacy_preserved, "enhanced_ok": enhanced_preserved}
                            )
                            return True
                        else:
                            missing_sections = [s for s in required_sections if s not in preserved_sections]
                            self.log_test(
                                "Database Integrity - Expanded Schema",
                                False,
                                f"Data integrity compromised. Missing sections: {missing_sections}, Legacy: {legacy_preserved}, Enhanced: {enhanced_preserved}"
                            )
                            return False
                    else:
                        self.log_test(
                            "Database Integrity - Expanded Schema",
                            False,
                            f"Failed to verify data integrity - HTTP {verify_response.status_code}"
                        )
                        return False
                else:
                    self.log_test(
                        "Database Integrity - Expanded Schema",
                        False,
                        f"Failed to save expanded schema - HTTP {save_response.status_code}: {save_response.text}"
                    )
                    return False
            else:
                self.log_test(
                    "Database Integrity - Expanded Schema",
                    False,
                    f"Failed to get current league data - HTTP {get_response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Database Integrity - Expanded Schema",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all enhanced websiteStyle backend tests"""
        print("Starting Enhanced Website Style Manager Backend Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 80)
        
        # Test enhanced websiteStyle functionality
        self.test_enhanced_websitestyle_data_persistence()
        self.test_websitestyle_api_endpoints()
        self.test_color_data_storage_integrity()
        self.test_theme_data_handling()
        self.test_logo_url_storage()
        self.test_background_image_data()
        self.test_database_integrity_expanded_schema()
        
        # Summary
        print("=" * 80)
        print("ENHANCED WEBSITE STYLE MANAGER TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if failed_tests > 0:
            print(f"\nFailed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        return failed_tests == 0

if __name__ == "__main__":
    try:
        tester = WebsiteStyleBackendTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Enhanced Website Style Manager backend tests completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some enhanced websiteStyle tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)