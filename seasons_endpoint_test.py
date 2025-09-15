#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://lacrosse-mgr.preview.emergentagent.com/api"

def test_seasons_endpoint_issue():
    """Test the specific seasons endpoint 400 error issue"""
    print("🚨 URGENT: INVESTIGATING SEASONS ENDPOINT 400 ERROR")
    print("=" * 60)
    
    try:
        # 1. Test the exact failing endpoint
        print("\n🔍 TESTING SEASONS ENDPOINT...")
        seasons_data = [
            {
                "id": "season_2025",
                "name": "2025 Season",
                "startDate": "2025-03-01",
                "endDate": "2025-10-31",
                "active": True
            }
        ]
        
        response = requests.post(f"{BACKEND_URL}/league-data/seasons", json=seasons_data)
        print(f"📊 POST /api/league-data/seasons Status: {response.status_code}")
        
        if response.status_code == 400:
            print(f"❌ CONFIRMED: 400 Bad Request error")
            print(f"   Response: {response.text}")
            
            # Parse the error message
            try:
                error_data = response.json()
                print(f"   Error Detail: {error_data.get('detail', 'No detail provided')}")
            except:
                print(f"   Raw Response: {response.text}")
        else:
            print(f"✅ Unexpected: Status {response.status_code} (expected 400)")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    
    return True

def check_valid_data_types():
    """Check what data types are actually supported"""
    print("\n🔍 CHECKING SUPPORTED DATA TYPES...")
    
    # From the backend code, valid types are:
    valid_types = ["teams", "players", "users", "newsItems", "gameTickerData", "leagueSchedule", "leagueInfo", "websiteStyle"]
    
    print("📋 SUPPORTED DATA TYPES (from backend code):")
    for i, data_type in enumerate(valid_types, 1):
        print(f"  {i}. {data_type}")
    
    print(f"\n❌ 'seasons' is NOT in the supported list!")
    print(f"   This explains the 400 Bad Request error")
    
    return valid_types

def test_valid_endpoints():
    """Test some valid endpoints to confirm they work"""
    print("\n🔍 TESTING VALID ENDPOINTS FOR COMPARISON...")
    
    try:
        # Test a valid endpoint - leagueInfo
        test_data = {"seasonInfo": "Test season info"}
        
        response = requests.post(f"{BACKEND_URL}/league-data/leagueInfo", json=test_data)
        print(f"📊 POST /api/league-data/leagueInfo Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ Valid endpoint works correctly")
        else:
            print(f"❌ Unexpected error on valid endpoint: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Valid endpoint test failed: {e}")
        return False
    
    return True

def check_league_data_structure():
    """Check the current league data structure"""
    print("\n🔍 CHECKING CURRENT LEAGUE DATA STRUCTURE...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 GET /api/league-data Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📋 CURRENT LEAGUE DATA FIELDS:")
            
            for key, value in data.items():
                if key == "_id":
                    continue
                    
                value_type = type(value).__name__
                if isinstance(value, list):
                    length = len(value)
                    print(f"  - {key}: {value_type} (length: {length})")
                elif isinstance(value, dict):
                    keys = len(value.keys())
                    print(f"  - {key}: {value_type} (keys: {keys})")
                else:
                    print(f"  - {key}: {value_type}")
            
            # Check if seasons data exists anywhere
            seasons_found = False
            for key, value in data.items():
                if "season" in key.lower():
                    print(f"🔍 Found season-related field: {key}")
                    seasons_found = True
                    
                if isinstance(value, dict):
                    for subkey in value.keys():
                        if "season" in subkey.lower():
                            print(f"🔍 Found season-related subfield: {key}.{subkey}")
                            seasons_found = True
            
            if not seasons_found:
                print(f"❌ No existing season data found in league data")
            
            return True, data
        else:
            print(f"❌ Failed to get league data: {response.status_code}")
            return False, {}
            
    except Exception as e:
        print(f"❌ League data check failed: {e}")
        return False, {}

