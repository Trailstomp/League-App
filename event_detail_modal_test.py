#!/usr/bin/env python3
"""
Event Detail Modal Backend API Testing Suite
Tests backend functionality specifically for Event Detail Modal integration including:
- Event data storage and retrieval
- Event updates (scores, stats, attendance)
- RSVP system functionality
- Tournament bracket data
- Event notification system
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
        
        print(f"Testing Event Detail Modal Backend Integration at: {self.api_base}")
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

    def create_comprehensive_event_data(self):
        """Create comprehensive event data for Event Detail Modal testing"""
        current_time = datetime.now()
        future_time = current_time + timedelta(days=7)
        
        return {
            "teams": [
                {
                    "id": "team_field_1",
                    "name": "Thunder Hawks",
                    "division": "Field",
                    "primaryColor": "#FF6B35",
                    "secondaryColor": "#004E89"
                },
                {
                    "id": "team_field_2", 
                    "name": "Lightning Bolts",
                    "division": "Field",
                    "primaryColor": "#FFD23F",
                    "secondaryColor": "#EE6C4D"
                },
                {
                    "id": "team_box_1",
                    "name": "Storm Riders",
                    "division": "Box",
                    "primaryColor": "#3A86FF",
                    "secondaryColor": "#06FFA5"
                }
            ],
            "players": [
                {
                    "id": "player_1",
                    "name": "Alex Johnson",
                    "teamId": "team_field_1",
                    "position": "Attack",
                    "jerseyNumber": 12,
                    "stats": {
                        "goals": 15,
                        "assists": 8,
                        "saves": 0,
                        "groundBalls": 22
                    }
                },
                {
                    "id": "player_2",
                    "name": "Sarah Martinez",
                    "teamId": "team_field_2",
                    "position": "Goalie",
                    "jerseyNumber": 1,
                    "stats": {
                        "goals": 0,
                        "assists": 2,
                        "saves": 45,
                        "groundBalls": 12
                    }
                }
            ],
            "users": [
                {
                    "id": "user_1",
                    "name": "Coach Mike Thompson",
                    "email": "coach.thompson@thunderhawks.com",
                    "role": "coach",
                    "teamId": "team_field_1",
                    "status": "active"
                },
                {
                    "id": "user_2",
                    "name": "Player Emma Wilson",
                    "email": "emma.wilson@lightningbolts.com", 
                    "role": "player",
                    "teamId": "team_field_2",
                    "status": "active"
                }
            ],
            "leagueSchedule": [
                {
                    "id": "event_game_1",
                    "type": "game",
                    "title": "Thunder Hawks vs Lightning Bolts",
                    "date": future_time.strftime("%Y-%m-%d"),
                    "time": "14:00",
                    "location": "Central Sports Complex",
                    "teams": ["team_field_1", "team_field_2"],
                    "status": "scheduled",
                    "rsvpEnabled": True,
                    "rsvpResponses": [
                        {
                            "userId": "user_1",
                            "response": "yes",
                            "timestamp": current_time.isoformat(),
                            "userName": "Coach Mike Thompson"
                        },
                        {
                            "userId": "user_2", 
                            "response": "yes",
                            "timestamp": current_time.isoformat(),
                            "userName": "Player Emma Wilson"
                        }
                    ],
                    "attendanceTracking": {
                        "enabled": True,
                        "attendees": ["user_1", "user_2"],
                        "totalExpected": 25,
                        "totalAttended": 23
                    },
                    "scores": {
                        "team_field_1": 0,
                        "team_field_2": 0,
                        "final": False
                    },
                    "gameStats": {
                        "team_field_1": {
                            "goals": 0,
                            "assists": 0,
                            "saves": 0,
                            "groundBalls": 0
                        },
                        "team_field_2": {
                            "goals": 0,
                            "assists": 0,
                            "saves": 0,
                            "groundBalls": 0
                        }
                    },
                    "notifications": {
                        "remindersSent": 1,
                        "lastReminderDate": current_time.isoformat(),
                        "rsvpRequestsSent": 2
                    }
                },
                {
                    "id": "event_practice_1",
                    "type": "practice",
                    "title": "Thunder Hawks Practice",
                    "date": (current_time + timedelta(days=2)).strftime("%Y-%m-%d"),
                    "time": "18:00",
                    "location": "Training Field A",
                    "teams": ["team_field_1"],
                    "status": "scheduled",
                    "rsvpEnabled": True,
                    "rsvpResponses": [
                        {
                            "userId": "user_1",
                            "response": "yes",
                            "timestamp": current_time.isoformat(),
                            "userName": "Coach Mike Thompson"
                        }
                    ],
                    "attendanceTracking": {
                        "enabled": True,
                        "attendees": ["user_1"],
                        "totalExpected": 15,
                        "totalAttended": 14
                    }
                },
                {
                    "id": "event_tournament_1",
                    "type": "tournament",
                    "title": "Spring Championship Tournament",
                    "date": (current_time + timedelta(days=14)).strftime("%Y-%m-%d"),
                    "time": "09:00",
                    "location": "Championship Arena",
                    "teams": ["team_field_1", "team_field_2", "team_box_1"],
                    "status": "scheduled",
                    "rsvpEnabled": True,
                    "rsvpResponses": [],
                    "tournamentBracket": {
                        "rounds": [
                            {
                                "round": 1,
                                "matches": [
                                    {
                                        "id": "match_1",
                                        "team1": "team_field_1",
                                        "team2": "team_field_2",
                                        "winner": None,
                                        "score1": 0,
                                        "score2": 0
                                    }
                                ]
                            }
                        ]
                    }
                }
            ],
            "newsItems": [],
            "gameTickerData": [],
            "leagueInfo": {
                "name": "Metro Lacrosse League",
                "season": "Spring 2024",
                "commissioner": "John Smith"
            },
            "websiteStyle": {
                "theme": "default",
                "primaryColor": "#1E40AF",
                "secondaryColor": "#F59E0B"
            }
        }

    def test_event_data_storage(self):
        """Test storing comprehensive event data with Event Detail Modal features"""
        try:
            event_data = self.create_comprehensive_event_data()
            
            response = requests.post(
                f"{self.api_base}/league-data",
                json=event_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    self.log_test(
                        "Event Data Storage - Comprehensive",
                        True,
                        f"Stored league data with {len(event_data['leagueSchedule'])} events including RSVP, attendance, and tournament data",
                        {"events_stored": len(event_data['leagueSchedule']), "teams": len(event_data['teams'])}
                    )
                    return True, event_data
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
                
                if len(events) >= 3:  # Should have game, practice, tournament
                    # Validate RSVP-enabled events
                    rsvp_events = [e for e in events if e.get('rsvpEnabled')]
                    attendance_events = [e for e in events if e.get('attendanceTracking', {}).get('enabled')]
                    tournament_events = [e for e in events if e.get('type') == 'tournament']
                    
                    # Validate event structure for Event Detail Modal
                    game_event = next((e for e in events if e.get('type') == 'game'), None)
                    if game_event:
                        required_fields = ['id', 'title', 'date', 'time', 'teams', 'rsvpResponses', 'attendanceTracking', 'scores', 'gameStats']
                        missing_fields = [f for f in required_fields if f not in game_event]
                        
                        if not missing_fields:
                            self.log_test(
                                "Event Data Retrieval - Structure Validation",
                                True,
                                f"Retrieved {len(events)} events: {len(rsvp_events)} RSVP-enabled, {len(attendance_events)} with attendance tracking, {len(tournament_events)} tournaments",
                                {
                                    "total_events": len(events),
                                    "rsvp_events": len(rsvp_events),
                                    "rsvp_responses": len(game_event.get('rsvpResponses', [])),
                                    "attendance_enabled": len(attendance_events)
                                }
                            )
                            return True, data
                        else:
                            self.log_test(
                                "Event Data Retrieval - Structure Validation",
                                False,
                                f"Game event missing required fields for Event Detail Modal: {missing_fields}"
                            )
                            return False, None
                    else:
                        self.log_test(
                            "Event Data Retrieval - Structure Validation",
                            False,
                            "No game event found in retrieved data"
                        )
                        return False, None
                else:
                    self.log_test(
                        "Event Data Retrieval - Structure Validation",
                        False,
                        f"Expected at least 3 events, got {len(events)}"
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

    def test_event_updates_via_api(self):
        """Test updating event data through API (simulating Event Detail Modal updates)"""
        try:
            # First get current data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Event Updates - API Integration",
                    False,
                    "Could not retrieve current league data for update test"
                )
                return False
            
            data = response.json()
            events = data.get('leagueSchedule', [])
            
            # Find a game event to update
            game_event = next((e for e in events if e.get('type') == 'game'), None)
            if not game_event:
                self.log_test(
                    "Event Updates - API Integration",
                    False,
                    "No game event found to update"
                )
                return False
            
            # Update the game event with new scores and RSVP response
            game_event['scores'] = {
                "team_field_1": 8,
                "team_field_2": 6,
                "final": True
            }
            
            # Add new RSVP response
            new_rsvp = {
                "userId": "user_new_test",
                "response": "yes",
                "timestamp": datetime.now().isoformat(),
                "userName": "Test User for Modal"
            }
            game_event['rsvpResponses'].append(new_rsvp)
            
            # Update attendance
            game_event['attendanceTracking']['totalAttended'] = 25
            
            # Update the schedule via API
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule",
                json=events,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                # Verify the update by retrieving data again
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    verify_events = verify_data.get('leagueSchedule', [])
                    updated_game = next((e for e in verify_events if e.get('id') == game_event['id']), None)
                    
                    if updated_game and updated_game['scores']['final'] == True and len(updated_game['rsvpResponses']) >= 3:
                        self.log_test(
                            "Event Updates - API Integration",
                            True,
                            f"Successfully updated event scores (8-6 final) and RSVP responses ({len(updated_game['rsvpResponses'])} total)",
                            {
                                "final_score": f"{updated_game['scores']['team_field_1']}-{updated_game['scores']['team_field_2']}",
                                "rsvp_count": len(updated_game['rsvpResponses']),
                                "attendance": updated_game['attendanceTracking']['totalAttended']
                            }
                        )
                        return True
                    else:
                        self.log_test(
                            "Event Updates - API Integration",
                            False,
                            "Event update verification failed - data not properly persisted"
                        )
                        return False
                else:
                    self.log_test(
                        "Event Updates - API Integration",
                        False,
                        f"Could not verify update: HTTP {verify_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Event Updates - API Integration",
                    False,
                    f"Update failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Updates - API Integration",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_attendance_tracking_data(self):
        """Test attendance tracking data structure for Event Detail Modal"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                # Find events with attendance tracking
                attendance_events = [e for e in events if e.get('attendanceTracking', {}).get('enabled')]
                
                if len(attendance_events) >= 2:  # Should have at least game and practice
                    total_expected = sum(e['attendanceTracking']['totalExpected'] for e in attendance_events)
                    total_attended = sum(e['attendanceTracking']['totalAttended'] for e in attendance_events)
                    attendance_rate = (total_attended / total_expected * 100) if total_expected > 0 else 0
                    
                    # Validate attendance data structure
                    valid_structure = True
                    for event in attendance_events:
                        att_data = event['attendanceTracking']
                        required_fields = ['enabled', 'attendees', 'totalExpected', 'totalAttended']
                        if not all(field in att_data for field in required_fields):
                            valid_structure = False
                            break
                    
                    if valid_structure:
                        self.log_test(
                            "Attendance Tracking - Data Structure",
                            True,
                            f"Validated attendance tracking for {len(attendance_events)} events with {attendance_rate:.1f}% attendance rate",
                            {
                                "events_with_tracking": len(attendance_events),
                                "total_expected": total_expected,
                                "total_attended": total_attended,
                                "attendance_rate": f"{attendance_rate:.1f}%"
                            }
                        )
                        return True
                    else:
                        self.log_test(
                            "Attendance Tracking - Data Structure",
                            False,
                            "Invalid attendance tracking data structure found"
                        )
                        return False
                else:
                    self.log_test(
                        "Attendance Tracking - Data Structure",
                        False,
                        f"Expected at least 2 events with attendance tracking, found {len(attendance_events)}"
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

    def test_tournament_bracket_data(self):
        """Test tournament bracket data structure for Event Detail Modal"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                # Find tournament events
                tournament_events = [e for e in events if e.get('type') == 'tournament']
                
                if len(tournament_events) >= 1:
                    tournament = tournament_events[0]
                    
                    # Validate tournament bracket structure
                    if 'tournamentBracket' in tournament:
                        bracket = tournament['tournamentBracket']
                        if 'rounds' in bracket and len(bracket['rounds']) > 0:
                            round_data = bracket['rounds'][0]
                            if 'matches' in round_data and len(round_data['matches']) > 0:
                                match_data = round_data['matches'][0]
                                required_match_fields = ['id', 'team1', 'team2', 'winner', 'score1', 'score2']
                                
                                if all(field in match_data for field in required_match_fields):
                                    self.log_test(
                                        "Tournament Bracket - Data Structure",
                                        True,
                                        f"Validated tournament bracket structure with {len(bracket['rounds'])} rounds and {len(round_data['matches'])} matches",
                                        {
                                            "tournament_title": tournament['title'],
                                            "rounds": len(bracket['rounds']),
                                            "matches_in_round_1": len(round_data['matches']),
                                            "teams_in_tournament": len(tournament['teams'])
                                        }
                                    )
                                    return True
                                else:
                                    missing = [f for f in required_match_fields if f not in match_data]
                                    self.log_test(
                                        "Tournament Bracket - Data Structure",
                                        False,
                                        f"Tournament match missing required fields: {missing}"
                                    )
                                    return False
                            else:
                                self.log_test(
                                    "Tournament Bracket - Data Structure",
                                    False,
                                    "Tournament round has no matches"
                                )
                                return False
                        else:
                            self.log_test(
                                "Tournament Bracket - Data Structure",
                                False,
                                "Tournament bracket has no rounds"
                            )
                            return False
                    else:
                        self.log_test(
                            "Tournament Bracket - Data Structure",
                            False,
                            "Tournament event missing bracket data"
                        )
                        return False
                else:
                    self.log_test(
                        "Tournament Bracket - Data Structure",
                        False,
                        f"No tournament events found, expected at least 1"
                    )
                    return False
            else:
                self.log_test(
                    "Tournament Bracket - Data Structure",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Tournament Bracket - Data Structure",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_notification_system_data(self):
        """Test notification system data structure for Event Detail Modal"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                
                # Find events with notification data
                notification_events = [e for e in events if 'notifications' in e]
                
                if len(notification_events) >= 1:
                    event_with_notifications = notification_events[0]
                    notifications = event_with_notifications['notifications']
                    
                    # Validate notification structure
                    required_fields = ['remindersSent', 'lastReminderDate', 'rsvpRequestsSent']
                    if all(field in notifications for field in required_fields):
                        self.log_test(
                            "Notification System - Data Structure",
                            True,
                            f"Validated notification system with {notifications['remindersSent']} reminders sent and {notifications['rsvpRequestsSent']} RSVP requests",
                            {
                                "events_with_notifications": len(notification_events),
                                "reminders_sent": notifications['remindersSent'],
                                "rsvp_requests_sent": notifications['rsvpRequestsSent'],
                                "last_reminder": notifications['lastReminderDate'][:10]  # Just date part
                            }
                        )
                        return True
                    else:
                        missing = [f for f in required_fields if f not in notifications]
                        self.log_test(
                            "Notification System - Data Structure",
                            False,
                            f"Notification data missing required fields: {missing}"
                        )
                        return False
                else:
                    self.log_test(
                        "Notification System - Data Structure",
                        False,
                        "No events with notification data found"
                    )
                    return False
            else:
                self.log_test(
                    "Notification System - Data Structure",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Notification System - Data Structure",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all Event Detail Modal backend tests"""
        print("Starting Event Detail Modal Backend API Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 80)
        
        # Test event data storage and retrieval
        success, _ = self.test_event_data_storage()
        if not success:
            print("❌ CRITICAL: Event data storage failed. Cannot proceed with other tests.")
            return False
        
        # Test event data retrieval and structure
        self.test_event_data_retrieval()
        
        # Test event updates (simulating Event Detail Modal interactions)
        self.test_event_updates_via_api()
        
        # Test specific Event Detail Modal features
        self.test_attendance_tracking_data()
        self.test_tournament_bracket_data()
        self.test_notification_system_data()
        
        # Summary
        print("=" * 80)
        print("EVENT DETAIL MODAL BACKEND TEST SUMMARY")
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
        tester = EventDetailModalTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Event Detail Modal backend tests completed successfully!")
            print("✅ Backend is ready to support Event Detail Modal functionality")
            sys.exit(0)
        else:
            print("\n⚠️  Some Event Detail Modal backend tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)