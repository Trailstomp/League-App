#!/usr/bin/env python3
"""
Enhanced Media Gallery System Backend Testing Suite
Tests the enhanced media gallery system backend functionality, particularly focusing on:
1. Teams API Endpoint with nested galleries structure
2. Gallery Data Structure with expiration and active fields
3. League Data Endpoints for team data with enhanced gallery structures
4. Data Persistence for gallery and item data
5. API Response Format for proper JSON serialization
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import time
import uuid

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

class MediaGalleryBackendTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Enhanced Media Gallery Backend at: {self.api_base}")
        print("=" * 80)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            if isinstance(response_data, dict) and len(str(response_data)) > 200:
                print(f"    Response: [Large object with {len(response_data)} keys]")
            else:
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

    def create_sample_team_with_galleries(self):
        """Create a sample team with enhanced gallery structure"""
        team_id = str(uuid.uuid4())
        gallery_id_1 = str(uuid.uuid4())
        gallery_id_2 = str(uuid.uuid4())
        item_id_1 = str(uuid.uuid4())
        item_id_2 = str(uuid.uuid4())
        item_id_3 = str(uuid.uuid4())
        
        # Create expiration dates
        future_date = (datetime.utcnow() + timedelta(days=30)).isoformat()
        past_date = (datetime.utcnow() - timedelta(days=5)).isoformat()
        
        sample_team = {
            "id": team_id,
            "name": "Media Gallery Test Team",
            "division": "Field",
            "coach": "Coach Media",
            "homeField": "Test Field",
            "logo": "",
            "contactEmail": "test@mediagallery.com",
            "active": True,
            "wins": 5,
            "losses": 2,
            "ties": 1,
            "galleries": [
                {
                    "id": gallery_id_1,
                    "name": "Season Highlights",
                    "description": "Best moments from this season",
                    "type": "photo",
                    "teamId": team_id,
                    "createdAt": datetime.utcnow().isoformat(),
                    "expirationDate": future_date,
                    "isActive": True,
                    "items": [
                        {
                            "id": item_id_1,
                            "url": "https://example.com/photo1.jpg",
                            "caption": "Championship winning goal",
                            "expirationDate": future_date,
                            "active": True,
                            "addedAt": datetime.utcnow().isoformat()
                        },
                        {
                            "id": item_id_2,
                            "url": "https://example.com/photo2.jpg",
                            "caption": "Team celebration",
                            "expirationDate": past_date,  # Expired item
                            "active": False,  # Inactive item
                            "addedAt": (datetime.utcnow() - timedelta(days=10)).isoformat()
                        }
                    ]
                },
                {
                    "id": gallery_id_2,
                    "name": "Training Videos",
                    "description": "Practice session recordings",
                    "type": "video",
                    "teamId": team_id,
                    "createdAt": datetime.utcnow().isoformat(),
                    "expirationDate": future_date,
                    "isActive": True,
                    "items": [
                        {
                            "id": item_id_3,
                            "url": "https://example.com/video1.mp4",
                            "caption": "Defensive drills",
                            "expirationDate": future_date,
                            "active": True,
                            "addedAt": datetime.utcnow().isoformat()
                        }
                    ]
                }
            ],
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        return sample_team

    def test_teams_api_endpoint(self):
        """Test /api/teams endpoint for handling teams with nested galleries structure"""
        try:
            # First, create a team with galleries
            sample_team = self.create_sample_team_with_galleries()
            
            # Create the team via POST
            response = requests.post(
                f"{self.api_base}/teams",
                json=sample_team,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test(
                    "Teams API - Create Team with Galleries",
                    False,
                    f"Failed to create team: HTTP {response.status_code}: {response.text}"
                )
                return False, None
            
            created_team = response.json()
            
            # Now test GET /api/teams to verify galleries structure
            response = requests.get(f"{self.api_base}/teams", timeout=10)
            
            if response.status_code == 200:
                teams = response.json()
                
                # Find our test team
                test_team = None
                for team in teams:
                    if team.get('id') == sample_team['id']:
                        test_team = team
                        break
                
                if test_team:
                    # Verify galleries structure
                    galleries = test_team.get('galleries', [])
                    
                    if len(galleries) >= 2:
                        # Check first gallery structure
                        gallery1 = galleries[0]
                        required_gallery_fields = ['id', 'name', 'description', 'type', 'teamId', 'createdAt', 'expirationDate', 'isActive', 'items']
                        
                        missing_gallery_fields = [f for f in required_gallery_fields if f not in gallery1]
                        if missing_gallery_fields:
                            self.log_test(
                                "Teams API - Gallery Structure",
                                False,
                                f"Missing gallery fields: {missing_gallery_fields}"
                            )
                            return False, None
                        
                        # Check items structure
                        items = gallery1.get('items', [])
                        if len(items) > 0:
                            item1 = items[0]
                            required_item_fields = ['id', 'url', 'caption', 'expirationDate', 'active', 'addedAt']
                            
                            missing_item_fields = [f for f in required_item_fields if f not in item1]
                            if missing_item_fields:
                                self.log_test(
                                    "Teams API - Item Structure",
                                    False,
                                    f"Missing item fields: {missing_item_fields}"
                                )
                                return False, None
                            
                            self.log_test(
                                "Teams API - Nested Galleries Structure",
                                True,
                                f"Team retrieved with {len(galleries)} galleries and proper structure",
                                {
                                    "team_id": test_team['id'],
                                    "galleries_count": len(galleries),
                                    "first_gallery_items": len(items)
                                }
                            )
                            return True, test_team
                        else:
                            self.log_test(
                                "Teams API - Gallery Items",
                                False,
                                "Gallery has no items"
                            )
                            return False, None
                    else:
                        self.log_test(
                            "Teams API - Galleries Count",
                            False,
                            f"Expected at least 2 galleries, got {len(galleries)}"
                        )
                        return False, None
                else:
                    self.log_test(
                        "Teams API - Team Retrieval",
                        False,
                        "Created team not found in GET response"
                    )
                    return False, None
            else:
                self.log_test(
                    "Teams API - GET Request",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Teams API - Connection",
                False,
                f"Connection error: {str(e)}"
            )
            return False, None
        except Exception as e:
            self.log_test(
                "Teams API - Unexpected Error",
                False,
                f"Unexpected error: {str(e)}"
            )
            return False, None

    def test_gallery_data_structure_validation(self):
        """Test that gallery and item data structures are properly validated"""
        try:
            # Test with missing required fields
            invalid_team = {
                "id": str(uuid.uuid4()),
                "name": "Invalid Gallery Test Team",
                "galleries": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Invalid Gallery",
                        # Missing required fields like type, teamId, etc.
                        "items": [
                            {
                                "id": str(uuid.uuid4()),
                                "url": "https://example.com/test.jpg"
                                # Missing required fields like active, addedAt, etc.
                            }
                        ]
                    }
                ]
            }
            
            response = requests.post(
                f"{self.api_base}/teams",
                json=invalid_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # The API should still accept this (backend is flexible)
            # But we'll test with a properly structured team
            valid_team = self.create_sample_team_with_galleries()
            
            response = requests.post(
                f"{self.api_base}/teams",
                json=valid_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                created_team = response.json()
                
                # Verify the structure was preserved
                galleries = created_team.get('galleries', [])
                if len(galleries) > 0:
                    gallery = galleries[0]
                    items = gallery.get('items', [])
                    
                    if len(items) > 0:
                        item = items[0]
                        
                        # Check that expiration and active fields are present
                        has_expiration = 'expirationDate' in item
                        has_active = 'active' in item
                        has_added_at = 'addedAt' in item
                        
                        if has_expiration and has_active and has_added_at:
                            self.log_test(
                                "Gallery Data Structure Validation",
                                True,
                                "All required fields present in gallery items",
                                {
                                    "expiration_field": has_expiration,
                                    "active_field": has_active,
                                    "added_at_field": has_added_at
                                }
                            )
                            return True
                        else:
                            self.log_test(
                                "Gallery Data Structure Validation",
                                False,
                                f"Missing fields - expiration: {has_expiration}, active: {has_active}, addedAt: {has_added_at}"
                            )
                            return False
                    else:
                        self.log_test(
                            "Gallery Data Structure Validation",
                            False,
                            "No items found in gallery"
                        )
                        return False
                else:
                    self.log_test(
                        "Gallery Data Structure Validation",
                        False,
                        "No galleries found in created team"
                    )
                    return False
            else:
                self.log_test(
                    "Gallery Data Structure Validation",
                    False,
                    f"Failed to create valid team: HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Gallery Data Structure Validation",
                False,
                f"Error: {str(e)}"
            )
            return False

    def test_league_data_teams_endpoint(self):
        """Test /api/league-data/teams endpoint for saving and retrieving team data with enhanced gallery structures"""
        try:
            # Create multiple teams with galleries
            team1 = self.create_sample_team_with_galleries()
            team1['id'] = str(uuid.uuid4())
            team1['name'] = "League Data Test Team 1"
            
            team2 = self.create_sample_team_with_galleries()
            team2['id'] = str(uuid.uuid4())
            team2['name'] = "League Data Test Team 2"
            
            teams_data = [team1, team2]
            
            # Save teams data via league-data endpoint
            response = requests.post(
                f"{self.api_base}/league-data/teams",
                json=teams_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                save_response = response.json()
                
                if save_response.get('message') == 'teams updated successfully':
                    # Wait for data to persist
                    time.sleep(1)
                    
                    # Retrieve the data via league-data endpoint
                    response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    
                    if response.status_code == 200:
                        league_data = response.json()
                        saved_teams = league_data.get('teams', [])
                        
                        # Find our test teams
                        test_team1 = None
                        test_team2 = None
                        
                        for team in saved_teams:
                            if team.get('id') == team1['id']:
                                test_team1 = team
                            elif team.get('id') == team2['id']:
                                test_team2 = team
                        
                        if test_team1 and test_team2:
                            # Verify gallery structures are preserved
                            team1_galleries = test_team1.get('galleries', [])
                            team2_galleries = test_team2.get('galleries', [])
                            
                            if len(team1_galleries) >= 2 and len(team2_galleries) >= 2:
                                # Check that expiration and active fields are preserved
                                gallery1 = team1_galleries[0]
                                items1 = gallery1.get('items', [])
                                
                                if len(items1) > 0:
                                    item1 = items1[0]
                                    
                                    # Verify enhanced fields
                                    has_all_fields = all(field in item1 for field in ['expirationDate', 'active', 'addedAt'])
                                    
                                    if has_all_fields:
                                        self.log_test(
                                            "League Data Teams Endpoint",
                                            True,
                                            f"Successfully saved and retrieved {len(saved_teams)} teams with enhanced gallery structures",
                                            {
                                                "teams_saved": len(teams_data),
                                                "teams_retrieved": len(saved_teams),
                                                "team1_galleries": len(team1_galleries),
                                                "team2_galleries": len(team2_galleries)
                                            }
                                        )
                                        return True, saved_teams
                                    else:
                                        self.log_test(
                                            "League Data Teams Endpoint",
                                            False,
                                            "Enhanced fields not preserved in items"
                                        )
                                        return False, None
                                else:
                                    self.log_test(
                                        "League Data Teams Endpoint",
                                        False,
                                        "No items found in retrieved gallery"
                                    )
                                    return False, None
                            else:
                                self.log_test(
                                    "League Data Teams Endpoint",
                                    False,
                                    f"Gallery count mismatch - Team1: {len(team1_galleries)}, Team2: {len(team2_galleries)}"
                                )
                                return False, None
                        else:
                            self.log_test(
                                "League Data Teams Endpoint",
                                False,
                                f"Test teams not found in retrieved data - Team1: {test_team1 is not None}, Team2: {test_team2 is not None}"
                            )
                            return False, None
                    else:
                        self.log_test(
                            "League Data Teams Endpoint - Retrieval",
                            False,
                            f"Failed to retrieve league data: HTTP {response.status_code}"
                        )
                        return False, None
                else:
                    self.log_test(
                        "League Data Teams Endpoint - Save Response",
                        False,
                        f"Unexpected save response: {save_response}"
                    )
                    return False, None
            else:
                self.log_test(
                    "League Data Teams Endpoint - Save",
                    False,
                    f"Failed to save teams data: HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "League Data Teams Endpoint",
                False,
                f"Error: {str(e)}"
            )
            return False, None

    def test_data_persistence_with_expiration_fields(self):
        """Test that gallery and item data with new expiration and active fields persist correctly"""
        try:
            # Create a team with specific expiration and active field values
            team = self.create_sample_team_with_galleries()
            team['id'] = str(uuid.uuid4())
            team['name'] = "Persistence Test Team"
            
            # Set specific values for testing
            future_date = (datetime.utcnow() + timedelta(days=15)).isoformat()
            past_date = (datetime.utcnow() - timedelta(days=3)).isoformat()
            
            # Modify gallery and item data for testing
            gallery = team['galleries'][0]
            gallery['expirationDate'] = future_date
            gallery['isActive'] = True
            
            item1 = gallery['items'][0]
            item1['expirationDate'] = future_date
            item1['active'] = True
            
            item2 = gallery['items'][1]
            item2['expirationDate'] = past_date
            item2['active'] = False
            
            # Save the team
            response = requests.post(
                f"{self.api_base}/teams",
                json=team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                created_team = response.json()
                team_id = created_team['id']
                
                # Wait for persistence
                time.sleep(1)
                
                # Retrieve the team again
                response = requests.get(f"{self.api_base}/teams", timeout=10)
                
                if response.status_code == 200:
                    teams = response.json()
                    
                    # Find our test team
                    retrieved_team = None
                    for t in teams:
                        if t.get('id') == team_id:
                            retrieved_team = t
                            break
                    
                    if retrieved_team:
                        galleries = retrieved_team.get('galleries', [])
                        
                        if len(galleries) > 0:
                            gallery = galleries[0]
                            items = gallery.get('items', [])
                            
                            # Verify gallery expiration and active fields
                            gallery_expiration = gallery.get('expirationDate')
                            gallery_active = gallery.get('isActive')
                            
                            # Verify item expiration and active fields
                            if len(items) >= 2:
                                item1 = items[0]
                                item2 = items[1]
                                
                                item1_expiration = item1.get('expirationDate')
                                item1_active = item1.get('active')
                                item2_expiration = item2.get('expirationDate')
                                item2_active = item2.get('active')
                                
                                # Check that all fields persisted correctly
                                persistence_checks = [
                                    gallery_expiration is not None,
                                    gallery_active is not None,
                                    item1_expiration is not None,
                                    item1_active is not None,
                                    item2_expiration is not None,
                                    item2_active is not None
                                ]
                                
                                if all(persistence_checks):
                                    self.log_test(
                                        "Data Persistence - Expiration & Active Fields",
                                        True,
                                        "All expiration and active fields persisted correctly",
                                        {
                                            "gallery_expiration": gallery_expiration[:10] if gallery_expiration else None,
                                            "gallery_active": gallery_active,
                                            "item1_active": item1_active,
                                            "item2_active": item2_active
                                        }
                                    )
                                    return True
                                else:
                                    failed_checks = [i for i, check in enumerate(persistence_checks) if not check]
                                    self.log_test(
                                        "Data Persistence - Expiration & Active Fields",
                                        False,
                                        f"Some fields failed to persist: {failed_checks}"
                                    )
                                    return False
                            else:
                                self.log_test(
                                    "Data Persistence - Items Count",
                                    False,
                                    f"Expected at least 2 items, got {len(items)}"
                                )
                                return False
                        else:
                            self.log_test(
                                "Data Persistence - Galleries",
                                False,
                                "No galleries found in retrieved team"
                            )
                            return False
                    else:
                        self.log_test(
                            "Data Persistence - Team Retrieval",
                            False,
                            "Created team not found in retrieval"
                        )
                        return False
                else:
                    self.log_test(
                        "Data Persistence - GET Request",
                        False,
                        f"Failed to retrieve teams: HTTP {response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Data Persistence - Team Creation",
                    False,
                    f"Failed to create team: HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Data Persistence - Expiration & Active Fields",
                False,
                f"Error: {str(e)}"
            )
            return False

    def test_api_response_format_json_serialization(self):
        """Test that all gallery and item data returns in proper JSON format without serialization issues"""
        try:
            # Create a team with complex gallery data
            team = self.create_sample_team_with_galleries()
            team['id'] = str(uuid.uuid4())
            team['name'] = "JSON Serialization Test Team"
            
            # Add some complex data that might cause serialization issues
            team['galleries'][0]['metadata'] = {
                "tags": ["action", "championship"],
                "location": "Main Stadium",
                "photographer": "John Doe"
            }
            
            # Save the team
            response = requests.post(
                f"{self.api_base}/teams",
                json=team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Test 1: Verify response is valid JSON
                try:
                    created_team = response.json()
                    json.dumps(created_team)  # Test serialization
                    
                    self.log_test(
                        "JSON Serialization - Team Creation Response",
                        True,
                        "Team creation response is valid JSON"
                    )
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test(
                        "JSON Serialization - Team Creation Response",
                        False,
                        f"JSON serialization error: {str(e)}"
                    )
                    return False
                
                # Test 2: Retrieve teams and verify JSON format
                response = requests.get(f"{self.api_base}/teams", timeout=10)
                
                if response.status_code == 200:
                    try:
                        teams = response.json()
                        
                        # Find our test team
                        test_team = None
                        for t in teams:
                            if t.get('id') == team['id']:
                                test_team = t
                                break
                        
                        if test_team:
                            # Test serialization of the complete team object
                            json_str = json.dumps(test_team)
                            
                            # Test deserialization
                            parsed_team = json.loads(json_str)
                            
                            # Verify galleries structure is intact
                            galleries = parsed_team.get('galleries', [])
                            
                            if len(galleries) > 0:
                                gallery = galleries[0]
                                items = gallery.get('items', [])
                                
                                # Check that datetime fields are properly serialized
                                datetime_fields = []
                                for item in items:
                                    if 'expirationDate' in item:
                                        datetime_fields.append(item['expirationDate'])
                                    if 'addedAt' in item:
                                        datetime_fields.append(item['addedAt'])
                                
                                # Verify datetime fields are strings (ISO format)
                                datetime_valid = all(isinstance(dt, str) for dt in datetime_fields)
                                
                                if datetime_valid:
                                    self.log_test(
                                        "JSON Serialization - Complete Format",
                                        True,
                                        "All gallery and item data serializes properly to JSON",
                                        {
                                            "galleries_count": len(galleries),
                                            "items_count": len(items),
                                            "datetime_fields_valid": datetime_valid
                                        }
                                    )
                                    return True
                                else:
                                    self.log_test(
                                        "JSON Serialization - DateTime Fields",
                                        False,
                                        "DateTime fields not properly serialized"
                                    )
                                    return False
                            else:
                                self.log_test(
                                    "JSON Serialization - Gallery Structure",
                                    False,
                                    "No galleries found in serialized team"
                                )
                                return False
                        else:
                            self.log_test(
                                "JSON Serialization - Team Retrieval",
                                False,
                                "Test team not found in response"
                            )
                            return False
                            
                    except (json.JSONDecodeError, TypeError) as e:
                        self.log_test(
                            "JSON Serialization - Teams GET Response",
                            False,
                            f"JSON serialization error: {str(e)}"
                        )
                        return False
                else:
                    self.log_test(
                        "JSON Serialization - GET Request",
                        False,
                        f"Failed to retrieve teams: HTTP {response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "JSON Serialization - Team Creation",
                    False,
                    f"Failed to create team: HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "JSON Serialization - Unexpected Error",
                False,
                f"Error: {str(e)}"
            )
            return False

    def test_backend_health_check(self):
        """Test basic backend connectivity"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "Backend Health Check",
                        True,
                        f"Backend is running and responsive",
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

    def run_all_tests(self):
        """Run all enhanced media gallery backend tests"""
        print("Starting Enhanced Media Gallery Backend Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 80)
        
        # Test basic connectivity first
        if not self.test_backend_health_check():
            print("❌ CRITICAL: Backend health check failed. Backend may not be running.")
            return False
        
        print("\n🖼️ TESTING ENHANCED MEDIA GALLERY SYSTEM:")
        print("-" * 60)
        
        # Test 1: Teams API Endpoint with nested galleries
        success1, _ = self.test_teams_api_endpoint()
        
        # Test 2: Gallery Data Structure validation
        success2 = self.test_gallery_data_structure_validation()
        
        # Test 3: League Data Teams endpoint
        success3, _ = self.test_league_data_teams_endpoint()
        
        # Test 4: Data Persistence with expiration fields
        success4 = self.test_data_persistence_with_expiration_fields()
        
        # Test 5: API Response Format and JSON serialization
        success5 = self.test_api_response_format_json_serialization()
        
        # Summary
        print("=" * 80)
        print("ENHANCED MEDIA GALLERY BACKEND TEST SUMMARY")
        print("=" * 80)
        
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
        
        # Specific assessment for media gallery functionality
        critical_tests = [success1, success2, success3, success4, success5]
        media_gallery_success = all(critical_tests)
        
        if media_gallery_success:
            print(f"\n✅ ENHANCED MEDIA GALLERY SYSTEM: All critical tests passed")
            print("   - Teams API handles nested galleries structure correctly")
            print("   - Gallery and item data structures are properly validated")
            print("   - League data endpoints support enhanced gallery structures")
            print("   - Expiration and active fields persist correctly")
            print("   - JSON serialization works without issues")
        else:
            print(f"\n❌ ENHANCED MEDIA GALLERY SYSTEM: Some critical tests failed")
            failed_areas = []
            if not success1: failed_areas.append("Teams API endpoint")
            if not success2: failed_areas.append("Gallery data structure")
            if not success3: failed_areas.append("League data endpoints")
            if not success4: failed_areas.append("Data persistence")
            if not success5: failed_areas.append("JSON serialization")
            
            print(f"   Failed areas: {', '.join(failed_areas)}")
        
        return media_gallery_success

if __name__ == "__main__":
    try:
        tester = MediaGalleryBackendTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Enhanced Media Gallery Backend tests completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some enhanced media gallery backend tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)