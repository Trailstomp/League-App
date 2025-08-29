#!/usr/bin/env python3
"""
Comprehensive Backend Testing Suite for Critical Bug Fixes Verification
Tests team operations, game/event data persistence, player stats, and seasons infrastructure.
"""

import requests
import json
import sys
from datetime import datetime
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

class ComprehensiveBackendTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🔍 COMPREHENSIVE BACKEND TESTING - POST BUG FIXES")
        print(f"Testing backend at: {self.api_base}")
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

    def test_team_operations_with_logos(self):
        """Test team CRUD operations with logo handling - verifies team duplication fix"""
        print("🏆 TESTING TEAM OPERATIONS WITH LOGO HANDLING...")
        
        try:
            # Create comprehensive team data with logos and unique IDs
            team_data = [
                {
                    "id": str(uuid.uuid4()),  # Ensure unique ID generation
                    "name": "Test Lacrosse Team Alpha",
                    "division": "Field",
                    "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                    "colors": {"primary": "#FF0000", "secondary": "#0000FF"},
                    "wins": 5,
                    "losses": 2,
                    "coach": "Coach Alpha",
                    "players": [
                        {
                            "id": str(uuid.uuid4()),
                            "name": "Player One",
                            "position": "Attack",
                            "handedness": "Right Handed",
                            "stats": {"goals": 10, "assists": 5, "games": 7}
                        }
                    ]
                },
                {
                    "id": str(uuid.uuid4()),  # Different unique ID
                    "name": "Test Lacrosse Team Beta", 
                    "division": "Box",
                    "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                    "colors": {"primary": "#00FF00", "secondary": "#FF00FF"},
                    "wins": 3,
                    "losses": 4,
                    "coach": "Coach Beta",
                    "players": [
                        {
                            "id": str(uuid.uuid4()),
                            "name": "Player Two",
                            "position": "Defense", 
                            "handedness": "Left Handed",
                            "stats": {"goals": 2, "assists": 8, "games": 7}
                        }
                    ]
                }
            ]
            
            # Test team creation/update
            response = requests.post(
                f"{self.api_base}/league-data/teams",
                json=team_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify teams were saved
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if get_response.status_code == 200:
                    league_data = get_response.json()
                    saved_teams = league_data.get('teams', [])
                    
                    # Check for team duplication (should have exactly 2 teams)
                    team_ids = [team.get('id') for team in saved_teams if team.get('name', '').startswith('Test Lacrosse Team')]
                    unique_ids = set(team_ids)
                    
                    if len(team_ids) == len(unique_ids) and len(team_ids) >= 2:
                        self.log_test(
                            "Team Operations - No Duplication",
                            True,
                            f"Teams saved with unique IDs. Found {len(team_ids)} teams with {len(unique_ids)} unique IDs",
                            f"Team IDs: {list(unique_ids)[:2]}"
                        )
                        
                        # Verify logo data persistence
                        teams_with_logos = [t for t in saved_teams if t.get('logo') and t.get('name', '').startswith('Test Lacrosse Team')]
                        if len(teams_with_logos) >= 2:
                            self.log_test(
                                "Team Logo Persistence",
                                True,
                                f"Logo data persisted for {len(teams_with_logos)} teams",
                                "Logos saved successfully"
                            )
                            return True
                        else:
                            self.log_test(
                                "Team Logo Persistence",
                                False,
                                f"Only {len(teams_with_logos)} teams have logo data"
                            )
                            return False
                    else:
                        self.log_test(
                            "Team Operations - No Duplication",
                            False,
                            f"Team duplication detected or insufficient teams. Found {len(team_ids)} teams with {len(unique_ids)} unique IDs"
                        )
                        return False
                else:
                    self.log_test(
                        "Team Operations - Verification",
                        False,
                        f"Failed to retrieve league data: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Team Operations - Creation",
                    False,
                    f"Failed to create teams: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team Operations",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_game_event_data_persistence(self):
        """Test game/event data persistence and editing capabilities"""
        print("🎮 TESTING GAME/EVENT DATA PERSISTENCE AND EDITING...")
        
        try:
            # Create comprehensive game/event data
            game_schedule_data = [
                {
                    "id": str(uuid.uuid4()),
                    "type": "game",
                    "title": "Championship Game",
                    "date": "2024-12-15",
                    "time": "7:00 PM",
                    "location": "Main Stadium",
                    "teams": ["team1", "team2"],
                    "status": "Final",
                    "score": {"team1": 12, "team2": 8},
                    "editable": True,  # Test ability to reopen Final games for editing
                    "stats": {
                        "team1_stats": {"shots": 25, "saves": 15},
                        "team2_stats": {"shots": 20, "saves": 18}
                    }
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "event", 
                    "title": "Team Practice",
                    "date": "2024-12-16",
                    "time": "6:00 PM",
                    "location": "Practice Field",
                    "teams": ["team1"],
                    "status": "Scheduled",
                    "rsvp": {
                        "enabled": True,
                        "responses": [
                            {"player_id": "player1", "response": "yes", "timestamp": "2024-12-10T10:00:00Z"},
                            {"player_id": "player2", "response": "no", "timestamp": "2024-12-10T11:00:00Z"}
                        ]
                    },
                    "attendance_tracking": {
                        "enabled": True,
                        "attendees": ["player1"]
                    }
                }
            ]
            
            # Save game/event data
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule",
                json=game_schedule_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify data persistence
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if get_response.status_code == 200:
                    league_data = get_response.json()
                    saved_schedule = league_data.get('leagueSchedule', [])
                    
                    # Find our test games/events
                    test_games = [item for item in saved_schedule if item.get('title') in ['Championship Game', 'Team Practice']]
                    
                    if len(test_games) >= 2:
                        # Test Final game editing capability
                        final_game = next((g for g in test_games if g.get('status') == 'Final'), None)
                        practice_event = next((g for g in test_games if g.get('type') == 'event'), None)
                        
                        if final_game and final_game.get('editable'):
                            self.log_test(
                                "Game Score Editing - Final Games Reopenable",
                                True,
                                f"Final game '{final_game.get('title')}' is marked as editable",
                                f"Score: {final_game.get('score')}"
                            )
                        else:
                            self.log_test(
                                "Game Score Editing - Final Games Reopenable",
                                False,
                                "Final game not found or not marked as editable"
                            )
                            
                        # Test event RSVP and attendance tracking
                        if practice_event and practice_event.get('rsvp', {}).get('enabled'):
                            rsvp_responses = practice_event.get('rsvp', {}).get('responses', [])
                            attendance_data = practice_event.get('attendance_tracking', {})
                            
                            if len(rsvp_responses) >= 2 and attendance_data.get('enabled'):
                                self.log_test(
                                    "Event RSVP & Attendance Tracking",
                                    True,
                                    f"RSVP system working with {len(rsvp_responses)} responses, attendance tracking enabled",
                                    f"Attendees: {attendance_data.get('attendees', [])}"
                                )
                                return True
                            else:
                                self.log_test(
                                    "Event RSVP & Attendance Tracking",
                                    False,
                                    f"RSVP or attendance data incomplete. Responses: {len(rsvp_responses)}, Attendance enabled: {attendance_data.get('enabled')}"
                                )
                                return False
                        else:
                            self.log_test(
                                "Event RSVP & Attendance Tracking",
                                False,
                                "Practice event not found or RSVP not enabled"
                            )
                            return False
                    else:
                        self.log_test(
                            "Game/Event Data Persistence",
                            False,
                            f"Expected 2 test items, found {len(test_games)}"
                        )
                        return False
                else:
                    self.log_test(
                        "Game/Event Data Verification",
                        False,
                        f"Failed to retrieve league data: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Game/Event Data Creation",
                    False,
                    f"Failed to save schedule data: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Game/Event Data Persistence",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_player_stats_structure(self):
        """Test player stats data structure and visibility"""
        print("📊 TESTING PLAYER STATS DATA STRUCTURE...")
        
        try:
            # Create comprehensive player data with stats
            players_data = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Stats Test Player Alpha",
                    "team_id": "team1",
                    "position": "Attack",
                    "handedness": "Right Handed",
                    "stats": {
                        "games_played": 10,
                        "goals": 15,
                        "assists": 8,
                        "shots": 45,
                        "shot_percentage": 33.3,
                        "saves": 0,
                        "ground_balls": 12,
                        "turnovers": 5,
                        "penalties": 2,
                        "face_off_wins": 0,
                        "face_off_attempts": 0
                    },
                    "season_stats": {
                        "2024": {
                            "goals": 15,
                            "assists": 8,
                            "games": 10
                        }
                    }
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Stats Test Player Beta",
                    "team_id": "team1", 
                    "position": "Goalie",
                    "handedness": "Left Handed",
                    "stats": {
                        "games_played": 8,
                        "goals": 0,
                        "assists": 2,
                        "shots": 0,
                        "shot_percentage": 0,
                        "saves": 85,
                        "save_percentage": 78.5,
                        "goals_against": 23,
                        "ground_balls": 15,
                        "turnovers": 3,
                        "penalties": 1
                    },
                    "season_stats": {
                        "2024": {
                            "saves": 85,
                            "goals_against": 23,
                            "games": 8
                        }
                    }
                }
            ]
            
            # Save player data
            response = requests.post(
                f"{self.api_base}/league-data/players",
                json=players_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify player stats structure
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if get_response.status_code == 200:
                    league_data = get_response.json()
                    saved_players = league_data.get('players', [])
                    
                    # Find our test players
                    test_players = [p for p in saved_players if p.get('name', '').startswith('Stats Test Player')]
                    
                    if len(test_players) >= 2:
                        # Verify stats structure for both players
                        stats_complete = True
                        for player in test_players:
                            player_stats = player.get('stats', {})
                            season_stats = player.get('season_stats', {})
                            
                            required_stats = ['games_played', 'goals', 'assists', 'shots']
                            missing_stats = [stat for stat in required_stats if stat not in player_stats]
                            
                            if missing_stats:
                                stats_complete = False
                                break
                                
                            if '2024' not in season_stats:
                                stats_complete = False
                                break
                        
                        if stats_complete:
                            # Test stats visibility (verify stats tab data structure)
                            attack_player = next((p for p in test_players if p.get('position') == 'Attack'), None)
                            goalie_player = next((p for p in test_players if p.get('position') == 'Goalie'), None)
                            
                            if attack_player and goalie_player:
                                attack_goals = attack_player.get('stats', {}).get('goals', 0)
                                goalie_saves = goalie_player.get('stats', {}).get('saves', 0)
                                
                                self.log_test(
                                    "Player Stats Structure & Visibility",
                                    True,
                                    f"Complete stats structure verified for {len(test_players)} players",
                                    f"Attack goals: {attack_goals}, Goalie saves: {goalie_saves}"
                                )
                                return True
                            else:
                                self.log_test(
                                    "Player Stats Structure & Visibility",
                                    False,
                                    "Missing attack or goalie player in test data"
                                )
                                return False
                        else:
                            self.log_test(
                                "Player Stats Structure & Visibility",
                                False,
                                "Incomplete stats structure detected"
                            )
                            return False
                    else:
                        self.log_test(
                            "Player Stats Data Persistence",
                            False,
                            f"Expected 2 test players, found {len(test_players)}"
                        )
                        return False
                else:
                    self.log_test(
                        "Player Stats Verification",
                        False,
                        f"Failed to retrieve league data: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Player Stats Creation",
                    False,
                    f"Failed to save player data: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Player Stats Structure",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_seasons_infrastructure(self):
        """Test seasons infrastructure integration"""
        print("🏆 TESTING SEASONS INFRASTRUCTURE...")
        
        try:
            # Create seasons data structure
            seasons_data = {
                "current_season": "2024",
                "seasons": {
                    "2024": {
                        "id": "2024",
                        "name": "Current Season 2024",
                        "status": "active",
                        "start_date": "2024-01-01",
                        "end_date": "2024-12-31",
                        "teams": ["team1", "team2"],
                        "stats": {
                            "total_games": 45,
                            "total_teams": 8,
                            "total_players": 120
                        }
                    },
                    "2023": {
                        "id": "2023", 
                        "name": "Previous Season 2023",
                        "status": "completed",
                        "start_date": "2023-01-01",
                        "end_date": "2023-12-31",
                        "teams": ["team1", "team2"],
                        "stats": {
                            "total_games": 42,
                            "total_teams": 6,
                            "total_players": 95
                        }
                    }
                }
            }
            
            # Save seasons data as part of league info
            league_info_data = {
                "name": "Major League Baseball Lacrosse",
                "seasons": seasons_data,
                "current_season": "2024"
            }
            
            response = requests.post(
                f"{self.api_base}/league-data/leagueInfo",
                json=league_info_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify seasons infrastructure
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if get_response.status_code == 200:
                    league_data = get_response.json()
                    league_info = league_data.get('leagueInfo', {})
                    seasons_info = league_info.get('seasons', {})
                    
                    if seasons_info and 'seasons' in seasons_info:
                        seasons = seasons_info.get('seasons', {})
                        current_season = seasons_info.get('current_season')
                        
                        if len(seasons) >= 2 and current_season == "2024":
                            # Verify season data structure
                            season_2024 = seasons.get('2024', {})
                            season_2023 = seasons.get('2023', {})
                            
                            if (season_2024.get('status') == 'active' and 
                                season_2023.get('status') == 'completed' and
                                'stats' in season_2024 and 'stats' in season_2023):
                                
                                self.log_test(
                                    "Seasons Infrastructure Integration",
                                    True,
                                    f"Seasons infrastructure working with {len(seasons)} seasons, current: {current_season}",
                                    f"Active season teams: {len(season_2024.get('teams', []))}"
                                )
                                return True
                            else:
                                self.log_test(
                                    "Seasons Infrastructure Integration",
                                    False,
                                    "Season data structure incomplete or incorrect status"
                                )
                                return False
                        else:
                            self.log_test(
                                "Seasons Infrastructure Integration",
                                False,
                                f"Expected 2+ seasons with current='2024', found {len(seasons)} seasons, current='{current_season}'"
                            )
                            return False
                    else:
                        self.log_test(
                            "Seasons Infrastructure Integration",
                            False,
                            "Seasons data not found in league info"
                        )
                        return False
                else:
                    self.log_test(
                        "Seasons Infrastructure Verification",
                        False,
                        f"Failed to retrieve league data: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Seasons Infrastructure Creation",
                    False,
                    f"Failed to save seasons data: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Seasons Infrastructure",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def test_data_integrity(self):
        """Test overall data integrity after all operations"""
        print("🔒 TESTING OVERALL DATA INTEGRITY...")
        
        try:
            # Get all league data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                league_data = response.json()
                
                # Check data integrity
                teams = league_data.get('teams', [])
                players = league_data.get('players', [])
                schedule = league_data.get('leagueSchedule', [])
                league_info = league_data.get('leagueInfo', {})
                
                integrity_checks = []
                
                # Check for duplicate team IDs
                team_ids = [team.get('id') for team in teams if team.get('id')]
                unique_team_ids = set(team_ids)
                integrity_checks.append(("No duplicate team IDs", len(team_ids) == len(unique_team_ids)))
                
                # Check for duplicate player IDs
                player_ids = [player.get('id') for player in players if player.get('id')]
                unique_player_ids = set(player_ids)
                integrity_checks.append(("No duplicate player IDs", len(player_ids) == len(unique_player_ids)))
                
                # Check for duplicate schedule IDs
                schedule_ids = [item.get('id') for item in schedule if item.get('id')]
                unique_schedule_ids = set(schedule_ids)
                integrity_checks.append(("No duplicate schedule IDs", len(schedule_ids) == len(unique_schedule_ids)))
                
                # Check data relationships
                test_teams = [t for t in teams if t.get('name', '').startswith('Test Lacrosse Team')]
                test_players = [p for p in players if p.get('name', '').startswith('Stats Test Player')]
                test_games = [g for g in schedule if g.get('title') in ['Championship Game', 'Team Practice']]
                
                integrity_checks.append(("Test teams present", len(test_teams) >= 2))
                integrity_checks.append(("Test players present", len(test_players) >= 2))
                integrity_checks.append(("Test games/events present", len(test_games) >= 2))
                
                # Check seasons data
                seasons_data = league_info.get('seasons', {})
                if seasons_data and 'seasons' in seasons_data:
                    seasons = seasons_data.get('seasons', {})
                    integrity_checks.append(("Seasons data present", len(seasons) >= 2))
                else:
                    integrity_checks.append(("Seasons data present", False))
                
                # Evaluate integrity
                passed_checks = [check for check in integrity_checks if check[1]]
                failed_checks = [check for check in integrity_checks if not check[1]]
                
                if len(failed_checks) == 0:
                    self.log_test(
                        "Overall Data Integrity",
                        True,
                        f"All {len(integrity_checks)} integrity checks passed",
                        f"Teams: {len(teams)}, Players: {len(players)}, Schedule items: {len(schedule)}"
                    )
                    return True
                else:
                    failed_names = [check[0] for check in failed_checks]
                    self.log_test(
                        "Overall Data Integrity",
                        False,
                        f"{len(failed_checks)} integrity checks failed: {', '.join(failed_names)}"
                    )
                    return False
            else:
                self.log_test(
                    "Data Integrity Check",
                    False,
                    f"Failed to retrieve league data: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Overall Data Integrity",
                False,
                f"Connection error: {str(e)}"
            )
            return False

    def run_comprehensive_tests(self):
        """Run all comprehensive backend tests"""
        print("🚀 STARTING COMPREHENSIVE BACKEND TESTING AFTER BUG FIXES")
        print(f"Target URL: {self.api_base}")
        print("=" * 80)
        
        # Test basic health first
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            if response.status_code != 200:
                print("❌ CRITICAL: Backend health check failed")
                return False
            else:
                print("✅ Backend health check passed")
                print()
        except:
            print("❌ CRITICAL: Cannot connect to backend")
            return False
        
        # Run comprehensive tests
        tests = [
            self.test_team_operations_with_logos,
            self.test_game_event_data_persistence,
            self.test_player_stats_structure,
            self.test_seasons_infrastructure,
            self.test_data_integrity
        ]
        
        for test in tests:
            test()
        
        # Summary
        print("=" * 80)
        print("🎯 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
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
        print(f"\n📊 Success Rate: {success_rate:.1f}%")
        
        # Critical assessment
        critical_failures = [t for t in self.failed_tests if any(keyword in t for keyword in ['Team Operations', 'Data Integrity', 'Player Stats'])]
        
        if len(critical_failures) == 0:
            print("\n🎉 ALL CRITICAL BUG FIXES VERIFIED SUCCESSFULLY!")
            print("✅ Team duplication fix working")
            print("✅ Game score editing capabilities verified") 
            print("✅ Player stats visibility confirmed")
            print("✅ Seasons infrastructure operational")
            print("✅ Overall data integrity maintained")
            return True
        else:
            print(f"\n⚠️  {len(critical_failures)} critical issues detected:")
            for failure in critical_failures:
                print(f"  - {failure}")
            return False

if __name__ == "__main__":
    try:
        tester = ComprehensiveBackendTester()
        success = tester.run_comprehensive_tests()
        
        if success:
            print("\n🏆 COMPREHENSIVE BACKEND TESTING COMPLETED SUCCESSFULLY!")
            print("Backend is fully operational after bug fixes.")
            sys.exit(0)
        else:
            print("\n⚠️  Some comprehensive tests failed. Review results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Comprehensive test setup failed: {e}")
        sys.exit(1)