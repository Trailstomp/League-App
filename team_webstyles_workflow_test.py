#!/usr/bin/env python3
"""
Team Webstyles Workflow Test - Simulates the actual frontend save process
Tests the complete workflow that the user experiences when saving team styles
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

class TeamWebstylesWorkflowTest:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🔍 TEAM WEBSTYLES WORKFLOW TEST")
        print(f"Simulating the actual frontend save process")
        print(f"Backend: {self.api_base}")
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

    def setup_realistic_league_data(self):
        """Set up realistic league data that matches what the frontend would have"""
        try:
            realistic_data = {
                "id": "main_league",
                "teams": [
                    {
                        "id": "team_oh10",
                        "name": "OH10 Lacrosse",
                        "division": "Field",
                        "coach": "Coach Smith",
                        "homeField": "Main Field",
                        "logo": "",
                        "contactEmail": "coach@oh10lacrosse.com",
                        "active": True,
                        "wins": 5,
                        "losses": 2,
                        "ties": 0,
                        "style": {
                            "primaryColor": "#1f2937",  # Default gray - the problem!
                            "secondaryColor": "#374151"  # Default gray - the problem!
                        }
                    },
                    {
                        "id": "team_american_dads",
                        "name": "American Dads",
                        "division": "Field", 
                        "coach": "Coach Johnson",
                        "homeField": "Field 2",
                        "logo": "",
                        "contactEmail": "coach@americandads.com",
                        "active": True,
                        "wins": 3,
                        "losses": 4,
                        "ties": 1,
                        "style": {
                            "primaryColor": "#1f2937",  # Default gray - the problem!
                            "secondaryColor": "#374151"  # Default gray - the problem!
                        }
                    }
                ],
                "players": [
                    {
                        "id": "player_1",
                        "name": "John Smith",
                        "teamId": "team_oh10",
                        "position": "Attack",
                        "jerseyNumber": 10,
                        "email": "john@example.com",
                        "active": True
                    },
                    {
                        "id": "player_2", 
                        "name": "Mike Johnson",
                        "teamId": "team_american_dads",
                        "position": "Midfield",
                        "jerseyNumber": 15,
                        "email": "mike@example.com",
                        "active": True
                    }
                ],
                "users": [
                    {
                        "id": "user_admin",
                        "name": "Admin User",
                        "email": "admin@mlbl.org",
                        "role": "admin",
                        "status": "active"
                    }
                ],
                "newsItems": [
                    {
                        "id": "news_1",
                        "heading": "Season Opener",
                        "text": "Great start to the season!",
                        "comments": "Exciting games ahead",
                        "image": "",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                ],
                "gameTickerData": [
                    {
                        "id": "game_1",
                        "homeTeam": "OH10 Lacrosse",
                        "awayTeam": "American Dads",
                        "date": "2024-09-15",
                        "time": "2:00 PM",
                        "status": "Scheduled"
                    }
                ],
                "leagueSchedule": [
                    {
                        "id": "event_1",
                        "title": "Season Opener",
                        "date": "2024-09-15",
                        "time": "2:00 PM",
                        "location": "Main Field",
                        "teamIds": ["team_oh10", "team_american_dads"]
                    }
                ],
                "leagueInfo": {
                    "name": "Midwest Lacrosse Business League",
                    "season": "2024",
                    "commissioner": "League Commissioner",
                    "website": "https://mlbl.org"
                },
                "websiteStyle": {
                    "theme": "professional",
                    "primaryColor": "#007BFF",
                    "secondaryColor": "#6C757D",
                    "logoUrl": "",
                    "bannerText": "MLBL - Midwest Lacrosse Business League",
                    "bannerColor": "#007BFF",
                    "backgroundImage": "",
                    "teamWebstyles": {}  # This is where team-specific styles should go
                },
                "lastUpdated": datetime.utcnow()
            }
            
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=realistic_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                self.log_test(
                    "Setup Realistic League Data", 
                    True, 
                    f"Created realistic league with {len(realistic_data['teams'])} teams, {len(realistic_data['players'])} players",
                    {"teams": len(realistic_data['teams']), "players": len(realistic_data['players'])}
                )
                return True, realistic_data
            else:
                self.log_test(
                    "Setup Realistic League Data", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Setup Realistic League Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def simulate_user_customization(self):
        """Simulate a user customizing team webstyles in the admin interface"""
        try:
            # Get current league data (what frontend would do)
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code != 200:
                self.log_test(
                    "Simulate User Customization - Get Data", 
                    False, 
                    f"Failed to get league data: HTTP {response.status_code}"
                )
                return False, None
            
            current_data = response.json()
            
            # Simulate user customizing OH10 Lacrosse team colors
            # User changes from default grays to custom team colors
            custom_team_style = {
                "primaryColor": "#FF6B35",      # Custom orange
                "secondaryColor": "#004E89",    # Custom blue  
                "bannerText": "OH10 Lacrosse - Champions",
                "bannerColor": "#FF6B35",
                "customIntro": "Welcome to OH10 Lacrosse - Where champions are made!",
                "heroBackgroundImage": "",
                "buttonColor": "#FF6B35",
                "linkColor": "#004E89",
                "headingColor": "#FF6B35",
                "fontFamily": "Inter, sans-serif",
                "lastUpdated": datetime.utcnow().isoformat()
            }
            
            # Update the team in the teams array (what frontend does)
            updated_teams = []
            for team in current_data.get('teams', []):
                if team.get('id') == 'team_oh10':
                    # User customizes this team
                    team['style'] = custom_team_style
                    team['customIntro'] = custom_team_style['customIntro']
                updated_teams.append(team)
            
            # This is the CRITICAL ISSUE: Frontend only sends teams + websiteStyle
            # It doesn't send players, users, newsItems, etc. - causing data loss!
            frontend_save_data = {
                "teams": updated_teams,
                "websiteStyle": current_data.get('websiteStyle', {})
            }
            
            self.log_test(
                "Simulate User Customization - Prepare Data", 
                True, 
                f"User customized team 'team_oh10' with colors {custom_team_style['primaryColor']}, {custom_team_style['secondaryColor']}",
                {
                    "customized_team": "team_oh10",
                    "new_colors": [custom_team_style['primaryColor'], custom_team_style['secondaryColor']],
                    "frontend_data_keys": list(frontend_save_data.keys()),
                    "missing_data": ["players", "users", "newsItems", "gameTickerData", "leagueSchedule", "leagueInfo"]
                }
            )
            
            return True, (frontend_save_data, custom_team_style)
            
        except Exception as e:
            self.log_test(
                "Simulate User Customization - Prepare Data", 
                False, 
                f"Error: {str(e)}"
            )
            return False, None

    def test_frontend_save_behavior(self, frontend_save_data, expected_style):
        """Test what happens when frontend saves data (the problematic behavior)"""
        try:
            # This simulates the exact POST request the frontend makes
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=frontend_save_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                # Wait for database write
                time.sleep(1)
                
                # Check what actually got saved
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    saved_data = get_response.json()
                    
                    # Check if other data was lost
                    data_loss_detected = False
                    lost_data = []
                    
                    for key in ['players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo']:
                        if not saved_data.get(key):
                            data_loss_detected = True
                            lost_data.append(key)
                    
                    # Check if team style was saved correctly
                    team_style_saved = False
                    team_oh10 = None
                    for team in saved_data.get('teams', []):
                        if team.get('id') == 'team_oh10':
                            team_oh10 = team
                            team_style = team.get('style', {})
                            if (team_style.get('primaryColor') == expected_style['primaryColor'] and 
                                team_style.get('secondaryColor') == expected_style['secondaryColor']):
                                team_style_saved = True
                            break
                    
                    if data_loss_detected:
                        self.log_test(
                            "Frontend Save Behavior - Data Loss Check", 
                            False, 
                            f"❌ CRITICAL BUG: Frontend save caused data loss! Lost: {lost_data}",
                            {
                                "lost_data_types": lost_data,
                                "team_style_saved": team_style_saved,
                                "team_colors": team_oh10.get('style', {}) if team_oh10 else None
                            }
                        )
                        return False
                    else:
                        self.log_test(
                            "Frontend Save Behavior - Data Loss Check", 
                            True, 
                            f"✅ No data loss detected, team style saved: {team_style_saved}",
                            {
                                "team_style_saved": team_style_saved,
                                "team_colors": team_oh10.get('style', {}) if team_oh10 else None
                            }
                        )
                        return team_style_saved
                else:
                    self.log_test(
                        "Frontend Save Behavior - Verification", 
                        False, 
                        f"Failed to verify save: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Frontend Save Behavior - Save Request", 
                    False, 
                    f"Save failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Frontend Save Behavior", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_correct_save_approach(self):
        """Test the correct way to save team styles without data loss"""
        try:
            # Get ALL current data first
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code != 200:
                self.log_test(
                    "Correct Save Approach - Get Full Data", 
                    False, 
                    f"Failed to get data: HTTP {response.status_code}"
                )
                return False
            
            full_data = response.json()
            
            # Update team style in the complete data structure
            custom_team_style = {
                "primaryColor": "#28A745",      # Green
                "secondaryColor": "#FFC107",    # Yellow
                "bannerText": "American Dads - Team Spirit",
                "bannerColor": "#28A745",
                "customIntro": "American Dads - Playing with heart and soul!",
                "heroBackgroundImage": "",
                "buttonColor": "#28A745",
                "linkColor": "#FFC107",
                "headingColor": "#28A745",
                "fontFamily": "Inter, sans-serif",
                "lastUpdated": datetime.utcnow().isoformat()
            }
            
            # Update the team in the full data structure
            for team in full_data.get('teams', []):
                if team.get('id') == 'team_american_dads':
                    team['style'] = custom_team_style
                    team['customIntro'] = custom_team_style['customIntro']
                    break
            
            # Save the COMPLETE data structure (not just teams + websiteStyle)
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=full_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                # Verify the save
                time.sleep(1)
                get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if get_response.status_code == 200:
                    saved_data = get_response.json()
                    
                    # Check that no data was lost
                    all_data_preserved = True
                    for key in ['players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo']:
                        if not saved_data.get(key):
                            all_data_preserved = False
                            break
                    
                    # Check team style was saved
                    team_style_saved = False
                    for team in saved_data.get('teams', []):
                        if team.get('id') == 'team_american_dads':
                            team_style = team.get('style', {})
                            if (team_style.get('primaryColor') == custom_team_style['primaryColor'] and 
                                team_style.get('secondaryColor') == custom_team_style['secondaryColor']):
                                team_style_saved = True
                            break
                    
                    if all_data_preserved and team_style_saved:
                        self.log_test(
                            "Correct Save Approach", 
                            True, 
                            f"✅ Team style saved correctly without data loss",
                            {
                                "all_data_preserved": all_data_preserved,
                                "team_style_saved": team_style_saved,
                                "team_colors": [custom_team_style['primaryColor'], custom_team_style['secondaryColor']]
                            }
                        )
                        return True
                    else:
                        self.log_test(
                            "Correct Save Approach", 
                            False, 
                            f"Issues detected: data_preserved={all_data_preserved}, style_saved={team_style_saved}"
                        )
                        return False
                else:
                    self.log_test(
                        "Correct Save Approach - Verification", 
                        False, 
                        f"Failed to verify: HTTP {get_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Correct Save Approach - Save", 
                    False, 
                    f"Save failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Correct Save Approach", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_persistence_after_reload(self):
        """Test that team styles persist after simulating page reload"""
        try:
            # Simulate page reload by getting fresh data
            time.sleep(2)  # Simulate time passing
            
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                
                # Check if custom colors persist (not reverting to defaults)
                persistent_teams = []
                default_colors = ['#1f2937', '#374151']
                
                for team in teams:
                    team_style = team.get('style', {})
                    primary = team_style.get('primaryColor')
                    secondary = team_style.get('secondaryColor')
                    
                    # If team has custom colors (not defaults), it persisted
                    if primary and secondary and primary not in default_colors and secondary not in default_colors:
                        persistent_teams.append({
                            'id': team.get('id'),
                            'name': team.get('name'),
                            'colors': [primary, secondary]
                        })
                
                if persistent_teams:
                    self.log_test(
                        "Persistence After Reload", 
                        True, 
                        f"✅ {len(persistent_teams)} teams have persistent custom colors",
                        {
                            "persistent_teams": persistent_teams,
                            "not_reverting_to_defaults": True
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Persistence After Reload", 
                        False, 
                        f"❌ No teams have custom colors - all reverted to defaults!",
                        {
                            "all_teams_colors": [(t.get('id'), t.get('style', {}).get('primaryColor'), t.get('style', {}).get('secondaryColor')) for t in teams]
                        }
                    )
                    return False
            else:
                self.log_test(
                    "Persistence After Reload", 
                    False, 
                    f"Failed to get data: HTTP {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Persistence After Reload", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_workflow_tests(self):
        """Run the complete team webstyles workflow test"""
        print("🔍 TEAM WEBSTYLES WORKFLOW ANALYSIS")
        print("Investigating why team customizations don't persist after leaving page")
        print("=" * 80)
        
        tests_passed = 0
        total_tests = 0
        
        # Test 1: Setup realistic data
        total_tests += 1
        setup_success, _ = self.setup_realistic_league_data()
        if setup_success:
            tests_passed += 1
        
        # Test 2: Simulate user customization
        total_tests += 1
        customization_success, customization_data = self.simulate_user_customization()
        if customization_success:
            tests_passed += 1
        
        # Test 3: Test frontend save behavior (the problematic part)
        if customization_success:
            total_tests += 1
            frontend_save_data, expected_style = customization_data
            frontend_save_success = self.test_frontend_save_behavior(frontend_save_data, expected_style)
            if frontend_save_success:
                tests_passed += 1
        
        # Test 4: Test correct save approach
        total_tests += 1
        correct_save_success = self.test_correct_save_approach()
        if correct_save_success:
            tests_passed += 1
        
        # Test 5: Test persistence after reload
        total_tests += 1
        persistence_success = self.test_persistence_after_reload()
        if persistence_success:
            tests_passed += 1
        
        # Summary
        print("=" * 80)
        print("🔍 TEAM WEBSTYLES WORKFLOW ANALYSIS SUMMARY")
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
        
        # Root cause analysis
        print("\n" + "=" * 80)
        print("🔍 ROOT CAUSE ANALYSIS")
        print("=" * 80)
        
        if "Frontend Save Behavior - Data Loss Check" in self.failed_tests:
            print("❌ CRITICAL ISSUE IDENTIFIED:")
            print("   The frontend save function is causing data loss!")
            print("   - Frontend only sends 'teams' and 'websiteStyle' to API")
            print("   - This overwrites the entire league_data document")
            print("   - Other data (players, users, newsItems, etc.) gets lost")
            print("   - Team styles may appear to save but get lost when other data is restored")
            
            print("\n🔧 RECOMMENDED FIX:")
            print("   1. Frontend should GET complete league data before saving")
            print("   2. Update only the team styles in the complete data structure")
            print("   3. POST the complete data structure back to API")
            print("   4. OR use the specific /api/league-data/teams endpoint")
        
        elif tests_passed == total_tests:
            print("✅ TEAM WEBSTYLES FUNCTIONALITY WORKING:")
            print("   - API endpoints are functioning correctly")
            print("   - Data persistence is working")
            print("   - Team styles are not reverting to defaults")
            print("   - The issue may be in the frontend implementation")
        
        else:
            print("⚠️  MIXED RESULTS:")
            print("   - Some functionality working, some issues detected")
            print("   - Check individual test results above for details")
        
        return tests_passed >= (total_tests * 0.8)  # 80% success rate

if __name__ == "__main__":
    try:
        tester = TeamWebstylesWorkflowTest()
        success = tester.run_workflow_tests()
        
        if success:
            print("\n🎉 Team webstyles workflow analysis completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Team webstyles workflow has issues that need to be addressed.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)