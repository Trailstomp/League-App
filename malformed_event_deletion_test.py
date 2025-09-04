#!/usr/bin/env python3
"""
Malformed Event Deletion Test Suite
Tests the deletion of the specific malformed event 'event_1757005972864' with title 'ggg'
that is causing display issues in the frontend ticker.
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

class MalformedEventDeletionTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        self.malformed_event_id = 'event_1757005972864'
        self.malformed_event_title = 'ggg'
        
        print(f"Testing malformed event deletion at: {self.api_base}")
        print(f"Target Event ID: {self.malformed_event_id}")
        print(f"Target Event Title: {self.malformed_event_title}")
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

    def test_get_current_league_data(self):
        """Get current league data to check for malformed event"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                self.log_test(
                    "Get Current League Data", 
                    True, 
                    f"Retrieved league data with {len(league_schedule)} events in schedule", 
                    f"Total events: {len(league_schedule)}"
                )
                return True, data
            else:
                self.log_test(
                    "Get Current League Data", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Get Current League Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_find_malformed_event(self, league_data):
        """Check if the malformed event exists in the current data"""
        try:
            league_schedule = league_data.get('leagueSchedule', [])
            malformed_event = None
            
            # Search for the specific malformed event
            for event in league_schedule:
                if event.get('id') == self.malformed_event_id:
                    malformed_event = event
                    break
            
            if malformed_event:
                # Verify it's the problematic event
                title = malformed_event.get('title', '')
                team_ids = malformed_event.get('teamIds', [])
                location = malformed_event.get('location', '')
                
                is_malformed = (
                    title == self.malformed_event_title and 
                    (not team_ids or len(team_ids) == 0)
                )
                
                if is_malformed:
                    self.log_test(
                        "Find Malformed Event", 
                        True, 
                        f"Found malformed event: ID={self.malformed_event_id}, Title='{title}', TeamIds={team_ids}, Location='{location}'", 
                        {
                            "id": self.malformed_event_id,
                            "title": title,
                            "teamIds": team_ids,
                            "location": location,
                            "type": malformed_event.get('type', 'unknown')
                        }
                    )
                    return True, malformed_event
                else:
                    self.log_test(
                        "Find Malformed Event", 
                        False, 
                        f"Event found but not malformed as expected. Title='{title}', TeamIds={team_ids}"
                    )
                    return False, malformed_event
            else:
                self.log_test(
                    "Find Malformed Event", 
                    False, 
                    f"Malformed event with ID '{self.malformed_event_id}' not found in league schedule"
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Find Malformed Event", 
                False, 
                f"Error searching for malformed event: {str(e)}"
            )
            return False, None

    def test_delete_malformed_event(self, league_data, malformed_event):
        """Delete the malformed event from the league schedule"""
        try:
            # Create a copy of league data without the malformed event
            updated_league_data = league_data.copy()
            original_schedule = updated_league_data.get('leagueSchedule', [])
            
            # Filter out the malformed event
            updated_schedule = [
                event for event in original_schedule 
                if event.get('id') != self.malformed_event_id
            ]
            
            updated_league_data['leagueSchedule'] = updated_schedule
            
            # Save the updated data
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=updated_league_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    events_removed = len(original_schedule) - len(updated_schedule)
                    self.log_test(
                        "Delete Malformed Event", 
                        True, 
                        f"Successfully deleted malformed event. Events removed: {events_removed}, Schedule size: {len(original_schedule)} → {len(updated_schedule)}", 
                        {"message": data.get('message'), "events_removed": events_removed}
                    )
                    return True, updated_league_data
                else:
                    self.log_test(
                        "Delete Malformed Event", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Delete Malformed Event", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Delete Malformed Event", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None
        except Exception as e:
            self.log_test(
                "Delete Malformed Event", 
                False, 
                f"Error deleting malformed event: {str(e)}"
            )
            return False, None

    def test_verify_event_deletion(self):
        """Verify the malformed event is no longer in the database"""
        try:
            # Wait a moment for database write
            time.sleep(1)
            
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                # Check if malformed event still exists
                malformed_event_exists = any(
                    event.get('id') == self.malformed_event_id 
                    for event in league_schedule
                )
                
                if not malformed_event_exists:
                    self.log_test(
                        "Verify Event Deletion", 
                        True, 
                        f"Malformed event successfully removed. Current schedule has {len(league_schedule)} events", 
                        f"Event ID '{self.malformed_event_id}' not found"
                    )
                    return True, data
                else:
                    # Find the event that still exists
                    remaining_event = next(
                        (event for event in league_schedule if event.get('id') == self.malformed_event_id), 
                        None
                    )
                    self.log_test(
                        "Verify Event Deletion", 
                        False, 
                        f"Malformed event still exists in database: {remaining_event}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Verify Event Deletion", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Verify Event Deletion", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_api_endpoints_after_deletion(self):
        """Test that API endpoints still work correctly after deletion"""
        try:
            # Test health check
            health_response = requests.get(f"{self.api_base}/", timeout=10)
            health_ok = health_response.status_code == 200
            
            # Test league data retrieval
            data_response = requests.get(f"{self.api_base}/league-data", timeout=10)
            data_ok = data_response.status_code == 200
            
            # Test status endpoint
            status_response = requests.get(f"{self.api_base}/status", timeout=10)
            status_ok = status_response.status_code == 200
            
            all_endpoints_ok = health_ok and data_ok and status_ok
            
            if all_endpoints_ok:
                self.log_test(
                    "API Endpoints After Deletion", 
                    True, 
                    f"All API endpoints working correctly after deletion", 
                    {
                        "health_check": health_ok,
                        "league_data": data_ok,
                        "status": status_ok
                    }
                )
                return True
            else:
                failed_endpoints = []
                if not health_ok:
                    failed_endpoints.append(f"health_check ({health_response.status_code})")
                if not data_ok:
                    failed_endpoints.append(f"league_data ({data_response.status_code})")
                if not status_ok:
                    failed_endpoints.append(f"status ({status_response.status_code})")
                
                self.log_test(
                    "API Endpoints After Deletion", 
                    False, 
                    f"Some endpoints failed: {', '.join(failed_endpoints)}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "API Endpoints After Deletion", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_data_integrity_after_deletion(self):
        """Test that other data remains intact after malformed event deletion"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check that all required fields are still present
                required_fields = ['id', 'teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Check that other data sections have content (if they had before)
                    teams_count = len(data.get('teams', []))
                    news_count = len(data.get('newsItems', []))
                    schedule_count = len(data.get('leagueSchedule', []))
                    
                    self.log_test(
                        "Data Integrity After Deletion", 
                        True, 
                        f"All data structures intact. Teams: {teams_count}, News: {news_count}, Schedule: {schedule_count}", 
                        {
                            "teams": teams_count,
                            "newsItems": news_count,
                            "leagueSchedule": schedule_count,
                            "all_fields_present": True
                        }
                    )
                    return True, data
                else:
                    self.log_test(
                        "Data Integrity After Deletion", 
                        False, 
                        f"Missing required fields after deletion: {missing_fields}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Data Integrity After Deletion", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Data Integrity After Deletion", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def run_malformed_event_deletion_tests(self):
        """Run all malformed event deletion tests"""
        print("Starting Malformed Event Deletion Tests...")
        print(f"Target URL: {self.api_base}")
        print(f"Malformed Event ID: {self.malformed_event_id}")
        print("=" * 80)
        
        # Step 1: Get current league data
        success, league_data = self.test_get_current_league_data()
        if not success:
            print("❌ CRITICAL: Could not retrieve league data. Cannot proceed with deletion test.")
            return False
        
        # Step 2: Find the malformed event
        success, malformed_event = self.test_find_malformed_event(league_data)
        if not success:
            if malformed_event is None:
                print("ℹ️  INFO: Malformed event not found. It may have already been deleted.")
                # Still test API endpoints to ensure they work
                self.test_api_endpoints_after_deletion()
                self.test_data_integrity_after_deletion()
                return True
            else:
                print("❌ CRITICAL: Found event but it's not malformed as expected.")
                return False
        
        # Step 3: Delete the malformed event
        success, updated_data = self.test_delete_malformed_event(league_data, malformed_event)
        if not success:
            print("❌ CRITICAL: Failed to delete malformed event.")
            return False
        
        # Step 4: Verify deletion
        success, verification_data = self.test_verify_event_deletion()
        if not success:
            print("❌ CRITICAL: Malformed event deletion verification failed.")
            return False
        
        # Step 5: Test API endpoints still work
        if not self.test_api_endpoints_after_deletion():
            print("❌ CRITICAL: API endpoints not working after deletion.")
            return False
        
        # Step 6: Test data integrity
        success, integrity_data = self.test_data_integrity_after_deletion()
        if not success:
            print("❌ CRITICAL: Data integrity compromised after deletion.")
            return False
        
        # Summary
        print("=" * 80)
        print("MALFORMED EVENT DELETION TEST SUMMARY")
        print("=" * 80)
        
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
        
        return failed_tests == 0

if __name__ == "__main__":
    try:
        tester = MalformedEventDeletionTester()
        success = tester.run_malformed_event_deletion_tests()
        
        if success:
            print("\n🎉 Malformed event deletion tests completed successfully!")
            print("✅ The malformed event 'ggg' has been removed from the database.")
            print("✅ Frontend ticker should no longer show 'Teams: Unknown' for this event.")
            sys.exit(0)
        else:
            print("\n⚠️  Some malformed event deletion tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)