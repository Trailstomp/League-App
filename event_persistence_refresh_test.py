#!/usr/bin/env python3
"""
Event Persistence and Refresh Testing Suite
Specifically tests event data persistence and page refresh issues as reported by user.

CRITICAL EVENT PERSISTENCE AND REFRESH TESTING

Background Context: 
- Fixed the race condition between App.js and useStatistics hook that was causing 5-second delays
- Ticker shows events correctly now, but user reports refreshing still overwrites events
- Screenshots show "Active Events" counter changing from 1 to 0, indicating data inconsistency

Testing Focus:
1. Event Persistence Testing - GET /api/league-data endpoint to verify events are correctly stored in leagueSchedule array
2. POST /api/league-data/leagueSchedule endpoint for saving events
3. Data Consistency Testing - check for multiple data sources conflicting
4. Refresh Simulation Testing - simulate page refresh by doing GET requests
5. API Call Sequence Testing - test POST→GET cycles
6. Event Data Structure Verification - verify event objects have correct structure
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

class EventPersistenceTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🎯 CRITICAL EVENT PERSISTENCE AND REFRESH TESTING")
        print(f"Testing backend at: {self.api_base}")
        print("=" * 80)

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if response_data and success:
            if isinstance(response_data, dict) and len(str(response_data)) > 200:
                print(f"    Response: [Large data structure - {len(str(response_data))} chars]")
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

    def create_test_event(self, event_id, title, event_type="game", team_ids=None):
        """Create a test event with realistic data"""
        if team_ids is None:
            team_ids = ["eagles", "test_team"]
        
        # Create realistic future date
        future_date = datetime.now() + timedelta(days=7)
        
        return {
            "id": event_id,
            "title": title,
            "date": future_date.strftime("%Y-%m-%d"),
            "time": "19:00",
            "location": "Main Lacrosse Field",
            "type": event_type,
            "teamIds": team_ids,
            "description": f"Test event for persistence testing - {title}",
            "status": "scheduled",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }

    def test_get_league_data_events(self):
        """Test GET /api/league-data endpoint specifically for events in leagueSchedule"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if leagueSchedule exists
                if 'leagueSchedule' in data:
                    events = data['leagueSchedule']
                    if isinstance(events, list):
                        self.log_test(
                            "GET League Data - Events Structure", 
                            True, 
                            f"leagueSchedule contains {len(events)} events", 
                            f"Events count: {len(events)}"
                        )
                        return True, data, events
                    else:
                        self.log_test(
                            "GET League Data - Events Structure", 
                            False, 
                            f"leagueSchedule is not a list: {type(events)}"
                        )
                        return False, None, None
                else:
                    self.log_test(
                        "GET League Data - Events Structure", 
                        False, 
                        "leagueSchedule field missing from league data"
                    )
                    return False, None, None
            else:
                self.log_test(
                    "GET League Data - Events Structure", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "GET League Data - Events Structure", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None, None

    def test_save_events_via_league_schedule(self):
        """Test POST /api/league-data/leagueSchedule endpoint for saving events"""
        try:
            # Create test events
            test_events = [
                self.create_test_event("persist_test_1", "Eagles vs Test Team Alpha", "game", ["eagles", "test_alpha"]),
                self.create_test_event("persist_test_2", "Spring Practice Session", "practice", ["eagles"]),
                self.create_test_event("persist_test_3", "Championship Tournament", "tournament", ["eagles", "test_alpha", "test_beta"])
            ]
            
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=test_events,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'leagueSchedule updated successfully':
                    self.log_test(
                        "POST League Schedule - Save Events", 
                        True, 
                        f"Successfully saved {len(test_events)} events to leagueSchedule", 
                        {"message": data.get('message'), "events_saved": len(test_events)}
                    )
                    return True, test_events
                else:
                    self.log_test(
                        "POST League Schedule - Save Events", 
                        False, 
                        f"Unexpected response: {data}"
                    )
                    return False, None
            else:
                self.log_test(
                    "POST League Schedule - Save Events", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "POST League Schedule - Save Events", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

    def test_event_persistence_after_save(self, expected_events):
        """Test if events persist correctly after saving"""
        try:
            # Wait for database write
            time.sleep(2)
            
            success, league_data, stored_events = self.test_get_league_data_events()
            if not success:
                self.log_test(
                    "Event Persistence Verification", 
                    False, 
                    "Could not retrieve league data to verify persistence"
                )
                return False
            
            # Check if all expected events are present
            expected_ids = {event['id'] for event in expected_events}
            stored_ids = {event.get('id') for event in stored_events if event.get('id')}
            
            missing_events = expected_ids - stored_ids
            extra_events = stored_ids - expected_ids
            
            if not missing_events:
                self.log_test(
                    "Event Persistence Verification", 
                    True, 
                    f"All {len(expected_events)} events persisted correctly", 
                    {
                        "expected_count": len(expected_events),
                        "stored_count": len(stored_events),
                        "all_expected_found": True
                    }
                )
                return True, stored_events
            else:
                self.log_test(
                    "Event Persistence Verification", 
                    False, 
                    f"Missing events: {missing_events}, Extra events: {extra_events}"
                )
                return False, stored_events
                
        except Exception as e:
            self.log_test(
                "Event Persistence Verification", 
                False, 
                f"Error verifying persistence: {str(e)}"
            )
            return False, None

    def test_refresh_simulation_consistency(self, expected_events):
        """Simulate page refresh by making multiple GET requests to check data consistency"""
        try:
            print("🔄 SIMULATING PAGE REFRESH - Multiple GET Requests...")
            
            refresh_results = []
            for i in range(5):  # Simulate 5 page refreshes
                print(f"    Refresh simulation #{i+1}")
                
                success, league_data, events = self.test_get_league_data_events()
                if success:
                    refresh_results.append({
                        'refresh_num': i+1,
                        'event_count': len(events),
                        'event_ids': [event.get('id') for event in events if event.get('id')]
                    })
                    time.sleep(1)  # Wait between requests
                else:
                    self.log_test(
                        "Refresh Simulation Consistency", 
                        False, 
                        f"Failed to get data on refresh #{i+1}"
                    )
                    return False
            
            # Check consistency across all refreshes
            first_count = refresh_results[0]['event_count']
            first_ids = set(refresh_results[0]['event_ids'])
            
            consistent = True
            for result in refresh_results[1:]:
                if result['event_count'] != first_count:
                    consistent = False
                    break
                if set(result['event_ids']) != first_ids:
                    consistent = False
                    break
            
            if consistent:
                self.log_test(
                    "Refresh Simulation Consistency", 
                    True, 
                    f"Event data consistent across {len(refresh_results)} refresh simulations", 
                    {
                        "consistent_event_count": first_count,
                        "refresh_simulations": len(refresh_results)
                    }
                )
                return True
            else:
                # Show detailed inconsistency
                inconsistency_details = []
                for result in refresh_results:
                    inconsistency_details.append(f"Refresh #{result['refresh_num']}: {result['event_count']} events")
                
                self.log_test(
                    "Refresh Simulation Consistency", 
                    False, 
                    f"Data inconsistency detected: {', '.join(inconsistency_details)}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Refresh Simulation Consistency", 
                False, 
                f"Error during refresh simulation: {str(e)}"
            )
            return False

    def test_post_get_cycle_integrity(self):
        """Test POST→GET cycles work correctly for events"""
        try:
            print("🔄 TESTING POST→GET CYCLE INTEGRITY...")
            
            # Create unique test event
            cycle_test_event = self.create_test_event(
                f"cycle_test_{int(time.time())}", 
                "POST-GET Cycle Test Event", 
                "practice", 
                ["eagles"]
            )
            
            # POST the event
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=[cycle_test_event],
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test(
                    "POST→GET Cycle Integrity", 
                    False, 
                    f"POST failed: HTTP {response.status_code}"
                )
                return False
            
            # Wait for database write
            time.sleep(2)
            
            # GET the data back
            success, league_data, events = self.test_get_league_data_events()
            if not success:
                self.log_test(
                    "POST→GET Cycle Integrity", 
                    False, 
                    "GET failed after POST"
                )
                return False
            
            # Verify the event is present and intact
            found_event = None
            for event in events:
                if event.get('id') == cycle_test_event['id']:
                    found_event = event
                    break
            
            if found_event:
                # Check key fields are preserved
                key_fields = ['id', 'title', 'date', 'time', 'type', 'teamIds']
                fields_match = all(
                    found_event.get(field) == cycle_test_event.get(field) 
                    for field in key_fields
                )
                
                if fields_match:
                    self.log_test(
                        "POST→GET Cycle Integrity", 
                        True, 
                        "Event data preserved correctly through POST→GET cycle", 
                        {
                            "event_id": cycle_test_event['id'],
                            "fields_verified": key_fields
                        }
                    )
                    return True
                else:
                    field_mismatches = []
                    for field in key_fields:
                        if found_event.get(field) != cycle_test_event.get(field):
                            field_mismatches.append(f"{field}: expected {cycle_test_event.get(field)}, got {found_event.get(field)}")
                    
                    self.log_test(
                        "POST→GET Cycle Integrity", 
                        False, 
                        f"Field mismatches: {'; '.join(field_mismatches)}"
                    )
                    return False
            else:
                self.log_test(
                    "POST→GET Cycle Integrity", 
                    False, 
                    f"Event with ID {cycle_test_event['id']} not found after POST→GET cycle"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "POST→GET Cycle Integrity", 
                False, 
                f"Error during POST→GET cycle test: {str(e)}"
            )
            return False

    def test_event_data_structure_verification(self):
        """Verify event objects have correct structure (id, title, date, time, type, teamIds, etc.)"""
        try:
            success, league_data, events = self.test_get_league_data_events()
            if not success:
                self.log_test(
                    "Event Data Structure Verification", 
                    False, 
                    "Could not retrieve events for structure verification"
                )
                return False
            
            if not events:
                self.log_test(
                    "Event Data Structure Verification", 
                    True, 
                    "No events to verify (empty leagueSchedule is valid)", 
                    {"event_count": 0}
                )
                return True
            
            # Define required and optional fields
            required_fields = ['id', 'title', 'date', 'time', 'type']
            optional_fields = ['teamIds', 'location', 'description', 'status', 'createdAt', 'updatedAt']
            
            structure_issues = []
            valid_events = 0
            
            for i, event in enumerate(events):
                if not isinstance(event, dict):
                    structure_issues.append(f"Event #{i}: Not a dictionary")
                    continue
                
                # Check required fields
                missing_required = [field for field in required_fields if field not in event]
                if missing_required:
                    structure_issues.append(f"Event #{i} (ID: {event.get('id', 'unknown')}): Missing required fields: {missing_required}")
                    continue
                
                # Check data types
                if event.get('teamIds') and not isinstance(event['teamIds'], list):
                    structure_issues.append(f"Event #{i} (ID: {event.get('id')}): teamIds should be a list")
                    continue
                
                valid_events += 1
            
            if not structure_issues:
                self.log_test(
                    "Event Data Structure Verification", 
                    True, 
                    f"All {len(events)} events have valid structure", 
                    {
                        "total_events": len(events),
                        "valid_events": valid_events,
                        "required_fields": required_fields
                    }
                )
                return True
            else:
                self.log_test(
                    "Event Data Structure Verification", 
                    False, 
                    f"Structure issues found: {'; '.join(structure_issues[:3])}{'...' if len(structure_issues) > 3 else ''}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Event Data Structure Verification", 
                False, 
                f"Error verifying event structure: {str(e)}"
            )
            return False

    def test_data_consistency_multiple_sources(self):
        """Check if there are multiple data sources conflicting (leagueSchedule vs events vs other fields)"""
        try:
            success, league_data, events = self.test_get_league_data_events()
            if not success:
                self.log_test(
                    "Data Consistency - Multiple Sources", 
                    False, 
                    "Could not retrieve league data for consistency check"
                )
                return False
            
            # Check for potential conflicting data sources
            potential_conflicts = []
            
            # Check if there are other event-related fields
            event_related_fields = ['events', 'schedule', 'gameTickerData']
            for field in event_related_fields:
                if field in league_data and league_data[field]:
                    if isinstance(league_data[field], list) and len(league_data[field]) > 0:
                        potential_conflicts.append(f"{field} contains {len(league_data[field])} items")
            
            # Check gameTickerData specifically as it might contain event data
            ticker_data = league_data.get('gameTickerData', [])
            if ticker_data:
                ticker_event_count = len([item for item in ticker_data if isinstance(item, dict) and item.get('type') in ['game', 'practice', 'tournament']])
                if ticker_event_count > 0:
                    potential_conflicts.append(f"gameTickerData contains {ticker_event_count} event-like items")
            
            if not potential_conflicts:
                self.log_test(
                    "Data Consistency - Multiple Sources", 
                    True, 
                    "No conflicting event data sources detected", 
                    {
                        "primary_source": "leagueSchedule",
                        "event_count": len(events),
                        "checked_fields": event_related_fields
                    }
                )
                return True
            else:
                self.log_test(
                    "Data Consistency - Multiple Sources", 
                    False, 
                    f"Potential data source conflicts: {'; '.join(potential_conflicts)}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Data Consistency - Multiple Sources", 
                False, 
                f"Error checking data consistency: {str(e)}"
            )
            return False

    def test_active_events_counter_consistency(self):
        """Test if Active Events counter remains consistent (addresses user's 1→0 counter issue)"""
        try:
            print("📊 TESTING ACTIVE EVENTS COUNTER CONSISTENCY...")
            
            # Get current events
            success, league_data, events = self.test_get_league_data_events()
            if not success:
                self.log_test(
                    "Active Events Counter Consistency", 
                    False, 
                    "Could not retrieve events for counter test"
                )
                return False
            
            # Count active events (future events that are scheduled)
            now = datetime.now()
            active_events = []
            
            for event in events:
                try:
                    event_date = datetime.strptime(event.get('date', ''), '%Y-%m-%d')
                    if event_date >= now.replace(hour=0, minute=0, second=0, microsecond=0):
                        if event.get('status', 'scheduled') != 'cancelled':
                            active_events.append(event)
                except (ValueError, TypeError):
                    # Skip events with invalid dates
                    continue
            
            initial_count = len(active_events)
            
            # Simulate multiple requests to check consistency
            consistent_counts = []
            for i in range(3):
                time.sleep(1)
                success, league_data, events = self.test_get_league_data_events()
                if success:
                    # Recount active events
                    current_active = []
                    for event in events:
                        try:
                            event_date = datetime.strptime(event.get('date', ''), '%Y-%m-%d')
                            if event_date >= now.replace(hour=0, minute=0, second=0, microsecond=0):
                                if event.get('status', 'scheduled') != 'cancelled':
                                    current_active.append(event)
                        except (ValueError, TypeError):
                            continue
                    
                    consistent_counts.append(len(current_active))
                else:
                    self.log_test(
                        "Active Events Counter Consistency", 
                        False, 
                        f"Failed to get data on consistency check #{i+1}"
                    )
                    return False
            
            # Check if all counts are the same
            all_same = all(count == initial_count for count in consistent_counts)
            
            if all_same:
                self.log_test(
                    "Active Events Counter Consistency", 
                    True, 
                    f"Active events counter consistent: {initial_count} events across all checks", 
                    {
                        "initial_count": initial_count,
                        "consistency_checks": len(consistent_counts),
                        "all_counts": [initial_count] + consistent_counts
                    }
                )
                return True
            else:
                self.log_test(
                    "Active Events Counter Consistency", 
                    False, 
                    f"Counter inconsistency: initial={initial_count}, subsequent={consistent_counts}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Active Events Counter Consistency", 
                False, 
                f"Error testing counter consistency: {str(e)}"
            )
            return False

    def run_comprehensive_event_persistence_tests(self):
        """Run all event persistence and refresh tests"""
        print("🎯 STARTING COMPREHENSIVE EVENT PERSISTENCE AND REFRESH TESTING")
        print(f"Target URL: {self.api_base}")
        print("=" * 80)
        
        # Test 1: Basic event data structure
        print("1️⃣ TESTING EVENT DATA STRUCTURE...")
        self.test_get_league_data_events()
        self.test_event_data_structure_verification()
        
        # Test 2: Event saving functionality
        print("\n2️⃣ TESTING EVENT PERSISTENCE...")
        save_success, test_events = self.test_save_events_via_league_schedule()
        
        if save_success and test_events:
            # Test 3: Verify persistence after save
            print("\n3️⃣ VERIFYING EVENT PERSISTENCE AFTER SAVE...")
            persist_success, stored_events = self.test_event_persistence_after_save(test_events)
            
            if persist_success:
                # Test 4: Refresh simulation
                print("\n4️⃣ TESTING REFRESH SIMULATION CONSISTENCY...")
                self.test_refresh_simulation_consistency(test_events)
                
                # Test 5: POST→GET cycle integrity
                print("\n5️⃣ TESTING POST→GET CYCLE INTEGRITY...")
                self.test_post_get_cycle_integrity()
        
        # Test 6: Data consistency across sources
        print("\n6️⃣ TESTING DATA CONSISTENCY ACROSS SOURCES...")
        self.test_data_consistency_multiple_sources()
        
        # Test 7: Active events counter consistency (addresses user's specific issue)
        print("\n7️⃣ TESTING ACTIVE EVENTS COUNTER CONSISTENCY...")
        self.test_active_events_counter_consistency()
        
        # Summary
        print("\n" + "=" * 80)
        print("🎯 EVENT PERSISTENCE AND REFRESH TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        # Critical assessment for event persistence issues
        critical_failures = [t for t in self.failed_tests if any(keyword in t for keyword in 
            ['Persistence', 'Consistency', 'POST→GET', 'Counter', 'Structure'])]
        
        if critical_failures:
            print(f"\n🚨 CRITICAL EVENT PERSISTENCE ISSUES DETECTED:")
            for test in critical_failures:
                print(f"  - {test}")
            print(f"\n⚠️  These issues may explain the user's reported problems with:")
            print(f"  - Events disappearing after page refresh")
            print(f"  - Active Events counter changing from 1 to 0")
            print(f"  - Data inconsistency in the ticker")
        else:
            print(f"\n✅ EVENT PERSISTENCE SYSTEM APPEARS HEALTHY")
            print(f"  - Events persist correctly through save/load cycles")
            print(f"  - Data remains consistent across page refreshes")
            print(f"  - No conflicting data sources detected")
        
        return len(critical_failures) == 0

if __name__ == "__main__":
    try:
        tester = EventPersistenceTester()
        success = tester.run_comprehensive_event_persistence_tests()
        
        if success:
            print("\n🎉 Event persistence and refresh testing completed successfully!")
            print("✅ No critical issues detected that would cause user's reported problems.")
            sys.exit(0)
        else:
            print("\n⚠️  Critical event persistence issues detected.")
            print("❌ These issues likely explain the user's reported refresh problems.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)