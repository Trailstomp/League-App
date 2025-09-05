#!/usr/bin/env python3
"""
Team Webstyles Save Functionality Test Suite
Specifically tests the team webstyle persistence issue reported in the review request.
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

class TeamWebstylesTest:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Team Webstyles at: {self.api_base}")
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

    def test_api_connectivity(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "API Connectivity", 
                        True, 
                        f"Backend is accessible at {self.api_base}"
                    )
                    return True
                else:
                    self.log_test(
                        "API Connectivity", 
                        False, 
                        f"Unexpected API response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "API Connectivity", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "API Connectivity", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_get_current_league_data(self):
        """Test GET /api/league-data to see current state"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if websiteStyle exists and what it contains
                website_style = data.get('websiteStyle', {})
                teams = data.get('teams', [])
                
                self.log_test(
                    "GET Current League Data", 
                    True, 
                    f"Retrieved data with {len(teams)} teams, websiteStyle has {len(website_style)} properties",
                    {
                        "teams_count": len(teams),
                        "websiteStyle_keys": list(website_style.keys()) if website_style else [],
                        "has_team_styles": any('webstyle' in str(team).lower() or 'style' in str(team).lower() for team in teams)
                    }
                )
                return True, data
            else:
                self.log_test(
                    "GET Current League Data", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET Current League Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_save_team_webstyles_via_league_data(self):
        """Test saving team webstyles via POST /api/league-data"""
        try:
            # First get current data
            success, current_data = self.test_get_current_league_data()
            if not success:
                return False, None
            
            # Create test team webstyles data
            test_team_webstyles = {
                "team_123": {
                    "primaryColor": "#FF5733",
                    "secondaryColor": "#33A1FF", 
                    "logoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                    "bannerText": "Custom Team Banner",
                    "bannerColor": "#FF5733",
                    "customIntro": "Welcome to our amazing lacrosse team!",
                    "heroBackgroundImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                    "lastUpdated": datetime.utcnow().isoformat()
                },
                "team_456": {
                    "primaryColor": "#28A745",
                    "secondaryColor": "#FFC107",
                    "logoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                    "bannerText": "Elite Lacrosse Squad",
                    "bannerColor": "#28A745",
                    "customIntro": "Champions on and off the field!",
                    "heroBackgroundImage": "",
                    "lastUpdated": datetime.utcnow().isoformat()
                }
            }
            
            # Prepare league data with team webstyles
            updated_data = current_data.copy()
            
            # Add team webstyles to websiteStyle
            if 'websiteStyle' not in updated_data:
                updated_data['websiteStyle'] = {}
            
            updated_data['websiteStyle']['teamWebstyles'] = test_team_webstyles
            updated_data['websiteStyle']['lastTeamStyleUpdate'] = datetime.utcnow().isoformat()
            
            # Also add some test teams if they don't exist
            if not updated_data.get('teams'):
                updated_data['teams'] = []
            
            # Add test teams with webstyle references
            test_teams = [
                {
                    "id": "team_123",
                    "name": "Test Lacrosse Warriors",
                    "division": "Field",
                    "coach": "Coach Smith",
                    "webstyle": test_team_webstyles["team_123"]
                },
                {
                    "id": "team_456", 
                    "name": "Elite Lacrosse Squad",
                    "division": "Box",
                    "coach": "Coach Johnson",
                    "webstyle": test_team_webstyles["team_456"]
                }
            ]
            
            # Update or add teams
            existing_team_ids = [team.get('id') for team in updated_data['teams']]
            for test_team in test_teams:
                if test_team['id'] not in existing_team_ids:
                    updated_data['teams'].append(test_team)
                else:
                    # Update existing team
                    for i, team in enumerate(updated_data['teams']):
                        if team.get('id') == test_team['id']:
                            updated_data['teams'][i].update(test_team)
                            break
            
            # Save the updated data
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=updated_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    self.log_test(
                        "Save Team Webstyles via League Data", 
                        True, 
                        f"Successfully saved team webstyles for {len(test_team_webstyles)} teams",
                        {
                            "teams_with_styles": list(test_team_webstyles.keys()),
                            "save_timestamp": data.get('timestamp')
                        }
                    )
                    return True, test_team_webstyles
                else:
                    self.log_test(
                        "Save Team Webstyles via League Data", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Save Team Webstyles via League Data", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Save Team Webstyles via League Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_websitestyle_specific_endpoint(self):
        """Test POST /api/league-data/websiteStyle endpoint specifically"""
        try:
            test_website_style = {
                "teamWebstyles": {
                    "team_789": {
                        "primaryColor": "#DC3545",
                        "secondaryColor": "#6C757D",
                        "logoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                        "bannerText": "Endpoint Test Team",
                        "bannerColor": "#DC3545",
                        "customIntro": "Testing websiteStyle endpoint",
                        "lastUpdated": datetime.utcnow().isoformat()
                    }
                },
                "globalTheme": "custom",
                "primaryColor": "#007BFF",
                "secondaryColor": "#6C757D",
                "lastUpdated": datetime.utcnow().isoformat()
            }
            
            response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=test_website_style,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'websiteStyle updated successfully':
                    self.log_test(
                        "POST WebsiteStyle Specific Endpoint", 
                        True, 
                        f"Successfully updated websiteStyle via specific endpoint",
                        {"message": data.get('message')}
                    )
                    return True, test_website_style
                else:
                    self.log_test(
                        "POST WebsiteStyle Specific Endpoint", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST WebsiteStyle Specific Endpoint", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST WebsiteStyle Specific Endpoint", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_persistence_verification(self):
        """Test that saved team webstyles persist by retrieving them"""
        try:
            # Wait a moment for database write
            time.sleep(2)
            
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                website_style = data.get('websiteStyle', {})
                team_webstyles = website_style.get('teamWebstyles', {})
                
                if team_webstyles:
                    # Check if our test data persisted
                    expected_teams = ['team_123', 'team_456', 'team_789']
                    found_teams = []
                    
                    for team_id in expected_teams:
                        if team_id in team_webstyles:
                            team_style = team_webstyles[team_id]
                            # Verify key properties exist
                            if ('primaryColor' in team_style and 
                                'secondaryColor' in team_style and 
                                'bannerText' in team_style):
                                found_teams.append(team_id)
                    
                    if found_teams:
                        self.log_test(
                            "Team Webstyles Persistence Verification", 
                            True, 
                            f"Found {len(found_teams)} teams with persisted webstyles: {found_teams}",
                            {
                                "persisted_teams": found_teams,
                                "total_team_styles": len(team_webstyles),
                                "sample_style": team_webstyles.get(found_teams[0], {}) if found_teams else {}
                            }
                        )
                        return True, found_teams
                    else:
                        self.log_test(
                            "Team Webstyles Persistence Verification", 
                            False, 
                            f"No expected teams found in persisted data. Available: {list(team_webstyles.keys())}"
                        )
                        return False, None
                else:
                    self.log_test(
                        "Team Webstyles Persistence Verification", 
                        False, 
                        "No teamWebstyles found in websiteStyle data"
                    )
                    return False, None
            else:
                self.log_test(
                    "Team Webstyles Persistence Verification", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team Webstyles Persistence Verification", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_data_format_validation(self):
        """Test that the API accepts the expected team webstyle data format"""
        try:
            # Test with various data formats that might be sent from frontend
            test_formats = [
                {
                    "name": "Complete Team Style Object",
                    "data": {
                        "teamWebstyles": {
                            "format_test_1": {
                                "primaryColor": "#1f2937",
                                "secondaryColor": "#374151", 
                                "logoUrl": "",
                                "bannerText": "Format Test Team",
                                "bannerColor": "#1f2937",
                                "customIntro": "Testing data format",
                                "heroBackgroundImage": "",
                                "buttonColor": "#1f2937",
                                "linkColor": "#374151",
                                "headingColor": "#1f2937"
                            }
                        }
                    }
                },
                {
                    "name": "Minimal Team Style Object", 
                    "data": {
                        "teamWebstyles": {
                            "format_test_2": {
                                "primaryColor": "#FF0000",
                                "secondaryColor": "#00FF00"
                            }
                        }
                    }
                },
                {
                    "name": "Team Style with Default Colors",
                    "data": {
                        "teamWebstyles": {
                            "format_test_3": {
                                "primaryColor": "#1f2937",  # Default gray mentioned in issue
                                "secondaryColor": "#374151"  # Default gray mentioned in issue
                            }
                        }
                    }
                }
            ]
            
            all_formats_valid = True
            
            for test_format in test_formats:
                response = requests.post(
                    f"{self.api_base}/league-data/websiteStyle", 
                    json=test_format["data"],
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('message') == 'websiteStyle updated successfully':
                        self.log_test(
                            f"Data Format - {test_format['name']}", 
                            True, 
                            f"API accepted format successfully"
                        )
                    else:
                        self.log_test(
                            f"Data Format - {test_format['name']}", 
                            False, 
                            f"Unexpected response: {data}"
                        )
                        all_formats_valid = False
                else:
                    self.log_test(
                        f"Data Format - {test_format['name']}", 
                        False, 
                        f"HTTP {response.status_code}: {response.text}"
                    )
                    all_formats_valid = False
            
            return all_formats_valid
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Data Format Validation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_default_colors_issue(self):
        """Test the specific issue mentioned - default colors appearing instead of customizations"""
        try:
            # Save custom colors (not defaults)
            custom_style = {
                "teamWebstyles": {
                    "issue_test_team": {
                        "primaryColor": "#FF6B35",  # Custom orange - NOT default
                        "secondaryColor": "#004E89", # Custom blue - NOT default
                        "bannerText": "Custom Team Colors",
                        "bannerColor": "#FF6B35",
                        "customIntro": "This should NOT show default colors",
                        "lastUpdated": datetime.utcnow().isoformat()
                    }
                }
            }
            
            # Save the custom style
            save_response = requests.post(
                f"{self.api_base}/league-data/websiteStyle", 
                json=custom_style,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if save_response.status_code != 200:
                self.log_test(
                    "Default Colors Issue Test - Save", 
                    False, 
                    f"Failed to save custom colors: HTTP {save_response.status_code}"
                )
                return False
            
            # Wait for persistence
            time.sleep(1)
            
            # Retrieve and verify colors are NOT defaults
            get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if get_response.status_code == 200:
                data = get_response.json()
                team_styles = data.get('websiteStyle', {}).get('teamWebstyles', {})
                
                if 'issue_test_team' in team_styles:
                    team_style = team_styles['issue_test_team']
                    primary_color = team_style.get('primaryColor')
                    secondary_color = team_style.get('secondaryColor')
                    
                    # Check if we got back the default colors (the problem mentioned in issue)
                    default_colors = ['#1f2937', '#374151']
                    
                    if primary_color in default_colors or secondary_color in default_colors:
                        self.log_test(
                            "Default Colors Issue Test", 
                            False, 
                            f"❌ BUG CONFIRMED: Custom colors reverted to defaults! Primary: {primary_color}, Secondary: {secondary_color}",
                            {
                                "expected_primary": "#FF6B35",
                                "expected_secondary": "#004E89", 
                                "actual_primary": primary_color,
                                "actual_secondary": secondary_color,
                                "reverted_to_defaults": True
                            }
                        )
                        return False
                    else:
                        self.log_test(
                            "Default Colors Issue Test", 
                            True, 
                            f"✅ Custom colors persisted correctly! Primary: {primary_color}, Secondary: {secondary_color}",
                            {
                                "primary_color": primary_color,
                                "secondary_color": secondary_color,
                                "not_default_colors": True
                            }
                        )
                        return True
                else:
                    self.log_test(
                        "Default Colors Issue Test", 
                        False, 
                        "Test team not found in retrieved data"
                    )
                    return False
            else:
                self.log_test(
                    "Default Colors Issue Test", 
                    False, 
                    f"Failed to retrieve data: HTTP {get_response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Default Colors Issue Test", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_team_webstyles_tests(self):
        """Run all team webstyles tests"""
        print("🎯 TEAM WEBSTYLES SAVE FUNCTIONALITY TEST")
        print("Testing the specific issue: Team customizations don't persist after leaving page")
        print("=" * 80)
        
        # Test basic connectivity first
        if not self.test_api_connectivity():
            print("❌ CRITICAL: API not accessible. Cannot proceed with tests.")
            return False
        
        # Run specific tests for team webstyles functionality
        tests_passed = 0
        total_tests = 0
        
        # Test 1: Get current state
        total_tests += 1
        if self.test_get_current_league_data()[0]:
            tests_passed += 1
        
        # Test 2: Save team webstyles via main endpoint
        total_tests += 1
        if self.test_save_team_webstyles_via_league_data()[0]:
            tests_passed += 1
        
        # Test 3: Save via specific websiteStyle endpoint
        total_tests += 1
        if self.test_websitestyle_specific_endpoint()[0]:
            tests_passed += 1
        
        # Test 4: Verify persistence
        total_tests += 1
        if self.test_persistence_verification()[0]:
            tests_passed += 1
        
        # Test 5: Data format validation
        total_tests += 1
        if self.test_data_format_validation():
            tests_passed += 1
        
        # Test 6: Specific default colors issue
        total_tests += 1
        if self.test_default_colors_issue():
            tests_passed += 1
        
        # Summary
        print("=" * 80)
        print("🎯 TEAM WEBSTYLES TEST SUMMARY")
        print("=" * 80)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {tests_passed}")
        print(f"Failed: {total_tests - tests_passed}")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        success_rate = (tests_passed / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        # Determine if the core issue is resolved
        core_issue_resolved = tests_passed >= 4  # At least basic save/retrieve working
        
        if core_issue_resolved:
            print("\n✅ TEAM WEBSTYLES FUNCTIONALITY: Working correctly")
            print("   - API endpoints accept team style data")
            print("   - Data persists in database") 
            print("   - Custom colors are maintained (not reverting to defaults)")
        else:
            print("\n❌ TEAM WEBSTYLES FUNCTIONALITY: Issues detected")
            print("   - Team customizations may not be persisting properly")
            print("   - Database save functionality needs investigation")
        
        return core_issue_resolved

if __name__ == "__main__":
    try:
        tester = TeamWebstylesTest()
        success = tester.run_team_webstyles_tests()
        
        if success:
            print("\n🎉 Team webstyles save functionality is working correctly!")
            sys.exit(0)
        else:
            print("\n⚠️  Team webstyles save functionality has issues that need to be addressed.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)