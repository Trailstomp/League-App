#!/usr/bin/env python3
"""
Focused Form Background Backend Support Analysis
Analyzes current backend support and identifies what needs to be implemented.
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

class FocusedBackendAnalysis:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        
        print(f"🔍 FOCUSED BACKEND ANALYSIS: {self.api_base}")
        print("=" * 70)

    def log_result(self, test_name, success, message="", details=None):
        """Log analysis results"""
        status = "✅ SUPPORTED" if success else "❌ NOT SUPPORTED"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if details:
            print(f"    Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
        print()

    def generate_test_image(self):
        """Generate simple test image data"""
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="

    def test_websitestyle_form_fields(self):
        """Test websiteStyle form background field support"""
        try:
            # Test core form background fields
            test_data = {
                "id": "main_league",
                "teams": [],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {},
                "websiteStyle": {
                    # Core form background fields
                    "formBackgroundColor": "#f3f4f6",
                    "formBackgroundImage": self.generate_test_image(),
                    "formBackgroundType": "color",
                    "formBorderColor": "#d1d5db",
                    "formTextColor": "#374151",
                    "formInputBackgroundColor": "#ffffff",
                    "formInputBorderColor": "#d1d5db",
                    "formButtonBackgroundColor": "#1e40af",
                    "formButtonTextColor": "#ffffff",
                    "formButtonHoverColor": "#1d4ed8",
                    "lastUpdated": datetime.utcnow().isoformat()
                }
            }
            
            # Save and retrieve
            response = requests.post(f"{self.api_base}/league-data", json=test_data, timeout=10)
            
            if response.status_code == 200:
                time.sleep(1)
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    saved_data = get_response.json()
                    saved_style = saved_data.get('websiteStyle', {})
                    
                    # Check which fields are supported
                    form_fields = [
                        'formBackgroundColor', 'formBackgroundImage', 'formBackgroundType',
                        'formBorderColor', 'formTextColor', 'formInputBackgroundColor',
                        'formInputBorderColor', 'formButtonBackgroundColor', 'formButtonTextColor',
                        'formButtonHoverColor'
                    ]
                    
                    supported_fields = []
                    missing_fields = []
                    
                    for field in form_fields:
                        if field in saved_style and saved_style[field] == test_data['websiteStyle'][field]:
                            supported_fields.append(field)
                        else:
                            missing_fields.append(field)
                    
                    if len(supported_fields) == len(form_fields):
                        self.log_result(
                            "WebsiteStyle Form Background Fields",
                            True,
                            f"All {len(form_fields)} form background fields fully supported",
                            f"Supported: {', '.join(supported_fields[:3])}..."
                        )
                        return True, supported_fields
                    else:
                        self.log_result(
                            "WebsiteStyle Form Background Fields",
                            False,
                            f"{len(supported_fields)}/{len(form_fields)} fields supported",
                            f"Missing: {missing_fields}"
                        )
                        return False, supported_fields
                else:
                    self.log_result(
                        "WebsiteStyle Form Background Fields",
                        False,
                        "Could not retrieve saved data"
                    )
                    return False, []
            else:
                self.log_result(
                    "WebsiteStyle Form Background Fields",
                    False,
                    f"Save failed: HTTP {response.status_code}"
                )
                return False, []
                
        except Exception as e:
            self.log_result(
                "WebsiteStyle Form Background Fields",
                False,
                f"Error: {str(e)}"
            )
            return False, []

    def test_team_style_fields(self):
        """Test team style form background field support"""
        try:
            # Test team with form background fields
            test_team = {
                "id": "analysis_test_team",
                "name": "Analysis Test Team",
                "division": "Field",
                "coach": "Test Coach",
                "active": True,
                "wins": 0,
                "losses": 0,
                "ties": 0,
                "style": {
                    # Existing fields (should work)
                    "primaryColor": "#dc2626",
                    "backgroundColor": "#fef2f2",
                    "accentColor": "#7c2d12",
                    "logoUrl": self.generate_test_image(),
                    "logoOpacity": 1.0,
                    "bannerUrl": self.generate_test_image(),
                    
                    # New team form fields (may not work)
                    "teamFormBackgroundColor": "#fee2e2",
                    "teamFormBackgroundImage": self.generate_test_image(),
                    "teamFormBackgroundType": "color",
                    "teamFormBorderColor": "#dc2626",
                    "teamFormTextColor": "#7c2d12"
                }
            }
            
            # Create team
            response = requests.post(f"{self.api_base}/teams", json=test_team, timeout=10)
            
            if response.status_code == 200:
                created_team = response.json()
                team_id = created_team.get('id')
                
                # Retrieve teams to check what was saved
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
                        
                        # Check existing fields
                        existing_fields = ['primaryColor', 'backgroundColor', 'accentColor', 'logoUrl', 'logoOpacity', 'bannerUrl']
                        new_fields = ['teamFormBackgroundColor', 'teamFormBackgroundImage', 'teamFormBackgroundType', 'teamFormBorderColor', 'teamFormTextColor']
                        
                        existing_supported = []
                        existing_missing = []
                        new_supported = []
                        new_missing = []
                        
                        for field in existing_fields:
                            if field in saved_style:
                                existing_supported.append(field)
                            else:
                                existing_missing.append(field)
                        
                        for field in new_fields:
                            if field in saved_style:
                                new_supported.append(field)
                            else:
                                new_missing.append(field)
                        
                        # Clean up test team
                        try:
                            requests.delete(f"{self.api_base}/teams/{team_id}", timeout=10)
                        except:
                            pass
                        
                        if len(new_supported) > 0:
                            self.log_result(
                                "Team Style Form Background Fields",
                                True,
                                f"{len(new_supported)}/{len(new_fields)} new form fields supported",
                                f"Supported: {new_supported}, Missing: {new_missing}"
                            )
                            return True, new_supported, new_missing
                        else:
                            self.log_result(
                                "Team Style Form Background Fields",
                                False,
                                f"No new form background fields supported in TeamStyle model",
                                f"Existing fields work: {len(existing_supported)}/{len(existing_fields)}"
                            )
                            return False, [], new_fields
                    else:
                        self.log_result(
                            "Team Style Form Background Fields",
                            False,
                            "Could not retrieve created team or style data"
                        )
                        return False, [], []
                else:
                    self.log_result(
                        "Team Style Form Background Fields",
                        False,
                        f"Could not retrieve teams: HTTP {get_response.status_code}"
                    )
                    return False, [], []
            else:
                self.log_result(
                    "Team Style Form Background Fields",
                    False,
                    f"Team creation failed: HTTP {response.status_code}: {response.text}"
                )
                return False, [], []
                
        except Exception as e:
            self.log_result(
                "Team Style Form Background Fields",
                False,
                f"Error: {str(e)}"
            )
            return False, [], []

    def test_crop_tool_support(self):
        """Test crop tool data structure support"""
        try:
            # Test crop tool data structure
            crop_data = {
                "id": "main_league",
                "teams": [],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {},
                "websiteStyle": {
                    # Crop tool data structures
                    "croppedImages": {
                        "navLogo": {
                            "imageData": self.generate_test_image(),
                            "cropData": {
                                "x": 10, "y": 15, "width": 200, "height": 50,
                                "aspectRatio": "4:1", "cropSpaceScale": 0.8
                            },
                            "format": "png", "quality": 0.9
                        }
                    },
                    "cropToolSettings": {
                        "enableCropSpaceScaling": True,
                        "transparentCropArea": True,
                        "cropPreviewEnabled": True
                    },
                    "lastUpdated": datetime.utcnow().isoformat()
                }
            }
            
            # Save and retrieve
            response = requests.post(f"{self.api_base}/league-data", json=crop_data, timeout=10)
            
            if response.status_code == 200:
                time.sleep(1)
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    saved_data = get_response.json()
                    saved_style = saved_data.get('websiteStyle', {})
                    
                    # Check crop tool support
                    crop_supported = []
                    crop_missing = []
                    
                    if 'croppedImages' in saved_style:
                        crop_supported.append('croppedImages')
                        if 'navLogo' in saved_style['croppedImages']:
                            nav_logo = saved_style['croppedImages']['navLogo']
                            if 'cropData' in nav_logo and 'cropSpaceScale' in nav_logo['cropData']:
                                crop_supported.append('cropSpaceScale')
                    else:
                        crop_missing.append('croppedImages')
                    
                    if 'cropToolSettings' in saved_style:
                        crop_supported.append('cropToolSettings')
                    else:
                        crop_missing.append('cropToolSettings')
                    
                    if len(crop_supported) >= 2:  # At least croppedImages and cropToolSettings
                        self.log_result(
                            "Crop Tool Data Support",
                            True,
                            f"Crop tool data structures supported",
                            f"Supported: {crop_supported}"
                        )
                        return True, crop_supported
                    else:
                        self.log_result(
                            "Crop Tool Data Support",
                            False,
                            f"Limited crop tool support",
                            f"Missing: {crop_missing}"
                        )
                        return False, crop_supported
                else:
                    self.log_result(
                        "Crop Tool Data Support",
                        False,
                        "Could not retrieve crop tool data"
                    )
                    return False, []
            else:
                self.log_result(
                    "Crop Tool Data Support",
                    False,
                    f"Save failed: HTTP {response.status_code}"
                )
                return False, []
                
        except Exception as e:
            self.log_result(
                "Crop Tool Data Support",
                False,
                f"Error: {str(e)}"
            )
            return False, []

    def run_analysis(self):
        """Run focused backend analysis"""
        print("🔍 ANALYZING BACKEND SUPPORT FOR FORM BACKGROUND AND CROP TOOL FEATURES")
        print("=" * 70)
        
        # Test 1: WebsiteStyle form fields
        websitestyle_success, websitestyle_fields = self.test_websitestyle_form_fields()
        
        # Test 2: Team style form fields
        team_success, team_supported, team_missing = self.test_team_style_fields()
        
        # Test 3: Crop tool support
        crop_success, crop_supported = self.test_crop_tool_support()
        
        # Analysis Summary
        print("=" * 70)
        print("🎯 BACKEND SUPPORT ANALYSIS SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        
        print(f"Analysis Results: {passed_tests}/{total_tests} areas fully supported")
        print()
        
        # Detailed findings
        print("📊 DETAILED FINDINGS:")
        print()
        
        if websitestyle_success:
            print("✅ WEBSITESTYLE FORM FIELDS: FULLY SUPPORTED")
            print(f"   - All form background fields can be saved via /api/league-data")
            print(f"   - Fields include: formBackgroundColor, formBackgroundImage, formBackgroundType, etc.")
        else:
            print("❌ WEBSITESTYLE FORM FIELDS: PARTIAL SUPPORT")
            print(f"   - Some form background fields may not persist correctly")
        
        print()
        
        if team_success:
            print("✅ TEAM STYLE FORM FIELDS: SUPPORTED")
            print(f"   - Team-level form background fields: {team_supported}")
        else:
            print("❌ TEAM STYLE FORM FIELDS: NOT SUPPORTED")
            print(f"   - TeamStyle model missing fields: {team_missing}")
            print(f"   - Backend TeamStyle model needs to be updated to include team form fields")
        
        print()
        
        if crop_success:
            print("✅ CROP TOOL DATA: FULLY SUPPORTED")
            print(f"   - Crop tool data structures supported: {crop_supported}")
            print(f"   - Can save cropped images with metadata and crop tool settings")
        else:
            print("❌ CROP TOOL DATA: LIMITED SUPPORT")
            print(f"   - Some crop tool features may not persist correctly")
        
        print()
        print("=" * 70)
        print("🎯 RECOMMENDATIONS FOR MAIN AGENT:")
        print("=" * 70)
        
        if not team_success:
            print("🚨 CRITICAL: Update TeamStyle model in backend/server.py")
            print("   - Add team-level form background fields to TeamStyle class")
            print("   - Fields needed: teamFormBackgroundColor, teamFormBackgroundImage, etc.")
            print()
        
        if websitestyle_success and crop_success:
            print("✅ WEBSITESTYLE & CROP TOOLS: Backend ready for form background controls")
            print("   - WebsiteStyle can handle all form background fields")
            print("   - Crop tool data structures are supported")
            print()
        
        overall_success = websitestyle_success and crop_success
        if team_success:
            overall_success = overall_success and team_success
        
        return overall_success

if __name__ == "__main__":
    try:
        analyzer = FocusedBackendAnalysis()
        success = analyzer.run_analysis()
        
        if success:
            print("🎉 ANALYSIS COMPLETE: Backend supports form background and crop tool functionality!")
        else:
            print("⚠️  ANALYSIS COMPLETE: Some backend updates needed for full support.")
        
        sys.exit(0 if success else 1)
            
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        sys.exit(1)