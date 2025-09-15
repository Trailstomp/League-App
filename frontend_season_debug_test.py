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

def simulate_adminpage_load():
    """Simulate AdminPage loading seasons"""
    print("\n🏛️ SIMULATING ADMINPAGE SEASON LOADING...")
    
    try:
        # This is exactly what AdminPage.js does in loadSeasons()
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 AdminPage API call status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            seasons = data.get('seasons', [])
            seasons_count = len(seasons) if isinstance(seasons, list) else 0
            
            print(f"📅 AdminPage: Raw response seasons field: {data.get('seasons', 'MISSING')}")
            print(f"📅 AdminPage: Seasons type: {type(seasons)}")
            print(f"📅 AdminPage: Loaded seasons: {seasons_count}")
            
            if seasons_count > 0:
                print(f"📅 AdminPage: First season: {seasons[0]}")
            
            return True, seasons_count, seasons
        else:
            print(f"❌ AdminPage API call failed: {response.status_code}")
            return False, 0, []
            
    except Exception as e:
        print(f"❌ AdminPage simulation failed: {e}")
        return False, 0, []

def simulate_eventform_load():
    """Simulate SimpleEventForm loading seasons"""
    print("\n📝 SIMULATING EVENT FORM SEASON LOADING...")
    
    try:
        # This is exactly what SimpleEventForm.js does in loadSeasonsAndLeagues()
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 Event Form API call status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            seasons = data.get('seasons', [])
            seasons_count = len(seasons) if isinstance(seasons, list) else 0
            
            print(f"📅 Event Form: Raw response seasons field: {data.get('seasons', 'MISSING')}")
            print(f"📅 Event Form: Seasons type: {type(seasons)}")
            print(f"📅 Event Form: Loaded seasons: {seasons_count}")
            
            if seasons_count > 0:
                print(f"📅 Event Form: First season: {seasons[0]}")
            
            return True, seasons_count, seasons
        else:
            print(f"❌ Event Form API call failed: {response.status_code}")
            return False, 0, []
            
    except Exception as e:
        print(f"❌ Event Form simulation failed: {e}")
        return False, 0, []

def simulate_seasonmanager_load():
    """Simulate SeasonManager loading seasons"""
    print("\n📅 SIMULATING SEASON MANAGER LOADING...")
    
    try:
        # This is exactly what SeasonManager.js does in loadSeasons()
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 Season Manager API call status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            seasons = data.get('seasons', [])
            seasons_count = len(seasons) if isinstance(seasons, list) else 0
            
            print(f"📅 Season Manager: Raw response seasons field: {data.get('seasons', 'MISSING')}")
            print(f"📅 Season Manager: Seasons type: {type(seasons)}")
            print(f"📅 Season Manager: Loaded seasons: {seasons_count}")
            
            if seasons_count > 0:
                print(f"📅 Season Manager: First season: {seasons[0]}")
            
            return True, seasons_count, seasons
        else:
            print(f"❌ Season Manager API call failed: {response.status_code}")
            return False, 0, []
            
    except Exception as e:
        print(f"❌ Season Manager simulation failed: {e}")
        return False, 0, []

def test_rapid_succession_calls():
    """Test multiple rapid API calls to check for race conditions"""
    print("\n⚡ TESTING RAPID SUCCESSION API CALLS...")
    
    results = []
    
    for i in range(10):
        try:
            response = requests.get(f"{BACKEND_URL}/league-data")
            if response.status_code == 200:
                data = response.json()
                seasons = data.get('seasons', [])
                seasons_count = len(seasons) if isinstance(seasons, list) else 0
                results.append(seasons_count)
                print(f"  Call {i+1}: {seasons_count} seasons")
            else:
                results.append(-1)
                print(f"  Call {i+1}: Failed ({response.status_code})")
            
            # Small delay
            time.sleep(0.1)
            
        except Exception as e:
            results.append(-1)
            print(f"  Call {i+1}: Error - {e}")
    
    unique_results = set(results)
    print(f"\n📊 RAPID CALLS RESULTS:")
    print(f"  - All results: {results}")
    print(f"  - Unique results: {unique_results}")
    print(f"  - Consistent: {'✅ YES' if len(unique_results) == 1 else '❌ NO'}")
    
    return len(unique_results) == 1, results

