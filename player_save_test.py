#!/usr/bin/env python3
"""
CRITICAL PLAYER SAVE FUNCTIONALITY VERIFICATION TEST
Tests player loading, saving, and API endpoints after implementing protected player save function.

FOCUS AREAS:
1. Player Loading from API: Verify players load from `/api/players` endpoint
2. Player CRUD Operations: Test create, read, update, delete functionality  
3. League-Data Synchronization: Test `/api/league-data/players` endpoint saves
4. Player Model Validation: Test all fields (name, teamId, position, jerseyNumber, photoUrl, handedness, details)
5. Error Resolution: Verify no more 500 Internal Server Errors on player updates
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

class PlayerSaveTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        self.created_players = []  # Track created players for cleanup
        self.created_teams = []    # Track created teams for cleanup
        
        print(f"🎯 CRITICAL PLAYER SAVE FUNCTIONALITY VERIFICATION")
        print(f"Testing backend at: {self.api_base}")
        print("=" * 80)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            if isinstance(response_data, dict) and len(str(response_data)) > 200:
                print(f"    Response: [Large response - {len(str(response_data))} chars]")
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

    def test_backend_health(self):
        """Test basic backend connectivity"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "Backend Health Check", 
                        True, 
                        f"Backend is running and responsive", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Backend Health Check", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Backend Health Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Backend Health Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_player_loading_api(self):
        """Test 1: Player Loading from /api/players endpoint"""
        try:
            response = requests.get(f"{self.api_base}/players", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Player Loading API (/api/players)", 
                        True, 
                        f"Successfully loaded {len(data)} players from API", 
                        f"Players count: {len(data)}"
                    )
                    return True, data
                else:
                    self.log_test(
                        "Player Loading API (/api/players)", 
                        False, 
                        f"Expected list, got: {type(data)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Player Loading API (/api/players)", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Player Loading API (/api/players)", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def create_test_team(self):
        """Create a test team for player testing"""
        try:
            test_team = {
                "id": f"test_team_{int(time.time())}",
                "name": "Player Test Team",
                "division": "Field",
                "coach": "Test Coach",
                "homeField": "Test Field",
                "logo": "",
                "contactEmail": "test@example.com",
                "active": True,
                "wins": 0,
                "losses": 0,
                "ties": 0,
                "style": {
                    "primaryColor": "#1e40af",
                    "backgroundColor": "#dbeafe",
                    "accentColor": "#3b82f6",
                    "logoUrl": "",
                    "logoOpacity": 1.0,
                    "bannerUrl": ""
                }
            }
            
            response = requests.post(
                f"{self.api_base}/teams", 
                json=test_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                created_team = response.json()
                self.created_teams.append(created_team['id'])
                return True, created_team
            else:
                return False, None
                
        except Exception as e:
            return False, None

    def test_player_create_operation(self):
        """Test 2: Player CREATE operation with full model validation"""
        try:
            # First create a test team
            team_success, test_team = self.create_test_team()
            if not team_success:
                self.log_test(
                    "Player CREATE Operation", 
                    False, 
                    "Could not create test team for player"
                )
                return False, None
            
            # Create comprehensive test player with all fields
            test_player = {
                "id": f"test_player_{int(time.time())}",
                "name": "Johnny Lacrosse Player",
                "teamId": test_team['id'],
                "position": "Midfielder",
                "jerseyNumber": 42,
                "email": "johnny@lacrosse.com",
                "phone": "555-0123",
                "handedness": "Right",
                "details": "Experienced midfielder with strong stick skills",
                "photoUrl": "https://example.com/player-photo.jpg",
                "active": True
            }
            
            response = requests.post(
                f"{self.api_base}/players", 
                json=test_player,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                created_player = response.json()
                self.created_players.append(created_player['id'])
                
                # Validate all fields were saved correctly
                required_fields = ['id', 'name', 'teamId', 'position', 'jerseyNumber', 'email', 'phone', 'handedness', 'details', 'photoUrl', 'active']
                missing_fields = [field for field in required_fields if field not in created_player]
                
                if not missing_fields:
                    # Validate field values
                    field_validation = []
                    if created_player['name'] != test_player['name']:
                        field_validation.append(f"name mismatch: {created_player['name']} != {test_player['name']}")
                    if created_player['teamId'] != test_player['teamId']:
                        field_validation.append(f"teamId mismatch: {created_player['teamId']} != {test_player['teamId']}")
                    if created_player['position'] != test_player['position']:
                        field_validation.append(f"position mismatch: {created_player['position']} != {test_player['position']}")
                    if created_player['jerseyNumber'] != test_player['jerseyNumber']:
                        field_validation.append(f"jerseyNumber mismatch: {created_player['jerseyNumber']} != {test_player['jerseyNumber']}")
                    if created_player['handedness'] != test_player['handedness']:
                        field_validation.append(f"handedness mismatch: {created_player['handedness']} != {test_player['handedness']}")
                    
                    if not field_validation:
                        self.log_test(
                            "Player CREATE Operation", 
                            True, 
                            f"Player created successfully with all fields validated", 
                            {
                                "id": created_player['id'],
                                "name": created_player['name'],
                                "teamId": created_player['teamId'],
                                "position": created_player['position'],
                                "jerseyNumber": created_player['jerseyNumber'],
                                "handedness": created_player['handedness']
                            }
                        )
                        return True, created_player
                    else:
                        self.log_test(
                            "Player CREATE Operation", 
                            False, 
                            f"Field validation errors: {'; '.join(field_validation)}"
                        )
                        return False, None
                else:
                    self.log_test(
                        "Player CREATE Operation", 
                        False, 
                        f"Missing required fields: {missing_fields}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Player CREATE Operation", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Player CREATE Operation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_player_read_operation(self, player_id):
        """Test 3: Player READ operation"""
        try:
            response = requests.get(f"{self.api_base}/players", timeout=10)
            
            if response.status_code == 200:
                players = response.json()
                found_player = None
                
                for player in players:
                    if player.get('id') == player_id:
                        found_player = player
                        break
                
                if found_player:
                    self.log_test(
                        "Player READ Operation", 
                        True, 
                        f"Player retrieved successfully", 
                        {
                            "id": found_player['id'],
                            "name": found_player['name'],
                            "teamId": found_player['teamId']
                        }
                    )
                    return True, found_player
                else:
                    self.log_test(
                        "Player READ Operation", 
                        False, 
                        f"Player with ID {player_id} not found in API response"
                    )
                    return False, None
            else:
                self.log_test(
                    "Player READ Operation", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Player READ Operation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_player_update_operation(self, player_id, original_player):
        """Test 4: Player UPDATE operation - Critical for 500 error resolution"""
        try:
            # Update player with new data
            updated_data = original_player.copy()
            updated_data['name'] = "Updated Johnny Lacrosse"
            updated_data['position'] = "Attack"
            updated_data['jerseyNumber'] = 99
            updated_data['handedness'] = "Left"
            updated_data['details'] = "Updated player details - testing 500 error fix"
            
            response = requests.put(
                f"{self.api_base}/players/{player_id}", 
                json=updated_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                updated_player = response.json()
                
                # Validate updates were applied
                validation_errors = []
                if updated_player['name'] != updated_data['name']:
                    validation_errors.append(f"name not updated: {updated_player['name']} != {updated_data['name']}")
                if updated_player['position'] != updated_data['position']:
                    validation_errors.append(f"position not updated: {updated_player['position']} != {updated_data['position']}")
                if updated_player['jerseyNumber'] != updated_data['jerseyNumber']:
                    validation_errors.append(f"jerseyNumber not updated: {updated_player['jerseyNumber']} != {updated_data['jerseyNumber']}")
                if updated_player['handedness'] != updated_data['handedness']:
                    validation_errors.append(f"handedness not updated: {updated_player['handedness']} != {updated_data['handedness']}")
                
                if not validation_errors:
                    self.log_test(
                        "Player UPDATE Operation (500 Error Fix)", 
                        True, 
                        f"Player updated successfully - NO 500 errors encountered", 
                        {
                            "id": updated_player['id'],
                            "name": updated_player['name'],
                            "position": updated_player['position'],
                            "jerseyNumber": updated_player['jerseyNumber'],
                            "handedness": updated_player['handedness']
                        }
                    )
                    return True, updated_player
                else:
                    self.log_test(
                        "Player UPDATE Operation (500 Error Fix)", 
                        False, 
                        f"Update validation errors: {'; '.join(validation_errors)}"
                    )
                    return False, None
            else:
                # This is the critical test - we should NOT get 500 errors
                if response.status_code == 500:
                    self.log_test(
                        "Player UPDATE Operation (500 Error Fix)", 
                        False, 
                        f"❌ CRITICAL: 500 Internal Server Error still occurring on player update! Response: {response.text}"
                    )
                else:
                    self.log_test(
                        "Player UPDATE Operation (500 Error Fix)", 
                        False, 
                        f"HTTP {response.status_code}: {response.text}"
                    )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Player UPDATE Operation (500 Error Fix)", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_league_data_players_sync(self):
        """Test 5: League-Data Synchronization via /api/league-data/players endpoint"""
        try:
            # Create test players data for synchronization
            test_players = [
                {
                    "id": f"sync_player_1_{int(time.time())}",
                    "name": "Sync Test Player 1",
                    "teamId": "test_team_sync",
                    "position": "Defense",
                    "jerseyNumber": 10,
                    "handedness": "Right",
                    "details": "Player for sync testing",
                    "active": True
                },
                {
                    "id": f"sync_player_2_{int(time.time())}",
                    "name": "Sync Test Player 2", 
                    "teamId": "test_team_sync",
                    "position": "Goalie",
                    "jerseyNumber": 1,
                    "handedness": "Left",
                    "details": "Goalie for sync testing",
                    "active": True
                }
            ]
            
            # Test the league-data players endpoint
            response = requests.post(
                f"{self.api_base}/league-data/players", 
                json=test_players,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'players updated successfully':
                    # Verify the data was saved by retrieving league data
                    time.sleep(1)  # Wait for database write
                    
                    league_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    if league_response.status_code == 200:
                        league_data = league_response.json()
                        saved_players = league_data.get('players', [])
                        
                        # Check if our test players are in the saved data
                        sync_player_1_found = any(p.get('id') == test_players[0]['id'] for p in saved_players)
                        sync_player_2_found = any(p.get('id') == test_players[1]['id'] for p in saved_players)
                        
                        if sync_player_1_found and sync_player_2_found:
                            self.log_test(
                                "League-Data Players Synchronization", 
                                True, 
                                f"Players successfully synchronized via /api/league-data/players endpoint", 
                                {
                                    "players_synced": len(test_players),
                                    "total_players_in_league": len(saved_players)
                                }
                            )
                            return True
                        else:
                            self.log_test(
                                "League-Data Players Synchronization", 
                                False, 
                                f"Test players not found in league data after sync"
                            )
                            return False
                    else:
                        self.log_test(
                            "League-Data Players Synchronization", 
                            False, 
                            f"Could not verify sync - league data retrieval failed: HTTP {league_response.status_code}"
                        )
                        return False
                else:
                    self.log_test(
                        "League-Data Players Synchronization", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "League-Data Players Synchronization", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "League-Data Players Synchronization", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_player_delete_operation(self, player_id):
        """Test 6: Player DELETE operation"""
        try:
            response = requests.delete(f"{self.api_base}/players/{player_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'Player deleted successfully':
                    # Verify player was actually deleted
                    time.sleep(1)  # Wait for database write
                    
                    verify_response = requests.get(f"{self.api_base}/players", timeout=10)
                    if verify_response.status_code == 200:
                        players = verify_response.json()
                        deleted_player_found = any(p.get('id') == player_id for p in players)
                        
                        if not deleted_player_found:
                            self.log_test(
                                "Player DELETE Operation", 
                                True, 
                                f"Player deleted successfully and verified", 
                                {"deleted_player_id": player_id}
                            )
                            return True
                        else:
                            self.log_test(
                                "Player DELETE Operation", 
                                False, 
                                f"Player still exists after delete operation"
                            )
                            return False
                    else:
                        self.log_test(
                            "Player DELETE Operation", 
                            False, 
                            f"Could not verify deletion - players retrieval failed"
                        )
                        return False
                else:
                    self.log_test(
                        "Player DELETE Operation", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Player DELETE Operation", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Player DELETE Operation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("🧹 Cleaning up test data...")
        
        # Clean up players
        for player_id in self.created_players:
            try:
                requests.delete(f"{self.api_base}/players/{player_id}", timeout=5)
            except:
                pass
        
        # Clean up teams
        for team_id in self.created_teams:
            try:
                requests.delete(f"{self.api_base}/teams/{team_id}", timeout=5)
            except:
                pass
        
        print(f"Cleaned up {len(self.created_players)} players and {len(self.created_teams)} teams")

    def run_critical_player_tests(self):
        """Run all critical player save functionality tests"""
        print("🚀 Starting Critical Player Save Functionality Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 80)
        
        # Test 1: Backend Health
        if not self.test_backend_health():
            print("❌ CRITICAL: Backend health check failed. Cannot proceed with player tests.")
            return False
        
        # Test 2: Player Loading API
        success, initial_players = self.test_player_loading_api()
        if not success:
            print("❌ CRITICAL: Player loading API failed.")
            return False
        
        # Test 3: Player CREATE Operation
        success, created_player = self.test_player_create_operation()
        if not success:
            print("❌ CRITICAL: Player CREATE operation failed.")
            return False
        
        # Test 4: Player READ Operation
        success, read_player = self.test_player_read_operation(created_player['id'])
        if not success:
            print("❌ CRITICAL: Player READ operation failed.")
            return False
        
        # Test 5: Player UPDATE Operation (Critical for 500 error fix)
        success, updated_player = self.test_player_update_operation(created_player['id'], created_player)
        if not success:
            print("❌ CRITICAL: Player UPDATE operation failed - 500 error fix may not be working!")
            return False
        
        # Test 6: League-Data Synchronization
        success = self.test_league_data_players_sync()
        if not success:
            print("⚠️  WARNING: League-Data synchronization failed.")
        
        # Test 7: Player DELETE Operation
        success = self.test_player_delete_operation(created_player['id'])
        if success:
            # Remove from cleanup list since it was successfully deleted
            if created_player['id'] in self.created_players:
                self.created_players.remove(created_player['id'])
        
        # Summary
        print("=" * 80)
        print("🎯 CRITICAL PLAYER SAVE FUNCTIONALITY TEST SUMMARY")
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
        
        # Check for critical failures
        critical_failures = [t for t in self.failed_tests if any(keyword in t for keyword in ['CREATE', 'UPDATE', '500 Error', 'Backend Health'])]
        
        if critical_failures:
            print(f"\n🚨 CRITICAL FAILURES DETECTED:")
            for test in critical_failures:
                print(f"  - {test}")
            print("\n❌ PLAYER SAVE FUNCTIONALITY IS NOT WORKING CORRECTLY!")
            return False
        else:
            print(f"\n✅ ALL CRITICAL PLAYER SAVE TESTS PASSED!")
            print("✅ No 500 Internal Server Errors detected on player updates")
            print("✅ Player CRUD operations working correctly")
            print("✅ Protected save function appears to be working")
            return True

if __name__ == "__main__":
    try:
        tester = PlayerSaveTester()
        success = tester.run_critical_player_tests()
        
        # Always cleanup test data
        tester.cleanup_test_data()
        
        if success:
            print("\n🎉 CRITICAL PLAYER SAVE FUNCTIONALITY VERIFICATION COMPLETED SUCCESSFULLY!")
            print("✅ Player save operations work without 500 errors")
            print("✅ Players persist correctly through all CRUD operations")
            sys.exit(0)
        else:
            print("\n⚠️  CRITICAL PLAYER SAVE FUNCTIONALITY ISSUES DETECTED!")
            print("❌ Review the failed tests above for specific issues")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)