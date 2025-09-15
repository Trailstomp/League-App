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

def test_current_seasons_state():
    """Check current seasons in database"""
    print("\n🔍 CHECKING CURRENT SEASONS STATE...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code == 200:
            data = response.json()
            seasons = data.get('seasons', [])
            
            print(f"📅 Current seasons in database: {len(seasons)}")
            for i, season in enumerate(seasons):
                print(f"  Season {i+1}: {season}")
            
            return True, seasons
        else:
            print(f"❌ Failed to get current state: {response.status_code}")
            return False, []
    except Exception as e:
        print(f"❌ Error checking current state: {e}")
        return False, []

def test_create_fresh_season():
    """Create a fresh season to test the scenario"""
    print("\n➕ CREATING FRESH SEASON FOR TESTING...")
    
    try:
        # Create a test season
        test_season = {
            "id": f"test_season_{int(time.time())}",
            "name": "Test Season for AdminPage Bug",
            "startDate": "2025-01-01",
            "endDate": "2025-12-31",
            "description": "Created to test AdminPage season loading bug",
            "status": "active",
            "createdAt": datetime.utcnow().isoformat(),
            "createdBy": "Testing Agent"
        }
        
        # Get current seasons first
        current_response = requests.get(f"{BACKEND_URL}/league-data")
        if current_response.status_code == 200:
            current_data = current_response.json()
            current_seasons = current_data.get('seasons', [])
        else:
            current_seasons = []
        
        # Add new season
        updated_seasons = current_seasons + [test_season]
        
        # Save updated seasons
        save_response = requests.post(f"{BACKEND_URL}/league-data/seasons", 
                                    json=updated_seasons,
                                    headers={'Content-Type': 'application/json'})
        
        if save_response.status_code == 200:
            print(f"✅ Created test season: {test_season['name']}")
            print(f"   Season ID: {test_season['id']}")
            
            # Verify it was saved
            verify_response = requests.get(f"{BACKEND_URL}/league-data")
            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                verify_seasons = verify_data.get('seasons', [])
                print(f"✅ Verification: {len(verify_seasons)} seasons now in database")
                
                return True, test_season['id'], len(verify_seasons)
            else:
                print(f"❌ Failed to verify season creation")
                return False, None, 0
        else:
            print(f"❌ Failed to create season: {save_response.status_code}")
            if save_response.text:
                print(f"   Error: {save_response.text}")
            return False, None, 0
            
    except Exception as e:
        print(f"❌ Error creating season: {e}")
        return False, None, 0

def test_immediate_vs_delayed_access():
    """Test immediate vs delayed access to seasons"""
    print("\n⏱️ TESTING IMMEDIATE VS DELAYED ACCESS...")
    
    try:
        # Immediate access (simulating AdminPage loading right after season creation)
        print("  🏛️ Immediate access (AdminPage scenario):")
        immediate_response = requests.get(f"{BACKEND_URL}/league-data")
        if immediate_response.status_code == 200:
            immediate_data = immediate_response.json()
            immediate_seasons = immediate_data.get('seasons', [])
            immediate_count = len(immediate_seasons)
            print(f"    Seasons found: {immediate_count}")
        else:
            immediate_count = -1
            print(f"    Failed: {immediate_response.status_code}")
        
        # Small delay
        time.sleep(2)
        
        # Delayed access (simulating Event Form loading later)
        print("  📝 Delayed access (Event Form scenario):")
        delayed_response = requests.get(f"{BACKEND_URL}/league-data")
        if delayed_response.status_code == 200:
            delayed_data = delayed_response.json()
            delayed_seasons = delayed_data.get('seasons', [])
            delayed_count = len(delayed_seasons)
            print(f"    Seasons found: {delayed_count}")
        else:
            delayed_count = -1
            print(f"    Failed: {delayed_response.status_code}")
        
        # Compare results
        if immediate_count == delayed_count and immediate_count > 0:
            print(f"  ✅ Consistent: Both see {immediate_count} seasons")
            return True, immediate_count, delayed_count
        elif immediate_count != delayed_count:
            print(f"  🚨 INCONSISTENT: Immediate={immediate_count}, Delayed={delayed_count}")
            return False, immediate_count, delayed_count
        else:
            print(f"  ❌ Both failed or returned 0")
            return False, immediate_count, delayed_count
            
    except Exception as e:
        print(f"❌ Error in timing test: {e}")
        return False, -1, -1

def test_cache_busting():
    """Test with cache-busting parameters"""
    print("\n🔄 TESTING CACHE BUSTING...")
    
    try:
        results = []
        
        # Test with different cache-busting parameters
        cache_busters = [
            "",  # No cache buster
            f"?t={int(time.time())}",  # Timestamp
            f"?cb={int(time.time() * 1000)}",  # Cache buster
            f"?_={int(time.time())}&r={int(time.time() % 1000)}"  # Multiple params
        ]
        
        for i, cache_buster in enumerate(cache_busters):
            url = f"{BACKEND_URL}/league-data{cache_buster}"
            print(f"  Request {i+1}: {cache_buster if cache_buster else 'No cache buster'}")
            
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                seasons = data.get('seasons', [])
                count = len(seasons)
                results.append(count)
                print(f"    Seasons: {count}")
            else:
                results.append(-1)
                print(f"    Failed: {response.status_code}")
            
            time.sleep(0.5)
        
        # Check consistency
        unique_results = set(results)
        if len(unique_results) == 1 and list(unique_results)[0] > 0:
            print(f"  ✅ Cache busting consistent: All returned {results[0]} seasons")
            return True, results
        else:
            print(f"  🚨 Cache busting inconsistent: {results}")
            return False, results
            
    except Exception as e:
        print(f"❌ Error in cache busting test: {e}")
        return False, []

def test_concurrent_requests():
    """Test concurrent requests to simulate multiple components loading"""
    print("\n🔀 TESTING CONCURRENT REQUESTS...")
    
    try:
        import threading
        import queue
        
        results_queue = queue.Queue()
        
        def make_request(request_id):
            try:
                response = requests.get(f"{BACKEND_URL}/league-data")
                if response.status_code == 200:
                    data = response.json()
                    seasons = data.get('seasons', [])
                    count = len(seasons)
                    results_queue.put((request_id, count, True))
                else:
                    results_queue.put((request_id, -1, False))
            except Exception as e:
                results_queue.put((request_id, -1, False))
        
        # Start multiple concurrent requests
        threads = []
        for i in range(5):
            thread = threading.Thread(target=make_request, args=(f"AdminPage-{i}",))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Collect results
        results = []
        while not results_queue.empty():
            request_id, count, success = results_queue.get()
            results.append((request_id, count, success))
            status = "✅" if success and count > 0 else "❌"
            print(f"  {request_id}: {count} seasons {status}")
        
        # Check consistency
        successful_counts = [count for _, count, success in results if success]
        if successful_counts and len(set(successful_counts)) == 1:
            print(f"  ✅ Concurrent requests consistent: All returned {successful_counts[0]} seasons")
            return True, results
        else:
            print(f"  🚨 Concurrent requests inconsistent: {successful_counts}")
            return False, results
            
    except Exception as e:
        print(f"❌ Error in concurrent test: {e}")
        return False, []

def test_database_state_after_operations():
    """Check database state after various operations"""
    print("\n🗄️ TESTING DATABASE STATE CONSISTENCY...")
    
    try:
        # Get initial state
        initial_response = requests.get(f"{BACKEND_URL}/league-data")
        if initial_response.status_code == 200:
            initial_data = initial_response.json()
            initial_seasons = initial_data.get('seasons', [])
            initial_count = len(initial_seasons)
            print(f"  Initial state: {initial_count} seasons")
        else:
            print(f"  ❌ Failed to get initial state: {initial_response.status_code}")
            return False
        
        # Perform some operations that might affect state
        operations = [
            ("GET /api/teams", lambda: requests.get(f"{BACKEND_URL}/teams")),
            ("GET /api/players", lambda: requests.get(f"{BACKEND_URL}/players")),
            ("GET /api/locations", lambda: requests.get(f"{BACKEND_URL}/locations")),
            ("GET /api/api-integrations", lambda: requests.get(f"{BACKEND_URL}/api-integrations")),
        ]
        
        for op_name, op_func in operations:
            print(f"  Performing {op_name}...")
            op_response = op_func()
            print(f"    Status: {op_response.status_code}")
            
            # Check seasons state after operation
            check_response = requests.get(f"{BACKEND_URL}/league-data")
            if check_response.status_code == 200:
                check_data = check_response.json()
                check_seasons = check_data.get('seasons', [])
                check_count = len(check_seasons)
                
                if check_count == initial_count:
                    print(f"    ✅ Seasons unchanged: {check_count}")
                else:
                    print(f"    🚨 Seasons changed: {initial_count} → {check_count}")
                    return False
            else:
                print(f"    ❌ Failed to check state after {op_name}")
                return False
        
        print(f"  ✅ Database state consistent through all operations")
        return True
        
    except Exception as e:
        print(f"❌ Error in database state test: {e}")
        return False

def cleanup_test_season(season_id):
    """Clean up test season"""
    if not season_id:
        return True
        
    print(f"\n🧹 CLEANING UP TEST SEASON: {season_id}")
    
    try:
        # Get current seasons
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code == 200:
            data = response.json()
            current_seasons = data.get('seasons', [])
            
            # Remove test season
            updated_seasons = [s for s in current_seasons if s.get('id') != season_id]
            
            # Save updated seasons
            save_response = requests.post(f"{BACKEND_URL}/league-data/seasons", 
                                        json=updated_seasons,
                                        headers={'Content-Type': 'application/json'})
            
            if save_response.status_code == 200:
                print(f"✅ Test season cleaned up")
                return True
            else:
                print(f"❌ Failed to clean up: {save_response.status_code}")
                return False
        else:
            print(f"❌ Failed to get seasons for cleanup: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        return False

def main():
    """Main comprehensive test execution"""
    print("🚨 COMPREHENSIVE ADMINPAGE SEASON LOADING BUG INVESTIGATION")
    print("=" * 70)
    print("GOAL: Reproduce and diagnose the AdminPage vs Event Form season loading difference")
    print("=" * 70)
    
    # Test results tracking
    results = {
        'api_health': False,
        'current_state_check': False,
        'fresh_season_creation': False,
        'timing_test': False,
        'cache_busting': False,
        'concurrent_requests': False,
        'database_consistency': False,
        'cleanup': False
    }
    
    test_season_id = None
    
    try:
        # Execute comprehensive tests
        results['api_health'] = test_api_health()
        
        if results['api_health']:
            results['current_state_check'], current_seasons = test_current_seasons_state()
            
            # Create fresh season for testing
            results['fresh_season_creation'], test_season_id, season_count = test_create_fresh_season()
            
            if results['fresh_season_creation']:
                # Test timing scenarios
                results['timing_test'], immediate_count, delayed_count = test_immediate_vs_delayed_access()
                
                # Test cache busting
                results['cache_busting'], cache_results = test_cache_busting()
                
                # Test concurrent requests
                results['concurrent_requests'], concurrent_results = test_concurrent_requests()
                
                # Test database consistency
                results['database_consistency'] = test_database_state_after_operations()
        
        # Cleanup
        if test_season_id:
            results['cleanup'] = cleanup_test_season(test_season_id)
    
    except Exception as e:
        print(f"❌ Critical error in main execution: {e}")
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 COMPREHENSIVE TEST SUMMARY")
    print("=" * 70)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    # Critical findings
    print("\n🔍 CRITICAL FINDINGS:")
    
    if results['timing_test']:
        print("✅ No timing issues detected - immediate and delayed access consistent")
    else:
        print("🚨 TIMING ISSUE DETECTED - AdminPage may load before seasons are available")
    
    if results['cache_busting']:
        print("✅ No caching issues detected - cache busting works correctly")
    else:
        print("🚨 CACHING ISSUE DETECTED - Browser or proxy caching may be interfering")
    
    if results['concurrent_requests']:
        print("✅ No concurrency issues detected - multiple requests consistent")
    else:
        print("🚨 CONCURRENCY ISSUE DETECTED - Race conditions in database access")
    
    if results['database_consistency']:
        print("✅ Database state consistent through operations")
    else:
        print("🚨 DATABASE INCONSISTENCY - State changes unexpectedly")
    
    # Final diagnosis
    print("\n🎯 FINAL DIAGNOSIS:")
    
    if all([results['timing_test'], results['cache_busting'], results['concurrent_requests'], results['database_consistency']]):
        print("✅ BACKEND IS WORKING CORRECTLY")
        print("   The issue is definitely in frontend component logic or state management")
        print("   Recommended: Check browser console logs and component lifecycle")
    else:
        print("🚨 BACKEND ISSUES DETECTED")
        print("   The AdminPage vs Event Form difference may be caused by:")
        if not results['timing_test']:
            print("   - Timing/race conditions in API responses")
        if not results['cache_busting']:
            print("   - Caching issues preventing fresh data")
        if not results['concurrent_requests']:
            print("   - Concurrency problems with multiple requests")
        if not results['database_consistency']:
            print("   - Database state inconsistencies")
    
    return passed_tests >= (total_tests * 0.8)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)