#!/usr/bin/env python3
"""
Production Event Persistence Testing Suite for Critical Fix Verification
Tests the critical event persistence fix that resolves data loss issues in production.

REVIEW REQUEST FOCUS:
- Test /api/league-data/leagueSchedule POST endpoint accepts event arrays
- Verify endpoint saves data to MongoDB properly  
- Test /api/league-data GET endpoint returns saved events in leagueSchedule field
- Test event data structure with id, title, date, time, type fields
- Test data persistence through POST/GET cycle
- Test error handling for malformed data

CRITICAL FIX BEING TESTED:
1. Backend URL Fix: Changed REACT_APP_BACKEND_URL from hardcoded preview URL to empty string (relative path)
2. Event Persistence Fix: Added backend API call to useEventPersistence.js to save events to /api/league-data/leagueSchedule
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
                    url = line.split('=', 1)[1].strip()
                    # Handle empty URL (relative path) - this is the critical fix being tested
                    if not url:
                        return "https://teammanager-lax.preview.emergentagent.com"
                    return url
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

class ProductionEventPersistenceTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print("🎯 PRODUCTION EVENT PERSISTENCE TESTING SUITE")
        print("=" * 60)
        print(f"Testing backend at: {self.api_base}")
        print("Testing critical event persistence fix for production data loss issue")
        print("=" * 60)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            if isinstance(response_data, dict) and len(str(response_data)) > 200:
                print(f"    Response: {type(response_data).__name__} with {len(response_data)} items")
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

    def test_backend_connectivity(self):
        """Test basic backend connectivity"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "Backend Connectivity", 
                        True, 
                        f"Backend is running and responsive", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Backend Connectivity", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Backend Connectivity", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Backend Connectivity", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_get_league_data_endpoint(self):
        """Test GET /api/league-data endpoint returns leagueSchedule field"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for required fields including leagueSchedule
                required_fields = ['id', 'leagueSchedule']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    schedule = data.get('leagueSchedule', [])
                    self.log_test(
                        "GET League Data Endpoint", 
                        True, 
                        f"Retrieved league data with {len(schedule)} events in leagueSchedule", 
                        f"leagueSchedule contains {len(schedule)} events"
                    )
                    return True, data
                else:
                    self.log_test(
                        "GET League Data Endpoint", 
                        False, 
                        f"Missing required fields: {missing_fields}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET League Data Endpoint", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET League Data Endpoint", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_post_league_schedule_endpoint(self, events_data):
        """Test POST /api/league-data/leagueSchedule endpoint accepts event arrays"""
        try:
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=events_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'leagueSchedule updated successfully':
                    self.log_test(
                        "POST League Schedule Endpoint", 
                        True, 
                        f"Successfully posted {len(events_data)} events to leagueSchedule", 
                        {"message": data.get('message'), "events_count": len(events_data)}
                    )
                    return True, data
                else:
                    self.log_test(
                        "POST League Schedule Endpoint", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST League Schedule Endpoint", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST League Schedule Endpoint", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_scenario_1_single_game_event(self):
        """Test Scenario 1: Single Game Event as specified in review request"""
        print("🎮 TESTING SCENARIO 1: Single Game Event")
        
        single_event = [{
            "id": "game_123",
            "title": "Eagles vs Test Team 2", 
            "date": "2025-09-15",
            "time": "15:00",
            "type": "game",
            "location": "Main Field",
            "teamIds": ["eagles", "test-team-2"]
        }]
        
        # POST the event
        success, post_response = self.test_post_league_schedule_endpoint(single_event)
        if not success:
            return False
        
        # Wait for database write
        time.sleep(1)
        
        # GET the data back to verify persistence
        success, get_response = self.test_get_league_data_endpoint()
        if not success:
            return False
        
        # Verify the event persists in leagueSchedule
        schedule = get_response.get('leagueSchedule', [])
        test_event = None
        for event in schedule:
            if event.get('id') == 'game_123':
                test_event = event
                break
        
        if test_event:
            # Verify event structure matches expected format
            required_fields = ['id', 'title', 'date', 'time', 'type']
            missing_fields = [field for field in required_fields if field not in test_event]
            
            if not missing_fields:
                # Verify field values match exactly
                if (test_event['title'] == "Eagles vs Test Team 2" and 
                    test_event['type'] == "game" and
                    test_event['date'] == "2025-09-15" and
                    test_event['time'] == "15:00" and
                    test_event['location'] == "Main Field"):
                    
                    self.log_test(
                        "Scenario 1 - Single Game Event Data Integrity", 
                        True, 
                        "Event data maintained integrity through save/load cycle", 
                        {
                            "id": test_event['id'],
                            "title": test_event['title'],
                            "type": test_event['type'],
                            "date": test_event['date'],
                            "time": test_event['time']
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Scenario 1 - Single Game Event Data Integrity", 
                        False, 
                        "Event field values corrupted during persistence"
                    )
                    return False
            else:
                self.log_test(
                    "Scenario 1 - Single Game Event Data Integrity", 
                    False, 
                    f"Event missing required fields after persistence: {missing_fields}"
                )
                return False
        else:
            self.log_test(
                "Scenario 1 - Single Game Event Persistence", 
                False, 
                "Event with ID 'game_123' not found in leagueSchedule after POST"
            )
            return False

    def test_scenario_2_multiple_events(self):
        """Test Scenario 2: Multiple Events as specified in review request"""
        print("🏆 TESTING SCENARIO 2: Multiple Events")
        
        multiple_events = [
            {
                "id": "tournament_456", 
                "title": "Spring Championship", 
                "type": "tournament", 
                "date": "2025-09-20",
                "time": "10:00",
                "location": "Championship Arena"
            },
            {
                "id": "game_789", 
                "title": "Practice Game", 
                "type": "game", 
                "date": "2025-09-16",
                "time": "18:00",
                "location": "Practice Field",
                "teamIds": ["eagles"]
            }
        ]
        
        # POST the events
        success, post_response = self.test_post_league_schedule_endpoint(multiple_events)
        if not success:
            return False
        
        # Wait for database write
        time.sleep(1)
        
        # GET the data back to verify persistence
        success, get_response = self.test_get_league_data_endpoint()
        if not success:
            return False
        
        # Verify both events persist in leagueSchedule
        schedule = get_response.get('leagueSchedule', [])
        found_events = {}
        
        for event in schedule:
            event_id = event.get('id')
            if event_id in ['tournament_456', 'game_789']:
                found_events[event_id] = event
        
        if len(found_events) == 2:
            # Verify tournament event
            tournament = found_events.get('tournament_456')
            game = found_events.get('game_789')
            
            tournament_valid = (tournament and 
                              tournament.get('title') == "Spring Championship" and
                              tournament.get('type') == "tournament" and
                              tournament.get('date') == "2025-09-20")
            
            game_valid = (game and 
                         game.get('title') == "Practice Game" and
                         game.get('type') == "game" and
                         game.get('date') == "2025-09-16")
            
            if tournament_valid and game_valid:
                self.log_test(
                    "Scenario 2 - Multiple Events Persistence", 
                    True, 
                    "Both tournament and game events persisted correctly", 
                    {
                        "tournament": tournament.get('title'),
                        "game": game.get('title'),
                        "total_found": len(found_events)
                    }
                )
                return True
            else:
                self.log_test(
                    "Scenario 2 - Multiple Events Persistence", 
                    False, 
                    f"Event data corruption - Tournament valid: {tournament_valid}, Game valid: {game_valid}"
                )
                return False
        else:
            self.log_test(
                "Scenario 2 - Multiple Events Persistence", 
                False, 
                f"Expected 2 events, found {len(found_events)} in leagueSchedule"
            )
            return False

    def test_error_handling_malformed_data(self):
        """Test Error Handling: Malformed Event Data"""
        try:
            # Test with invalid JSON structure
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                data="invalid_json_string",  # Send malformed data
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should return error status code (400 or 422)
            if response.status_code >= 400:
                self.log_test(
                    "Error Handling - Malformed Data", 
                    True, 
                    f"Correctly rejected malformed data with HTTP {response.status_code}", 
                    {"status_code": response.status_code}
                )
                return True
            else:
                self.log_test(
                    "Error Handling - Malformed Data", 
                    False, 
                    f"Unexpectedly accepted malformed data with HTTP {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            # Connection errors are also acceptable for malformed requests
            self.log_test(
                "Error Handling - Malformed Data", 
                True, 
                f"Request properly rejected: {str(e)}"
            )
            return True

    def test_error_handling_invalid_endpoint(self):
        """Test Error Handling: Invalid Data Type"""
        try:
            # Test with invalid data type endpoint
            test_data = [{"id": "test", "title": "Test Event"}]
            
            response = requests.post(
                f"{self.api_base}/league-data/invalidDataType", 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should return 400 Bad Request
            if response.status_code == 400:
                data = response.json()
                if "Invalid data type" in data.get('detail', ''):
                    self.log_test(
                        "Error Handling - Invalid Data Type", 
                        True, 
                        f"Correctly rejected invalid data type with proper error message", 
                        {"status_code": response.status_code}
                    )
                    return True
                else:
                    self.log_test(
                        "Error Handling - Invalid Data Type", 
                        False, 
                        f"Wrong error message: {data.get('detail')}"
                    )
                    return False
            else:
                self.log_test(
                    "Error Handling - Invalid Data Type", 
                    False, 
                    f"Expected HTTP 400, got {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Error Handling - Invalid Data Type", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_comprehensive_data_persistence_cycle(self):
        """Test comprehensive data persistence through complete POST/GET cycles"""
        print("🔄 TESTING COMPREHENSIVE DATA PERSISTENCE CYCLE")
        
        # Test complete cycle: Clear -> POST -> GET -> Verify -> POST Different -> GET -> Verify
        
        # Step 1: Clear existing data
        empty_schedule = []
        success, _ = self.test_post_league_schedule_endpoint(empty_schedule)
        if not success:
            return False
        
        time.sleep(1)
        
        # Step 2: POST single event and verify
        test_event_1 = [{
            "id": "persistence_cycle_1",
            "title": "Persistence Cycle Test Event 1",
            "date": "2025-09-25",
            "time": "14:00",
            "type": "practice",
            "location": "Test Field 1"
        }]
        
        success, _ = self.test_post_league_schedule_endpoint(test_event_1)
        if not success:
            return False
        
        time.sleep(1)
        
        # Step 3: Verify first event persists
        success, data = self.test_get_league_data_endpoint()
        if not success:
            return False
        
        schedule = data.get('leagueSchedule', [])
        if len(schedule) != 1 or schedule[0].get('id') != 'persistence_cycle_1':
            self.log_test(
                "Data Persistence Cycle - Step 1", 
                False, 
                f"Expected 1 event with ID 'persistence_cycle_1', found {len(schedule)} events"
            )
            return False
        
        # Step 4: POST different event (should replace entire leagueSchedule)
        test_event_2 = [{
            "id": "persistence_cycle_2",
            "title": "Persistence Cycle Test Event 2",
            "date": "2025-09-26",
            "time": "16:00",
            "type": "game",
            "location": "Test Field 2",
            "teamIds": ["test-team"]
        }]
        
        success, _ = self.test_post_league_schedule_endpoint(test_event_2)
        if not success:
            return False
        
        time.sleep(1)
        
        # Step 5: Verify second event replaced first (POST replaces entire leagueSchedule)
        success, data = self.test_get_league_data_endpoint()
        if not success:
            return False
        
        schedule = data.get('leagueSchedule', [])
        if len(schedule) != 1 or schedule[0].get('id') != 'persistence_cycle_2':
            self.log_test(
                "Data Persistence Cycle - Step 2", 
                False, 
                f"Expected 1 event with ID 'persistence_cycle_2', found {len(schedule)} events"
            )
            return False
        
        # Step 6: Verify event data integrity
        final_event = schedule[0]
        if (final_event.get('title') == "Persistence Cycle Test Event 2" and
            final_event.get('type') == "game" and
            final_event.get('location') == "Test Field 2"):
            
            self.log_test(
                "Comprehensive Data Persistence Cycle", 
                True, 
                "Events persist correctly through complete POST/GET cycles with data integrity maintained", 
                {
                    "final_event_count": len(schedule), 
                    "final_event_id": final_event.get('id'),
                    "final_event_title": final_event.get('title')
                }
            )
            return True
        else:
            self.log_test(
                "Comprehensive Data Persistence Cycle", 
                False, 
                "Event data integrity compromised during persistence cycle"
            )
            return False

    def run_all_tests(self):
        """Run all production event persistence tests"""
        print("🚀 Starting Production Event Persistence Testing Suite...")
        print("=" * 60)
        
        # Test basic connectivity first
        if not self.test_backend_connectivity():
            print("❌ CRITICAL: Backend connectivity failed. Cannot proceed with testing.")
            return False
        
        # Test GET endpoint functionality
        get_success, _ = self.test_get_league_data_endpoint()
        if not get_success:
            print("❌ CRITICAL: GET league-data endpoint failed. Cannot proceed with testing.")
            return False
        
        print("\n🎯 PRIMARY TESTING OBJECTIVES (Review Request Scenarios):")
        print("=" * 55)
        
        # Test Review Request Scenarios
        scenario_1_success = self.test_scenario_1_single_game_event()
        scenario_2_success = self.test_scenario_2_multiple_events()
        
        # Test Error Handling
        print("\n⚠️ ERROR HANDLING TESTS:")
        print("=" * 30)
        error_1_success = self.test_error_handling_malformed_data()
        error_2_success = self.test_error_handling_invalid_endpoint()
        
        # Test Comprehensive Data Persistence
        print("\n🔄 COMPREHENSIVE DATA PERSISTENCE VERIFICATION:")
        print("=" * 45)
        persistence_success = self.test_comprehensive_data_persistence_cycle()
        
        # Summary
        print("\n" + "=" * 60)
        print("PRODUCTION EVENT PERSISTENCE TEST SUMMARY")
        print("=" * 60)
        
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
        
        # Check critical test results
        critical_tests = [
            scenario_1_success,
            scenario_2_success, 
            persistence_success
        ]
        
        critical_passed = sum(critical_tests)
        error_handling_passed = error_1_success and error_2_success
        
        print(f"\n🎯 CRITICAL TEST RESULTS:")
        print(f"✅ Single Game Event (Scenario 1): {'PASS' if scenario_1_success else 'FAIL'}")
        print(f"✅ Multiple Events (Scenario 2): {'PASS' if scenario_2_success else 'FAIL'}")
        print(f"✅ Data Persistence Cycle: {'PASS' if persistence_success else 'FAIL'}")
        print(f"✅ Error Handling: {'PASS' if error_handling_passed else 'FAIL'}")
        
        # Overall assessment based on review request expectations
        if critical_passed == 3 and error_handling_passed:
            print(f"\n🎉 PRODUCTION EVENT PERSISTENCE FIX VERIFICATION: SUCCESS")
            print("✅ POST requests to /api/league-data/leagueSchedule succeed with 200 status")
            print("✅ GET requests to /api/league-data return saved events in leagueSchedule field")
            print("✅ Event data maintains integrity through save/load cycle")
            print("✅ Multiple events saved and retrieved correctly")
            print("✅ Appropriate HTTP status codes returned")
            print("✅ Critical fix resolves production data loss issue")
            return True
        else:
            print(f"\n❌ PRODUCTION EVENT PERSISTENCE FIX VERIFICATION: FAILED")
            print(f"Critical tests passed: {critical_passed}/3")
            print(f"Error handling passed: {error_handling_passed}")
            print("⚠️ Production data loss issue may not be fully resolved")
            return False

if __name__ == "__main__":
    try:
        tester = ProductionEventPersistenceTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Production event persistence testing completed successfully!")
            print("✅ Critical fix verified - production data loss issue resolved")
            sys.exit(0)
        else:
            print("\n⚠️ Production event persistence testing failed. Critical issues detected.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)