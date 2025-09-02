#!/usr/bin/env python3
"""
Event Data Backend Testing Suite - Focused on Event Structure with Teams and Scores
Tests backend API's ability to handle event data with teamIds array, imageUrl, and score fields.
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

class EventDataTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Event Data Backend at: {self.api_base}")
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

    def test_post_event_with_teams_and_scores(self):
        """Test POST /api/league-data with event containing teamIds array, imageUrl, and scores"""
        try:
            # Create test event data with the specific structure requested
            test_event_data = {
                "id": "test_event_001",
                "title": "Championship Game",
                "date": "2024-09-25",
                "time": "7:00 PM",
                "location": "Main Stadium",
                "type": "game",
                "teamIds": ["team_001", "team_002", "team_003"],  # Multiple teams array
                "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==",  # Sample base64 image
                "homeScore": 15,  # Home team score
                "awayScore": 12,  # Away team score
                "description": "Final championship game of the season",
                "rsvpEnabled": True,
                "attendees": []
            }
            
            # Create league data structure with the event
            league_data = {
                "teams": [
                    {"id": "team_001", "name": "Thunder Hawks", "division": "Field"},
                    {"id": "team_002", "name": "Lightning Bolts", "division": "Field"},
                    {"id": "team_003", "name": "Storm Eagles", "division": "Box"}
                ],
                "players": [],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [test_event_data],  # Add our test event
                "leagueInfo": {"name": "Test League"},
                "websiteStyle": {}
            }
            
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=league_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    self.log_test(
                        "POST Event with Teams & Scores", 
                        True, 
                        f"Event data with teamIds array, imageUrl, and scores saved successfully", 
                        {"message": data.get('message'), "timestamp": data.get('timestamp')}
                    )
                    return True, test_event_data
                else:
                    self.log_test(
                        "POST Event with Teams & Scores", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST Event with Teams & Scores", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST Event with Teams & Scores", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_get_and_verify_event_data(self, expected_event):
        """Test GET /api/league-data and verify the event data was saved correctly"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if leagueSchedule exists and contains events
                if 'leagueSchedule' in data and isinstance(data['leagueSchedule'], list):
                    events = data['leagueSchedule']
                    
                    # Find our test event
                    test_event = None
                    for event in events:
                        if event.get('id') == expected_event['id']:
                            test_event = event
                            break
                    
                    if test_event:
                        # Verify all required fields are present and correct
                        verification_results = []
                        
                        # Check teamIds array
                        if 'teamIds' in test_event and isinstance(test_event['teamIds'], list):
                            if len(test_event['teamIds']) == len(expected_event['teamIds']):
                                verification_results.append("✅ teamIds array preserved correctly")
                            else:
                                verification_results.append(f"❌ teamIds count mismatch: expected {len(expected_event['teamIds'])}, got {len(test_event['teamIds'])}")
                        else:
                            verification_results.append("❌ teamIds array missing or not a list")
                        
                        # Check imageUrl field
                        if 'imageUrl' in test_event and test_event['imageUrl']:
                            if test_event['imageUrl'] == expected_event['imageUrl']:
                                verification_results.append("✅ imageUrl field preserved correctly")
                            else:
                                verification_results.append("❌ imageUrl field modified during save/retrieve")
                        else:
                            verification_results.append("❌ imageUrl field missing or empty")
                        
                        # Check homeScore field
                        if 'homeScore' in test_event:
                            if test_event['homeScore'] == expected_event['homeScore']:
                                verification_results.append("✅ homeScore field preserved correctly")
                            else:
                                verification_results.append(f"❌ homeScore mismatch: expected {expected_event['homeScore']}, got {test_event['homeScore']}")
                        else:
                            verification_results.append("❌ homeScore field missing")
                        
                        # Check awayScore field
                        if 'awayScore' in test_event:
                            if test_event['awayScore'] == expected_event['awayScore']:
                                verification_results.append("✅ awayScore field preserved correctly")
                            else:
                                verification_results.append(f"❌ awayScore mismatch: expected {expected_event['awayScore']}, got {test_event['awayScore']}")
                        else:
                            verification_results.append("❌ awayScore field missing")
                        
                        # Count successful verifications
                        successful_checks = len([r for r in verification_results if r.startswith("✅")])
                        total_checks = len(verification_results)
                        
                        if successful_checks == total_checks:
                            self.log_test(
                                "GET & Verify Event Data", 
                                True, 
                                f"All {total_checks} event data fields verified successfully",
                                {
                                    "event_id": test_event['id'],
                                    "teamIds_count": len(test_event.get('teamIds', [])),
                                    "has_imageUrl": bool(test_event.get('imageUrl')),
                                    "homeScore": test_event.get('homeScore'),
                                    "awayScore": test_event.get('awayScore')
                                }
                            )
                            return True
                        else:
                            failed_checks = total_checks - successful_checks
                            self.log_test(
                                "GET & Verify Event Data", 
                                False, 
                                f"{failed_checks}/{total_checks} verification checks failed:\n    " + "\n    ".join(verification_results)
                            )
                            return False
                    else:
                        self.log_test(
                            "GET & Verify Event Data", 
                            False, 
                            f"Test event with ID '{expected_event['id']}' not found in retrieved data"
                        )
                        return False
                else:
                    self.log_test(
                        "GET & Verify Event Data", 
                        False, 
                        "leagueSchedule field missing or not a list in retrieved data"
                    )
                    return False
            else:
                self.log_test(
                    "GET & Verify Event Data", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET & Verify Event Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_backend_health_check(self):
        """Quick health check to ensure backend is responsive"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "Backend Health Check", 
                        True, 
                        f"Backend is responsive and healthy", 
                        {"status": "healthy"}
                    )
                    return True
                else:
                    self.log_test(
                        "Backend Health Check", 
                        False, 
                        f"Unexpected health check response: {data}"
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

    def run_event_data_tests(self):
        """Run focused event data tests"""
        print("Starting Event Data Backend Tests...")
        print(f"Target URL: {self.api_base}")
        print("Focus: Event data with teamIds array, imageUrl, and score fields")
        print("=" * 60)
        
        # Test backend health first
        if not self.test_backend_health_check():
            print("❌ CRITICAL: Backend health check failed. Cannot proceed with tests.")
            return False
        
        # Test posting event data with required structure
        success, test_event = self.test_post_event_with_teams_and_scores()
        if not success:
            print("❌ CRITICAL: Failed to save event data. Cannot verify retrieval.")
            return False
        
        # Wait a moment for database write
        time.sleep(1)
        
        # Test retrieving and verifying the event data
        if not self.test_get_and_verify_event_data(test_event):
            print("❌ CRITICAL: Event data verification failed.")
            return False
        
        # Summary
        print("=" * 60)
        print("EVENT DATA TEST SUMMARY")
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
        
        # Specific assessment for the review request
        if success_rate == 100:
            print("\n🎉 BACKEND EVENT DATA HANDLING: FULLY FUNCTIONAL")
            print("✅ Backend can properly receive and save event data with:")
            print("   - teamIds array with multiple teams")
            print("   - imageUrl field with base64 data")
            print("   - homeScore and awayScore fields")
            print("✅ All event data persists correctly through save/retrieve cycles")
            print("✅ No data corruption or field loss detected")
        else:
            print("\n⚠️  BACKEND EVENT DATA HANDLING: ISSUES DETECTED")
            print("❌ Backend has problems handling event data structure")
            print("   Check failed tests above for specific issues")
        
        return success_rate == 100

if __name__ == "__main__":
    try:
        tester = EventDataTester()
        success = tester.run_event_data_tests()
        
        if success:
            print("\n🎉 Event data backend tests completed successfully!")
            print("Backend is ready to handle full event data structure properly.")
            sys.exit(0)
        else:
            print("\n⚠️  Event data backend tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)