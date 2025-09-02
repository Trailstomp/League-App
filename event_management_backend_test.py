#!/usr/bin/env python3
"""
Event Management & Ticker Synchronization Backend Testing Suite
Focused testing for backend API functionality supporting event management and ticker features.
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

class EventManagementTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"Testing Event Management Backend at: {self.api_base}")
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

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "Basic API Connectivity", 
                        True, 
                        f"Backend responding correctly (Status: {response.status_code})", 
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Basic API Connectivity", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Basic API Connectivity", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Basic API Connectivity", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_league_data_structure(self):
        """Test league data structure supports event management"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for required fields for event management
                required_fields = ['teams', 'leagueSchedule', 'gameTickerData', 'newsItems']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Check data types
                    teams_count = len(data.get('teams', []))
                    schedule_count = len(data.get('leagueSchedule', []))
                    ticker_count = len(data.get('gameTickerData', []))
                    news_count = len(data.get('newsItems', []))
                    
                    self.log_test(
                        "League Data Structure for Events", 
                        True, 
                        f"All event-related fields present. Teams: {teams_count}, Schedule: {schedule_count}, Ticker: {ticker_count}, News: {news_count}", 
                        {"teams": teams_count, "schedule": schedule_count, "ticker": ticker_count, "news": news_count}
                    )
                    return True, data
                else:
                    self.log_test(
                        "League Data Structure for Events", 
                        False, 
                        f"Missing required fields for event management: {missing_fields}"
                    )
                    return False, None
            else:
                self.log_test(
                    "League Data Structure for Events", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "League Data Structure for Events", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_event_data_persistence(self):
        """Test event data can be saved and retrieved"""
        try:
            # Create test event data
            test_event_data = {
                "id": str(uuid.uuid4()),
                "title": "OH10 Lacrosse Team Practice",
                "type": "practice",
                "date": (datetime.now() + timedelta(days=5)).isoformat(),
                "time": "18:00",
                "location": "Main Field",
                "teams": ["OH10 Lacrosse Team"],
                "description": "Regular team practice session",
                "created_at": datetime.now().isoformat()
            }
            
            # Get current league data
            get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if get_response.status_code != 200:
                self.log_test(
                    "Event Data Persistence - Get Current Data", 
                    False, 
                    f"Failed to get current data: HTTP {get_response.status_code}"
                )
                return False
            
            current_data = get_response.json()
            
            # Add test event to schedule
            current_schedule = current_data.get('leagueSchedule', [])
            current_schedule.append(test_event_data)
            
            # Save updated data
            save_response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=current_schedule,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if save_response.status_code == 200:
                # Verify data was saved by retrieving it
                time.sleep(1)  # Allow for database write
                
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    saved_schedule = verify_data.get('leagueSchedule', [])
                    
                    # Check if our test event is in the saved data
                    found_event = None
                    for event in saved_schedule:
                        if event.get('id') == test_event_data['id']:
                            found_event = event
                            break
                    
                    if found_event:
                        self.log_test(
                            "Event Data Persistence", 
                            True, 
                            f"Event successfully saved and retrieved. Schedule now has {len(saved_schedule)} events", 
                            {"event_id": found_event['id'], "title": found_event['title']}
                        )
                        return True
                    else:
                        self.log_test(
                            "Event Data Persistence", 
                            False, 
                            f"Test event not found in saved data. Expected ID: {test_event_data['id']}"
                        )
                        return False
                else:
                    self.log_test(
                        "Event Data Persistence", 
                        False, 
                        f"Failed to verify saved data: HTTP {verify_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Event Data Persistence", 
                    False, 
                    f"Failed to save event data: HTTP {save_response.status_code}: {save_response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Data Persistence", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_ticker_data_management(self):
        """Test ticker data can be managed for synchronization"""
        try:
            # Create test ticker data
            test_ticker_data = [
                {
                    "id": str(uuid.uuid4()),
                    "type": "game",
                    "title": "Thunder Hawks vs Lightning Bolts",
                    "date": (datetime.now() + timedelta(days=3)).isoformat(),
                    "time": "19:00",
                    "status": "Upcoming",
                    "teams": ["Thunder Hawks", "Lightning Bolts"]
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "practice",
                    "title": "Team Practice Session",
                    "date": (datetime.now() + timedelta(days=1)).isoformat(),
                    "time": "18:30",
                    "status": "Scheduled",
                    "teams": ["OH10 Lacrosse Team"]
                }
            ]
            
            # Save ticker data
            save_response = requests.post(
                f"{self.api_base}/league-data/gameTickerData", 
                json=test_ticker_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if save_response.status_code == 200:
                # Verify ticker data was saved
                time.sleep(1)
                
                verify_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    saved_ticker = verify_data.get('gameTickerData', [])
                    
                    # Verify both test items are present
                    found_items = 0
                    for ticker_item in saved_ticker:
                        for test_item in test_ticker_data:
                            if ticker_item.get('id') == test_item['id']:
                                found_items += 1
                                break
                    
                    if found_items == len(test_ticker_data):
                        self.log_test(
                            "Ticker Data Management", 
                            True, 
                            f"All {len(test_ticker_data)} ticker items saved successfully. Total ticker items: {len(saved_ticker)}", 
                            {"saved_items": found_items, "total_ticker_items": len(saved_ticker)}
                        )
                        return True
                    else:
                        self.log_test(
                            "Ticker Data Management", 
                            False, 
                            f"Only {found_items} of {len(test_ticker_data)} ticker items found in saved data"
                        )
                        return False
                else:
                    self.log_test(
                        "Ticker Data Management", 
                        False, 
                        f"Failed to verify ticker data: HTTP {verify_response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "Ticker Data Management", 
                    False, 
                    f"Failed to save ticker data: HTTP {save_response.status_code}: {save_response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Ticker Data Management", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_database_integrity(self):
        """Test database maintains data integrity across operations"""
        try:
            # Get initial state
            initial_response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if initial_response.status_code != 200:
                self.log_test(
                    "Database Integrity", 
                    False, 
                    f"Failed to get initial state: HTTP {initial_response.status_code}"
                )
                return False
            
            initial_data = initial_response.json()
            initial_teams_count = len(initial_data.get('teams', []))
            initial_schedule_count = len(initial_data.get('leagueSchedule', []))
            
            # Perform multiple operations
            operations_successful = 0
            
            # Operation 1: Update teams
            test_teams = [
                {"id": "integrity_test_1", "name": "Integrity Test Team 1", "division": "Field"},
                {"id": "integrity_test_2", "name": "Integrity Test Team 2", "division": "Box"}
            ]
            
            teams_response = requests.post(
                f"{self.api_base}/league-data/teams", 
                json=test_teams,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if teams_response.status_code == 200:
                operations_successful += 1
            
            # Operation 2: Update news items
            test_news = [
                {
                    "id": str(uuid.uuid4()),
                    "heading": "Database Integrity Test",
                    "text": "Testing database integrity",
                    "date": datetime.now().isoformat()
                }
            ]
            
            news_response = requests.post(
                f"{self.api_base}/league-data/newsItems", 
                json=test_news,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if news_response.status_code == 200:
                operations_successful += 1
            
            # Wait for operations to complete
            time.sleep(2)
            
            # Verify final state
            final_response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if final_response.status_code == 200:
                final_data = final_response.json()
                
                # Check that all required fields are still present
                required_fields = ['id', 'teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
                all_fields_present = all(field in final_data for field in required_fields)
                
                # Check that our operations were successful
                final_teams = final_data.get('teams', [])
                final_news = final_data.get('newsItems', [])
                
                integrity_test_teams = [t for t in final_teams if t.get('id', '').startswith('integrity_test_')]
                integrity_test_news = [n for n in final_news if 'Database Integrity Test' in n.get('heading', '')]
                
                if all_fields_present and len(integrity_test_teams) == 2 and len(integrity_test_news) == 1:
                    self.log_test(
                        "Database Integrity", 
                        True, 
                        f"Database integrity maintained. {operations_successful}/2 operations successful. All fields present.", 
                        {
                            "operations_successful": operations_successful,
                            "all_fields_present": all_fields_present,
                            "test_teams_found": len(integrity_test_teams),
                            "test_news_found": len(integrity_test_news)
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Database Integrity", 
                        False, 
                        f"Database integrity issues. Fields present: {all_fields_present}, Test teams: {len(integrity_test_teams)}, Test news: {len(integrity_test_news)}"
                    )
                    return False
            else:
                self.log_test(
                    "Database Integrity", 
                    False, 
                    f"Failed to get final state: HTTP {final_response.status_code}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Database Integrity", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_api_performance(self):
        """Test API response times for event-related operations"""
        endpoints = [
            ("Health Check", f"{self.api_base}/"),
            ("GET League Data", f"{self.api_base}/league-data"),
            ("GET Status Checks", f"{self.api_base}/status")
        ]
        
        all_fast = True
        response_times = []
        
        for name, url in endpoints:
            try:
                start_time = time.time()
                response = requests.get(url, timeout=10)
                end_time = time.time()
                
                response_time = (end_time - start_time) * 1000  # Convert to ms
                response_times.append(response_time)
                
                if response.status_code == 200 and response_time < 2000:  # 2 second threshold
                    self.log_test(
                        f"API Performance - {name}", 
                        True, 
                        f"Response time: {response_time:.2f}ms"
                    )
                else:
                    self.log_test(
                        f"API Performance - {name}", 
                        False, 
                        f"Slow response: {response_time:.2f}ms or HTTP {response.status_code}"
                    )
                    all_fast = False
                    
            except requests.exceptions.RequestException as e:
                self.log_test(
                    f"API Performance - {name}", 
                    False, 
                    f"Request failed: {str(e)}"
                )
                all_fast = False
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            self.log_test(
                "Overall API Performance", 
                all_fast, 
                f"Average response time: {avg_response_time:.2f}ms across {len(response_times)} endpoints"
            )
        
        return all_fast

    def test_no_regressions(self):
        """Test that frontend fixes haven't caused backend regressions"""
        try:
            # Test all basic endpoints still work
            endpoints_to_test = [
                ("GET /api/", "Health check"),
                ("GET /api/status", "Status checks"),
                ("GET /api/league-data", "League data retrieval")
            ]
            
            all_working = True
            working_endpoints = 0
            
            for endpoint, description in endpoints_to_test:
                try:
                    url = f"{self.backend_url}{endpoint}"
                    response = requests.get(url, timeout=10)
                    
                    if response.status_code == 200:
                        working_endpoints += 1
                    else:
                        all_working = False
                        print(f"    ❌ {description}: HTTP {response.status_code}")
                        
                except requests.exceptions.RequestException as e:
                    all_working = False
                    print(f"    ❌ {description}: Connection error - {str(e)}")
            
            if all_working and working_endpoints == len(endpoints_to_test):
                self.log_test(
                    "No Backend Regressions", 
                    True, 
                    f"All {working_endpoints}/{len(endpoints_to_test)} core endpoints working correctly after frontend fixes", 
                    {"working_endpoints": working_endpoints, "total_endpoints": len(endpoints_to_test)}
                )
                return True
            else:
                self.log_test(
                    "No Backend Regressions", 
                    False, 
                    f"Only {working_endpoints}/{len(endpoints_to_test)} endpoints working correctly"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "No Backend Regressions", 
                False, 
                f"Regression test failed: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all event management backend tests"""
        print("Starting Event Management & Ticker Synchronization Backend Tests...")
        print(f"Target URL: {self.api_base}")
        print("=" * 70)
        
        # Test basic connectivity first
        if not self.test_basic_connectivity():
            print("❌ CRITICAL: Basic connectivity failed. Backend may not be running.")
            return False
        
        # Test event management specific functionality
        self.test_league_data_structure()
        self.test_event_data_persistence()
        self.test_ticker_data_management()
        self.test_database_integrity()
        self.test_api_performance()
        self.test_no_regressions()
        
        # Summary
        print("=" * 70)
        print("EVENT MANAGEMENT BACKEND TEST SUMMARY")
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
        
        # Return True if all critical tests pass
        critical_failures = [t for t in self.failed_tests if any(keyword in t for keyword in ['Connectivity', 'Persistence', 'Integrity', 'Regressions'])]
        return len(critical_failures) == 0

if __name__ == "__main__":
    try:
        tester = EventManagementTester()
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 Event Management Backend tests completed successfully!")
            print("✅ Backend fully supports event management and ticker synchronization features!")
            sys.exit(0)
        else:
            print("\n⚠️  Some event management backend tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Event management test setup failed: {e}")
        sys.exit(1)