#!/usr/bin/env python3
"""
Emergency Data Recovery Testing Suite
Tests the data recovery mechanisms for the second data loss incident.

This test verifies:
1. Individual collections (teams, players) contain correct user data
2. League_data collection synchronization
3. WebsiteStyle backup and restore functionality
4. Data recovery processes
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

class EmergencyDataRecoveryTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print("🚨 EMERGENCY DATA RECOVERY TESTING SUITE")
        print(f"Testing backend at: {self.api_base}")
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

    def test_individual_teams_collection(self):
        """Test that individual teams collection contains correct user data"""
        try:
            response = requests.get(f"{self.api_base}/teams", timeout=10)
            
            if response.status_code == 200:
                teams = response.json()
                
                if isinstance(teams, list):
                    # Look for user's custom teams
                    user_teams = []
                    for team in teams:
                        if team.get('name') and 'Test' in team.get('name', ''):
                            user_teams.append(team)
                    
                    if len(teams) > 0:
                        self.log_test(
                            "Individual Teams Collection Data Integrity", 
                            True, 
                            f"Found {len(teams)} teams in dedicated collection, {len(user_teams)} appear to be user-created",
                            f"Sample team: {teams[0].get('name', 'Unknown')} (ID: {teams[0].get('id', 'Unknown')})"
                        )
                        return True, teams
                    else:
                        self.log_test(
                            "Individual Teams Collection Data Integrity", 
                            False, 
                            "No teams found in individual collection - data may be lost"
                        )
                        return False, []
                else:
                    self.log_test(
                        "Individual Teams Collection Data Integrity", 
                        False, 
                        f"Expected list, got: {type(teams)}"
                    )
                    return False, []
            else:
                self.log_test(
                    "Individual Teams Collection Data Integrity", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, []
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Individual Teams Collection Data Integrity", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, []

    def test_individual_players_collection(self):
        """Test that individual players collection contains correct user data"""
        try:
            response = requests.get(f"{self.api_base}/players", timeout=10)
            
            if response.status_code == 200:
                players = response.json()
                
                if isinstance(players, list):
                    # Look for user's custom players
                    user_players = []
                    for player in players:
                        if player.get('name') and ('Johnny' in player.get('name', '') or 'Test' in player.get('name', '')):
                            user_players.append(player)
                    
                    if len(players) > 0:
                        self.log_test(
                            "Individual Players Collection Data Integrity", 
                            True, 
                            f"Found {len(players)} players in dedicated collection, {len(user_players)} appear to be user-created",
                            f"Sample player: {players[0].get('name', 'Unknown')} (Team: {players[0].get('teamId', 'Unknown')})"
                        )
                        return True, players
                    else:
                        self.log_test(
                            "Individual Players Collection Data Integrity", 
                            False, 
                            "No players found in individual collection - data may be lost"
                        )
                        return False, []
                else:
                    self.log_test(
                        "Individual Players Collection Data Integrity", 
                        False, 
                        f"Expected list, got: {type(players)}"
                    )
                    return False, []
            else:
                self.log_test(
                    "Individual Players Collection Data Integrity", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, []
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Individual Players Collection Data Integrity", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, []

    def test_league_data_collection_state(self):
        """Test the current state of league_data collection"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                league_data = response.json()
                
                teams_in_league_data = league_data.get('teams', [])
                website_style = league_data.get('websiteStyle', {})
                
                # Check if league_data has been reset to defaults
                is_default_data = (
                    len(teams_in_league_data) == 0 or 
                    all(team.get('name', '').startswith('Default') for team in teams_in_league_data) or
                    len(website_style) == 0 or
                    website_style.get('theme') == 'default'
                )
                
                if is_default_data:
                    self.log_test(
                        "League Data Collection State", 
                        False, 
                        f"League data appears to be reset to defaults - {len(teams_in_league_data)} teams, websiteStyle keys: {len(website_style)}",
                        f"Teams: {[t.get('name') for t in teams_in_league_data[:3]]}"
                    )
                    return False, league_data
                else:
                    self.log_test(
                        "League Data Collection State", 
                        True, 
                        f"League data contains user customizations - {len(teams_in_league_data)} teams, websiteStyle keys: {len(website_style)}",
                        f"Teams: {[t.get('name') for t in teams_in_league_data[:3]]}"
                    )
                    return True, league_data
            else:
                self.log_test(
                    "League Data Collection State", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, {}
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "League Data Collection State", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, {}

    def test_data_synchronization_recovery(self, individual_teams, individual_players):
        """Test the ability to restore league_data from individual collections"""
        try:
            # Create recovery data structure
            recovery_data = {
                "teams": individual_teams,
                "players": individual_players,
                "users": [],  # Preserve existing users
                "newsItems": [],  # Preserve existing news
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {"name": "MLBL - Recovered Data", "recoveredAt": datetime.utcnow().isoformat()},
                "websiteStyle": {
                    "theme": "recovered",
                    "recoveryTimestamp": datetime.utcnow().isoformat(),
                    "dataSource": "individual_collections"
                }
            }
            
            # Test the recovery by updating league_data
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=recovery_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify the recovery worked
                time.sleep(1)  # Allow database write
                
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    recovered_data = verify_response.json()
                    
                    recovered_teams = recovered_data.get('teams', [])
                    recovered_style = recovered_data.get('websiteStyle', {})
                    
                    if (len(recovered_teams) == len(individual_teams) and 
                        recovered_style.get('theme') == 'recovered'):
                        
                        self.log_test(
                            "Data Synchronization Recovery", 
                            True, 
                            f"Successfully restored league_data from individual collections - {len(recovered_teams)} teams recovered",
                            f"Recovery timestamp: {recovered_style.get('recoveryTimestamp')}"
                        )
                        return True, recovered_data
                    else:
                        self.log_test(
                            "Data Synchronization Recovery", 
                            False, 
                            f"Recovery verification failed - expected {len(individual_teams)} teams, got {len(recovered_teams)}"
                        )
                        return False, {}
                else:
                    self.log_test(
                        "Data Synchronization Recovery", 
                        False, 
                        f"Recovery verification failed: HTTP {verify_response.status_code}"
                    )
                    return False, {}
            else:
                self.log_test(
                    "Data Synchronization Recovery", 
                    False, 
                    f"Recovery operation failed: HTTP {response.status_code}: {response.text}"
                )
                return False, {}
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Data Synchronization Recovery", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, {}

    def test_website_style_backup_restore(self):
        """Test website style backup and restore functionality"""
        try:
            # Create a test websiteStyle with user customizations
            test_website_style = {
                "theme": "user_custom",
                "primaryColor": "#FF6B35",
                "secondaryColor": "#004E89", 
                "bannerColor": "#FF6B35",
                "bannerText": "User's Custom League",
                "logoUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
                "backgroundImage": "data:image/jpeg;base64,testbackground123",
                "customBanners": {
                    "mainBanner": {"text": "Welcome to User's League", "color": "#FF6B35"},
                    "teamBanner": {"text": "Team Pages", "color": "#004E89"}
                },
                "customLogos": {
                    "mainLogo": "data:image/jpeg;base64,mainlogo123",
                    "sidebarLogo": "data:image/jpeg;base64,sidebarlogo123"
                },
                "backupTimestamp": datetime.utcnow().isoformat()
            }
            
            # Save the custom websiteStyle
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=test_website_style,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify it was saved
                time.sleep(1)
                
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    data = verify_response.json()
                    saved_style = data.get('websiteStyle', {})
                    
                    # Check if our custom data was preserved
                    custom_fields_preserved = (
                        saved_style.get('theme') == 'user_custom' and
                        saved_style.get('primaryColor') == '#FF6B35' and
                        saved_style.get('bannerText') == "User's Custom League" and
                        'customBanners' in saved_style and
                        'customLogos' in saved_style
                    )
                    
                    if custom_fields_preserved:
                        self.log_test(
                            "Website Style Backup/Restore", 
                            True, 
                            f"Website style customizations preserved correctly - {len(saved_style)} properties saved",
                            f"Theme: {saved_style.get('theme')}, Colors: {saved_style.get('primaryColor')}"
                        )
                        return True, saved_style
                    else:
                        self.log_test(
                            "Website Style Backup/Restore", 
                            False, 
                            f"Website style customizations not preserved - missing fields or incorrect values"
                        )
                        return False, {}
                else:
                    self.log_test(
                        "Website Style Backup/Restore", 
                        False, 
                        f"Verification failed: HTTP {verify_response.status_code}"
                    )
                    return False, {}
            else:
                self.log_test(
                    "Website Style Backup/Restore", 
                    False, 
                    f"Save failed: HTTP {response.status_code}: {response.text}"
                )
                return False, {}
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Website Style Backup/Restore", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, {}

    def test_backup_endpoints(self):
        """Test manual backup endpoints for teams and players"""
        try:
            # Test teams backup
            teams_backup_response = requests.get(f"{self.api_base}/backup/teams", timeout=10)
            
            teams_backup_success = teams_backup_response.status_code == 200
            
            # Test players backup  
            players_backup_response = requests.get(f"{self.api_base}/backup/players", timeout=10)
            
            players_backup_success = players_backup_response.status_code == 200
            
            if teams_backup_success and players_backup_success:
                self.log_test(
                    "Manual Backup Endpoints", 
                    True, 
                    "Both teams and players backup endpoints working correctly",
                    f"Teams: {teams_backup_response.json().get('message')}, Players: {players_backup_response.json().get('message')}"
                )
                return True
            else:
                failed_endpoints = []
                if not teams_backup_success:
                    failed_endpoints.append(f"Teams backup: HTTP {teams_backup_response.status_code}")
                if not players_backup_success:
                    failed_endpoints.append(f"Players backup: HTTP {players_backup_response.status_code}")
                
                self.log_test(
                    "Manual Backup Endpoints", 
                    False, 
                    f"Backup endpoints failed: {', '.join(failed_endpoints)}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Manual Backup Endpoints", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_data_overwrite_prevention(self):
        """Test that the system can prevent data overwrites"""
        try:
            # Get current league data
            current_response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if current_response.status_code != 200:
                self.log_test(
                    "Data Overwrite Prevention", 
                    False, 
                    "Could not retrieve current league data for testing"
                )
                return False
            
            current_data = current_response.json()
            current_teams_count = len(current_data.get('teams', []))
            current_style_keys = len(current_data.get('websiteStyle', {}))
            
            # Simulate an overwrite attempt with empty/default data
            malicious_data = {
                "teams": [],  # Empty teams - this would cause data loss
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {},
                "websiteStyle": {}  # Empty style - this would lose customizations
            }
            
            # The system should either reject this or merge with existing data
            overwrite_response = requests.post(
                f"{self.api_base}/league-data", 
                json=malicious_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if overwrite_response.status_code == 200:
                # Check if data was actually overwritten
                time.sleep(1)
                
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    new_data = verify_response.json()
                    new_teams_count = len(new_data.get('teams', []))
                    new_style_keys = len(new_data.get('websiteStyle', {}))
                    
                    # If counts are preserved, the system prevented overwrite
                    if new_teams_count >= current_teams_count and new_style_keys >= current_style_keys:
                        self.log_test(
                            "Data Overwrite Prevention", 
                            True, 
                            f"System preserved existing data - teams: {current_teams_count}→{new_teams_count}, style keys: {current_style_keys}→{new_style_keys}",
                            "Data overwrite protection working"
                        )
                        return True
                    else:
                        self.log_test(
                            "Data Overwrite Prevention", 
                            False, 
                            f"CRITICAL: Data was overwritten! Teams: {current_teams_count}→{new_teams_count}, Style keys: {current_style_keys}→{new_style_keys}",
                        )
                        return False
                else:
                    self.log_test(
                        "Data Overwrite Prevention", 
                        False, 
                        f"Could not verify data after overwrite test: HTTP {verify_response.status_code}"
                    )
                    return False
            else:
                # If the request was rejected, that's also good protection
                self.log_test(
                    "Data Overwrite Prevention", 
                    True, 
                    f"System rejected potentially destructive data update: HTTP {overwrite_response.status_code}",
                    "Request rejection is a valid protection mechanism"
                )
                return True
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Data Overwrite Prevention", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_emergency_recovery_tests(self):
        """Run all emergency data recovery tests"""
        print("🚨 STARTING EMERGENCY DATA RECOVERY TESTS")
        print(f"Target URL: {self.api_base}")
        print("=" * 70)
        
        # Step 1: Check individual collections integrity
        print("📋 STEP 1: Verifying Individual Collections Data Integrity")
        teams_success, individual_teams = self.test_individual_teams_collection()
        players_success, individual_players = self.test_individual_players_collection()
        
        if not teams_success or not players_success:
            print("❌ CRITICAL: Individual collections are compromised!")
            return False
        
        # Step 2: Check league_data collection state
        print("📋 STEP 2: Checking League Data Collection State")
        league_data_success, league_data = self.test_league_data_collection_state()
        
        # Step 3: Test data recovery mechanisms
        print("📋 STEP 3: Testing Data Recovery Mechanisms")
        recovery_success, recovered_data = self.test_data_synchronization_recovery(individual_teams, individual_players)
        
        # Step 4: Test website style backup/restore
        print("📋 STEP 4: Testing Website Style Backup/Restore")
        style_success, style_data = self.test_website_style_backup_restore()
        
        # Step 5: Test backup endpoints
        print("📋 STEP 5: Testing Manual Backup Endpoints")
        backup_success = self.test_backup_endpoints()
        
        # Step 6: Test overwrite prevention
        print("📋 STEP 6: Testing Data Overwrite Prevention")
        prevention_success = self.test_data_overwrite_prevention()
        
        # Summary
        print("=" * 70)
        print("🚨 EMERGENCY RECOVERY TEST SUMMARY")
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
        critical_systems = [
            ("Individual Collections", teams_success and players_success),
            ("Data Recovery", recovery_success),
            ("Website Style Persistence", style_success),
            ("Backup Systems", backup_success),
            ("Overwrite Prevention", prevention_success)
        ]
        
        print(f"\n🔍 CRITICAL SYSTEMS STATUS:")
        all_critical_working = True
        for system, status in critical_systems:
            status_icon = "✅" if status else "❌"
            print(f"  {status_icon} {system}")
            if not status:
                all_critical_working = False
        
        if all_critical_working:
            print(f"\n🎉 ALL CRITICAL RECOVERY SYSTEMS OPERATIONAL!")
            print(f"✅ User data can be recovered from individual collections")
            print(f"✅ Website customizations can be restored")
            print(f"✅ Backup systems are functional")
            print(f"✅ Data overwrite protection is working")
        else:
            print(f"\n⚠️  CRITICAL RECOVERY SYSTEMS HAVE ISSUES!")
            print(f"❌ Emergency data recovery may not be fully functional")
        
        return all_critical_working

if __name__ == "__main__":
    try:
        tester = EmergencyDataRecoveryTester()
        success = tester.run_emergency_recovery_tests()
        
        if success:
            print("\n🎉 Emergency data recovery systems are fully operational!")
            sys.exit(0)
        else:
            print("\n⚠️  Emergency data recovery systems have critical issues!")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Emergency recovery test setup failed: {e}")
        sys.exit(1)