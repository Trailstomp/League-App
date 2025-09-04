#!/usr/bin/env python3
"""
Tournament Data Persistence Testing Suite
CRITICAL BUG INVESTIGATION: Tournament bracket data and scores not saving

This test suite specifically addresses the review request:
1. Tournament Creation - Check if tournament brackets save when created
2. Score Updates - Verify score changes persist after entry  
3. Team Changes - Test if team modifications in brackets save
4. API Endpoints - Verify backend endpoints for tournament data exist and work

Focus: Tournament bracket data persistence and score saving functionality
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

class TournamentDataPersistenceTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print("🏆 TOURNAMENT DATA PERSISTENCE TESTING SUITE")
        print("=" * 70)
        print(f"Testing tournament bracket data persistence at: {self.api_base}")
        print("Focus: Critical bug investigation - tournament brackets and scores not saving")
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

    def test_tournament_creation_persistence(self):
        """Test 1: Tournament Creation - Check if tournament brackets save when created"""
        try:
            print("🔍 Testing Tournament Creation and Bracket Persistence...")
            
            # Create comprehensive tournament data with bracket structure
            tournament_data = {
                "id": "main_league",
                "teams": [
                    {"id": "team_oh10", "name": "OH10 Lacrosse", "division": "Field"},
                    {"id": "team_dads", "name": "American Dads", "division": "Field"},
                    {"id": "team_hawks", "name": "Thunder Hawks", "division": "Box"},
                    {"id": "team_bolts", "name": "Lightning Bolts", "division": "Box"},
                    {"id": "team_eagles", "name": "Storm Eagles", "division": "Field"},
                    {"id": "team_wolves", "name": "Ice Wolves", "division": "Box"}
                ],
                "leagueSchedule": [
                    {
                        "id": "winter_championship_2024",
                        "title": "Winter Championship Tournament",
                        "date": "2024-12-15",
                        "time": "9:00 AM",
                        "location": "Championship Arena Complex",
                        "type": "tournament",
                        "teamIds": ["team_oh10", "team_dads", "team_hawks", "team_bolts", "team_eagles", "team_wolves"],
                        "tournamentBracket": {
                            "format": "single_elimination",
                            "totalTeams": 6,
                            "rounds": [
                                {
                                    "round": 1,
                                    "name": "Quarterfinals",
                                    "matches": [
                                        {
                                            "matchId": "qf1",
                                            "team1": "team_oh10",
                                            "team2": "team_dads", 
                                            "score1": 0,
                                            "score2": 0,
                                            "winner": None,
                                            "status": "scheduled"
                                        },
                                        {
                                            "matchId": "qf2",
                                            "team1": "team_hawks",
                                            "team2": "team_bolts",
                                            "score1": 0,
                                            "score2": 0,
                                            "winner": None,
                                            "status": "scheduled"
                                        },
                                        {
                                            "matchId": "qf3",
                                            "team1": "team_eagles",
                                            "team2": "team_wolves",
                                            "score1": 0,
                                            "score2": 0,
                                            "winner": None,
                                            "status": "scheduled"
                                        }
                                    ]
                                },
                                {
                                    "round": 2,
                                    "name": "Semifinals",
                                    "matches": [
                                        {
                                            "matchId": "sf1",
                                            "team1": None,
                                            "team2": None,
                                            "score1": 0,
                                            "score2": 0,
                                            "winner": None,
                                            "status": "pending"
                                        }
                                    ]
                                },
                                {
                                    "round": 3,
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
                            "createdAt": datetime.utcnow().isoformat(),
                            "lastUpdated": datetime.utcnow().isoformat()
                        },
                        "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    }
                ],
                "leagueInfo": {"name": "MLBL Tournament Persistence Test"},
                "websiteStyle": {}
            }
            
            # Save tournament data
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=tournament_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    self.log_test(
                        "Tournament Creation - Initial Save", 
                        True, 
                        f"Tournament with 6 teams and 3-round bracket structure saved successfully", 
                        {
                            "teams_count": len(tournament_data["teams"]), 
                            "tournament_rounds": len(tournament_data["leagueSchedule"][0]["tournamentBracket"]["rounds"]),
                            "total_matches": sum(len(round["matches"]) for round in tournament_data["leagueSchedule"][0]["tournamentBracket"]["rounds"])
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Tournament Creation - Initial Save", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Tournament Creation - Initial Save", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Tournament Creation - Initial Save", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_score_updates_persistence(self):
        """Test 2: Score Updates - Verify score changes persist after entry"""
        try:
            print("🔍 Testing Score Updates and Persistence...")
            
            # First, get current tournament data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Score Updates - Data Retrieval", 
                    False, 
                    f"Failed to retrieve tournament data: HTTP {response.status_code}"
                )
                return False
            
            data = response.json()
            schedule = data.get('leagueSchedule', [])
            
            # Find tournament event
            tournament = None
            for event in schedule:
                if event.get('type') == 'tournament' and 'tournamentBracket' in event:
                    tournament = event
                    break
            
            if not tournament:
                self.log_test(
                    "Score Updates - Tournament Not Found", 
                    False, 
                    "No tournament with bracket found in database"
                )
                return False
            
            # Update scores in the tournament bracket
            updated_tournament = tournament.copy()
            bracket = updated_tournament['tournamentBracket']
            
            # Update quarterfinal scores
            bracket['rounds'][0]['matches'][0]['score1'] = 8
            bracket['rounds'][0]['matches'][0]['score2'] = 6
            bracket['rounds'][0]['matches'][0]['winner'] = 'team_oh10'
            bracket['rounds'][0]['matches'][0]['status'] = 'completed'
            
            bracket['rounds'][0]['matches'][1]['score1'] = 5
            bracket['rounds'][0]['matches'][1]['score2'] = 7
            bracket['rounds'][0]['matches'][1]['winner'] = 'team_bolts'
            bracket['rounds'][0]['matches'][1]['status'] = 'completed'
            
            bracket['rounds'][0]['matches'][2]['score1'] = 9
            bracket['rounds'][0]['matches'][2]['score2'] = 4
            bracket['rounds'][0]['matches'][2]['winner'] = 'team_eagles'
            bracket['rounds'][0]['matches'][2]['status'] = 'completed'
            
            # Advance winners to semifinals
            bracket['rounds'][1]['matches'][0]['team1'] = 'team_oh10'
            bracket['rounds'][1]['matches'][0]['team2'] = 'team_bolts'
            bracket['rounds'][1]['matches'][0]['score1'] = 6
            bracket['rounds'][1]['matches'][0]['score2'] = 8
            bracket['rounds'][1]['matches'][0]['winner'] = 'team_bolts'
            bracket['rounds'][1]['matches'][0]['status'] = 'completed'
            
            # Update timestamp
            bracket['lastUpdated'] = datetime.utcnow().isoformat()
            
            # Update the schedule with new scores
            updated_schedule = []
            for event in schedule:
                if event.get('id') == tournament['id']:
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
                    "Score Updates - Save Updated Scores", 
                    False, 
                    f"Failed to save updated scores: HTTP {response.status_code}"
                )
                return False
            
            # Wait for persistence
            time.sleep(2)
            
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
                if event.get('id') == tournament['id']:
                    updated_tournament_check = event
                    break
            
            if not updated_tournament_check or 'tournamentBracket' not in updated_tournament_check:
                self.log_test(
                    "Score Updates - Verify Persistence", 
                    False, 
                    "Updated tournament not found after save"
                )
                return False
            
            # Verify specific scores
            verification_bracket = updated_tournament_check['tournamentBracket']
            qf1_match = verification_bracket['rounds'][0]['matches'][0]
            sf1_match = verification_bracket['rounds'][1]['matches'][0]
            
            if (qf1_match['score1'] == 8 and qf1_match['score2'] == 6 and 
                qf1_match['winner'] == 'team_oh10' and 
                sf1_match['score1'] == 6 and sf1_match['score2'] == 8 and
                sf1_match['winner'] == 'team_bolts'):
                
                self.log_test(
                    "Score Updates - Persistence Verification", 
                    True, 
                    f"All tournament scores persisted correctly through save/reload cycle", 
                    {
                        "qf1_final": f"{qf1_match['score1']}-{qf1_match['score2']}",
                        "qf1_winner": qf1_match['winner'],
                        "sf1_final": f"{sf1_match['score1']}-{sf1_match['score2']}",
                        "sf1_winner": sf1_match['winner']
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
            print("🔍 Testing Team Changes and Bracket Modifications...")
            
            # Get current tournament data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "Team Changes - Data Retrieval", 
                    False, 
                    f"Failed to retrieve tournament data: HTTP {response.status_code}"
                )
                return False
            
            data = response.json()
            schedule = data.get('leagueSchedule', [])
            
            # Find tournament
            tournament = None
            for event in schedule:
                if event.get('type') == 'tournament' and 'tournamentBracket' in event:
                    tournament = event
                    break
            
            if not tournament:
                self.log_test(
                    "Team Changes - Tournament Not Found", 
                    False, 
                    "No tournament found for team modification testing"
                )
                return False
            
            # Modify team selections and bracket structure
            updated_tournament = tournament.copy()
            
            # Add new teams to tournament
            original_team_count = len(updated_tournament.get('teamIds', []))
            updated_tournament['teamIds'] = [
                "team_oh10", "team_dads", "team_hawks", "team_bolts", 
                "team_eagles", "team_wolves", "team_new1", "team_new2"
            ]
            
            # Update bracket to reflect team changes
            bracket = updated_tournament['tournamentBracket']
            bracket['totalTeams'] = 8
            
            # Add new quarterfinal match for additional teams
            new_match = {
                "matchId": "qf4",
                "team1": "team_new1",
                "team2": "team_new2",
                "score1": 0,
                "score2": 0,
                "winner": None,
                "status": "scheduled"
            }
            bracket['rounds'][0]['matches'].append(new_match)
            
            # Update semifinals to accommodate more teams
            bracket['rounds'][1]['matches'].append({
                "matchId": "sf2",
                "team1": "team_eagles",
                "team2": None,  # Winner of new qf4 match
                "score1": 0,
                "score2": 0,
                "winner": None,
                "status": "pending"
            })
            
            # Update timestamp
            bracket['lastUpdated'] = datetime.utcnow().isoformat()
            
            # Save team changes
            updated_schedule = []
            for event in schedule:
                if event.get('id') == tournament['id']:
                    updated_schedule.append(updated_tournament)
                else:
                    updated_schedule.append(event)
            
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=updated_schedule,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test(
                    "Team Changes - Save Modifications", 
                    False, 
                    f"Failed to save team changes: HTTP {response.status_code}"
                )
                return False
            
            # Wait for persistence
            time.sleep(2)
            
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
                if event.get('id') == tournament['id']:
                    updated_tournament_check = event
                    break
            
            if not updated_tournament_check:
                self.log_test(
                    "Team Changes - Verify Persistence", 
                    False, 
                    "Updated tournament not found after team modifications"
                )
                return False
            
            # Verify team changes
            new_team_count = len(updated_tournament_check.get('teamIds', []))
            verification_bracket = updated_tournament_check.get('tournamentBracket', {})
            qf_matches = len(verification_bracket.get('rounds', [{}])[0].get('matches', []))
            
            if (new_team_count == 8 and 
                verification_bracket.get('totalTeams') == 8 and
                qf_matches == 4 and
                'team_new1' in updated_tournament_check['teamIds'] and
                'team_new2' in updated_tournament_check['teamIds']):
                
                self.log_test(
                    "Team Changes - Persistence Verification", 
                    True, 
                    f"Team modifications persisted correctly - expanded from {original_team_count} to {new_team_count} teams", 
                    {
                        "original_teams": original_team_count,
                        "updated_teams": new_team_count,
                        "quarterfinal_matches": qf_matches,
                        "new_teams_added": ["team_new1", "team_new2"]
                    }
                )
                return True
            else:
                self.log_test(
                    "Team Changes - Persistence Verification", 
                    False, 
                    f"Team changes not persisted correctly - expected 8 teams, got {new_team_count}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team Changes - Connection Error", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_api_endpoints_functionality(self):
        """Test 4: API Endpoints - Verify backend endpoints for tournament data exist and work"""
        try:
            print("🔍 Testing API Endpoints for Tournament Data...")
            
            # Test 1: Health check
            response = requests.get(f"{self.api_base}/", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "API Endpoints - Health Check", 
                    False, 
                    f"API health check failed: HTTP {response.status_code}"
                )
                return False
            
            # Test 2: GET league-data endpoint
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "API Endpoints - GET League Data", 
                    False, 
                    f"GET league-data failed: HTTP {response.status_code}"
                )
                return False
            
            data = response.json()
            required_fields = ['teams', 'leagueSchedule', 'leagueInfo']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test(
                    "API Endpoints - Data Structure Validation", 
                    False, 
                    f"Missing required fields in API response: {missing_fields}"
                )
                return False
            
            # Test 3: POST league-data endpoint with tournament data
            test_tournament_data = {
                "id": "main_league",
                "teams": [{"id": "test_team", "name": "Test Team"}],
                "leagueSchedule": [{
                    "id": "api_test_tournament",
                    "title": "API Test Tournament",
                    "date": "2024-12-20",
                    "time": "10:00 AM",
                    "location": "Test Arena",
                    "type": "tournament",
                    "teamIds": ["test_team"],
                    "tournamentBracket": {
                        "format": "single_elimination",
                        "rounds": [{
                            "round": 1,
                            "matches": [{
                                "matchId": "test_match",
                                "team1": "test_team",
                                "team2": None,
                                "score1": 0,
                                "score2": 0
                            }]
                        }]
                    }
                }],
                "leagueInfo": {"name": "API Test"},
                "websiteStyle": {}
            }
            
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=test_tournament_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test(
                    "API Endpoints - POST League Data", 
                    False, 
                    f"POST league-data failed: HTTP {response.status_code}"
                )
                return False
            
            # Test 4: POST specific leagueSchedule endpoint
            test_schedule = [{
                "id": "schedule_api_test",
                "title": "Schedule API Test Tournament",
                "date": "2024-12-25",
                "time": "2:00 PM",
                "location": "Schedule Test Arena",
                "type": "tournament",
                "teamIds": ["test_team"],
                "tournamentBracket": {
                    "format": "round_robin",
                    "rounds": []
                }
            }]
            
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=test_schedule,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test(
                    "API Endpoints - POST Schedule Data", 
                    False, 
                    f"POST leagueSchedule failed: HTTP {response.status_code}"
                )
                return False
            
            # Test 5: Verify data persistence through retrieval
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code != 200:
                self.log_test(
                    "API Endpoints - Persistence Verification", 
                    False, 
                    f"Persistence verification failed: HTTP {response.status_code}"
                )
                return False
            
            verification_data = response.json()
            schedule = verification_data.get('leagueSchedule', [])
            
            # Check if our test tournament exists
            test_tournament_found = any(
                event.get('id') == 'schedule_api_test' 
                for event in schedule
            )
            
            if test_tournament_found:
                self.log_test(
                    "API Endpoints - Complete Functionality Test", 
                    True, 
                    f"All API endpoints working correctly for tournament data operations", 
                    {
                        "health_check": "✅ Working",
                        "get_league_data": "✅ Working", 
                        "post_league_data": "✅ Working",
                        "post_schedule_data": "✅ Working",
                        "data_persistence": "✅ Working"
                    }
                )
                return True
            else:
                self.log_test(
                    "API Endpoints - Persistence Check", 
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

    def test_data_survival_after_refresh(self):
        """Test 5: Data Survival - Ensure tournament data survives page refresh/modal close"""
        try:
            print("🔍 Testing Data Survival After Page Refresh/Modal Close Simulation...")
            
            # Simulate multiple rapid API calls (like page refresh/modal operations)
            test_calls = []
            
            for i in range(5):
                # Get data (simulating page refresh)
                response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if response.status_code == 200:
                    test_calls.append(f"GET_{i+1}: Success")
                else:
                    test_calls.append(f"GET_{i+1}: Failed")
                
                # Small delay between calls
                time.sleep(0.5)
            
            # Verify tournament data is still intact after multiple calls
            final_response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if final_response.status_code != 200:
                self.log_test(
                    "Data Survival - Final Verification", 
                    False, 
                    f"Final data retrieval failed: HTTP {final_response.status_code}"
                )
                return False
            
            final_data = final_response.json()
            schedule = final_data.get('leagueSchedule', [])
            
            # Count tournaments with brackets
            tournaments_with_brackets = 0
            total_matches = 0
            
            for event in schedule:
                if (event.get('type') == 'tournament' and 
                    'tournamentBracket' in event and 
                    'rounds' in event['tournamentBracket']):
                    tournaments_with_brackets += 1
                    for round_data in event['tournamentBracket']['rounds']:
                        total_matches += len(round_data.get('matches', []))
            
            if tournaments_with_brackets > 0 and total_matches > 0:
                self.log_test(
                    "Data Survival - Refresh/Modal Simulation", 
                    True, 
                    f"Tournament data survived {len(test_calls)} API calls (simulating page refresh/modal operations)", 
                    {
                        "api_calls_completed": len(test_calls),
                        "tournaments_with_brackets": tournaments_with_brackets,
                        "total_matches_preserved": total_matches,
                        "call_results": test_calls
                    }
                )
                return True
            else:
                self.log_test(
                    "Data Survival - Data Integrity Check", 
                    False, 
                    f"Tournament data lost during refresh simulation - {tournaments_with_brackets} tournaments found"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Data Survival - Connection Error", 
                False, 
                f"Connection error during survival test: {str(e)}"
            )
            return False

    def run_comprehensive_tournament_tests(self):
        """Run all tournament data persistence tests"""
        print("🏆 STARTING COMPREHENSIVE TOURNAMENT DATA PERSISTENCE TESTS")
        print("=" * 70)
        print("Addressing Critical Bug: Tournament bracket data and scores not saving")
        print("=" * 70)
        
        # Run all tests in sequence
        test_results = []
        
        print("1️⃣ TOURNAMENT CREATION TESTING")
        test_results.append(self.test_tournament_creation_persistence())
        
        print("2️⃣ SCORE UPDATES TESTING") 
        test_results.append(self.test_score_updates_persistence())
        
        print("3️⃣ TEAM CHANGES TESTING")
        test_results.append(self.test_team_changes_persistence())
        
        print("4️⃣ API ENDPOINTS TESTING")
        test_results.append(self.test_api_endpoints_functionality())
        
        print("5️⃣ DATA SURVIVAL TESTING")
        test_results.append(self.test_data_survival_after_refresh())
        
        # Summary
        print("=" * 70)
        print("🏆 TOURNAMENT DATA PERSISTENCE TEST SUMMARY")
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
        
        # Critical assessment
        print("\n🔍 CRITICAL BUG ASSESSMENT:")
        if success_rate == 100:
            print("✅ BACKEND IS WORKING CORRECTLY")
            print("✅ Tournament brackets save when created")
            print("✅ Score changes persist after entry")
            print("✅ Team modifications in brackets save")
            print("✅ API endpoints for tournament data exist and work")
            print("✅ Data survives page refresh/modal close")
            print("\n💡 CONCLUSION: The backend API is functioning correctly.")
            print("   If users are experiencing data loss, the issue is likely in the frontend.")
        else:
            print("❌ BACKEND ISSUES DETECTED")
            print("   Tournament data persistence problems confirmed in backend API")
        
        return failed_tests == 0

if __name__ == "__main__":
    try:
        tester = TournamentDataPersistenceTester()
        success = tester.run_comprehensive_tournament_tests()
        
        if success:
            print("\n🎉 Tournament data persistence tests completed successfully!")
            print("✅ Backend API fully supports tournament bracket and score persistence")
            sys.exit(0)
        else:
            print("\n⚠️  Tournament data persistence issues detected. Check results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Tournament persistence test setup failed: {e}")
        sys.exit(1)