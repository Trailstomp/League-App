#!/usr/bin/env python3
"""
Tournament Bracket Persistence Testing Suite
CRITICAL BUG INVESTIGATION: Tournament bracket data and scores not saving

Focused testing for the specific issues mentioned in the review request:
1. Tournament Creation - Check if tournament brackets save when created
2. Score Updates - Verify score changes persist after entry  
3. Team Changes - Test if team modifications in brackets save
4. API Endpoints - Verify backend endpoints for tournament data exist and work
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

class TournamentBracketTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print("🏆 TOURNAMENT BRACKET PERSISTENCE TESTING")
        print("=" * 70)
        print(f"Testing at: {self.api_base}")
        print("Focus: Tournament bracket data and scores persistence")
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

    def test_tournament_bracket_creation(self):
        """Test 1: Tournament Creation - Check if tournament brackets save when created"""
        try:
            print("🔍 Testing Tournament Bracket Creation...")
            
            # Create tournament with bracket structure
            tournament_event = {
                "id": "test_tournament_2024",
                "title": "Test Championship Tournament",
                "date": "2024-12-20",
                "time": "10:00 AM",
                "location": "Test Arena",
                "type": "tournament",
                "teamIds": ["team1", "team2", "team3", "team4"],
                "tournamentBracket": {
                    "format": "single_elimination",
                    "totalTeams": 4,
                    "rounds": [
                        {
                            "round": 1,
                            "name": "Semifinals",
                            "matches": [
                                {
                                    "matchId": "sf1",
                                    "team1": "team1",
                                    "team2": "team2",
                                    "score1": 0,
                                    "score2": 0,
                                    "winner": None,
                                    "status": "scheduled"
                                },
                                {
                                    "matchId": "sf2",
                                    "team1": "team3",
                                    "team2": "team4",
                                    "score1": 0,
                                    "score2": 0,
                                    "winner": None,
                                    "status": "scheduled"
                                }
                            ]
                        },
                        {
                            "round": 2,
                            "name": "Championship",
                            "matches": [
                                {
                                    "matchId": "final",
                                    "team1": None,
                                    "team2": None,
                                    "score1": 0,
                                    "score2": 0,
                                    "winner": None,
                                    "status": "pending"
                                }
                            ]
                        }
                    ],
                    "createdAt": datetime.utcnow().isoformat()
                }
            }
            
            # Save tournament via leagueSchedule endpoint
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=[tournament_event],
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'leagueSchedule updated successfully':
                    self.log_test(
                        "Tournament Bracket Creation", 
                        True, 
                        f"Tournament bracket with {len(tournament_event['tournamentBracket']['rounds'])} rounds saved successfully", 
                        {
                            "tournament_id": tournament_event["id"],
                            "teams_count": len(tournament_event["teamIds"]),
                            "rounds": len(tournament_event["tournamentBracket"]["rounds"]),
                            "total_matches": sum(len(r["matches"]) for r in tournament_event["tournamentBracket"]["rounds"])
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Tournament Bracket Creation", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Tournament Bracket Creation", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Tournament Bracket Creation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_score_updates_persistence(self):
        """Test 2: Score Updates - Verify score changes persist after entry"""
        try:
            print("🔍 Testing Score Updates Persistence...")
            
            # Get current tournament data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Score Updates - Get Tournament", 
                    False, 
                    f"Failed to get tournament data: HTTP {response.status_code}"
                )
                return False
            
            data = response.json()
            schedule = data.get('leagueSchedule', [])
            
            # Find our test tournament
            tournament = None
            for event in schedule:
                if event.get('id') == 'test_tournament_2024':
                    tournament = event
                    break
            
            if not tournament or 'tournamentBracket' not in tournament:
                self.log_test(
                    "Score Updates - Tournament Not Found", 
                    False, 
                    "Test tournament not found or missing bracket data"
                )
                return False
            
            # Update scores in the tournament
            updated_tournament = tournament.copy()
            bracket = updated_tournament['tournamentBracket']
            
            # Update semifinal scores
            bracket['rounds'][0]['matches'][0]['score1'] = 7
            bracket['rounds'][0]['matches'][0]['score2'] = 5
            bracket['rounds'][0]['matches'][0]['winner'] = 'team1'
            bracket['rounds'][0]['matches'][0]['status'] = 'completed'
            
            bracket['rounds'][0]['matches'][1]['score1'] = 4
            bracket['rounds'][0]['matches'][1]['score2'] = 6
            bracket['rounds'][0]['matches'][1]['winner'] = 'team4'
            bracket['rounds'][0]['matches'][1]['status'] = 'completed'
            
            # Advance winners to final
            bracket['rounds'][1]['matches'][0]['team1'] = 'team1'
            bracket['rounds'][1]['matches'][0]['team2'] = 'team4'
            bracket['rounds'][1]['matches'][0]['score1'] = 8
            bracket['rounds'][1]['matches'][0]['score2'] = 6
            bracket['rounds'][1]['matches'][0]['winner'] = 'team1'
            bracket['rounds'][1]['matches'][0]['status'] = 'completed'
            
            # Update the schedule
            updated_schedule = []
            for event in schedule:
                if event.get('id') == 'test_tournament_2024':
                    updated_schedule.append(updated_tournament)
                else:
                    updated_schedule.append(event)
            
            # Save updated scores
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=updated_schedule,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test(
                    "Score Updates - Save Scores", 
                    False, 
                    f"Failed to save scores: HTTP {response.status_code}"
                )
                return False
            
            # Wait for persistence
            time.sleep(1)
            
            # Verify scores persisted
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Score Updates - Verify Persistence", 
                    False, 
                    f"Failed to retrieve updated data: HTTP {response.status_code}"
                )
                return False
            
            verification_data = response.json()
            verification_schedule = verification_data.get('leagueSchedule', [])
            
            # Find updated tournament
            updated_tournament_check = None
            for event in verification_schedule:
                if event.get('id') == 'test_tournament_2024':
                    updated_tournament_check = event
                    break
            
            if not updated_tournament_check or 'tournamentBracket' not in updated_tournament_check:
                self.log_test(
                    "Score Updates - Verify Tournament", 
                    False, 
                    "Updated tournament not found after save"
                )
                return False
            
            # Verify specific scores
            verification_bracket = updated_tournament_check['tournamentBracket']
            sf1_match = verification_bracket['rounds'][0]['matches'][0]
            sf2_match = verification_bracket['rounds'][0]['matches'][1]
            final_match = verification_bracket['rounds'][1]['matches'][0]
            
            if (sf1_match['score1'] == 7 and sf1_match['score2'] == 5 and sf1_match['winner'] == 'team1' and
                sf2_match['score1'] == 4 and sf2_match['score2'] == 6 and sf2_match['winner'] == 'team4' and
                final_match['score1'] == 8 and final_match['score2'] == 6 and final_match['winner'] == 'team1'):
                
                self.log_test(
                    "Score Updates - Persistence Verification", 
                    True, 
                    f"All tournament scores persisted correctly", 
                    {
                        "sf1_score": f"{sf1_match['score1']}-{sf1_match['score2']}",
                        "sf1_winner": sf1_match['winner'],
                        "sf2_score": f"{sf2_match['score1']}-{sf2_match['score2']}",
                        "sf2_winner": sf2_match['winner'],
                        "final_score": f"{final_match['score1']}-{final_match['score2']}",
                        "champion": final_match['winner']
                    }
                )
                return True
            else:
                self.log_test(
                    "Score Updates - Persistence Verification", 
                    False, 
                    f"Score persistence failed - scores not matching expected values"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Score Updates - Connection Error", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_team_changes_persistence(self):
        """Test 3: Team Changes - Test if team modifications in brackets save"""
        try:
            print("🔍 Testing Team Changes Persistence...")
            
            # Get current tournament data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Team Changes - Get Tournament", 
                    False, 
                    f"Failed to get tournament data: HTTP {response.status_code}"
                )
                return False
            
            data = response.json()
            schedule = data.get('leagueSchedule', [])
            
            # Find our test tournament
            tournament = None
            for event in schedule:
                if event.get('id') == 'test_tournament_2024':
                    tournament = event
                    break
            
            if not tournament:
                self.log_test(
                    "Team Changes - Tournament Not Found", 
                    False, 
                    "Test tournament not found for team modification"
                )
                return False
            
            # Modify team selections
            updated_tournament = tournament.copy()
            original_teams = updated_tournament['teamIds'].copy()
            
            # Add new teams and modify bracket
            updated_tournament['teamIds'] = ["team1", "team2", "team3", "team4", "team5", "team6"]
            
            # Update bracket structure for 6 teams
            bracket = updated_tournament['tournamentBracket']
            bracket['totalTeams'] = 6
            
            # Add quarterfinal round
            bracket['rounds'].insert(0, {
                "round": 0,
                "name": "Quarterfinals",
                "matches": [
                    {
                        "matchId": "qf1",
                        "team1": "team5",
                        "team2": "team6",
                        "score1": 0,
                        "score2": 0,
                        "winner": None,
                        "status": "scheduled"
                    }
                ]
            })
            
            # Update round numbers
            for i, round_data in enumerate(bracket['rounds'][1:], 1):
                round_data['round'] = i
            
            # Update the schedule
            updated_schedule = []
            for event in schedule:
                if event.get('id') == 'test_tournament_2024':
                    updated_schedule.append(updated_tournament)
                else:
                    updated_schedule.append(event)
            
            # Save team changes
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=updated_schedule,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test(
                    "Team Changes - Save Changes", 
                    False, 
                    f"Failed to save team changes: HTTP {response.status_code}"
                )
                return False
            
            # Wait for persistence
            time.sleep(1)
            
            # Verify team changes persisted
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Team Changes - Verify Persistence", 
                    False, 
                    f"Failed to retrieve updated data: HTTP {response.status_code}"
                )
                return False
            
            verification_data = response.json()
            verification_schedule = verification_data.get('leagueSchedule', [])
            
            # Find updated tournament
            updated_tournament_check = None
            for event in verification_schedule:
                if event.get('id') == 'test_tournament_2024':
                    updated_tournament_check = event
                    break
            
            if not updated_tournament_check:
                self.log_test(
                    "Team Changes - Verify Tournament", 
                    False, 
                    "Updated tournament not found after team changes"
                )
                return False
            
            # Verify team changes
            new_teams = updated_tournament_check.get('teamIds', [])
            verification_bracket = updated_tournament_check.get('tournamentBracket', {})
            
            if (len(new_teams) == 6 and 
                'team5' in new_teams and 'team6' in new_teams and
                verification_bracket.get('totalTeams') == 6 and
                len(verification_bracket.get('rounds', [])) == 3):
                
                self.log_test(
                    "Team Changes - Persistence Verification", 
                    True, 
                    f"Team modifications persisted correctly - expanded from {len(original_teams)} to {len(new_teams)} teams", 
                    {
                        "original_teams": len(original_teams),
                        "updated_teams": len(new_teams),
                        "new_teams_added": ["team5", "team6"],
                        "total_rounds": len(verification_bracket.get('rounds', []))
                    }
                )
                return True
            else:
                self.log_test(
                    "Team Changes - Persistence Verification", 
                    False, 
                    f"Team changes not persisted correctly"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team Changes - Connection Error", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_api_endpoints_tournament_support(self):
        """Test 4: API Endpoints - Verify backend endpoints for tournament data exist and work"""
        try:
            print("🔍 Testing API Endpoints Tournament Support...")
            
            # Test 1: Health check
            response = requests.get(f"{self.api_base}/", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "API Endpoints - Health Check", 
                    False, 
                    f"API health check failed: HTTP {response.status_code}"
                )
                return False
            
            # Test 2: GET league-data supports tournament structure
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "API Endpoints - GET League Data", 
                    False, 
                    f"GET league-data failed: HTTP {response.status_code}"
                )
                return False
            
            data = response.json()
            if 'leagueSchedule' not in data:
                self.log_test(
                    "API Endpoints - Schedule Structure", 
                    False, 
                    "leagueSchedule field missing from API response"
                )
                return False
            
            # Test 3: POST leagueSchedule endpoint with tournament data
            test_tournament = {
                "id": "api_endpoint_test",
                "title": "API Endpoint Test Tournament",
                "date": "2024-12-25",
                "time": "3:00 PM",
                "location": "API Test Arena",
                "type": "tournament",
                "teamIds": ["api_team1", "api_team2"],
                "tournamentBracket": {
                    "format": "single_elimination",
                    "rounds": [{
                        "round": 1,
                        "matches": [{
                            "matchId": "api_test_match",
                            "team1": "api_team1",
                            "team2": "api_team2",
                            "score1": 0,
                            "score2": 0,
                            "winner": None,
                            "status": "scheduled"
                        }]
                    }]
                }
            }
            
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=[test_tournament],
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test(
                    "API Endpoints - POST Tournament", 
                    False, 
                    f"POST tournament failed: HTTP {response.status_code}"
                )
                return False
            
            # Test 4: Verify tournament data persisted
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "API Endpoints - Verify Persistence", 
                    False, 
                    f"Persistence verification failed: HTTP {response.status_code}"
                )
                return False
            
            verification_data = response.json()
            schedule = verification_data.get('leagueSchedule', [])
            
            # Check if our test tournament exists
            test_tournament_found = any(
                event.get('id') == 'api_endpoint_test' and 
                'tournamentBracket' in event
                for event in schedule
            )
            
            if test_tournament_found:
                self.log_test(
                    "API Endpoints - Tournament Support Verification", 
                    True, 
                    f"All API endpoints support tournament data operations correctly", 
                    {
                        "health_check": "✅ Working",
                        "get_league_data": "✅ Working", 
                        "post_tournament_data": "✅ Working",
                        "tournament_persistence": "✅ Working"
                    }
                )
                return True
            else:
                self.log_test(
                    "API Endpoints - Tournament Persistence", 
                    False, 
                    "Test tournament not found after API operations"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "API Endpoints - Connection Error", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_tournament_bracket_tests(self):
        """Run all tournament bracket persistence tests"""
        print("🏆 STARTING TOURNAMENT BRACKET PERSISTENCE TESTS")
        print("=" * 70)
        print("Investigating: Tournament bracket data and scores not saving")
        print("=" * 70)
        
        # Run tests in sequence
        test_results = []
        
        print("1️⃣ TOURNAMENT BRACKET CREATION")
        test_results.append(self.test_tournament_bracket_creation())
        
        print("2️⃣ SCORE UPDATES PERSISTENCE") 
        test_results.append(self.test_score_updates_persistence())
        
        print("3️⃣ TEAM CHANGES PERSISTENCE")
        test_results.append(self.test_team_changes_persistence())
        
        print("4️⃣ API ENDPOINTS TOURNAMENT SUPPORT")
        test_results.append(self.test_api_endpoints_tournament_support())
        
        # Summary
        print("=" * 70)
        print("🏆 TOURNAMENT BRACKET PERSISTENCE TEST SUMMARY")
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
        
        # Critical assessment for the review request
        print("\n🔍 CRITICAL BUG INVESTIGATION RESULTS:")
        if success_rate == 100:
            print("✅ BACKEND TOURNAMENT FUNCTIONALITY IS WORKING CORRECTLY")
            print("✅ Tournament brackets save when created")
            print("✅ Score changes persist after entry")
            print("✅ Team modifications in brackets save")
            print("✅ API endpoints for tournament data exist and work properly")
            print("\n💡 CONCLUSION: Backend API handles tournament data correctly.")
            print("   If users report tournament data not saving, the issue is in the frontend.")
            print("   Recommend checking frontend tournament form submission and state management.")
        else:
            print("❌ BACKEND TOURNAMENT ISSUES DETECTED")
            print("   Tournament data persistence problems confirmed in backend API")
            print("   These backend issues need to be fixed before frontend testing")
        
        return failed_tests == 0

if __name__ == "__main__":
    try:
        tester = TournamentBracketTester()
        success = tester.run_tournament_bracket_tests()
        
        if success:
            print("\n🎉 Tournament bracket persistence tests completed successfully!")
            print("✅ Backend fully supports tournament bracket and score persistence")
            sys.exit(0)
        else:
            print("\n⚠️  Tournament bracket persistence issues detected in backend.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Tournament bracket test setup failed: {e}")
        sys.exit(1)