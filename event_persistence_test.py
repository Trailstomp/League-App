#!/usr/bin/env python3
"""
Event Data Persistence Testing Suite
Specifically tests the issue reported by user where event photos and team selections 
are lost after save/reload cycle.

TEST SCENARIO:
1. Create a test event with imageUrl and teamIds array  
2. Save it via POST /api/league-data
3. Retrieve it via GET /api/league-data  
4. Verify that imageUrl and teamIds are properly persisted
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

    def test_event_data_persistence(self):
        """Test the specific issue: event imageUrl and teamIds persistence"""
        print("🎯 TESTING EVENT DATA PERSISTENCE ISSUE")
        print("User reported: Photos and team selections disappear after save/reload")
        print("-" * 70)
        
        # Step 1: Create test event with imageUrl and teamIds
        test_event_id = str(uuid.uuid4())
        test_image_url = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        test_team_ids = ["team1", "team2", "team3"]
        
        test_event = {
            "id": test_event_id,
            "title": "Test Event - Photo & Team Persistence",
            "date": "2024-09-15",
            "time": "14:00",
            "location": "Test Stadium",
            "type": "game",
            "imageUrl": test_image_url,
            "teamIds": test_team_ids,
            "description": "Testing event data persistence for imageUrl and teamIds"
        }
        
        # Step 2: Get current league data
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Get Initial League Data", 
                    False, 
                    f"Failed to get initial data: HTTP {response.status_code}"
                )
                return False
            
            league_data = response.json()
            self.log_test(
                "Get Initial League Data", 
                True, 
                f"Retrieved league data with {len(league_data.get('leagueSchedule', []))} existing events"
            )
            
        except Exception as e:
            self.log_test(
                "Get Initial League Data", 
                False, 
                f"Error getting initial data: {str(e)}"
            )
            return False
        
        # Step 3: Add test event to leagueSchedule and save
        try:
            league_data['leagueSchedule'] = league_data.get('leagueSchedule', [])
            league_data['leagueSchedule'].append(test_event)
            
            response = requests.post(
                f"{self.api_base}/league-data",
                json=league_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                save_result = response.json()
                self.log_test(
                    "Save Event with Photo & Teams", 
                    True, 
                    f"Event saved successfully: {save_result.get('message')}"
                )
            else:
                self.log_test(
                    "Save Event with Photo & Teams", 
                    False, 
                    f"Failed to save: HTTP {response.status_code} - {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Save Event with Photo & Teams", 
                False, 
                f"Error saving event: {str(e)}"
            )
            return False
        
        # Step 4: Wait a moment for database write
        time.sleep(1)
        
        # Step 5: Retrieve data and verify persistence
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Retrieve Saved Event Data", 
                    False, 
                    f"Failed to retrieve data: HTTP {response.status_code}"
                )
                return False
            
            retrieved_data = response.json()
            retrieved_events = retrieved_data.get('leagueSchedule', [])
            
            # Find our test event
            test_event_found = None
            for event in retrieved_events:
                if event.get('id') == test_event_id:
                    test_event_found = event
                    break
            
            if not test_event_found:
                self.log_test(
                    "Retrieve Saved Event Data", 
                    False, 
                    f"Test event with ID {test_event_id} not found in retrieved data"
                )
                return False
            
            self.log_test(
                "Retrieve Saved Event Data", 
                True, 
                f"Test event found in retrieved data"
            )
            
        except Exception as e:
            self.log_test(
                "Retrieve Saved Event Data", 
                False, 
                f"Error retrieving data: {str(e)}"
            )
            return False
        
        # Step 6: Verify imageUrl persistence
        retrieved_image_url = test_event_found.get('imageUrl')
        if retrieved_image_url == test_image_url:
            self.log_test(
                "ImageUrl Persistence Check", 
                True, 
                f"Image URL persisted correctly ({len(retrieved_image_url)} chars)"
            )
            image_persistence_ok = True
        else:
            if retrieved_image_url is None:
                self.log_test(
                    "ImageUrl Persistence Check", 
                    False, 
                    "Image URL is None - photo data was lost!"
                )
            elif retrieved_image_url == "":
                self.log_test(
                    "ImageUrl Persistence Check", 
                    False, 
                    "Image URL is empty string - photo data was lost!"
                )
            else:
                self.log_test(
                    "ImageUrl Persistence Check", 
                    False, 
                    f"Image URL mismatch - Expected: {test_image_url[:50]}..., Got: {retrieved_image_url[:50] if retrieved_image_url else 'None'}..."
                )
            image_persistence_ok = False
        
        # Step 7: Verify teamIds persistence
        retrieved_team_ids = test_event_found.get('teamIds')
        if retrieved_team_ids == test_team_ids:
            self.log_test(
                "TeamIds Persistence Check", 
                True, 
                f"Team IDs persisted correctly: {retrieved_team_ids}"
            )
            team_persistence_ok = True
        else:
            if retrieved_team_ids is None:
                self.log_test(
                    "TeamIds Persistence Check", 
                    False, 
                    "Team IDs is None - team selection data was lost!"
                )
            elif retrieved_team_ids == []:
                self.log_test(
                    "TeamIds Persistence Check", 
                    False, 
                    "Team IDs is empty array - team selection data was lost!"
                )
            else:
                self.log_test(
                    "TeamIds Persistence Check", 
                    False, 
                    f"Team IDs mismatch - Expected: {test_team_ids}, Got: {retrieved_team_ids}"
                )
            team_persistence_ok = False
        
        # Step 8: Overall persistence assessment
        if image_persistence_ok and team_persistence_ok:
            self.log_test(
                "Overall Event Data Persistence", 
                True, 
                "✅ BOTH imageUrl and teamIds persisted correctly - User issue NOT reproduced"
            )
            return True
        else:
            issues = []
            if not image_persistence_ok:
                issues.append("imageUrl lost")
            if not team_persistence_ok:
                issues.append("teamIds lost")
            
            self.log_test(
                "Overall Event Data Persistence", 
                False, 
                f"❌ USER ISSUE CONFIRMED: {', '.join(issues)} - Backend persistence problem detected!"
            )
            return False

    def test_event_editing_scenario(self):
        """Test the specific user scenario: create event, save, edit, verify data"""
        print("🎯 TESTING USER EDITING SCENARIO")
        print("Simulating: Create event → Save → Edit → Check if data persists")
        print("-" * 70)
        
        # Step 1: Create initial event without photo/teams
        initial_event_id = str(uuid.uuid4())
        initial_event = {
            "id": initial_event_id,
            "title": "Initial Event - No Photo/Teams",
            "date": "2024-09-20",
            "time": "15:00",
            "location": "Initial Stadium",
            "type": "practice",
            "description": "Initial event creation"
        }
        
        # Save initial event
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            league_data = response.json()
            league_data['leagueSchedule'] = league_data.get('leagueSchedule', [])
            league_data['leagueSchedule'].append(initial_event)
            
            response = requests.post(
                f"{self.api_base}/league-data",
                json=league_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "Create Initial Event", 
                    True, 
                    "Initial event created successfully"
                )
            else:
                self.log_test(
                    "Create Initial Event", 
                    False, 
                    f"Failed to create initial event: HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Create Initial Event", 
                False, 
                f"Error creating initial event: {str(e)}"
            )
            return False
        
        time.sleep(1)
        
        # Step 2: "Edit" the event to add photo and teams (simulating user workflow)
        try:
            # Get current data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            league_data = response.json()
            
            # Find and update our event
            events = league_data.get('leagueSchedule', [])
            event_found = False
            for i, event in enumerate(events):
                if event.get('id') == initial_event_id:
                    # Add photo and teams (simulating user editing)
                    events[i]['imageUrl'] = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    events[i]['teamIds'] = ["edit_team1", "edit_team2"]
                    events[i]['description'] = "Updated with photo and teams"
                    event_found = True
                    break
            
            if not event_found:
                self.log_test(
                    "Edit Event - Add Photo & Teams", 
                    False, 
                    "Could not find initial event to edit"
                )
                return False
            
            # Save updated data
            response = requests.post(
                f"{self.api_base}/league-data",
                json=league_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "Edit Event - Add Photo & Teams", 
                    True, 
                    "Event updated with photo and teams"
                )
            else:
                self.log_test(
                    "Edit Event - Add Photo & Teams", 
                    False, 
                    f"Failed to update event: HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Edit Event - Add Photo & Teams", 
                False, 
                f"Error updating event: {str(e)}"
            )
            return False
        
        time.sleep(1)
        
        # Step 3: Retrieve and verify the edited event still has photo and teams
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            league_data = response.json()
            events = league_data.get('leagueSchedule', [])
            
            edited_event = None
            for event in events:
                if event.get('id') == initial_event_id:
                    edited_event = event
                    break
            
            if not edited_event:
                self.log_test(
                    "Verify Edited Event Persistence", 
                    False, 
                    "Edited event not found after save"
                )
                return False
            
            # Check if photo and teams are still there
            has_photo = edited_event.get('imageUrl') is not None and edited_event.get('imageUrl') != ""
            has_teams = edited_event.get('teamIds') is not None and len(edited_event.get('teamIds', [])) > 0
            
            if has_photo and has_teams:
                self.log_test(
                    "Verify Edited Event Persistence", 
                    True, 
                    f"✅ Photo and teams persisted after edit: imageUrl={len(edited_event.get('imageUrl', ''))} chars, teamIds={edited_event.get('teamIds')}"
                )
                return True
            else:
                issues = []
                if not has_photo:
                    issues.append("photo lost")
                if not has_teams:
                    issues.append("teams lost")
                
                self.log_test(
                    "Verify Edited Event Persistence", 
                    False, 
                    f"❌ USER ISSUE CONFIRMED in editing scenario: {', '.join(issues)}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Verify Edited Event Persistence", 
                False, 
                f"Error verifying edited event: {str(e)}"
            )
            return False

    def run_persistence_tests(self):
        """Run all event persistence tests"""
        print("🔍 EVENT DATA PERSISTENCE TESTING SUITE")
        print("Testing the specific user-reported issue:")
        print("- Can upload photo and select teams in event form")
        print("- When they save and go back to edit, photo and teams are gone")
        print("=" * 70)
        
        # Test 1: Direct persistence test
        test1_success = self.test_event_data_persistence()
        
        print("\n" + "=" * 70)
        
        # Test 2: User workflow simulation
        test2_success = self.test_event_editing_scenario()
        
        # Summary
        print("\n" + "=" * 70)
        print("EVENT PERSISTENCE TEST SUMMARY")
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
        
        # Determine overall result
        if test1_success and test2_success:
            print(f"\n✅ CONCLUSION: Backend correctly persists event imageUrl and teamIds")
            print(f"   The user-reported issue is NOT a backend problem.")
            print(f"   Issue likely in frontend form state management or data binding.")
            return True
        else:
            print(f"\n❌ CONCLUSION: Backend persistence issue CONFIRMED")
            print(f"   Event imageUrl and/or teamIds are being lost during save/retrieve cycle")
            print(f"   This is a critical backend data persistence bug that needs fixing.")
            return False

if __name__ == "__main__":
    try:
        tester = EventPersistenceTester()
        success = tester.run_persistence_tests()
        
        if success:
            print("\n🎉 Event persistence tests completed - Backend working correctly!")
            sys.exit(0)
        else:
            print("\n⚠️  Event persistence issue detected in backend!")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)