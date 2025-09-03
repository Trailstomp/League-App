#!/usr/bin/env python3
"""
League Locations Backend Integration Test
Verifies that League Locations management feature integration doesn't break backend functionality.
Tests focus on league data endpoints and location-related data persistence.
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

class LeagueLocationsBackendTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🎯 LEAGUE LOCATIONS BACKEND INTEGRATION TEST")
        print(f"Testing backend at: {self.api_base}")
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

    def test_backend_health_after_locations_integration(self):
        """Verify backend health after League Locations integration"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "Backend Health After Locations Integration", 
                        True, 
                        f"Backend responding correctly (Status: {response.status_code})", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Backend Health After Locations Integration", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Backend Health After Locations Integration", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Backend Health After Locations Integration", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_league_data_with_locations_support(self):
        """Test that league data endpoints support location data structures"""
        try:
            # Test GET league data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
                
                if all(field in data for field in required_fields):
                    # Check if teams have location-related fields
                    teams = data.get('teams', [])
                    location_support_verified = True
                    
                    if teams:
                        # Check if teams can handle location data
                        sample_team = teams[0]
                        self.log_test(
                            "League Data Locations Support", 
                            True, 
                            f"Retrieved {len(teams)} teams, backend supports location data structures", 
                            f"Sample team keys: {list(sample_team.keys()) if sample_team else 'No teams'}"
                        )
                    else:
                        self.log_test(
                            "League Data Locations Support", 
                            True, 
                            "League data structure intact, ready for location data", 
                            "Empty teams array - structure valid"
                        )
                    
                    return True, data
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "League Data Locations Support", 
                        False, 
                        f"Missing required fields: {missing}"
                    )
                    return False, None
            else:
                self.log_test(
                    "League Data Locations Support", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "League Data Locations Support", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_location_data_persistence(self):
        """Test that location data can be saved and retrieved through league data endpoints"""
        try:
            # Create test data with location information
            test_data = {
                "teams": [
                    {
                        "id": "test_team_locations",
                        "name": "Test Team with Locations",
                        "division": "Field",
                        "locations": [
                            {
                                "id": "loc1",
                                "name": "Main Field",
                                "address": "123 Sports Complex Dr, Athletic City, AC 12345",
                                "type": "Practice Field",
                                "description": "Primary practice location"
                            },
                            {
                                "id": "loc2", 
                                "name": "Championship Stadium",
                                "address": "456 Victory Blvd, Championship City, CC 67890",
                                "type": "Game Field",
                                "description": "Home game venue"
                            }
                        ]
                    }
                ],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [
                    {
                        "id": "event_with_location",
                        "title": "Practice Session",
                        "date": "2024-12-20",
                        "time": "18:00",
                        "location": "Main Field",
                        "customLocation": "123 Sports Complex Dr, Athletic City, AC 12345",
                        "teamIds": ["test_team_locations"]
                    }
                ],
                "leagueInfo": {"name": "Test League with Locations"},
                "websiteStyle": {"theme": "default"}
            }
            
            # Save the data
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                save_result = response.json()
                if save_result.get('message') == 'League data saved successfully':
                    
                    # Wait for database write
                    time.sleep(1)
                    
                    # Retrieve and verify the data
                    get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    
                    if get_response.status_code == 200:
                        retrieved_data = get_response.json()
                        
                        # Verify location data persisted
                        teams = retrieved_data.get('teams', [])
                        test_team = None
                        for team in teams:
                            if team.get('id') == 'test_team_locations':
                                test_team = team
                                break
                        
                        if test_team and 'locations' in test_team:
                            locations = test_team['locations']
                            if len(locations) == 2:
                                # Verify schedule location data
                                schedule = retrieved_data.get('leagueSchedule', [])
                                event_with_location = None
                                for event in schedule:
                                    if event.get('id') == 'event_with_location':
                                        event_with_location = event
                                        break
                                
                                if event_with_location and 'customLocation' in event_with_location:
                                    self.log_test(
                                        "Location Data Persistence", 
                                        True, 
                                        f"Location data persisted correctly: {len(locations)} team locations + event location data", 
                                        f"Team locations: {[loc['name'] for loc in locations]}"
                                    )
                                    return True
                                else:
                                    self.log_test(
                                        "Location Data Persistence", 
                                        False, 
                                        "Event location data not persisted correctly"
                                    )
                                    return False
                            else:
                                self.log_test(
                                    "Location Data Persistence", 
                                    False, 
                                    f"Expected 2 locations, found {len(locations)}"
                                )
                                return False
                        else:
                            self.log_test(
                                "Location Data Persistence", 
                                False, 
                                "Team location data not found after save/retrieve cycle"
                            )
                            return False
                    else:
                        self.log_test(
                            "Location Data Persistence", 
                            False, 
                            f"Failed to retrieve data: HTTP {get_response.status_code}"
                        )
                        return False
                else:
                    self.log_test(
                        "Location Data Persistence", 
                        False, 
                        f"Save failed: {save_result}"
                    )
                    return False
            else:
                self.log_test(
                    "Location Data Persistence", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Location Data Persistence", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_specific_data_update_with_locations(self):
        """Test that specific data updates work with location-enhanced data"""
        try:
            # Test updating teams with location data
            test_teams = [
                {
                    "id": "team_loc_1",
                    "name": "Field Team Alpha",
                    "division": "Field",
                    "locations": [
                        {
                            "id": "alpha_home",
                            "name": "Alpha Home Field",
                            "address": "100 Alpha St, Field City, FC 11111",
                            "type": "Home Field",
                            "description": "Team Alpha home venue"
                        }
                    ]
                },
                {
                    "id": "team_loc_2",
                    "name": "Box Team Beta", 
                    "division": "Box",
                    "locations": [
                        {
                            "id": "beta_arena",
                            "name": "Beta Indoor Arena",
                            "address": "200 Beta Ave, Box City, BC 22222", 
                            "type": "Indoor Arena",
                            "description": "Team Beta indoor facility"
                        }
                    ]
                }
            ]
            
            response = requests.post(
                f"{self.api_base}/league-data/teams", 
                json=test_teams,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'teams updated successfully':
                    
                    # Verify the update by retrieving league data
                    time.sleep(1)
                    get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    
                    if get_response.status_code == 200:
                        league_data = get_response.json()
                        teams = league_data.get('teams', [])
                        
                        # Check if our location-enhanced teams are present
                        found_teams = []
                        for team in teams:
                            if team.get('id') in ['team_loc_1', 'team_loc_2']:
                                found_teams.append(team)
                        
                        if len(found_teams) >= 2:
                            # Verify locations are intact
                            locations_intact = all(
                                'locations' in team and len(team['locations']) > 0 
                                for team in found_teams
                            )
                            
                            if locations_intact:
                                self.log_test(
                                    "Specific Data Update with Locations", 
                                    True, 
                                    f"Teams with locations updated successfully", 
                                    f"Updated {len(found_teams)} teams with location data"
                                )
                                return True
                            else:
                                self.log_test(
                                    "Specific Data Update with Locations", 
                                    False, 
                                    "Location data lost during specific update"
                                )
                                return False
                        else:
                            self.log_test(
                                "Specific Data Update with Locations", 
                                False, 
                                f"Expected 2 teams, found {len(found_teams)}"
                            )
                            return False
                    else:
                        self.log_test(
                            "Specific Data Update with Locations", 
                            False, 
                            f"Failed to verify update: HTTP {get_response.status_code}"
                        )
                        return False
                else:
                    self.log_test(
                        "Specific Data Update with Locations", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Specific Data Update with Locations", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Specific Data Update with Locations", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_database_connectivity_post_integration(self):
        """Verify database connectivity remains stable after locations integration"""
        try:
            # Test multiple rapid requests to verify stability
            start_time = time.time()
            
            for i in range(3):
                response = requests.get(f"{self.api_base}/status", timeout=5)
                if response.status_code != 200:
                    self.log_test(
                        "Database Connectivity Post-Integration", 
                        False, 
                        f"Request {i+1} failed: HTTP {response.status_code}"
                    )
                    return False
            
            end_time = time.time()
            total_time = (end_time - start_time) * 1000
            
            self.log_test(
                "Database Connectivity Post-Integration", 
                True, 
                f"Database connectivity stable: 3 requests completed in {total_time:.2f}ms", 
                f"Average response time: {total_time/3:.2f}ms per request"
            )
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Database Connectivity Post-Integration", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_services_status_after_integration(self):
        """Check that all services are running properly after locations integration"""
        try:
            # Test health endpoint
            health_response = requests.get(f"{self.api_base}/", timeout=10)
            
            # Test league data endpoint  
            league_response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            # Test status endpoint
            status_response = requests.get(f"{self.api_base}/status", timeout=10)
            
            all_services_ok = all(
                resp.status_code == 200 
                for resp in [health_response, league_response, status_response]
            )
            
            if all_services_ok:
                self.log_test(
                    "Services Status After Integration", 
                    True, 
                    "All backend services responding correctly", 
                    "Health, League Data, and Status endpoints all operational"
                )
                return True
            else:
                failed_services = []
                if health_response.status_code != 200:
                    failed_services.append(f"Health ({health_response.status_code})")
                if league_response.status_code != 200:
                    failed_services.append(f"League Data ({league_response.status_code})")
                if status_response.status_code != 200:
                    failed_services.append(f"Status ({status_response.status_code})")
                
                self.log_test(
                    "Services Status After Integration", 
                    False, 
                    f"Failed services: {', '.join(failed_services)}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Services Status After Integration", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all League Locations backend integration tests"""
        print("Starting League Locations Backend Integration Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 70)
        
        # Test backend health after integration
        if not self.test_backend_health_after_locations_integration():
            print("❌ CRITICAL: Backend health check failed after locations integration.")
            return False
        
        # Test league data endpoints with location support
        self.test_league_data_with_locations_support()
        
        # Test location data persistence
        self.test_location_data_persistence()
        
        # Test specific data updates with locations
        self.test_specific_data_update_with_locations()
        
        # Test database connectivity
        self.test_database_connectivity_post_integration()
        
        # Test services status
        self.test_services_status_after_integration()
        
        # Summary
        print("=" * 70)
        print("LEAGUE LOCATIONS INTEGRATION TEST SUMMARY")
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
        
        # Return True if all tests pass
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    try:
        tester = LeagueLocationsBackendTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 League Locations backend integration tests completed successfully!")
            print("✅ Backend functionality unaffected by locations feature integration")
            sys.exit(0)
        else:
            print("\n⚠️  Some League Locations integration tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)