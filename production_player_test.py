#!/usr/bin/env python3
"""
PRODUCTION PLAYER SAVE FUNCTIONALITY VERIFICATION TEST
Tests player endpoints on both development and production environments.
"""

import requests
import json
import sys
from datetime import datetime
import time

class ProductionPlayerTester:
    def __init__(self):
        # Test both development and production URLs
        self.environments = {
            "Development": "https://lax-league-portal.preview.emergentagent.com/api",
            "Production": "https://team-lax-portal.emergent.host/api"
        }
        self.test_results = []
        
        print(f"🌐 PRODUCTION PLAYER SAVE FUNCTIONALITY VERIFICATION")
        print("=" * 80)

    def log_test(self, env_name, test_name, success, message=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} [{env_name}] {test_name}")
        if message:
            print(f"    {message}")
        
        self.test_results.append({
            'environment': env_name,
            'test': test_name,
            'success': success,
            'message': message
        })
        print()

    def test_environment_player_endpoints(self, env_name, api_base):
        """Test player endpoints for a specific environment"""
        print(f"🔍 Testing {env_name} Environment: {api_base}")
        print("-" * 60)
        
        # Test 1: Backend Health
        try:
            response = requests.get(f"{api_base}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(env_name, "Backend Health", True, "Backend is responsive")
                else:
                    self.log_test(env_name, "Backend Health", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test(env_name, "Backend Health", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test(env_name, "Backend Health", False, f"Connection error: {str(e)}")
            return False
        
        # Test 2: Player Loading
        try:
            response = requests.get(f"{api_base}/players", timeout=10)
            if response.status_code == 200:
                players = response.json()
                if isinstance(players, list):
                    self.log_test(env_name, "Player Loading", True, f"Loaded {len(players)} players")
                else:
                    self.log_test(env_name, "Player Loading", False, f"Expected list, got {type(players)}")
                    return False
            else:
                self.log_test(env_name, "Player Loading", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test(env_name, "Player Loading", False, f"Connection error: {str(e)}")
            return False
        
        # Test 3: League Data Players Endpoint
        try:
            response = requests.get(f"{api_base}/league-data", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'players' in data:
                    self.log_test(env_name, "League Data Players", True, f"League data contains {len(data.get('players', []))} players")
                else:
                    self.log_test(env_name, "League Data Players", False, "No players field in league data")
                    return False
            else:
                self.log_test(env_name, "League Data Players", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test(env_name, "League Data Players", False, f"Connection error: {str(e)}")
            return False
        
        # Test 4: Quick Player Create/Update/Delete Test (if possible)
        try:
            # Create a minimal test player
            test_player = {
                "id": f"prod_test_{int(time.time())}",
                "name": "Production Test Player",
                "teamId": "test_team_prod",
                "position": "Test",
                "active": True
            }
            
            create_response = requests.post(
                f"{api_base}/players", 
                json=test_player,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if create_response.status_code == 200:
                created_player = create_response.json()
                player_id = created_player['id']
                
                # Test update (critical for 500 error verification)
                updated_data = created_player.copy()
                updated_data['name'] = "Updated Production Test Player"
                
                update_response = requests.put(
                    f"{api_base}/players/{player_id}", 
                    json=updated_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if update_response.status_code == 200:
                    self.log_test(env_name, "Player Update (500 Error Check)", True, "Player updated without 500 errors")
                    
                    # Clean up - delete the test player
                    delete_response = requests.delete(f"{api_base}/players/{player_id}", timeout=10)
                    if delete_response.status_code == 200:
                        self.log_test(env_name, "Player CRUD Test", True, "Full CRUD cycle completed successfully")
                    else:
                        self.log_test(env_name, "Player CRUD Test", False, f"Delete failed: HTTP {delete_response.status_code}")
                elif update_response.status_code == 500:
                    self.log_test(env_name, "Player Update (500 Error Check)", False, "❌ CRITICAL: 500 Internal Server Error on player update!")
                    return False
                else:
                    self.log_test(env_name, "Player Update (500 Error Check)", False, f"Update failed: HTTP {update_response.status_code}")
                    return False
            else:
                self.log_test(env_name, "Player CRUD Test", False, f"Create failed: HTTP {create_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(env_name, "Player CRUD Test", False, f"CRUD test error: {str(e)}")
            return False
        
        return True

    def run_production_tests(self):
        """Run tests on both development and production environments"""
        print("🚀 Starting Production Player Save Functionality Tests...")
        print("=" * 80)
        
        environment_results = {}
        
        for env_name, api_base in self.environments.items():
            success = self.test_environment_player_endpoints(env_name, api_base)
            environment_results[env_name] = success
            print()
        
        # Summary
        print("=" * 80)
        print("🌐 PRODUCTION PLAYER SAVE FUNCTIONALITY TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        # Environment-specific results
        print(f"\nEnvironment Results:")
        for env_name, success in environment_results.items():
            status = "✅ WORKING" if success else "❌ ISSUES"
            print(f"  {env_name}: {status}")
        
        if failed_tests > 0:
            print(f"\n❌ Failed Tests:")
            for test in self.test_results:
                if not test['success']:
                    print(f"  - [{test['environment']}] {test['test']}: {test['message']}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nOverall Success Rate: {success_rate:.1f}%")
        
        # Check for critical 500 errors
        critical_500_errors = [t for t in self.test_results if not t['success'] and '500' in t['message']]
        
        if critical_500_errors:
            print(f"\n🚨 CRITICAL 500 ERRORS DETECTED:")
            for test in critical_500_errors:
                print(f"  - [{test['environment']}] {test['test']}")
            return False
        
        # Check if at least one environment is working
        working_environments = [env for env, success in environment_results.items() if success]
        
        if working_environments:
            print(f"\n✅ PLAYER SAVE FUNCTIONALITY WORKING ON: {', '.join(working_environments)}")
            return True
        else:
            print(f"\n❌ PLAYER SAVE FUNCTIONALITY NOT WORKING ON ANY ENVIRONMENT!")
            return False

if __name__ == "__main__":
    try:
        tester = ProductionPlayerTester()
        success = tester.run_production_tests()
        
        if success:
            print("\n🎉 PRODUCTION PLAYER SAVE FUNCTIONALITY VERIFICATION COMPLETED!")
            print("✅ Player endpoints are working correctly")
            print("✅ No 500 Internal Server Errors detected")
            sys.exit(0)
        else:
            print("\n⚠️  PRODUCTION PLAYER SAVE FUNCTIONALITY ISSUES DETECTED!")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)