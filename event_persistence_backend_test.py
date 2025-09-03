#!/usr/bin/env python3
"""
Event Data Persistence Backend Testing Suite
Focused testing for event editing data persistence fixes as requested in review.
Tests: imageUrl, teamIds, custom locations, and database integrity.
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

class EventPersistenceTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Event Data Persistence at: {self.api_base}")
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
                        f"Status: {response.status_code}", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Basic API Connectivity", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Basic API Connectivity", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Basic API Connectivity", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_event_image_persistence(self):
        """Test event imageUrl persistence through save/reload cycle"""
        try:
            # Create test event data with imageUrl
            test_event_data = {
                "leagueSchedule": [
                    {
                        "id": "test_event_img_001",
                        "title": "Test Event with Image",
                        "date": "2024-09-15",
                        "time": "18:00",
                        "location": "Test Field",
                        "type": "game",
                        "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
                        "teamIds": ["team1", "team2"],
                        "homeScore": 5,
                        "awayScore": 3
                    }
                ]
            }
            
            # Save the event data
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=test_event_data["leagueSchedule"],
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test(
                    "Event Image Persistence - Save", 
                    False, 
                    f"Failed to save event: HTTP {response.status_code}: {response.text}"
                )
                return False
            
            # Wait for database write
            time.sleep(1)
            
            # Retrieve the data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                # Find our test event
                test_event = None
                for event in events:
                    if event.get('id') == 'test_event_img_001':
                        test_event = event
                        break
                
                if test_event:
                    # Check if imageUrl persisted correctly
                    if test_event.get('imageUrl') == test_event_data["leagueSchedule"][0]["imageUrl"]:
                        self.log_test(
                            "Event Image Persistence", 
                            True, 
                            f"ImageUrl persisted correctly ({len(test_event.get('imageUrl', ''))} chars)", 
                            f"Event ID: {test_event.get('id')}"
                        )
                        return True
                    else:
                        self.log_test(
                            "Event Image Persistence", 
                            False, 
                            f"ImageUrl mismatch or missing. Expected length: {len(test_event_data['leagueSchedule'][0]['imageUrl'])}, Got: {len(test_event.get('imageUrl', ''))}"
                        )
                        return False
                else:
                    self.log_test(
                        "Event Image Persistence", 
                        False, 
                        "Test event not found in retrieved data"
                    )
                    return False
            else:
                self.log_test(
                    "Event Image Persistence", 
                    False, 
                    f"Failed to retrieve data: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Image Persistence", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_event_team_selection_persistence(self):
        """Test event teamIds persistence through save/reload cycle"""
        try:
            # Create test event data with teamIds
            test_event_data = {
                "leagueSchedule": [
                    {
                        "id": "test_event_teams_001",
                        "title": "Test Event with Teams",
                        "date": "2024-09-16",
                        "time": "19:00",
                        "location": "Test Arena",
                        "type": "tournament",
                        "teamIds": ["team_alpha", "team_beta", "team_gamma"],
                        "homeScore": 0,
                        "awayScore": 0
                    }
                ]
            }
            
            # Save the event data
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=test_event_data["leagueSchedule"],
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test(
                    "Event Team Selection Persistence - Save", 
                    False, 
                    f"Failed to save event: HTTP {response.status_code}: {response.text}"
                )
                return False
            
            # Wait for database write
            time.sleep(1)
            
            # Retrieve the data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                # Find our test event
                test_event = None
                for event in events:
                    if event.get('id') == 'test_event_teams_001':
                        test_event = event
                        break
                
                if test_event:
                    # Check if teamIds persisted correctly
                    expected_teams = test_event_data["leagueSchedule"][0]["teamIds"]
                    actual_teams = test_event.get('teamIds', [])
                    
                    if actual_teams == expected_teams:
                        self.log_test(
                            "Event Team Selection Persistence", 
                            True, 
                            f"TeamIds persisted correctly ({len(actual_teams)} teams)", 
                            f"Teams: {actual_teams}"
                        )
                        return True
                    else:
                        self.log_test(
                            "Event Team Selection Persistence", 
                            False, 
                            f"TeamIds mismatch. Expected: {expected_teams}, Got: {actual_teams}"
                        )
                        return False
                else:
                    self.log_test(
                        "Event Team Selection Persistence", 
                        False, 
                        "Test event not found in retrieved data"
                    )
                    return False
            else:
                self.log_test(
                    "Event Team Selection Persistence", 
                    False, 
                    f"Failed to retrieve data: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Team Selection Persistence", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_custom_location_persistence(self):
        """Test custom location data persistence"""
        try:
            # Create test event data with custom location
            test_event_data = {
                "leagueSchedule": [
                    {
                        "id": "test_event_location_001",
                        "title": "Test Event with Custom Location",
                        "date": "2024-09-17",
                        "time": "20:00",
                        "location": "Custom Field - 123 Main St, Anytown, ST 12345",
                        "customLocation": {
                            "name": "Custom Field",
                            "address": "123 Main St, Anytown, ST 12345",
                            "type": "outdoor",
                            "description": "Test custom location for event"
                        },
                        "type": "practice",
                        "teamIds": ["team_delta"]
                    }
                ]
            }
            
            # Save the event data
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=test_event_data["leagueSchedule"],
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test(
                    "Custom Location Persistence - Save", 
                    False, 
                    f"Failed to save event: HTTP {response.status_code}: {response.text}"
                )
                return False
            
            # Wait for database write
            time.sleep(1)
            
            # Retrieve the data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                # Find our test event
                test_event = None
                for event in events:
                    if event.get('id') == 'test_event_location_001':
                        test_event = event
                        break
                
                if test_event:
                    # Check if custom location persisted correctly
                    expected_location = test_event_data["leagueSchedule"][0]["customLocation"]
                    actual_location = test_event.get('customLocation')
                    
                    if actual_location and actual_location == expected_location:
                        self.log_test(
                            "Custom Location Persistence", 
                            True, 
                            f"Custom location persisted correctly", 
                            f"Location: {actual_location.get('name')} - {actual_location.get('address')}"
                        )
                        return True
                    else:
                        self.log_test(
                            "Custom Location Persistence", 
                            False, 
                            f"Custom location mismatch or missing. Expected: {expected_location}, Got: {actual_location}"
                        )
                        return False
                else:
                    self.log_test(
                        "Custom Location Persistence", 
                        False, 
                        "Test event not found in retrieved data"
                    )
                    return False
            else:
                self.log_test(
                    "Custom Location Persistence", 
                    False, 
                    f"Failed to retrieve data: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Custom Location Persistence", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_league_data_operations(self):
        """Test basic league data GET/POST operations"""
        try:
            # Test GET operation
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code != 200:
                self.log_test(
                    "League Data GET Operation", 
                    False, 
                    f"GET failed: HTTP {response.status_code}: {response.text}"
                )
                return False
            
            data = response.json()
            required_fields = ['id', 'teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
            
            if not all(field in data for field in required_fields):
                missing = [f for f in required_fields if f not in data]
                self.log_test(
                    "League Data GET Operation", 
                    False, 
                    f"Missing required fields: {missing}"
                )
                return False
            
            # Test POST operation
            test_data = {
                "teams": [{"id": "test_team_persist", "name": "Test Persistence Team"}],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {"name": "Test League Persistence"},
                "websiteStyle": {"theme": "persistence_test"}
            }
            
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('message') == 'League data saved successfully':
                    self.log_test(
                        "League Data GET/POST Operations", 
                        True, 
                        f"Both GET and POST operations successful", 
                        {"message": result.get('message')}
                    )
                    return True
                else:
                    self.log_test(
                        "League Data GET/POST Operations", 
                        False, 
                        f"POST unexpected response: {result}"
                    )
                    return False
            else:
                self.log_test(
                    "League Data GET/POST Operations", 
                    False, 
                    f"POST failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "League Data GET/POST Operations", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_database_integrity(self):
        """Test database integrity after multiple operations"""
        try:
            # Get initial state
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Database Integrity Check", 
                    False, 
                    f"Failed to get initial state: HTTP {response.status_code}"
                )
                return False
            
            initial_data = response.json()
            initial_events_count = len(initial_data.get('leagueSchedule', []))
            
            # Perform multiple operations
            operations_successful = 0
            
            # Operation 1: Add event with image
            if self.test_event_image_persistence():
                operations_successful += 1
            
            # Operation 2: Add event with teams
            if self.test_event_team_selection_persistence():
                operations_successful += 1
            
            # Operation 3: Add event with custom location
            if self.test_custom_location_persistence():
                operations_successful += 1
            
            # Check final state
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Database Integrity Check", 
                    False, 
                    f"Failed to get final state: HTTP {response.status_code}"
                )
                return False
            
            final_data = response.json()
            final_events_count = len(final_data.get('leagueSchedule', []))
            
            # Verify integrity
            if operations_successful == 3 and final_events_count >= initial_events_count + 3:
                self.log_test(
                    "Database Integrity Check", 
                    True, 
                    f"Database integrity maintained. Events increased from {initial_events_count} to {final_events_count}", 
                    f"All {operations_successful} operations successful"
                )
                return True
            else:
                self.log_test(
                    "Database Integrity Check", 
                    False, 
                    f"Integrity issues detected. Operations successful: {operations_successful}/3, Events: {initial_events_count} -> {final_events_count}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Database Integrity Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all event persistence tests"""
        print("Starting Event Data Persistence Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 70)
        
        # Test basic connectivity first
        if not self.test_basic_connectivity():
            print("❌ CRITICAL: API connectivity failed. Backend may not be running.")
            return False
        
        # Test league data operations
        self.test_league_data_operations()
        
        # Test specific event persistence features
        self.test_event_image_persistence()
        self.test_event_team_selection_persistence()
        self.test_custom_location_persistence()
        
        # Test overall database integrity
        self.test_database_integrity()
        
        # Summary
        print("=" * 70)
        print("EVENT PERSISTENCE TEST SUMMARY")
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
        
        # Return True if all critical tests pass
        critical_failures = [t for t in self.failed_tests if 'Connectivity' in t or 'Integrity' in t]
        return len(critical_failures) == 0

if __name__ == "__main__":
    try:
        tester = EventPersistenceTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Event persistence tests completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some event persistence tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)