def check_response_structure():
    """Check the exact structure of the API response"""
    print("\n🔍 CHECKING RESPONSE STRUCTURE...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code == 200:
            data = response.json()
            
            print(f"📊 RESPONSE ANALYSIS:")
            print(f"  - Response type: {type(data)}")
            print(f"  - Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            
            if 'seasons' in data:
                seasons = data['seasons']
                print(f"  - Seasons field type: {type(seasons)}")
                print(f"  - Seasons field value: {seasons}")
                
                if isinstance(seasons, list):
                    print(f"  - Seasons list length: {len(seasons)}")
                    for i, season in enumerate(seasons):
                        print(f"    Season {i+1}: {season}")
                elif isinstance(seasons, dict):
                    print(f"  - Seasons dict keys: {list(seasons.keys())}")
                else:
                    print(f"  - Seasons unexpected type: {type(seasons)}")
            else:
                print(f"  - ❌ Seasons field missing from response")
                print(f"  - Available fields: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
            
            return True, data
        else:
            print(f"❌ API call failed: {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"❌ Response structure check failed: {e}")
        return False, None

def test_seasons_endpoint_variations():
    """Test different ways to access seasons data"""
    print("\n🔄 TESTING SEASONS ENDPOINT VARIATIONS...")
    
    endpoints_to_test = [
        "/league-data",
        "/league-data/seasons",
    ]
    
    results = {}
    
    for endpoint in endpoints_to_test:
        try:
            print(f"\n  Testing {endpoint}...")
            response = requests.get(f"{BACKEND_URL}{endpoint}")
            print(f"    Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if endpoint == "/league-data":
                    seasons = data.get('seasons', [])
                    seasons_count = len(seasons) if isinstance(seasons, list) else 0
                    print(f"    Seasons count: {seasons_count}")
                    results[endpoint] = seasons_count
                else:
                    # Direct seasons endpoint
                    if isinstance(data, list):
                        seasons_count = len(data)
                        print(f"    Direct seasons count: {seasons_count}")
                        results[endpoint] = seasons_count
                    else:
                        print(f"    Unexpected response type: {type(data)}")
                        results[endpoint] = -1
            else:
                print(f"    Failed: {response.status_code}")
                if response.text:
                    print(f"    Error: {response.text}")
                results[endpoint] = -1
                
        except Exception as e:
            print(f"    Exception: {e}")
            results[endpoint] = -1
    
    print(f"\n📊 ENDPOINT VARIATIONS RESULTS:")
    for endpoint, count in results.items():
        status = "✅ Working" if count >= 0 else "❌ Failed"
        print(f"  {endpoint}: {count} seasons ({status})")
    
    return results

def main():
    """Main test execution for frontend season debugging"""
    print("🚨 FRONTEND SEASON LOADING DEBUG INVESTIGATION")
    print("=" * 60)
    print("ISSUE: AdminPage shows 0 seasons, Event Form shows 1 season")
    print("Both use same API call to /api/league-data")
    print("=" * 60)
    
    # Test results tracking
    results = {
        'api_health': False,
        'adminpage_simulation': False,
        'eventform_simulation': False,
        'seasonmanager_simulation': False,
        'rapid_calls_consistent': False,
        'response_structure_check': False,
        'endpoint_variations': False
    }
    
    # Execute tests
    results['api_health'] = test_api_health()
    
    if results['api_health']:
        # Simulate each component's loading behavior
        adminpage_success, adminpage_count, adminpage_seasons = simulate_adminpage_load()
        results['adminpage_simulation'] = adminpage_success
        
        eventform_success, eventform_count, eventform_seasons = simulate_eventform_load()
        results['eventform_simulation'] = eventform_success
        
        seasonmanager_success, seasonmanager_count, seasonmanager_seasons = simulate_seasonmanager_load()
        results['seasonmanager_simulation'] = seasonmanager_success
        
        # Test for race conditions
        results['rapid_calls_consistent'], rapid_results = test_rapid_succession_calls()
        
        # Check response structure
        results['response_structure_check'], response_data = check_response_structure()
        
        # Test endpoint variations
        endpoint_results = test_seasons_endpoint_variations()
        results['endpoint_variations'] = len([r for r in endpoint_results.values() if r >= 0]) > 0
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 FRONTEND SEASON DEBUG SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    # Critical analysis
    print("\n🔍 CRITICAL ANALYSIS:")
    
    if results['api_health'] and results['adminpage_simulation'] and results['eventform_simulation']:
        if adminpage_count != eventform_count:
            print(f"🚨 CONFIRMED BUG: AdminPage sees {adminpage_count} seasons, Event Form sees {eventform_count} seasons")
            print("   This confirms the reported issue!")
        else:
            print(f"✅ NO BUG DETECTED: Both AdminPage and Event Form see {adminpage_count} seasons")
            print("   The issue may be intermittent or frontend-specific")
    
    if not results['rapid_calls_consistent']:
        print("🚨 RACE CONDITION DETECTED: API calls return inconsistent results")
        print("   This could explain the AdminPage vs Event Form difference")
    
    # Root cause suggestions
    print("\n🎯 POTENTIAL ROOT CAUSES:")
    
    if results['api_health'] and results['response_structure_check']:
        print("✅ Backend API is working correctly")
        print("   Issue is likely in frontend component logic or timing")
    
    if not results['rapid_calls_consistent']:
        print("🚨 API consistency issues detected")
        print("   Possible database connection or caching problems")
    
    print("\n💡 RECOMMENDED NEXT STEPS:")
    print("1. Check browser console logs for AdminPage vs Event Form")
    print("2. Add more detailed logging to both components")
    print("3. Check if AdminPage loads before seasons are saved")
    print("4. Verify component mounting order and timing")
    
    return passed_tests >= (total_tests * 0.7)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)