#!/usr/bin/env python3
"""
WebsiteStyle Data Persistence Testing Suite
Specifically tests the websiteStyle data persistence bug reported by user.
Tests GET/POST operations for websiteStyle data to ensure proper saving and retrieval.
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
        print("=" * 80)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            if isinstance(response_data, dict) and len(str(response_data)) > 200:
                print(f"    Response: {json.dumps(response_data, indent=2)[:200]}...")
            else:
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

    def test_initial_websitestyle_data(self):
        """Test 1: GET /api/league-data to see current websiteStyle data"""
        print("🔍 TEST 1: Checking current websiteStyle data...")
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                website_style = data.get('websiteStyle', {})
                
                self.log_test(
                    "Initial WebsiteStyle Data Check", 
                    True, 
                    f"Current websiteStyle: {json.dumps(website_style, indent=2) if website_style else 'Empty object {}'}", 
                    website_style
                )
                return True, website_style
            else:
                self.log_test(
                    "Initial WebsiteStyle Data Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Initial WebsiteStyle Data Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_save_websitestyle_data(self):
        """Test 2: POST /api/league-data/websiteStyle with comprehensive sample data"""
        print("💾 TEST 2: Saving comprehensive websiteStyle data...")
        
        # Create comprehensive websiteStyle test data
        sample_website_style = {
            "theme": "custom",
            "primaryColor": "#1e40af",
            "secondaryColor": "#f59e0b",
            "backgroundColor": "#f8fafc",
            "textColor": "#1f2937",
            "logo": {
                "url": "https://example.com/logo.png",
                "displayStyle": "fit",
                "size": "large"
            },
            "banner": {
                "enabled": True,
                "color": "#3b82f6",
                "text": "Welcome to MLBL League",
                "backgroundImage": "https://example.com/banner-bg.jpg"
            },
            "sidebar": {
                "backgroundColor": "#374151",
                "backgroundImage": "https://example.com/sidebar-bg.jpg",
                "opacity": 0.8
            },
            "navigation": {
                "style": "modern",
                "showIcons": True
            },
            "customCSS": ".custom-style { color: red; }",
            "lastModified": datetime.utcnow().isoformat()
        }
        
        try:
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=sample_website_style,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'websiteStyle updated successfully':
                    self.log_test(
                        "Save WebsiteStyle Data", 
                        True, 
                        f"WebsiteStyle data saved successfully with {len(sample_website_style)} properties", 
                        {"message": data.get('message'), "timestamp": data.get('timestamp')}
                    )
                    return True, sample_website_style
                else:
                    self.log_test(
                        "Save WebsiteStyle Data", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Save WebsiteStyle Data", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Save WebsiteStyle Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_verify_websitestyle_persistence(self, expected_data):
        """Test 3: GET /api/league-data again to verify websiteStyle data persists"""
        print("🔄 TEST 3: Verifying websiteStyle data persistence...")
        
        # Wait a moment for database write
        time.sleep(2)
        
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                website_style = data.get('websiteStyle', {})
                
                # Check if websiteStyle is empty object
                if not website_style or website_style == {}:
                    self.log_test(
                        "WebsiteStyle Persistence Verification", 
                        False, 
                        "❌ BUG CONFIRMED: websiteStyle is returning as empty object {} instead of saved data"
                    )
                    return False, website_style
                
                # Verify key properties exist
                expected_keys = ['theme', 'primaryColor', 'logo', 'banner', 'sidebar']
                missing_keys = [key for key in expected_keys if key not in website_style]
                
                if missing_keys:
                    self.log_test(
                        "WebsiteStyle Persistence Verification", 
                        False, 
                        f"❌ PARTIAL DATA LOSS: Missing keys: {missing_keys}. Current data: {json.dumps(website_style, indent=2)}"
                    )
                    return False, website_style
                
                # Check if data matches what we saved
                matches = True
                mismatches = []
                for key in expected_keys:
                    if key in expected_data and key in website_style:
                        if expected_data[key] != website_style[key]:
                            matches = False
                            mismatches.append(f"{key}: expected {expected_data[key]}, got {website_style[key]}")
                
                if matches and len(website_style) >= len(expected_keys):
                    self.log_test(
                        "WebsiteStyle Persistence Verification", 
                        True, 
                        f"✅ Data persisted correctly with {len(website_style)} properties", 
                        website_style
                    )
                    return True, website_style
                else:
                    self.log_test(
                        "WebsiteStyle Persistence Verification", 
                        False, 
                        f"❌ DATA MISMATCH: {mismatches if mismatches else 'Incomplete data'}"
                    )
                    return False, website_style
                    
            else:
                self.log_test(
                    "WebsiteStyle Persistence Verification", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "WebsiteStyle Persistence Verification", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_websitestyle_field_specific_check(self):
        """Test 4: Detailed analysis of websiteStyle field in response"""
        print("🔬 TEST 4: Detailed websiteStyle field analysis...")
        
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if websiteStyle field exists
                if 'websiteStyle' not in data:
                    self.log_test(
                        "WebsiteStyle Field Analysis", 
                        False, 
                        "❌ CRITICAL: websiteStyle field is missing from response"
                    )
                    return False
                
                website_style = data['websiteStyle']
                
                # Analyze the websiteStyle field
                analysis = {
                    "field_exists": True,
                    "field_type": type(website_style).__name__,
                    "is_empty_object": website_style == {},
                    "is_none": website_style is None,
                    "property_count": len(website_style) if isinstance(website_style, dict) else 0,
                    "properties": list(website_style.keys()) if isinstance(website_style, dict) else []
                }
                
                if website_style == {}:
                    self.log_test(
                        "WebsiteStyle Field Analysis", 
                        False, 
                        f"❌ BUG CONFIRMED: websiteStyle is empty object. Analysis: {json.dumps(analysis, indent=2)}"
                    )
                    return False
                elif website_style is None:
                    self.log_test(
                        "WebsiteStyle Field Analysis", 
                        False, 
                        f"❌ websiteStyle is null. Analysis: {json.dumps(analysis, indent=2)}"
                    )
                    return False
                else:
                    self.log_test(
                        "WebsiteStyle Field Analysis", 
                        True, 
                        f"✅ websiteStyle field contains data. Analysis: {json.dumps(analysis, indent=2)}", 
                        analysis
                    )
                    return True
                    
            else:
                self.log_test(
                    "WebsiteStyle Field Analysis", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "WebsiteStyle Field Analysis", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_multiple_save_retrieve_cycles(self):
        """Test 5: Multiple save/retrieve cycles to test consistency"""
        print("🔄 TEST 5: Multiple save/retrieve cycles...")
        
        test_cycles = [
            {"theme": "dark", "primaryColor": "#000000"},
            {"theme": "light", "primaryColor": "#ffffff", "logo": {"size": "small"}},
            {"theme": "custom", "banner": {"enabled": False}, "sidebar": {"opacity": 0.5}}
        ]
        
        all_cycles_passed = True
        
        for i, test_data in enumerate(test_cycles, 1):
            print(f"  Cycle {i}: Testing with {len(test_data)} properties...")
            
            # Save data
            try:
                save_response = requests.post(
                    f"{self.api_base}/league-data/websiteStyle", 
                    json=test_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if save_response.status_code != 200:
                    self.log_test(
                        f"Save/Retrieve Cycle {i}", 
                        False, 
                        f"Save failed: HTTP {save_response.status_code}"
                    )
                    all_cycles_passed = False
                    continue
                
                # Wait and retrieve
                time.sleep(1)
                
                retrieve_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if retrieve_response.status_code == 200:
                    data = retrieve_response.json()
                    website_style = data.get('websiteStyle', {})
                    
                    if website_style == {}:
                        self.log_test(
                            f"Save/Retrieve Cycle {i}", 
                            False, 
                            f"❌ Data lost: websiteStyle returned as empty object"
                        )
                        all_cycles_passed = False
                    else:
                        # Check if saved keys exist
                        saved_keys = list(test_data.keys())
                        retrieved_keys = list(website_style.keys())
                        missing_keys = [key for key in saved_keys if key not in retrieved_keys]
                        
                        if missing_keys:
                            self.log_test(
                                f"Save/Retrieve Cycle {i}", 
                                False, 
                                f"❌ Partial data loss: Missing keys {missing_keys}"
                            )
                            all_cycles_passed = False
                        else:
                            print(f"    ✅ Cycle {i} passed: All {len(saved_keys)} keys preserved")
                else:
                    self.log_test(
                        f"Save/Retrieve Cycle {i}", 
                        False, 
                        f"Retrieve failed: HTTP {retrieve_response.status_code}"
                    )
                    all_cycles_passed = False
                    
            except requests.exceptions.RequestException as e:
                self.log_test(
                    f"Save/Retrieve Cycle {i}", 
                    False, 
                    f"Connection error: {str(e)}"
                )
                all_cycles_passed = False
        
        if all_cycles_passed:
            self.log_test(
                "Multiple Save/Retrieve Cycles", 
                True, 
                f"✅ All {len(test_cycles)} cycles completed successfully"
            )
        else:
            self.log_test(
                "Multiple Save/Retrieve Cycles", 
                False, 
                f"❌ One or more cycles failed"
            )
        
        return all_cycles_passed

    def run_websitestyle_tests(self):
        """Run all websiteStyle-specific tests"""
        print("🎯 WEBSITESTYLE DATA PERSISTENCE BUG INVESTIGATION")
        print("=" * 80)
        print("Testing the reported issue where websiteStyle customizations are lost after deployments")
        print("Focus: websiteStyle field returning as empty object {} instead of saved data")
        print("=" * 80)
        
        # Test 1: Check initial state
        success1, initial_data = self.test_initial_websitestyle_data()
        
        # Test 2: Save comprehensive websiteStyle data
        success2, saved_data = self.test_save_websitestyle_data()
        
        if not success2:
            print("❌ Cannot continue testing - save operation failed")
            return False
        
        # Test 3: Verify persistence
        success3, retrieved_data = self.test_verify_websitestyle_persistence(saved_data)
        
        # Test 4: Detailed field analysis
        success4 = self.test_websitestyle_field_specific_check()
        
        # Test 5: Multiple cycles
        success5 = self.test_multiple_save_retrieve_cycles()
        
        # Summary
        print("=" * 80)
        print("🔍 WEBSITESTYLE BUG INVESTIGATION SUMMARY")
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
        
        # Bug analysis
        print("\n🐛 BUG ANALYSIS:")
        if not success3:
            print("❌ CRITICAL BUG CONFIRMED: websiteStyle data persistence is failing")
            print("   - Data is being saved but not retrieved correctly")
            print("   - websiteStyle field returns as empty object {} instead of saved data")
            print("   - This explains why user customizations are lost after deployments")
        elif success3 and success4 and success5:
            print("✅ websiteStyle persistence appears to be working correctly")
            print("   - Data saves and retrieves properly")
            print("   - Multiple save/retrieve cycles work")
            print("   - Bug may be intermittent or environment-specific")
        else:
            print("⚠️  Mixed results - websiteStyle persistence has issues")
            print("   - Some operations work, others fail")
            print("   - Indicates potential race conditions or partial failures")
        
        return success3 and success4 and success5

if __name__ == "__main__":
    try:
        tester = WebsiteStyleTester()
        success = tester.run_websitestyle_tests()
        
        if success:
            print("\n🎉 WebsiteStyle persistence tests completed - no critical bugs found!")
            sys.exit(0)
        else:
            print("\n⚠️  WebsiteStyle persistence bug confirmed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)