#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://lacrosse-mgr.preview.emergentagent.com/api"

def test_seasons_endpoint_fix():
    """Test that the seasons endpoint fix is working"""
    print("🔧 TESTING SEASONS ENDPOINT FIX")
    print("=" * 50)
    
    try:
        # Test data for seasons
        seasons_data = [
            {
                "id": "season_2025",
                "name": "2025 Spring Season",
                "startDate": "2025-03-01",
                "endDate": "2025-06-30",
                "active": True,
                "description": "Spring lacrosse season"
            },
            {
                "id": "season_2025_fall",
                "name": "2025 Fall Season", 
                "startDate": "2025-09-01",
                "endDate": "2025-11-30",
                "active": False,
                "description": "Fall lacrosse season"
            }
        ]
        
        print("\n🔍 TESTING POST /api/league-data/seasons...")
        response = requests.post(f"{BACKEND_URL}/league-data/seasons", json=seasons_data)
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Seasons endpoint is now working!")
            response_data = response.json()
            print(f"   Response: {response_data}")
            
            # Verify the data was saved by retrieving it
            print("\n🔍 VERIFYING DATA PERSISTENCE...")
            get_response = requests.get(f"{BACKEND_URL}/league-data")
            
            if get_response.status_code == 200:
                league_data = get_response.json()
                seasons = league_data.get('seasons', [])
                
                print(f"📊 Seasons found in database: {len(seasons)}")
                
                for season in seasons:
                    print(f"  - {season.get('name', 'Unknown')} (ID: {season.get('id', 'No ID')})")
                    print(f"    Active: {season.get('active', 'Unknown')}")
                    print(f"    Period: {season.get('startDate', 'Unknown')} to {season.get('endDate', 'Unknown')}")
                
                if len(seasons) == len(seasons_data):
                    print("✅ All seasons data persisted correctly")
                    return True
                else:
                    print(f"❌ Data mismatch: Expected {len(seasons_data)}, found {len(seasons)}")
                    return False
            else:
                print(f"❌ Failed to retrieve league data: {get_response.status_code}")
                return False
                
        elif response.status_code == 400:
            print("❌ STILL GETTING 400 ERROR")
            print(f"   Response: {response.text}")
            
            try:
                error_data = response.json()
                print(f"   Error Detail: {error_data.get('detail', 'No detail')}")
            except:
                pass
                
            return False
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_seasons_crud_operations():
    """Test full CRUD operations for seasons"""
    print("\n🔍 TESTING SEASONS CRUD OPERATIONS...")
    
    try:
        # 1. CREATE - Add seasons
        initial_seasons = [
            {
                "id": "test_season_1",
                "name": "Test Season 1",
                "startDate": "2025-01-01",
                "endDate": "2025-06-30",
                "active": True
            }
        ]
        
        create_response = requests.post(f"{BACKEND_URL}/league-data/seasons", json=initial_seasons)
        print(f"📊 CREATE Status: {create_response.status_code}")
        
        if create_response.status_code != 200:
            print(f"❌ CREATE failed: {create_response.text}")
            return False
        
        # 2. READ - Get seasons
        get_response = requests.get(f"{BACKEND_URL}/league-data")
        if get_response.status_code == 200:
            seasons = get_response.json().get('seasons', [])
            print(f"📊 READ: Found {len(seasons)} seasons")
        else:
            print(f"❌ READ failed: {get_response.status_code}")
            return False
        
        # 3. UPDATE - Modify seasons
        updated_seasons = [
            {
                "id": "test_season_1",
                "name": "Updated Test Season 1",
                "startDate": "2025-01-01", 
                "endDate": "2025-06-30",
                "active": False,
                "description": "Updated description"
            },
            {
                "id": "test_season_2",
                "name": "Test Season 2",
                "startDate": "2025-07-01",
                "endDate": "2025-12-31", 
                "active": True
            }
        ]
        
        update_response = requests.post(f"{BACKEND_URL}/league-data/seasons", json=updated_seasons)
        print(f"📊 UPDATE Status: {update_response.status_code}")
        
        if update_response.status_code != 200:
            print(f"❌ UPDATE failed: {update_response.text}")
            return False
        
        # Verify update
        get_response2 = requests.get(f"{BACKEND_URL}/league-data")
        if get_response2.status_code == 200:
            updated_seasons_data = get_response2.json().get('seasons', [])
            print(f"📊 After UPDATE: Found {len(updated_seasons_data)} seasons")
            
            # Check if update worked
            season_1 = next((s for s in updated_seasons_data if s.get('id') == 'test_season_1'), None)
            if season_1:
                if season_1.get('name') == 'Updated Test Season 1' and season_1.get('active') == False:
                    print("✅ UPDATE verified successfully")
                else:
                    print("❌ UPDATE verification failed")
                    return False
            else:
                print("❌ Updated season not found")
                return False
        
        # 4. DELETE - Clear seasons (by setting empty array)
        delete_response = requests.post(f"{BACKEND_URL}/league-data/seasons", json=[])
        print(f"📊 DELETE Status: {delete_response.status_code}")
        
        if delete_response.status_code != 200:
            print(f"❌ DELETE failed: {delete_response.text}")
            return False
        
        # Verify deletion
        get_response3 = requests.get(f"{BACKEND_URL}/league-data")
        if get_response3.status_code == 200:
            final_seasons = get_response3.json().get('seasons', [])
            print(f"📊 After DELETE: Found {len(final_seasons)} seasons")
            
            if len(final_seasons) == 0:
                print("✅ DELETE verified successfully")
            else:
                print("❌ DELETE verification failed")
                return False
        
        print("✅ All CRUD operations working correctly")
        return True
        
    except Exception as e:
        print(f"❌ CRUD test failed: {e}")
        return False