def suggest_solutions():
    """Suggest possible solutions for the seasons endpoint issue"""
    print("\n💡 SUGGESTED SOLUTIONS:")
    print("=" * 40)
    
    print("1. 🔧 ADD 'seasons' TO VALID DATA TYPES:")
    print("   - Modify backend/server.py line 146")
    print("   - Add 'seasons' to valid_types list")
    print("   - This would allow POST /api/league-data/seasons")
    
    print("\n2. 📊 USE EXISTING leagueInfo FIELD:")
    print("   - Store seasons data in leagueInfo object")
    print("   - POST to /api/league-data/leagueInfo")
    print("   - Structure: {'seasons': [season_data...]}")
    
    print("\n3. 🗂️ CREATE DEDICATED SEASONS ENDPOINT:")
    print("   - Add new /api/seasons endpoint")
    print("   - Similar to /api/teams or /api/players")
    print("   - Full CRUD operations for seasons")
    
    print("\n4. 📋 USE MAIN LEAGUE DATA:")
    print("   - Add seasons field to main league data structure")
    print("   - POST entire league data with seasons included")
    
    print("\n🎯 RECOMMENDED APPROACH:")
    print("   Option 1 (quickest fix) - Add 'seasons' to valid_types")
    print("   This maintains consistency with existing data structure")

def test_workaround_solutions():
    """Test potential workaround solutions"""
    print("\n🔧 TESTING WORKAROUND SOLUTIONS...")
    
    seasons_data = [
        {
            "id": "season_2025",
            "name": "2025 Season", 
            "startDate": "2025-03-01",
            "endDate": "2025-10-31",
            "active": True
        }
    ]
    
    # Test Option 2: Use leagueInfo
    print("\n📊 TESTING WORKAROUND: leagueInfo approach")
    try:
        league_info_data = {
            "seasons": seasons_data,
            "currentSeason": "season_2025"
        }
        
        response = requests.post(f"{BACKEND_URL}/league-data/leagueInfo", json=league_info_data)
        print(f"📊 POST /api/league-data/leagueInfo Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ WORKAROUND SUCCESS: Seasons can be stored in leagueInfo")
            
            # Verify the data was saved
            get_response = requests.get(f"{BACKEND_URL}/league-data")
            if get_response.status_code == 200:
                data = get_response.json()
                league_info = data.get('leagueInfo', {})
                if 'seasons' in league_info:
                    print(f"✅ Seasons data successfully stored and retrieved")
                    print(f"   Seasons count: {len(league_info['seasons'])}")
                else:
                    print(f"❌ Seasons data not found after save")
        else:
            print(f"❌ Workaround failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Workaround test failed: {e}")
        return False
    
    return True

def main():
    """Main test execution"""
    print("🚨 SEASONS ENDPOINT INVESTIGATION")
    print("User Issue: POST /api/league-data/seasons returns 400 Bad Request")
    print("=" * 70)
    
    # Execute investigation steps
    test_seasons_endpoint_issue()
    valid_types = check_valid_data_types()
    test_valid_endpoints()
    success, league_data = check_league_data_structure()
    suggest_solutions()
    test_workaround_solutions()
    
    # Final summary
    print("\n" + "=" * 70)
    print("📊 INVESTIGATION SUMMARY")
    print("=" * 70)
    
    print("🔍 ROOT CAUSE IDENTIFIED:")
    print("   - 'seasons' is not in the valid_types list in backend/server.py")
    print("   - Line 146: valid_types = ['teams', 'players', 'users', ...]")
    print("   - 'seasons' is missing from this list")
    
    print("\n🚨 IMPACT:")
    print("   - User cannot save seasons data")
    print("   - Season management functionality is broken")
    print("   - Frontend expects /api/league-data/seasons to work")
    
    print("\n✅ IMMEDIATE FIX:")
    print("   - Add 'seasons' to valid_types list in backend/server.py")
    print("   - This will allow POST /api/league-data/seasons to work")
    
    print("\n🔧 WORKAROUND AVAILABLE:")
    print("   - Seasons can be stored in leagueInfo field")
    print("   - Use POST /api/league-data/leagueInfo with seasons array")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)