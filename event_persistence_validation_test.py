#!/usr/bin/env python3
"""
Event Persistence Validation Testing Suite
Focused testing for the user's reported issue where events disappear after refresh
despite previous fixes. Tests specific areas mentioned in the review request.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
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

class EventPersistenceValidator:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🔍 EVENT PERSISTENCE VALIDATION TESTING")
        print(f"Testing backend at: {self.api_base}")
        print("=" * 70)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            if isinstance(response_data, dict) and len(str(response_data)) > 200:
                print(f"    Response: [Large data object - {len(str(response_data))} chars]")
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

    def test_current_database_state(self):
        """Test 1: Check what events are actually stored in the database right now"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                print(f"📊 CURRENT DATABASE STATE ANALYSIS:")
                print(f"    Total events in leagueSchedule: {len(league_schedule)}")
                
                if league_schedule:
                    print(f"    Events found:")
                    for i, event in enumerate(league_schedule, 1):
                        event_id = event.get('id', 'No ID')
                        event_title = event.get('title', 'No Title')
                        event_date = event.get('date', 'No Date')
                        event_time = event.get('time', 'No Time')
                        print(f"      {i}. ID: {event_id}")
                        print(f"         Title: {event_title}")
                        print(f"         Date: {event_date}")
                        print(f"         Time: {event_time}")
                        
                        # Check for "API Test Event" specifically
                        if "API Test Event" in event_title:
                            print(f"         🎯 FOUND 'API Test Event' - analyzing...")
                            print(f"         Full event data: {json.dumps(event, indent=10)}")
                
                self.log_test(
                    "Current Database State Check", 
                    True, 
                    f"Retrieved {len(league_schedule)} events from database", 
                    f"Events count: {len(league_schedule)}"
                )
                return True, league_schedule
            else:
                self.log_test(
                    "Current Database State Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Current Database State Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_event_date_validation(self, events):
        """Test 2: Check if events have proper future dates within 30-day window"""
        if not events:
            self.log_test(
                "Event Date Validation", 
                False, 
                "No events to validate"
            )
            return False
        
        try:
            current_date = datetime.now()
            thirty_days_from_now = current_date + timedelta(days=30)
            
            print(f"📅 EVENT DATE VALIDATION ANALYSIS:")
            print(f"    Current date: {current_date.strftime('%Y-%m-%d %H:%M')}")
            print(f"    30-day window end: {thirty_days_from_now.strftime('%Y-%m-%d %H:%M')}")
            
            valid_events = []
            invalid_events = []
            api_test_event_found = False
            
            for event in events:
                event_title = event.get('title', 'No Title')
                event_date = event.get('date', '')
                event_time = event.get('time', '')
                
                print(f"\n    Analyzing event: {event_title}")
                print(f"      Date: {event_date}")
                print(f"      Time: {event_time}")
                
                # Check for API Test Event specifically
                if "API Test Event" in event_title:
                    api_test_event_found = True
                    print(f"      🎯 This is the 'API Test Event' mentioned by user!")
                
                # Try to parse the date
                try:
                    if event_date:
                        # Handle different date formats
                        if '-' in event_date:
                            event_datetime = datetime.strptime(event_date, '%Y-%m-%d')
                        elif '/' in event_date:
                            event_datetime = datetime.strptime(event_date, '%m/%d/%Y')
                        else:
                            print(f"      ⚠️  Unknown date format: {event_date}")
                            invalid_events.append(event)
                            continue
                        
                        # Check if within 30-day window
                        if current_date <= event_datetime <= thirty_days_from_now:
                            print(f"      ✅ Date is within 30-day window")
                            valid_events.append(event)
                        elif event_datetime < current_date:
                            print(f"      ❌ Date is in the past")
                            invalid_events.append(event)
                        else:
                            print(f"      ❌ Date is beyond 30-day window")
                            invalid_events.append(event)
                    else:
                        print(f"      ❌ No date provided")
                        invalid_events.append(event)
                        
                except ValueError as e:
                    print(f"      ❌ Date parsing error: {e}")
                    invalid_events.append(event)
            
            print(f"\n    📊 VALIDATION SUMMARY:")
            print(f"      Valid events (within 30-day window): {len(valid_events)}")
            print(f"      Invalid events: {len(invalid_events)}")
            print(f"      API Test Event found: {api_test_event_found}")
            
            if api_test_event_found:
                success_message = "API Test Event found and date validation completed"
            else:
                success_message = "Date validation completed but API Test Event not found in database"
            
            self.log_test(
                "Event Date Validation", 
                True, 
                success_message,
                f"Valid: {len(valid_events)}, Invalid: {len(invalid_events)}"
            )
            return True, valid_events, invalid_events
            
        except Exception as e:
            self.log_test(
                "Event Date Validation", 
                False, 
                f"Validation error: {str(e)}"
            )
            return False, [], []

    def test_event_structure_validation(self, events):
        """Test 3: Ensure events have proper structure with required fields"""
        if not events:
            self.log_test(
                "Event Structure Validation", 
                False, 
                "No events to validate"
            )
            return False
        
        try:
            required_fields = ['id', 'title', 'date', 'time']
            recommended_fields = ['teamIds', 'type', 'location']
            
            print(f"🏗️  EVENT STRUCTURE VALIDATION ANALYSIS:")
            print(f"    Required fields: {required_fields}")
            print(f"    Recommended fields: {recommended_fields}")
            
            valid_structures = []
            invalid_structures = []
            
            for event in events:
                event_title = event.get('title', 'No Title')
                print(f"\n    Analyzing structure of: {event_title}")
                
                # Check required fields
                missing_required = [field for field in required_fields if not event.get(field)]
                missing_recommended = [field for field in recommended_fields if not event.get(field)]
                
                print(f"      Required fields present: {len(required_fields) - len(missing_required)}/{len(required_fields)}")
                print(f"      Recommended fields present: {len(recommended_fields) - len(missing_recommended)}/{len(recommended_fields)}")
                
                if missing_required:
                    print(f"      ❌ Missing required fields: {missing_required}")
                    invalid_structures.append(event)
                else:
                    print(f"      ✅ All required fields present")
                    if missing_recommended:
                        print(f"      ⚠️  Missing recommended fields: {missing_recommended}")
                    valid_structures.append(event)
                
                # Special check for API Test Event
                if "API Test Event" in event_title:
                    print(f"      🎯 API Test Event structure analysis:")
                    for field in required_fields + recommended_fields:
                        value = event.get(field, 'MISSING')
                        print(f"        {field}: {value}")
            
            print(f"\n    📊 STRUCTURE VALIDATION SUMMARY:")
            print(f"      Events with valid structure: {len(valid_structures)}")
            print(f"      Events with invalid structure: {len(invalid_structures)}")
            
            self.log_test(
                "Event Structure Validation", 
                True, 
                f"Structure validation completed",
                f"Valid: {len(valid_structures)}, Invalid: {len(invalid_structures)}"
            )
            return True, valid_structures, invalid_structures
            
        except Exception as e:
            self.log_test(
                "Event Structure Validation", 
                False, 
                f"Structure validation error: {str(e)}"
            )
            return False, [], []

    def test_leaguedata_persistence(self):
        """Test 4: Verify that events saved via POST /api/league-data/leagueSchedule actually persist"""
        try:
            print(f"💾 LEAGUEDATA PERSISTENCE TEST:")
            
            # Create a test event with proper structure and future date
            test_event = {
                "id": f"persistence_test_{int(time.time())}",
                "title": "Persistence Test Event",
                "date": (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d'),
                "time": "15:30",
                "type": "practice",
                "location": "Test Field",
                "teamIds": ["test_team_1"],
                "description": "Event created to test persistence functionality"
            }
            
            print(f"    Creating test event: {test_event['title']}")
            print(f"    Event ID: {test_event['id']}")
            print(f"    Event Date: {test_event['date']} at {test_event['time']}")
            
            # Step 1: Get current events
            success, current_events = self.test_current_database_state()
            if not success:
                self.log_test(
                    "LeagueData Persistence Test", 
                    False, 
                    "Could not retrieve current events"
                )
                return False
            
            initial_count = len(current_events) if current_events else 0
            print(f"    Initial event count: {initial_count}")
            
            # Step 2: Add test event to the list
            events_to_save = current_events.copy() if current_events else []
            events_to_save.append(test_event)
            
            # Step 3: Save via POST /api/league-data/leagueSchedule
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=events_to_save,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                response_data = response.json()
                print(f"    ✅ POST request successful: {response_data.get('message', 'No message')}")
                
                # Step 4: Wait and verify persistence
                time.sleep(2)  # Wait for database write
                
                # Step 5: Retrieve events again to verify persistence
                success, updated_events = self.test_current_database_state()
                if success and updated_events:
                    updated_count = len(updated_events)
                    print(f"    Updated event count: {updated_count}")
                    
                    # Check if our test event is present
                    test_event_found = any(
                        event.get('id') == test_event['id'] 
                        for event in updated_events
                    )
                    
                    if test_event_found:
                        print(f"    ✅ Test event found in database after save")
                        
                        # Step 6: Test persistence after another retrieval (simulating refresh)
                        time.sleep(1)
                        success, refresh_events = self.test_current_database_state()
                        if success and refresh_events:
                            refresh_test_event_found = any(
                                event.get('id') == test_event['id'] 
                                for event in refresh_events
                            )
                            
                            if refresh_test_event_found:
                                print(f"    ✅ Test event persists after refresh simulation")
                                self.log_test(
                                    "LeagueData Persistence Test", 
                                    True, 
                                    f"Event persistence verified - event survives save/retrieve cycles",
                                    f"Event ID: {test_event['id']}"
                                )
                                return True
                            else:
                                print(f"    ❌ Test event disappeared after refresh simulation")
                                self.log_test(
                                    "LeagueData Persistence Test", 
                                    False, 
                                    "Event does not persist after refresh - THIS IS THE REPORTED BUG"
                                )
                                return False
                        else:
                            self.log_test(
                                "LeagueData Persistence Test", 
                                False, 
                                "Could not perform refresh simulation test"
                            )
                            return False
                    else:
                        print(f"    ❌ Test event not found in database after save")
                        self.log_test(
                            "LeagueData Persistence Test", 
                            False, 
                            "Event was not saved to database - save operation failed"
                        )
                        return False
                else:
                    self.log_test(
                        "LeagueData Persistence Test", 
                        False, 
                        "Could not retrieve events after save operation"
                    )
                    return False
            else:
                self.log_test(
                    "LeagueData Persistence Test", 
                    False, 
                    f"Save operation failed: HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "LeagueData Persistence Test", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False
        except Exception as e:
            self.log_test(
                "LeagueData Persistence Test", 
                False, 
                f"Unexpected error: {str(e)}"
            )
            return False

    def test_date_format_consistency(self, events):
        """Test 5: Check for date format inconsistencies that might cause filtering issues"""
        if not events:
            self.log_test(
                "Date Format Consistency Check", 
                False, 
                "No events to check"
            )
            return False
        
        try:
            print(f"📅 DATE FORMAT CONSISTENCY ANALYSIS:")
            
            date_formats_found = {}
            time_formats_found = {}
            inconsistent_events = []
            
            for event in events:
                event_title = event.get('title', 'No Title')
                event_date = event.get('date', '')
                event_time = event.get('time', '')
                
                print(f"\n    Analyzing formats for: {event_title}")
                
                # Analyze date format
                if event_date:
                    if '-' in event_date and len(event_date.split('-')) == 3:
                        date_format = "YYYY-MM-DD"
                    elif '/' in event_date and len(event_date.split('/')) == 3:
                        date_format = "MM/DD/YYYY or DD/MM/YYYY"
                    else:
                        date_format = "UNKNOWN"
                        inconsistent_events.append(event)
                    
                    date_formats_found[date_format] = date_formats_found.get(date_format, 0) + 1
                    print(f"      Date format: {date_format} ({event_date})")
                else:
                    print(f"      ❌ No date provided")
                    inconsistent_events.append(event)
                
                # Analyze time format
                if event_time:
                    if ':' in event_time:
                        if len(event_time.split(':')) == 2:
                            time_format = "HH:MM"
                        elif len(event_time.split(':')) == 3:
                            time_format = "HH:MM:SS"
                        else:
                            time_format = "UNKNOWN"
                            inconsistent_events.append(event)
                    else:
                        time_format = "UNKNOWN"
                        inconsistent_events.append(event)
                    
                    time_formats_found[time_format] = time_formats_found.get(time_format, 0) + 1
                    print(f"      Time format: {time_format} ({event_time})")
                else:
                    print(f"      ❌ No time provided")
                    inconsistent_events.append(event)
            
            print(f"\n    📊 FORMAT ANALYSIS SUMMARY:")
            print(f"      Date formats found: {date_formats_found}")
            print(f"      Time formats found: {time_formats_found}")
            print(f"      Events with format issues: {len(inconsistent_events)}")
            
            # Check for consistency
            consistent_dates = len(date_formats_found) <= 1
            consistent_times = len(time_formats_found) <= 1
            
            if consistent_dates and consistent_times and len(inconsistent_events) == 0:
                self.log_test(
                    "Date Format Consistency Check", 
                    True, 
                    "All events have consistent date/time formats",
                    f"Date formats: {list(date_formats_found.keys())}, Time formats: {list(time_formats_found.keys())}"
                )
                return True
            else:
                issues = []
                if not consistent_dates:
                    issues.append(f"Multiple date formats: {list(date_formats_found.keys())}")
                if not consistent_times:
                    issues.append(f"Multiple time formats: {list(time_formats_found.keys())}")
                if inconsistent_events:
                    issues.append(f"{len(inconsistent_events)} events with format issues")
                
                self.log_test(
                    "Date Format Consistency Check", 
                    False, 
                    f"Format inconsistencies found: {'; '.join(issues)}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Date Format Consistency Check", 
                False, 
                f"Format analysis error: {str(e)}"
            )
            return False

    def test_api_test_event_specific_analysis(self, events):
        """Special analysis for the specific 'API Test Event' mentioned by the user"""
        try:
            print(f"🎯 API TEST EVENT SPECIFIC ANALYSIS:")
            
            api_test_events = [event for event in events if "API Test Event" in event.get('title', '')]
            
            if not api_test_events:
                print(f"    ❌ 'API Test Event' not found in current database")
                self.log_test(
                    "API Test Event Analysis", 
                    False, 
                    "API Test Event not found in database - this explains why ticker shows 'No upcoming events'"
                )
                return False
            
            print(f"    ✅ Found {len(api_test_events)} 'API Test Event'(s)")
            
            for i, event in enumerate(api_test_events, 1):
                print(f"\n    API Test Event #{i} Analysis:")
                print(f"      Full event data: {json.dumps(event, indent=8)}")
                
                # Check the specific details mentioned by user
                event_date = event.get('date', '')
                event_time = event.get('time', '')
                
                print(f"      User reported: 'Sep 20 • 18:30'")
                print(f"      Database shows: '{event_date} • {event_time}'")
                
                # Try to parse the date to see if it's Sep 20
                try:
                    if event_date:
                        if '-' in event_date:
                            parsed_date = datetime.strptime(event_date, '%Y-%m-%d')
                        elif '/' in event_date:
                            parsed_date = datetime.strptime(event_date, '%m/%d/%Y')
                        else:
                            parsed_date = None
                        
                        if parsed_date:
                            formatted_date = parsed_date.strftime('%b %d')  # Sep 20 format
                            print(f"      Formatted date: {formatted_date}")
                            
                            # Check if this matches user's expectation
                            if "Sep 20" in formatted_date or "20" in event_date:
                                print(f"      ✅ Date appears to match user's expectation")
                            else:
                                print(f"      ⚠️  Date may not match user's expectation")
                        else:
                            print(f"      ❌ Could not parse date format")
                    
                    # Check time format
                    if event_time:
                        if "18:30" in event_time or "6:30" in event_time:
                            print(f"      ✅ Time appears to match user's expectation (18:30)")
                        else:
                            print(f"      ⚠️  Time may not match user's expectation (expected 18:30)")
                    
                except Exception as e:
                    print(f"      ❌ Error parsing date/time: {e}")
                
                # Check if event should be visible (within 30 days)
                current_date = datetime.now()
                thirty_days_from_now = current_date + timedelta(days=30)
                
                try:
                    if event_date and '-' in event_date:
                        event_datetime = datetime.strptime(event_date, '%Y-%m-%d')
                        if current_date <= event_datetime <= thirty_days_from_now:
                            print(f"      ✅ Event is within 30-day window - SHOULD be visible in ticker")
                        elif event_datetime < current_date:
                            print(f"      ❌ Event is in the past - would be filtered out")
                        else:
                            print(f"      ❌ Event is beyond 30-day window - would be filtered out")
                except:
                    print(f"      ⚠️  Could not determine if event is within valid date range")
            
            self.log_test(
                "API Test Event Analysis", 
                True, 
                f"Found and analyzed {len(api_test_events)} API Test Event(s)",
                f"Events found: {len(api_test_events)}"
            )
            return True
            
        except Exception as e:
            self.log_test(
                "API Test Event Analysis", 
                False, 
                f"Analysis error: {str(e)}"
            )
            return False

    def run_validation_tests(self):
        """Run all event persistence validation tests"""
        print("🔍 STARTING EVENT PERSISTENCE VALIDATION TESTS")
        print("Focus: Find out why events are disappearing after being initially loaded")
        print("=" * 70)
        
        # Test 1: Current Database State
        print("\n1️⃣  CHECKING CURRENT DATABASE STATE...")
        success, current_events = self.test_current_database_state()
        if not success:
            print("❌ CRITICAL: Cannot retrieve current database state")
            return False
        
        # Test 2: Event Date Validation
        print("\n2️⃣  VALIDATING EVENT DATES...")
        if current_events:
            self.test_event_date_validation(current_events)
        else:
            print("⚠️  No events to validate dates")
        
        # Test 3: Event Structure Validation
        print("\n3️⃣  VALIDATING EVENT STRUCTURE...")
        if current_events:
            self.test_event_structure_validation(current_events)
        else:
            print("⚠️  No events to validate structure")
        
        # Test 4: LeagueData Persistence
        print("\n4️⃣  TESTING LEAGUEDATA PERSISTENCE...")
        self.test_leaguedata_persistence()
        
        # Test 5: Date Format Consistency
        print("\n5️⃣  CHECKING DATE FORMAT CONSISTENCY...")
        if current_events:
            self.test_date_format_consistency(current_events)
        else:
            print("⚠️  No events to check date formats")
        
        # Test 6: API Test Event Specific Analysis
        print("\n6️⃣  ANALYZING SPECIFIC 'API TEST EVENT'...")
        if current_events:
            self.test_api_test_event_specific_analysis(current_events)
        else:
            print("⚠️  No events to analyze - this explains the user's issue!")
        
        # Summary
        print("\n" + "=" * 70)
        print("🔍 EVENT PERSISTENCE VALIDATION SUMMARY")
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
        
        # Critical analysis for the user's issue
        print(f"\n🎯 CRITICAL FINDINGS FOR USER'S ISSUE:")
        if not current_events:
            print(f"  ❌ ROOT CAUSE IDENTIFIED: No events found in database")
            print(f"     This explains why ticker shows 'No upcoming events'")
            print(f"     The 'API Test Event' is not persisting in the database")
        else:
            api_test_found = any("API Test Event" in event.get('title', '') for event in current_events)
            if api_test_found:
                print(f"  ✅ API Test Event found in database")
                print(f"  ⚠️  Issue may be in frontend filtering or display logic")
            else:
                print(f"  ❌ API Test Event not found in database")
                print(f"     Event is being created but not persisting")
        
        return len(self.failed_tests) == 0

if __name__ == "__main__":
    try:
        validator = EventPersistenceValidator()
        success = validator.run_validation_tests()
        
        if success:
            print("\n🎉 Event persistence validation completed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Event persistence issues detected. Check the analysis above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Validation setup failed: {e}")
        sys.exit(1)