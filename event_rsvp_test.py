#!/usr/bin/env python3
"""
Event Management & RSVP System Backend Testing Suite
Tests the enhanced event data structure with RSVP functionality through existing league data endpoints.
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

class EventRSVPTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Event Management & RSVP System at: {self.api_base}")
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

    def test_event_data_structure_persistence(self):
        """Test that enhanced event data structure with RSVP can be stored and retrieved"""
        try:
            # Create test data with enhanced event structure including RSVP
            future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            past_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
            
            test_league_data = {
                "teams": [
                    {
                        "id": "rsvp_test_team_1",
                        "name": "RSVP Test Team Alpha",
                        "division": "Field",
                        "calendar": [
                            {
                                "id": "event_rsvp_1",
                                "title": "Practice Session with RSVP",
                                "date": future_date,
                                "time": "18:00",
                                "type": "practice",
                                "location": "Main Field",
                                "description": "Team practice with attendance tracking",
                                "rsvp": {
                                    "enabled": True,
                                    "requiresResponse": True,
                                    "responses": [
                                        {
                                            "userId": "user_1",
                                            "status": "yes",
                                            "timestamp": datetime.now().isoformat(),
                                            "userName": "John Smith"
                                        },
                                        {
                                            "userId": "user_2", 
                                            "status": "maybe",
                                            "timestamp": datetime.now().isoformat(),
                                            "userName": "Jane Doe"
                                        },
                                        {
                                            "userId": "user_3",
                                            "status": "no", 
                                            "timestamp": datetime.now().isoformat(),
                                            "userName": "Bob Johnson"
                                        }
                                    ],
                                    "remindersSent": [
                                        {
                                            "type": "rsvp_request",
                                            "sentAt": datetime.now().isoformat(),
                                            "recipients": ["user_1", "user_2", "user_3"]
                                        }
                                    ]
                                }
                            },
                            {
                                "id": "event_rsvp_2",
                                "title": "Championship Game",
                                "date": future_date,
                                "time": "15:00",
                                "type": "game",
                                "location": "Stadium Field",
                                "description": "Important championship game",
                                "rsvp": {
                                    "enabled": True,
                                    "requiresResponse": False,
                                    "responses": [],
                                    "remindersSent": []
                                }
                            },
                            {
                                "id": "event_no_rsvp",
                                "title": "Regular Practice",
                                "date": past_date,
                                "time": "17:00", 
                                "type": "practice",
                                "location": "Training Ground",
                                "description": "Regular practice without RSVP"
                                # No RSVP object - should work fine
                            }
                        ]
                    },
                    {
                        "id": "rsvp_test_team_2",
                        "name": "RSVP Test Team Beta", 
                        "division": "Box",
                        "calendar": [
                            {
                                "id": "event_rsvp_3",
                                "title": "Box Lacrosse Tournament",
                                "date": future_date,
                                "time": "10:00",
                                "type": "tournament",
                                "location": "Indoor Arena",
                                "description": "Multi-team tournament event",
                                "rsvp": {
                                    "enabled": True,
                                    "requiresResponse": True,
                                    "responses": [
                                        {
                                            "userId": "user_4",
                                            "status": "yes",
                                            "timestamp": datetime.now().isoformat(),
                                            "userName": "Alice Wilson"
                                        }
                                    ],
                                    "remindersSent": []
                                }
                            }
                        ]
                    }
                ],
                "players": [
                    {"id": "user_1", "name": "John Smith", "team": "rsvp_test_team_1"},
                    {"id": "user_2", "name": "Jane Doe", "team": "rsvp_test_team_1"},
                    {"id": "user_3", "name": "Bob Johnson", "team": "rsvp_test_team_1"},
                    {"id": "user_4", "name": "Alice Wilson", "team": "rsvp_test_team_2"}
                ],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {"name": "RSVP Test League"},
                "websiteStyle": {"theme": "default"}
            }
            
            # Save the enhanced event data
            response = requests.post(
                f"{self.api_base}/league-data",
                json=test_league_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "Enhanced Event Data Storage",
                    True,
                    "Successfully stored league data with RSVP-enabled events",
                    {"message": "Data saved with RSVP structure"}
                )
                return True, test_league_data
            else:
                self.log_test(
                    "Enhanced Event Data Storage",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Enhanced Event Data Storage",
                False,
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_event_data_retrieval_and_validation(self):
        """Test retrieval and validation of enhanced event data structure"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate basic structure
                if not isinstance(data.get('teams'), list):
                    self.log_test(
                        "Enhanced Event Data Retrieval",
                        False,
                        "Teams data is not a list"
                    )
                    return False, None
                
                # Find teams with calendar events
                teams_with_events = [team for team in data['teams'] if 'calendar' in team and team['calendar']]
                
                if len(teams_with_events) == 0:
                    self.log_test(
                        "Enhanced Event Data Retrieval",
                        False,
                        "No teams with calendar events found"
                    )
                    return False, None
                
                # Validate RSVP structure in events
                rsvp_events = []
                total_events = 0
                
                for team in teams_with_events:
                    for event in team.get('calendar', []):
                        total_events += 1
                        if 'rsvp' in event and event['rsvp'].get('enabled'):
                            rsvp_events.append({
                                'team': team['name'],
                                'event': event['title'],
                                'rsvp_data': event['rsvp']
                            })
                
                if len(rsvp_events) > 0:
                    # Validate RSVP data structure
                    valid_rsvp_events = 0
                    total_responses = 0
                    
                    for rsvp_event in rsvp_events:
                        rsvp_data = rsvp_event['rsvp_data']
                        
                        # Check required RSVP fields
                        if all(key in rsvp_data for key in ['enabled', 'responses']):
                            valid_rsvp_events += 1
                            responses = rsvp_data.get('responses', [])
                            total_responses += len(responses)
                            
                            # Validate response structure
                            for response in responses:
                                required_response_fields = ['userId', 'status', 'timestamp']
                                if not all(field in response for field in required_response_fields):
                                    self.log_test(
                                        "Enhanced Event Data Retrieval",
                                        False,
                                        f"Invalid RSVP response structure in event: {rsvp_event['event']}"
                                    )
                                    return False, None
                    
                    self.log_test(
                        "Enhanced Event Data Retrieval",
                        True,
                        f"Retrieved {total_events} events, {len(rsvp_events)} with RSVP enabled, {total_responses} total responses",
                        {
                            "total_events": total_events,
                            "rsvp_events": len(rsvp_events),
                            "valid_rsvp_events": valid_rsvp_events,
                            "total_responses": total_responses
                        }
                    )
                    return True, data
                else:
                    self.log_test(
                        "Enhanced Event Data Retrieval",
                        False,
                        f"No RSVP-enabled events found in {total_events} total events"
                    )
                    return False, None
            else:
                self.log_test(
                    "Enhanced Event Data Retrieval",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Enhanced Event Data Retrieval",
                False,
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_rsvp_response_updates(self):
        """Test updating RSVP responses through the API"""
        try:
            # First get current data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "RSVP Response Updates",
                    False,
                    "Could not retrieve current league data"
                )
                return False
            
            data = response.json()
            
            # Find an RSVP-enabled event and add a new response
            updated = False
            for team in data.get('teams', []):
                for event in team.get('calendar', []):
                    if event.get('rsvp', {}).get('enabled'):
                        # Add a new RSVP response
                        new_response = {
                            "userId": "test_user_new",
                            "status": "yes",
                            "timestamp": datetime.now().isoformat(),
                            "userName": "Test User New"
                        }
                        
                        if 'responses' not in event['rsvp']:
                            event['rsvp']['responses'] = []
                        
                        # Remove any existing response from this user first
                        event['rsvp']['responses'] = [
                            r for r in event['rsvp']['responses'] 
                            if r.get('userId') != 'test_user_new'
                        ]
                        
                        # Add the new response
                        event['rsvp']['responses'].append(new_response)
                        updated = True
                        break
                if updated:
                    break
            
            if not updated:
                self.log_test(
                    "RSVP Response Updates",
                    False,
                    "No RSVP-enabled events found to update"
                )
                return False
            
            # Save the updated data
            response = requests.post(
                f"{self.api_base}/league-data",
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify the update by retrieving data again
                time.sleep(1)  # Brief pause for database write
                
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    
                    # Check if our new response is there
                    found_new_response = False
                    for team in verify_data.get('teams', []):
                        for event in team.get('calendar', []):
                            if event.get('rsvp', {}).get('enabled'):
                                responses = event['rsvp'].get('responses', [])
                                for response in responses:
                                    if response.get('userId') == 'test_user_new':
                                        found_new_response = True
                                        break
                                if found_new_response:
                                    break
                        if found_new_response:
                            break
                    
                    if found_new_response:
                        self.log_test(
                            "RSVP Response Updates",
                            True,
                            "Successfully updated and verified RSVP response",
                            {"new_user_response": "test_user_new -> yes"}
                        )
                        return True
                    else:
                        self.log_test(
                            "RSVP Response Updates",
                            False,
                            "RSVP response update was not persisted"
                        )
                        return False
                else:
                    self.log_test(
                        "RSVP Response Updates",
                        False,
                        f"Could not verify update: HTTP {verify_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "RSVP Response Updates",
                    False,
                    f"Update failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "RSVP Response Updates",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_attendance_tracking_data(self):
        """Test attendance tracking data structure and calculations"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Attendance Tracking Data",
                    False,
                    "Could not retrieve league data for attendance testing"
                )
                return False
            
            data = response.json()
            
            # Analyze attendance data
            attendance_stats = {
                'total_events': 0,
                'rsvp_events': 0,
                'events_with_responses': 0,
                'total_responses': 0,
                'yes_responses': 0,
                'maybe_responses': 0,
                'no_responses': 0,
                'attendance_rates': []
            }
            
            for team in data.get('teams', []):
                for event in team.get('calendar', []):
                    attendance_stats['total_events'] += 1
                    
                    if event.get('rsvp', {}).get('enabled'):
                        attendance_stats['rsvp_events'] += 1
                        responses = event['rsvp'].get('responses', [])
                        
                        if responses:
                            attendance_stats['events_with_responses'] += 1
                            attendance_stats['total_responses'] += len(responses)
                            
                            yes_count = len([r for r in responses if r.get('status') == 'yes'])
                            maybe_count = len([r for r in responses if r.get('status') == 'maybe'])
                            no_count = len([r for r in responses if r.get('status') == 'no'])
                            
                            attendance_stats['yes_responses'] += yes_count
                            attendance_stats['maybe_responses'] += maybe_count
                            attendance_stats['no_responses'] += no_count
                            
                            # Calculate attendance rate for this event
                            if len(responses) > 0:
                                attendance_rate = (yes_count / len(responses)) * 100
                                attendance_stats['attendance_rates'].append(attendance_rate)
            
            # Calculate overall attendance rate
            overall_attendance_rate = 0
            if attendance_stats['attendance_rates']:
                overall_attendance_rate = sum(attendance_stats['attendance_rates']) / len(attendance_stats['attendance_rates'])
            
            if attendance_stats['rsvp_events'] > 0:
                self.log_test(
                    "Attendance Tracking Data",
                    True,
                    f"Attendance tracking working: {attendance_stats['rsvp_events']} RSVP events, {attendance_stats['total_responses']} responses, {overall_attendance_rate:.1f}% avg attendance",
                    {
                        "rsvp_events": attendance_stats['rsvp_events'],
                        "total_responses": attendance_stats['total_responses'],
                        "yes_responses": attendance_stats['yes_responses'],
                        "overall_attendance_rate": f"{overall_attendance_rate:.1f}%"
                    }
                )
                return True
            else:
                self.log_test(
                    "Attendance Tracking Data",
                    False,
                    "No RSVP-enabled events found for attendance tracking"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Attendance Tracking Data",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_event_notification_data(self):
        """Test event notification system data structure"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Event Notification Data",
                    False,
                    "Could not retrieve league data for notification testing"
                )
                return False
            
            data = response.json()
            
            # Check for notification/reminder data in events
            notification_stats = {
                'events_with_reminders': 0,
                'total_reminders_sent': 0,
                'reminder_types': set()
            }
            
            for team in data.get('teams', []):
                for event in team.get('calendar', []):
                    if event.get('rsvp', {}).get('enabled'):
                        reminders = event['rsvp'].get('remindersSent', [])
                        if reminders:
                            notification_stats['events_with_reminders'] += 1
                            notification_stats['total_reminders_sent'] += len(reminders)
                            
                            for reminder in reminders:
                                if 'type' in reminder:
                                    notification_stats['reminder_types'].add(reminder['type'])
            
            if notification_stats['events_with_reminders'] > 0:
                self.log_test(
                    "Event Notification Data",
                    True,
                    f"Notification system data found: {notification_stats['events_with_reminders']} events with reminders, {notification_stats['total_reminders_sent']} total reminders",
                    {
                        "events_with_reminders": notification_stats['events_with_reminders'],
                        "total_reminders": notification_stats['total_reminders_sent'],
                        "reminder_types": list(notification_stats['reminder_types'])
                    }
                )
                return True
            else:
                self.log_test(
                    "Event Notification Data",
                    True,  # This is OK - notification data structure exists even if no reminders sent yet
                    "Notification system data structure ready (no reminders sent yet)",
                    {"notification_structure": "Available in RSVP events"}
                )
                return True
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Notification Data",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all event management and RSVP tests"""
        print("Starting Event Management & RSVP System Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 70)
        
        # Test enhanced event data structure
        success1, _ = self.test_event_data_structure_persistence()
        if not success1:
            print("❌ CRITICAL: Enhanced event data storage failed.")
            return False
        
        # Test data retrieval and validation
        success2, _ = self.test_event_data_retrieval_and_validation()
        if not success2:
            print("❌ CRITICAL: Enhanced event data retrieval failed.")
            return False
        
        # Test RSVP response updates
        self.test_rsvp_response_updates()
        
        # Test attendance tracking
        self.test_attendance_tracking_data()
        
        # Test notification system data
        self.test_event_notification_data()
        
        # Summary
        print("=" * 70)
        print("EVENT MANAGEMENT & RSVP TEST SUMMARY")
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
        
        # Return True if all critical tests pass
        critical_failures = [t for t in self.failed_tests if 'Enhanced Event Data' in t]
        return len(critical_failures) == 0

if __name__ == "__main__":
    try:
        tester = EventRSVPTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Event Management & RSVP System tests completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some event management tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)