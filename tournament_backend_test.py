#!/usr/bin/env python3
"""
Tournament Backend API Testing Suite
Focused test for tournament team selection functionality after TournamentBrackets component changes.
Verifies no regressions in backend API handling of tournament data.
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

class TournamentBackendTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing tournament functionality at: {self.api_base}")
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

    def test_tournament_data_structure(self):
        """Test that backend can handle tournament event data with team selections"""
        try:
            # Create tournament event data with team selections
            tournament_data = {
                "teams": [
                    {"id": "team1", "name": "OH10 Lacrosse", "division": "Field"},
                    {"id": "team2", "name": "American Dads", "division": "Field"},
                    {"id": "team3", "name": "Thunder Hawks", "division": "Box"},
                    {"id": "team4", "name": "Lightning Bolts", "division": "Box"}
                ],
                "leagueSchedule": [
                    {
                        "id": "tournament_1",
                        "title": "Winter Championship Tournament",
                        "date": "2024-09-22",
                        "time": "10:00 AM",
                        "location": "Main Field Complex",
                        "type": "tournament",
                        "teamIds": ["team1", "team2", "team3", "team4"],
                        "tournamentBracket": {
                            "rounds": [
                                {
                                    "round": 1,
                                    "matches": [
                                        {
                                            "matchId": "match1",
                                            "team1": "team1",
                                            "team2": "team2",
                                            "score1": 0,
                                            "score2": 0
                                        },
                                        {
                                            "matchId": "match2", 
                                            "team1": "team3",
                                            "team2": "team4",
                                            "score1": 0,
                                            "score2": 0
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ],
                "leagueInfo": {"name": "MLBL Tournament Test"},
                "websiteStyle": {}
            }
            
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=tournament_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    self.log_test(
                        "Tournament Data Structure Storage", 
                        True, 
                        f"Tournament with 4 teams and bracket saved successfully", 
                        {"teams_count": len(tournament_data["teams"]), "tournament_events": len(tournament_data["leagueSchedule"])}
                    )
                    return True
                else:
                    self.log_test(
                        "Tournament Data Structure Storage", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Tournament Data Structure Storage", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Tournament Data Structure Storage", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_tournament_data_retrieval(self):
        """Test that tournament data can be retrieved with proper structure"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for required tournament fields
                if 'leagueSchedule' in data and 'teams' in data:
                    schedule = data['leagueSchedule']
                    teams = data['teams']
                    
                    # Look for tournament events
                    tournament_events = [event for event in schedule if event.get('type') == 'tournament']
                    
                    if tournament_events:
                        tournament = tournament_events[0]
                        required_fields = ['id', 'title', 'date', 'time', 'location', 'type', 'teamIds']
                        
                        if all(field in tournament for field in required_fields):
                            team_count = len(tournament.get('teamIds', []))
                            self.log_test(
                                "Tournament Data Retrieval", 
                                True, 
                                f"Retrieved tournament with {team_count} teams", 
                                {"tournament_id": tournament.get('id'), "teams_in_tournament": team_count}
                            )
                            return True, tournament
                        else:
                            missing = [f for f in required_fields if f not in tournament]
                            self.log_test(
                                "Tournament Data Retrieval", 
                                False, 
                                f"Tournament missing required fields: {missing}"
                            )
                            return False, None
                    else:
                        self.log_test(
                            "Tournament Data Retrieval", 
                            True, 
                            "No tournament events found (acceptable for basic connectivity test)", 
                            {"schedule_events": len(schedule)}
                        )
                        return True, None
                else:
                    self.log_test(
                        "Tournament Data Retrieval", 
                        False, 
                        "Missing leagueSchedule or teams in response"
                    )
                    return False, None
            else:
                self.log_test(
                    "Tournament Data Retrieval", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Tournament Data Retrieval", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_team_selection_update(self):
        """Test updating tournament team selections via specific data endpoint"""
        try:
            # Test updating tournament schedule with team selections
            tournament_schedule = [
                {
                    "id": "tournament_regression_test",
                    "title": "Team Selection Regression Test",
                    "date": "2024-10-01",
                    "time": "2:00 PM", 
                    "location": "Test Arena",
                    "type": "tournament",
                    "teamIds": ["team1", "team2", "team3"],
                    "tournamentBracket": {
                        "selectedTeams": ["team1", "team2", "team3"],
                        "bracketGenerated": True
                    }
                }
            ]
            
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=tournament_schedule,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'leagueSchedule updated successfully':
                    self.log_test(
                        "Tournament Team Selection Update", 
                        True, 
                        f"Tournament team selections updated successfully", 
                        {"selected_teams": len(tournament_schedule[0]["teamIds"])}
                    )
                    return True
                else:
                    self.log_test(
                        "Tournament Team Selection Update", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Tournament Team Selection Update", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Tournament Team Selection Update", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_bracket_data_persistence(self):
        """Test that tournament bracket data persists correctly"""
        try:
            # Create tournament with bracket data
            bracket_data = {
                "id": "bracket_test",
                "title": "Bracket Persistence Test",
                "date": "2024-10-15",
                "time": "1:00 PM",
                "location": "Championship Arena", 
                "type": "tournament",
                "teamIds": ["team1", "team2", "team3", "team4"],
                "tournamentBracket": {
                    "format": "single_elimination",
                    "rounds": [
                        {
                            "round": 1,
                            "matches": [
                                {
                                    "matchId": "semifinal1",
                                    "team1": "team1",
                                    "team2": "team2",
                                    "score1": 5,
                                    "score2": 3,
                                    "winner": "team1"
                                },
                                {
                                    "matchId": "semifinal2",
                                    "team1": "team3", 
                                    "team2": "team4",
                                    "score1": 2,
                                    "score2": 4,
                                    "winner": "team4"
                                }
                            ]
                        },
                        {
                            "round": 2,
                            "matches": [
                                {
                                    "matchId": "final",
                                    "team1": "team1",
                                    "team2": "team4",
                                    "score1": 0,
                                    "score2": 0,
                                    "winner": None
                                }
                            ]
                        }
                    ]
                }
            }
            
            # Save bracket data
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=[bracket_data],
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test(
                    "Tournament Bracket Data Persistence", 
                    False, 
                    f"Failed to save bracket data: HTTP {response.status_code}"
                )
                return False
            
            # Wait for persistence
            time.sleep(1)
            
            # Retrieve and verify bracket data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                schedule = data.get('leagueSchedule', [])
                
                # Find our bracket test event
                bracket_event = None
                for event in schedule:
                    if event.get('id') == 'bracket_test':
                        bracket_event = event
                        break
                
                if bracket_event and 'tournamentBracket' in bracket_event:
                    bracket = bracket_event['tournamentBracket']
                    if 'rounds' in bracket and len(bracket['rounds']) == 2:
                        # Verify match data
                        round1_matches = bracket['rounds'][0]['matches']
                        if len(round1_matches) == 2 and round1_matches[0].get('winner') == 'team1':
                            self.log_test(
                                "Tournament Bracket Data Persistence", 
                                True, 
                                f"Bracket data persisted correctly with {len(bracket['rounds'])} rounds", 
                                {"matches_round1": len(round1_matches), "winner_semifinal1": round1_matches[0].get('winner')}
                            )
                            return True
                        else:
                            self.log_test(
                                "Tournament Bracket Data Persistence", 
                                False, 
                                "Bracket match data corrupted during persistence"
                            )
                            return False
                    else:
                        self.log_test(
                            "Tournament Bracket Data Persistence", 
                            False, 
                            f"Bracket rounds data incomplete: {len(bracket.get('rounds', []))} rounds found"
                        )
                        return False
                else:
                    self.log_test(
                        "Tournament Bracket Data Persistence", 
                        False, 
                        "Bracket test event not found or missing tournamentBracket data"
                    )
                    return False
            else:
                self.log_test(
                    "Tournament Bracket Data Persistence", 
                    False, 
                    f"Failed to retrieve data: HTTP {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Tournament Bracket Data Persistence", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_tournament_tests(self):
        """Run all tournament-focused backend tests"""
        print("Starting Tournament Backend API Tests...")
        print(f"Target URL: {self.api_base}")
        print("Focus: Tournament team selection and bracket functionality")
        print("=" * 70)
        
        # Test tournament data handling
        self.test_tournament_data_structure()
        self.test_tournament_data_retrieval()
        self.test_team_selection_update()
        self.test_bracket_data_persistence()
        
        # Summary
        print("=" * 70)
        print("TOURNAMENT TEST SUMMARY")
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
        
        return failed_tests == 0

if __name__ == "__main__":
    try:
        tester = TournamentBackendTester()
        success = tester.run_tournament_tests()
        
        if success:
            print("\n🎉 Tournament backend API tests completed successfully!")
            print("✅ No regressions detected in tournament team selection functionality")
            sys.exit(0)
        else:
            print("\n⚠️  Some tournament tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Tournament test setup failed: {e}")
        sys.exit(1)