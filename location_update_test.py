#!/usr/bin/env python3
"""
Location Update Fix Testing Suite
Tests the location CRUD operations, especially the PUT endpoint that was causing 500 errors.
Focus on testing the fix for the 500 Internal Server Error issue.
"""

import requests
import json
import sys
from datetime import datetime
import time
import uuid

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

class LocationUpdateTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        self.created_locations = []  # Track created locations for cleanup
        
        print(f"🏟️ Testing Location Update Fix at: {self.api_base}")
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

    def test_get_locations(self):
        """Test GET /api/locations endpoint"""
        try:
            response = requests.get(f"{self.api_base}/locations", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "GET Locations", 
                        True, 
                        f"Retrieved {len(data)} locations", 
                        f"Count: {len(data)}"
                    )
                    return True, data
                else:
                    self.log_test(
                        "GET Locations", 
                        False, 
                        f"Expected list, got: {type(data)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET Locations", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET Locations", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_create_location_with_types_array(self):
        """Test POST /api/locations with new 'types' array format"""
        try:
            test_location = {
                "name": "Midwest Training Complex",
                "address": "123 Lacrosse Drive, Columbus, OH 43215",
                "types": ["practice_field", "training_facility"],  # Multiple types
                "indoor": False,
                "surface": "turf",
                "description": "Multi-purpose training facility with turf fields",
                "teamId": "test_team_001"
            }
            
            response = requests.post(
                f"{self.api_base}/locations", 
                json=test_location,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'name', 'address', 'types', 'indoor', 'surface']
                
                if all(field in data for field in required_fields):
                    if (data['name'] == test_location['name'] and 
                        data['types'] == test_location['types'] and
                        len(data['types']) == 2):
                        
                        self.created_locations.append(data['id'])
                        self.log_test(
                            "POST Location with Types Array", 
                            True, 
                            f"Created location with multiple types: {data['types']}", 
                            {k: v for k, v in data.items() if k not in ['createdAt', 'updatedAt']}
                        )
                        return True, data
                    else:
                        self.log_test(
                            "POST Location with Types Array", 
                            False, 
                            f"Data mismatch in created location"
                        )
                        return False, None
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "POST Location with Types Array", 
                        False, 
                        f"Missing required fields: {missing}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST Location with Types Array", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Location with Types Array", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_update_location_fix(self, location_id, original_data):
        """Test PUT /api/locations/{id} - This was the failing endpoint"""
        try:
            # Update the location with new data
            updated_data = original_data.copy()
            updated_data['name'] = "Updated Training Complex"
            updated_data['types'] = ["practice_field", "game_field", "training_facility"]  # Add game_field
            updated_data['description'] = "Updated description - now includes game field capability"
            updated_data['surface'] = "grass"  # Change surface
            
            response = requests.put(
                f"{self.api_base}/locations/{location_id}", 
                json=updated_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify the update was successful
                if (data['name'] == updated_data['name'] and 
                    data['types'] == updated_data['types'] and
                    data['description'] == updated_data['description'] and
                    data['surface'] == updated_data['surface']):
                    
                    self.log_test(
                        "PUT Location Update (Critical Fix)", 
                        True, 
                        f"Successfully updated location - 500 error fix working!", 
                        {
                            'name': data['name'],
                            'types': data['types'],
                            'surface': data['surface'],
                            'description': data['description'][:50] + "..."
                        }
                    )
                    return True, data
                else:
                    self.log_test(
                        "PUT Location Update (Critical Fix)", 
                        False, 
                        f"Update did not persist correctly"
                    )
                    return False, None
            else:
                self.log_test(
                    "PUT Location Update (Critical Fix)", 
                    False, 
                    f"HTTP {response.status_code}: {response.text} - 500 ERROR STILL PRESENT!"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "PUT Location Update (Critical Fix)", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_update_nonexistent_location(self):
        """Test PUT request to non-existent location ID to verify 404 handling"""
        try:
            fake_id = str(uuid.uuid4())
            test_data = {
                "name": "Non-existent Location",
                "address": "Fake Address",
                "types": ["practice_field"],
                "indoor": False,
                "surface": "grass"
            }
            
            response = requests.put(
                f"{self.api_base}/locations/{fake_id}", 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 404:
                self.log_test(
                    "PUT Non-existent Location (404 Handling)", 
                    True, 
                    f"Correctly returned 404 for non-existent location", 
                    f"Status: {response.status_code}"
                )
                return True
            else:
                self.log_test(
                    "PUT Non-existent Location (404 Handling)", 
                    False, 
                    f"Expected 404, got HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "PUT Non-existent Location (404 Handling)", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_invalid_data_validation(self):
        """Test invalid data formats to verify validation"""
        try:
            # Test with missing required fields
            invalid_data = {
                "name": "Invalid Location"
                # Missing address, types, etc.
            }
            
            response = requests.post(
                f"{self.api_base}/locations", 
                json=invalid_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 422:  # Validation error
                self.log_test(
                    "POST Invalid Data Validation", 
                    True, 
                    f"Correctly returned 422 for invalid data", 
                    f"Status: {response.status_code}"
                )
                return True
            else:
                self.log_test(
                    "POST Invalid Data Validation", 
                    False, 
                    f"Expected 422, got HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Invalid Data Validation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_multiple_types_support(self):
        """Test creating and updating location with multiple types"""
        try:
            # Create location with multiple types
            multi_type_location = {
                "name": "Multi-Purpose Sports Complex",
                "address": "456 Sports Way, Cincinnati, OH 45202",
                "types": ["practice_field", "game_field", "social_venue"],
                "indoor": True,
                "surface": "indoor_court",
                "description": "Indoor complex supporting multiple activities",
                "teamId": ""  # League-wide location
            }
            
            response = requests.post(
                f"{self.api_base}/locations", 
                json=multi_type_location,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if len(data['types']) == 3 and all(t in data['types'] for t in multi_type_location['types']):
                    self.created_locations.append(data['id'])
                    
                    # Now test updating the types array
                    updated_types = ["practice_field", "game_field"]  # Remove social_venue
                    data['types'] = updated_types
                    
                    update_response = requests.put(
                        f"{self.api_base}/locations/{data['id']}", 
                        json=data,
                        headers={'Content-Type': 'application/json'},
                        timeout=10
                    )
                    
                    if update_response.status_code == 200:
                        updated_data = update_response.json()
                        
                        if updated_data['types'] == updated_types:
                            self.log_test(
                                "Multiple Types Support", 
                                True, 
                                f"Successfully created and updated multi-type location", 
                                {
                                    'original_types': multi_type_location['types'],
                                    'updated_types': updated_data['types']
                                }
                            )
                            return True, updated_data
                        else:
                            self.log_test(
                                "Multiple Types Support", 
                                False, 
                                f"Types update failed"
                            )
                            return False, None
                    else:
                        self.log_test(
                            "Multiple Types Support", 
                            False, 
                            f"Update failed: HTTP {update_response.status_code}"
                        )
                        return False, None
                else:
                    self.log_test(
                        "Multiple Types Support", 
                        False, 
                        f"Types array not created correctly"
                    )
                    return False, None
            else:
                self.log_test(
                    "Multiple Types Support", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Multiple Types Support", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_data_migration(self):
        """Test that startup migration handles any old 'type' field data"""
        try:
            # Get all locations to check if any have old 'type' field
            success, locations = self.test_get_locations()
            
            if success:
                old_format_found = False
                new_format_count = 0
                
                for location in locations:
                    if 'type' in location and 'types' not in location:
                        old_format_found = True
                    elif 'types' in location and isinstance(location['types'], list):
                        new_format_count += 1
                
                if old_format_found:
                    self.log_test(
                        "Data Migration Check", 
                        False, 
                        f"Found locations with old 'type' field - migration incomplete"
                    )
                    return False
                else:
                    self.log_test(
                        "Data Migration Check", 
                        True, 
                        f"All {new_format_count} locations use new 'types' array format", 
                        f"Migration successful"
                    )
                    return True
            else:
                self.log_test(
                    "Data Migration Check", 
                    False, 
                    f"Could not retrieve locations for migration check"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Data Migration Check", 
                False, 
                f"Migration check error: {str(e)}"
            )
            return False

    def test_delete_location(self, location_id):
        """Test DELETE /api/locations/{id} for cleanup"""
        try:
            response = requests.delete(f"{self.api_base}/locations/{location_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'Location deleted successfully':
                    self.log_test(
                        f"DELETE Location ({location_id[:8]}...)", 
                        True, 
                        f"Location deleted successfully", 
                        {"message": data.get('message')}
                    )
                    return True
                else:
                    self.log_test(
                        f"DELETE Location ({location_id[:8]}...)", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    f"DELETE Location ({location_id[:8]}...)", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                f"DELETE Location ({location_id[:8]}...)", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def cleanup_created_locations(self):
        """Clean up locations created during testing"""
        print("\n🧹 Cleaning up test locations...")
        for location_id in self.created_locations:
            self.test_delete_location(location_id)

    def run_location_update_tests(self):
        """Run all location update fix tests"""
        print("🏟️ Starting Location Update Fix Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 70)
        
        # Test 1: Basic GET locations
        success, initial_locations = self.test_get_locations()
        if not success:
            print("❌ CRITICAL: Could not retrieve locations. Backend may not be running.")
            return False
        
        # Test 2: Data migration check
        self.test_data_migration()
        
        # Test 3: Create location with types array (new format)
        success, created_location = self.test_create_location_with_types_array()
        if not success:
            print("❌ CRITICAL: Could not create location with types array.")
            return False
        
        # Test 4: THE CRITICAL TEST - Update location (this was causing 500 errors)
        print("\n🎯 CRITICAL TEST - Location Update (Previously Causing 500 Errors):")
        success, updated_location = self.test_update_location_fix(created_location['id'], created_location)
        if not success:
            print("❌ CRITICAL: Location update still failing - 500 error fix not working!")
            self.cleanup_created_locations()
            return False
        
        # Test 5: Error handling validation
        print("\n🔍 Testing Error Handling:")
        self.test_update_nonexistent_location()
        self.test_invalid_data_validation()
        
        # Test 6: Multiple types support
        print("\n🏷️ Testing Multiple Types Support:")
        self.test_multiple_types_support()
        
        # Test 7: Verify GET after all operations
        print("\n✅ Final Verification:")
        success, final_locations = self.test_get_locations()
        
        # Cleanup
        self.cleanup_created_locations()
        
        # Summary
        print("=" * 70)
        print("LOCATION UPDATE FIX TEST SUMMARY")
        print("=" * 70)
        
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
        
        # Check for critical failures
        critical_failures = [t for t in self.failed_tests if 'PUT Location Update (Critical Fix)' in t]
        
        if critical_failures:
            print(f"\n🚨 CRITICAL ISSUE: Location update fix is NOT working!")
            print("The 500 Internal Server Error issue is still present.")
            return False
        else:
            print(f"\n🎉 SUCCESS: Location update fix is working correctly!")
            print("The 500 Internal Server Error issue has been resolved.")
            return True

if __name__ == "__main__":
    try:
        tester = LocationUpdateTester()
        success = tester.run_location_update_tests()
        
        if success:
            print("\n🎉 Location update fix tests completed successfully!")
            print("✅ The 500 Internal Server Error issue has been resolved.")
            sys.exit(0)
        else:
            print("\n⚠️  Location update fix tests failed. Check the results above.")
            print("❌ The 500 Internal Server Error issue may still be present.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)