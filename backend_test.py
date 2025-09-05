#!/usr/bin/env python3
"""
Backend API Testing Suite for Lacrosse League Management Application
Tests all backend endpoints for functionality, connectivity, and database operations.
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

class BackendTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
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

    def test_health_check(self):
        """Test basic API connectivity and health check"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "Health Check Endpoint", 
                        True, 
                        f"Status: {response.status_code}", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Health Check Endpoint", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Health Check Endpoint", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Health Check Endpoint", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_get_status_checks(self):
        """Test GET /api/status endpoint"""
        try:
            response = requests.get(f"{self.api_base}/status", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "GET Status Checks", 
                        True, 
                        f"Retrieved {len(data)} status checks", 
                        f"Count: {len(data)}"
                    )
                    return True, data
                else:
                    self.log_test(
                        "GET Status Checks", 
                        False, 
                        f"Expected list, got: {type(data)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET Status Checks", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET Status Checks", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_create_status_check(self):
        """Test POST /api/status endpoint"""
        try:
            test_data = {
                "client_name": "LacrosseTestClient"
            }
            
            response = requests.post(
                f"{self.api_base}/status", 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'client_name', 'timestamp']
                
                if all(field in data for field in required_fields):
                    if data['client_name'] == test_data['client_name']:
                        self.log_test(
                            "POST Status Check", 
                            True, 
                            f"Created status check with ID: {data['id']}", 
                            {k: v for k, v in data.items() if k != 'timestamp'}
                        )
                        return True, data
                    else:
                        self.log_test(
                            "POST Status Check", 
                            False, 
                            f"Client name mismatch: expected {test_data['client_name']}, got {data['client_name']}"
                        )
                        return False, None
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "POST Status Check", 
                        False, 
                        f"Missing required fields: {missing}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST Status Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Status Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_database_persistence(self):
        """Test that data persists in database by creating and retrieving"""
        print("Testing Database Persistence...")
        
        # Get initial count
        success, initial_data = self.test_get_status_checks()
        if not success:
            return False
        
        initial_count = len(initial_data) if initial_data else 0
        
        # Create a new status check
        success, created_data = self.test_create_status_check()
        if not success:
            return False
        
        # Wait a moment for database write
        time.sleep(1)
        
        # Get updated count
        success, updated_data = self.test_get_status_checks()
        if not success:
            return False
        
        updated_count = len(updated_data) if updated_data else 0
        
        if updated_count > initial_count:
            # Verify our created item is in the list
            created_id = created_data['id']
            found_item = None
            for item in updated_data:
                if item.get('id') == created_id:
                    found_item = item
                    break
            
            if found_item:
                self.log_test(
                    "Database Persistence", 
                    True, 
                    f"Data persisted successfully. Count increased from {initial_count} to {updated_count}",
                    f"Found created item with ID: {created_id}"
                )
                return True
            else:
                self.log_test(
                    "Database Persistence", 
                    False, 
                    f"Created item with ID {created_id} not found in database"
                )
                return False
        else:
            self.log_test(
                "Database Persistence", 
                False, 
                f"Count did not increase. Initial: {initial_count}, Updated: {updated_count}"
            )
            return False

    def test_api_response_times(self):
        """Test API response times"""
        endpoints = [
            ("Health Check", f"{self.api_base}/"),
            ("GET Status", f"{self.api_base}/status")
        ]
        
        all_fast = True
        for name, url in endpoints:
            try:
                start_time = time.time()
                response = requests.get(url, timeout=10)
                end_time = time.time()
                
                response_time = (end_time - start_time) * 1000  # Convert to ms
                
                if response.status_code == 200 and response_time < 5000:  # 5 second threshold
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
        
        return all_fast

    def test_get_league_data(self):
        """Test GET /api/league-data endpoint"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
                
                if all(field in data for field in required_fields):
                    self.log_test(
                        "GET League Data", 
                        True, 
                        f"Retrieved league data with {len(data.get('teams', []))} teams", 
                        f"ID: {data.get('id')}"
                    )
                    return True, data
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "GET League Data", 
                        False, 
                        f"Missing required fields: {missing}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET League Data", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET League Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_save_league_data(self):
        """Test POST /api/league-data endpoint"""
        try:
            test_data = {
                "teams": [{"id": "test_team", "name": "Test Team"}],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {"name": "Test League"},
                "websiteStyle": {"theme": "default"}
            }
            
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    self.log_test(
                        "POST League Data", 
                        True, 
                        f"League data saved successfully", 
                        {"message": data.get('message')}
                    )
                    return True, data
                else:
                    self.log_test(
                        "POST League Data", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST League Data", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST League Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_update_specific_data(self):
        """Test POST /api/league-data/{data_type} endpoint"""
        try:
            test_teams = [
                {"id": "team1", "name": "Test Team 1", "division": "Field"},
                {"id": "team2", "name": "Test Team 2", "division": "Box"}
            ]
            
            response = requests.post(
                f"{self.api_base}/league-data/teams", 
                json=test_teams,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'teams updated successfully':
                    self.log_test(
                        "POST Specific Data (teams)", 
                        True, 
                        f"Teams data updated successfully", 
                        {"message": data.get('message')}
                    )
                    return True, data
                else:
                    self.log_test(
                        "POST Specific Data (teams)", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST Specific Data (teams)", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Specific Data (teams)", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_get_teams_api(self):
        """Test GET /api/teams endpoint for event management system"""
        try:
            response = requests.get(f"{self.api_base}/teams", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "GET Teams API", 
                        True, 
                        f"Retrieved {len(data)} teams for event team selection", 
                        f"Teams available: {len(data)}"
                    )
                    return True, data
                else:
                    self.log_test(
                        "GET Teams API", 
                        False, 
                        f"Expected list, got: {type(data)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET Teams API", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET Teams API", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_get_players_api(self):
        """Test GET /api/players endpoint for RSVP functionality"""
        try:
            response = requests.get(f"{self.api_base}/players", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "GET Players API", 
                        True, 
                        f"Retrieved {len(data)} players for RSVP functionality", 
                        f"Players available: {len(data)}"
                    )
                    return True, data
                else:
                    self.log_test(
                        "GET Players API", 
                        False, 
                        f"Expected list, got: {type(data)}"
                    )
                    return False, None
            else:
                self.log_test(
                    "GET Players API", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET Players API", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_basic_event_storage(self):
        """Test basic event data storage capability using league-data endpoint"""
        try:
            # Create sample event data
            sample_event = {
                "id": "test_event_001",
                "title": "Test Practice Session",
                "date": "2024-01-15",
                "time": "18:00",
                "location": "Main Field",
                "type": "practice",
                "teamIds": ["team1"],
                "description": "Test event for backend verification"
            }
            
            # Get current league data
            success, current_data = self.test_get_league_data()
            if not success:
                self.log_test(
                    "Basic Event Storage", 
                    False, 
                    "Could not retrieve current league data"
                )
                return False
            
            # Add event to leagueSchedule
            if 'leagueSchedule' not in current_data:
                current_data['leagueSchedule'] = []
            
            current_data['leagueSchedule'].append(sample_event)
            
            # Save updated data
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=current_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify the event was stored
                time.sleep(1)  # Wait for database write
                success, updated_data = self.test_get_league_data()
                
                if success and updated_data:
                    stored_events = updated_data.get('leagueSchedule', [])
                    test_event_found = any(
                        event.get('id') == sample_event['id'] 
                        for event in stored_events
                    )
                    
                    if test_event_found:
                        self.log_test(
                            "Basic Event Storage", 
                            True, 
                            f"Event stored successfully in leagueSchedule", 
                            f"Event ID: {sample_event['id']}"
                        )
                        return True
                    else:
                        self.log_test(
                            "Basic Event Storage", 
                            False, 
                            "Event not found after storage attempt"
                        )
                        return False
                else:
                    self.log_test(
                        "Basic Event Storage", 
                        False, 
                        "Could not verify event storage"
                    )
                    return False
            else:
                self.log_test(
                    "Basic Event Storage", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Basic Event Storage", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False
        except Exception as e:
            self.log_test(
                "Basic Event Storage", 
                False, 
                f"Unexpected error: {str(e)}"
            )
            return False

    def test_mongodb_connection(self):
        """Test MongoDB connection by performing database operations"""
        try:
            # Test database connectivity through API operations
            print("Testing MongoDB Connection...")
            
            # Test 1: Read operation
            success, _ = self.test_get_league_data()
            if not success:
                self.log_test(
                    "MongoDB Connection (Read)", 
                    False, 
                    "Could not perform read operation"
                )
                return False
            
            # Test 2: Write operation
            test_data = {
                "teams": [],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [],
                "leagueInfo": {"test": "mongodb_connection_test"},
                "websiteStyle": {}
            }
            
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Test 3: Verify write persisted
                time.sleep(1)
                success, updated_data = self.test_get_league_data()
                
                if success and updated_data:
                    test_value = updated_data.get('leagueInfo', {}).get('test')
                    if test_value == "mongodb_connection_test":
                        self.log_test(
                            "MongoDB Connection", 
                            True, 
                            "Database read/write operations successful", 
                            "Connection verified"
                        )
                        return True
                    else:
                        self.log_test(
                            "MongoDB Connection", 
                            False, 
                            "Write operation did not persist correctly"
                        )
                        return False
                else:
                    self.log_test(
                        "MongoDB Connection", 
                        False, 
                        "Could not verify write operation"
                    )
                    return False
            else:
                self.log_test(
                    "MongoDB Connection", 
                    False, 
                    f"Write operation failed: HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "MongoDB Connection", 
                False, 
                f"Database connection error: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("Starting Backend API Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 60)
        
        # Test basic connectivity first
        if not self.test_health_check():
            print("❌ CRITICAL: Health check failed. Backend may not be running.")
            return False
        
        # Test MongoDB connection
        if not self.test_mongodb_connection():
            print("❌ CRITICAL: MongoDB connection failed.")
            return False
        
        # Test event management infrastructure (as requested in review)
        print("\n🎯 TESTING EVENT MANAGEMENT INFRASTRUCTURE:")
        self.test_get_teams_api()
        self.test_get_players_api()
        self.test_basic_event_storage()
        
        # Test individual endpoints
        self.test_get_status_checks()
        self.test_create_status_check()
        
        # Test league data endpoints
        self.test_get_league_data()
        self.test_save_league_data()
        self.test_update_specific_data()
        
        # Test database functionality
        self.test_database_persistence()
        
        # Test performance
        self.test_api_response_times()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
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
        
        # Check for critical failures specific to event management infrastructure
        event_management_failures = [t for t in self.failed_tests if any(keyword in t for keyword in ['Teams API', 'Players API', 'Event Storage', 'MongoDB Connection'])]
        critical_failures = [t for t in self.failed_tests if 'Health Check' in t or 'Database Persistence' in t]
        
        if event_management_failures:
            print(f"\n⚠️  Event Management Infrastructure Issues:")
            for test in event_management_failures:
                print(f"  - {test}")
        
        return len(critical_failures) == 0 and len(event_management_failures) == 0

if __name__ == "__main__":
    try:
        tester = BackendTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Backend API tests completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some backend tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)