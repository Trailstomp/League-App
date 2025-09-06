#!/usr/bin/env python3
"""
PRODUCTION CRITICAL BACKEND TESTING
Testing team saving and website style functionality in production environment

PRODUCTION BACKEND URL: https://team-lax-portal.emergent.host/api
"""

import requests
import json
import time
import uuid
from datetime import datetime
import sys

# PRODUCTION URL - CRITICAL
PRODUCTION_BASE_URL = "https://team-lax-portal.emergent.host/api"

class ProductionBackendTester:
    def __init__(self):
        self.base_url = PRODUCTION_BASE_URL
        self.test_results = []
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'ProductionTester/1.0'
        })
        
    def log_result(self, test_name, success, message, response_time=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'response_time': response_time,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status} {test_name}: {message}")
        if response_time:
            print(f"   Response time: {response_time:.2f}ms")
        
    def test_production_api_health(self):
        """Test 1: Production API Health Check"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if "MLBL API" in data.get("message", ""):
                    self.log_result("Production API Health", True, 
                                  f"Production API responsive: {data['message']}", response_time)
                    return True
                else:
                    self.log_result("Production API Health", False, 
                                  f"Unexpected API response: {data}")
                    return False
            else:
                self.log_result("Production API Health", False, 
                              f"API returned status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Production API Health", False, f"Connection failed: {str(e)}")
            return False
    
    def test_teams_api_production(self):
        """Test 2: Teams API Production Test - Create, Read, Update, Delete"""
        try:
            # Test GET /api/teams
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/teams")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                existing_teams = response.json()
                self.log_result("Teams API GET", True, 
                              f"Retrieved {len(existing_teams)} existing teams", response_time)
            else:
                self.log_result("Teams API GET", False, 
                              f"Failed to get teams: {response.status_code}")
                return False
            
            # Test POST /api/teams - Create new team
            test_team_data = {
                "id": f"prod_test_team_{uuid.uuid4().hex[:8]}",
                "name": "Production Test Lacrosse Team",
                "division": "Field",
                "coach": "Coach Production",
                "homeField": "Production Stadium",
                "logo": "",
                "contactEmail": "coach@production-test.com",
                "active": True,
                "wins": 5,
                "losses": 2,
                "ties": 1,
                "style": {
                    "primaryColor": "#1e40af",
                    "backgroundColor": "#dbeafe",
                    "accentColor": "#3b82f6",
                    "logoUrl": "",
                    "logoOpacity": 1.0,
                    "bannerUrl": ""
                }
            }
            
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/teams", 
                                       json=test_team_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                created_team = response.json()
                team_id = created_team.get("id")
                self.log_result("Teams API CREATE", True, 
                              f"Created team '{created_team['name']}' with ID: {team_id}", 
                              response_time)
                
                # Test persistence - GET the created team
                start_time = time.time()
                get_response = self.session.get(f"{self.base_url}/teams")
                response_time = (time.time() - start_time) * 1000
                
                if get_response.status_code == 200:
                    teams = get_response.json()
                    created_team_found = any(team['id'] == team_id for team in teams)
                    if created_team_found:
                        self.log_result("Teams API PERSISTENCE", True, 
                                      f"Team persisted correctly in production database", 
                                      response_time)
                        
                        # Test UPDATE
                        update_data = created_team.copy()
                        update_data["coach"] = "Updated Production Coach"
                        update_data["wins"] = 7
                        
                        start_time = time.time()
                        update_response = self.session.put(f"{self.base_url}/teams/{team_id}", 
                                                         json=update_data)
                        response_time = (time.time() - start_time) * 1000
                        
                        if update_response.status_code == 200:
                            updated_team = update_response.json()
                            if updated_team["coach"] == "Updated Production Coach" and updated_team["wins"] == 7:
                                self.log_result("Teams API UPDATE", True, 
                                              f"Team updated successfully: {updated_team['coach']}, {updated_team['wins']} wins", 
                                              response_time)
                            else:
                                self.log_result("Teams API UPDATE", False, 
                                              "Team update data not reflected correctly")
                        else:
                            self.log_result("Teams API UPDATE", False, 
                                          f"Update failed: {update_response.status_code}")
                        
                        # Test DELETE (cleanup)
                        start_time = time.time()
                        delete_response = self.session.delete(f"{self.base_url}/teams/{team_id}")
                        response_time = (time.time() - start_time) * 1000
                        
                        if delete_response.status_code == 200:
                            self.log_result("Teams API DELETE", True, 
                                          "Test team deleted successfully (cleanup)", 
                                          response_time)
                        else:
                            self.log_result("Teams API DELETE", False, 
                                          f"Delete failed: {delete_response.status_code}")
                        
                        return True
                    else:
                        self.log_result("Teams API PERSISTENCE", False, 
                                      "Created team not found in database")
                        return False
                else:
                    self.log_result("Teams API PERSISTENCE", False, 
                                  f"Failed to verify persistence: {get_response.status_code}")
                    return False
            else:
                self.log_result("Teams API CREATE", False, 
                              f"Failed to create team: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Teams API Production", False, f"Exception: {str(e)}")
            return False
    
    def test_website_style_production_save(self):
        """Test 3: Website Style Production Save"""
        try:
            # First, get current league data
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/league-data")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                league_data = response.json()
                self.log_result("Website Style GET", True, 
                              f"Retrieved league data with websiteStyle", response_time)
            else:
                self.log_result("Website Style GET", False, 
                              f"Failed to get league data: {response.status_code}")
                return False
            
            # Test website style save
            test_website_style = {
                "theme": "production_test",
                "primaryColor": "#dc2626",
                "secondaryColor": "#991b1b",
                "backgroundColor": "#fef2f2",
                "textColor": "#1f2937",
                "bannerTitle": "PRODUCTION TEST - Website Style Save",
                "bannerSubtitle": "Testing website style persistence in production",
                "bannerBackgroundColor": "#dc2626",
                "bannerTextColor": "#ffffff",
                "navBackgroundType": "color",
                "navBackgroundColor": "#ffffff",
                "navTextColor": "#374151",
                "navFont": "Inter, sans-serif",
                "bannerFont": "Inter, sans-serif",
                "bannerFontSize": "2xl",
                "bannerTextColor": "#ffffff",
                "contentFont": "Inter, sans-serif",
                "contentFontSize": "base",
                "contentTextColor": "#374151",
                "headingFont": "Inter, sans-serif",
                "headingFontSize": "xl",
                "headingTextColor": "#1f2937",
                "backgroundType": "color",
                "backgroundImageUrl": "",
                "bannerType": "color",
                "bannerColor": "#dc2626",
                "customLogos": [],
                "customBanners": [],
                "lastUpdated": datetime.now().isoformat()
            }
            
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/league-data/websiteStyle", 
                                       json=test_website_style)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                self.log_result("Website Style SAVE", True, 
                              f"Website style saved successfully", response_time)
                
                # Test persistence - retrieve and verify
                start_time = time.time()
                verify_response = self.session.get(f"{self.base_url}/league-data")
                response_time = (time.time() - start_time) * 1000
                
                if verify_response.status_code == 200:
                    verified_data = verify_response.json()
                    saved_style = verified_data.get("websiteStyle", {})
                    
                    if (saved_style.get("bannerTitle") == "PRODUCTION TEST - Website Style Save" and
                        saved_style.get("primaryColor") == "#dc2626" and
                        saved_style.get("theme") == "production_test"):
                        self.log_result("Website Style PERSISTENCE", True, 
                                      f"Website style persisted correctly in production Atlas MongoDB", 
                                      response_time)
                        return True
                    else:
                        self.log_result("Website Style PERSISTENCE", False, 
                                      f"Website style data not persisted correctly. Got: {saved_style.get('bannerTitle', 'MISSING')}")
                        return False
                else:
                    self.log_result("Website Style PERSISTENCE", False, 
                                  f"Failed to verify persistence: {verify_response.status_code}")
                    return False
            else:
                self.log_result("Website Style SAVE", False, 
                              f"Failed to save website style: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Website Style Production Save", False, f"Exception: {str(e)}")
            return False
    
    def test_league_data_sync(self):
        """Test 4: League Data Sync - Test team sync between /api/teams and /api/league-data"""
        try:
            # Get teams from individual collection
            start_time = time.time()
            teams_response = self.session.get(f"{self.base_url}/teams")
            teams_response_time = (time.time() - start_time) * 1000
            
            if teams_response.status_code != 200:
                self.log_result("League Data Sync - Teams", False, 
                              f"Failed to get teams: {teams_response.status_code}")
                return False
            
            teams_data = teams_response.json()
            self.log_result("League Data Sync - Teams", True, 
                          f"Retrieved {len(teams_data)} teams from /api/teams", teams_response_time)
            
            # Get league data
            start_time = time.time()
            league_response = self.session.get(f"{self.base_url}/league-data")
            league_response_time = (time.time() - start_time) * 1000
            
            if league_response.status_code != 200:
                self.log_result("League Data Sync - League", False, 
                              f"Failed to get league data: {league_response.status_code}")
                return False
            
            league_data = league_response.json()
            league_teams = league_data.get("teams", [])
            self.log_result("League Data Sync - League", True, 
                          f"Retrieved {len(league_teams)} teams from /api/league-data", league_response_time)
            
            # Test synchronization by updating league data with teams data
            updated_league_data = league_data.copy()
            updated_league_data["teams"] = teams_data
            updated_league_data["lastUpdated"] = datetime.now().isoformat()
            
            start_time = time.time()
            sync_response = self.session.post(f"{self.base_url}/league-data", 
                                            json=updated_league_data)
            sync_response_time = (time.time() - start_time) * 1000
            
            if sync_response.status_code == 200:
                self.log_result("League Data SYNC", True, 
                              f"Successfully synchronized {len(teams_data)} teams to league data", 
                              sync_response_time)
                
                # Verify synchronization
                start_time = time.time()
                verify_response = self.session.get(f"{self.base_url}/league-data")
                verify_response_time = (time.time() - start_time) * 1000
                
                if verify_response.status_code == 200:
                    verified_data = verify_response.json()
                    synced_teams = verified_data.get("teams", [])
                    
                    if len(synced_teams) == len(teams_data):
                        self.log_result("League Data SYNC VERIFICATION", True, 
                                      f"Sync verification successful: {len(synced_teams)} teams in league data", 
                                      verify_response_time)
                        return True
                    else:
                        self.log_result("League Data SYNC VERIFICATION", False, 
                                      f"Sync mismatch: {len(teams_data)} teams vs {len(synced_teams)} in league data")
                        return False
                else:
                    self.log_result("League Data SYNC VERIFICATION", False, 
                                  f"Failed to verify sync: {verify_response.status_code}")
                    return False
            else:
                self.log_result("League Data SYNC", False, 
                              f"Failed to sync data: {sync_response.status_code} - {sync_response.text}")
                return False
                
        except Exception as e:
            self.log_result("League Data Sync", False, f"Exception: {str(e)}")
            return False
    
    def test_data_persistence_atlas_mongodb(self):
        """Test 5: Data Persistence - Verify data persists correctly in Atlas MongoDB"""
        try:
            # Create a test record with timestamp
            test_timestamp = datetime.now().isoformat()
            test_data = {
                "client_name": f"ProductionPersistenceTest_{test_timestamp}"
            }
            
            start_time = time.time()
            create_response = self.session.post(f"{self.base_url}/status", json=test_data)
            create_response_time = (time.time() - start_time) * 1000
            
            if create_response.status_code == 200:
                created_record = create_response.json()
                record_id = created_record.get("id")
                self.log_result("Atlas MongoDB CREATE", True, 
                              f"Created test record with ID: {record_id}", create_response_time)
                
                # Wait a moment then verify persistence
                time.sleep(1)
                
                start_time = time.time()
                get_response = self.session.get(f"{self.base_url}/status")
                get_response_time = (time.time() - start_time) * 1000
                
                if get_response.status_code == 200:
                    all_records = get_response.json()
                    test_record_found = any(record.get("id") == record_id for record in all_records)
                    
                    if test_record_found:
                        self.log_result("Atlas MongoDB PERSISTENCE", True, 
                                      f"Test record persisted correctly in Atlas MongoDB", 
                                      get_response_time)
                        return True
                    else:
                        self.log_result("Atlas MongoDB PERSISTENCE", False, 
                                      "Test record not found in database")
                        return False
                else:
                    self.log_result("Atlas MongoDB PERSISTENCE", False, 
                                  f"Failed to retrieve records: {get_response.status_code}")
                    return False
            else:
                self.log_result("Atlas MongoDB CREATE", False, 
                              f"Failed to create test record: {create_response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Atlas MongoDB Persistence", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all production tests"""
        print("🚀 STARTING PRODUCTION CRITICAL BACKEND TESTING")
        print(f"Production Backend URL: {self.base_url}")
        print("=" * 80)
        
        tests = [
            self.test_production_api_health,
            self.test_teams_api_production,
            self.test_website_style_production_save,
            self.test_league_data_sync,
            self.test_data_persistence_atlas_mongodb
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
                print("-" * 40)
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test.__name__}: {str(e)}")
                print("-" * 40)
        
        print("=" * 80)
        print(f"🏆 PRODUCTION TEST RESULTS: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ ALL PRODUCTION TESTS PASSED - System ready for production use")
        else:
            print("❌ PRODUCTION ISSUES DETECTED - Requires immediate attention")
        
        return passed == total

if __name__ == "__main__":
    tester = ProductionBackendTester()
    success = tester.run_all_tests()
    
    if not success:
        sys.exit(1)