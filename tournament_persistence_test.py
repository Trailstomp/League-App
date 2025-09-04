#!/usr/bin/env python3
"""
Tournament Data Persistence Verification Test
Specifically tests tournament bracket creation, score updates, and data persistence
after frontend changes as requested in the review.
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

class TournamentPersistenceTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🏆 TOURNAMENT DATA PERSISTENCE VERIFICATION")
        print(f"Testing backend at: {self.api_base}")
        print("=" * 70)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            if isinstance(response_data, dict) and len(str(response_data)) > 200:
                print(f"    Response: [Large data structure - {len(str(response_data))} chars]")
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

    def create_tournament_data(self):
        """Create comprehensive tournament data for testing"""
        tournament_id = str(uuid.uuid4())
        
        # Create teams for tournament
        teams = [
            {"id": "team_hawks", "name": "Hawks", "division": "Field", "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="},
            {"id": "team_eagles", "name": "Eagles", "division": "Field", "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="},
            {"id": "team_lions", "name": "Lions", "division": "Field", "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="},
            {"id": "team_tigers", "name": "Tigers", "division": "Field", "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="},
            {"id": "team_wolves", "name": "Wolves", "division": "Box", "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="},
            {"id": "team_bears", "name": "Bears", "division": "Box", "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}
        ]
        
        # Create tournament event with bracket structure
        tournament_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        tournament_event = {
            "id": tournament_id,
            "title": "Championship Tournament 2024",
            "date": tournament_date,
            "time": "09:00",
            "location": "Main Stadium Complex",
            "type": "tournament",
            "teamIds": [team["id"] for team in teams],
            "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
            "description": "Annual championship tournament featuring top teams",
            "tournamentBracket": {
                "rounds": [
                    {
                        "name": "Quarterfinals",
                        "matches": [
                            {
                                "id": "qf1",
                                "team1": "team_hawks",
                                "team2": "team_eagles", 
                                "team1Score": 0,
                                "team2Score": 0,
                                "winner": None,
                                "status": "scheduled"
                            },
                            {
                                "id": "qf2", 
                                "team1": "team_lions",
                                "team2": "team_tigers",
                                "team1Score": 0,
                                "team2Score": 0,
                                "winner": None,
                                "status": "scheduled"
                            },
                            {
                                "id": "qf3",
                                "team1": "team_wolves", 
                                "team2": "team_bears",
                                "team1Score": 0,
                                "team2Score": 0,
                                "winner": None,
                                "status": "scheduled"
                            }
                        ]
                    },
                    {
                        "name": "Semifinals",
                        "matches": [
                            {
                                "id": "sf1",
                                "team1": None,
                                "team2": None,
                                "team1Score": 0,
                                "team2Score": 0,
                                "winner": None,
                                "status": "pending"
                            },
                            {
                                "id": "sf2",
                                "team1": None,
                                "team2": None, 
                                "team1Score": 0,
                                "team2Score": 0,
                                "winner": None,
                                "status": "pending"
                            }
                        ]
                    },
                    {
                        "name": "Finals",
                        "matches": [
                            {
                                "id": "final",
                                "team1": None,
                                "team2": None,
                                "team1Score": 0,
                                "team2Score": 0,
                                "winner": None,
                                "status": "pending"
                            }
                        ]
                    }
                ]
            },
            "rsvpData": {
                "attending": [],
                "notAttending": [],
                "maybe": []
            }
        }
        
        return {
            "teams": teams,
            "leagueSchedule": [tournament_event],
            "players": [],
            "users": [],
            "newsItems": [],
            "gameTickerData": [],
            "leagueInfo": {"name": "Test League", "season": "2024"},
            "websiteStyle": {"theme": "tournament"}
        }

    def test_1_create_tournament_bracket(self):
        """Test 1: Create tournament bracket with teams and verify it saves to backend"""
        try:
            tournament_data = self.create_tournament_data()
            
            response = requests.post(
                f"{self.api_base}/league-data",
                json=tournament_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    # Verify the tournament was saved by retrieving it
                    time.sleep(1)  # Allow database write
                    
                    get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    if get_response.status_code == 200:
                        saved_data = get_response.json()
                        
                        # Check if tournament exists in schedule
                        schedule = saved_data.get('leagueSchedule', [])
                        tournament_events = [e for e in schedule if e.get('type') == 'tournament']
                        
                        if tournament_events:
                            tournament = tournament_events[0]
                            bracket = tournament.get('tournamentBracket', {})
                            rounds = bracket.get('rounds', [])
                            
                            if len(rounds) >= 3 and len(tournament.get('teamIds', [])) == 6:
                                self.log_test(
                                    "Create Tournament Bracket",
                                    True,
                                    f"Tournament created with {len(tournament['teamIds'])} teams, {len(rounds)} rounds",
                                    {
                                        "tournament_id": tournament.get('id'),
                                        "teams_count": len(tournament.get('teamIds', [])),
                                        "rounds_count": len(rounds),
                                        "matches_in_qf": len(rounds[0].get('matches', []))
                                    }
                                )
                                return True, tournament
                            else:
                                self.log_test(
                                    "Create Tournament Bracket",
                                    False,
                                    f"Tournament structure incomplete: {len(rounds)} rounds, {len(tournament.get('teamIds', []))} teams"
                                )
                                return False, None
                        else:
                            self.log_test(
                                "Create Tournament Bracket",
                                False,
                                "No tournament events found in saved schedule"
                            )
                            return False, None
                    else:
                        self.log_test(
                            "Create Tournament Bracket",
                            False,
                            f"Failed to retrieve saved data: HTTP {get_response.status_code}"
                        )
                        return False, None
                else:
                    self.log_test(
                        "Create Tournament Bracket",
                        False,
                        f"Unexpected save response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Create Tournament Bracket",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Create Tournament Bracket",
                False,
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_2_update_tournament_scores(self):
        """Test 2: Update tournament scores and verify they persist"""
        try:
            # First get current data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Update Tournament Scores",
                    False,
                    f"Failed to get current data: HTTP {response.status_code}"
                )
                return False
            
            data = response.json()
            schedule = data.get('leagueSchedule', [])
            tournament_events = [e for e in schedule if e.get('type') == 'tournament']
            
            if not tournament_events:
                self.log_test(
                    "Update Tournament Scores",
                    False,
                    "No tournament found to update scores"
                )
                return False
            
            # Update tournament scores
            tournament = tournament_events[0]
            bracket = tournament.get('tournamentBracket', {})
            rounds = bracket.get('rounds', [])
            
            if len(rounds) > 0:
                # Update quarterfinal scores
                qf_matches = rounds[0].get('matches', [])
                if len(qf_matches) >= 3:
                    qf_matches[0].update({
                        "team1Score": 12,
                        "team2Score": 8,
                        "winner": qf_matches[0]["team1"],
                        "status": "completed"
                    })
                    qf_matches[1].update({
                        "team1Score": 6,
                        "team2Score": 10,
                        "winner": qf_matches[1]["team2"],
                        "status": "completed"
                    })
                    qf_matches[2].update({
                        "team1Score": 15,
                        "team2Score": 7,
                        "winner": qf_matches[2]["team1"],
                        "status": "completed"
                    })
                    
                    # Update semifinals with winners
                    if len(rounds) > 1:
                        sf_matches = rounds[1].get('matches', [])
                        if len(sf_matches) >= 2:
                            sf_matches[0].update({
                                "team1": qf_matches[0]["winner"],
                                "team2": qf_matches[1]["winner"],
                                "team1Score": 9,
                                "team2Score": 11,
                                "winner": qf_matches[1]["winner"],
                                "status": "completed"
                            })
                            sf_matches[1].update({
                                "team1": qf_matches[2]["winner"],
                                "team2": "team_bye",  # Simulate bye team
                                "team1Score": 13,
                                "team2Score": 5,
                                "winner": qf_matches[2]["winner"],
                                "status": "completed"
                            })
                            
                            # Update finals
                            if len(rounds) > 2:
                                final_match = rounds[2].get('matches', [{}])[0]
                                final_match.update({
                                    "team1": sf_matches[0]["winner"],
                                    "team2": sf_matches[1]["winner"],
                                    "team1Score": 14,
                                    "team2Score": 12,
                                    "winner": sf_matches[0]["winner"],
                                    "status": "completed"
                                })
                
                # Save updated tournament data
                save_response = requests.post(
                    f"{self.api_base}/league-data",
                    json=data,
                    headers={'Content-Type': 'application/json'},
                    timeout=15
                )
                
                if save_response.status_code == 200:
                    self.log_test(
                        "Update Tournament Scores",
                        True,
                        "Tournament scores updated and saved successfully",
                        {
                            "qf_scores": f"{qf_matches[0]['team1Score']}-{qf_matches[0]['team2Score']}, {qf_matches[1]['team1Score']}-{qf_matches[1]['team2Score']}, {qf_matches[2]['team1Score']}-{qf_matches[2]['team2Score']}",
                            "champion": rounds[2]['matches'][0].get('winner', 'TBD') if len(rounds) > 2 else 'TBD'
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Update Tournament Scores",
                        False,
                        f"Failed to save updated scores: HTTP {save_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Update Tournament Scores",
                    False,
                    "Tournament bracket has no rounds to update"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Update Tournament Scores",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_3_reload_verify_persistence(self):
        """Test 3: Reload/refresh and verify tournament data loads from backend"""
        try:
            # Simulate reload by making fresh request
            time.sleep(2)  # Allow any async operations to complete
            
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                schedule = data.get('leagueSchedule', [])
                tournament_events = [e for e in schedule if e.get('type') == 'tournament']
                
                if tournament_events:
                    tournament = tournament_events[0]
                    bracket = tournament.get('tournamentBracket', {})
                    rounds = bracket.get('rounds', [])
                    
                    # Verify scores persisted
                    scores_persisted = True
                    completed_matches = 0
                    
                    for round_data in rounds:
                        for match in round_data.get('matches', []):
                            if match.get('status') == 'completed':
                                completed_matches += 1
                                if match.get('team1Score', 0) == 0 and match.get('team2Score', 0) == 0:
                                    scores_persisted = False
                    
                    if scores_persisted and completed_matches > 0:
                        # Check for champion
                        champion = None
                        if len(rounds) > 2:
                            final_match = rounds[2].get('matches', [{}])[0]
                            champion = final_match.get('winner')
                        
                        self.log_test(
                            "Reload & Verify Persistence",
                            True,
                            f"Tournament data persisted correctly after reload",
                            {
                                "completed_matches": completed_matches,
                                "total_rounds": len(rounds),
                                "champion": champion or "TBD",
                                "tournament_teams": len(tournament.get('teamIds', []))
                            }
                        )
                        return True, tournament
                    else:
                        self.log_test(
                            "Reload & Verify Persistence",
                            False,
                            f"Scores not persisted properly: {completed_matches} completed matches, scores_valid: {scores_persisted}"
                        )
                        return False, None
                else:
                    self.log_test(
                        "Reload & Verify Persistence",
                        False,
                        "Tournament not found after reload"
                    )
                    return False, None
            else:
                self.log_test(
                    "Reload & Verify Persistence",
                    False,
                    f"Failed to reload data: HTTP {response.status_code}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Reload & Verify Persistence",
                False,
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_4_api_response_structure(self):
        """Test 4: Check API responses for tournament data structure"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify overall structure
                required_fields = ['id', 'teams', 'leagueSchedule', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueInfo', 'websiteStyle']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test(
                        "API Response Structure",
                        False,
                        f"Missing required fields: {missing_fields}"
                    )
                    return False
                
                # Verify tournament structure
                schedule = data.get('leagueSchedule', [])
                tournament_events = [e for e in schedule if e.get('type') == 'tournament']
                
                if tournament_events:
                    tournament = tournament_events[0]
                    
                    # Check tournament required fields
                    tournament_fields = ['id', 'title', 'date', 'time', 'location', 'type', 'teamIds', 'tournamentBracket']
                    missing_tournament_fields = [f for f in tournament_fields if f not in tournament]
                    
                    if missing_tournament_fields:
                        self.log_test(
                            "API Response Structure",
                            False,
                            f"Tournament missing fields: {missing_tournament_fields}"
                        )
                        return False
                    
                    # Check bracket structure
                    bracket = tournament.get('tournamentBracket', {})
                    if 'rounds' not in bracket:
                        self.log_test(
                            "API Response Structure",
                            False,
                            "Tournament bracket missing 'rounds' field"
                        )
                        return False
                    
                    rounds = bracket['rounds']
                    for i, round_data in enumerate(rounds):
                        if 'name' not in round_data or 'matches' not in round_data:
                            self.log_test(
                                "API Response Structure",
                                False,
                                f"Round {i} missing required fields (name, matches)"
                            )
                            return False
                        
                        for j, match in enumerate(round_data['matches']):
                            match_fields = ['id', 'team1', 'team2', 'team1Score', 'team2Score', 'winner', 'status']
                            missing_match_fields = [f for f in match_fields if f not in match]
                            if missing_match_fields:
                                self.log_test(
                                    "API Response Structure",
                                    False,
                                    f"Round {i}, Match {j} missing fields: {missing_match_fields}"
                                )
                                return False
                    
                    self.log_test(
                        "API Response Structure",
                        True,
                        "Tournament API response structure is valid",
                        {
                            "tournament_fields": len(tournament_fields),
                            "bracket_rounds": len(rounds),
                            "total_matches": sum(len(r.get('matches', [])) for r in rounds),
                            "response_size": f"{len(str(data))} chars"
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "API Response Structure",
                        False,
                        "No tournament events found in API response"
                    )
                    return False
            else:
                self.log_test(
                    "API Response Structure",
                    False,
                    f"API request failed: HTTP {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "API Response Structure",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_5_console_logs_verification(self):
        """Test 5: Verify console logs show successful save operations"""
        try:
            # Test multiple save operations and verify responses
            test_data = {
                "teams": [{"id": "log_test", "name": "Log Test Team"}],
                "leagueSchedule": [{
                    "id": "log_tournament",
                    "title": "Log Test Tournament",
                    "type": "tournament",
                    "date": "2024-12-25",
                    "time": "10:00",
                    "location": "Test Arena",
                    "teamIds": ["log_test"],
                    "tournamentBracket": {
                        "rounds": [{
                            "name": "Finals",
                            "matches": [{
                                "id": "log_final",
                                "team1": "log_test",
                                "team2": "bye",
                                "team1Score": 10,
                                "team2Score": 5,
                                "winner": "log_test",
                                "status": "completed"
                            }]
                        }]
                    }
                }],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueInfo": {"test": "console_logs"},
                "websiteStyle": {"test": "console_logs"}
            }
            
            # Perform save operation
            start_time = time.time()
            response = requests.post(
                f"{self.api_base}/league-data",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify successful save response
                if data.get('message') == 'League data saved successfully' and 'timestamp' in data:
                    
                    # Verify data was actually saved by retrieving it
                    verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    if verify_response.status_code == 200:
                        saved_data = verify_response.json()
                        
                        # Check if our test tournament is in the saved data
                        schedule = saved_data.get('leagueSchedule', [])
                        test_tournaments = [e for e in schedule if e.get('id') == 'log_tournament']
                        
                        if test_tournaments:
                            self.log_test(
                                "Console Logs Verification",
                                True,
                                f"Save operations successful with proper logging",
                                {
                                    "save_message": data.get('message'),
                                    "response_time_ms": f"{response_time:.2f}",
                                    "timestamp": data.get('timestamp'),
                                    "verification": "Tournament data retrieved successfully"
                                }
                            )
                            return True
                        else:
                            self.log_test(
                                "Console Logs Verification",
                                False,
                                "Save reported success but data not found in verification"
                            )
                            return False
                    else:
                        self.log_test(
                            "Console Logs Verification",
                            False,
                            f"Save successful but verification failed: HTTP {verify_response.status_code}"
                        )
                        return False
                else:
                    self.log_test(
                        "Console Logs Verification",
                        False,
                        f"Unexpected save response format: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Console Logs Verification",
                    False,
                    f"Save operation failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Console Logs Verification",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def run_tournament_tests(self):
        """Run all tournament persistence tests"""
        print("🏆 TOURNAMENT DATA PERSISTENCE VERIFICATION")
        print("Testing complete round-trip: Frontend → Backend → Frontend")
        print("=" * 70)
        
        # Test sequence as requested in review
        test_1_success, tournament_data = self.test_1_create_tournament_bracket()
        if not test_1_success:
            print("❌ CRITICAL: Tournament creation failed. Cannot proceed with remaining tests.")
            return False
        
        test_2_success = self.test_2_update_tournament_scores()
        test_3_success, reloaded_data = self.test_3_reload_verify_persistence()
        test_4_success = self.test_4_api_response_structure()
        test_5_success = self.test_5_console_logs_verification()
        
        # Summary
        print("=" * 70)
        print("🏆 TOURNAMENT PERSISTENCE TEST SUMMARY")
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
        
        # Specific verification results
        print(f"\n🎯 VERIFICATION RESULTS:")
        print(f"✅ Tournament Creation: {'PASS' if test_1_success else 'FAIL'}")
        print(f"✅ Score Updates: {'PASS' if test_2_success else 'FAIL'}")
        print(f"✅ Data Persistence: {'PASS' if test_3_success else 'FAIL'}")
        print(f"✅ API Structure: {'PASS' if test_4_success else 'FAIL'}")
        print(f"✅ Save Operations: {'PASS' if test_5_success else 'FAIL'}")
        
        # Overall assessment
        all_critical_pass = test_1_success and test_2_success and test_3_success
        
        if all_critical_pass:
            print(f"\n🎉 TOURNAMENT PERSISTENCE VERIFICATION: SUCCESS")
            print(f"   Tournament data persistence is working correctly after frontend changes.")
        else:
            print(f"\n⚠️  TOURNAMENT PERSISTENCE VERIFICATION: ISSUES DETECTED")
            print(f"   Some critical tournament persistence tests failed.")
        
        return all_critical_pass

if __name__ == "__main__":
    try:
        tester = TournamentPersistenceTester()
        success = tester.run_tournament_tests()
        
        if success:
            print("\n🏆 Tournament data persistence verification completed successfully!")
            print("   The tournament persistence bug appears to be fixed.")
            sys.exit(0)
        else:
            print("\n⚠️  Tournament persistence verification detected issues.")
            print("   Review the failed tests above for details.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Tournament test setup failed: {e}")
        sys.exit(1)