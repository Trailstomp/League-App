#!/usr/bin/env python3
"""
Enhanced Website Design Manager Backend Testing Suite
Tests the comprehensive website design functionality including:
- Typography controls (banner, content, heading text with font/size/color options)
- Background/banner toggle (color vs image)
- Image upload capabilities for logos and banners
- MongoDB persistence of enhanced websiteStyle object
"""

import requests
import json
import sys
import base64
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

class EnhancedWebsiteDesignTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Enhanced Website Design Manager at: {self.api_base}")
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

    def create_sample_image_base64(self):
        """Create a small sample image in base64 format for testing"""
        # This is a tiny 1x1 pixel PNG image in base64
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

    def test_health_check(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "API Health Check", 
                        True, 
                        f"Backend server running and responsive", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "API Health Check", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "API Health Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "API Health Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_get_league_data_endpoint(self):
        """Test GET /api/league-data endpoint"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'teams', 'players', 'users', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
                
                if all(field in data for field in required_fields):
                    website_style = data.get('websiteStyle', {})
                    self.log_test(
                        "GET /api/league-data", 
                        True, 
                        f"Retrieved league data with websiteStyle containing {len(website_style)} properties", 
                        f"WebsiteStyle keys: {list(website_style.keys())[:5]}..."
                    )
                    return True, data
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "GET /api/league-data", 
                        False, 
                        f"Missing required fields: {missing}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET /api/league-data", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET /api/league-data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_websiteStyle_endpoint(self):
        """Test POST /api/league-data/websiteStyle endpoint with enhanced fields"""
        try:
            # Create comprehensive websiteStyle object with all new fields
            enhanced_website_style = {
                # Typography Controls - Banner Text
                "bannerFont": "Inter",
                "bannerFontSize": "2xl",
                "bannerTextColor": "#ffffff",
                
                # Typography Controls - Content Text
                "contentFont": "Roboto",
                "contentFontSize": "base",
                "contentTextColor": "#374151",
                
                # Typography Controls - Heading Text
                "headingFont": "Poppins",
                "headingFontSize": "xl",
                "headingTextColor": "#1f2937",
                
                # Background Controls
                "backgroundType": "image",  # or "color"
                "backgroundImageUrl": self.create_sample_image_base64(),
                "backgroundColor": "#f3f4f6",
                
                # Banner Controls
                "bannerType": "color",  # or "image"
                "bannerColor": "#dc2626",
                "bannerImageUrl": "",
                
                # Logo and Image Upload Support
                "logoUrl": self.create_sample_image_base64(),
                "logoOpacity": 0.9,
                "customLogos": {
                    "header": self.create_sample_image_base64(),
                    "navigation": self.create_sample_image_base64()
                },
                
                # Additional styling
                "theme": "enhanced_custom",
                "primaryColor": "#dc2626",
                "secondaryColor": "#374151",
                "accentColor": "#f59e0b",
                
                # Auto-save and preview system support
                "lastModified": datetime.utcnow().isoformat(),
                "autoSaveEnabled": True,
                "previewMode": False
            }
            
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=enhanced_website_style,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'websiteStyle updated successfully':
                    self.log_test(
                        "POST /api/league-data/websiteStyle", 
                        True, 
                        f"Enhanced websiteStyle saved with {len(enhanced_website_style)} properties", 
                        {"message": data.get('message'), "fields_saved": len(enhanced_website_style)}
                    )
                    return True, enhanced_website_style
                else:
                    self.log_test(
                        "POST /api/league-data/websiteStyle", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST /api/league-data/websiteStyle", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST /api/league-data/websiteStyle", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_websiteStyle_persistence(self, saved_style):
        """Test that websiteStyle data persists correctly in MongoDB"""
        try:
            # Wait for database write
            time.sleep(2)
            
            # Retrieve the data
            success, league_data = self.test_get_league_data_endpoint()
            if not success:
                self.log_test(
                    "WebsiteStyle Persistence", 
                    False, 
                    "Could not retrieve league data for persistence test"
                )
                return False
            
            retrieved_style = league_data.get('websiteStyle', {})
            
            # Check if all enhanced fields are present and correct
            enhanced_fields = [
                'bannerFont', 'bannerFontSize', 'bannerTextColor',
                'contentFont', 'contentFontSize', 'contentTextColor', 
                'headingFont', 'headingFontSize', 'headingTextColor',
                'backgroundType', 'backgroundImageUrl', 'bannerType', 'bannerColor'
            ]
            
            missing_fields = []
            incorrect_fields = []
            
            for field in enhanced_fields:
                if field not in retrieved_style:
                    missing_fields.append(field)
                elif retrieved_style[field] != saved_style[field]:
                    incorrect_fields.append(field)
            
            if not missing_fields and not incorrect_fields:
                # Check image data persistence
                logo_persisted = retrieved_style.get('logoUrl') == saved_style.get('logoUrl')
                background_persisted = retrieved_style.get('backgroundImageUrl') == saved_style.get('backgroundImageUrl')
                
                if logo_persisted and background_persisted:
                    self.log_test(
                        "WebsiteStyle Persistence", 
                        True, 
                        f"All {len(enhanced_fields)} enhanced fields persisted correctly including image data", 
                        f"Fields verified: {len(enhanced_fields)}, Images: 2"
                    )
                    return True
                else:
                    self.log_test(
                        "WebsiteStyle Persistence", 
                        False, 
                        f"Image data not persisted correctly. Logo: {logo_persisted}, Background: {background_persisted}"
                    )
                    return False
            else:
                error_msg = ""
                if missing_fields:
                    error_msg += f"Missing fields: {missing_fields}. "
                if incorrect_fields:
                    error_msg += f"Incorrect fields: {incorrect_fields}."
                
                self.log_test(
                    "WebsiteStyle Persistence", 
                    False, 
                    error_msg
                )
                return False
                
        except Exception as e:
            self.log_test(
                "WebsiteStyle Persistence", 
                False, 
                f"Error during persistence test: {str(e)}"
            )
            return False

    def test_typography_fields_validation(self):
        """Test that all typography fields are properly handled"""
        try:
            typography_test_data = {
                # Test all font options
                "bannerFont": "Inter",
                "contentFont": "Roboto", 
                "headingFont": "Poppins",
                
                # Test all font sizes
                "bannerFontSize": "3xl",
                "contentFontSize": "sm",
                "headingFontSize": "2xl",
                
                # Test color formats
                "bannerTextColor": "#ffffff",
                "contentTextColor": "rgb(55, 65, 81)",
                "headingTextColor": "hsl(220, 13%, 18%)"
            }
            
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=typography_test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify persistence
                time.sleep(1)
                success, league_data = self.test_get_league_data_endpoint()
                
                if success:
                    retrieved_style = league_data.get('websiteStyle', {})
                    typography_fields_present = all(
                        field in retrieved_style for field in typography_test_data.keys()
                    )
                    
                    if typography_fields_present:
                        self.log_test(
                            "Typography Fields Validation", 
                            True, 
                            f"All {len(typography_test_data)} typography fields handled correctly", 
                            f"Font families: 3, Font sizes: 3, Colors: 3"
                        )
                        return True
                    else:
                        missing = [f for f in typography_test_data.keys() if f not in retrieved_style]
                        self.log_test(
                            "Typography Fields Validation", 
                            False, 
                            f"Typography fields missing after save: {missing}"
                        )
                        return False
                else:
                    self.log_test(
                        "Typography Fields Validation", 
                        False, 
                        "Could not retrieve data to verify typography fields"
                    )
                    return False
            else:
                self.log_test(
                    "Typography Fields Validation", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Typography Fields Validation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_background_banner_toggle(self):
        """Test background and banner type toggle functionality"""
        try:
            # Test color mode
            color_mode_data = {
                "backgroundType": "color",
                "backgroundColor": "#f3f4f6",
                "bannerType": "color", 
                "bannerColor": "#dc2626"
            }
            
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=color_mode_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test(
                    "Background/Banner Toggle - Color Mode", 
                    False, 
                    f"Color mode save failed: HTTP {response.status_code}"
                )
                return False
            
            # Test image mode
            image_mode_data = {
                "backgroundType": "image",
                "backgroundImageUrl": self.create_sample_image_base64(),
                "bannerType": "image",
                "bannerImageUrl": self.create_sample_image_base64()
            }
            
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=image_mode_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify both modes persisted
                time.sleep(1)
                success, league_data = self.test_get_league_data_endpoint()
                
                if success:
                    retrieved_style = league_data.get('websiteStyle', {})
                    
                    # Check that image mode is active and data is present
                    background_correct = (
                        retrieved_style.get('backgroundType') == 'image' and
                        retrieved_style.get('backgroundImageUrl') is not None
                    )
                    
                    banner_correct = (
                        retrieved_style.get('bannerType') == 'image' and
                        retrieved_style.get('bannerImageUrl') is not None
                    )
                    
                    if background_correct and banner_correct:
                        self.log_test(
                            "Background/Banner Toggle", 
                            True, 
                            "Both color and image modes work correctly", 
                            "Background: image mode, Banner: image mode"
                        )
                        return True
                    else:
                        self.log_test(
                            "Background/Banner Toggle", 
                            False, 
                            f"Toggle modes not working. Background: {background_correct}, Banner: {banner_correct}"
                        )
                        return False
                else:
                    self.log_test(
                        "Background/Banner Toggle", 
                        False, 
                        "Could not verify toggle functionality"
                    )
                    return False
            else:
                self.log_test(
                    "Background/Banner Toggle", 
                    False, 
                    f"Image mode save failed: HTTP {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Background/Banner Toggle", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_file_upload_capabilities(self):
        """Test file upload capabilities for logos and banners"""
        try:
            # Test multiple image uploads
            file_upload_data = {
                "logoUrl": self.create_sample_image_base64(),
                "bannerImageUrl": self.create_sample_image_base64(),
                "backgroundImageUrl": self.create_sample_image_base64(),
                "customLogos": {
                    "header": self.create_sample_image_base64(),
                    "navigation": self.create_sample_image_base64(),
                    "footer": self.create_sample_image_base64()
                },
                "customBanners": {
                    "home": self.create_sample_image_base64(),
                    "events": self.create_sample_image_base64()
                }
            }
            
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=file_upload_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                # Verify all images persisted
                time.sleep(2)
                success, league_data = self.test_get_league_data_endpoint()
                
                if success:
                    retrieved_style = league_data.get('websiteStyle', {})
                    
                    # Check main images
                    main_images_ok = all(
                        retrieved_style.get(field) == file_upload_data[field]
                        for field in ['logoUrl', 'bannerImageUrl', 'backgroundImageUrl']
                    )
                    
                    # Check custom logos
                    custom_logos_ok = (
                        'customLogos' in retrieved_style and
                        len(retrieved_style['customLogos']) == 3
                    )
                    
                    # Check custom banners
                    custom_banners_ok = (
                        'customBanners' in retrieved_style and
                        len(retrieved_style['customBanners']) == 2
                    )
                    
                    if main_images_ok and custom_logos_ok and custom_banners_ok:
                        total_images = 3 + 3 + 2  # main + custom logos + custom banners
                        self.log_test(
                            "File Upload Capabilities", 
                            True, 
                            f"All {total_images} image uploads handled correctly", 
                            f"Main images: 3, Custom logos: 3, Custom banners: 2"
                        )
                        return True
                    else:
                        self.log_test(
                            "File Upload Capabilities", 
                            False, 
                            f"Image upload issues. Main: {main_images_ok}, Logos: {custom_logos_ok}, Banners: {custom_banners_ok}"
                        )
                        return False
                else:
                    self.log_test(
                        "File Upload Capabilities", 
                        False, 
                        "Could not verify file uploads"
                    )
                    return False
            else:
                self.log_test(
                    "File Upload Capabilities", 
                    False, 
                    f"File upload failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "File Upload Capabilities", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_mongodb_persistence_comprehensive(self):
        """Test comprehensive MongoDB persistence of enhanced websiteStyle object"""
        try:
            # Create a comprehensive websiteStyle object with all possible fields
            comprehensive_style = {
                # Typography - all combinations
                "bannerFont": "Inter", "bannerFontSize": "3xl", "bannerTextColor": "#ffffff",
                "contentFont": "Roboto", "contentFontSize": "base", "contentTextColor": "#374151", 
                "headingFont": "Poppins", "headingFontSize": "2xl", "headingTextColor": "#1f2937",
                
                # Background/Banner controls
                "backgroundType": "image", "backgroundImageUrl": self.create_sample_image_base64(),
                "backgroundColor": "#f3f4f6", "bannerType": "color", "bannerColor": "#dc2626",
                "bannerImageUrl": self.create_sample_image_base64(),
                
                # Logo system
                "logoUrl": self.create_sample_image_base64(), "logoOpacity": 0.85,
                
                # Theme system
                "theme": "enhanced_professional", "primaryColor": "#dc2626", 
                "secondaryColor": "#374151", "accentColor": "#f59e0b",
                
                # Advanced features
                "customLogos": {"header": self.create_sample_image_base64(), "nav": self.create_sample_image_base64()},
                "customBanners": {"home": self.create_sample_image_base64()},
                "autoSaveEnabled": True, "previewMode": False,
                "lastModified": datetime.utcnow().isoformat(),
                
                # Additional styling
                "borderRadius": "lg", "shadowLevel": "md", "animationsEnabled": True
            }
            
            # Save comprehensive data
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=comprehensive_style,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test(
                    "MongoDB Persistence - Comprehensive", 
                    False, 
                    f"Save failed: HTTP {response.status_code}"
                )
                return False
            
            # Wait and retrieve
            time.sleep(2)
            success, league_data = self.test_get_league_data_endpoint()
            
            if not success:
                self.log_test(
                    "MongoDB Persistence - Comprehensive", 
                    False, 
                    "Could not retrieve data for persistence verification"
                )
                return False
            
            retrieved_style = league_data.get('websiteStyle', {})
            
            # Verify all fields persisted
            missing_fields = []
            corrupted_fields = []
            
            for field, value in comprehensive_style.items():
                if field not in retrieved_style:
                    missing_fields.append(field)
                elif retrieved_style[field] != value:
                    corrupted_fields.append(field)
            
            if not missing_fields and not corrupted_fields:
                self.log_test(
                    "MongoDB Persistence - Comprehensive", 
                    True, 
                    f"All {len(comprehensive_style)} fields persisted without corruption", 
                    f"Typography: 9, Images: 6, Theme: 4, Advanced: 8"
                )
                return True
            else:
                error_details = []
                if missing_fields:
                    error_details.append(f"Missing: {len(missing_fields)} fields")
                if corrupted_fields:
                    error_details.append(f"Corrupted: {len(corrupted_fields)} fields")
                
                self.log_test(
                    "MongoDB Persistence - Comprehensive", 
                    False, 
                    f"Persistence issues: {', '.join(error_details)}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "MongoDB Persistence - Comprehensive", 
                False, 
                f"Error during comprehensive persistence test: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all enhanced website design manager tests"""
        print("🎨 ENHANCED WEBSITE DESIGN MANAGER BACKEND TESTING")
        print("Testing comprehensive website design functionality...")
        print("=" * 80)
        
        # Test basic connectivity first
        if not self.test_health_check():
            print("❌ CRITICAL: API health check failed. Backend may not be running.")
            return False
        
        # Test core endpoints
        print("\n📡 TESTING CORE API ENDPOINTS:")
        success, _ = self.test_get_league_data_endpoint()
        if not success:
            print("❌ CRITICAL: League data endpoint failed.")
            return False
        
        # Test enhanced websiteStyle functionality
        print("\n🎨 TESTING ENHANCED WEBSITE STYLE FUNCTIONALITY:")
        success, saved_style = self.test_websiteStyle_endpoint()
        if not success:
            print("❌ CRITICAL: WebsiteStyle endpoint failed.")
            return False
        
        # Test persistence
        print("\n💾 TESTING DATA PERSISTENCE:")
        self.test_websiteStyle_persistence(saved_style)
        
        # Test specific features
        print("\n🔤 TESTING TYPOGRAPHY CONTROLS:")
        self.test_typography_fields_validation()
        
        print("\n🎭 TESTING BACKGROUND/BANNER TOGGLE:")
        self.test_background_banner_toggle()
        
        print("\n📁 TESTING FILE UPLOAD CAPABILITIES:")
        self.test_file_upload_capabilities()
        
        print("\n🗄️ TESTING COMPREHENSIVE MONGODB PERSISTENCE:")
        self.test_mongodb_persistence_comprehensive()
        
        # Summary
        print("=" * 80)
        print("🎨 ENHANCED WEBSITE DESIGN MANAGER TEST SUMMARY")
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
        
        # Check for critical failures
        critical_failures = [t for t in self.failed_tests if any(keyword in t for keyword in ['Health Check', 'league-data', 'websiteStyle'])]
        
        if critical_failures:
            print(f"\n⚠️  Critical Website Design Manager Issues:")
            for test in critical_failures:
                print(f"  - {test}")
            return False
        
        print(f"\n🎉 Enhanced Website Design Manager backend is {'FULLY FUNCTIONAL' if failed_tests == 0 else 'MOSTLY FUNCTIONAL'}!")
        return failed_tests == 0

if __name__ == "__main__":
    try:
        tester = EnhancedWebsiteDesignTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n✅ All Enhanced Website Design Manager tests passed!")
            sys.exit(0)
        else:
            print("\n⚠️  Some tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)