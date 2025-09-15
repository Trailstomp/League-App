#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
import os

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

BACKEND_URL = get_backend_url() or 'https://lacrosse-mgr.preview.emergentagent.com'
API_BASE = f"{BACKEND_URL}/api"

class EventSearchTester:
    def __init__(self):
        self.test_results = []
        self.found_events = []
        
        # User's specific event titles to search for
        self.target_events = [
            "Game test 1",
            "Game test 2", 
            "Game test 3",
            "Tourney test",
            "Dayton Classic"
        ]
            
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append(f"{status}: {test_name}")
        if details:
            self.test_results.append(f"    Details: {details}")
        print(f"{status}: {test_name}")
        if details:
            print(f"    Details: {details}")
            
    def search_main_league_database(self):
        """Search main league database for user events"""
        try:
            response = requests.get(f"{API_BASE}/league-data", timeout=10)
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                self.log_test("Main League Database Access", True, f"Found {len(league_schedule)} total events")
                
                # Search for user's specific events
                found_user_events = []
                for event in league_schedule:
                    event_title = event.get('title', '').strip()
                    for target in self.target_events:
                        if target.lower() in event_title.lower():
                            found_user_events.append({
                                'title': event_title,
                                'id': event.get('id', 'No ID'),
                                'date': event.get('date', 'No date'),
                                'time': event.get('time', 'No time'),
                                'location': event.get('location', 'No location'),
                                'type': event.get('type', 'No type')
                            })
                            self.found_events.append(f"MAIN_LEAGUE: {event_title}")
                
                if found_user_events:
                    self.log_test("User Events in Main League Database", True, 
                                f"Found {len(found_user_events)} user events: {[e['title'] for e in found_user_events]}")
                    for event in found_user_events:
                        self.log_test(f"  Event Details", True, 
                                    f"Title: {event['title']}, ID: {event['id']}, Date: {event['date']}, Time: {event['time']}")
                else:
                    self.log_test("User Events in Main League Database", False, 
                                "No user events found in main league database")
                    
                # Show all events for debugging
                all_titles = [event.get('title', 'Untitled') for event in league_schedule]
                self.log_test("All Events in Main Database", True, f"Event titles: {all_titles}")
                
            else:
                self.log_test("Main League Database Access", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Main League Database Access", False, f"Exception: {str(e)}")
            
    def search_individual_events_collection(self):
        """Check if there's a separate events collection"""
        try:
            # Try to access a potential /api/events endpoint
            response = requests.get(f"{API_BASE}/events", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Individual Events Collection Access", True, f"Found events collection with {len(data)} events")
                
                # Search for user events
                found_user_events = []
                for event in data:
                    event_title = event.get('title', '').strip()
                    for target in self.target_events:
                        if target.lower() in event_title.lower():
                            found_user_events.append(event_title)
                            self.found_events.append(f"EVENTS_COLLECTION: {event_title}")
                
                if found_user_events:
                    self.log_test("User Events in Events Collection", True, f"Found: {found_user_events}")
                else:
                    self.log_test("User Events in Events Collection", False, "No user events found")
                    
            elif response.status_code == 404:
                self.log_test("Individual Events Collection Access", True, "No separate events collection (404 - expected)")
            else:
                self.log_test("Individual Events Collection Access", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Individual Events Collection Access", False, f"Exception: {str(e)}")
            
    def check_database_collections_directly(self):
        """Check all database collections for events"""
        try:
            # Try to get database status or collection info
            response = requests.get(f"{API_BASE}/status", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Database Status Check", True, f"Database accessible, found {len(data)} status entries")
            else:
                self.log_test("Database Status Check", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Database Status Check", False, f"Exception: {str(e)}")
            
    def analyze_save_path_issues(self):
        """Analyze the event save path and verify it's working"""
        try:
            # Test the POST endpoint that should save events
            test_event = {
                "id": f"search_test_{int(datetime.now().timestamp())}",
                "title": "SEARCH TEST EVENT - DELETE ME",
                "date": "2025-01-20",
                "time": "15:00",
                "type": "practice",
                "teamIds": ["test_team"],
                "location": "Test Location",
                "description": "Test event for search functionality"
            }
            
            # Try to save a test event
            response = requests.post(f"{API_BASE}/league-data/leagueSchedule", 
                                   json=[test_event], timeout=10)
            if response.status_code == 200:
                self.log_test("Event Save Path Test", True, "POST /api/league-data/leagueSchedule accepts events")
                
                # Verify it was saved
                get_response = requests.get(f"{API_BASE}/league-data", timeout=10)
                if get_response.status_code == 200:
                    data = get_response.json()
                    league_schedule = data.get('leagueSchedule', [])
                    
                    # Check if our test event is there
                    test_found = any(event.get('title') == test_event['title'] for event in league_schedule)
                    if test_found:
                        self.log_test("Event Save-Retrieve Cycle", True, "Test event successfully saved and retrieved")
                        
                        # Clean up test event
                        remaining_events = [e for e in league_schedule if e.get('title') != test_event['title']]
                        cleanup_response = requests.post(f"{API_BASE}/league-data/leagueSchedule", 
                                                       json=remaining_events, timeout=10)
                        if cleanup_response.status_code == 200:
                            self.log_test("Test Event Cleanup", True, "Test event removed")
                    else:
                        self.log_test("Event Save-Retrieve Cycle", False, "Test event not found after save")
                else:
                    self.log_test("Event Save-Retrieve Cycle", False, f"Could not retrieve after save: HTTP {get_response.status_code}")
            else:
                self.log_test("Event Save Path Test", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Event Save Path Test", False, f"Exception: {str(e)}")
            
    def check_filtering_requirements(self):
        """Check if events are being filtered out due to missing fields"""
        try:
            # Get current league data to analyze event structure
            response = requests.get(f"{API_BASE}/league-data", timeout=10)
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                if league_schedule:
                    # Analyze the structure of existing events
                    sample_event = league_schedule[0]
                    required_fields = list(sample_event.keys())
                    self.log_test("Event Structure Analysis", True, 
                                f"Existing events have fields: {required_fields}")
                    
                    # Check for common filtering fields
                    filtering_fields = ['season', 'league', 'active', 'published', 'approved']
                    found_filtering_fields = [field for field in filtering_fields if field in sample_event]
                    
                    if found_filtering_fields:
                        self.log_test("Potential Filtering Fields", True, 
                                    f"Found filtering fields: {found_filtering_fields}")
                    else:
                        self.log_test("Potential Filtering Fields", True, "No obvious filtering fields found")
                else:
                    self.log_test("Event Structure Analysis", False, "No events to analyze")
                    
        except Exception as e:
            self.log_test("Event Structure Analysis", False, f"Exception: {str(e)}")
            
    async def search_chronological_history(self):
        """Look for chronological history of user events"""
        try:
            # Check if there are any backup collections or historical data
            async with self.session.get(f"{API_BASE}/backup/teams") as response:
                if response.status == 200:
                    self.log_test("Backup System Access", True, "Backup system is accessible")
                else:
                    self.log_test("Backup System Access", False, f"HTTP {response.status}")
                    
            # Try to get teams data to see if events are stored there
            async with self.session.get(f"{API_BASE}/teams") as response:
                if response.status == 200:
                    teams = await response.json()
                    self.log_test("Teams Collection Access", True, f"Found {len(teams)} teams")
                    
                    # Check if any teams have event data
                    teams_with_events = []
                    for team in teams:
                        if 'events' in team or 'schedule' in team or 'games' in team:
                            teams_with_events.append(team.get('name', 'Unknown'))
                            
                    if teams_with_events:
                        self.log_test("Team-Level Event Storage", True, f"Teams with events: {teams_with_events}")
                    else:
                        self.log_test("Team-Level Event Storage", True, "No team-level event storage found")
                        
        except Exception as e:
            self.log_test("Chronological History Search", False, f"Exception: {str(e)}")
            
    async def comprehensive_database_search(self):
        """Perform comprehensive search across all accessible endpoints"""
        try:
            # List of all possible endpoints to check
            endpoints_to_check = [
                "/league-data",
                "/teams", 
                "/players",
                "/locations",
                "/api-integrations",
                "/status"
            ]
            
            all_text_content = []
            
            for endpoint in endpoints_to_check:
                try:
                    async with self.session.get(f"{API_BASE}{endpoint}") as response:
                        if response.status == 200:
                            data = await response.json()
                            # Convert to string and search for user event titles
                            data_str = json.dumps(data, default=str).lower()
                            
                            found_in_endpoint = []
                            for target in self.target_events:
                                if target.lower() in data_str:
                                    found_in_endpoint.append(target)
                                    self.found_events.append(f"{endpoint.upper()}: {target}")
                            
                            if found_in_endpoint:
                                self.log_test(f"Search in {endpoint}", True, f"Found user events: {found_in_endpoint}")
                            else:
                                self.log_test(f"Search in {endpoint}", True, f"No user events found (searched {len(data_str)} characters)")
                                
                            all_text_content.append(data_str)
                            
                except Exception as e:
                    self.log_test(f"Search in {endpoint}", False, f"Exception: {str(e)}")
                    
            # Final comprehensive text search
            combined_content = " ".join(all_text_content)
            total_matches = []
            for target in self.target_events:
                if target.lower() in combined_content:
                    total_matches.append(target)
                    
            self.log_test("Comprehensive Text Search", True, 
                        f"Total database content: {len(combined_content)} chars, Matches: {total_matches}")
                        
        except Exception as e:
            self.log_test("Comprehensive Database Search", False, f"Exception: {str(e)}")
            
    async def run_all_tests(self):
        """Run all event search tests"""
        print("🔍 CRITICAL USER EVENT SEARCH - FINDING MISSING EVENTS")
        print("=" * 60)
        print(f"Searching for user events: {self.target_events}")
        print(f"Backend URL: {API_BASE}")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Run all search tests
            await self.search_main_league_database()
            await self.search_individual_events_collection()
            await self.check_database_collections_directly()
            await self.analyze_save_path_issues()
            await self.check_filtering_requirements()
            await self.search_chronological_history()
            await self.comprehensive_database_search()
            
        finally:
            await self.cleanup_session()
            
        # Summary
        print("\n" + "=" * 60)
        print("🎯 EVENT SEARCH SUMMARY")
        print("=" * 60)
        
        if self.found_events:
            print(f"✅ FOUND USER EVENTS ({len(self.found_events)}):")
            for event in self.found_events:
                print(f"   {event}")
        else:
            print("❌ NO USER EVENTS FOUND IN ANY DATABASE LOCATION")
            print("   This confirms the user's report - events are not persisting")
            
        print(f"\nTotal tests run: {len(self.test_results)}")
        passed = len([r for r in self.test_results if "✅ PASS" in r])
        failed = len([r for r in self.test_results if "❌ FAIL" in r])
        print(f"Passed: {passed}, Failed: {failed}")
        
        return len(self.found_events) > 0

async def main():
    """Main test execution"""
    tester = EventSearchTester()
    events_found = await tester.run_all_tests()
    
    if not events_found:
        print("\n🚨 CRITICAL FINDING: USER EVENTS ARE NOT PERSISTING")
        print("   Recommendation: Check frontend event creation process")
        print("   Possible issues: Form submission, API calls, data validation")
        
    return events_found

if __name__ == "__main__":
    asyncio.run(main())