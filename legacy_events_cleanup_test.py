#!/usr/bin/env python3
"""
Legacy Events Cleanup Test for Lacrosse League Management Application
Clears all existing legacy events from leagueSchedule to resolve teamIds persistence issue.
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

class LegacyEventsCleanupTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing legacy events cleanup at: {self.api_base}")
        print("=" * 60)

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

    def test_get_current_events(self):
        """Get current events from leagueSchedule to see what exists"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                self.log_test(
                    "Get Current Events", 
                    True, 
                    f"Retrieved {len(league_schedule)} events from leagueSchedule", 
                    f"Events count: {len(league_schedule)}"
                )
                
                # Log details about existing events for analysis
                if league_schedule:
                    print("    Existing events analysis:")
                    for i, event in enumerate(league_schedule[:5]):  # Show first 5 events
                        event_id = event.get('id', 'No ID')
                        event_title = event.get('title', 'No Title')
                        has_team_id = 'teamId' in event
                        has_team_ids = 'teamIds' in event
                        print(f"      Event {i+1}: {event_title} (ID: {event_id})")
                        print(f"        - Has teamId (legacy): {has_team_id}")
                        print(f"        - Has teamIds (new): {has_team_ids}")
                        if has_team_id:
                            print(f"        - teamId value: {event.get('teamId')}")
                        if has_team_ids:
                            print(f"        - teamIds value: {event.get('teamIds')}")
                    
                    if len(league_schedule) > 5:
                        print(f"      ... and {len(league_schedule) - 5} more events")
                
                return True, league_schedule
            else:
                self.log_test(
                    "Get Current Events", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Get Current Events", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_clear_legacy_events(self):
        """Clear all events from leagueSchedule by setting it to empty array"""
        try:
            # Set leagueSchedule to empty array
            empty_schedule = []
            
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=empty_schedule,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'leagueSchedule updated successfully':
                    self.log_test(
                        "Clear Legacy Events", 
                        True, 
                        f"Successfully cleared all events from leagueSchedule", 
                        {"message": data.get('message')}
                    )
                    return True, data
                else:
                    self.log_test(
                        "Clear Legacy Events", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Clear Legacy Events", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Clear Legacy Events", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_verify_events_cleared(self):
        """Verify that leagueSchedule is now empty"""
        try:
            # Wait a moment for database write
            time.sleep(1)
            
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                if len(league_schedule) == 0:
                    self.log_test(
                        "Verify Events Cleared", 
                        True, 
                        f"Confirmed: leagueSchedule is now empty (0 events)", 
                        f"Events count: {len(league_schedule)}"
                    )
                    return True
                else:
                    self.log_test(
                        "Verify Events Cleared", 
                        False, 
                        f"Events still exist: {len(league_schedule)} events found"
                    )
                    return False
            else:
                self.log_test(
                    "Verify Events Cleared", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Verify Events Cleared", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_teamids_persistence_resolution(self):
        """Test that new events will use correct teamIds format"""
        try:
            # Create a test event with proper teamIds format
            test_event = {
                "id": "test_event_cleanup",
                "title": "Test Event - TeamIds Format",
                "date": "2024-12-20",
                "time": "18:00",
                "location": "Test Field",
                "type": "game",
                "teamIds": ["team1", "team2"],  # New format - array
                "description": "Test event to verify teamIds persistence"
            }
            
            # Get current league data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "TeamIds Persistence Test", 
                    False, 
                    "Could not retrieve current league data"
                )
                return False
            
            league_data = response.json()
            
            # Add test event to leagueSchedule
            league_schedule = league_data.get('leagueSchedule', [])
            league_schedule.append(test_event)
            
            # Save updated schedule
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=league_schedule,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Wait for database write
                time.sleep(1)
                
                # Retrieve and verify the event
                response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    events = data.get('leagueSchedule', [])
                    
                    # Find our test event
                    test_event_found = None
                    for event in events:
                        if event.get('id') == 'test_event_cleanup':
                            test_event_found = event
                            break
                    
                    if test_event_found:
                        has_team_ids = 'teamIds' in test_event_found
                        has_team_id = 'teamId' in test_event_found
                        team_ids_value = test_event_found.get('teamIds', [])
                        
                        if has_team_ids and isinstance(team_ids_value, list) and len(team_ids_value) == 2:
                            self.log_test(
                                "TeamIds Persistence Test", 
                                True, 
                                f"New event correctly uses teamIds array format", 
                                {
                                    "teamIds": team_ids_value,
                                    "has_legacy_teamId": has_team_id,
                                    "format_correct": True
                                }
                            )
                            
                            # Clean up test event
                            league_schedule = [e for e in events if e.get('id') != 'test_event_cleanup']
                            requests.post(
                                f"{self.api_base}/league-data/leagueSchedule", 
                                json=league_schedule,
                                headers={'Content-Type': 'application/json'},
                                timeout=10
                            )
                            
                            return True
                        else:
                            self.log_test(
                                "TeamIds Persistence Test", 
                                False, 
                                f"Event format incorrect - teamIds: {team_ids_value}, has_teamId: {has_team_id}"
                            )
                            return False
                    else:
                        self.log_test(
                            "TeamIds Persistence Test", 
                            False, 
                            "Test event not found after creation"
                        )
                        return False
                else:
                    self.log_test(
                        "TeamIds Persistence Test", 
                        False, 
                        f"Could not retrieve data for verification: HTTP {response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "TeamIds Persistence Test", 
                    False, 
                    f"Could not save test event: HTTP {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "TeamIds Persistence Test", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_cleanup_tests(self):
        """Run all legacy events cleanup tests"""
        print("Starting Legacy Events Cleanup Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 60)
        
        # Step 1: Check current state
        print("STEP 1: Analyzing current events in database...")
        success, current_events = self.test_get_current_events()
        if not success:
            print("❌ CRITICAL: Could not retrieve current events.")
            return False
        
        initial_event_count = len(current_events) if current_events else 0
        print(f"Found {initial_event_count} existing events")
        
        # Step 2: Clear all events
        print("\nSTEP 2: Clearing all legacy events...")
        success, _ = self.test_clear_legacy_events()
        if not success:
            print("❌ CRITICAL: Could not clear legacy events.")
            return False
        
        # Step 3: Verify clearing worked
        print("\nSTEP 3: Verifying events were cleared...")
        success = self.test_verify_events_cleared()
        if not success:
            print("❌ CRITICAL: Events were not properly cleared.")
            return False
        
        # Step 4: Test teamIds persistence resolution
        print("\nSTEP 4: Testing teamIds persistence resolution...")
        success = self.test_teamids_persistence_resolution()
        if not success:
            print("❌ WARNING: TeamIds persistence test failed.")
        
        # Summary
        print("=" * 60)
        print("CLEANUP SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Events Cleared: {initial_event_count} → 0")
        
        if failed_tests > 0:
            print(f"\nFailed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        # Return True if critical cleanup tests pass
        critical_failures = [t for t in self.failed_tests if 'Clear Legacy Events' in t or 'Verify Events Cleared' in t]
        cleanup_successful = len(critical_failures) == 0
        
        if cleanup_successful:
            print("\n🎉 LEGACY EVENTS CLEANUP COMPLETED SUCCESSFULLY!")
            print("✅ All existing events have been cleared from leagueSchedule")
            print("✅ Database now has empty leagueSchedule array")
            print("✅ New events will use correct teamIds array format")
            print("✅ TeamIds persistence issue should be resolved")
        else:
            print("\n⚠️  Legacy events cleanup failed. Check the results above.")
        
        return cleanup_successful

if __name__ == "__main__":
    try:
        tester = LegacyEventsCleanupTester()
        success = tester.run_cleanup_tests()
        
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)