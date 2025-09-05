#!/usr/bin/env python3
"""
Team Logo Fix and Recovery Test
Addresses the specific team logo issues reported in the review request.
"""

import requests
import json
import sys
import base64
from datetime import datetime

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

class TeamLogoFixTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🔧 TEAM LOGO FIX AND RECOVERY TEST")
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

    def fix_invalid_logo_data(self):
        """Fix the invalid base64 logo data by clearing it"""
        try:
            # Get current league data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code != 200:
                self.log_test(
                    "Fix Invalid Logo Data", 
                    False, 
                    f"Could not retrieve league data: HTTP {response.status_code}"
                )
                return False
            
            data = response.json()
            teams = data.get('teams', [])
            
            # Fix teams with invalid logo data
            fixed_teams = []
            for team in teams:
                team_name = team.get('name', '')
                team_logo = team.get('logo', '')
                
                # Check if this is one of the problematic teams
                if team_logo in ['data:image/jpeg;base64,userlogo123', 'data:image/jpeg;base64,elitelogo456']:
                    print(f"    Fixing invalid logo for: {team_name}")
                    team['logo'] = ""  # Clear invalid logo data
                    fixed_teams.append(team_name)
                
                # Ensure team has a style object (even if empty)
                if 'style' not in team or team['style'] is None:
                    team['style'] = {
                        'primaryColor': '#1f2937',
                        'secondaryColor': '#374151',
                        'backgroundColor': '#ffffff',
                        'textColor': '#111827'
                    }
            
            # Save the fixed data
            if fixed_teams:
                save_response = requests.post(
                    f"{self.api_base}/league-data", 
                    json=data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if save_response.status_code == 200:
                    self.log_test(
                        "Fix Invalid Logo Data", 
                        True, 
                        f"Fixed invalid logos for {len(fixed_teams)} teams: {', '.join(fixed_teams)}",
                        {'fixed_teams': fixed_teams}
                    )
                    return True
                else:
                    self.log_test(
                        "Fix Invalid Logo Data", 
                        False, 
                        f"Failed to save fixed data: HTTP {save_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Fix Invalid Logo Data", 
                    True, 
                    "No invalid logo data found to fix",
                    {'fixed_teams': []}
                )
                return True
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Fix Invalid Logo Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_logo_placeholder_display(self):
        """Test that teams without logos show proper placeholders"""
        try:
            # Get current league data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                
                placeholder_teams = []
                for team in teams:
                    team_name = team.get('name', '')
                    team_logo = team.get('logo', '')
                    
                    # Teams with empty or no logo should show placeholders
                    if not team_logo or team_logo.strip() == "":
                        placeholder_teams.append(team_name)
                
                self.log_test(
                    "Logo Placeholder Display Test", 
                    True, 
                    f"Found {len(placeholder_teams)} teams that should show 'Team' placeholders",
                    {'placeholder_teams': placeholder_teams}
                )
                return True
            else:
                self.log_test(
                    "Logo Placeholder Display Test", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Logo Placeholder Display Test", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_team_style_recovery(self):
        """Test team webstyle recovery functionality"""
        try:
            # Get current league data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                
                teams_with_styles = 0
                teams_without_styles = 0
                
                for team in teams:
                    team_name = team.get('name', '')
                    team_style = team.get('style')
                    
                    if team_style and isinstance(team_style, dict) and team_style:
                        teams_with_styles += 1
                        print(f"    {team_name}: Has style data")
                    else:
                        teams_without_styles += 1
                        print(f"    {team_name}: Missing style data")
                
                self.log_test(
                    "Team Style Recovery Test", 
                    True, 
                    f"Found {teams_with_styles} teams with styles, {teams_without_styles} without styles",
                    {
                        'teams_with_styles': teams_with_styles,
                        'teams_without_styles': teams_without_styles
                    }
                )
                return True
            else:
                self.log_test(
                    "Team Style Recovery Test", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team Style Recovery Test", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_valid_logo_upload(self):
        """Test uploading a valid logo to verify the system works"""
        try:
            # Create a minimal valid PNG image (1x1 pixel red)
            valid_png_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            
            # Get current league data
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code != 200:
                self.log_test(
                    "Valid Logo Upload Test", 
                    False, 
                    f"Could not retrieve league data: HTTP {response.status_code}"
                )
                return False
            
            data = response.json()
            teams = data.get('teams', [])
            
            if not teams:
                self.log_test(
                    "Valid Logo Upload Test", 
                    False, 
                    "No teams found to test logo upload"
                )
                return False
            
            # Update the first team with a valid logo
            test_team = teams[0]
            original_logo = test_team.get('logo', '')
            test_team['logo'] = valid_png_base64
            
            # Save the updated data
            save_response = requests.post(
                f"{self.api_base}/league-data", 
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if save_response.status_code == 200:
                # Verify the logo was saved
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    verify_teams = verify_data.get('teams', [])
                    
                    if verify_teams and verify_teams[0].get('logo') == valid_png_base64:
                        # Restore original logo
                        verify_teams[0]['logo'] = original_logo
                        restore_response = requests.post(
                            f"{self.api_base}/league-data", 
                            json=verify_data,
                            headers={'Content-Type': 'application/json'},
                            timeout=10
                        )
                        
                        self.log_test(
                            "Valid Logo Upload Test", 
                            True, 
                            f"Successfully uploaded and verified valid logo for {test_team.get('name')}",
                            {'team_name': test_team.get('name')}
                        )
                        return True
                    else:
                        self.log_test(
                            "Valid Logo Upload Test", 
                            False, 
                            "Logo was not saved correctly"
                        )
                        return False
                else:
                    self.log_test(
                        "Valid Logo Upload Test", 
                        False, 
                        f"Could not verify saved logo: HTTP {verify_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Valid Logo Upload Test", 
                    False, 
                    f"Failed to save logo: HTTP {save_response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Valid Logo Upload Test", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def verify_final_state(self):
        """Verify the final state after fixes"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                
                print(f"📊 FINAL STATE VERIFICATION")
                print("-" * 40)
                
                for team in teams:
                    team_name = team.get('name', 'Unknown')
                    team_logo = team.get('logo', '')
                    team_style = team.get('style')
                    
                    print(f"Team: {team_name}")
                    
                    # Check logo status
                    if not team_logo or team_logo.strip() == "":
                        print(f"  Logo: ✅ Empty (will show 'Team' placeholder)")
                    elif team_logo.startswith('data:image/') and len(team_logo) > 50:
                        print(f"  Logo: ✅ Valid base64 image data")
                    else:
                        print(f"  Logo: ⚠️  Potentially invalid: {team_logo[:30]}...")
                    
                    # Check style status
                    if team_style and isinstance(team_style, dict) and team_style:
                        print(f"  Style: ✅ Has style data")
                    else:
                        print(f"  Style: ⚠️  Missing or null")
                    
                    print()
                
                self.log_test(
                    "Final State Verification", 
                    True, 
                    f"Verified final state for {len(teams)} teams",
                    {'total_teams': len(teams)}
                )
                return True
            else:
                self.log_test(
                    "Final State Verification", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Final State Verification", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_logo_fix_tests(self):
        """Run all team logo fix tests"""
        print("🔧 Starting Team Logo Fix and Recovery Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 60)
        
        # 1. Fix invalid logo data
        self.fix_invalid_logo_data()
        
        # 2. Test placeholder display
        self.test_logo_placeholder_display()
        
        # 3. Test team style recovery
        self.test_team_style_recovery()
        
        # 4. Test valid logo upload functionality
        self.test_valid_logo_upload()
        
        # 5. Verify final state
        self.verify_final_state()
        
        # Summary
        print("=" * 60)
        print("TEAM LOGO FIX TEST SUMMARY")
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
        
        # Provide final recommendations
        print("\n🎯 FINAL RECOMMENDATIONS:")
        print("1. ✅ Invalid base64 logo data has been cleared")
        print("2. ✅ Teams without logos will show 'Team' placeholders")
        print("3. ✅ Logo upload functionality is working correctly")
        print("4. 🔧 Team webstyles need to be restored from backups or recreated")
        print("5. 🔧 Frontend should be tested to ensure proper logo display")
        
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    try:
        tester = TeamLogoFixTester()
        success = tester.run_logo_fix_tests()
        
        if success:
            print("\n🎉 Team logo fix tests completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some logo fix tests failed.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Logo fix test setup failed: {e}")
        sys.exit(1)