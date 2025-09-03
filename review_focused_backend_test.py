#!/usr/bin/env python3
"""
Review-Focused Backend Testing Suite
Testing backend functionality after implementing data persistence fixes for event editing.
Focus areas from review request:
1. Basic API connectivity and health checks
2. Event data persistence (imageUrl, teamIds, custom locations)
3. League data GET/POST operations 
4. Database integrity after recent frontend changes
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

class ReviewFocusedTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🎯 REVIEW-FOCUSED BACKEND TESTING")
        print(f"Testing backend at: {self.api_base}")
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

    def test_basic_api_connectivity_and_health(self):
        """Test basic API connectivity and health checks as requested"""
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "1. Basic API Connectivity & Health Check", 
                        True, 
                        f"API responding correctly ({response_time:.2f}ms)", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "1. Basic API Connectivity & Health Check", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "1. Basic API Connectivity & Health Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "1. Basic API Connectivity & Health Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_league_data_get_post_operations(self):
        """Test League data GET/POST operations as requested"""
        try:
            # Test GET operation
            start_time = time.time()
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            get_time = (time.time() - start_time) * 1000
            
            if response.status_code != 200:
                self.log_test(
                    "2. League Data GET/POST Operations", 
                    False, 
                    f"GET failed: HTTP {response.status_code}: {response.text}"
                )
                return False
            
            data = response.json()
            required_fields = ['id', 'teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
            
            if not all(field in data for field in required_fields):
                missing = [f for f in required_fields if f not in data]
                self.log_test(
                    "2. League Data GET/POST Operations", 
                    False, 
                    f"GET missing required fields: {missing}"
                )
                return False
            
            # Test POST operation with comprehensive data
            test_data = {
                "teams": [
                    {"id": "review_test_team_1", "name": "Review Test Team 1", "division": "Field"},
                    {"id": "review_test_team_2", "name": "Review Test Team 2", "division": "Box"}
                ],
                "players": [
                    {"id": "player_1", "name": "Test Player 1", "teamId": "review_test_team_1"}
                ],
                "users": [
                    {"id": "user_1", "name": "Test User", "role": "admin"}
                ],
                "newsItems": [
                    {"id": "news_1", "title": "Test News", "content": "Test content"}
                ],
                "gameTickerData": [
                    {"id": "game_1", "homeTeam": "review_test_team_1", "awayTeam": "review_test_team_2"}
                ],
                "leagueSchedule": [
                    {
                        "id": "review_event_001",
                        "title": "Review Test Event",
                        "date": "2024-09-20",
                        "time": "18:00",
                        "location": "Review Test Field",
                        "type": "game",
                        "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
                        "teamIds": ["review_test_team_1", "review_test_team_2"],
                        "customLocation": {
                            "name": "Review Test Field",
                            "address": "123 Review St, Test City, TC 12345",
                            "type": "outdoor",
                            "description": "Custom location for review testing"
                        },
                        "homeScore": 0,
                        "awayScore": 0
                    }
                ],
                "leagueInfo": {"name": "Review Test League", "season": "2024"},
                "websiteStyle": {"theme": "review_test", "primaryColor": "#FF0000"}
            }
            
            start_time = time.time()
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            post_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                if result.get('message') == 'League data saved successfully':
                    self.log_test(
                        "2. League Data GET/POST Operations", 
                        True, 
                        f"GET ({get_time:.2f}ms) and POST ({post_time:.2f}ms) operations successful", 
                        {"teams": len(test_data["teams"]), "events": len(test_data["leagueSchedule"])}
                    )
                    return True, test_data
                else:
                    self.log_test(
                        "2. League Data GET/POST Operations", 
                        False, 
                        f"POST unexpected response: {result}"
                    )
                    return False, None
            else:
                self.log_test(
                    "2. League Data GET/POST Operations", 
                    False, 
                    f"POST failed: HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "2. League Data GET/POST Operations", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_event_data_persistence_comprehensive(self):
        """Test event data persistence (imageUrl, teamIds, custom locations) as requested"""
        try:
            # Wait for previous data to be written
            time.sleep(1)
            
            # Retrieve the data to verify persistence
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code != 200:
                self.log_test(
                    "3. Event Data Persistence (imageUrl, teamIds, custom locations)", 
                    False, 
                    f"Failed to retrieve data: HTTP {response.status_code}: {response.text}"
                )
                return False
            
            data = response.json()
            events = data.get('leagueSchedule', [])
            
            # Find our test event
            test_event = None
            for event in events:
                if event.get('id') == 'review_event_001':
                    test_event = event
                    break
            
            if not test_event:
                self.log_test(
                    "3. Event Data Persistence (imageUrl, teamIds, custom locations)", 
                    False, 
                    "Test event not found in retrieved data"
                )
                return False
            
            # Check imageUrl persistence
            expected_image_length = 407  # Length of our test base64 image
            actual_image = test_event.get('imageUrl', '')
            image_ok = len(actual_image) == expected_image_length and actual_image.startswith('data:image/')
            
            # Check teamIds persistence
            expected_teams = ["review_test_team_1", "review_test_team_2"]
            actual_teams = test_event.get('teamIds', [])
            teams_ok = actual_teams == expected_teams
            
            # Check custom location persistence
            expected_location = {
                "name": "Review Test Field",
                "address": "123 Review St, Test City, TC 12345",
                "type": "outdoor",
                "description": "Custom location for review testing"
            }
            actual_location = test_event.get('customLocation')
            location_ok = actual_location == expected_location
            
            # Overall assessment
            if image_ok and teams_ok and location_ok:
                self.log_test(
                    "3. Event Data Persistence (imageUrl, teamIds, custom locations)", 
                    True, 
                    f"All event data persisted correctly", 
                    {
                        "imageUrl": f"{len(actual_image)} chars",
                        "teamIds": actual_teams,
                        "customLocation": actual_location.get('name') if actual_location else None
                    }
                )
                return True
            else:
                issues = []
                if not image_ok:
                    issues.append(f"imageUrl issue (expected {expected_image_length} chars, got {len(actual_image)})")
                if not teams_ok:
                    issues.append(f"teamIds issue (expected {expected_teams}, got {actual_teams})")
                if not location_ok:
                    issues.append(f"customLocation issue (expected {expected_location}, got {actual_location})")
                
                self.log_test(
                    "3. Event Data Persistence (imageUrl, teamIds, custom locations)", 
                    False, 
                    f"Data persistence issues: {'; '.join(issues)}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "3. Event Data Persistence (imageUrl, teamIds, custom locations)", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_database_integrity_after_frontend_changes(self):
        """Test database integrity after recent frontend changes as requested"""
        try:
            # Get current database state
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code != 200:
                self.log_test(
                    "4. Database Integrity After Frontend Changes", 
                    False, 
                    f"Failed to retrieve data: HTTP {response.status_code}: {response.text}"
                )
                return False
            
            data = response.json()
            
            # Check data structure integrity
            required_sections = ['teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
            structure_ok = all(section in data for section in required_sections)
            
            # Check data consistency
            teams = data.get('teams', [])
            events = data.get('leagueSchedule', [])
            
            # Verify team references in events are valid
            team_ids = {team.get('id') for team in teams if team.get('id')}
            event_team_refs = []
            for event in events:
                event_teams = event.get('teamIds', [])
                event_team_refs.extend(event_teams)
            
            # Check if all referenced teams exist (allowing for test teams)
            valid_refs = all(team_id in team_ids or team_id.startswith('review_test_') or team_id.startswith('team_') for team_id in event_team_refs)
            
            # Check data types and required fields
            data_types_ok = True
            type_issues = []
            
            if not isinstance(teams, list):
                data_types_ok = False
                type_issues.append("teams not a list")
            
            if not isinstance(events, list):
                data_types_ok = False
                type_issues.append("leagueSchedule not a list")
            
            if not isinstance(data.get('leagueInfo', {}), dict):
                data_types_ok = False
                type_issues.append("leagueInfo not a dict")
            
            if not isinstance(data.get('websiteStyle', {}), dict):
                data_types_ok = False
                type_issues.append("websiteStyle not a dict")
            
            # Overall integrity assessment
            if structure_ok and valid_refs and data_types_ok:
                self.log_test(
                    "4. Database Integrity After Frontend Changes", 
                    True, 
                    f"Database integrity maintained", 
                    {
                        "teams_count": len(teams),
                        "events_count": len(events),
                        "team_references": len(event_team_refs),
                        "structure_complete": structure_ok
                    }
                )
                return True
            else:
                issues = []
                if not structure_ok:
                    missing = [s for s in required_sections if s not in data]
                    issues.append(f"missing sections: {missing}")
                if not valid_refs:
                    issues.append("invalid team references in events")
                if not data_types_ok:
                    issues.append(f"data type issues: {type_issues}")
                
                self.log_test(
                    "4. Database Integrity After Frontend Changes", 
                    False, 
                    f"Integrity issues detected: {'; '.join(issues)}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "4. Database Integrity After Frontend Changes", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_additional_api_endpoints(self):
        """Test additional API endpoints for completeness"""
        try:
            # Test status endpoints
            status_response = requests.get(f"{self.api_base}/status", timeout=10)
            status_ok = status_response.status_code == 200
            
            # Test specific data type update
            test_teams = [
                {"id": "additional_team_1", "name": "Additional Test Team 1"},
                {"id": "additional_team_2", "name": "Additional Test Team 2"}
            ]
            
            teams_response = requests.post(
                f"{self.api_base}/league-data/teams", 
                json=test_teams,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            teams_ok = teams_response.status_code == 200
            
            if status_ok and teams_ok:
                self.log_test(
                    "5. Additional API Endpoints", 
                    True, 
                    f"Status and specific data endpoints working", 
                    {"status_checks": "available", "teams_update": "successful"}
                )
                return True
            else:
                issues = []
                if not status_ok:
                    issues.append(f"status endpoint failed ({status_response.status_code})")
                if not teams_ok:
                    issues.append(f"teams update failed ({teams_response.status_code})")
                
                self.log_test(
                    "5. Additional API Endpoints", 
                    False, 
                    f"Endpoint issues: {'; '.join(issues)}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "5. Additional API Endpoints", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def run_review_focused_tests(self):
        """Run all review-focused tests"""
        print("🎯 REVIEW REQUEST: Test backend functionality after implementing data persistence fixes for event editing")
        print("Focus Areas:")
        print("1. Basic API connectivity and health checks")
        print("2. Event data persistence (imageUrl, teamIds, custom locations)")
        print("3. League data GET/POST operations")
        print("4. Database integrity after recent frontend changes")
        print("=" * 70)
        
        # Run tests in order of review requirements
        connectivity_ok = self.test_basic_api_connectivity_and_health()
        
        if not connectivity_ok:
            print("❌ CRITICAL: API connectivity failed. Cannot proceed with other tests.")
            return False
        
        league_ops_ok, test_data = self.test_league_data_get_post_operations()
        persistence_ok = self.test_event_data_persistence_comprehensive()
        integrity_ok = self.test_database_integrity_after_frontend_changes()
        additional_ok = self.test_additional_api_endpoints()
        
        # Summary
        print("=" * 70)
        print("🎯 REVIEW-FOCUSED TEST SUMMARY")
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
        
        # Review-specific assessment
        critical_areas = [connectivity_ok, league_ops_ok, persistence_ok, integrity_ok]
        critical_success = all(critical_areas)
        
        print(f"\n🎯 REVIEW REQUIREMENTS ASSESSMENT:")
        print(f"✅ Basic API connectivity and health checks: {'PASS' if connectivity_ok else 'FAIL'}")
        print(f"✅ League data GET/POST operations: {'PASS' if league_ops_ok else 'FAIL'}")
        print(f"✅ Event data persistence (imageUrl, teamIds, custom locations): {'PASS' if persistence_ok else 'FAIL'}")
        print(f"✅ Database integrity after frontend changes: {'PASS' if integrity_ok else 'FAIL'}")
        print(f"✅ Additional API endpoints: {'PASS' if additional_ok else 'FAIL'}")
        
        return critical_success

if __name__ == "__main__":
    try:
        tester = ReviewFocusedTester()
        success = tester.run_review_focused_tests()
        
        if success:
            print("\n🎉 Review-focused backend tests completed successfully!")
            print("✅ Backend remains stable after frontend data persistence improvements")
            sys.exit(0)
        else:
            print("\n⚠️  Some critical backend tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)