def test_backend_restart_needed():
    """Check if backend needs restart to apply changes"""
    print("\n🔍 CHECKING IF BACKEND RESTART IS NEEDED...")
    
    try:
        # Test a simple endpoint to see if backend is responsive
        response = requests.get(f"{BACKEND_URL}/")
        print(f"📊 Backend health check: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Backend is responsive")
            
            # Check if the fix is active by testing seasons endpoint
            test_data = [{"id": "restart_test", "name": "Restart Test"}]
            seasons_response = requests.post(f"{BACKEND_URL}/league-data/seasons", json=test_data)
            
            if seasons_response.status_code == 200:
                print("✅ Fix is active - no restart needed")
                
                # Clean up test data
                requests.post(f"{BACKEND_URL}/league-data/seasons", json=[])
                return True
            elif seasons_response.status_code == 400:
                print("❌ Fix not active - backend restart may be needed")
                return False
            else:
                print(f"❓ Unexpected response: {seasons_response.status_code}")
                return False
        else:
            print(f"❌ Backend not responsive: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Backend check failed: {e}")
        return False

def main():
    """Main test execution"""
    print("🔧 SEASONS ENDPOINT FIX VERIFICATION")
    print("Testing the fix: Added 'seasons' to valid_types list")
    print("=" * 60)
    
    # Test results
    results = {
        'backend_check': False,
        'seasons_fix': False,
        'crud_operations': False
    }
    
    # Execute tests
    results['backend_check'] = test_backend_restart_needed()
    
    if results['backend_check']:
        results['seasons_fix'] = test_seasons_endpoint_fix()
        results['crud_operations'] = test_seasons_crud_operations()
    else:
        print("\n⚠️ Backend may need restart - attempting tests anyway...")
        results['seasons_fix'] = test_seasons_endpoint_fix()
        if results['seasons_fix']:
            results['crud_operations'] = test_seasons_crud_operations()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 FIX VERIFICATION SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if results['seasons_fix']:
        print("\n🎉 SUCCESS: SEASONS ENDPOINT IS NOW WORKING!")
        print("   - User can now save seasons data")
        print("   - POST /api/league-data/seasons returns 200")
        print("   - Season management functionality restored")
    else:
        print("\n🚨 ISSUE: Seasons endpoint still not working")
        print("   - May need backend restart")
        print("   - Check supervisor logs for errors")
    
    return results['seasons_fix']

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)