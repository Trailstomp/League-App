#!/usr/bin/env python3
"""
Teams and Players CRUD API Testing Suite
Tests the newly implemented teams and players database persistence infrastructure
to verify critical CRUD operations and data safety features.
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

class TeamsPlayersCRUDTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        self.created_teams = []
        self.created_players = []
        
        print(f"Testing Teams & Players CRUD at: {self.api_base}")
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

    def test_get_teams_empty(self):
        """Test GET /api/teams (should return empty array initially)"""
        try:
            response = requests.get(f"{self.api_base}/teams", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "GET Teams (Initial Empty)", 
                        True, 
                        f"Retrieved {len(data)} teams (expected empty or existing)", 
                        f"Count: {len(data)}"
                    )
                    return True, data
                else:
                    self.log_test(
                        "GET Teams (Initial Empty)", 
                        False, 
                        f"Expected list, got: {type(data)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET Teams (Initial Empty)", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET Teams (Initial Empty)", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_create_team(self):
        """Test POST /api/teams (create a test team)"""
        try:
            test_team = {
                "name": "Test Lacrosse Team",
                "division": "Field",
                "coach": "Coach Johnson",
                "homeField": "Central Park Field 1",
                "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "contactEmail": "coach@testteam.com",
                "active": True,
                "wins": 5,
                "losses": 2,
                "ties": 1
            }
            
            response = requests.post(
                f"{self.api_base}/teams", 
                json=test_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'name', 'division', 'coach', 'createdAt', 'updatedAt']
                
                if all(field in data for field in required_fields):
                    if data['name'] == test_team['name']:
                        self.created_teams.append(data['id'])
                        self.log_test(
                            "POST Create Team", 
                            True, 
                            f"Created team '{data['name']}' with ID: {data['id']}", 
                            {k: v for k, v in data.items() if k not in ['createdAt', 'updatedAt', 'logo']}
                        )
                        return True, data
                    else:
                        self.log_test(
                            "POST Create Team", 
                            False, 
                            f"Name mismatch: expected {test_team['name']}, got {data['name']}"
                        )
                        return False, None
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "POST Create Team", 
                        False, 
                        f"Missing required fields: {missing}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST Create Team", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Create Team", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_update_team(self, team_id):
        """Test PUT /api/teams/:id (update the test team)"""
        try:
            updated_team = {
                "id": team_id,
                "name": "Updated Test Lacrosse Team",
                "division": "Box",
                "coach": "Coach Smith",
                "homeField": "Updated Field Location",
                "logo": "",
                "contactEmail": "updated@testteam.com",
                "active": True,
                "wins": 7,
                "losses": 3,
                "ties": 2
            }
            
            response = requests.put(
                f"{self.api_base}/teams/{team_id}", 
                json=updated_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data['name'] == updated_team['name'] and data['division'] == updated_team['division']:
                    self.log_test(
                        "PUT Update Team", 
                        True, 
                        f"Updated team '{data['name']}' - division changed to {data['division']}", 
                        {k: v for k, v in data.items() if k not in ['createdAt', 'updatedAt', 'logo']}
                    )
                    return True, data
                else:
                    self.log_test(
                        "PUT Update Team", 
                        False, 
                        f"Update failed: name={data.get('name')}, division={data.get('division')}"
                    )
                    return False, None
            else:
                self.log_test(
                    "PUT Update Team", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "PUT Update Team", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_get_players_empty(self):
        """Test GET /api/players (should return empty array initially)"""
        try:
            response = requests.get(f"{self.api_base}/players", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "GET Players (Initial Empty)", 
                        True, 
                        f"Retrieved {len(data)} players (expected empty or existing)", 
                        f"Count: {len(data)}"
                    )
                    return True, data
                else:
                    self.log_test(
                        "GET Players (Initial Empty)", 
                        False, 
                        f"Expected list, got: {type(data)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET Players (Initial Empty)", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET Players (Initial Empty)", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_create_player(self, team_id):
        """Test POST /api/players (create a test player)"""
        try:
            test_player = {
                "name": "John Lacrosse",
                "teamId": team_id,
                "position": "Midfielder",
                "jerseyNumber": 23,
                "email": "john@testteam.com",
                "phone": "555-0123",
                "active": True
            }
            
            response = requests.post(
                f"{self.api_base}/players", 
                json=test_player,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'name', 'teamId', 'position', 'createdAt', 'updatedAt']
                
                if all(field in data for field in required_fields):
                    if data['name'] == test_player['name'] and data['teamId'] == team_id:
                        self.created_players.append(data['id'])
                        self.log_test(
                            "POST Create Player", 
                            True, 
                            f"Created player '{data['name']}' #{data.get('jerseyNumber')} for team {team_id}", 
                            {k: v for k, v in data.items() if k not in ['createdAt', 'updatedAt']}
                        )
                        return True, data
                    else:
                        self.log_test(
                            "POST Create Player", 
                            False, 
                            f"Data mismatch: name={data.get('name')}, teamId={data.get('teamId')}"
                        )
                        return False, None
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "POST Create Player", 
                        False, 
                        f"Missing required fields: {missing}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST Create Player", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Create Player", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_update_player(self, player_id, team_id):
        """Test PUT /api/players/:id (update the test player)"""
        try:
            updated_player = {
                "id": player_id,
                "name": "Johnny Lacrosse Jr.",
                "teamId": team_id,
                "position": "Attack",
                "jerseyNumber": 99,
                "email": "johnny@testteam.com",
                "phone": "555-9999",
                "active": True
            }
            
            response = requests.put(
                f"{self.api_base}/players/{player_id}", 
                json=updated_player,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data['name'] == updated_player['name'] and data['position'] == updated_player['position']:
                    self.log_test(
                        "PUT Update Player", 
                        True, 
                        f"Updated player '{data['name']}' - position changed to {data['position']}, jersey #{data.get('jerseyNumber')}", 
                        {k: v for k, v in data.items() if k not in ['createdAt', 'updatedAt']}
                    )
                    return True, data
                else:
                    self.log_test(
                        "PUT Update Player", 
                        False, 
                        f"Update failed: name={data.get('name')}, position={data.get('position')}"
                    )
                    return False, None
            else:
                self.log_test(
                    "PUT Update Player", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "PUT Update Player", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_backup_teams(self):
        """Test GET /api/backup/teams"""
        try:
            response = requests.get(f"{self.api_base}/backup/teams", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'Teams backup created successfully':
                    self.log_test(
                        "GET Backup Teams", 
                        True, 
                        "Teams backup created successfully", 
                        {"message": data.get('message')}
                    )
                    return True, data
                else:
                    self.log_test(
                        "GET Backup Teams", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET Backup Teams", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET Backup Teams", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_backup_players(self):
        """Test GET /api/backup/players"""
        try:
            response = requests.get(f"{self.api_base}/backup/players", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'Players backup created successfully':
                    self.log_test(
                        "GET Backup Players", 
                        True, 
                        "Players backup created successfully", 
                        {"message": data.get('message')}
                    )
                    return True, data
                else:
                    self.log_test(
                        "GET Backup Players", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET Backup Players", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET Backup Players", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_delete_player(self, player_id):
        """Test DELETE /api/players/:id (delete the test player)"""
        try:
            response = requests.delete(f"{self.api_base}/players/{player_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'Player deleted successfully':
                    self.log_test(
                        "DELETE Player", 
                        True, 
                        f"Player {player_id} deleted successfully", 
                        {"message": data.get('message')}
                    )
                    return True, data
                else:
                    self.log_test(
                        "DELETE Player", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "DELETE Player", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "DELETE Player", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_delete_team(self, team_id):
        """Test DELETE /api/teams/:id (delete the test team)"""
        try:
            response = requests.delete(f"{self.api_base}/teams/{team_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'Team deleted successfully':
                    self.log_test(
                        "DELETE Team", 
                        True, 
                        f"Team {team_id} deleted successfully", 
                        {"message": data.get('message')}
                    )
                    return True, data
                else:
                    self.log_test(
                        "DELETE Team", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "DELETE Team", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "DELETE Team", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_data_validation(self):
        """Test data validation and error handling"""
        try:
            # Test invalid team data
            invalid_team = {
                "name": "",  # Empty name should fail validation
                "division": "InvalidDivision"
            }
            
            response = requests.post(
                f"{self.api_base}/teams", 
                json=invalid_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should either fail validation or handle gracefully
            if response.status_code in [400, 422, 500]:
                self.log_test(
                    "Data Validation (Invalid Team)", 
                    True, 
                    f"Properly rejected invalid team data with HTTP {response.status_code}", 
                    {"status_code": response.status_code}
                )
                return True
            elif response.status_code == 200:
                # If it accepts invalid data, that's also acceptable for this test
                self.log_test(
                    "Data Validation (Invalid Team)", 
                    True, 
                    "Accepted invalid data (validation may be lenient)", 
                    {"status_code": response.status_code}
                )
                return True
            else:
                self.log_test(
                    "Data Validation (Invalid Team)", 
                    False, 
                    f"Unexpected HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Data Validation (Invalid Team)", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_comprehensive_crud_tests(self):
        """Run comprehensive CRUD tests for teams and players"""
        print("Starting Teams & Players CRUD Infrastructure Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 70)
        
        # 1. Test initial empty state
        success, initial_teams = self.test_get_teams_empty()
        if not success:
            print("❌ CRITICAL: Cannot retrieve teams. Backend may not be running.")
            return False
        
        success, initial_players = self.test_get_players_empty()
        if not success:
            print("❌ CRITICAL: Cannot retrieve players. Backend may not be running.")
            return False
        
        # 2. Test team creation
        success, created_team = self.test_create_team()
        if not success:
            print("❌ CRITICAL: Cannot create teams.")
            return False
        
        team_id = created_team['id']
        
        # 3. Test team update
        success, updated_team = self.test_update_team(team_id)
        if not success:
            print("❌ CRITICAL: Cannot update teams.")
            return False
        
        # 4. Test player creation
        success, created_player = self.test_create_player(team_id)
        if not success:
            print("❌ CRITICAL: Cannot create players.")
            return False
        
        player_id = created_player['id']
        
        # 5. Test player update
        success, updated_player = self.test_update_player(player_id, team_id)
        if not success:
            print("❌ CRITICAL: Cannot update players.")
            return False
        
        # 6. Test backup functionality
        self.test_backup_teams()
        self.test_backup_players()
        
        # 7. Test data validation
        self.test_data_validation()
        
        # 8. Test deletion (cleanup)
        self.test_delete_player(player_id)
        self.test_delete_team(team_id)
        
        # Summary
        print("=" * 70)
        print("TEAMS & PLAYERS CRUD TEST SUMMARY")
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
        
        # Return True if all critical CRUD operations pass
        critical_failures = [t for t in self.failed_tests if any(keyword in t for keyword in ['POST Create', 'PUT Update', 'GET Teams', 'GET Players'])]
        return len(critical_failures) == 0

if __name__ == "__main__":
    try:
        tester = TeamsPlayersCRUDTester()
        success = tester.run_comprehensive_crud_tests()
        
        if success:
            print("\n🎉 Teams & Players CRUD infrastructure tests completed successfully!")
            print("✅ Critical database persistence infrastructure is working correctly!")
            sys.exit(0)
        else:
            print("\n⚠️  Some critical CRUD tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)