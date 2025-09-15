#!/usr/bin/env python3
"""
Focused Event Persistence Test - Specifically for the user's reported issue
Tests the exact scenario described in the review request
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import time

def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

class FocusedEventPersistenceTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        print(f"🎯 FOCUSED EVENT PERSISTENCE TESTING")
        print(f"Testing: {self.api_base}")
        print("=" * 60)

    def test_api_test_event_persistence(self):
        """Test the specific API Test Event mentioned by the user"""
        try:
            print("1️⃣  CHECKING FOR API TEST EVENT IN DATABASE...")
            
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                print(f"   📊 Database contains {len(league_schedule)} events")
                
                # Look for API Test Event
                api_test_events = [event for event in league_schedule if "API Test Event" in event.get('title', '')]
                
                if api_test_events:
                    print(f"   ✅ FOUND {len(api_test_events)} 'API Test Event'(s)")
                    
                    for event in api_test_events:
                        print(f"   📋 Event Details:")
                        print(f"      ID: {event.get('id')}")
                        print(f"      Title: {event.get('title')}")
                        print(f"      Date: {event.get('date')} (Sep 20 expected)")
                        print(f"      Time: {event.get('time')} (18:30 expected)")
                        print(f"      Location: {event.get('location')}")
                        print(f"      Type: {event.get('type')}")
                        print(f"      Team IDs: {event.get('teamIds')}")
                        
                        # Validate the date is Sep 20 and time is 18:30
                        event_date = event.get('date', '')
                        event_time = event.get('time', '')
                        
                        if '2025-09-20' in event_date or 'Sep 20' in event_date:
                            print(f"      ✅ Date matches user expectation (Sep 20)")
                        else:
                            print(f"      ❌ Date does not match user expectation")
                        
                        if '18:30' in event_time:
                            print(f"      ✅ Time matches user expectation (18:30)")
                        else:
                            print(f"      ❌ Time does not match user expectation")
                        
                        # Check if event should be visible (within 30 days)
                        try:
                            if event_date:
                                event_datetime = datetime.strptime(event_date, '%Y-%m-%d')
                                current_date = datetime.now()
                                thirty_days_from_now = current_date + timedelta(days=30)
                                
                                if current_date <= event_datetime <= thirty_days_from_now:
                                    print(f"      ✅ Event is within 30-day window - SHOULD be visible")
                                    return True, "API Test Event found and should be visible"
                                else:
                                    print(f"      ❌ Event is outside 30-day window")
                                    return False, "API Test Event found but outside date window"
                        except:
                            print(f"      ⚠️  Could not parse date for visibility check")
                    
                    return True, "API Test Event found in database"
                else:
                    print(f"   ❌ NO 'API Test Event' found in database")
                    print(f"   📋 Available events:")
                    for event in league_schedule:
                        print(f"      - {event.get('title', 'No Title')} ({event.get('date', 'No Date')})")
                    return False, "API Test Event not found in database - this explains the user's issue"
            else:
                return False, f"Could not retrieve league data: HTTP {response.status_code}"
                
        except Exception as e:
            return False, f"Error checking API Test Event: {str(e)}"

    def test_event_filtering_logic(self):
        """Test the 30-day filtering logic that might be causing events to disappear"""
        try:
            print("\n2️⃣  TESTING EVENT FILTERING LOGIC...")
            
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                current_date = datetime.now()
                thirty_days_back = current_date - timedelta(days=30)
                thirty_days_forward = current_date + timedelta(days=30)
                
                print(f"   📅 Current date: {current_date.strftime('%Y-%m-%d %H:%M')}")
                print(f"   📅 30 days back: {thirty_days_back.strftime('%Y-%m-%d %H:%M')}")
                print(f"   📅 30 days forward: {thirty_days_forward.strftime('%Y-%m-%d %H:%M')}")
                
                visible_events = []
                filtered_out_events = []
                
                for event in league_schedule:
                    event_date = event.get('date', '')
                    event_title = event.get('title', 'No Title')
                    
                    try:
                        if event_date:
                            event_datetime = datetime.strptime(event_date, '%Y-%m-%d')
                            
                            # Apply the same filtering logic as the frontend
                            if thirty_days_back <= event_datetime <= thirty_days_forward:
                                visible_events.append(event)
                                print(f"   ✅ {event_title} - VISIBLE (within window)")
                            else:
                                filtered_out_events.append(event)
                                print(f"   ❌ {event_title} - FILTERED OUT (outside window)")
                        else:
                            filtered_out_events.append(event)
                            print(f"   ❌ {event_title} - FILTERED OUT (no date)")
                    except:
                        filtered_out_events.append(event)
                        print(f"   ❌ {event_title} - FILTERED OUT (invalid date)")
                
                print(f"\n   📊 FILTERING RESULTS:")
                print(f"      Visible events: {len(visible_events)}")
                print(f"      Filtered out events: {len(filtered_out_events)}")
                
                if len(visible_events) > 0:
                    return True, f"Filtering logic working - {len(visible_events)} events should be visible"
                else:
                    return False, "No events pass the filtering logic - this explains 'No upcoming events'"
            else:
                return False, f"Could not retrieve data for filtering test: HTTP {response.status_code}"
                
        except Exception as e:
            return False, f"Error testing filtering logic: {str(e)}"

    def test_active_events_counter_logic(self):
        """Test the Active Events counter logic"""
        try:
            print("\n3️⃣  TESTING ACTIVE EVENTS COUNTER LOGIC...")
            
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                league_schedule = data.get('leagueSchedule', [])
                
                # Count events that should be "active" (upcoming within 30 days)
                current_date = datetime.now()
                thirty_days_forward = current_date + timedelta(days=30)
                
                active_count = 0
                for event in league_schedule:
                    event_date = event.get('date', '')
                    try:
                        if event_date:
                            event_datetime = datetime.strptime(event_date, '%Y-%m-%d')
                            if current_date <= event_datetime <= thirty_days_forward:
                                active_count += 1
                    except:
                        pass
                
                print(f"   📊 Active Events Count: {active_count}")
                print(f"   📊 Total Events in Database: {len(league_schedule)}")
                
                if active_count > 0:
                    return True, f"Active Events counter should show {active_count}"
                else:
                    return False, "Active Events counter should show 0 - explains inconsistent counter"
            else:
                return False, f"Could not retrieve data for counter test: HTTP {response.status_code}"
                
        except Exception as e:
            return False, f"Error testing counter logic: {str(e)}"

    def test_data_persistence_after_refresh(self):
        """Test if data persists after multiple API calls (simulating refresh)"""
        try:
            print("\n4️⃣  TESTING DATA PERSISTENCE AFTER REFRESH SIMULATION...")
            
            # Make multiple API calls to simulate page refreshes
            for i in range(3):
                print(f"   🔄 Refresh simulation #{i+1}")
                
                response = requests.get(f"{self.api_base}/league-data", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    league_schedule = data.get('leagueSchedule', [])
                    
                    api_test_events = [event for event in league_schedule if "API Test Event" in event.get('title', '')]
                    
                    print(f"      Events found: {len(league_schedule)}")
                    print(f"      API Test Events: {len(api_test_events)}")
                    
                    if len(api_test_events) == 0:
                        return False, f"API Test Event disappeared after refresh #{i+1}"
                else:
                    return False, f"API call failed during refresh #{i+1}: HTTP {response.status_code}"
                
                time.sleep(1)  # Small delay between requests
            
            return True, "Data persists correctly after multiple refresh simulations"
            
        except Exception as e:
            return False, f"Error testing persistence after refresh: {str(e)}"

    def run_focused_tests(self):
        """Run all focused tests for the user's specific issue"""
        print("🎯 RUNNING FOCUSED EVENT PERSISTENCE TESTS")
        print("Investigating: Events disappearing after refresh despite initial loading")
        print("=" * 60)
        
        results = []
        
        # Test 1: Check for API Test Event
        success, message = self.test_api_test_event_persistence()
        results.append(("API Test Event Check", success, message))
        
        # Test 2: Event filtering logic
        success, message = self.test_event_filtering_logic()
        results.append(("Event Filtering Logic", success, message))
        
        # Test 3: Active Events counter
        success, message = self.test_active_events_counter_logic()
        results.append(("Active Events Counter", success, message))
        
        # Test 4: Data persistence after refresh
        success, message = self.test_data_persistence_after_refresh()
        results.append(("Data Persistence After Refresh", success, message))
        
        # Summary
        print("\n" + "=" * 60)
        print("🎯 FOCUSED TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, success, message in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {test_name}")
            print(f"    {message}")
            
            if success:
                passed += 1
            else:
                failed += 1
        
        print(f"\nTotal Tests: {len(results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        
        # Critical analysis
        print(f"\n🔍 CRITICAL ANALYSIS FOR USER'S ISSUE:")
        
        api_test_found = any("API Test Event found" in result[2] for result in results if result[1])
        persistence_ok = any("Data persists correctly" in result[2] for result in results if result[1])
        
        if api_test_found and persistence_ok:
            print(f"  ✅ BACKEND IS WORKING CORRECTLY")
            print(f"     - API Test Event is persisting in database")
            print(f"     - Data survives refresh cycles")
            print(f"     - Issue is likely in FRONTEND logic or race conditions")
            print(f"  🎯 RECOMMENDATION: Check frontend event loading and filtering logic")
        elif api_test_found and not persistence_ok:
            print(f"  ⚠️  BACKEND PERSISTENCE ISSUE DETECTED")
            print(f"     - API Test Event exists but doesn't persist after refresh")
            print(f"  🎯 RECOMMENDATION: Investigate backend data persistence mechanisms")
        elif not api_test_found:
            print(f"  ❌ API TEST EVENT NOT FOUND IN DATABASE")
            print(f"     - This explains why ticker shows 'No upcoming events'")
            print(f"  🎯 RECOMMENDATION: Check event creation and save processes")
        
        return failed == 0

if __name__ == "__main__":
    try:
        tester = FocusedEventPersistenceTester()
        success = tester.run_focused_tests()
        
        if success:
            print("\n🎉 All focused tests passed - backend is working correctly!")
            sys.exit(0)
        else:
            print("\n⚠️  Some focused tests failed - issues detected.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)