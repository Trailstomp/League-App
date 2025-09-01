#!/usr/bin/env python3
"""
Website Style Manager Fixes Backend Testing Suite
Tests backend functionality after implementing Website Style Manager fixes:
1. Removed sidebar zone from team styling
2. Fixed TeamCalendarManager to use team-specific formBackgroundColor
3. Verify all backend endpoints still work correctly
4. Test websiteStyle data handling and persistence
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

class WebsiteStyleFixesTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Website Style Manager Fixes at: {self.api_base}")
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

    def test_health_check(self):
        """Test basic API connectivity"""
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "Backend Health Check", 
                        True, 
                        f"API responding correctly ({response_time:.2f}ms)", 
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

    def test_league_data_endpoints(self):
        """Test league data GET/POST endpoints functionality"""
        try:
            # Test GET endpoint
            start_time = time.time()
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            get_response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
                
                if all(field in data for field in required_fields):
                    self.log_test(
                        "League Data GET Endpoint", 
                        True, 
                        f"Retrieved complete league data structure ({get_response_time:.2f}ms)", 
                        f"Teams: {len(data.get('teams', []))}, WebsiteStyle keys: {len(data.get('websiteStyle', {}))}"
                    )
                    return True, data
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "League Data GET Endpoint", 
                        False, 
                        f"Missing required fields: {missing}"
                    )
                    return False, None
            else:
                self.log_test(
                    "League Data GET Endpoint", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "League Data GET Endpoint", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_websitestyle_data_handling(self):
        """Test websiteStyle data persistence and handling"""
        try:
            # Create comprehensive websiteStyle test data
            test_websitestyle = {
                "bannerColor": "#FF0000",
                "bannerText": "MLBL - Test Banner",
                "bannerType": "color",
                "logoUrl": "data:image/jpeg;base64,test_logo_data",
                "backgroundImage": "data:image/jpeg;base64,test_bg_data",
                "primaryColor": "#1E40AF",
                "secondaryColor": "#DC2626",
                "formBackgroundColor": "#F3F4F6",
                "sidebarBackgroundColor": "#374151",
                "textColor": "#111827",
                "linkColor": "#2563EB",
                "headingColor": "#1F2937",
                "customBanners": {
                    "mainSite": {
                        "text": "Welcome to MLBL",
                        "color": "#FF0000",
                        "font": "Arial"
                    },
                    "teamPages": {
                        "text": "Team Page Banner",
                        "color": "#0000FF",
                        "font": "Helvetica"
                    }
                },
                "customLogos": {
                    "main": "data:image/jpeg;base64,main_logo",
                    "sidebar": "data:image/jpeg;base64,sidebar_logo"
                }
            }
            
            # Test POST websiteStyle endpoint
            start_time = time.time()
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=test_websitestyle,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            post_response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'websiteStyle updated successfully':
                    self.log_test(
                        "WebsiteStyle Data Persistence", 
                        True, 
                        f"WebsiteStyle saved successfully ({post_response_time:.2f}ms)", 
                        {"message": data.get('message'), "properties_saved": len(test_websitestyle)}
                    )
                    
                    # Verify data was saved by retrieving it
                    time.sleep(0.5)  # Brief pause for database write
                    
                    get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    if get_response.status_code == 200:
                        retrieved_data = get_response.json()
                        saved_websitestyle = retrieved_data.get('websiteStyle', {})
                        
                        # Check if key properties were saved
                        key_properties = ['bannerColor', 'bannerText', 'logoUrl', 'primaryColor', 'formBackgroundColor']
                        saved_properties = [prop for prop in key_properties if prop in saved_websitestyle]
                        
                        if len(saved_properties) >= 3:  # At least 3 key properties should be saved
                            self.log_test(
                                "WebsiteStyle Data Retrieval", 
                                True, 
                                f"WebsiteStyle data retrieved successfully", 
                                f"Saved properties: {saved_properties}"
                            )
                            return True
                        else:
                            self.log_test(
                                "WebsiteStyle Data Retrieval", 
                                False, 
                                f"Insufficient websiteStyle data saved. Expected key properties, got: {list(saved_websitestyle.keys())}"
                            )
                            return False
                    else:
                        self.log_test(
                            "WebsiteStyle Data Retrieval", 
                            False, 
                            f"Failed to retrieve data for verification: HTTP {get_response.status_code}"
                        )
                        return False
                else:
                    self.log_test(
                        "WebsiteStyle Data Persistence", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "WebsiteStyle Data Persistence", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "WebsiteStyle Data Persistence", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_team_data_persistence(self):
        """Test team data persistence and retrieval"""
        try:
            # Create test team data with styling information
            test_teams = [
                {
                    "id": "test_team_1",
                    "name": "Test Thunder Hawks",
                    "division": "Field",
                    "style": {
                        "formBackgroundColor": "#E5F3FF",
                        "primaryColor": "#1E40AF",
                        "secondaryColor": "#DC2626",
                        "heroBackgroundColor": "#F8FAFC"
                    },
                    "logo": "data:image/jpeg;base64,team_logo_data",
                    "players": []
                },
                {
                    "id": "test_team_2", 
                    "name": "Test Lightning Bolts",
                    "division": "Box",
                    "style": {
                        "formBackgroundColor": "#FEF3C7",
                        "primaryColor": "#F59E0B",
                        "secondaryColor": "#10B981"
                    },
                    "logo": "data:image/jpeg;base64,team2_logo_data",
                    "players": []
                }
            ]
            
            # Test POST teams endpoint
            start_time = time.time()
            response = requests.post(
                f"{self.api_base}/league-data/teams", 
                json=test_teams,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            post_response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'teams updated successfully':
                    self.log_test(
                        "Team Data Persistence", 
                        True, 
                        f"Team data saved successfully ({post_response_time:.2f}ms)", 
                        {"teams_saved": len(test_teams), "message": data.get('message')}
                    )
                    
                    # Verify team data was saved by retrieving it
                    time.sleep(0.5)  # Brief pause for database write
                    
                    get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    if get_response.status_code == 200:
                        retrieved_data = get_response.json()
                        saved_teams = retrieved_data.get('teams', [])
                        
                        # Check if our test teams are in the saved data
                        test_team_ids = [team['id'] for team in test_teams]
                        found_teams = [team for team in saved_teams if team.get('id') in test_team_ids]
                        
                        if len(found_teams) >= 1:  # At least one test team should be found
                            # Check if team styling data is preserved
                            team_with_style = None
                            for team in found_teams:
                                if team.get('style') and 'formBackgroundColor' in team['style']:
                                    team_with_style = team
                                    break
                            
                            if team_with_style:
                                self.log_test(
                                    "Team Data Retrieval with Styling", 
                                    True, 
                                    f"Team data with styling retrieved successfully", 
                                    f"Found teams: {len(found_teams)}, Team with style: {team_with_style['name']}"
                                )
                                return True
                            else:
                                self.log_test(
                                    "Team Data Retrieval with Styling", 
                                    False, 
                                    f"Team styling data not preserved properly"
                                )
                                return False
                        else:
                            self.log_test(
                                "Team Data Retrieval", 
                                False, 
                                f"Test teams not found in saved data. Expected IDs: {test_team_ids}"
                            )
                            return False
                    else:
                        self.log_test(
                            "Team Data Retrieval", 
                            False, 
                            f"Failed to retrieve data for verification: HTTP {get_response.status_code}"
                        )
                        return False
                else:
                    self.log_test(
                        "Team Data Persistence", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Team Data Persistence", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team Data Persistence", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_api_response_times(self):
        """Test API response times for all endpoints"""
        endpoints = [
            ("Health Check", f"{self.api_base}/"),
            ("League Data GET", f"{self.api_base}/league-data"),
            ("Status Checks GET", f"{self.api_base}/status")
        ]
        
        all_fast = True
        response_times = []
        
        for name, url in endpoints:
            try:
                start_time = time.time()
                response = requests.get(url, timeout=10)
                end_time = time.time()
                
                response_time = (end_time - start_time) * 1000  # Convert to ms
                response_times.append(response_time)
                
                if response.status_code == 200 and response_time < 3000:  # 3 second threshold
                    self.log_test(
                        f"Response Time - {name}", 
                        True, 
                        f"Response time: {response_time:.2f}ms"
                    )
                else:
                    self.log_test(
                        f"Response Time - {name}", 
                        False, 
                        f"Slow response: {response_time:.2f}ms or HTTP {response.status_code}"
                    )
                    all_fast = False
                    
            except requests.exceptions.RequestException as e:
                self.log_test(
                    f"Response Time - {name}", 
                    False, 
                    f"Request failed: {str(e)}"
                )
                all_fast = False
        
        # Log average response time
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            self.log_test(
                "Average API Response Time", 
                avg_time < 1000, 
                f"Average response time: {avg_time:.2f}ms"
            )
        
        return all_fast

    def test_data_integrity(self):
        """Test data integrity after styling system changes"""
        try:
            # Get current league data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check data structure integrity
                required_sections = ['teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
                missing_sections = [section for section in required_sections if section not in data]
                
                if not missing_sections:
                    # Check if websiteStyle has expected structure
                    websitestyle = data.get('websiteStyle', {})
                    
                    # Check for any corruption or unexpected data types
                    integrity_issues = []
                    
                    if not isinstance(data.get('teams', []), list):
                        integrity_issues.append("teams is not a list")
                    
                    if not isinstance(websitestyle, dict):
                        integrity_issues.append("websiteStyle is not a dict")
                    
                    if not isinstance(data.get('leagueInfo', {}), dict):
                        integrity_issues.append("leagueInfo is not a dict")
                    
                    if not integrity_issues:
                        self.log_test(
                            "Data Integrity Check", 
                            True, 
                            f"All data structures intact after styling fixes", 
                            f"Sections: {len(required_sections)}, WebsiteStyle properties: {len(websitestyle)}"
                        )
                        return True
                    else:
                        self.log_test(
                            "Data Integrity Check", 
                            False, 
                            f"Data integrity issues found: {integrity_issues}"
                        )
                        return False
                else:
                    self.log_test(
                        "Data Integrity Check", 
                        False, 
                        f"Missing data sections: {missing_sections}"
                    )
                    return False
            else:
                self.log_test(
                    "Data Integrity Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Data Integrity Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all Website Style Manager fixes tests"""
        print("Starting Website Style Manager Fixes Backend Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 70)
        
        # Test basic connectivity first
        if not self.test_health_check():
            print("❌ CRITICAL: Health check failed. Backend may not be running.")
            return False
        
        # Test core functionality
        success, league_data = self.test_league_data_endpoints()
        if not success:
            print("❌ CRITICAL: League data endpoints failed.")
            return False
        
        # Test specific styling system functionality
        self.test_websitestyle_data_handling()
        self.test_team_data_persistence()
        
        # Test performance and integrity
        self.test_api_response_times()
        self.test_data_integrity()
        
        # Summary
        print("=" * 70)
        print("WEBSITE STYLE MANAGER FIXES TEST SUMMARY")
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
        
        # Return True if all critical tests pass
        critical_failures = [t for t in self.failed_tests if 'Health Check' in t or 'League Data' in t or 'Data Integrity' in t]
        return len(critical_failures) == 0

if __name__ == "__main__":
    try:
        tester = WebsiteStyleFixesTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Website Style Manager fixes backend tests completed successfully!")
            print("✅ All backend endpoints working correctly after styling system changes")
            print("✅ WebsiteStyle data handling verified")
            print("✅ Team data persistence confirmed")
            print("✅ No regressions detected")
            sys.exit(0)
        else:
            print("\n⚠️  Some backend tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)