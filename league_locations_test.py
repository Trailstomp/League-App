#!/usr/bin/env python3
"""
League Locations Backend Testing Suite
Specifically tests the league locations management bug where league locations 
created are not appearing in event dropdowns.

Focus Areas:
1. Test leagueLocations state persistence - verify if league locations can be stored and retrieved
2. Check the league data endpoints to see if leagueLocations are being saved properly
3. Verify that any new league location data persists through the API
4. Test GET/POST operations for league data containing leagueLocations array
5. Check if the leagueLocations array is being included in API responses
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

class LeagueLocationsTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🎯 LEAGUE LOCATIONS BACKEND TESTING")
        print(f"Testing backend at: {self.api_base}")
        print("=" * 70)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            if isinstance(response_data, dict) and len(str(response_data)) > 200:
                print(f"    Response: [Large object with {len(response_data)} keys]")
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

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "Basic API Connectivity", 
                        True, 
                        f"Status: {response.status_code}, Response time: {response.elapsed.total_seconds()*1000:.2f}ms"
                    )
                    return True
                else:
                    self.log_test("Basic API Connectivity", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Basic API Connectivity", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Basic API Connectivity", False, f"Connection error: {str(e)}")
            return False

    def test_get_initial_league_data(self):
        """Test GET /api/league-data to check current state"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if leagueLocations field exists
                has_league_locations = 'leagueLocations' in data
                league_locations = data.get('leagueLocations', [])
                
                self.log_test(
                    "GET Initial League Data", 
                    True, 
                    f"Retrieved league data. LeagueLocations field exists: {has_league_locations}, Count: {len(league_locations)}"
                )
                return True, data
            else:
                self.log_test("GET Initial League Data", False, f"HTTP {response.status_code}: {response.text}")
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test("GET Initial League Data", False, f"Connection error: {str(e)}")
            return False, None

    def test_save_league_locations_via_full_data(self):
        """Test saving league locations via POST /api/league-data (full data save)"""
        try:
            # First get current data
            success, current_data = self.test_get_initial_league_data()
            if not success:
                return False, None
            
            # Create test league locations
            test_locations = [
                {
                    "id": "loc_001",
                    "name": "Main Stadium",
                    "address": "123 Sports Ave, Athletic City, AC 12345",
                    "type": "Stadium",
                    "description": "Primary venue for championship games",
                    "capacity": 5000,
                    "facilities": ["Parking", "Concessions", "Restrooms"]
                },
                {
                    "id": "loc_002", 
                    "name": "Training Field A",
                    "address": "456 Practice Rd, Training Town, TT 67890",
                    "type": "Practice Field",
                    "description": "Main training facility with artificial turf",
                    "capacity": 500,
                    "facilities": ["Equipment Storage", "Water Station"]
                },
                {
                    "id": "loc_003",
                    "name": "Community Center",
                    "address": "789 Community Blvd, Hometown, HT 11111", 
                    "type": "Indoor Facility",
                    "description": "Indoor training and meeting space",
                    "capacity": 200,
                    "facilities": ["Meeting Rooms", "Locker Rooms", "Gym"]
                }
            ]
            
            # Prepare full league data with locations
            updated_data = current_data.copy()
            updated_data['leagueLocations'] = test_locations
            
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=updated_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    self.log_test(
                        "Save League Locations (Full Data)", 
                        True, 
                        f"Successfully saved {len(test_locations)} league locations via full data save"
                    )
                    return True, test_locations
                else:
                    self.log_test("Save League Locations (Full Data)", False, f"Unexpected response: {data}")
                    return False, None
            else:
                self.log_test("Save League Locations (Full Data)", False, f"HTTP {response.status_code}: {response.text}")
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test("Save League Locations (Full Data)", False, f"Connection error: {str(e)}")
            return False, None

    def test_retrieve_saved_league_locations(self):
        """Test retrieving saved league locations via GET /api/league-data"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                league_locations = data.get('leagueLocations', [])
                
                if len(league_locations) > 0:
                    # Verify structure of saved locations
                    first_location = league_locations[0]
                    required_fields = ['id', 'name', 'address', 'type']
                    
                    has_required_fields = all(field in first_location for field in required_fields)
                    
                    if has_required_fields:
                        self.log_test(
                            "Retrieve Saved League Locations", 
                            True, 
                            f"Successfully retrieved {len(league_locations)} league locations with proper structure",
                            f"Sample location: {first_location.get('name')} at {first_location.get('address')}"
                        )
                        return True, league_locations
                    else:
                        missing_fields = [f for f in required_fields if f not in first_location]
                        self.log_test(
                            "Retrieve Saved League Locations", 
                            False, 
                            f"League locations missing required fields: {missing_fields}"
                        )
                        return False, None
                else:
                    self.log_test(
                        "Retrieve Saved League Locations", 
                        False, 
                        "No league locations found in API response"
                    )
                    return False, None
            else:
                self.log_test("Retrieve Saved League Locations", False, f"HTTP {response.status_code}: {response.text}")
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test("Retrieve Saved League Locations", False, f"Connection error: {str(e)}")
            return False, None

    def test_save_league_locations_via_specific_endpoint(self):
        """Test saving league locations via POST /api/league-data/leagueLocations"""
        try:
            # Create additional test locations
            additional_locations = [
                {
                    "id": "loc_004",
                    "name": "Riverside Park Field",
                    "address": "321 River Rd, Riverside, RS 22222",
                    "type": "Outdoor Field", 
                    "description": "Scenic field by the river for recreational games",
                    "capacity": 300,
                    "facilities": ["Picnic Area", "Playground"]
                },
                {
                    "id": "loc_005",
                    "name": "High School Gymnasium", 
                    "address": "654 School St, Education City, EC 33333",
                    "type": "Indoor Gym",
                    "description": "School gym available for winter training",
                    "capacity": 800,
                    "facilities": ["Bleachers", "Sound System", "Scoreboard"]
                }
            ]
            
            response = requests.post(
                f"{self.api_base}/league-data/leagueLocations", 
                json=additional_locations,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'leagueLocations updated successfully':
                    self.log_test(
                        "Save League Locations (Specific Endpoint)", 
                        True, 
                        f"Successfully saved {len(additional_locations)} league locations via specific endpoint"
                    )
                    return True, additional_locations
                else:
                    self.log_test("Save League Locations (Specific Endpoint)", False, f"Unexpected response: {data}")
                    return False, None
            else:
                self.log_test("Save League Locations (Specific Endpoint)", False, f"HTTP {response.status_code}: {response.text}")
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test("Save League Locations (Specific Endpoint)", False, f"Connection error: {str(e)}")
            return False, None

    def test_league_locations_persistence(self):
        """Test that league locations persist through multiple API calls"""
        try:
            # Make multiple GET requests to verify consistency
            responses = []
            for i in range(3):
                response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    league_locations = data.get('leagueLocations', [])
                    responses.append(len(league_locations))
                    time.sleep(0.5)  # Small delay between requests
                else:
                    self.log_test("League Locations Persistence", False, f"Request {i+1} failed: HTTP {response.status_code}")
                    return False
            
            # Check if all responses have the same count
            if len(set(responses)) == 1 and responses[0] > 0:
                self.log_test(
                    "League Locations Persistence", 
                    True, 
                    f"League locations consistently returned {responses[0]} items across {len(responses)} requests"
                )
                return True
            elif responses[0] == 0:
                self.log_test(
                    "League Locations Persistence", 
                    False, 
                    "No league locations found in any request - data may not be persisting"
                )
                return False
            else:
                self.log_test(
                    "League Locations Persistence", 
                    False, 
                    f"Inconsistent league locations count across requests: {responses}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("League Locations Persistence", False, f"Connection error: {str(e)}")
            return False

    def test_league_locations_in_api_response_structure(self):
        """Test that leagueLocations array is properly included in API responses"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                expected_fields = ['id', 'teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
                
                # Check if leagueLocations is included
                has_league_locations_field = 'leagueLocations' in data
                league_locations = data.get('leagueLocations', [])
                
                # Verify other expected fields are present
                missing_fields = [f for f in expected_fields if f not in data]
                
                if has_league_locations_field and len(missing_fields) == 0:
                    self.log_test(
                        "League Locations in API Response Structure", 
                        True, 
                        f"LeagueLocations field properly included in API response with {len(league_locations)} items. All expected fields present."
                    )
                    return True
                elif not has_league_locations_field:
                    self.log_test(
                        "League Locations in API Response Structure", 
                        False, 
                        "LeagueLocations field missing from API response structure"
                    )
                    return False
                else:
                    self.log_test(
                        "League Locations in API Response Structure", 
                        False, 
                        f"API response missing expected fields: {missing_fields}"
                    )
                    return False
            else:
                self.log_test("League Locations in API Response Structure", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("League Locations in API Response Structure", False, f"Connection error: {str(e)}")
            return False

    def test_league_locations_data_integrity(self):
        """Test that league locations data maintains integrity through save/retrieve cycles"""
        try:
            # Create a test location with specific data
            test_location = {
                "id": "integrity_test_001",
                "name": "Data Integrity Test Field",
                "address": "999 Test Ave, Integrity City, IC 99999",
                "type": "Test Field",
                "description": "Field used for testing data integrity with special characters: àáâãäåæçèéêë",
                "capacity": 1234,
                "facilities": ["Test Facility 1", "Test Facility 2", "Special Chars: !@#$%^&*()"],
                "coordinates": {"lat": 40.7128, "lng": -74.0060},
                "metadata": {
                    "created": datetime.utcnow().isoformat(),
                    "testField": True,
                    "specialChars": "Testing: àáâãäåæçèéêë !@#$%^&*()"
                }
            }
            
            # Get current data and add test location
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test("League Locations Data Integrity", False, "Could not retrieve current data")
                return False
            
            current_data = response.json()
            current_locations = current_data.get('leagueLocations', [])
            
            # Add test location
            updated_locations = current_locations + [test_location]
            current_data['leagueLocations'] = updated_locations
            
            # Save updated data
            save_response = requests.post(
                f"{self.api_base}/league-data", 
                json=current_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if save_response.status_code != 200:
                self.log_test("League Locations Data Integrity", False, "Could not save test location")
                return False
            
            # Wait for save to complete
            time.sleep(1)
            
            # Retrieve and verify
            verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if verify_response.status_code != 200:
                self.log_test("League Locations Data Integrity", False, "Could not retrieve data for verification")
                return False
            
            verified_data = verify_response.json()
            verified_locations = verified_data.get('leagueLocations', [])
            
            # Find our test location
            found_location = None
            for loc in verified_locations:
                if loc.get('id') == test_location['id']:
                    found_location = loc
                    break
            
            if found_location:
                # Verify data integrity
                integrity_checks = [
                    found_location.get('name') == test_location['name'],
                    found_location.get('address') == test_location['address'],
                    found_location.get('capacity') == test_location['capacity'],
                    found_location.get('description') == test_location['description'],
                    len(found_location.get('facilities', [])) == len(test_location['facilities'])
                ]
                
                if all(integrity_checks):
                    self.log_test(
                        "League Locations Data Integrity", 
                        True, 
                        f"Test location data maintained perfect integrity through save/retrieve cycle. All fields preserved including special characters."
                    )
                    return True
                else:
                    self.log_test(
                        "League Locations Data Integrity", 
                        False, 
                        f"Data integrity compromised. Some fields were corrupted during save/retrieve cycle."
                    )
                    return False
            else:
                self.log_test(
                    "League Locations Data Integrity", 
                    False, 
                    f"Test location with ID {test_location['id']} not found after save"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("League Locations Data Integrity", False, f"Connection error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all league locations tests"""
        print("🎯 Starting League Locations Backend Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 70)
        
        # Test basic connectivity first
        if not self.test_basic_connectivity():
            print("❌ CRITICAL: API connectivity failed. Backend may not be running.")
            return False
        
        # Run league locations specific tests
        print("📍 Testing League Locations Functionality...")
        print("-" * 50)
        
        self.test_get_initial_league_data()
        self.test_save_league_locations_via_full_data()
        self.test_retrieve_saved_league_locations()
        self.test_save_league_locations_via_specific_endpoint()
        self.test_league_locations_persistence()
        self.test_league_locations_in_api_response_structure()
        self.test_league_locations_data_integrity()
        
        # Summary
        print("=" * 70)
        print("🎯 LEAGUE LOCATIONS TEST SUMMARY")
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
        
        # Specific assessment for league locations bug
        print("\n🔍 LEAGUE LOCATIONS BUG ASSESSMENT:")
        print("-" * 50)
        
        critical_tests = [
            "Save League Locations (Full Data)",
            "Retrieve Saved League Locations", 
            "League Locations Persistence",
            "League Locations in API Response Structure"
        ]
        
        critical_failures = [t for t in self.failed_tests if any(ct in t for ct in critical_tests)]
        
        if len(critical_failures) == 0:
            print("✅ League locations backend functionality is working correctly")
            print("✅ Data persistence is functioning properly")
            print("✅ API endpoints handle leagueLocations array correctly")
            print("✅ If locations aren't appearing in dropdowns, the issue is likely in frontend logic")
        else:
            print("❌ Critical league locations backend issues detected:")
            for failure in critical_failures:
                print(f"   - {failure}")
            print("❌ Backend API issues may be causing dropdown problems")
        
        return len(critical_failures) == 0

if __name__ == "__main__":
    try:
        tester = LeagueLocationsTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 League locations backend tests completed successfully!")
            print("💡 If locations still don't appear in event dropdowns, check frontend implementation.")
            sys.exit(0)
        else:
            print("\n⚠️  League locations backend tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)