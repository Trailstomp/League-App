#!/usr/bin/env python3
"""
Event-Focused Backend API Testing Suite
Tests event-related backend functionality after EventForm component fixes.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
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

class EventBackendTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing event-related backend functionality at: {self.api_base}")
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

    def test_event_data_structure(self):
        """Test that league data can handle event structures properly"""
        try:
            # Create comprehensive event data with all fields that EventForm might use
            future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            
            test_event_data = {
                "teams": [
                    {"id": "team1", "name": "OH10 Lacrosse Team", "division": "Field"},
                    {"id": "team2", "name": "American Dads", "division": "Field"}
                ],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [
                    {
                        "id": "event_test_1",
                        "title": "Backend Test Event",
                        "date": future_date,
                        "time": "18:00",
                        "location": "Test Field",
                        "type": "practice",
                        "teams": ["team1"],
                        "description": "Test event for backend validation",
                        "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
                        "gameStatus": "scheduled",
                        "homeTeam": "team1",
                        "awayTeam": None,
                        "homeScore": 0,
                        "awayScore": 0,
                        "rsvpEnabled": True,
                        "rsvpResponses": [],
                        "attendanceTracking": True,
                        "notifications": {
                            "enabled": True,
                            "reminderSent": False,
                            "reminderTime": "24h"
                        }
                    },
                    {
                        "id": "event_test_2", 
                        "title": "Tournament Event Test",
                        "date": future_date,
                        "time": "14:00",
                        "location": "Tournament Grounds",
                        "type": "tournament",
                        "teams": ["team1", "team2"],
                        "description": "Multi-team tournament event",
                        "photo": "",
                        "gameStatus": "scheduled",
                        "homeTeam": None,
                        "awayTeam": None,
                        "homeScore": 0,
                        "awayScore": 0,
                        "rsvpEnabled": True,
                        "rsvpResponses": [
                            {
                                "userId": "user1",
                                "userName": "Test Player",
                                "response": "yes",
                                "timestamp": datetime.now().isoformat()
                            }
                        ],
                        "attendanceTracking": True,
                        "bracketData": {
                            "rounds": [],
                            "teams": ["team1", "team2"]
                        }
                    }
                ],
                "leagueInfo": {"name": "Event Test League"},
                "websiteStyle": {"theme": "default"}
            }
            
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=test_event_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    self.log_test(
                        "Event Data Structure Storage", 
                        True, 
                        f"Successfully saved league data with {len(test_event_data['leagueSchedule'])} events", 
                        {"events_count": len(test_event_data['leagueSchedule'])}
                    )
                    return True, test_event_data
                else:
                    self.log_test(
                        "Event Data Structure Storage", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Event Data Structure Storage", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Data Structure Storage", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_event_data_retrieval(self):
        """Test retrieving event data from league schedule"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                if isinstance(league_schedule, list):
                    event_count = len(league_schedule)
                    
                    # Check for events with proper structure
                    valid_events = 0
                    for event in league_schedule:
                        required_fields = ['id', 'title', 'date', 'time', 'location', 'type']
                        if all(field in event for field in required_fields):
                            valid_events += 1
                    
                    self.log_test(
                        "Event Data Retrieval", 
                        True, 
                        f"Retrieved {event_count} events, {valid_events} with valid structure", 
                        {"total_events": event_count, "valid_events": valid_events}
                    )
                    return True, league_schedule
                else:
                    self.log_test(
                        "Event Data Retrieval", 
                        False, 
                        f"leagueSchedule is not a list: {type(league_schedule)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Event Data Retrieval", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Data Retrieval", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_event_photo_handling(self):
        """Test that event photos (base64 data) are handled correctly"""
        try:
            # Test with event containing photo data
            test_event_with_photo = [
                {
                    "id": "photo_test_event",
                    "title": "Photo Test Event",
                    "date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
                    "time": "16:00",
                    "location": "Photo Test Location",
                    "type": "game",
                    "teams": ["team1", "team2"],
                    "description": "Testing photo upload functionality",
                    "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
                    "gameStatus": "scheduled",
                    "homeTeam": "team1",
                    "awayTeam": "team2",
                    "homeScore": 0,
                    "awayScore": 0
                }
            ]
            
            # Save event with photo
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=test_event_with_photo,
                headers={'Content-Type': 'application/json'},
                timeout=15  # Longer timeout for photo data
            )
            
            if response.status_code == 200:
                # Retrieve and verify photo data persisted
                time.sleep(1)  # Wait for database write
                
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if get_response.status_code == 200:
                    data = get_response.json()
                    events = data.get('leagueSchedule', [])
                    
                    photo_event = None
                    for event in events:
                        if event.get('id') == 'photo_test_event':
                            photo_event = event
                            break
                    
                    if photo_event and photo_event.get('photo'):
                        photo_data = photo_event['photo']
                        if photo_data.startswith('data:image/'):
                            self.log_test(
                                "Event Photo Handling", 
                                True, 
                                f"Photo data persisted correctly (length: {len(photo_data)} chars)", 
                                {"photo_format": "base64", "has_photo": True}
                            )
                            return True
                        else:
                            self.log_test(
                                "Event Photo Handling", 
                                False, 
                                f"Photo data format incorrect: {photo_data[:50]}..."
                            )
                            return False
                    else:
                        self.log_test(
                            "Event Photo Handling", 
                            False, 
                            "Photo data not found in retrieved event"
                        )
                        return False
                else:
                    self.log_test(
                        "Event Photo Handling", 
                        False, 
                        f"Failed to retrieve data: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Event Photo Handling", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Photo Handling", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_team_data_integration(self):
        """Test that team data integrates properly with events"""
        try:
            # Get current league data to check team-event integration
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                events = data.get('leagueSchedule', [])
                
                team_ids = [team.get('id') for team in teams if team.get('id')]
                
                # Check if events reference valid team IDs
                valid_team_references = 0
                total_team_references = 0
                
                for event in events:
                    event_teams = event.get('teams', [])
                    if isinstance(event_teams, list):
                        for team_id in event_teams:
                            total_team_references += 1
                            if team_id in team_ids:
                                valid_team_references += 1
                
                if total_team_references > 0:
                    validity_rate = (valid_team_references / total_team_references) * 100
                    self.log_test(
                        "Team-Event Integration", 
                        validity_rate >= 50,  # At least 50% valid references
                        f"Team reference validity: {validity_rate:.1f}% ({valid_team_references}/{total_team_references})", 
                        {"teams_count": len(teams), "events_count": len(events)}
                    )
                    return validity_rate >= 50
                else:
                    self.log_test(
                        "Team-Event Integration", 
                        True, 
                        "No team references to validate (acceptable)", 
                        {"teams_count": len(teams), "events_count": len(events)}
                    )
                    return True
            else:
                self.log_test(
                    "Team-Event Integration", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team-Event Integration", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_event_tests(self):
        """Run all event-focused backend tests"""
        print("Starting Event-Focused Backend API Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 70)
        
        # Test event data handling
        self.test_event_data_structure()
        self.test_event_data_retrieval()
        self.test_event_photo_handling()
        self.test_team_data_integration()
        
        # Summary
        print("=" * 70)
        print("EVENT BACKEND TEST SUMMARY")
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
        
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    try:
        tester = EventBackendTester()
        success = tester.run_event_tests()
        
        if success:
            print("\n🎉 Event backend tests completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some event backend tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)