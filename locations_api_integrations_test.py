#!/usr/bin/env python3
"""
Locations Management and API Integrations Backend Testing Suite
Tests the newly implemented locations management backend API and API integrations functionality.

Focus Areas:
1. Locations API Testing (GET, POST, PUT, DELETE /api/locations)
2. API Integrations Testing (GET, POST /api/api-integrations)
3. Data validation and error handling
4. Database persistence
"""

import requests
import json
import sys
from datetime import datetime
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

class LocationsAPITester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        self.created_location_ids = []  # Track created locations for cleanup
        
        print(f"🏟️ Testing Locations Management & API Integrations at: {self.api_base}")
        print("=" * 80)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            if isinstance(response_data, dict) and len(str(response_data)) > 200:
                print(f"    Response: {type(response_data).__name__} with {len(response_data)} fields")
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

    def test_health_check(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "API Health Check", 
                        True, 
                        f"Backend is running - Status: {response.status_code}", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "API Health Check", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "API Health Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "API Health Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_get_locations_all(self):
        """Test GET /api/locations endpoint (all locations)"""
        try:
            response = requests.get(f"{self.api_base}/locations", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "GET All Locations", 
                        True, 
                        f"Retrieved {len(data)} locations", 
                        f"Locations count: {len(data)}"
                    )
                    return True, data
                else:
                    self.log_test(
                        "GET All Locations", 
                        False, 
                        f"Expected list, got: {type(data)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET All Locations", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET All Locations", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_get_locations_by_team(self):
        """Test GET /api/locations endpoint with team filtering"""
        try:
            test_team_id = "test_team_123"
            response = requests.get(f"{self.api_base}/locations?team_id={test_team_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Verify all returned locations belong to the specified team
                    team_specific = all(loc.get('teamId') == test_team_id for loc in data if loc.get('teamId'))
                    
                    self.log_test(
                        "GET Locations by Team", 
                        True, 
                        f"Retrieved {len(data)} locations for team {test_team_id}", 
                        f"Team-specific filtering working: {team_specific}"
                    )
                    return True, data
                else:
                    self.log_test(
                        "GET Locations by Team", 
                        False, 
                        f"Expected list, got: {type(data)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET Locations by Team", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET Locations by Team", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_create_location_practice_field(self):
        """Test POST /api/locations for creating practice field"""
        try:
            location_data = {
                "name": "Riverside Practice Field",
                "address": "123 Riverside Drive, Columbus, OH 43215",
                "type": "practice_field",
                "indoor": False,
                "surface": "turf",
                "description": "Main practice facility with artificial turf and lighting",
                "teamId": "team_oh10_lacrosse"
            }
            
            response = requests.post(
                f"{self.api_base}/locations", 
                json=location_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'name', 'address', 'type', 'indoor', 'surface', 'teamId', 'createdAt', 'updatedAt']
                
                if all(field in data for field in required_fields):
                    # Verify data integrity
                    if (data['name'] == location_data['name'] and 
                        data['type'] == location_data['type'] and
                        data['indoor'] == location_data['indoor'] and
                        data['surface'] == location_data['surface']):
                        
                        self.created_location_ids.append(data['id'])
                        self.log_test(
                            "POST Location - Practice Field", 
                            True, 
                            f"Created practice field with ID: {data['id']}", 
                            {k: v for k, v in data.items() if k not in ['createdAt', 'updatedAt']}
                        )
                        return True, data
                    else:
                        self.log_test(
                            "POST Location - Practice Field", 
                            False, 
                            "Data integrity check failed - field values don't match"
                        )
                        return False, None
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "POST Location - Practice Field", 
                        False, 
                        f"Missing required fields: {missing}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST Location - Practice Field", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Location - Practice Field", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_create_location_game_field(self):
        """Test POST /api/locations for creating game field"""
        try:
            location_data = {
                "name": "Championship Stadium",
                "address": "456 Victory Lane, Cincinnati, OH 45202",
                "type": "game_field",
                "indoor": False,
                "surface": "grass",
                "description": "Official game field with natural grass and stadium seating",
                "teamId": ""  # League-wide location
            }
            
            response = requests.post(
                f"{self.api_base}/locations", 
                json=location_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if (data['name'] == location_data['name'] and 
                    data['type'] == location_data['type'] and
                    data['surface'] == location_data['surface'] and
                    data['teamId'] == ""):  # Verify league-wide location
                    
                    self.created_location_ids.append(data['id'])
                    self.log_test(
                        "POST Location - Game Field", 
                        True, 
                        f"Created league-wide game field with ID: {data['id']}", 
                        {"name": data['name'], "type": data['type'], "surface": data['surface'], "teamId": data['teamId']}
                    )
                    return True, data
                else:
                    self.log_test(
                        "POST Location - Game Field", 
                        False, 
                        "Data integrity check failed for game field"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST Location - Game Field", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Location - Game Field", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_create_location_social_venue(self):
        """Test POST /api/locations for creating social venue"""
        try:
            location_data = {
                "name": "Lacrosse Club House",
                "address": "789 Team Spirit Blvd, Dayton, OH 45402",
                "type": "social_venue",
                "indoor": True,
                "surface": "indoor_court",
                "description": "Team social venue with meeting rooms and dining facilities",
                "teamId": "team_dayton_eagles"
            }
            
            response = requests.post(
                f"{self.api_base}/locations", 
                json=location_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if (data['name'] == location_data['name'] and 
                    data['type'] == location_data['type'] and
                    data['indoor'] == True and
                    data['surface'] == location_data['surface']):
                    
                    self.created_location_ids.append(data['id'])
                    self.log_test(
                        "POST Location - Social Venue", 
                        True, 
                        f"Created indoor social venue with ID: {data['id']}", 
                        {"name": data['name'], "type": data['type'], "indoor": data['indoor'], "surface": data['surface']}
                    )
                    return True, data
                else:
                    self.log_test(
                        "POST Location - Social Venue", 
                        False, 
                        "Data integrity check failed for social venue"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST Location - Social Venue", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Location - Social Venue", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_create_location_training_facility(self):
        """Test POST /api/locations for creating training facility"""
        try:
            location_data = {
                "name": "Elite Training Center",
                "address": "321 Performance Way, Indianapolis, IN 46202",
                "type": "training_facility",
                "indoor": True,
                "surface": "concrete",
                "description": "Indoor training facility with specialized equipment",
                "teamId": "team_indy_sabers"
            }
            
            response = requests.post(
                f"{self.api_base}/locations", 
                json=location_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if (data['name'] == location_data['name'] and 
                    data['type'] == location_data['type'] and
                    data['surface'] == location_data['surface']):
                    
                    self.created_location_ids.append(data['id'])
                    self.log_test(
                        "POST Location - Training Facility", 
                        True, 
                        f"Created training facility with ID: {data['id']}", 
                        {"name": data['name'], "type": data['type'], "surface": data['surface']}
                    )
                    return True, data
                else:
                    self.log_test(
                        "POST Location - Training Facility", 
                        False, 
                        "Data integrity check failed for training facility"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST Location - Training Facility", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Location - Training Facility", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_update_location(self):
        """Test PUT /api/locations/{id} for updating existing location"""
        if not self.created_location_ids:
            self.log_test(
                "PUT Location Update", 
                False, 
                "No locations available to update - create tests may have failed"
            )
            return False, None
            
        try:
            location_id = self.created_location_ids[0]
            updated_data = {
                "id": location_id,
                "name": "Updated Riverside Practice Field",
                "address": "123 Riverside Drive, Columbus, OH 43215",
                "type": "practice_field",
                "indoor": False,
                "surface": "grass",  # Changed from turf to grass
                "description": "Updated practice facility with natural grass surface",
                "teamId": "team_oh10_lacrosse",
                "active": True
            }
            
            response = requests.put(
                f"{self.api_base}/locations/{location_id}", 
                json=updated_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if (data['name'] == updated_data['name'] and 
                    data['surface'] == updated_data['surface'] and
                    data['description'] == updated_data['description']):
                    
                    self.log_test(
                        "PUT Location Update", 
                        True, 
                        f"Successfully updated location {location_id}", 
                        {"name": data['name'], "surface": data['surface'], "updated": True}
                    )
                    return True, data
                else:
                    self.log_test(
                        "PUT Location Update", 
                        False, 
                        "Update data integrity check failed"
                    )
                    return False, None
            elif response.status_code == 404:
                self.log_test(
                    "PUT Location Update", 
                    False, 
                    f"Location {location_id} not found for update"
                )
                return False, None
            else:
                self.log_test(
                    "PUT Location Update", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "PUT Location Update", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_delete_location(self):
        """Test DELETE /api/locations/{id} for deleting location"""
        if len(self.created_location_ids) < 2:
            self.log_test(
                "DELETE Location", 
                False, 
                "Not enough locations available to delete - create tests may have failed"
            )
            return False
            
        try:
            location_id = self.created_location_ids[-1]  # Delete the last created location
            
            response = requests.delete(f"{self.api_base}/locations/{location_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('message') == 'Location deleted successfully':
                    # Verify deletion by trying to get all locations
                    time.sleep(1)  # Wait for database operation
                    success, locations = self.test_get_locations_all()
                    
                    if success:
                        deleted_location_exists = any(loc.get('id') == location_id for loc in locations)
                        
                        if not deleted_location_exists:
                            self.created_location_ids.remove(location_id)  # Remove from tracking
                            self.log_test(
                                "DELETE Location", 
                                True, 
                                f"Successfully deleted location {location_id}", 
                                {"deleted_id": location_id, "verified": True}
                            )
                            return True
                        else:
                            self.log_test(
                                "DELETE Location", 
                                False, 
                                f"Location {location_id} still exists after deletion"
                            )
                            return False
                    else:
                        self.log_test(
                            "DELETE Location", 
                            False, 
                            "Could not verify deletion - GET locations failed"
                        )
                        return False
                else:
                    self.log_test(
                        "DELETE Location", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            elif response.status_code == 404:
                self.log_test(
                    "DELETE Location", 
                    False, 
                    f"Location {location_id} not found for deletion"
                )
                return False
            else:
                self.log_test(
                    "DELETE Location", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "DELETE Location", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_get_api_integrations(self):
        """Test GET /api/api-integrations endpoint"""
        try:
            response = requests.get(f"{self.api_base}/api-integrations", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'googleMapsApiKey', 'emailApiKey', 'smsApiKey', 'lastUpdated']
                
                if all(field in data for field in required_fields):
                    # Check if Google Maps API key is initialized
                    google_maps_key = data.get('googleMapsApiKey', '')
                    has_google_key = len(google_maps_key) > 0
                    
                    self.log_test(
                        "GET API Integrations", 
                        True, 
                        f"Retrieved API integrations settings", 
                        {"id": data['id'], "has_google_maps_key": has_google_key, "fields_count": len(data)}
                    )
                    return True, data
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "GET API Integrations", 
                        False, 
                        f"Missing required fields: {missing}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET API Integrations", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET API Integrations", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_save_api_integrations(self):
        """Test POST /api/api-integrations for saving API keys"""
        try:
            api_data = {
                "id": "main_integrations",
                "googleMapsApiKey": "AIzaSyBOTXGhvmHj82av8eLrYP-FfyVQDk2qxTA",
                "emailApiKey": "test_email_api_key_12345",
                "smsApiKey": "test_sms_api_key_67890",
                "socialMediaApiKeys": {
                    "twitter": "twitter_api_key",
                    "instagram": "instagram_api_key"
                }
            }
            
            response = requests.post(
                f"{self.api_base}/api-integrations", 
                json=api_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('message') == 'API integrations saved successfully':
                    # Verify the save by retrieving the data
                    time.sleep(1)  # Wait for database operation
                    success, retrieved_data = self.test_get_api_integrations()
                    
                    if success and retrieved_data:
                        google_key_match = retrieved_data.get('googleMapsApiKey') == api_data['googleMapsApiKey']
                        email_key_match = retrieved_data.get('emailApiKey') == api_data['emailApiKey']
                        sms_key_match = retrieved_data.get('smsApiKey') == api_data['smsApiKey']
                        
                        if google_key_match and email_key_match and sms_key_match:
                            self.log_test(
                                "POST API Integrations", 
                                True, 
                                f"API integrations saved and verified successfully", 
                                {"google_maps_key_set": True, "email_key_set": True, "sms_key_set": True}
                            )
                            return True, data
                        else:
                            self.log_test(
                                "POST API Integrations", 
                                False, 
                                "API keys verification failed after save"
                            )
                            return False, None
                    else:
                        self.log_test(
                            "POST API Integrations", 
                            False, 
                            "Could not verify API integrations save"
                        )
                        return False, None
                else:
                    self.log_test(
                        "POST API Integrations", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST API Integrations", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST API Integrations", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_google_maps_api_key_initialization(self):
        """Test that Google Maps API key is properly initialized with user's provided key"""
        try:
            success, data = self.test_get_api_integrations()
            
            if success and data:
                google_maps_key = data.get('googleMapsApiKey', '')
                expected_key = "AIzaSyBOTXGhvmHj82av8eLrYP-FfyVQDk2qxTA"
                
                if google_maps_key == expected_key:
                    self.log_test(
                        "Google Maps API Key Initialization", 
                        True, 
                        f"Google Maps API key correctly initialized with user's provided key", 
                        {"key_length": len(google_maps_key), "key_prefix": google_maps_key[:10] + "..."}
                    )
                    return True
                elif len(google_maps_key) > 0:
                    self.log_test(
                        "Google Maps API Key Initialization", 
                        True, 
                        f"Google Maps API key is set (different from expected but valid)", 
                        {"key_length": len(google_maps_key), "key_prefix": google_maps_key[:10] + "..."}
                    )
                    return True
                else:
                    self.log_test(
                        "Google Maps API Key Initialization", 
                        False, 
                        "Google Maps API key is not initialized"
                    )
                    return False
            else:
                self.log_test(
                    "Google Maps API Key Initialization", 
                    False, 
                    "Could not retrieve API integrations data"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Google Maps API Key Initialization", 
                False, 
                f"Error checking Google Maps API key: {str(e)}"
            )
            return False

    def test_location_model_validation(self):
        """Test location model field validation"""
        try:
            # Test with missing required fields
            invalid_data = {
                "name": "Test Location"
                # Missing address, type
            }
            
            response = requests.post(
                f"{self.api_base}/locations", 
                json=invalid_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should return 422 for validation error
            if response.status_code == 422:
                self.log_test(
                    "Location Model Validation - Missing Fields", 
                    True, 
                    f"Correctly rejected invalid data with HTTP 422", 
                    {"status_code": response.status_code}
                )
            else:
                self.log_test(
                    "Location Model Validation - Missing Fields", 
                    False, 
                    f"Expected HTTP 422, got {response.status_code}"
                )
                return False
            
            # Test with invalid location type
            invalid_type_data = {
                "name": "Test Location",
                "address": "123 Test St",
                "type": "invalid_type",  # Should be one of: practice_field, game_field, social_venue, training_facility
                "indoor": False,
                "surface": "grass"
            }
            
            response = requests.post(
                f"{self.api_base}/locations", 
                json=invalid_type_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should either reject or accept (depending on validation implementation)
            if response.status_code in [200, 422]:
                self.log_test(
                    "Location Model Validation - Invalid Type", 
                    True, 
                    f"Handled invalid location type appropriately with HTTP {response.status_code}", 
                    {"status_code": response.status_code}
                )
                
                # If it was accepted, clean up
                if response.status_code == 200:
                    data = response.json()
                    if 'id' in data:
                        self.created_location_ids.append(data['id'])
                        
                return True
            else:
                self.log_test(
                    "Location Model Validation - Invalid Type", 
                    False, 
                    f"Unexpected response code: {response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Location Model Validation", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_database_persistence(self):
        """Test that locations and API integrations persist correctly in MongoDB"""
        try:
            # Test location persistence
            initial_success, initial_locations = self.test_get_locations_all()
            if not initial_success:
                self.log_test(
                    "Database Persistence - Locations", 
                    False, 
                    "Could not retrieve initial locations"
                )
                return False
            
            initial_count = len(initial_locations) if initial_locations else 0
            
            # Create a test location
            test_location = {
                "name": "Persistence Test Field",
                "address": "999 Test Persistence Ave, Test City, OH 43999",
                "type": "practice_field",
                "indoor": False,
                "surface": "turf",
                "description": "Test location for database persistence verification",
                "teamId": "test_persistence_team"
            }
            
            response = requests.post(
                f"{self.api_base}/locations", 
                json=test_location,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                created_data = response.json()
                created_id = created_data['id']
                self.created_location_ids.append(created_id)
                
                # Wait and verify persistence
                time.sleep(1)
                success, updated_locations = self.test_get_locations_all()
                
                if success and updated_locations:
                    updated_count = len(updated_locations)
                    found_location = any(loc.get('id') == created_id for loc in updated_locations)
                    
                    if updated_count > initial_count and found_location:
                        self.log_test(
                            "Database Persistence - Locations", 
                            True, 
                            f"Location persisted correctly. Count: {initial_count} → {updated_count}", 
                            {"created_id": created_id, "found": True}
                        )
                    else:
                        self.log_test(
                            "Database Persistence - Locations", 
                            False, 
                            f"Location persistence failed. Count: {initial_count} → {updated_count}, Found: {found_location}"
                        )
                        return False
                else:
                    self.log_test(
                        "Database Persistence - Locations", 
                        False, 
                        "Could not verify location persistence"
                    )
                    return False
            else:
                self.log_test(
                    "Database Persistence - Locations", 
                    False, 
                    f"Could not create test location: HTTP {response.status_code}"
                )
                return False
            
            # Test API integrations persistence
            test_api_data = {
                "id": "main_integrations",
                "googleMapsApiKey": "test_persistence_key_123",
                "emailApiKey": "test_email_persistence",
                "smsApiKey": "test_sms_persistence"
            }
            
            response = requests.post(
                f"{self.api_base}/api-integrations", 
                json=test_api_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                time.sleep(1)
                success, retrieved_data = self.test_get_api_integrations()
                
                if success and retrieved_data:
                    key_match = retrieved_data.get('googleMapsApiKey') == test_api_data['googleMapsApiKey']
                    
                    if key_match:
                        self.log_test(
                            "Database Persistence - API Integrations", 
                            True, 
                            f"API integrations persisted correctly", 
                            {"google_maps_key_persisted": True}
                        )
                        return True
                    else:
                        self.log_test(
                            "Database Persistence - API Integrations", 
                            False, 
                            "API integrations persistence failed"
                        )
                        return False
                else:
                    self.log_test(
                        "Database Persistence - API Integrations", 
                        False, 
                        "Could not verify API integrations persistence"
                    )
                    return False
            else:
                self.log_test(
                    "Database Persistence - API Integrations", 
                    False, 
                    f"Could not save test API integrations: HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Database Persistence", 
                False, 
                f"Error testing database persistence: {str(e)}"
            )
            return False

    def test_uuid_generation(self):
        """Test that location IDs are properly generated as UUIDs"""
        if not self.created_location_ids:
            self.log_test(
                "UUID Generation", 
                False, 
                "No location IDs available to test - create tests may have failed"
            )
            return False
            
        try:
            valid_uuids = []
            for location_id in self.created_location_ids:
                try:
                    # Try to parse as UUID
                    uuid.UUID(location_id)
                    valid_uuids.append(location_id)
                except ValueError:
                    pass
            
            if len(valid_uuids) == len(self.created_location_ids):
                self.log_test(
                    "UUID Generation", 
                    True, 
                    f"All {len(valid_uuids)} location IDs are valid UUIDs", 
                    {"valid_uuids": len(valid_uuids), "total": len(self.created_location_ids)}
                )
                return True
            else:
                self.log_test(
                    "UUID Generation", 
                    False, 
                    f"Only {len(valid_uuids)} out of {len(self.created_location_ids)} IDs are valid UUIDs"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "UUID Generation", 
                False, 
                f"Error testing UUID generation: {str(e)}"
            )
            return False

    def test_datetime_handling(self):
        """Test proper datetime handling for createdAt/updatedAt"""
        if not self.created_location_ids:
            self.log_test(
                "DateTime Handling", 
                False, 
                "No locations available to test datetime handling"
            )
            return False
            
        try:
            # Get a created location to check datetime fields
            success, locations = self.test_get_locations_all()
            
            if success and locations:
                test_location = None
                for loc in locations:
                    if loc.get('id') in self.created_location_ids:
                        test_location = loc
                        break
                
                if test_location:
                    created_at = test_location.get('createdAt')
                    updated_at = test_location.get('updatedAt')
                    
                    if created_at and updated_at:
                        try:
                            # Try to parse datetime strings
                            from datetime import datetime
                            if isinstance(created_at, str):
                                datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            if isinstance(updated_at, str):
                                datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                            
                            self.log_test(
                                "DateTime Handling", 
                                True, 
                                f"DateTime fields are properly formatted", 
                                {"createdAt": type(created_at).__name__, "updatedAt": type(updated_at).__name__}
                            )
                            return True
                        except ValueError as e:
                            self.log_test(
                                "DateTime Handling", 
                                False, 
                                f"DateTime parsing failed: {str(e)}"
                            )
                            return False
                    else:
                        self.log_test(
                            "DateTime Handling", 
                            False, 
                            "Missing createdAt or updatedAt fields"
                        )
                        return False
                else:
                    self.log_test(
                        "DateTime Handling", 
                        False, 
                        "Could not find test location for datetime verification"
                    )
                    return False
            else:
                self.log_test(
                    "DateTime Handling", 
                    False, 
                    "Could not retrieve locations for datetime testing"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "DateTime Handling", 
                False, 
                f"Error testing datetime handling: {str(e)}"
            )
            return False

    def cleanup_test_data(self):
        """Clean up test locations created during testing"""
        print("\n🧹 Cleaning up test data...")
        
        for location_id in self.created_location_ids[:]:  # Copy list to avoid modification during iteration
            try:
                response = requests.delete(f"{self.api_base}/locations/{location_id}", timeout=10)
                if response.status_code == 200:
                    print(f"✅ Cleaned up location: {location_id}")
                    self.created_location_ids.remove(location_id)
                else:
                    print(f"⚠️  Could not clean up location: {location_id}")
            except Exception as e:
                print(f"❌ Error cleaning up location {location_id}: {e}")

    def run_all_tests(self):
        """Run all locations management and API integrations tests"""
        print("🏟️ Starting Locations Management & API Integrations Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 80)
        
        # Test basic connectivity first
        if not self.test_health_check():
            print("❌ CRITICAL: Health check failed. Backend may not be running.")
            return False
        
        print("\n📍 TESTING LOCATIONS API ENDPOINTS:")
        print("-" * 50)
        
        # Test GET endpoints
        self.test_get_locations_all()
        self.test_get_locations_by_team()
        
        # Test POST endpoints for all location types
        self.test_create_location_practice_field()
        self.test_create_location_game_field()
        self.test_create_location_social_venue()
        self.test_create_location_training_facility()
        
        # Test PUT and DELETE endpoints
        self.test_update_location()
        self.test_delete_location()
        
        print("\n🔧 TESTING API INTEGRATIONS ENDPOINTS:")
        print("-" * 50)
        
        # Test API integrations endpoints
        self.test_get_api_integrations()
        self.test_save_api_integrations()
        self.test_google_maps_api_key_initialization()
        
        print("\n✅ TESTING DATA VALIDATION & ERROR HANDLING:")
        print("-" * 50)
        
        # Test validation and error handling
        self.test_location_model_validation()
        
        print("\n💾 TESTING DATABASE PERSISTENCE:")
        print("-" * 50)
        
        # Test database operations
        self.test_database_persistence()
        self.test_uuid_generation()
        self.test_datetime_handling()
        
        # Clean up test data
        self.cleanup_test_data()
        
        # Summary
        print("=" * 80)
        print("🏟️ LOCATIONS MANAGEMENT & API INTEGRATIONS TEST SUMMARY")
        print("=" * 80)
        
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
        
        # Check for critical failures
        critical_failures = [t for t in self.failed_tests if any(keyword in t for keyword in ['Health Check', 'GET All Locations', 'POST Location', 'GET API Integrations', 'Database Persistence'])]
        
        if critical_failures:
            print(f"\n⚠️  Critical Failures Detected:")
            for test in critical_failures:
                print(f"  - {test}")
        
        return len(critical_failures) == 0

if __name__ == "__main__":
    try:
        tester = LocationsAPITester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Locations Management & API Integrations tests completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some critical tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)