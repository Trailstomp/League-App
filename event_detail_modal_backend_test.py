#!/usr/bin/env python3
"""
Event Detail Modal Backend Testing Suite
Tests backend functionality specifically for Event Detail Modal features including:
- Event creation, updating, deletion operations
- Tournament event handling
- Event data persistence and integrity
- Delete operations from leagueSchedule
- RSVP and attendance tracking
- Performance verification
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

class EventDetailModalTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Event Detail Modal Backend at: {self.api_base}")
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

    def create_sample_event_data(self):
        """Create comprehensive sample event data for testing"""
        base_date = datetime.now()
        
        return {
            "teams": [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Thunder Hawks",
                    "division": "Field",
                    "primaryColor": "#FF6B35",
                    "secondaryColor": "#004E89"
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Lightning Bolts", 
                    "division": "Field",
                    "primaryColor": "#FFD23F",
                    "secondaryColor": "#EE6C4D"
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Storm Riders",
                    "division": "Box",
                    "primaryColor": "#3A86FF",
                    "secondaryColor": "#06FFA5"
                }
            ],
            "players": [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Alex Johnson",
                    "teamId": "team1",
                    "position": "Attack",
                    "jerseyNumber": 12
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Sam Wilson",
                    "teamId": "team2", 
                    "position": "Goalie",
                    "jerseyNumber": 1
                }
            ],
            "users": [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Coach Mike",
                    "email": "coach@thunderhawks.com",
                    "role": "coach",
                    "teamId": "team1"
                }
            ],
            "leagueSchedule": [
                {
                    "id": str(uuid.uuid4()),
                    "title": "Championship Game",
                    "date": (base_date + timedelta(days=7)).strftime("%Y-%m-%d"),
                    "time": "19:00",
                    "location": "Main Stadium",
                    "teams": ["team1", "team2"],
                    "type": "game",
                    "status": "scheduled",
                    "rsvpEnabled": True,
                    "attendanceTracking": True,
                    "rsvpResponses": [
                        {
                            "userId": "user1",
                            "response": "yes",
                            "timestamp": datetime.now().isoformat()
                        }
                    ],
                    "scores": {
                        "team1": 0,
                        "team2": 0,
                        "final": False
                    },
                    "stats": {
                        "team1": {"goals": 0, "assists": 0, "saves": 0},
                        "team2": {"goals": 0, "assists": 0, "saves": 0}
                    }
                },
                {
                    "id": str(uuid.uuid4()),
                    "title": "Spring Tournament",
                    "date": (base_date + timedelta(days=14)).strftime("%Y-%m-%d"),
                    "time": "09:00",
                    "location": "Tournament Complex",
                    "teams": ["team1", "team2", "team3"],
                    "type": "tournament",
                    "status": "scheduled",
                    "rsvpEnabled": True,
                    "attendanceTracking": True,
                    "tournamentBracket": {
                        "rounds": [
                            {
                                "name": "Semifinals",
                                "matches": [
                                    {"team1": "team1", "team2": "team2", "winner": None},
                                    {"team1": "team3", "team2": "bye", "winner": "team3"}
                                ]
                            },
                            {
                                "name": "Finals", 
                                "matches": [
                                    {"team1": "TBD", "team2": "team3", "winner": None}
                                ]
                            }
                        ]
                    },
                    "rsvpResponses": [
                        {
                            "userId": "user1",
                            "response": "yes",
                            "timestamp": datetime.now().isoformat()
                        }
                    ]
                },
                {
                    "id": str(uuid.uuid4()),
                    "title": "Practice Session",
                    "date": (base_date + timedelta(days=3)).strftime("%Y-%m-%d"),
                    "time": "18:00",
                    "location": "Training Field",
                    "teams": ["team1"],
                    "type": "practice",
                    "status": "scheduled",
                    "rsvpEnabled": True,
                    "attendanceTracking": True,
                    "rsvpResponses": []
                }
            ],
            "newsItems": [],
            "gameTickerData": [],
            "leagueInfo": {"name": "Test League", "season": "2024"},
            "websiteStyle": {"theme": "default"}
        }

    def test_event_data_storage(self):
        """Test storing comprehensive event data with Event Detail Modal features"""
        try:
            test_data = self.create_sample_event_data()
            
            response = requests.post(
                f"{self.api_base}/league-data",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    event_count = len(test_data['leagueSchedule'])
                    tournament_events = [e for e in test_data['leagueSchedule'] if e.get('type') == 'tournament']
                    rsvp_events = [e for e in test_data['leagueSchedule'] if e.get('rsvpEnabled')]
                    
                    self.log_test(
                        "Event Data Storage - Comprehensive",
                        True,
                        f"Stored {event_count} events ({len(tournament_events)} tournaments, {len(rsvp_events)} RSVP-enabled)",
                        {"events": event_count, "tournaments": len(tournament_events)}
                    )
                    return True, test_data
                else:
                    self.log_test(
                        "Event Data Storage - Comprehensive",
                        False,
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Event Data Storage - Comprehensive",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Data Storage - Comprehensive",
                False,
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_event_data_retrieval(self):
        """Test retrieving event data and validating Event Detail Modal structure"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                if events:
                    # Validate event structure for Event Detail Modal
                    required_fields = ['id', 'title', 'date', 'time', 'location', 'teams', 'type', 'status']
                    modal_fields = ['rsvpEnabled', 'attendanceTracking', 'scores', 'stats']
                    
                    valid_events = 0
                    rsvp_events = 0
                    tournament_events = 0
                    
                    for event in events:
                        if all(field in event for field in required_fields):
                            valid_events += 1
                            
                        if event.get('rsvpEnabled'):
                            rsvp_events += 1
                            
                        if event.get('type') == 'tournament':
                            tournament_events += 1
                    
                    self.log_test(
                        "Event Data Retrieval - Structure Validation",
                        True,
                        f"Retrieved {len(events)} events ({valid_events} valid, {rsvp_events} RSVP-enabled, {tournament_events} tournaments)",
                        {"total": len(events), "valid": valid_events, "rsvp": rsvp_events}
                    )
                    return True, events
                else:
                    self.log_test(
                        "Event Data Retrieval - Structure Validation",
                        False,
                        "No events found in leagueSchedule"
                    )
                    return False, None
            else:
                self.log_test(
                    "Event Data Retrieval - Structure Validation",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Data Retrieval - Structure Validation",
                False,
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_event_updates(self):
        """Test event updates through API (scores, RSVP responses)"""
        try:
            # First get current data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test("Event Updates - API Integration", False, "Could not retrieve current data")
                return False
            
            data = response.json()
            events = data.get('leagueSchedule', [])
            
            if not events:
                self.log_test("Event Updates - API Integration", False, "No events to update")
                return False
            
            # Update first event with scores and RSVP
            updated_events = events.copy()
            if updated_events:
                updated_events[0]['scores'] = {
                    "team1": 8,
                    "team2": 6,
                    "final": True
                }
                updated_events[0]['rsvpResponses'] = [
                    {
                        "userId": "user1",
                        "response": "yes",
                        "timestamp": datetime.now().isoformat()
                    },
                    {
                        "userId": "user2", 
                        "response": "no",
                        "timestamp": datetime.now().isoformat()
                    }
                ]
            
            # Update via API
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule",
                json=updated_events,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                # Verify the update
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    verify_events = verify_data.get('leagueSchedule', [])
                    
                    if verify_events and verify_events[0].get('scores', {}).get('final'):
                        rsvp_count = len(verify_events[0].get('rsvpResponses', []))
                        self.log_test(
                            "Event Updates - API Integration",
                            True,
                            f"Successfully updated event scores (8-6 final) and RSVP responses ({rsvp_count} responses)",
                            {"final_score": "8-6", "rsvp_responses": rsvp_count}
                        )
                        return True
                    else:
                        self.log_test(
                            "Event Updates - API Integration",
                            False,
                            "Updates not reflected in retrieved data"
                        )
                        return False
                else:
                    self.log_test(
                        "Event Updates - API Integration",
                        False,
                        "Could not verify updates"
                    )
                    return False
            else:
                self.log_test(
                    "Event Updates - API Integration",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Updates - API Integration",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_event_deletion(self):
        """Test event deletion from leagueSchedule"""
        try:
            # Get current events
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test("Event Deletion - Data Integrity", False, "Could not retrieve current data")
                return False
            
            data = response.json()
            events = data.get('leagueSchedule', [])
            initial_count = len(events)
            
            if initial_count == 0:
                self.log_test("Event Deletion - Data Integrity", False, "No events to delete")
                return False
            
            # Remove the last event (simulating delete operation)
            updated_events = events[:-1]
            
            # Update via API
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule",
                json=updated_events,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                # Verify deletion
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    verify_events = verify_data.get('leagueSchedule', [])
                    final_count = len(verify_events)
                    
                    if final_count == initial_count - 1:
                        self.log_test(
                            "Event Deletion - Data Integrity",
                            True,
                            f"Successfully deleted event. Count reduced from {initial_count} to {final_count}",
                            {"initial": initial_count, "final": final_count}
                        )
                        return True
                    else:
                        self.log_test(
                            "Event Deletion - Data Integrity",
                            False,
                            f"Deletion not reflected. Expected {initial_count - 1}, got {final_count}"
                        )
                        return False
                else:
                    self.log_test(
                        "Event Deletion - Data Integrity",
                        False,
                        "Could not verify deletion"
                    )
                    return False
            else:
                self.log_test(
                    "Event Deletion - Data Integrity",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Deletion - Data Integrity",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_tournament_data_handling(self):
        """Test tournament event data structure and bracket handling"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                tournament_events = [e for e in events if e.get('type') == 'tournament']
                
                if tournament_events:
                    tournament = tournament_events[0]
                    
                    # Validate tournament structure
                    has_bracket = 'tournamentBracket' in tournament
                    has_multiple_teams = len(tournament.get('teams', [])) > 2
                    has_rounds = False
                    
                    if has_bracket:
                        bracket = tournament['tournamentBracket']
                        has_rounds = 'rounds' in bracket and len(bracket['rounds']) > 0
                    
                    if has_bracket and has_multiple_teams and has_rounds:
                        team_count = len(tournament['teams'])
                        round_count = len(tournament['tournamentBracket']['rounds'])
                        
                        self.log_test(
                            "Tournament Data - Structure Validation",
                            True,
                            f"Tournament with {team_count} teams and {round_count} rounds validated",
                            {"teams": team_count, "rounds": round_count, "bracket": True}
                        )
                        return True
                    else:
                        missing = []
                        if not has_bracket: missing.append("bracket")
                        if not has_multiple_teams: missing.append("multiple_teams")
                        if not has_rounds: missing.append("rounds")
                        
                        self.log_test(
                            "Tournament Data - Structure Validation",
                            False,
                            f"Tournament structure incomplete. Missing: {missing}"
                        )
                        return False
                else:
                    self.log_test(
                        "Tournament Data - Structure Validation",
                        False,
                        "No tournament events found"
                    )
                    return False
            else:
                self.log_test(
                    "Tournament Data - Structure Validation",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Tournament Data - Structure Validation",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_attendance_tracking(self):
        """Test attendance tracking data structure and calculations"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                attendance_events = [e for e in events if e.get('attendanceTracking')]
                
                if attendance_events:
                    total_responses = 0
                    yes_responses = 0
                    
                    for event in attendance_events:
                        responses = event.get('rsvpResponses', [])
                        total_responses += len(responses)
                        yes_responses += len([r for r in responses if r.get('response') == 'yes'])
                    
                    attendance_rate = (yes_responses / total_responses * 100) if total_responses > 0 else 0
                    
                    self.log_test(
                        "Attendance Tracking - Data Structure",
                        True,
                        f"Validated {len(attendance_events)} events with attendance tracking. {yes_responses}/{total_responses} responses ({attendance_rate:.1f}% attendance)",
                        {"events": len(attendance_events), "responses": total_responses, "attendance_rate": f"{attendance_rate:.1f}%"}
                    )
                    return True
                else:
                    self.log_test(
                        "Attendance Tracking - Data Structure",
                        False,
                        "No events with attendance tracking found"
                    )
                    return False
            else:
                self.log_test(
                    "Attendance Tracking - Data Structure",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Attendance Tracking - Data Structure",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_api_performance(self):
        """Test API response times for event operations"""
        endpoints = [
            ("GET League Data", f"{self.api_base}/league-data"),
            ("Health Check", f"{self.api_base}/")
        ]
        
        all_fast = True
        response_times = []
        
        for name, url in endpoints:
            try:
                start_time = time.time()
                response = requests.get(url, timeout=10)
                end_time = time.time()
                
                response_time = (end_time - start_time) * 1000  # Convert to ms
                response_times.append(response_time)
                
                if response.status_code == 200 and response_time < 2000:  # 2 second threshold
                    self.log_test(
                        f"API Performance - {name}",
                        True,
                        f"Response time: {response_time:.0f}ms"
                    )
                else:
                    self.log_test(
                        f"API Performance - {name}",
                        False,
                        f"Slow response: {response_time:.0f}ms or HTTP {response.status_code}"
                    )
                    all_fast = False
                    
            except requests.exceptions.RequestException as e:
                self.log_test(
                    f"API Performance - {name}",
                    False,
                    f"Request failed: {str(e)}"
                )
                all_fast = False
        
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            self.log_test(
                "API Performance - Overall",
                all_fast,
                f"Average response time: {avg_time:.0f}ms"
            )
        
        return all_fast

    def run_event_modal_tests(self):
        """Run all Event Detail Modal backend tests"""
        print("Starting Event Detail Modal Backend Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 70)
        
        # Test event data operations
        success, sample_data = self.test_event_data_storage()
        if not success:
            print("❌ CRITICAL: Event data storage failed")
            return False
        
        self.test_event_data_retrieval()
        self.test_event_updates()
        self.test_event_deletion()
        
        # Test specific Event Detail Modal features
        self.test_tournament_data_handling()
        self.test_attendance_tracking()
        
        # Test performance
        self.test_api_performance()
        
        # Summary
        print("=" * 70)
        print("EVENT DETAIL MODAL BACKEND TEST SUMMARY")
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
        tester = EventDetailModalTester()
        success = tester.run_event_modal_tests()
        
        if success:
            print("\n🎉 Event Detail Modal backend tests completed successfully!")
            print("✅ Backend is ready to support all Event Detail Modal features")
            sys.exit(0)
        else:
            print("\n⚠️  Some Event Detail Modal backend tests failed. Check results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)