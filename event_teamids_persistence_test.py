#!/usr/bin/env python3
"""
Event TeamIds Persistence Testing Suite
Specifically tests the event data persistence issue where event.teamIds is undefined
when editing existing events, causing team selections to disappear.
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

class EventTeamIdsTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🔍 TESTING EVENT TEAMIDS PERSISTENCE")
        print(f"Backend URL: {self.api_base}")
        print("=" * 80)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            if isinstance(response_data, dict) and len(str(response_data)) > 200:
                print(f"    Response: [Large object - {len(str(response_data))} chars]")
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
                        f"Backend responding correctly (Status: {response.status_code})", 
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

    def get_current_league_data(self):
        """Get current league data to examine existing structure"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Get Current League Data", 
                    True, 
                    f"Retrieved league data with {len(data.get('leagueSchedule', []))} events", 
                    {
                        "teams_count": len(data.get('teams', [])),
                        "events_count": len(data.get('leagueSchedule', [])),
                        "has_websiteStyle": 'websiteStyle' in data
                    }
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

    def examine_existing_events_structure(self, league_data):
        """Examine the structure of existing events to check for teamIds field"""
        events = league_data.get('leagueSchedule', [])
        
        if not events:
            self.log_test(
                "Examine Existing Events Structure", 
                True, 
                "No existing events found - will test with new event creation"
            )
            return True, []
        
        # Analyze event structure
        events_with_teamids = []
        events_without_teamids = []
        event_structures = []
        
        for i, event in enumerate(events):
            event_info = {
                "index": i,
                "id": event.get('id', 'no_id'),
                "title": event.get('title', 'no_title'),
                "has_teamIds": 'teamIds' in event,
                "teamIds_value": event.get('teamIds'),
                "teamIds_type": type(event.get('teamIds')).__name__ if 'teamIds' in event else 'missing',
                "all_fields": list(event.keys())
            }
            event_structures.append(event_info)
            
            if 'teamIds' in event:
                events_with_teamids.append(event_info)
            else:
                events_without_teamids.append(event_info)
        
        # Log detailed analysis
        analysis_message = f"Found {len(events)} events total:\n"
        analysis_message += f"    - {len(events_with_teamids)} events WITH teamIds field\n"
        analysis_message += f"    - {len(events_without_teamids)} events WITHOUT teamIds field"
        
        if events_without_teamids:
            analysis_message += f"\n    🚨 ISSUE DETECTED: {len(events_without_teamids)} events missing teamIds field"
        
        self.log_test(
            "Examine Existing Events Structure", 
            len(events_without_teamids) == 0,  # Pass only if all events have teamIds
            analysis_message,
            {
                "events_with_teamIds": len(events_with_teamids),
                "events_without_teamIds": len(events_without_teamids),
                "sample_structures": event_structures[:3]  # Show first 3 for brevity
            }
        )
        
        return len(events_without_teamids) == 0, event_structures

    def create_test_event_with_teams(self, league_data):
        """Create a test event with team selections and verify teamIds persistence"""
        
        # Get available teams
        teams = league_data.get('teams', [])
        if not teams:
            self.log_test(
                "Create Test Event With Teams", 
                False, 
                "No teams available in league data - cannot test team selection"
            )
            return False, None
        
        # Select first 2-3 teams for testing
        selected_teams = teams[:min(3, len(teams))]
        team_ids = [team.get('id') for team in selected_teams if team.get('id')]
        
        if not team_ids:
            self.log_test(
                "Create Test Event With Teams", 
                False, 
                "No valid team IDs found - teams missing 'id' field"
            )
            return False, None
        
        # Create test event with teamIds
        test_event = {
            "id": f"test_event_{uuid.uuid4().hex[:8]}",
            "title": "Test Event - TeamIds Persistence Check",
            "date": "2024-12-20",
            "time": "18:00",
            "location": "Test Stadium",
            "type": "game",
            "teamIds": team_ids,  # This is the critical field we're testing
            "homeTeam": team_ids[0] if team_ids else None,
            "awayTeam": team_ids[1] if len(team_ids) > 1 else None,
            "homeScore": 0,
            "awayScore": 0,
            "status": "scheduled",
            "description": "Test event created to verify teamIds field persistence",
            "imageUrl": None
        }
        
        # Add event to league schedule
        current_events = league_data.get('leagueSchedule', [])
        updated_events = current_events + [test_event]
        
        try:
            # Save updated league data with new event
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=updated_events,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "Create Test Event With Teams", 
                    True, 
                    f"Created test event with {len(team_ids)} teams selected",
                    {
                        "event_id": test_event['id'],
                        "teamIds": team_ids,
                        "team_count": len(team_ids)
                    }
                )
                return True, test_event
            else:
                self.log_test(
                    "Create Test Event With Teams", 
                    False, 
                    f"Failed to save event: HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Create Test Event With Teams", 
                False, 
                f"Connection error while saving event: {str(e)}"
            )
            return False, None

    def verify_event_retrieval_with_teamids(self, test_event):
        """Retrieve the event and verify teamIds field is preserved"""
        
        # Wait a moment for database write
        time.sleep(1)
        
        try:
            # Get updated league data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                # Find our test event
                test_event_retrieved = None
                for event in events:
                    if event.get('id') == test_event['id']:
                        test_event_retrieved = event
                        break
                
                if test_event_retrieved:
                    # Check if teamIds field exists and matches what we saved
                    has_teamids = 'teamIds' in test_event_retrieved
                    teamids_value = test_event_retrieved.get('teamIds')
                    teamids_match = teamids_value == test_event['teamIds']
                    
                    if has_teamids and teamids_match:
                        self.log_test(
                            "Verify Event Retrieval With TeamIds", 
                            True, 
                            f"✅ teamIds field preserved correctly during save/retrieve cycle",
                            {
                                "original_teamIds": test_event['teamIds'],
                                "retrieved_teamIds": teamids_value,
                                "match": teamids_match
                            }
                        )
                        return True, test_event_retrieved
                    else:
                        issue_details = []
                        if not has_teamids:
                            issue_details.append("teamIds field is MISSING from retrieved event")
                        if not teamids_match:
                            issue_details.append(f"teamIds value changed: {test_event['teamIds']} → {teamids_value}")
                        
                        self.log_test(
                            "Verify Event Retrieval With TeamIds", 
                            False, 
                            f"🚨 CRITICAL ISSUE: {'; '.join(issue_details)}",
                            {
                                "original_teamIds": test_event['teamIds'],
                                "retrieved_teamIds": teamids_value,
                                "has_teamIds_field": has_teamids
                            }
                        )
                        return False, test_event_retrieved
                else:
                    self.log_test(
                        "Verify Event Retrieval With TeamIds", 
                        False, 
                        f"Test event with ID {test_event['id']} not found in retrieved data"
                    )
                    return False, None
            else:
                self.log_test(
                    "Verify Event Retrieval With TeamIds", 
                    False, 
                    f"Failed to retrieve league data: HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Verify Event Retrieval With TeamIds", 
                False, 
                f"Connection error while retrieving data: {str(e)}"
            )
            return False, None

    def test_event_update_preserves_teamids(self, test_event):
        """Test updating an event and verify teamIds field is preserved"""
        
        # Modify the event (simulate editing)
        updated_event = test_event.copy()
        updated_event['title'] = "Updated Test Event - TeamIds Persistence Check"
        updated_event['description'] = "Updated description to test if teamIds persists during edit"
        updated_event['homeScore'] = 2
        updated_event['awayScore'] = 1
        
        # Get current league data
        success, league_data = self.get_current_league_data()
        if not success:
            return False
        
        # Update the event in the schedule
        events = league_data.get('leagueSchedule', [])
        updated_events = []
        
        for event in events:
            if event.get('id') == test_event['id']:
                updated_events.append(updated_event)
            else:
                updated_events.append(event)
        
        try:
            # Save updated events
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=updated_events,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Wait and retrieve to verify
                time.sleep(1)
                
                success, retrieved_data = self.get_current_league_data()
                if success:
                    retrieved_events = retrieved_data.get('leagueSchedule', [])
                    
                    # Find updated event
                    updated_retrieved = None
                    for event in retrieved_events:
                        if event.get('id') == test_event['id']:
                            updated_retrieved = event
                            break
                    
                    if updated_retrieved:
                        # Check if teamIds survived the update
                        has_teamids = 'teamIds' in updated_retrieved
                        teamids_value = updated_retrieved.get('teamIds')
                        teamids_match = teamids_value == test_event['teamIds']
                        title_updated = updated_retrieved.get('title') == updated_event['title']
                        
                        if has_teamids and teamids_match and title_updated:
                            self.log_test(
                                "Test Event Update Preserves TeamIds", 
                                True, 
                                f"✅ teamIds field preserved during event update operation",
                                {
                                    "original_teamIds": test_event['teamIds'],
                                    "after_update_teamIds": teamids_value,
                                    "title_updated": title_updated
                                }
                            )
                            return True
                        else:
                            issues = []
                            if not has_teamids:
                                issues.append("teamIds field LOST during update")
                            if not teamids_match:
                                issues.append(f"teamIds value changed during update")
                            if not title_updated:
                                issues.append("title update failed")
                            
                            self.log_test(
                                "Test Event Update Preserves TeamIds", 
                                False, 
                                f"🚨 UPDATE ISSUE: {'; '.join(issues)}",
                                {
                                    "original_teamIds": test_event['teamIds'],
                                    "after_update_teamIds": teamids_value,
                                    "has_teamIds_field": has_teamids
                                }
                            )
                            return False
                    else:
                        self.log_test(
                            "Test Event Update Preserves TeamIds", 
                            False, 
                            "Updated event not found in retrieved data"
                        )
                        return False
                else:
                    return False
            else:
                self.log_test(
                    "Test Event Update Preserves TeamIds", 
                    False, 
                    f"Failed to save updated event: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Test Event Update Preserves TeamIds", 
                False, 
                f"Connection error during update: {str(e)}"
            )
            return False

    def run_comprehensive_teamids_test(self):
        """Run comprehensive test suite for event teamIds persistence"""
        print("🔍 STARTING COMPREHENSIVE EVENT TEAMIDS PERSISTENCE TEST")
        print("=" * 80)
        
        # Step 1: Test backend connectivity
        if not self.test_backend_connectivity():
            print("❌ CRITICAL: Backend connectivity failed. Cannot proceed with testing.")
            return False
        
        # Step 2: Get current league data
        success, league_data = self.get_current_league_data()
        if not success:
            print("❌ CRITICAL: Cannot retrieve league data. Cannot proceed with testing.")
            return False
        
        # Step 3: Examine existing events structure
        success, event_structures = self.examine_existing_events_structure(league_data)
        existing_issues = not success
        
        # Step 4: Create test event with teams
        success, test_event = self.create_test_event_with_teams(league_data)
        if not success:
            print("❌ CRITICAL: Cannot create test event. Cannot proceed with persistence testing.")
            return False
        
        # Step 5: Verify event retrieval preserves teamIds
        success, retrieved_event = self.verify_event_retrieval_with_teamids(test_event)
        retrieval_issues = not success
        
        # Step 6: Test event update preserves teamIds
        if retrieved_event:
            success = self.test_event_update_preserves_teamids(test_event)
            update_issues = not success
        else:
            update_issues = True
            self.log_test(
                "Test Event Update Preserves TeamIds", 
                False, 
                "Skipped - event retrieval failed"
            )
        
        # Summary
        print("=" * 80)
        print("🎯 EVENT TEAMIDS PERSISTENCE TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        # Detailed issue analysis
        print(f"\n🔍 ISSUE ANALYSIS:")
        if existing_issues:
            print(f"  ❌ Existing events in database are missing teamIds field")
        else:
            print(f"  ✅ Existing events have proper teamIds field structure")
        
        if retrieval_issues:
            print(f"  ❌ New events lose teamIds field during save/retrieve cycle")
        else:
            print(f"  ✅ New events preserve teamIds field during save/retrieve cycle")
        
        if update_issues:
            print(f"  ❌ Event updates lose teamIds field (THIS IS THE REPORTED BUG)")
        else:
            print(f"  ✅ Event updates preserve teamIds field correctly")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        # Root cause analysis
        print(f"\n🎯 ROOT CAUSE ANALYSIS:")
        if retrieval_issues or update_issues:
            print(f"  🚨 CONFIRMED: Event teamIds persistence issue exists")
            print(f"  📋 SYMPTOMS: event.teamIds becomes undefined when editing existing events")
            print(f"  🔧 LIKELY CAUSE: Backend API not properly preserving teamIds field during save operations")
            print(f"  💡 RECOMMENDATION: Check backend event save/update logic for teamIds field handling")
        else:
            print(f"  ✅ No teamIds persistence issues detected in backend")
            print(f"  💡 RECOMMENDATION: Issue may be in frontend event loading/editing logic")
        
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    try:
        tester = EventTeamIdsTester()
        success = tester.run_comprehensive_teamids_test()
        
        if success:
            print("\n🎉 Event teamIds persistence tests completed successfully!")
            print("✅ Backend properly handles teamIds field persistence")
            sys.exit(0)
        else:
            print("\n⚠️  Event teamIds persistence issues detected!")
            print("🔧 Backend requires fixes for proper teamIds handling")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)