#!/usr/bin/env python3
"""
Team Management Verification Test
Focused testing for team data operations after bug fixes
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

class TeamManagementTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing team management at: {self.api_base}")
        print("=" * 60)

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

    def test_get_current_teams(self):
        """Test retrieving current team data"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                
                self.log_test(
                    "GET Current Teams Data", 
                    True, 
                    f"Retrieved {len(teams)} teams from league data", 
                    f"Teams count: {len(teams)}"
                )
                return True, teams
            else:
                self.log_test(
                    "GET Current Teams Data", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET Current Teams Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_team_update_operations(self):
        """Test team update operations (add, edit, delete scenarios)"""
        try:
            # Create realistic team data for testing
            test_teams = [
                {
                    "id": "test_team_1",
                    "name": "Test Warriors",
                    "division": "Field",
                    "primaryColor": "#FF0000",
                    "secondaryColor": "#FFFFFF",
                    "wins": 5,
                    "losses": 3,
                    "coach": "Coach Smith",
                    "homeField": "Warriors Stadium"
                },
                {
                    "id": "test_team_2", 
                    "name": "Test Eagles",
                    "division": "Box",
                    "primaryColor": "#0000FF",
                    "secondaryColor": "#FFFF00",
                    "wins": 7,
                    "losses": 1,
                    "coach": "Coach Johnson",
                    "homeField": "Eagles Arena"
                }
            ]
            
            response = requests.post(
                f"{self.api_base}/league-data/teams", 
                json=test_teams,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'teams updated successfully':
                    self.log_test(
                        "POST Team Updates", 
                        True, 
                        f"Successfully updated teams data with {len(test_teams)} teams", 
                        {"message": data.get('message'), "teams_count": len(test_teams)}
                    )
                    return True, test_teams
                else:
                    self.log_test(
                        "POST Team Updates", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST Team Updates", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Team Updates", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_team_data_persistence(self):
        """Test that team data persists correctly after updates"""
        try:
            # First, update teams with test data
            success, test_teams = self.test_team_update_operations()
            if not success:
                return False
            
            # Wait a moment for database write
            time.sleep(1)
            
            # Retrieve the data to verify persistence
            success, retrieved_teams = self.test_get_current_teams()
            if not success:
                return False
            
            # Verify our test teams are in the retrieved data
            test_team_ids = {team['id'] for team in test_teams}
            retrieved_team_ids = {team.get('id') for team in retrieved_teams if team.get('id')}
            
            found_teams = test_team_ids.intersection(retrieved_team_ids)
            
            if len(found_teams) == len(test_teams):
                # Verify team details are correct
                for test_team in test_teams:
                    retrieved_team = next((t for t in retrieved_teams if t.get('id') == test_team['id']), None)
                    if retrieved_team:
                        # Check key fields
                        if (retrieved_team.get('name') == test_team['name'] and 
                            retrieved_team.get('division') == test_team['division']):
                            continue
                        else:
                            self.log_test(
                                "Team Data Persistence", 
                                False, 
                                f"Team data mismatch for {test_team['id']}"
                            )
                            return False
                
                self.log_test(
                    "Team Data Persistence", 
                    True, 
                    f"All {len(test_teams)} test teams persisted correctly with accurate data", 
                    f"Found teams: {list(found_teams)}"
                )
                return True
            else:
                missing_teams = test_team_ids - found_teams
                self.log_test(
                    "Team Data Persistence", 
                    False, 
                    f"Missing teams after persistence: {missing_teams}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Team Data Persistence", 
                False, 
                f"Error during persistence test: {str(e)}"
            )
            return False

    def test_team_editing_scenarios(self):
        """Test various team editing scenarios that were previously buggy"""
        try:
            # Get current teams first
            success, current_teams = self.test_get_current_teams()
            if not success:
                return False
            
            # Create a modified version of existing teams (simulating edits)
            if current_teams:
                modified_teams = []
                for i, team in enumerate(current_teams[:2]):  # Test with first 2 teams
                    modified_team = team.copy()
                    modified_team['name'] = f"Modified {team.get('name', 'Team')} {i+1}"
                    modified_team['wins'] = (team.get('wins', 0) + 1)  # Increment wins
                    modified_team['coach'] = f"Updated Coach {i+1}"
                    modified_teams.append(modified_team)
                
                # Update with modified data
                response = requests.post(
                    f"{self.api_base}/league-data/teams", 
                    json=modified_teams,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    # Verify the changes persisted
                    time.sleep(1)
                    success, updated_teams = self.test_get_current_teams()
                    if success:
                        # Check if modifications are present
                        modifications_found = 0
                        for modified_team in modified_teams:
                            for updated_team in updated_teams:
                                if (updated_team.get('id') == modified_team['id'] and 
                                    updated_team.get('name') == modified_team['name']):
                                    modifications_found += 1
                                    break
                        
                        if modifications_found == len(modified_teams):
                            self.log_test(
                                "Team Editing Scenarios", 
                                True, 
                                f"Successfully edited and persisted {len(modified_teams)} teams", 
                                f"Modified teams: {[t['name'] for t in modified_teams]}"
                            )
                            return True
                        else:
                            self.log_test(
                                "Team Editing Scenarios", 
                                False, 
                                f"Only {modifications_found}/{len(modified_teams)} modifications persisted"
                            )
                            return False
                    else:
                        return False
                else:
                    self.log_test(
                        "Team Editing Scenarios", 
                        False, 
                        f"HTTP {response.status_code}: {response.text}"
                    )
                    return False
            else:
                self.log_test(
                    "Team Editing Scenarios", 
                    True, 
                    "No existing teams to edit, but endpoint is functional"
                )
                return True
                
        except Exception as e:
            self.log_test(
                "Team Editing Scenarios", 
                False, 
                f"Error during editing test: {str(e)}"
            )
            return False

    def run_team_tests(self):
        """Run all team management tests"""
        print("Starting Team Management Verification Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 60)
        
        # Test team data retrieval
        self.test_get_current_teams()
        
        # Test team update operations
        self.test_team_update_operations()
        
        # Test data persistence
        self.test_team_data_persistence()
        
        # Test editing scenarios
        self.test_team_editing_scenarios()
        
        # Summary
        print("=" * 60)
        print("TEAM MANAGEMENT TEST SUMMARY")
        print("=" * 60)
        
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
        
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    try:
        tester = TeamManagementTester()
        success = tester.run_team_tests()
        
        if success:
            print("\n🎉 Team management tests completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some team management tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)