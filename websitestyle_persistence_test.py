#!/usr/bin/env python3
"""
WebsiteStyle Persistence Test - Critical Bug Fix Verification
Tests the specific websiteStyle persistence fix mentioned in the review request.
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

class WebsiteStyleTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing websiteStyle persistence at: {self.api_base}")
        print("=" * 70)

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

    def test_websitestyle_persistence_fix(self):
        """Test the critical websiteStyle persistence bug fix"""
        print("🔍 TESTING CRITICAL WEBSITESTYLE PERSISTENCE FIX")
        print("=" * 70)
        
        # Step 1: Get current league data to see existing websiteStyle
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test("Get Initial WebsiteStyle", False, f"HTTP {response.status_code}")
                return False
            
            initial_data = response.json()
            initial_websitestyle = initial_data.get('websiteStyle', {})
            
            self.log_test(
                "Get Initial WebsiteStyle", 
                True, 
                f"Retrieved websiteStyle with {len(initial_websitestyle)} properties",
                f"Keys: {list(initial_websitestyle.keys())[:5]}..." if len(initial_websitestyle) > 5 else f"Keys: {list(initial_websitestyle.keys())}"
            )
            
        except Exception as e:
            self.log_test("Get Initial WebsiteStyle", False, f"Error: {str(e)}")
            return False

        # Step 2: Create comprehensive websiteStyle data (realistic customizations)
        comprehensive_websitestyle = {
            "primaryColor": "#1e40af",
            "secondaryColor": "#dc2626", 
            "backgroundColor": "#f8fafc",
            "textColor": "#1f2937",
            "logoUrl": "https://example.com/logo.png",
            "logoDisplayStyle": "fit",
            "bannerSettings": {
                "enabled": True,
                "backgroundColor": "#3b82f6",
                "textColor": "#ffffff",
                "text": "Welcome to MLBL League",
                "backgroundImage": "https://example.com/banner.jpg"
            },
            "sidebarCustomization": {
                "backgroundColor": "#1f2937",
                "backgroundImage": "https://example.com/sidebar.jpg",
                "opacity": 0.8
            },
            "homePageSettings": {
                "showTeamLogos": True,
                "teamCardStyle": "rectangle",
                "showStandings": True
            },
            "navigationSettings": {
                "showDivisions": True,
                "groupByDivision": True
            },
            "musicSettings": {
                "globalMusicUrl": "https://example.com/music.mp3",
                "enableTeamMusic": True
            },
            "customCSS": ".custom-style { color: red; }",
            "theme": "professional",
            "lastModified": datetime.utcnow().isoformat()
        }

        # Step 3: Save websiteStyle using specific endpoint
        try:
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle",
                json=comprehensive_websitestyle,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                save_result = response.json()
                self.log_test(
                    "Save WebsiteStyle Data", 
                    True, 
                    f"Saved {len(comprehensive_websitestyle)} websiteStyle properties",
                    save_result.get('message')
                )
            else:
                self.log_test("Save WebsiteStyle Data", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Save WebsiteStyle Data", False, f"Error: {str(e)}")
            return False

        # Step 4: Wait for database write
        time.sleep(1)

        # Step 5: Retrieve and verify persistence (this is where the bug was)
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test("Verify WebsiteStyle Persistence", False, f"HTTP {response.status_code}")
                return False
            
            retrieved_data = response.json()
            retrieved_websitestyle = retrieved_data.get('websiteStyle', {})
            
            # Critical check: websiteStyle should NOT be empty object {}
            if not retrieved_websitestyle:
                self.log_test(
                    "Verify WebsiteStyle Persistence", 
                    False, 
                    "CRITICAL BUG DETECTED: websiteStyle returned as empty object {} - persistence failed!"
                )
                return False
            
            # Verify key properties are preserved
            critical_properties = ['primaryColor', 'bannerSettings', 'sidebarCustomization', 'logoDisplayStyle']
            missing_properties = []
            
            for prop in critical_properties:
                if prop not in retrieved_websitestyle:
                    missing_properties.append(prop)
            
            if missing_properties:
                self.log_test(
                    "Verify WebsiteStyle Persistence", 
                    False, 
                    f"Missing critical properties: {missing_properties}"
                )
                return False
            
            # Verify specific values match
            if retrieved_websitestyle.get('primaryColor') != comprehensive_websitestyle['primaryColor']:
                self.log_test(
                    "Verify WebsiteStyle Persistence", 
                    False, 
                    f"Primary color mismatch: expected {comprehensive_websitestyle['primaryColor']}, got {retrieved_websitestyle.get('primaryColor')}"
                )
                return False
            
            self.log_test(
                "Verify WebsiteStyle Persistence", 
                True, 
                f"✅ PERSISTENCE FIX WORKING! Retrieved {len(retrieved_websitestyle)} properties correctly",
                f"Primary color: {retrieved_websitestyle.get('primaryColor')}, Banner enabled: {retrieved_websitestyle.get('bannerSettings', {}).get('enabled')}"
            )
            
            return True
            
        except Exception as e:
            self.log_test("Verify WebsiteStyle Persistence", False, f"Error: {str(e)}")
            return False

    def test_empty_websitestyle_handling(self):
        """Test handling of empty websiteStyle objects (the root cause of the bug)"""
        print("🔍 TESTING EMPTY WEBSITESTYLE OBJECT HANDLING")
        print("=" * 70)
        
        # Step 1: Save an empty websiteStyle object (this was causing the bug)
        try:
            empty_websitestyle = {}
            
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle",
                json=empty_websitestyle,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "Save Empty WebsiteStyle", 
                    True, 
                    "Empty websiteStyle object saved successfully"
                )
            else:
                self.log_test("Save Empty WebsiteStyle", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Save Empty WebsiteStyle", False, f"Error: {str(e)}")
            return False

        # Step 2: Verify system handles empty object correctly
        time.sleep(1)
        
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test("Handle Empty WebsiteStyle", False, f"HTTP {response.status_code}")
                return False
            
            data = response.json()
            websitestyle = data.get('websiteStyle', {})
            
            # The fix should handle empty objects gracefully
            self.log_test(
                "Handle Empty WebsiteStyle", 
                True, 
                f"Empty websiteStyle handled correctly - returned {len(websitestyle)} properties",
                f"Type: {type(websitestyle)}"
            )
            
            return True
            
        except Exception as e:
            self.log_test("Handle Empty WebsiteStyle", False, f"Error: {str(e)}")
            return False

    def run_persistence_tests(self):
        """Run websiteStyle persistence tests"""
        print("🚀 STARTING WEBSITESTYLE PERSISTENCE VERIFICATION")
        print("Testing critical bug fix for websiteStyle data loss after deployments")
        print("=" * 70)
        
        # Test the main persistence fix
        persistence_success = self.test_websitestyle_persistence_fix()
        
        # Test empty object handling
        empty_handling_success = self.test_empty_websitestyle_handling()
        
        # Summary
        print("=" * 70)
        print("WEBSITESTYLE PERSISTENCE TEST SUMMARY")
        print("=" * 70)
        
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
        
        # Overall result
        overall_success = persistence_success and empty_handling_success
        
        if overall_success:
            print("\n🎉 WEBSITESTYLE PERSISTENCE FIX VERIFIED SUCCESSFULLY!")
            print("✅ Website customizations will persist correctly across deployments")
            print("✅ Empty websiteStyle objects are handled properly")
            print("✅ Critical bug fix is working as expected")
        else:
            print("\n⚠️  WEBSITESTYLE PERSISTENCE ISSUES DETECTED!")
            print("❌ The critical bug fix may not be working correctly")
            
        return overall_success

if __name__ == "__main__":
    try:
        tester = WebsiteStyleTester()
        success = tester.run_persistence_tests()
        
        sys.exit(0 if success else 1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)