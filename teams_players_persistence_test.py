#!/usr/bin/env python3
"""
Teams and Players Database Persistence Testing Suite
Tests the implementation of dedicated MongoDB collections and CRUD API endpoints for teams and players
as requested in the critical infrastructure fix review.
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

class TeamsPlayersDBTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Teams & Players Database Persistence at: {self.api_base}")
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

    def test_dedicated_teams_endpoints(self):
        """Test if dedicated /api/teams endpoints exist"""
        print("🔍 Testing Dedicated Teams Collection Endpoints...")
        
        # Test GET /api/teams
        try:
            response = requests.get(f"{self.api_base}/teams", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "GET /api/teams - Dedicated Teams Collection", 
                    True, 
                    f"Retrieved {len(data)} teams from dedicated collection", 
                    f"Teams count: {len(data)}"
                )
                return True, data
            elif response.status_code == 404:
                self.log_test(
                    "GET /api/teams - Dedicated Teams Collection", 
                    False, 
                    "Endpoint not found - dedicated teams collection not implemented"
                )
                return False, None
            else:
                self.log_test(
                    "GET /api/teams - Dedicated Teams Collection", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET /api/teams - Dedicated Teams Collection", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_dedicated_players_endpoints(self):
        """Test if dedicated /api/players endpoints exist"""
        print("🔍 Testing Dedicated Players Collection Endpoints...")
        
        # Test GET /api/players
        try:
            response = requests.get(f"{self.api_base}/players", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "GET /api/players - Dedicated Players Collection", 
                    True, 
                    f"Retrieved {len(data)} players from dedicated collection", 
                    f"Players count: {len(data)}"
                )
                return True, data
            elif response.status_code == 404:
                self.log_test(
                    "GET /api/players - Dedicated Players Collection", 
                    False, 
                    "Endpoint not found - dedicated players collection not implemented"
                )
                return False, None
            else:
                self.log_test(
                    "GET /api/players - Dedicated Players Collection", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET /api/players - Dedicated Players Collection", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_teams_crud_operations(self):
        """Test full CRUD operations for teams"""
        print("🔍 Testing Teams CRUD Operations...")
        
        # Test POST /api/teams (Create)
        test_team = {
            "name": "Test Lacrosse Team",
            "division": "Field",
            "coach": "Test Coach",
            "homeField": "Test Stadium"
        }
        
        try:
            response = requests.post(
                f"{self.api_base}/teams", 
                json=test_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                created_team = response.json()
                team_id = created_team.get('id')
                
                if team_id:
                    self.log_test(
                        "POST /api/teams - Create Team", 
                        True, 
                        f"Created team with ID: {team_id}", 
                        {"id": team_id, "name": created_team.get('name')}
                    )
                    
                    # Test PUT /api/teams/:id (Update)
                    updated_team = test_team.copy()
                    updated_team["name"] = "Updated Test Team"
                    
                    update_response = requests.put(
                        f"{self.api_base}/teams/{team_id}", 
                        json=updated_team,
                        headers={'Content-Type': 'application/json'},
                        timeout=10
                    )
                    
                    if update_response.status_code == 200:
                        self.log_test(
                            "PUT /api/teams/:id - Update Team", 
                            True, 
                            f"Updated team {team_id}", 
                            {"updated_name": updated_team["name"]}
                        )
                    else:
                        self.log_test(
                            "PUT /api/teams/:id - Update Team", 
                            False, 
                            f"HTTP {update_response.status_code}: {update_response.text}"
                        )
                    
                    # Test DELETE /api/teams/:id (Delete)
                    delete_response = requests.delete(f"{self.api_base}/teams/{team_id}", timeout=10)
                    
                    if delete_response.status_code in [200, 204]:
                        self.log_test(
                            "DELETE /api/teams/:id - Delete Team", 
                            True, 
                            f"Deleted team {team_id}", 
                            {"deleted_id": team_id}
                        )
                        return True
                    else:
                        self.log_test(
                            "DELETE /api/teams/:id - Delete Team", 
                            False, 
                            f"HTTP {delete_response.status_code}: {delete_response.text}"
                        )
                        return False
                else:
                    self.log_test(
                        "POST /api/teams - Create Team", 
                        False, 
                        "No ID returned in created team response"
                    )
                    return False
            elif response.status_code == 404:
                self.log_test(
                    "POST /api/teams - Create Team", 
                    False, 
                    "Endpoint not found - teams CRUD not implemented"
                )
                return False
            else:
                self.log_test(
                    "POST /api/teams - Create Team", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST /api/teams - Create Team", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_players_crud_operations(self):
        """Test full CRUD operations for players"""
        print("🔍 Testing Players CRUD Operations...")
        
        # Test POST /api/players (Create)
        test_player = {
            "name": "Test Player",
            "position": "Midfielder",
            "teamId": "test_team_id",
            "jerseyNumber": 42
        }
        
        try:
            response = requests.post(
                f"{self.api_base}/players", 
                json=test_player,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                created_player = response.json()
                player_id = created_player.get('id')
                
                if player_id:
                    self.log_test(
                        "POST /api/players - Create Player", 
                        True, 
                        f"Created player with ID: {player_id}", 
                        {"id": player_id, "name": created_player.get('name')}
                    )
                    
                    # Test PUT /api/players/:id (Update)
                    updated_player = test_player.copy()
                    updated_player["position"] = "Attacker"
                    
                    update_response = requests.put(
                        f"{self.api_base}/players/{player_id}", 
                        json=updated_player,
                        headers={'Content-Type': 'application/json'},
                        timeout=10
                    )
                    
                    if update_response.status_code == 200:
                        self.log_test(
                            "PUT /api/players/:id - Update Player", 
                            True, 
                            f"Updated player {player_id}", 
                            {"updated_position": updated_player["position"]}
                        )
                    else:
                        self.log_test(
                            "PUT /api/players/:id - Update Player", 
                            False, 
                            f"HTTP {update_response.status_code}: {update_response.text}"
                        )
                    
                    # Test DELETE /api/players/:id (Delete)
                    delete_response = requests.delete(f"{self.api_base}/players/{player_id}", timeout=10)
                    
                    if delete_response.status_code in [200, 204]:
                        self.log_test(
                            "DELETE /api/players/:id - Delete Player", 
                            True, 
                            f"Deleted player {player_id}", 
                            {"deleted_id": player_id}
                        )
                        return True
                    else:
                        self.log_test(
                            "DELETE /api/players/:id - Delete Player", 
                            False, 
                            f"HTTP {delete_response.status_code}: {delete_response.text}"
                        )
                        return False
                else:
                    self.log_test(
                        "POST /api/players - Create Player", 
                        False, 
                        "No ID returned in created player response"
                    )
                    return False
            elif response.status_code == 404:
                self.log_test(
                    "POST /api/players - Create Player", 
                    False, 
                    "Endpoint not found - players CRUD not implemented"
                )
                return False
            else:
                self.log_test(
                    "POST /api/players - Create Player", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST /api/players - Create Player", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_data_migration_safety(self):
        """Test if existing data is preserved and migration is safe"""
        print("🔍 Testing Data Migration Safety...")
        
        # Check if existing league-data still works
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code == 200:
                data = response.json()
                teams_in_league_data = data.get('teams', [])
                players_in_league_data = data.get('players', [])
                
                self.log_test(
                    "Legacy League Data Preservation", 
                    True, 
                    f"Legacy data preserved: {len(teams_in_league_data)} teams, {len(players_in_league_data)} players", 
                    {"teams_count": len(teams_in_league_data), "players_count": len(players_in_league_data)}
                )
                return True, data
            else:
                self.log_test(
                    "Legacy League Data Preservation", 
                    False, 
                    f"Legacy league-data endpoint failed: HTTP {response.status_code}"
                )
                return False, None
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Legacy League Data Preservation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_backup_functionality(self):
        """Test backup and restore capabilities"""
        print("🔍 Testing Backup/Restore Functionality...")
        
        # Test if backup endpoints exist
        try:
            response = requests.get(f"{self.api_base}/backup/teams", timeout=10)
            if response.status_code == 200:
                self.log_test(
                    "Teams Backup Endpoint", 
                    True, 
                    "Teams backup endpoint available", 
                    {"status": "available"}
                )
            elif response.status_code == 404:
                self.log_test(
                    "Teams Backup Endpoint", 
                    False, 
                    "Teams backup endpoint not implemented"
                )
            else:
                self.log_test(
                    "Teams Backup Endpoint", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Teams Backup Endpoint", 
                False, 
                f"Connection error: {str(e)}"
            )

        # Test players backup
        try:
            response = requests.get(f"{self.api_base}/backup/players", timeout=10)
            if response.status_code == 200:
                self.log_test(
                    "Players Backup Endpoint", 
                    True, 
                    "Players backup endpoint available", 
                    {"status": "available"}
                )
            elif response.status_code == 404:
                self.log_test(
                    "Players Backup Endpoint", 
                    False, 
                    "Players backup endpoint not implemented"
                )
            else:
                self.log_test(
                    "Players Backup Endpoint", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Players Backup Endpoint", 
                False, 
                f"Connection error: {str(e)}"
            )

    def test_data_validation(self):
        """Test data validation and error handling"""
        print("🔍 Testing Data Validation & Error Handling...")
        
        # Test invalid team data
        invalid_team = {"invalid_field": "test"}
        
        try:
            response = requests.post(
                f"{self.api_base}/teams", 
                json=invalid_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Teams Data Validation", 
                    True, 
                    "Properly rejected invalid team data", 
                    {"status_code": 400}
                )
            elif response.status_code == 404:
                self.log_test(
                    "Teams Data Validation", 
                    False, 
                    "Teams endpoint not implemented"
                )
            else:
                self.log_test(
                    "Teams Data Validation", 
                    False, 
                    f"Should reject invalid data but got HTTP {response.status_code}"
                )
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Teams Data Validation", 
                False, 
                f"Connection error: {str(e)}"
            )

    def run_comprehensive_test(self):
        """Run all teams and players database persistence tests"""
        print("🚀 Starting Comprehensive Teams & Players Database Persistence Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 80)
        
        # Test 1: Check if dedicated collections exist
        teams_exist, _ = self.test_dedicated_teams_endpoints()
        players_exist, _ = self.test_dedicated_players_endpoints()
        
        # Test 2: Test CRUD operations if endpoints exist
        if teams_exist:
            self.test_teams_crud_operations()
        
        if players_exist:
            self.test_players_crud_operations()
        
        # Test 3: Data migration and safety
        self.test_data_migration_safety()
        
        # Test 4: Backup functionality
        self.test_backup_functionality()
        
        # Test 5: Data validation
        self.test_data_validation()
        
        # Summary
        print("=" * 80)
        print("🎯 TEAMS & PLAYERS DATABASE PERSISTENCE TEST SUMMARY")
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
        
        # Critical assessment
        critical_features = [
            "GET /api/teams - Dedicated Teams Collection",
            "GET /api/players - Dedicated Players Collection", 
            "POST /api/teams - Create Team",
            "POST /api/players - Create Player"
        ]
        
        critical_failures = [t for t in self.failed_tests if any(cf in t for cf in critical_features)]
        
        print("\n" + "=" * 80)
        print("🔍 CRITICAL INFRASTRUCTURE ASSESSMENT")
        print("=" * 80)
        
        if len(critical_failures) == 0 and teams_exist and players_exist:
            print("✅ CRITICAL INFRASTRUCTURE IMPLEMENTED:")
            print("   - Dedicated MongoDB collections for teams and players")
            print("   - CRUD API endpoints working")
            print("   - Database persistence functional")
            return True
        else:
            print("❌ CRITICAL INFRASTRUCTURE MISSING:")
            if not teams_exist:
                print("   - Dedicated teams collection/endpoints NOT implemented")
            if not players_exist:
                print("   - Dedicated players collection/endpoints NOT implemented")
            if critical_failures:
                print("   - CRUD operations failing")
            print("\n⚠️  Current implementation still uses legacy league-data structure")
            print("   Teams and players are stored within single league_data collection")
            print("   This does NOT meet the review requirements for dedicated collections")
            return False

if __name__ == "__main__":
    try:
        tester = TeamsPlayersDBTester()
        success = tester.run_comprehensive_test()
        
        if success:
            print("\n🎉 Teams & Players database persistence infrastructure is properly implemented!")
            sys.exit(0)
        else:
            print("\n⚠️  Teams & Players database persistence infrastructure needs implementation.")
            print("   Review request requires dedicated MongoDB collections and CRUD endpoints.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)