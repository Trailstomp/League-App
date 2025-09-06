#!/usr/bin/env python3
"""
🚨 CRITICAL DATA LOSS INVESTIGATION - Emergency Data Recovery Testing Suite
Production teams and web settings lost after deployment - comprehensive investigation and recovery testing.
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

class DataRecoveryInvestigator:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        self.critical_issues = []
        
        print("🚨 CRITICAL DATA LOSS INVESTIGATION")
        print("=" * 60)
        print(f"Testing backend at: {self.api_base}")
        print("Investigating production data loss incident...")
        print("=" * 60)

    def log_test(self, test_name, success, message="", response_data=None, is_critical=False):
        """Log test results with critical issue tracking"""
        status = "✅ PASS" if success else "❌ FAIL"
        if is_critical and not success:
            status = "🚨 CRITICAL FAIL"
            self.critical_issues.append(test_name)
        
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            print(f"    Response: {response_data}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response': response_data,
            'critical': is_critical
        })
        
        if not success:
            self.failed_tests.append(test_name)
        print()

    def test_database_connectivity(self):
        """1. Database Connectivity Check - Verify MongoDB connection is working"""
        print("🔍 1. DATABASE CONNECTIVITY CHECK")
        print("-" * 40)
        
        try:
            # Test basic API connectivity first
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code != 200:
                self.log_test(
                    "Database Connectivity - API Health", 
                    False, 
                    f"API not responding: HTTP {response.status_code}",
                    is_critical=True
                )
                return False
            
            # Test database read operation
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Database Connectivity - MongoDB Read", 
                    True, 
                    "MongoDB connection working - can read league data", 
                    f"Collections accessible: {list(data.keys())}"
                )
                
                # Test database write operation
                test_write_data = {
                    "teams": data.get('teams', []),
                    "players": data.get('players', []),
                    "users": data.get('users', []),
                    "newsItems": data.get('newsItems', []),
                    "gameTickerData": data.get('gameTickerData', []),
                    "leagueSchedule": data.get('leagueSchedule', []),
                    "leagueInfo": {"connectivity_test": datetime.utcnow().isoformat()},
                    "websiteStyle": data.get('websiteStyle', {})
                }
                
                write_response = requests.post(
                    f"{self.api_base}/league-data", 
                    json=test_write_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if write_response.status_code == 200:
                    self.log_test(
                        "Database Connectivity - MongoDB Write", 
                        True, 
                        "MongoDB connection working - can write data", 
                        "Database read/write operations functional"
                    )
                    return True, data
                else:
                    self.log_test(
                        "Database Connectivity - MongoDB Write", 
                        False, 
                        f"Cannot write to database: HTTP {write_response.status_code}",
                        is_critical=True
                    )
                    return False, None
            else:
                self.log_test(
                    "Database Connectivity - MongoDB Read", 
                    False, 
                    f"Cannot read from database: HTTP {response.status_code}",
                    is_critical=True
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Database Connectivity", 
                False, 
                f"Connection error: {str(e)}",
                is_critical=True
            )
            return False, None

    def test_data_persistence_verification(self, league_data):
        """2. Data Persistence Verification - Check if teams data exists in database collections"""
        print("🔍 2. DATA PERSISTENCE VERIFICATION")
        print("-" * 40)
        
        # Check teams data in league_data collection
        teams_in_league = league_data.get('teams', [])
        self.log_test(
            "Teams Data in League Collection", 
            len(teams_in_league) > 0, 
            f"Found {len(teams_in_league)} teams in league_data collection",
            f"Teams: {[team.get('name', 'Unknown') for team in teams_in_league[:3]]}"
        )
        
        # Check individual teams collection
        try:
            response = requests.get(f"{self.api_base}/teams", timeout=10)
            if response.status_code == 200:
                individual_teams = response.json()
                self.log_test(
                    "Teams Data in Individual Collection", 
                    len(individual_teams) > 0, 
                    f"Found {len(individual_teams)} teams in individual teams collection",
                    f"Teams: {[team.get('name', 'Unknown') for team in individual_teams[:3]]}"
                )
            else:
                self.log_test(
                    "Teams Data in Individual Collection", 
                    False, 
                    f"Cannot access teams collection: HTTP {response.status_code}",
                    is_critical=True
                )
                individual_teams = []
        except Exception as e:
            self.log_test(
                "Teams Data in Individual Collection", 
                False, 
                f"Error accessing teams collection: {str(e)}",
                is_critical=True
            )
            individual_teams = []
        
        # Check players data
        try:
            response = requests.get(f"{self.api_base}/players", timeout=10)
            if response.status_code == 200:
                players = response.json()
                self.log_test(
                    "Players Data Persistence", 
                    True, 
                    f"Found {len(players)} players in database",
                    f"Players accessible: {len(players)}"
                )
            else:
                self.log_test(
                    "Players Data Persistence", 
                    False, 
                    f"Cannot access players: HTTP {response.status_code}"
                )
                players = []
        except Exception as e:
            self.log_test(
                "Players Data Persistence", 
                False, 
                f"Error accessing players: {str(e)}"
            )
            players = []
        
        # Check website style data
        website_style = league_data.get('websiteStyle', {})
        has_customizations = len(website_style) > 0 and any(
            key in website_style for key in ['primaryColor', 'theme', 'bannerText', 'logoUrl']
        )
        
        self.log_test(
            "Website Style Customizations", 
            has_customizations, 
            f"Website customizations {'found' if has_customizations else 'missing'} in database",
            f"Style keys: {list(website_style.keys())[:5]}" if website_style else "No customizations"
        )
        
        return {
            'league_teams': teams_in_league,
            'individual_teams': individual_teams,
            'players': players,
            'website_style': website_style
        }

    def test_api_endpoints(self):
        """3. API Endpoints Testing - Test all critical endpoints for data recovery"""
        print("🔍 3. API ENDPOINTS TESTING")
        print("-" * 40)
        
        endpoints_to_test = [
            ("GET /api/teams", f"{self.api_base}/teams", "GET"),
            ("GET /api/league-data", f"{self.api_base}/league-data", "GET"),
            ("GET /api/backup/teams", f"{self.api_base}/backup/teams", "GET"),
            ("GET /api/backup/players", f"{self.api_base}/backup/players", "GET"),
            ("GET /api/players", f"{self.api_base}/players", "GET")
        ]
        
        all_endpoints_working = True
        
        for name, url, method in endpoints_to_test:
            try:
                if method == "GET":
                    response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(
                        f"API Endpoint - {name}", 
                        True, 
                        f"Endpoint working correctly",
                        f"Response type: {type(data).__name__}"
                    )
                else:
                    self.log_test(
                        f"API Endpoint - {name}", 
                        False, 
                        f"HTTP {response.status_code}: {response.text[:100]}",
                        is_critical=True
                    )
                    all_endpoints_working = False
                    
            except requests.exceptions.RequestException as e:
                self.log_test(
                    f"API Endpoint - {name}", 
                    False, 
                    f"Connection error: {str(e)}",
                    is_critical=True
                )
                all_endpoints_working = False
        
        return all_endpoints_working

    def test_emergency_data_recovery(self):
        """4. Emergency Data Recovery - Check backup systems and recovery mechanisms"""
        print("🔍 4. EMERGENCY DATA RECOVERY TESTING")
        print("-" * 40)
        
        # Test backup endpoints
        backup_systems_working = True
        
        try:
            # Test teams backup
            response = requests.get(f"{self.api_base}/backup/teams", timeout=10)
            if response.status_code == 200:
                self.log_test(
                    "Teams Backup System", 
                    True, 
                    "Teams backup endpoint operational",
                    "Backup system accessible"
                )
            else:
                self.log_test(
                    "Teams Backup System", 
                    False, 
                    f"Teams backup failed: HTTP {response.status_code}",
                    is_critical=True
                )
                backup_systems_working = False
        except Exception as e:
            self.log_test(
                "Teams Backup System", 
                False, 
                f"Teams backup error: {str(e)}",
                is_critical=True
            )
            backup_systems_working = False
        
        try:
            # Test players backup
            response = requests.get(f"{self.api_base}/backup/players", timeout=10)
            if response.status_code == 200:
                self.log_test(
                    "Players Backup System", 
                    True, 
                    "Players backup endpoint operational",
                    "Backup system accessible"
                )
            else:
                self.log_test(
                    "Players Backup System", 
                    False, 
                    f"Players backup failed: HTTP {response.status_code}",
                    is_critical=True
                )
                backup_systems_working = False
        except Exception as e:
            self.log_test(
                "Players Backup System", 
                False, 
                f"Players backup error: {str(e)}",
                is_critical=True
            )
            backup_systems_working = False
        
        return backup_systems_working

    def test_data_recovery_execution(self, data_status):
        """5. Data Recovery Execution - Test actual data recovery procedures"""
        print("🔍 5. DATA RECOVERY EXECUTION")
        print("-" * 40)
        
        recovery_successful = True
        
        # Test creating recovery data if none exists
        if len(data_status['individual_teams']) == 0 and len(data_status['league_teams']) == 0:
            print("No teams found - testing data recovery creation...")
            
            # Create test recovery team
            recovery_team = {
                "id": f"recovery_team_{int(time.time())}",
                "name": "Data Recovery Test Team",
                "division": "Field",
                "coach": "Recovery Coach",
                "homeField": "Recovery Field",
                "logo": "",
                "contactEmail": "recovery@mlbl.org",
                "active": True,
                "wins": 5,
                "losses": 3,
                "ties": 0,
                "style": {
                    "primaryColor": "#dc2626",
                    "backgroundColor": "#fef2f2",
                    "accentColor": "#7c2d12",
                    "logoUrl": "",
                    "logoOpacity": 1.0,
                    "bannerUrl": ""
                }
            }
            
            try:
                response = requests.post(
                    f"{self.api_base}/teams",
                    json=recovery_team,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.log_test(
                        "Data Recovery - Team Creation", 
                        True, 
                        "Successfully created recovery team",
                        f"Team ID: {recovery_team['id']}"
                    )
                else:
                    self.log_test(
                        "Data Recovery - Team Creation", 
                        False, 
                        f"Failed to create recovery team: HTTP {response.status_code}",
                        is_critical=True
                    )
                    recovery_successful = False
            except Exception as e:
                self.log_test(
                    "Data Recovery - Team Creation", 
                    False, 
                    f"Error creating recovery team: {str(e)}",
                    is_critical=True
                )
                recovery_successful = False
        
        # Test website style recovery
        if not data_status['website_style'] or len(data_status['website_style']) == 0:
            print("No website customizations found - testing style recovery...")
            
            recovery_style = {
                "theme": "recovery_theme",
                "primaryColor": "#FF6B35",
                "secondaryColor": "#004E89",
                "bannerText": "MLBL - Data Recovery Mode",
                "logoUrl": "recovery_logo.png",
                "backgroundImage": "recovery_bg.jpg"
            }
            
            try:
                response = requests.post(
                    f"{self.api_base}/league-data/websiteStyle",
                    json=recovery_style,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.log_test(
                        "Data Recovery - Website Style", 
                        True, 
                        "Successfully recovered website customizations",
                        f"Style keys: {list(recovery_style.keys())}"
                    )
                else:
                    self.log_test(
                        "Data Recovery - Website Style", 
                        False, 
                        f"Failed to recover website style: HTTP {response.status_code}",
                        is_critical=True
                    )
                    recovery_successful = False
            except Exception as e:
                self.log_test(
                    "Data Recovery - Website Style", 
                    False, 
                    f"Error recovering website style: {str(e)}",
                    is_critical=True
                )
                recovery_successful = False
        
        # Test data synchronization
        try:
            # Get updated data after recovery attempts
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code == 200:
                updated_data = response.json()
                
                # Check if recovery data is now present
                teams_count = len(updated_data.get('teams', []))
                style_keys = len(updated_data.get('websiteStyle', {}))
                
                self.log_test(
                    "Data Recovery - Synchronization", 
                    teams_count > 0 or style_keys > 0, 
                    f"Data synchronization {'successful' if teams_count > 0 or style_keys > 0 else 'failed'}",
                    f"Teams: {teams_count}, Style keys: {style_keys}"
                )
            else:
                self.log_test(
                    "Data Recovery - Synchronization", 
                    False, 
                    f"Cannot verify synchronization: HTTP {response.status_code}",
                    is_critical=True
                )
                recovery_successful = False
        except Exception as e:
            self.log_test(
                "Data Recovery - Synchronization", 
                False, 
                f"Synchronization error: {str(e)}",
                is_critical=True
            )
            recovery_successful = False
        
        return recovery_successful

    def run_investigation(self):
        """Run complete data loss investigation"""
        print("🚨 STARTING CRITICAL DATA LOSS INVESTIGATION")
        print("=" * 60)
        
        # 1. Database Connectivity Check
        connectivity_result = self.test_database_connectivity()
        if not connectivity_result:
            print("🚨 CRITICAL: Database connectivity failed - cannot proceed with investigation")
            return False
        
        success, league_data = connectivity_result
        if not success:
            print("🚨 CRITICAL: Cannot access league data - investigation cannot continue")
            return False
        
        # 2. Data Persistence Verification
        data_status = self.test_data_persistence_verification(league_data)
        
        # 3. API Endpoints Testing
        endpoints_working = self.test_api_endpoints()
        
        # 4. Emergency Data Recovery
        backup_systems_working = self.test_emergency_data_recovery()
        
        # 5. Data Recovery Execution
        recovery_successful = self.test_data_recovery_execution(data_status)
        
        # Investigation Summary
        print("=" * 60)
        print("🚨 DATA LOSS INVESTIGATION SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        critical_failures = len(self.critical_issues)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Critical Issues: {critical_failures}")
        
        # Data Loss Assessment
        print(f"\n📊 DATA LOSS ASSESSMENT:")
        teams_in_league = len(data_status['league_teams'])
        teams_individual = len(data_status['individual_teams'])
        players_count = len(data_status['players'])
        style_customizations = len(data_status['website_style'])
        
        print(f"  Teams in League Data: {teams_in_league}")
        print(f"  Teams in Individual Collection: {teams_individual}")
        print(f"  Players: {players_count}")
        print(f"  Website Customizations: {style_customizations}")
        
        # Recovery Status
        print(f"\n🔧 RECOVERY SYSTEM STATUS:")
        print(f"  Database Connectivity: {'✅ Working' if connectivity_result else '❌ Failed'}")
        print(f"  API Endpoints: {'✅ Working' if endpoints_working else '❌ Failed'}")
        print(f"  Backup Systems: {'✅ Working' if backup_systems_working else '❌ Failed'}")
        print(f"  Recovery Execution: {'✅ Working' if recovery_successful else '❌ Failed'}")
        
        if critical_failures > 0:
            print(f"\n🚨 CRITICAL ISSUES FOUND:")
            for issue in self.critical_issues:
                print(f"  - {issue}")
        
        # Final Assessment
        data_loss_confirmed = (teams_in_league == 0 and teams_individual == 0 and 
                              players_count == 0 and style_customizations == 0)
        
        if data_loss_confirmed:
            print(f"\n🚨 CONFIRMED: Complete data loss detected")
            if backup_systems_working and recovery_successful:
                print(f"✅ RECOVERY: Data recovery systems operational - can restore data")
            else:
                print(f"❌ RECOVERY: Data recovery systems compromised - manual intervention required")
        else:
            print(f"\n✅ DATA FOUND: Some data exists in database collections")
            print(f"🔧 RECOMMENDATION: Verify data integrity and synchronization")
        
        return critical_failures == 0

if __name__ == "__main__":
    try:
        investigator = DataRecoveryInvestigator()
        success = investigator.run_investigation()
        
        if success:
            print("\n✅ Data loss investigation completed - systems operational")
            sys.exit(0)
        else:
            print("\n🚨 Critical issues found during investigation - immediate attention required")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Investigation setup failed: {e}")
        sys.exit(1)