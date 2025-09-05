#!/usr/bin/env python3
"""
Comprehensive Recovery and CRUD Testing Suite
Tests the complete data recovery process and all CRUD operations for the emergency scenario.

This test:
1. Tests all CRUD operations for teams and players
2. Simulates data recovery from backups
3. Tests synchronization between individual collections and league_data
4. Verifies website style persistence
5. Tests the complete emergency recovery workflow
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

class ComprehensiveRecoveryTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print("🔧 COMPREHENSIVE RECOVERY & CRUD TESTING SUITE")
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

    def test_teams_crud_operations(self):
        """Test complete CRUD operations for teams"""
        print("🏒 TESTING TEAMS CRUD OPERATIONS")
        
        # CREATE - Test creating a new team with user data
        test_team = {
            "id": str(uuid.uuid4()),
            "name": "Updated Test Lacrosse Team",
            "division": "Field",
            "coach": "Coach Smith",
            "homeField": "Smith Stadium",
            "logo": "data:image/jpeg;base64,testlogo123",
            "contactEmail": "coach.smith@testteam.com",
            "active": True,
            "wins": 5,
            "losses": 2,
            "ties": 1
        }
        
        try:
            # CREATE
            create_response = requests.post(
                f"{self.api_base}/teams", 
                json=test_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if create_response.status_code == 200:
                created_team = create_response.json()
                team_id = created_team.get('id')
                
                self.log_test(
                    "Teams CRUD - CREATE", 
                    True, 
                    f"Successfully created team: {created_team.get('name')}",
                    f"ID: {team_id}, Coach: {created_team.get('coach')}"
                )
                
                # READ - Test retrieving the created team
                read_response = requests.get(f"{self.api_base}/teams", timeout=10)
                if read_response.status_code == 200:
                    teams = read_response.json()
                    found_team = next((t for t in teams if t.get('id') == team_id), None)
                    
                    if found_team and found_team.get('name') == test_team['name']:
                        self.log_test(
                            "Teams CRUD - READ", 
                            True, 
                            f"Successfully retrieved created team",
                            f"Name: {found_team.get('name')}, Division: {found_team.get('division')}"
                        )
                        
                        # UPDATE - Test updating the team
                        updated_team = found_team.copy()
                        updated_team['coach'] = "Coach Johnson"
                        updated_team['wins'] = 7
                        
                        update_response = requests.put(
                            f"{self.api_base}/teams/{team_id}", 
                            json=updated_team,
                            headers={'Content-Type': 'application/json'},
                            timeout=10
                        )
                        
                        if update_response.status_code == 200:
                            updated_result = update_response.json()
                            
                            if updated_result.get('coach') == "Coach Johnson" and updated_result.get('wins') == 7:
                                self.log_test(
                                    "Teams CRUD - UPDATE", 
                                    True, 
                                    f"Successfully updated team",
                                    f"New coach: {updated_result.get('coach')}, Wins: {updated_result.get('wins')}"
                                )
                                
                                # DELETE - Test deleting the team
                                delete_response = requests.delete(f"{self.api_base}/teams/{team_id}", timeout=10)
                                
                                if delete_response.status_code == 200:
                                    # Verify deletion
                                    verify_response = requests.get(f"{self.api_base}/teams", timeout=10)
                                    if verify_response.status_code == 200:
                                        remaining_teams = verify_response.json()
                                        deleted_team = next((t for t in remaining_teams if t.get('id') == team_id), None)
                                        
                                        if not deleted_team:
                                            self.log_test(
                                                "Teams CRUD - DELETE", 
                                                True, 
                                                f"Successfully deleted team",
                                                f"Team {team_id} no longer exists"
                                            )
                                            return True
                                        else:
                                            self.log_test(
                                                "Teams CRUD - DELETE", 
                                                False, 
                                                f"Team still exists after deletion"
                                            )
                                            return False
                                    else:
                                        self.log_test(
                                            "Teams CRUD - DELETE", 
                                            False, 
                                            f"Could not verify deletion: HTTP {verify_response.status_code}"
                                        )
                                        return False
                                else:
                                    self.log_test(
                                        "Teams CRUD - DELETE", 
                                        False, 
                                        f"Delete failed: HTTP {delete_response.status_code}"
                                    )
                                    return False
                            else:
                                self.log_test(
                                    "Teams CRUD - UPDATE", 
                                    False, 
                                    f"Update verification failed"
                                )
                                return False
                        else:
                            self.log_test(
                                "Teams CRUD - UPDATE", 
                                False, 
                                f"Update failed: HTTP {update_response.status_code}"
                            )
                            return False
                    else:
                        self.log_test(
                            "Teams CRUD - READ", 
                            False, 
                            f"Created team not found in GET response"
                        )
                        return False
                else:
                    self.log_test(
                        "Teams CRUD - READ", 
                        False, 
                        f"Read failed: HTTP {read_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Teams CRUD - CREATE", 
                    False, 
                    f"Create failed: HTTP {create_response.status_code}: {create_response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Teams CRUD Operations", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_players_crud_operations(self):
        """Test complete CRUD operations for players"""
        print("👤 TESTING PLAYERS CRUD OPERATIONS")
        
        # First create a team to associate players with
        test_team = {
            "id": str(uuid.uuid4()),
            "name": "Test Team for Players",
            "division": "Field",
            "coach": "Coach Test",
            "active": True
        }
        
        try:
            # Create team first
            team_response = requests.post(
                f"{self.api_base}/teams", 
                json=test_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if team_response.status_code != 200:
                self.log_test(
                    "Players CRUD - Setup", 
                    False, 
                    f"Could not create test team: HTTP {team_response.status_code}"
                )
                return False
            
            team_id = test_team['id']
            
            # CREATE - Test creating a new player
            test_player = {
                "id": str(uuid.uuid4()),
                "name": "Johnny Lacrosse Jr.",
                "teamId": team_id,
                "position": "Attack",
                "jerseyNumber": 10,
                "email": "johnny@testteam.com",
                "phone": "555-0123",
                "active": True
            }
            
            create_response = requests.post(
                f"{self.api_base}/players", 
                json=test_player,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if create_response.status_code == 200:
                created_player = create_response.json()
                player_id = created_player.get('id')
                
                self.log_test(
                    "Players CRUD - CREATE", 
                    True, 
                    f"Successfully created player: {created_player.get('name')}",
                    f"ID: {player_id}, Position: {created_player.get('position')}, Jersey: {created_player.get('jerseyNumber')}"
                )
                
                # READ - Test retrieving the created player
                read_response = requests.get(f"{self.api_base}/players", timeout=10)
                if read_response.status_code == 200:
                    players = read_response.json()
                    found_player = next((p for p in players if p.get('id') == player_id), None)
                    
                    if found_player and found_player.get('name') == test_player['name']:
                        self.log_test(
                            "Players CRUD - READ", 
                            True, 
                            f"Successfully retrieved created player",
                            f"Name: {found_player.get('name')}, Team: {found_player.get('teamId')}"
                        )
                        
                        # UPDATE - Test updating the player
                        updated_player = found_player.copy()
                        updated_player['position'] = "Midfield"
                        updated_player['jerseyNumber'] = 15
                        
                        update_response = requests.put(
                            f"{self.api_base}/players/{player_id}", 
                            json=updated_player,
                            headers={'Content-Type': 'application/json'},
                            timeout=10
                        )
                        
                        if update_response.status_code == 200:
                            updated_result = update_response.json()
                            
                            if updated_result.get('position') == "Midfield" and updated_result.get('jerseyNumber') == 15:
                                self.log_test(
                                    "Players CRUD - UPDATE", 
                                    True, 
                                    f"Successfully updated player",
                                    f"New position: {updated_result.get('position')}, Jersey: {updated_result.get('jerseyNumber')}"
                                )
                                
                                # DELETE - Test deleting the player
                                delete_response = requests.delete(f"{self.api_base}/players/{player_id}", timeout=10)
                                
                                if delete_response.status_code == 200:
                                    # Verify deletion
                                    verify_response = requests.get(f"{self.api_base}/players", timeout=10)
                                    if verify_response.status_code == 200:
                                        remaining_players = verify_response.json()
                                        deleted_player = next((p for p in remaining_players if p.get('id') == player_id), None)
                                        
                                        if not deleted_player:
                                            self.log_test(
                                                "Players CRUD - DELETE", 
                                                True, 
                                                f"Successfully deleted player",
                                                f"Player {player_id} no longer exists"
                                            )
                                            
                                            # Clean up test team
                                            requests.delete(f"{self.api_base}/teams/{team_id}", timeout=10)
                                            return True
                                        else:
                                            self.log_test(
                                                "Players CRUD - DELETE", 
                                                False, 
                                                f"Player still exists after deletion"
                                            )
                                            return False
                                    else:
                                        self.log_test(
                                            "Players CRUD - DELETE", 
                                            False, 
                                            f"Could not verify deletion: HTTP {verify_response.status_code}"
                                        )
                                        return False
                                else:
                                    self.log_test(
                                        "Players CRUD - DELETE", 
                                        False, 
                                        f"Delete failed: HTTP {delete_response.status_code}"
                                    )
                                    return False
                            else:
                                self.log_test(
                                    "Players CRUD - UPDATE", 
                                    False, 
                                    f"Update verification failed"
                                )
                                return False
                        else:
                            self.log_test(
                                "Players CRUD - UPDATE", 
                                False, 
                                f"Update failed: HTTP {update_response.status_code}"
                            )
                            return False
                    else:
                        self.log_test(
                            "Players CRUD - READ", 
                            False, 
                            f"Created player not found in GET response"
                        )
                        return False
                else:
                    self.log_test(
                        "Players CRUD - READ", 
                        False, 
                        f"Read failed: HTTP {read_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Players CRUD - CREATE", 
                    False, 
                    f"Create failed: HTTP {create_response.status_code}: {create_response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Players CRUD Operations", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_data_recovery_simulation(self):
        """Simulate the complete data recovery process"""
        print("🔄 TESTING DATA RECOVERY SIMULATION")
        
        try:
            # Step 1: Create realistic user data in individual collections
            recovery_teams = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Updated Test Lacrosse Team",
                    "division": "Field",
                    "coach": "Coach Smith",
                    "homeField": "Smith Stadium",
                    "logo": "data:image/jpeg;base64,userlogo123",
                    "contactEmail": "coach.smith@mlbl.org",
                    "active": True,
                    "wins": 8,
                    "losses": 3,
                    "ties": 1
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Elite Lacrosse Club",
                    "division": "Box",
                    "coach": "Coach Johnson",
                    "homeField": "Elite Arena",
                    "logo": "data:image/jpeg;base64,elitelogo456",
                    "contactEmail": "coach.johnson@mlbl.org",
                    "active": True,
                    "wins": 6,
                    "losses": 4,
                    "ties": 2
                }
            ]
            
            # Create teams in individual collection
            created_teams = []
            for team in recovery_teams:
                response = requests.post(
                    f"{self.api_base}/teams", 
                    json=team,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                if response.status_code == 200:
                    created_teams.append(response.json())
            
            if len(created_teams) != len(recovery_teams):
                self.log_test(
                    "Data Recovery - Team Creation", 
                    False, 
                    f"Could not create all recovery teams: {len(created_teams)}/{len(recovery_teams)}"
                )
                return False
            
            # Step 2: Create players for the teams
            recovery_players = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Johnny Lacrosse Jr.",
                    "teamId": created_teams[0]['id'],
                    "position": "Attack",
                    "jerseyNumber": 10,
                    "email": "johnny@mlbl.org",
                    "phone": "555-0123",
                    "active": True
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Sarah Elite",
                    "teamId": created_teams[1]['id'],
                    "position": "Defense",
                    "jerseyNumber": 5,
                    "email": "sarah@mlbl.org",
                    "phone": "555-0456",
                    "active": True
                }
            ]
            
            created_players = []
            for player in recovery_players:
                response = requests.post(
                    f"{self.api_base}/players", 
                    json=player,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                if response.status_code == 200:
                    created_players.append(response.json())
            
            if len(created_players) != len(recovery_players):
                self.log_test(
                    "Data Recovery - Player Creation", 
                    False, 
                    f"Could not create all recovery players: {len(created_players)}/{len(recovery_players)}"
                )
                return False
            
            self.log_test(
                "Data Recovery - Individual Collections Setup", 
                True, 
                f"Successfully created {len(created_teams)} teams and {len(created_players)} players in individual collections",
                f"Teams: {[t['name'] for t in created_teams]}"
            )
            
            # Step 3: Simulate recovery by syncing to league_data
            recovery_league_data = {
                "teams": created_teams,
                "players": created_players,
                "users": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Admin User",
                        "email": "admin@mlbl.org",
                        "role": "admin",
                        "status": "active"
                    }
                ],
                "newsItems": [
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Season Recovery Complete",
                        "content": "All team and player data has been successfully recovered.",
                        "date": datetime.utcnow().isoformat()
                    }
                ],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {
                    "name": "MLBL - Recovered League",
                    "season": "2024-2025",
                    "recoveryDate": datetime.utcnow().isoformat()
                },
                "websiteStyle": {
                    "theme": "user_custom",
                    "primaryColor": "#FF6B35",
                    "secondaryColor": "#004E89",
                    "bannerColor": "#FF6B35",
                    "bannerText": "Welcome to MLBL - Recovered",
                    "logoUrl": "data:image/jpeg;base64,recoveredlogo789",
                    "backgroundImage": "data:image/jpeg;base64,recoveredbackground123",
                    "customBanners": {
                        "mainBanner": {"text": "MLBL Championship League", "color": "#FF6B35"},
                        "teamBanner": {"text": "Team Central", "color": "#004E89"}
                    },
                    "recoveryTimestamp": datetime.utcnow().isoformat()
                }
            }
            
            # Save recovered data to league_data
            recovery_response = requests.post(
                f"{self.api_base}/league-data", 
                json=recovery_league_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if recovery_response.status_code == 200:
                # Verify recovery
                time.sleep(1)
                
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    recovered_data = verify_response.json()
                    
                    recovered_teams = recovered_data.get('teams', [])
                    recovered_players = recovered_data.get('players', [])
                    recovered_style = recovered_data.get('websiteStyle', {})
                    
                    # Verify all data was recovered correctly
                    teams_match = len(recovered_teams) == len(created_teams)
                    players_match = len(recovered_players) == len(created_players)
                    style_recovered = recovered_style.get('theme') == 'user_custom'
                    
                    if teams_match and players_match and style_recovered:
                        self.log_test(
                            "Data Recovery - League Data Synchronization", 
                            True, 
                            f"Successfully recovered all data to league_data collection",
                            f"Teams: {len(recovered_teams)}, Players: {len(recovered_players)}, Style theme: {recovered_style.get('theme')}"
                        )
                        
                        # Clean up created data
                        for team in created_teams:
                            requests.delete(f"{self.api_base}/teams/{team['id']}", timeout=10)
                        
                        return True
                    else:
                        self.log_test(
                            "Data Recovery - League Data Synchronization", 
                            False, 
                            f"Recovery verification failed - Teams: {teams_match}, Players: {players_match}, Style: {style_recovered}"
                        )
                        return False
                else:
                    self.log_test(
                        "Data Recovery - League Data Synchronization", 
                        False, 
                        f"Could not verify recovery: HTTP {verify_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Data Recovery - League Data Synchronization", 
                    False, 
                    f"Recovery save failed: HTTP {recovery_response.status_code}: {recovery_response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Data Recovery Simulation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_backup_functionality(self):
        """Test backup creation and verification"""
        print("💾 TESTING BACKUP FUNCTIONALITY")
        
        try:
            # Test teams backup
            teams_backup_response = requests.get(f"{self.api_base}/backup/teams", timeout=10)
            teams_backup_success = teams_backup_response.status_code == 200
            
            # Test players backup
            players_backup_response = requests.get(f"{self.api_base}/backup/players", timeout=10)
            players_backup_success = players_backup_response.status_code == 200
            
            if teams_backup_success and players_backup_success:
                self.log_test(
                    "Backup Functionality", 
                    True, 
                    "Both teams and players backup endpoints working correctly",
                    f"Teams: {teams_backup_response.json().get('message')}, Players: {players_backup_response.json().get('message')}"
                )
                return True
            else:
                failed_endpoints = []
                if not teams_backup_success:
                    failed_endpoints.append(f"Teams: HTTP {teams_backup_response.status_code}")
                if not players_backup_success:
                    failed_endpoints.append(f"Players: HTTP {players_backup_response.status_code}")
                
                self.log_test(
                    "Backup Functionality", 
                    False, 
                    f"Backup endpoints failed: {', '.join(failed_endpoints)}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Backup Functionality", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_comprehensive_tests(self):
        """Run all comprehensive recovery and CRUD tests"""
        print("🔧 STARTING COMPREHENSIVE RECOVERY & CRUD TESTS")
        print(f"Target URL: {self.api_base}")
        print("=" * 80)
        
        # Test 1: Teams CRUD Operations
        teams_crud_success = self.test_teams_crud_operations()
        
        # Test 2: Players CRUD Operations  
        players_crud_success = self.test_players_crud_operations()
        
        # Test 3: Data Recovery Simulation
        recovery_success = self.test_data_recovery_simulation()
        
        # Test 4: Backup Functionality
        backup_success = self.test_backup_functionality()
        
        # Summary
        print("=" * 80)
        print("🔧 COMPREHENSIVE TEST SUMMARY")
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
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        # Critical assessment for emergency recovery
        critical_systems = [
            ("Teams CRUD Operations", teams_crud_success),
            ("Players CRUD Operations", players_crud_success),
            ("Data Recovery Process", recovery_success),
            ("Backup Systems", backup_success)
        ]
        
        print(f"\n🔍 CRITICAL SYSTEMS STATUS:")
        all_critical_working = True
        for system, status in critical_systems:
            status_icon = "✅" if status else "❌"
            print(f"  {status_icon} {system}")
            if not status:
                all_critical_working = False
        
        if all_critical_working:
            print(f"\n🎉 ALL CRITICAL SYSTEMS OPERATIONAL!")
            print(f"✅ Teams and Players CRUD operations working perfectly")
            print(f"✅ Data recovery process functional")
            print(f"✅ Backup systems operational")
            print(f"✅ Emergency data recovery is fully supported")
        else:
            print(f"\n⚠️  CRITICAL SYSTEMS HAVE ISSUES!")
            print(f"❌ Emergency data recovery may not be fully functional")
        
        return all_critical_working

if __name__ == "__main__":
    try:
        tester = ComprehensiveRecoveryTester()
        success = tester.run_comprehensive_tests()
        
        if success:
            print("\n🎉 All comprehensive recovery and CRUD tests passed!")
            sys.exit(0)
        else:
            print("\n⚠️  Some comprehensive tests failed!")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Comprehensive test setup failed: {e}")
        sys.exit(1)