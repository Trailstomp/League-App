#!/usr/bin/env python3
"""
Form Background and Crop Tool Backend Support Testing Suite
Tests backend support for new form background controls and enhanced crop tool functionality.

CRITICAL TESTS:
1. Form Background Fields: Test that websiteStyle can save formBackgroundColor, formBackgroundImage, formBackgroundType
2. Team Form Fields: Test that team style can save team-level form background fields
3. Enhanced Image Fields: Verify all new background image fields save correctly
4. Crop Tool Data: Test that cropped images in various formats save properly
"""

import requests
import json
import sys
from datetime import datetime
import time
import base64

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

class FormBackgroundTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Form Background Backend Support at: {self.api_base}")
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

    def generate_test_image_data(self, format_type="png"):
        """Generate test image data in base64 format"""
        # Simple 1x1 pixel image data for different formats
        test_images = {
            "png": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==",
            "jpg": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A",
            "webp": "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"
        }
        return f"data:image/{format_type};base64,{test_images.get(format_type, test_images['png'])}"

    def test_health_check(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "Backend Health Check", 
                        True, 
                        f"Backend server running and responsive", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Backend Health Check", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Backend Health Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Backend Health Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_form_background_websitestyle_fields(self):
        """Test that websiteStyle can save form background fields"""
        try:
            # Test comprehensive form background fields
            test_websitestyle = {
                "id": "main_league",
                "teams": [],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {},
                "websiteStyle": {
                    # Existing fields
                    "primaryColor": "#1e40af",
                    "backgroundColor": "#f8fafc",
                    "navBackgroundColor": "#ffffff",
                    "bannerBackgroundColor": "#1e40af",
                    
                    # NEW FORM BACKGROUND FIELDS - CRITICAL TEST
                    "formBackgroundColor": "#f3f4f6",
                    "formBackgroundImage": self.generate_test_image_data("png"),
                    "formBackgroundType": "color",  # or "image"
                    "formBorderColor": "#d1d5db",
                    "formTextColor": "#374151",
                    "formInputBackgroundColor": "#ffffff",
                    "formInputBorderColor": "#d1d5db",
                    "formButtonBackgroundColor": "#1e40af",
                    "formButtonTextColor": "#ffffff",
                    "formButtonHoverColor": "#1d4ed8",
                    
                    # Enhanced form styling fields
                    "formBorderRadius": "8px",
                    "formShadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    "formPadding": "24px",
                    "formMaxWidth": "500px",
                    "formOpacity": 0.95,
                    
                    # Test timestamp
                    "lastUpdated": datetime.utcnow().isoformat()
                }
            }
            
            # Save websiteStyle with form background fields
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=test_websitestyle,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                # Verify the data was saved by retrieving it
                time.sleep(1)
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    saved_data = get_response.json()
                    saved_style = saved_data.get('websiteStyle', {})
                    
                    # Check all form background fields
                    form_fields = [
                        'formBackgroundColor', 'formBackgroundImage', 'formBackgroundType',
                        'formBorderColor', 'formTextColor', 'formInputBackgroundColor',
                        'formInputBorderColor', 'formButtonBackgroundColor', 'formButtonTextColor',
                        'formButtonHoverColor', 'formBorderRadius', 'formShadow', 'formPadding',
                        'formMaxWidth', 'formOpacity'
                    ]
                    
                    missing_fields = []
                    corrupted_fields = []
                    
                    for field in form_fields:
                        if field not in saved_style:
                            missing_fields.append(field)
                        elif saved_style[field] != test_websitestyle['websiteStyle'][field]:
                            corrupted_fields.append(f"{field}: expected {test_websitestyle['websiteStyle'][field]}, got {saved_style[field]}")
                    
                    if not missing_fields and not corrupted_fields:
                        self.log_test(
                            "WebsiteStyle Form Background Fields", 
                            True, 
                            f"All {len(form_fields)} form background fields saved and retrieved correctly", 
                            f"Fields: {', '.join(form_fields[:5])}..."
                        )
                        return True
                    else:
                        error_msg = ""
                        if missing_fields:
                            error_msg += f"Missing fields: {missing_fields}. "
                        if corrupted_fields:
                            error_msg += f"Corrupted fields: {corrupted_fields[:3]}..."
                        
                        self.log_test(
                            "WebsiteStyle Form Background Fields", 
                            False, 
                            error_msg
                        )
                        return False
                else:
                    self.log_test(
                        "WebsiteStyle Form Background Fields", 
                        False, 
                        f"Could not retrieve saved data: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "WebsiteStyle Form Background Fields", 
                    False, 
                    f"Save failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "WebsiteStyle Form Background Fields", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False
        except Exception as e:
            self.log_test(
                "WebsiteStyle Form Background Fields", 
                False, 
                f"Unexpected error: {str(e)}"
            )
            return False

    def test_team_form_background_fields(self):
        """Test that team style can save team-level form background fields"""
        try:
            # Create test team with enhanced form background styling
            test_team = {
                "id": "form_bg_test_team",
                "name": "Form Background Test Team",
                "division": "Field",
                "coach": "Test Coach",
                "homeField": "Test Field",
                "logo": self.generate_test_image_data("png"),
                "contactEmail": "test@example.com",
                "active": True,
                "wins": 5,
                "losses": 3,
                "ties": 1,
                "style": {
                    # Existing team style fields
                    "primaryColor": "#dc2626",
                    "backgroundColor": "#fef2f2",
                    "accentColor": "#7c2d12",
                    "logoUrl": self.generate_test_image_data("png"),
                    "logoOpacity": 1.0,
                    "bannerUrl": self.generate_test_image_data("jpg"),
                    
                    # NEW TEAM-LEVEL FORM BACKGROUND FIELDS - CRITICAL TEST
                    "teamFormBackgroundColor": "#fee2e2",
                    "teamFormBackgroundImage": self.generate_test_image_data("webp"),
                    "teamFormBackgroundType": "image",
                    "teamFormBorderColor": "#dc2626",
                    "teamFormTextColor": "#7c2d12",
                    "teamFormInputBackgroundColor": "#fef2f2",
                    "teamFormInputBorderColor": "#fca5a5",
                    "teamFormButtonBackgroundColor": "#dc2626",
                    "teamFormButtonTextColor": "#ffffff",
                    "teamFormButtonHoverColor": "#b91c1c",
                    
                    # Enhanced team form styling
                    "teamFormBorderRadius": "12px",
                    "teamFormShadow": "0 8px 16px -4px rgba(220, 38, 38, 0.2)",
                    "teamFormPadding": "32px",
                    "teamFormMaxWidth": "600px",
                    "teamFormOpacity": 0.9,
                    "teamFormGradient": "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)"
                }
            }
            
            # Create team with form background styling
            response = requests.post(
                f"{self.api_base}/teams", 
                json=test_team,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                created_team = response.json()
                team_id = created_team.get('id')
                
                # Verify team was created and retrieve it
                time.sleep(1)
                get_response = requests.get(f"{self.api_base}/teams", timeout=10)
                
                if get_response.status_code == 200:
                    teams = get_response.json()
                    test_team_data = None
                    
                    for team in teams:
                        if team.get('id') == team_id:
                            test_team_data = team
                            break
                    
                    if test_team_data and test_team_data.get('style'):
                        saved_style = test_team_data['style']
                        
                        # Check team form background fields
                        team_form_fields = [
                            'teamFormBackgroundColor', 'teamFormBackgroundImage', 'teamFormBackgroundType',
                            'teamFormBorderColor', 'teamFormTextColor', 'teamFormInputBackgroundColor',
                            'teamFormInputBorderColor', 'teamFormButtonBackgroundColor', 'teamFormButtonTextColor',
                            'teamFormButtonHoverColor', 'teamFormBorderRadius', 'teamFormShadow',
                            'teamFormPadding', 'teamFormMaxWidth', 'teamFormOpacity', 'teamFormGradient'
                        ]
                        
                        missing_fields = []
                        corrupted_fields = []
                        
                        for field in team_form_fields:
                            if field not in saved_style:
                                missing_fields.append(field)
                            elif saved_style[field] != test_team['style'][field]:
                                corrupted_fields.append(f"{field}: expected {test_team['style'][field]}, got {saved_style[field]}")
                        
                        # Clean up test team
                        try:
                            requests.delete(f"{self.api_base}/teams/{team_id}", timeout=10)
                        except:
                            pass
                        
                        if not missing_fields and not corrupted_fields:
                            self.log_test(
                                "Team Form Background Fields", 
                                True, 
                                f"All {len(team_form_fields)} team form background fields saved correctly", 
                                f"Team: {test_team_data['name']}"
                            )
                            return True
                        else:
                            error_msg = ""
                            if missing_fields:
                                error_msg += f"Missing fields: {missing_fields[:3]}... "
                            if corrupted_fields:
                                error_msg += f"Corrupted fields: {corrupted_fields[:2]}..."
                            
                            self.log_test(
                                "Team Form Background Fields", 
                                False, 
                                error_msg
                            )
                            return False
                    else:
                        self.log_test(
                            "Team Form Background Fields", 
                            False, 
                            "Created team not found or missing style data"
                        )
                        return False
                else:
                    self.log_test(
                        "Team Form Background Fields", 
                        False, 
                        f"Could not retrieve teams: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Team Form Background Fields", 
                    False, 
                    f"Team creation failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team Form Background Fields", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False
        except Exception as e:
            self.log_test(
                "Team Form Background Fields", 
                False, 
                f"Unexpected error: {str(e)}"
            )
            return False

    def test_enhanced_image_fields(self):
        """Test enhanced background image fields save correctly"""
        try:
            # Test various image formats and enhanced image fields
            enhanced_websitestyle = {
                "id": "main_league",
                "teams": [],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {},
                "websiteStyle": {
                    # Enhanced background image fields
                    "navBackgroundImage": self.generate_test_image_data("png"),
                    "navBackgroundImageOpacity": 0.8,
                    "navBackgroundImagePosition": "center",
                    "navBackgroundImageSize": "cover",
                    "navBackgroundImageRepeat": "no-repeat",
                    
                    "bannerBackgroundImage": self.generate_test_image_data("jpg"),
                    "bannerBackgroundImageOpacity": 0.9,
                    "bannerBackgroundImagePosition": "center top",
                    "bannerBackgroundImageSize": "cover",
                    "bannerBackgroundImageRepeat": "no-repeat",
                    "bannerBackgroundImageBlur": "2px",
                    
                    "contentBackgroundImage": self.generate_test_image_data("webp"),
                    "contentBackgroundImageOpacity": 0.1,
                    "contentBackgroundImagePosition": "center bottom",
                    "contentBackgroundImageSize": "contain",
                    "contentBackgroundImageRepeat": "repeat-x",
                    
                    "sidebarBackgroundImage": self.generate_test_image_data("png"),
                    "sidebarBackgroundImageOpacity": 0.7,
                    "sidebarBackgroundImagePosition": "left center",
                    "sidebarBackgroundImageSize": "auto",
                    "sidebarBackgroundImageRepeat": "repeat-y",
                    
                    # Form background images with enhanced properties
                    "formBackgroundImage": self.generate_test_image_data("jpg"),
                    "formBackgroundImageOpacity": 0.6,
                    "formBackgroundImagePosition": "right center",
                    "formBackgroundImageSize": "cover",
                    "formBackgroundImageRepeat": "no-repeat",
                    "formBackgroundImageBlur": "1px",
                    
                    # Crop tool related fields
                    "cropToolEnabled": True,
                    "cropAspectRatios": {
                        "navigation": "4:1",
                        "banner": "5:1",
                        "menu": "9:16",
                        "logo": "1:1"
                    },
                    "cropQuality": 0.9,
                    "cropFormat": "png",
                    
                    "lastUpdated": datetime.utcnow().isoformat()
                }
            }
            
            # Save enhanced image fields
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=enhanced_websitestyle,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                # Verify enhanced image fields were saved
                time.sleep(1)
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    saved_data = get_response.json()
                    saved_style = saved_data.get('websiteStyle', {})
                    
                    # Check enhanced image fields
                    enhanced_fields = [
                        'navBackgroundImage', 'navBackgroundImageOpacity', 'navBackgroundImagePosition',
                        'bannerBackgroundImage', 'bannerBackgroundImageBlur', 'contentBackgroundImage',
                        'sidebarBackgroundImage', 'formBackgroundImage', 'formBackgroundImageBlur',
                        'cropToolEnabled', 'cropAspectRatios', 'cropQuality', 'cropFormat'
                    ]
                    
                    missing_fields = []
                    corrupted_fields = []
                    
                    for field in enhanced_fields:
                        if field not in saved_style:
                            missing_fields.append(field)
                        elif field == 'cropAspectRatios':
                            # Special handling for nested object
                            expected_ratios = enhanced_websitestyle['websiteStyle'][field]
                            saved_ratios = saved_style[field]
                            if saved_ratios != expected_ratios:
                                corrupted_fields.append(f"{field}: aspect ratios mismatch")
                        elif saved_style[field] != enhanced_websitestyle['websiteStyle'][field]:
                            corrupted_fields.append(f"{field}: value mismatch")
                    
                    if not missing_fields and not corrupted_fields:
                        self.log_test(
                            "Enhanced Image Fields", 
                            True, 
                            f"All {len(enhanced_fields)} enhanced image fields saved correctly", 
                            f"Formats tested: PNG, JPG, WebP"
                        )
                        return True
                    else:
                        error_msg = ""
                        if missing_fields:
                            error_msg += f"Missing: {missing_fields[:3]}... "
                        if corrupted_fields:
                            error_msg += f"Corrupted: {corrupted_fields[:2]}..."
                        
                        self.log_test(
                            "Enhanced Image Fields", 
                            False, 
                            error_msg
                        )
                        return False
                else:
                    self.log_test(
                        "Enhanced Image Fields", 
                        False, 
                        f"Could not retrieve data: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Enhanced Image Fields", 
                    False, 
                    f"Save failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Enhanced Image Fields", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False
        except Exception as e:
            self.log_test(
                "Enhanced Image Fields", 
                False, 
                f"Unexpected error: {str(e)}"
            )
            return False

    def test_crop_tool_data_persistence(self):
        """Test that cropped images in various formats save properly"""
        try:
            # Test cropped image data with crop metadata
            crop_test_data = {
                "id": "main_league",
                "teams": [],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {},
                "websiteStyle": {
                    # Cropped images with metadata
                    "navLogoCropped": {
                        "imageData": self.generate_test_image_data("png"),
                        "cropData": {
                            "x": 10,
                            "y": 15,
                            "width": 200,
                            "height": 50,
                            "aspectRatio": "4:1",
                            "originalWidth": 400,
                            "originalHeight": 300,
                            "scaleX": 1.0,
                            "scaleY": 1.0,
                            "cropSpaceScale": 0.8
                        },
                        "format": "png",
                        "quality": 0.9,
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    
                    "bannerImageCropped": {
                        "imageData": self.generate_test_image_data("jpg"),
                        "cropData": {
                            "x": 0,
                            "y": 20,
                            "width": 500,
                            "height": 100,
                            "aspectRatio": "5:1",
                            "originalWidth": 800,
                            "originalHeight": 400,
                            "scaleX": 1.2,
                            "scaleY": 1.2,
                            "cropSpaceScale": 1.0
                        },
                        "format": "jpg",
                        "quality": 0.85,
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    
                    "menuImageCropped": {
                        "imageData": self.generate_test_image_data("webp"),
                        "cropData": {
                            "x": 25,
                            "y": 0,
                            "width": 90,
                            "height": 160,
                            "aspectRatio": "9:16",
                            "originalWidth": 300,
                            "originalHeight": 400,
                            "scaleX": 0.9,
                            "scaleY": 0.9,
                            "cropSpaceScale": 1.1
                        },
                        "format": "webp",
                        "quality": 0.8,
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    
                    # Crop tool settings
                    "cropToolSettings": {
                        "enableCropSpaceScaling": True,
                        "defaultCropSpaceScale": 0.8,
                        "cropSpaceScaleButtons": True,
                        "transparentCropArea": True,
                        "cropPreviewEnabled": True,
                        "cropGridEnabled": True,
                        "cropHandleSize": 12,
                        "cropBorderColor": "#3b82f6",
                        "cropBackgroundOpacity": 0.5
                    },
                    
                    "lastUpdated": datetime.utcnow().isoformat()
                }
            }
            
            # Save crop tool data
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=crop_test_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                # Verify crop data was saved correctly
                time.sleep(1)
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    saved_data = get_response.json()
                    saved_style = saved_data.get('websiteStyle', {})
                    
                    # Check cropped image objects
                    crop_objects = ['navLogoCropped', 'bannerImageCropped', 'menuImageCropped']
                    crop_settings_fields = ['cropToolSettings']
                    
                    missing_objects = []
                    corrupted_objects = []
                    
                    for obj_name in crop_objects:
                        if obj_name not in saved_style:
                            missing_objects.append(obj_name)
                        else:
                            saved_obj = saved_style[obj_name]
                            expected_obj = crop_test_data['websiteStyle'][obj_name]
                            
                            # Check required fields in crop object
                            required_fields = ['imageData', 'cropData', 'format', 'quality']
                            for field in required_fields:
                                if field not in saved_obj:
                                    corrupted_objects.append(f"{obj_name}.{field} missing")
                                elif field == 'cropData':
                                    # Check crop data fields
                                    crop_fields = ['x', 'y', 'width', 'height', 'aspectRatio', 'cropSpaceScale']
                                    for crop_field in crop_fields:
                                        if crop_field not in saved_obj['cropData']:
                                            corrupted_objects.append(f"{obj_name}.cropData.{crop_field} missing")
                    
                    # Check crop tool settings
                    if 'cropToolSettings' not in saved_style:
                        missing_objects.append('cropToolSettings')
                    else:
                        settings = saved_style['cropToolSettings']
                        required_settings = ['enableCropSpaceScaling', 'transparentCropArea', 'cropPreviewEnabled']
                        for setting in required_settings:
                            if setting not in settings:
                                corrupted_objects.append(f"cropToolSettings.{setting} missing")
                    
                    if not missing_objects and not corrupted_objects:
                        self.log_test(
                            "Crop Tool Data Persistence", 
                            True, 
                            f"All crop tool data saved correctly: {len(crop_objects)} cropped images + settings", 
                            f"Formats: PNG, JPG, WebP with crop metadata"
                        )
                        return True
                    else:
                        error_msg = ""
                        if missing_objects:
                            error_msg += f"Missing: {missing_objects}. "
                        if corrupted_objects:
                            error_msg += f"Corrupted: {corrupted_objects[:3]}..."
                        
                        self.log_test(
                            "Crop Tool Data Persistence", 
                            False, 
                            error_msg
                        )
                        return False
                else:
                    self.log_test(
                        "Crop Tool Data Persistence", 
                        False, 
                        f"Could not retrieve data: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Crop Tool Data Persistence", 
                    False, 
                    f"Save failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Crop Tool Data Persistence", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False
        except Exception as e:
            self.log_test(
                "Crop Tool Data Persistence", 
                False, 
                f"Unexpected error: {str(e)}"
            )
            return False

    def test_websitestyle_endpoint_specific(self):
        """Test websiteStyle specific endpoint for form background support"""
        try:
            # Test the specific websiteStyle endpoint
            test_style = {
                # Form background controls
                "formBackgroundColor": "#f9fafb",
                "formBackgroundImage": self.generate_test_image_data("png"),
                "formBackgroundType": "gradient",
                "formBackgroundGradient": "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
                
                # Enhanced form styling
                "formBorderStyle": "solid",
                "formBorderWidth": "2px",
                "formBorderRadius": "16px",
                "formBoxShadow": "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                "formTransition": "all 0.3s ease",
                
                # Team-level form overrides
                "allowTeamFormOverrides": True,
                "teamFormInheritance": "partial",
                
                "lastUpdated": datetime.utcnow().isoformat()
            }
            
            # Use the specific websiteStyle endpoint
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=test_style,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify via league-data endpoint
                time.sleep(1)
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    saved_data = get_response.json()
                    saved_style = saved_data.get('websiteStyle', {})
                    
                    # Check specific websiteStyle fields
                    style_fields = [
                        'formBackgroundColor', 'formBackgroundImage', 'formBackgroundType',
                        'formBackgroundGradient', 'formBorderStyle', 'formBorderWidth',
                        'formBorderRadius', 'formBoxShadow', 'allowTeamFormOverrides'
                    ]
                    
                    missing_fields = []
                    for field in style_fields:
                        if field not in saved_style:
                            missing_fields.append(field)
                    
                    if not missing_fields:
                        self.log_test(
                            "WebsiteStyle Specific Endpoint", 
                            True, 
                            f"WebsiteStyle endpoint supports all {len(style_fields)} form background fields", 
                            f"Endpoint: /api/league-data/websiteStyle"
                        )
                        return True
                    else:
                        self.log_test(
                            "WebsiteStyle Specific Endpoint", 
                            False, 
                            f"Missing fields in websiteStyle endpoint: {missing_fields}"
                        )
                        return False
                else:
                    self.log_test(
                        "WebsiteStyle Specific Endpoint", 
                        False, 
                        f"Could not verify save: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "WebsiteStyle Specific Endpoint", 
                    False, 
                    f"WebsiteStyle endpoint failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "WebsiteStyle Specific Endpoint", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False
        except Exception as e:
            self.log_test(
                "WebsiteStyle Specific Endpoint", 
                False, 
                f"Unexpected error: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all form background and crop tool backend tests"""
        print("🎯 FORM BACKGROUND AND CROP TOOL BACKEND TESTING")
        print("Testing backend support for new form background controls and enhanced crop tool functionality")
        print("=" * 80)
        
        # Test basic connectivity first
        if not self.test_health_check():
            print("❌ CRITICAL: Backend health check failed. Cannot proceed with testing.")
            return False
        
        print("\n🎨 TESTING FORM BACKGROUND FIELDS:")
        test_results = []
        
        # Test 1: WebsiteStyle form background fields
        test_results.append(self.test_form_background_websitestyle_fields())
        
        # Test 2: Team-level form background fields
        test_results.append(self.test_team_form_background_fields())
        
        # Test 3: Enhanced image fields
        test_results.append(self.test_enhanced_image_fields())
        
        # Test 4: Crop tool data persistence
        test_results.append(self.test_crop_tool_data_persistence())
        
        # Test 5: WebsiteStyle specific endpoint
        test_results.append(self.test_websitestyle_endpoint_specific())
        
        # Summary
        print("=" * 80)
        print("🎯 FORM BACKGROUND BACKEND TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if failed_tests > 0:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        # Critical assessment
        critical_failures = [t for t in self.failed_tests if any(keyword in t for keyword in ['Form Background Fields', 'Crop Tool Data', 'Enhanced Image'])]
        
        if critical_failures:
            print(f"\n🚨 CRITICAL FORM BACKGROUND ISSUES:")
            for test in critical_failures:
                print(f"  - {test}")
            print("\n⚠️  Backend may not fully support new form background controls and crop tool functionality.")
        else:
            print(f"\n✅ SUCCESS: Backend fully supports form background controls and crop tool functionality!")
        
        return len(critical_failures) == 0

if __name__ == "__main__":
    try:
        tester = FormBackgroundTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Form background and crop tool backend testing completed successfully!")
            print("✅ Backend supports all new form background controls and enhanced crop tool functionality.")
            sys.exit(0)
        else:
            print("\n⚠️  Some form background backend tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)