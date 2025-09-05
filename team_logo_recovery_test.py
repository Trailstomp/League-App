#!/usr/bin/env python3
"""
Team Logo Recovery Testing Suite
Investigates team logo and webstyle data issues as reported in the review request.
"""

import requests
import json
import sys
import base64
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

class TeamLogoRecoveryTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🔍 TEAM LOGO RECOVERY INVESTIGATION")
        print(f"Testing backend at: {self.api_base}")
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

    def is_valid_base64_image(self, base64_string):
        """Check if a base64 string is valid image data"""
        try:
            # Remove data URL prefix if present
            if base64_string.startswith('data:image/'):
                base64_string = base64_string.split(',')[1]
            
            # Try to decode the base64
            decoded = base64.b64decode(base64_string)
            
            # Check for common image file signatures
            image_signatures = [
                b'\xff\xd8\xff',  # JPEG
                b'\x89PNG\r\n\x1a\n',  # PNG
                b'GIF87a',  # GIF87a
                b'GIF89a',  # GIF89a
                b'RIFF',  # WebP (starts with RIFF)
            ]
            
            for sig in image_signatures:
                if decoded.startswith(sig):
                    return True, f"Valid {sig} image data"
            
            # If no signature matches, it's likely not valid image data
            return False, f"No valid image signature found. First 20 bytes: {decoded[:20]}"
            
        except Exception as e:
            return False, f"Base64 decode error: {str(e)}"

    def investigate_current_team_data(self):
        """Investigate current team data in the database"""
        try:
            # Check league data for teams
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                
                print(f"📊 CURRENT TEAM DATA ANALYSIS")
                print(f"Found {len(teams)} teams in league data")
                print("-" * 40)
                
                logo_issues = []
                style_issues = []
                
                for i, team in enumerate(teams):
                    team_name = team.get('name', f'Team {i+1}')
                    team_logo = team.get('logo', '')
                    team_style = team.get('style', None)
                    
                    print(f"Team: {team_name}")
                    print(f"  Logo: {team_logo[:50]}{'...' if len(team_logo) > 50 else ''}")
                    print(f"  Style: {team_style}")
                    
                    # Check logo validity
                    if team_logo:
                        is_valid, validation_msg = self.is_valid_base64_image(team_logo)
                        print(f"  Logo Valid: {is_valid} - {validation_msg}")
                        
                        if not is_valid:
                            logo_issues.append({
                                'team': team_name,
                                'logo': team_logo,
                                'issue': validation_msg
                            })
                    else:
                        print(f"  Logo Valid: No logo data")
                        logo_issues.append({
                            'team': team_name,
                            'logo': '',
                            'issue': 'No logo data'
                        })
                    
                    # Check style validity
                    if team_style is None:
                        style_issues.append({
                            'team': team_name,
                            'style': team_style,
                            'issue': 'Style is null'
                        })
                    
                    print()
                
                # Summary
                self.log_test(
                    "Team Data Investigation", 
                    True, 
                    f"Analyzed {len(teams)} teams. Found {len(logo_issues)} logo issues, {len(style_issues)} style issues",
                    {
                        'total_teams': len(teams),
                        'logo_issues': len(logo_issues),
                        'style_issues': len(style_issues)
                    }
                )
                
                return True, {
                    'teams': teams,
                    'logo_issues': logo_issues,
                    'style_issues': style_issues
                }
            else:
                self.log_test(
                    "Team Data Investigation", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team Data Investigation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def check_dedicated_teams_collection(self):
        """Check the dedicated teams collection for backup data"""
        try:
            response = requests.get(f"{self.api_base}/teams", timeout=10)
            
            if response.status_code == 200:
                teams = response.json()
                
                print(f"📊 DEDICATED TEAMS COLLECTION ANALYSIS")
                print(f"Found {len(teams)} teams in dedicated collection")
                print("-" * 40)
                
                valid_logos = []
                invalid_logos = []
                
                for team in teams:
                    team_name = team.get('name', 'Unknown')
                    team_logo = team.get('logo', '')
                    
                    print(f"Team: {team_name}")
                    print(f"  Logo: {team_logo[:50]}{'...' if len(team_logo) > 50 else ''}")
                    
                    if team_logo:
                        is_valid, validation_msg = self.is_valid_base64_image(team_logo)
                        print(f"  Logo Valid: {is_valid} - {validation_msg}")
                        
                        if is_valid:
                            valid_logos.append({
                                'team': team_name,
                                'logo': team_logo,
                                'validation': validation_msg
                            })
                        else:
                            invalid_logos.append({
                                'team': team_name,
                                'logo': team_logo,
                                'issue': validation_msg
                            })
                    else:
                        print(f"  Logo Valid: No logo data")
                        invalid_logos.append({
                            'team': team_name,
                            'logo': '',
                            'issue': 'No logo data'
                        })
                    print()
                
                self.log_test(
                    "Dedicated Teams Collection Check", 
                    True, 
                    f"Found {len(valid_logos)} valid logos, {len(invalid_logos)} invalid/missing logos",
                    {
                        'total_teams': len(teams),
                        'valid_logos': len(valid_logos),
                        'invalid_logos': len(invalid_logos)
                    }
                )
                
                return True, {
                    'teams': teams,
                    'valid_logos': valid_logos,
                    'invalid_logos': invalid_logos
                }
            else:
                self.log_test(
                    "Dedicated Teams Collection Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Dedicated Teams Collection Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_logo_display_functionality(self):
        """Test if the backend can handle valid logo data properly"""
        try:
            # Create a simple test team with valid base64 image data
            # This is a minimal 1x1 pixel PNG image in base64
            valid_png_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
            
            test_team = {
                "name": "Logo Test Team",
                "division": "Field",
                "coach": "Test Coach",
                "logo": valid_png_base64,
                "contactEmail": "test@example.com",
                "active": True
            }
            
            # Create the test team
            response = requests.post(
                f"{self.api_base}/teams", 
                json=test_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                created_team = response.json()
                team_id = created_team.get('id')
                
                # Verify the logo was stored correctly
                is_valid, validation_msg = self.is_valid_base64_image(created_team.get('logo', ''))
                
                if is_valid:
                    self.log_test(
                        "Logo Display Functionality Test", 
                        True, 
                        f"Successfully created team with valid logo. {validation_msg}",
                        {
                            'team_id': team_id,
                            'logo_validation': validation_msg
                        }
                    )
                    
                    # Clean up - delete the test team
                    try:
                        delete_response = requests.delete(f"{self.api_base}/teams/{team_id}", timeout=10)
                        if delete_response.status_code == 200:
                            print(f"    ✅ Test team cleaned up successfully")
                        else:
                            print(f"    ⚠️  Failed to clean up test team: {delete_response.status_code}")
                    except:
                        print(f"    ⚠️  Failed to clean up test team")
                    
                    return True
                else:
                    self.log_test(
                        "Logo Display Functionality Test", 
                        False, 
                        f"Logo validation failed: {validation_msg}"
                    )
                    return False
            else:
                self.log_test(
                    "Logo Display Functionality Test", 
                    False, 
                    f"Failed to create test team: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Logo Display Functionality Test", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def check_backup_data(self):
        """Check if there are any backups that might contain valid team data"""
        try:
            # Try to get teams backup
            response = requests.get(f"{self.api_base}/backup/teams", timeout=10)
            
            if response.status_code == 200:
                backup_result = response.json()
                self.log_test(
                    "Teams Backup Check", 
                    True, 
                    f"Teams backup system is functional: {backup_result.get('message', 'Success')}",
                    backup_result
                )
                return True
            else:
                self.log_test(
                    "Teams Backup Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Teams Backup Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def analyze_specific_teams(self):
        """Analyze the specific teams mentioned in the review request"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                
                target_teams = [
                    "Updated Test Lacrosse Team",
                    "Elite Lacrosse Club"
                ]
                
                print(f"🎯 SPECIFIC TEAM ANALYSIS")
                print(f"Looking for teams: {', '.join(target_teams)}")
                print("-" * 40)
                
                found_teams = []
                for team in teams:
                    team_name = team.get('name', '')
                    if team_name in target_teams:
                        found_teams.append(team)
                        
                        print(f"Found: {team_name}")
                        logo = team.get('logo', '')
                        style = team.get('style', None)
                        
                        print(f"  Logo: {logo}")
                        print(f"  Style: {style}")
                        
                        # Check if logo matches the reported test data
                        if logo == "data:image/jpeg;base64,userlogo123":
                            print(f"  ⚠️  Logo contains test placeholder 'userlogo123'")
                        elif logo == "data:image/jpeg;base64,elitelogo456":
                            print(f"  ⚠️  Logo contains test placeholder 'elitelogo456'")
                        else:
                            is_valid, validation_msg = self.is_valid_base64_image(logo)
                            print(f"  Logo Valid: {is_valid} - {validation_msg}")
                        
                        if style is None:
                            print(f"  ⚠️  Style is null as reported")
                        
                        print()
                
                self.log_test(
                    "Specific Teams Analysis", 
                    True, 
                    f"Found {len(found_teams)} of {len(target_teams)} target teams",
                    {
                        'target_teams': target_teams,
                        'found_teams': [t.get('name') for t in found_teams]
                    }
                )
                
                return True, found_teams
            else:
                self.log_test(
                    "Specific Teams Analysis", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Specific Teams Analysis", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def run_logo_recovery_investigation(self):
        """Run the complete team logo recovery investigation"""
        print("🔍 Starting Team Logo Recovery Investigation...")
        print(f"Target URL: {self.api_base}")
        print("=" * 60)
        
        # 1. Investigate current team data
        success, team_data = self.investigate_current_team_data()
        if not success:
            print("❌ CRITICAL: Could not retrieve team data")
            return False
        
        # 2. Check dedicated teams collection
        self.check_dedicated_teams_collection()
        
        # 3. Analyze specific teams mentioned in review
        self.analyze_specific_teams()
        
        # 4. Test logo display functionality
        self.test_logo_display_functionality()
        
        # 5. Check backup systems
        self.check_backup_data()
        
        # Summary
        print("=" * 60)
        print("TEAM LOGO RECOVERY INVESTIGATION SUMMARY")
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
        
        # Provide recommendations
        print("\n🔧 RECOMMENDATIONS:")
        if team_data:
            logo_issues = team_data[1].get('logo_issues', []) if len(team_data) > 1 else []
            style_issues = team_data[1].get('style_issues', []) if len(team_data) > 1 else []
            
            if logo_issues:
                print(f"1. Fix {len(logo_issues)} team logo issues:")
                for issue in logo_issues[:3]:  # Show first 3
                    print(f"   - {issue['team']}: {issue['issue']}")
                if len(logo_issues) > 3:
                    print(f"   - ... and {len(logo_issues) - 3} more")
            
            if style_issues:
                print(f"2. Fix {len(style_issues)} team style issues:")
                for issue in style_issues[:3]:  # Show first 3
                    print(f"   - {issue['team']}: {issue['issue']}")
                if len(style_issues) > 3:
                    print(f"   - ... and {len(style_issues) - 3} more")
        
        print("3. Replace placeholder base64 data with actual image data")
        print("4. Restore team webstyles from backups if available")
        print("5. Verify frontend logo display functionality")
        
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    try:
        tester = TeamLogoRecoveryTester()
        success = tester.run_logo_recovery_investigation()
        
        if success:
            print("\n🎉 Team logo recovery investigation completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some tests failed during logo recovery investigation.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Investigation setup failed: {e}")
        sys.exit(1)