#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
import time

# Backend URL from environment
BACKEND_URL = "https://lacrosse-mgr.preview.emergentagent.com/api"

def test_api_health():
    """Test if the API is responding"""
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"✅ API Health Check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ API Health Check Failed: {e}")
        return False

def test_league_data_seasons_field():
    """Test the seasons field in /api/league-data response"""
    print("\n🔍 INVESTIGATING SEASONS FIELD IN /api/league-data...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 GET /api/league-data Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if seasons field exists
            seasons = data.get('seasons', None)
            print(f"📅 Seasons field exists: {'✅ YES' if 'seasons' in data else '❌ NO'}")
            
            if 'seasons' in data:
                print(f"📅 Seasons data type: {type(seasons)}")
                print(f"📅 Seasons length: {len(seasons) if isinstance(seasons, (list, dict)) else 'N/A'}")
                print(f"📅 Seasons content: {seasons}")
                
                if isinstance(seasons, list):
                    print(f"📅 Number of seasons: {len(seasons)}")
                    for i, season in enumerate(seasons):
                        print(f"  Season {i+1}: {season}")
                elif isinstance(seasons, dict):
                    print(f"📅 Seasons as dict: {seasons}")
                else:
                    print(f"📅 Seasons unexpected type: {type(seasons)}")
            else:
                print("📅 Seasons field is missing from response")
                print("📅 Available fields in response:")
                for key in data.keys():
                    print(f"  - {key}: {type(data[key])}")
            
            return True, data
        else:
            print(f"❌ Failed to fetch league-data: {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ League-data seasons test failed: {e}")
        return False, None

def test_seasons_endpoint_directly():
    """Test the seasons-specific endpoint"""
    print("\n🔍 TESTING SEASONS-SPECIFIC ENDPOINT...")
    
    try:
        # Test GET /api/league-data/seasons (if it exists)
        response = requests.get(f"{BACKEND_URL}/league-data/seasons")
        print(f"📊 GET /api/league-data/seasons Status: {response.status_code}")
        
        if response.status_code == 200:
            seasons_data = response.json()
            print(f"📅 Direct seasons endpoint response: {seasons_data}")
            return True, seasons_data
        elif response.status_code == 404:
            print("📅 Seasons-specific endpoint does not exist (404)")
            return False, None
        else:
            print(f"📅 Seasons endpoint returned: {response.status_code}")
            if response.text:
                print(f"   Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Seasons endpoint test failed: {e}")
        return False, None

def test_create_seasons_data():
    """Create test seasons data to verify the issue"""
    print("\n🔍 CREATING TEST SEASONS DATA...")
    
    try:
        # Create sample seasons data
        test_seasons = [
            {
                "id": "2025",
                "name": "2025 Season",
                "startDate": "2025-03-01",
                "endDate": "2025-10-31",
                "active": True
            }
        ]
        
        # Try to save seasons via POST /api/league-data/seasons
        response = requests.post(f"{BACKEND_URL}/league-data/seasons", json=test_seasons)
        print(f"📊 POST /api/league-data/seasons Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Seasons data saved successfully")
            
            # Verify by fetching league-data again
            verify_response = requests.get(f"{BACKEND_URL}/league-data")
            if verify_response.status_code == 200:
                data = verify_response.json()
                seasons = data.get('seasons', [])
                print(f"📅 Verification - Seasons count after save: {len(seasons)}")
                print(f"📅 Verification - Seasons data: {seasons}")
                return True, seasons
            else:
                print("❌ Failed to verify seasons data after save")
                return False, []
        else:
            print(f"❌ Failed to save seasons: {response.status_code}")
            if response.text:
                print(f"   Error: {response.text}")
            return False, []
            
    except Exception as e:
        print(f"❌ Create seasons test failed: {e}")
        return False, []

def test_timing_and_caching():
    """Test for timing issues or caching problems"""
    print("\n🔍 TESTING TIMING AND CACHING ISSUES...")
    
    try:
        # Make multiple rapid requests to check for consistency
        results = []
        
        for i in range(5):
            print(f"  Request {i+1}/5...")
            response = requests.get(f"{BACKEND_URL}/league-data")
            
            if response.status_code == 200:
                data = response.json()
                seasons = data.get('seasons', [])
                seasons_count = len(seasons) if isinstance(seasons, list) else 0
                results.append(seasons_count)
                print(f"    Seasons count: {seasons_count}")
            else:
                results.append(-1)
                print(f"    Failed: {response.status_code}")
            
            # Small delay between requests
            time.sleep(0.5)
        
        # Check for consistency
        unique_results = set(results)
        print(f"\n📊 TIMING TEST RESULTS:")
        print(f"  - All results: {results}")
        print(f"  - Unique results: {unique_results}")
        print(f"  - Consistent: {'✅ YES' if len(unique_results) == 1 else '❌ NO'}")
        
        return len(unique_results) == 1, results
        
    except Exception as e:
        print(f"❌ Timing test failed: {e}")
        return False, []

def test_database_direct_inspection():
    """Inspect the database structure more deeply"""
    print("\n🔍 DEEP DATABASE INSPECTION...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        
        if response.status_code == 200:
            data = response.json()
            
            print("📊 COMPLETE LEAGUE-DATA STRUCTURE:")
            print(f"  - Document ID: {data.get('id', 'Missing')}")
            print(f"  - Last Updated: {data.get('lastUpdated', 'Missing')}")
            
            # Check all fields
            expected_fields = ['teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle', 'seasons']
            
            for field in expected_fields:
                if field in data:
                    field_data = data[field]
                    field_type = type(field_data)
                    field_length = len(field_data) if isinstance(field_data, (list, dict, str)) else 'N/A'
                    print(f"  - {field}: {field_type.__name__} (length: {field_length})")
                    
                    # Special handling for seasons
                    if field == 'seasons':
                        print(f"    📅 SEASONS DETAIL: {field_data}")
                else:
                    print(f"  - {field}: ❌ MISSING")
            
            # Check for any unexpected fields
            actual_fields = set(data.keys())
            expected_fields_set = set(expected_fields + ['id', 'lastUpdated'])
            unexpected_fields = actual_fields - expected_fields_set
            
            if unexpected_fields:
                print(f"  - Unexpected fields: {unexpected_fields}")
            
            return True, data
        else:
            print(f"❌ Database inspection failed: {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ Database inspection failed: {e}")
        return False, None

def simulate_event_form_vs_adminpage():
    """Simulate the difference between Event form and AdminPage API calls"""
    print("\n🔍 SIMULATING EVENT FORM VS ADMINPAGE DIFFERENCE...")
    
    try:
        # Simulate Event form call (which reportedly works)
        print("📝 Simulating Event Form API call...")
        event_form_response = requests.get(f"{BACKEND_URL}/league-data")
        
        if event_form_response.status_code == 200:
            event_data = event_form_response.json()
            event_seasons = event_data.get('seasons', [])
            event_seasons_count = len(event_seasons) if isinstance(event_seasons, list) else 0
            print(f"  📅 Event Form sees seasons: {event_seasons_count}")
            print(f"  📅 Event Form seasons data: {event_seasons}")
        else:
            print(f"  ❌ Event Form simulation failed: {event_form_response.status_code}")
        
        # Small delay to simulate timing difference
        time.sleep(1)
        
        # Simulate AdminPage call (which reportedly fails)
        print("🏛️ Simulating AdminPage API call...")
        admin_response = requests.get(f"{BACKEND_URL}/league-data")
        
        if admin_response.status_code == 200:
            admin_data = admin_response.json()
            admin_seasons = admin_data.get('seasons', [])
            admin_seasons_count = len(admin_seasons) if isinstance(admin_seasons, list) else 0
            print(f"  📅 AdminPage sees seasons: {admin_seasons_count}")
            print(f"  📅 AdminPage seasons data: {admin_seasons}")
        else:
            print(f"  ❌ AdminPage simulation failed: {admin_response.status_code}")
        
        # Compare results
        if event_form_response.status_code == 200 and admin_response.status_code == 200:
            event_seasons_str = json.dumps(event_data.get('seasons', []), sort_keys=True)
            admin_seasons_str = json.dumps(admin_data.get('seasons', []), sort_keys=True)
            
            print(f"\n📊 COMPARISON RESULTS:")
            print(f"  - Event Form seasons count: {event_seasons_count}")
            print(f"  - AdminPage seasons count: {admin_seasons_count}")
            print(f"  - Data identical: {'✅ YES' if event_seasons_str == admin_seasons_str else '❌ NO'}")
            
            if event_seasons_str != admin_seasons_str:
                print(f"  - Event Form data: {event_seasons_str}")
                print(f"  - AdminPage data: {admin_seasons_str}")
            
            return event_seasons_count == admin_seasons_count
        else:
            print("❌ Could not complete comparison due to API failures")
            return False
            
    except Exception as e:
        print(f"❌ Event Form vs AdminPage simulation failed: {e}")
        return False

def main():
    """Main test execution for AdminPage season loading bug"""
    print("🚨 ADMINPAGE SEASON LOADING BUG INVESTIGATION")
    print("=" * 60)
    print("ISSUE: Event form loads seasons (1), AdminPage loads seasons (0)")
    print("Both use same API call to /api/league-data")
    print("=" * 60)
    
    # Test results tracking
    results = {
        'api_health': False,
        'league_data_seasons': False,
        'seasons_endpoint': False,
        'create_seasons': False,
        'timing_consistency': False,
        'database_inspection': False,
        'event_vs_admin_simulation': False
    }
    
    # Execute tests
    results['api_health'] = test_api_health()
    
    if results['api_health']:
        results['league_data_seasons'], league_data = test_league_data_seasons_field()
        results['seasons_endpoint'], seasons_data = test_seasons_endpoint_directly()
        results['create_seasons'], created_seasons = test_create_seasons_data()
        results['timing_consistency'], timing_results = test_timing_and_caching()
        results['database_inspection'], db_data = test_database_direct_inspection()
        results['event_vs_admin_simulation'] = simulate_event_form_vs_adminpage()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 ADMINPAGE SEASON BUG INVESTIGATION SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    # Specific findings
    print("\n🔍 KEY FINDINGS:")
    
    if results['league_data_seasons']:
        print("✅ /api/league-data endpoint is accessible")
    else:
        print("❌ /api/league-data endpoint has issues")
    
    if results['create_seasons']:
        print("✅ Seasons can be saved to database")
    else:
        print("❌ Seasons cannot be saved - this may be the root cause")
    
    if results['timing_consistency']:
        print("✅ No timing/caching issues detected")
    else:
        print("❌ Timing or caching issues may be present")
    
    if results['event_vs_admin_simulation']:
        print("✅ Event Form and AdminPage see same data")
    else:
        print("❌ Event Form and AdminPage see different data - CRITICAL BUG CONFIRMED")
    
    # Root cause analysis
    print("\n🎯 ROOT CAUSE ANALYSIS:")
    if not results['create_seasons']:
        print("🚨 LIKELY CAUSE: Seasons endpoint not working - AdminPage cannot save seasons")
        print("   SOLUTION: Fix POST /api/league-data/seasons endpoint")
    elif not results['event_vs_admin_simulation']:
        print("🚨 LIKELY CAUSE: Different data processing between Event Form and AdminPage")
        print("   SOLUTION: Check frontend code for parsing differences")
    elif not results['timing_consistency']:
        print("🚨 LIKELY CAUSE: Race condition or caching issue")
        print("   SOLUTION: Add proper loading states and cache invalidation")
    else:
        print("🤔 UNCLEAR: All backend tests pass - issue may be frontend-specific")
        print("   SOLUTION: Check frontend console logs and component state")
    
    return passed_tests >= (total_tests * 0.7)  # 70% pass rate acceptable for investigation

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)