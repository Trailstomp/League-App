#!/usr/bin/env python3
"""
Enhanced Team Management System Backend Testing Suite
Tests team CRUD operations with new styling features including accentColor field.
Specifically tests the smart color extraction feature implementation.
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

class TeamStylingTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        self.created_team_ids = []  # Track created teams for cleanup
        
        print(f"Testing Enhanced Team Management System at: {self.api_base}")
        print("🎨 Focus: Team Styling with accentColor Support")
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

    def test_team_create_with_styling(self):
        """Test creating a team with complete styling including accentColor"""
        try:
            team_data = {
                "name": "Elite Color Extraction Team",
                "division": "Field",
                "coach": "Coach Martinez",
                "homeField": "Innovation Stadium",
                "contactEmail": "coach@elitecolors.com",
                "active": True,
                "wins": 5,
                "losses": 2,
                "ties": 1,
                "style": {
                    "primaryColor": "#1e40af",
                    "backgroundColor": "#dbeafe", 
                    "accentColor": "#f59e0b",
                    "logoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                    "logoOpacity": 0.9,
                    "bannerUrl": "https://example.com/banner.jpg"
                }
            }
            
            response = requests.post(
                f"{self.api_base}/teams", 
                json=team_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify all required fields are present
                required_fields = ['id', 'name', 'style']
                if all(field in data for field in required_fields):
                    
                    # Verify style object with accentColor
                    style = data.get('style', {})
                    style_fields = ['primaryColor', 'backgroundColor', 'accentColor', 'logoUrl', 'logoOpacity', 'bannerUrl']
                    
                    if all(field in style for field in style_fields):
                        # Verify accentColor specifically
                        if style['accentColor'] == team_data['style']['accentColor']:
                            self.created_team_ids.append(data['id'])
                            self.log_test(
                                "Create Team with Complete Styling", 
                                True, 
                                f"Team created with accentColor: {style['accentColor']}", 
                                {
                                    "id": data['id'],
                                    "name": data['name'],
                                    "accentColor": style['accentColor'],
                                    "primaryColor": style['primaryColor'],
                                    "backgroundColor": style['backgroundColor']
                                }
                            )
                            return True, data
                        else:
                            self.log_test(
                                "Create Team with Complete Styling", 
                                False, 
                                f"accentColor mismatch: expected {team_data['style']['accentColor']}, got {style.get('accentColor')}"
                            )
                            return False, None
                    else:
                        missing_style = [f for f in style_fields if f not in style]
                        self.log_test(
                            "Create Team with Complete Styling", 
                            False, 
                            f"Missing style fields: {missing_style}"
                        )
                        return False, None
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "Create Team with Complete Styling", 
                        False, 
                        f"Missing required fields: {missing}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Create Team with Complete Styling", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Create Team with Complete Styling", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_team_update_styling(self):
        """Test updating team styling including accentColor changes"""
        try:
            # First create a team
            success, team_data = self.test_team_create_with_styling()
            if not success:
                return False
            
            team_id = team_data['id']
            
            # Update the team with new styling
            updated_team = team_data.copy()
            updated_team['style'] = {
                "primaryColor": "#dc2626",
                "backgroundColor": "#fef2f2",
                "accentColor": "#059669",  # New accent color
                "logoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                "logoOpacity": 0.8,
                "bannerUrl": "https://example.com/new-banner.jpg"
            }
            
            response = requests.put(
                f"{self.api_base}/teams/{team_id}", 
                json=updated_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                style = data.get('style', {})
                
                if style.get('accentColor') == updated_team['style']['accentColor']:
                    self.log_test(
                        "Update Team Styling", 
                        True, 
                        f"Team styling updated successfully. New accentColor: {style['accentColor']}", 
                        {
                            "id": data['id'],
                            "accentColor": style['accentColor'],
                            "primaryColor": style['primaryColor']
                        }
                    )
                    return True, data
                else:
                    self.log_test(
                        "Update Team Styling", 
                        False, 
                        f"accentColor update failed: expected {updated_team['style']['accentColor']}, got {style.get('accentColor')}"
                    )
                    return False, None
            else:
                self.log_test(
                    "Update Team Styling", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Update Team Styling", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_team_read_styling_persistence(self):
        """Test that team styling data persists correctly in database"""
        try:
            # Create a team with specific styling
            team_data = {
                "name": "Persistence Test Team",
                "division": "Box",
                "coach": "Coach Database",
                "style": {
                    "primaryColor": "#7c3aed",
                    "backgroundColor": "#f3f4f6",
                    "accentColor": "#ef4444",
                    "logoUrl": "data:image/png;base64,testlogo123",
                    "logoOpacity": 0.75,
                    "bannerUrl": "https://test.com/banner.png"
                }
            }
            
            # Create the team
            response = requests.post(
                f"{self.api_base}/teams", 
                json=team_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test(
                    "Team Styling Persistence", 
                    False, 
                    f"Failed to create test team: HTTP {response.status_code}"
                )
                return False
            
            created_team = response.json()
            team_id = created_team['id']
            self.created_team_ids.append(team_id)
            
            # Wait for database write
            time.sleep(1)
            
            # Retrieve all teams and find our created team
            response = requests.get(f"{self.api_base}/teams", timeout=10)
            
            if response.status_code == 200:
                teams = response.json()
                found_team = None
                
                for team in teams:
                    if team.get('id') == team_id:
                        found_team = team
                        break
                
                if found_team:
                    style = found_team.get('style', {})
                    
                    # Verify all styling fields persisted correctly
                    expected_style = team_data['style']
                    style_matches = all(
                        style.get(key) == expected_style[key] 
                        for key in expected_style.keys()
                    )
                    
                    if style_matches:
                        self.log_test(
                            "Team Styling Persistence", 
                            True, 
                            f"All styling data persisted correctly including accentColor: {style['accentColor']}", 
                            {
                                "team_id": team_id,
                                "persisted_style": style
                            }
                        )
                        return True
                    else:
                        mismatches = []
                        for key in expected_style.keys():
                            if style.get(key) != expected_style[key]:
                                mismatches.append(f"{key}: expected {expected_style[key]}, got {style.get(key)}")
                        
                        self.log_test(
                            "Team Styling Persistence", 
                            False, 
                            f"Styling data mismatch: {', '.join(mismatches)}"
                        )
                        return False
                else:
                    self.log_test(
                        "Team Styling Persistence", 
                        False, 
                        f"Created team with ID {team_id} not found in database"
                    )
                    return False
            else:
                self.log_test(
                    "Team Styling Persistence", 
                    False, 
                    f"Failed to retrieve teams: HTTP {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team Styling Persistence", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_backward_compatibility(self):
        """Test that teams without style objects are handled gracefully"""
        try:
            # Create a team without style object (legacy format)
            legacy_team_data = {
                "name": "Legacy Team No Styling",
                "division": "Field",
                "coach": "Coach Legacy",
                "homeField": "Old Stadium",
                "active": True,
                "wins": 3,
                "losses": 1,
                "ties": 0
                # Note: No 'style' field provided
            }
            
            response = requests.post(
                f"{self.api_base}/teams", 
                json=legacy_team_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify team was created successfully
                if 'id' in data and data['name'] == legacy_team_data['name']:
                    self.created_team_ids.append(data['id'])
                    
                    # Check if default style was applied
                    style = data.get('style', {})
                    
                    # Should have default values for styling fields
                    expected_defaults = {
                        'primaryColor': '#dc2626',
                        'backgroundColor': '#fef2f2', 
                        'accentColor': '#7c2d12'
                    }
                    
                    defaults_applied = all(
                        style.get(key) == expected_defaults[key] 
                        for key in expected_defaults.keys()
                    )
                    
                    if defaults_applied:
                        self.log_test(
                            "Backward Compatibility", 
                            True, 
                            f"Legacy team created with default styling including accentColor: {style['accentColor']}", 
                            {
                                "team_id": data['id'],
                                "default_style": style
                            }
                        )
                        return True
                    else:
                        self.log_test(
                            "Backward Compatibility", 
                            False, 
                            f"Default styling not applied correctly. Got style: {style}"
                        )
                        return False
                else:
                    self.log_test(
                        "Backward Compatibility", 
                        False, 
                        f"Team creation failed or data mismatch"
                    )
                    return False
            else:
                self.log_test(
                    "Backward Compatibility", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Backward Compatibility", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_api_response_validation(self):
        """Test that Pydantic models correctly serialize/deserialize team style data"""
        try:
            # Create team with complex styling data
            complex_team_data = {
                "name": "API Validation Team",
                "division": "Field",
                "coach": "Coach Validator",
                "style": {
                    "primaryColor": "#1f2937",
                    "backgroundColor": "#f9fafb",
                    "accentColor": "#f59e0b",
                    "logoUrl": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9InJlZCIvPjwvc3ZnPg==",
                    "logoOpacity": 0.85,
                    "bannerUrl": "https://example.com/complex-banner.jpg"
                }
            }
            
            # Create team
            response = requests.post(
                f"{self.api_base}/teams", 
                json=complex_team_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                created_data = response.json()
                team_id = created_data['id']
                self.created_team_ids.append(team_id)
                
                # Retrieve the team to test serialization/deserialization
                response = requests.get(f"{self.api_base}/teams", timeout=10)
                
                if response.status_code == 200:
                    teams = response.json()
                    found_team = None
                    
                    for team in teams:
                        if team.get('id') == team_id:
                            found_team = team
                            break
                    
                    if found_team:
                        # Validate response structure matches Pydantic model
                        required_team_fields = ['id', 'name', 'division', 'coach', 'active', 'wins', 'losses', 'ties', 'style', 'createdAt', 'updatedAt']
                        required_style_fields = ['primaryColor', 'backgroundColor', 'accentColor', 'logoUrl', 'logoOpacity', 'bannerUrl']
                        
                        team_fields_present = all(field in found_team for field in required_team_fields)
                        style_fields_present = all(field in found_team.get('style', {}) for field in required_style_fields)
                        
                        if team_fields_present and style_fields_present:
                            # Verify data types are correct
                            style = found_team['style']
                            type_checks = [
                                isinstance(style['primaryColor'], str),
                                isinstance(style['backgroundColor'], str),
                                isinstance(style['accentColor'], str),
                                isinstance(style['logoUrl'], str),
                                isinstance(style['logoOpacity'], (int, float)),
                                isinstance(style['bannerUrl'], str),
                                isinstance(found_team['wins'], int),
                                isinstance(found_team['losses'], int),
                                isinstance(found_team['ties'], int),
                                isinstance(found_team['active'], bool)
                            ]
                            
                            if all(type_checks):
                                self.log_test(
                                    "API Response Validation", 
                                    True, 
                                    f"Pydantic models correctly serialize/deserialize all team style data", 
                                    {
                                        "team_fields": len(required_team_fields),
                                        "style_fields": len(required_style_fields),
                                        "accentColor": style['accentColor']
                                    }
                                )
                                return True
                            else:
                                self.log_test(
                                    "API Response Validation", 
                                    False, 
                                    f"Data type validation failed for some fields"
                                )
                                return False
                        else:
                            missing_team = [f for f in required_team_fields if f not in found_team]
                            missing_style = [f for f in required_style_fields if f not in found_team.get('style', {})]
                            self.log_test(
                                "API Response Validation", 
                                False, 
                                f"Missing fields - Team: {missing_team}, Style: {missing_style}"
                            )
                            return False
                    else:
                        self.log_test(
                            "API Response Validation", 
                            False, 
                            f"Created team not found in response"
                        )
                        return False
                else:
                    self.log_test(
                        "API Response Validation", 
                        False, 
                        f"Failed to retrieve teams: HTTP {response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "API Response Validation", 
                    False, 
                    f"Failed to create team: HTTP {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "API Response Validation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_team_delete_with_styling(self):
        """Test deleting teams with styling data"""
        try:
            # Create a team with styling
            team_data = {
                "name": "Delete Test Team",
                "division": "Box",
                "style": {
                    "primaryColor": "#991b1b",
                    "backgroundColor": "#fef2f2",
                    "accentColor": "#059669"
                }
            }
            
            # Create team
            response = requests.post(
                f"{self.api_base}/teams", 
                json=team_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test(
                    "Delete Team with Styling", 
                    False, 
                    f"Failed to create test team: HTTP {response.status_code}"
                )
                return False
            
            created_team = response.json()
            team_id = created_team['id']
            
            # Delete the team
            response = requests.delete(f"{self.api_base}/teams/{team_id}", timeout=10)
            
            if response.status_code == 200:
                # Verify team was deleted
                time.sleep(1)
                response = requests.get(f"{self.api_base}/teams", timeout=10)
                
                if response.status_code == 200:
                    teams = response.json()
                    team_still_exists = any(team.get('id') == team_id for team in teams)
                    
                    if not team_still_exists:
                        self.log_test(
                            "Delete Team with Styling", 
                            True, 
                            f"Team with styling data deleted successfully", 
                            {"deleted_team_id": team_id}
                        )
                        return True
                    else:
                        self.log_test(
                            "Delete Team with Styling", 
                            False, 
                            f"Team still exists after deletion"
                        )
                        return False
                else:
                    self.log_test(
                        "Delete Team with Styling", 
                        False, 
                        f"Failed to verify deletion: HTTP {response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Delete Team with Styling", 
                    False, 
                    f"Delete failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Delete Team with Styling", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def cleanup_test_teams(self):
        """Clean up any teams created during testing"""
        print("\n🧹 Cleaning up test teams...")
        
        for team_id in self.created_team_ids:
            try:
                response = requests.delete(f"{self.api_base}/teams/{team_id}", timeout=5)
                if response.status_code == 200:
                    print(f"    ✅ Cleaned up team: {team_id}")
                else:
                    print(f"    ⚠️  Failed to clean up team: {team_id}")
            except:
                print(f"    ⚠️  Error cleaning up team: {team_id}")

    def run_all_tests(self):
        """Run all enhanced team management tests"""
        print("Starting Enhanced Team Management System Tests...")
        print(f"Target URL: {self.api_base}")
        print("🎨 Testing Smart Color Extraction Backend Support")
        print("=" * 70)
        
        # Test 1: Team CRUD Operations with Styling
        print("\n1️⃣ TESTING TEAM CRUD OPERATIONS WITH STYLING:")
        self.test_team_create_with_styling()
        self.test_team_update_styling()
        self.test_team_delete_with_styling()
        
        # Test 2: Team Style Data Persistence
        print("\n2️⃣ TESTING TEAM STYLE DATA PERSISTENCE:")
        self.test_team_read_styling_persistence()
        
        # Test 3: API Response Validation
        print("\n3️⃣ TESTING API RESPONSE VALIDATION:")
        self.test_api_response_validation()
        
        # Test 4: Backward Compatibility
        print("\n4️⃣ TESTING BACKWARD COMPATIBILITY:")
        self.test_backward_compatibility()
        
        # Summary
        print("=" * 70)
        print("ENHANCED TEAM MANAGEMENT TEST SUMMARY")
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
        
        # Specific assessment for team styling features
        styling_tests = [t for t in self.test_results if any(keyword in t['test'] for keyword in ['Styling', 'accentColor', 'Persistence', 'Validation', 'Compatibility'])]
        styling_passed = len([t for t in styling_tests if t['success']])
        
        print(f"\n🎨 Team Styling Feature Assessment:")
        print(f"   Styling Tests: {len(styling_tests)}")
        print(f"   Styling Passed: {styling_passed}")
        
        # Clean up test data
        self.cleanup_test_teams()
        
        return failed_tests == 0

if __name__ == "__main__":
    try:
        tester = TeamStylingTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Enhanced Team Management System tests completed successfully!")
            print("✅ Smart Color Extraction backend support is fully functional!")
            sys.exit(0)
        else:
            print("\n⚠️  Some enhanced team management tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)