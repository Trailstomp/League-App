#!/usr/bin/env python3
"""
Event Data Verification Test for Lacrosse League Management Application
Specifically checks the current state of event data in the backend database
to verify what events are persisting and need to be cleared.
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

class EventDataVerifier:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🔍 EVENT DATA VERIFICATION")
        print(f"Testing backend at: {self.api_base}")
        print("=" * 80)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data:
            print(f"    Data: {response_data}")
        
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
                        f"Backend is accessible and responding correctly"
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

    def test_league_schedule_events(self):
        """Check current leagueSchedule events in database"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                if isinstance(league_schedule, list):
                    event_count = len(league_schedule)
                    
                    if event_count == 0:
                        self.log_test(
                            "League Schedule Events", 
                            True, 
                            f"No events found in leagueSchedule - database is clean",
                            f"Event count: {event_count}"
                        )
                    else:
                        # Analyze the events found
                        event_details = []
                        for i, event in enumerate(league_schedule):
                            event_info = {
                                'index': i,
                                'title': event.get('title', 'No title'),
                                'date': event.get('date', 'No date'),
                                'time': event.get('time', 'No time'),
                                'type': event.get('type', 'No type'),
                                'teams': event.get('teams', []),
                                'id': event.get('id', 'No ID')
                            }
                            event_details.append(event_info)
                        
                        self.log_test(
                            "League Schedule Events", 
                            True, 
                            f"Found {event_count} events in leagueSchedule that need to be cleared",
                            event_details
                        )
                    
                    return True, league_schedule
                else:
                    self.log_test(
                        "League Schedule Events", 
                        False, 
                        f"leagueSchedule is not a list: {type(league_schedule)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "League Schedule Events", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "League Schedule Events", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_team_calendar_data(self):
        """Check if teams have calendar data with events"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                
                teams_with_events = []
                total_team_events = 0
                
                for team in teams:
                    team_name = team.get('name', 'Unknown Team')
                    team_id = team.get('id', 'No ID')
                    
                    # Check for various calendar/event fields in team data
                    calendar_fields = ['calendar', 'schedule', 'events', 'teamSchedule']
                    team_events = []
                    
                    for field in calendar_fields:
                        if field in team and team[field]:
                            if isinstance(team[field], list) and len(team[field]) > 0:
                                team_events.extend(team[field])
                            elif isinstance(team[field], dict) and team[field]:
                                team_events.append(team[field])
                    
                    if team_events:
                        teams_with_events.append({
                            'team_name': team_name,
                            'team_id': team_id,
                            'event_count': len(team_events),
                            'events': team_events[:3]  # Show first 3 events for brevity
                        })
                        total_team_events += len(team_events)
                
                if total_team_events == 0:
                    self.log_test(
                        "Team Calendar Data", 
                        True, 
                        f"No team-specific calendar events found - teams are clean",
                        f"Checked {len(teams)} teams"
                    )
                else:
                    self.log_test(
                        "Team Calendar Data", 
                        True, 
                        f"Found {total_team_events} events across {len(teams_with_events)} teams that may need clearing",
                        teams_with_events
                    )
                
                return True, teams_with_events
            else:
                self.log_test(
                    "Team Calendar Data", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team Calendar Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_game_ticker_events(self):
        """Check gameTickerData for any event-related data"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                game_ticker_data = data.get('gameTickerData', [])
                
                if isinstance(game_ticker_data, list):
                    ticker_count = len(game_ticker_data)
                    
                    if ticker_count == 0:
                        self.log_test(
                            "Game Ticker Events", 
                            True, 
                            f"No game ticker data found - ticker is clean",
                            f"Ticker count: {ticker_count}"
                        )
                    else:
                        # Analyze ticker data
                        ticker_details = []
                        for i, ticker_item in enumerate(game_ticker_data):
                            ticker_info = {
                                'index': i,
                                'type': ticker_item.get('type', 'Unknown'),
                                'title': ticker_item.get('title', 'No title'),
                                'date': ticker_item.get('date', 'No date'),
                                'teams': ticker_item.get('teams', []),
                                'status': ticker_item.get('status', 'No status')
                            }
                            ticker_details.append(ticker_info)
                        
                        self.log_test(
                            "Game Ticker Events", 
                            True, 
                            f"Found {ticker_count} items in gameTickerData",
                            ticker_details
                        )
                    
                    return True, game_ticker_data
                else:
                    self.log_test(
                        "Game Ticker Events", 
                        False, 
                        f"gameTickerData is not a list: {type(game_ticker_data)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Game Ticker Events", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Game Ticker Events", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_database_event_cleanup_capability(self):
        """Test if we can clear event data from the database"""
        try:
            # First get current data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code != 200:
                self.log_test(
                    "Database Event Cleanup Capability", 
                    False, 
                    f"Could not retrieve current data: HTTP {response.status_code}"
                )
                return False
            
            current_data = response.json()
            
            # Test clearing leagueSchedule
            clear_schedule_data = []
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=clear_schedule_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify the clear worked
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    cleared_schedule = verify_data.get('leagueSchedule', [])
                    
                    if len(cleared_schedule) == 0:
                        self.log_test(
                            "Database Event Cleanup Capability", 
                            True, 
                            f"Successfully cleared leagueSchedule - database cleanup is working",
                            f"leagueSchedule now has {len(cleared_schedule)} events"
                        )
                        
                        # Restore original data if there was any
                        if current_data.get('leagueSchedule'):
                            restore_response = requests.post(
                                f"{self.api_base}/league-data/leagueSchedule", 
                                json=current_data.get('leagueSchedule', []),
                                headers={'Content-Type': 'application/json'},
                                timeout=10
                            )
                        
                        return True
                    else:
                        self.log_test(
                            "Database Event Cleanup Capability", 
                            False, 
                            f"leagueSchedule was not properly cleared - still has {len(cleared_schedule)} events"
                        )
                        return False
                else:
                    self.log_test(
                        "Database Event Cleanup Capability", 
                        False, 
                        f"Could not verify clear operation: HTTP {verify_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Database Event Cleanup Capability", 
                    False, 
                    f"Could not clear leagueSchedule: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Database Event Cleanup Capability", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_event_verification(self):
        """Run all event data verification tests"""
        print("🔍 Starting Event Data Verification...")
        print(f"Target URL: {self.api_base}")
        print("=" * 80)
        
        # Test basic connectivity first
        if not self.test_backend_connectivity():
            print("❌ CRITICAL: Backend connectivity failed. Cannot proceed with verification.")
            return False
        
        # Check all event data sources
        schedule_success, schedule_data = self.test_league_schedule_events()
        team_success, team_data = self.test_team_calendar_data()
        ticker_success, ticker_data = self.test_game_ticker_events()
        
        # Test cleanup capability
        cleanup_success = self.test_database_event_cleanup_capability()
        
        # Summary
        print("=" * 80)
        print("🔍 EVENT DATA VERIFICATION SUMMARY")
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
        
        # Event Data Analysis
        print(f"\n📊 EVENT DATA ANALYSIS:")
        
        if schedule_success and schedule_data is not None:
            schedule_count = len(schedule_data)
            print(f"  • League Schedule Events: {schedule_count}")
            if schedule_count > 0:
                print(f"    ⚠️  Events found that may need clearing")
                for i, event in enumerate(schedule_data[:3]):  # Show first 3
                    title = event.get('title', 'No title')
                    date = event.get('date', 'No date')
                    print(f"      {i+1}. {title} on {date}")
                if schedule_count > 3:
                    print(f"      ... and {schedule_count - 3} more events")
        
        if team_success and team_data is not None:
            team_event_count = sum(team.get('event_count', 0) for team in team_data)
            print(f"  • Team Calendar Events: {team_event_count}")
            if team_event_count > 0:
                print(f"    ⚠️  Team events found across {len(team_data)} teams")
        
        if ticker_success and ticker_data is not None:
            ticker_count = len(ticker_data)
            print(f"  • Game Ticker Items: {ticker_count}")
        
        print(f"\n🛠️  DATABASE CLEANUP:")
        if cleanup_success:
            print(f"  ✅ Database cleanup capability verified - can clear events")
        else:
            print(f"  ❌ Database cleanup issues detected")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nVerification Success Rate: {success_rate:.1f}%")
        
        # Determine if events need clearing
        events_need_clearing = False
        if schedule_success and schedule_data and len(schedule_data) > 0:
            events_need_clearing = True
        if team_success and team_data and len(team_data) > 0:
            events_need_clearing = True
        
        if events_need_clearing:
            print(f"\n⚠️  CONCLUSION: Event data found that needs to be cleared for fresh start")
        else:
            print(f"\n✅ CONCLUSION: Database appears clean - no residual event data found")
        
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    try:
        verifier = EventDataVerifier()
        success = verifier.run_event_verification()
        
        if success:
            print("\n🎉 Event data verification completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some verification tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Verification setup failed: {e}")
        sys.exit(1)