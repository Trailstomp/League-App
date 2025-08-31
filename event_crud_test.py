#!/usr/bin/env python3
"""
Event CRUD Testing Suite for League Management Application
Comprehensive testing of Event Create, Read, Update, Delete operations through backend API.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
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

class EventCRUDTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Event CRUD operations at: {self.api_base}")
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

    def clear_existing_events(self):
        """Clear any existing events to start with clean slate"""
        try:
            print("🧹 CLEARING EXISTING EVENTS FOR CLEAN SLATE...")
            
            # Clear leagueSchedule by sending empty array
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=[],
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "Clear Existing Events", 
                    True, 
                    "Successfully cleared all existing events from database"
                )
                return True
            else:
                self.log_test(
                    "Clear Existing Events", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Clear Existing Events", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def verify_clean_state(self):
        """Verify database has no events"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                if len(events) == 0:
                    self.log_test(
                        "Verify Clean State", 
                        True, 
                        "Database confirmed clean - no events found"
                    )
                    return True
                else:
                    self.log_test(
                        "Verify Clean State", 
                        False, 
                        f"Database not clean - found {len(events)} existing events"
                    )
                    return False
            else:
                self.log_test(
                    "Verify Clean State", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Verify Clean State", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_create_practice_event(self):
        """Test creating a practice event"""
        try:
            # Create a practice event with realistic data
            practice_event = {
                "id": str(uuid.uuid4()),
                "title": "Thunder Hawks Practice Session",
                "type": "practice",
                "date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
                "time": "18:00",
                "location": "Thunder Hawks Training Field",
                "teams": ["thunder-hawks"],
                "description": "Weekly practice session focusing on offensive plays",
                "created": datetime.now().isoformat(),
                "rsvpEnabled": True,
                "rsvpResponses": [],
                "attendanceTracking": True
            }
            
            # Get current league data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "CREATE - Practice Event", 
                    False, 
                    "Failed to get current league data"
                )
                return False, None
            
            league_data = response.json()
            current_events = league_data.get('leagueSchedule', [])
            
            # Add new practice event
            updated_events = current_events + [practice_event]
            
            # Save updated events
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=updated_events,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "CREATE - Practice Event", 
                    True, 
                    f"Successfully created practice event: {practice_event['title']}", 
                    {"event_id": practice_event['id'], "type": practice_event['type']}
                )
                return True, practice_event
            else:
                self.log_test(
                    "CREATE - Practice Event", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "CREATE - Practice Event", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_create_game_event(self):
        """Test creating a game event"""
        try:
            # Create a game event with realistic data
            game_event = {
                "id": str(uuid.uuid4()),
                "title": "Thunder Hawks vs Lightning Bolts",
                "type": "game",
                "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
                "time": "19:30",
                "location": "Central Sports Complex",
                "teams": ["thunder-hawks", "lightning-bolts"],
                "description": "Regular season matchup - Division Championship implications",
                "created": datetime.now().isoformat(),
                "rsvpEnabled": True,
                "rsvpResponses": [],
                "attendanceTracking": True,
                "homeTeam": "thunder-hawks",
                "awayTeam": "lightning-bolts",
                "status": "scheduled"
            }
            
            # Get current league data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "CREATE - Game Event", 
                    False, 
                    "Failed to get current league data"
                )
                return False, None
            
            league_data = response.json()
            current_events = league_data.get('leagueSchedule', [])
            
            # Add new game event
            updated_events = current_events + [game_event]
            
            # Save updated events
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=updated_events,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "CREATE - Game Event", 
                    True, 
                    f"Successfully created game event: {game_event['title']}", 
                    {"event_id": game_event['id'], "type": game_event['type'], "teams": len(game_event['teams'])}
                )
                return True, game_event
            else:
                self.log_test(
                    "CREATE - Game Event", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "CREATE - Game Event", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_read_events(self):
        """Test retrieving events from database"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                if len(events) >= 2:  # Should have practice + game events
                    # Verify event structure and data integrity
                    practice_events = [e for e in events if e.get('type') == 'practice']
                    game_events = [e for e in events if e.get('type') == 'game']
                    
                    required_fields = ['id', 'title', 'type', 'date', 'time', 'location', 'teams']
                    
                    all_valid = True
                    for event in events:
                        if not all(field in event for field in required_fields):
                            all_valid = False
                            break
                    
                    if all_valid:
                        self.log_test(
                            "READ - Retrieve Events", 
                            True, 
                            f"Successfully retrieved {len(events)} events ({len(practice_events)} practice, {len(game_events)} game)", 
                            {"total_events": len(events), "practice_count": len(practice_events), "game_count": len(game_events)}
                        )
                        return True, events
                    else:
                        self.log_test(
                            "READ - Retrieve Events", 
                            False, 
                            "Events missing required fields"
                        )
                        return False, None
                else:
                    self.log_test(
                        "READ - Retrieve Events", 
                        False, 
                        f"Expected at least 2 events, found {len(events)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "READ - Retrieve Events", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "READ - Retrieve Events", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_update_event(self, event_to_update):
        """Test updating an existing event"""
        try:
            if not event_to_update:
                self.log_test(
                    "UPDATE - Event Details", 
                    False, 
                    "No event provided for update test"
                )
                return False
            
            # Get current events
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "UPDATE - Event Details", 
                    False, 
                    "Failed to get current league data"
                )
                return False
            
            league_data = response.json()
            current_events = league_data.get('leagueSchedule', [])
            
            # Find and update the event
            updated_events = []
            event_found = False
            
            for event in current_events:
                if event.get('id') == event_to_update['id']:
                    # Update event details
                    event['title'] = event['title'] + " - UPDATED"
                    event['description'] = "Updated event description with new details"
                    event['time'] = "20:00"  # Change time
                    event['lastModified'] = datetime.now().isoformat()
                    
                    # Add RSVP response to test RSVP system
                    event['rsvpResponses'] = [
                        {
                            "userId": "user123",
                            "userName": "John Smith", 
                            "response": "yes",
                            "timestamp": datetime.now().isoformat()
                        },
                        {
                            "userId": "user456",
                            "userName": "Sarah Johnson",
                            "response": "no", 
                            "timestamp": datetime.now().isoformat()
                        }
                    ]
                    
                    event_found = True
                
                updated_events.append(event)
            
            if not event_found:
                self.log_test(
                    "UPDATE - Event Details", 
                    False, 
                    f"Event with ID {event_to_update['id']} not found"
                )
                return False
            
            # Save updated events
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=updated_events,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "UPDATE - Event Details", 
                    True, 
                    f"Successfully updated event: {event_to_update['title']}", 
                    {"updated_fields": ["title", "description", "time", "rsvpResponses"], "rsvp_count": 2}
                )
                return True
            else:
                self.log_test(
                    "UPDATE - Event Details", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "UPDATE - Event Details", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_verify_update_persistence(self, original_event):
        """Verify that updates persisted correctly"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                # Find the updated event
                updated_event = None
                for event in events:
                    if event.get('id') == original_event['id']:
                        updated_event = event
                        break
                
                if updated_event:
                    # Verify updates persisted
                    title_updated = "UPDATED" in updated_event.get('title', '')
                    time_updated = updated_event.get('time') == "20:00"
                    rsvp_added = len(updated_event.get('rsvpResponses', [])) == 2
                    
                    if title_updated and time_updated and rsvp_added:
                        self.log_test(
                            "VERIFY - Update Persistence", 
                            True, 
                            "All updates persisted correctly in database", 
                            {"title_updated": title_updated, "time_updated": time_updated, "rsvp_responses": len(updated_event.get('rsvpResponses', []))}
                        )
                        return True
                    else:
                        self.log_test(
                            "VERIFY - Update Persistence", 
                            False, 
                            f"Updates not persisted correctly. Title: {title_updated}, Time: {time_updated}, RSVP: {rsvp_added}"
                        )
                        return False
                else:
                    self.log_test(
                        "VERIFY - Update Persistence", 
                        False, 
                        f"Updated event with ID {original_event['id']} not found"
                    )
                    return False
            else:
                self.log_test(
                    "VERIFY - Update Persistence", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "VERIFY - Update Persistence", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_delete_event(self, event_to_delete):
        """Test deleting a specific event"""
        try:
            if not event_to_delete:
                self.log_test(
                    "DELETE - Specific Event", 
                    False, 
                    "No event provided for delete test"
                )
                return False
            
            # Get current events
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "DELETE - Specific Event", 
                    False, 
                    "Failed to get current league data"
                )
                return False
            
            league_data = response.json()
            current_events = league_data.get('leagueSchedule', [])
            initial_count = len(current_events)
            
            # Remove the specific event
            updated_events = [event for event in current_events if event.get('id') != event_to_delete['id']]
            
            if len(updated_events) == initial_count:
                self.log_test(
                    "DELETE - Specific Event", 
                    False, 
                    f"Event with ID {event_to_delete['id']} not found for deletion"
                )
                return False
            
            # Save updated events (without the deleted event)
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=updated_events,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "DELETE - Specific Event", 
                    True, 
                    f"Successfully deleted event: {event_to_delete['title']}", 
                    {"events_before": initial_count, "events_after": len(updated_events)}
                )
                return True
            else:
                self.log_test(
                    "DELETE - Specific Event", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "DELETE - Specific Event", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_verify_deletion(self, deleted_event):
        """Verify event was properly deleted from database"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                # Verify deleted event is not in the list
                deleted_event_found = any(event.get('id') == deleted_event['id'] for event in events)
                
                if not deleted_event_found:
                    self.log_test(
                        "VERIFY - Event Deletion", 
                        True, 
                        f"Event successfully removed from database. Remaining events: {len(events)}", 
                        {"remaining_events": len(events), "deleted_event_id": deleted_event['id']}
                    )
                    return True
                else:
                    self.log_test(
                        "VERIFY - Event Deletion", 
                        False, 
                        f"Deleted event still found in database"
                    )
                    return False
            else:
                self.log_test(
                    "VERIFY - Event Deletion", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "VERIFY - Event Deletion", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_final_cleanup(self):
        """Clean up all test events and verify clean state"""
        try:
            # Clear all events
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=[],
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify clean state
                time.sleep(1)  # Allow for database write
                
                response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    events = data.get('leagueSchedule', [])
                    
                    if len(events) == 0:
                        self.log_test(
                            "CLEANUP - Final State", 
                            True, 
                            "Successfully cleaned up all test events - database returned to clean state"
                        )
                        return True
                    else:
                        self.log_test(
                            "CLEANUP - Final State", 
                            False, 
                            f"Cleanup incomplete - {len(events)} events still remain"
                        )
                        return False
                else:
                    self.log_test(
                        "CLEANUP - Final State", 
                        False, 
                        f"Failed to verify clean state: HTTP {response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "CLEANUP - Final State", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "CLEANUP - Final State", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_event_crud_tests(self):
        """Run comprehensive Event CRUD tests"""
        print("🎯 STARTING COMPREHENSIVE EVENT CRUD TESTING")
        print("Testing: Create → Read → Update → Delete workflow")
        print("=" * 80)
        
        # Step 1: Clear existing events for clean slate
        if not self.clear_existing_events():
            print("❌ CRITICAL: Failed to clear existing events")
            return False
        
        # Step 2: Verify clean state
        if not self.verify_clean_state():
            print("❌ CRITICAL: Database not in clean state")
            return False
        
        # Step 3: CREATE - Test creating events
        print("\n📝 TESTING CREATE OPERATIONS...")
        practice_success, practice_event = self.test_create_practice_event()
        game_success, game_event = self.test_create_game_event()
        
        if not (practice_success and game_success):
            print("❌ CRITICAL: Event creation failed")
            return False
        
        # Step 4: READ - Test retrieving events
        print("\n📖 TESTING READ OPERATIONS...")
        read_success, events = self.test_read_events()
        
        if not read_success:
            print("❌ CRITICAL: Event retrieval failed")
            return False
        
        # Step 5: UPDATE - Test updating events
        print("\n✏️  TESTING UPDATE OPERATIONS...")
        update_success = self.test_update_event(practice_event)
        
        if update_success:
            # Verify updates persisted
            self.test_verify_update_persistence(practice_event)
        
        # Step 6: DELETE - Test deleting events
        print("\n🗑️  TESTING DELETE OPERATIONS...")
        delete_success = self.test_delete_event(game_event)
        
        if delete_success:
            # Verify deletion persisted
            self.test_verify_deletion(game_event)
        
        # Step 7: Final cleanup
        print("\n🧹 FINAL CLEANUP...")
        self.test_final_cleanup()
        
        # Summary
        print("\n" + "=" * 80)
        print("EVENT CRUD TEST SUMMARY")
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
        
        # Return True if all tests pass
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    try:
        tester = EventCRUDTester()
        success = tester.run_event_crud_tests()
        
        if success:
            print("\n🎉 Event CRUD tests completed successfully!")
            print("✅ All event management operations (Create, Read, Update, Delete) are working correctly")
            sys.exit(0)
        else:
            print("\n⚠️  Some Event CRUD tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Event CRUD test setup failed: {e}")
        sys.exit(1)