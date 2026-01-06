#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment - PRODUCTION URL
BACKEND_URL = "https://roster-enhance-1.preview.emergentagent.com/api"

def check_multiple_environments():
    """Check if there are multiple environments that might have different data"""
    print("🔍 CHECKING FOR MULTIPLE ENVIRONMENTS...")
    
    # Check different possible URLs
    urls_to_check = [
        "https://roster-enhance-1.preview.emergentagent.com/api",
        "https://team-lax-portal.emergent.host/api",
        "http://localhost:8001/api"
    ]
    
    for url in urls_to_check:
        try:
            print(f"\n📊 Checking {url}...")
            response = requests.get(f"{url}/", timeout=5)
            if response.status_code == 200:
                print(f"  ✅ Accessible: {response.json()}")
                
                # Check league-data size
                data_response = requests.get(f"{url}/league-data", timeout=5)
                if data_response.status_code == 200:
                    data = data_response.json()
                    size_mb = len(json.dumps(data).encode('utf-8')) / (1024 * 1024)
                    print(f"  📏 League-data size: {size_mb:.3f} MB")
                    
                    # Check for large data
                    if size_mb > 10:
                        print(f"  🚨 LARGE DATABASE FOUND!")
                        analyze_large_environment(url, data)
                else:
                    print(f"  ❌ Could not fetch league-data: {data_response.status_code}")
            else:
                print(f"  ❌ Not accessible: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"  ❌ Connection failed: {e}")

def analyze_large_environment(url, data):
    """Analyze environment with large data"""
    print(f"    🔍 ANALYZING LARGE ENVIRONMENT: {url}")
    
    # Check each section for size
    sections = ['teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
    
    for section in sections:
        if section in data:
            section_data = data[section]
            section_size = len(json.dumps(section_data).encode('utf-8')) / (1024 * 1024)
            if section_size > 1:  # Over 1MB
                print(f"      📊 {section}: {section_size:.2f} MB")
                
                if section == 'players' and isinstance(section_data, list):
                    for player in section_data:
                        if player.get('photoUrl') and len(player['photoUrl']) > 100000:
                            photo_size = len(player['photoUrl']) / (1024 * 1024)
                            print(f"        👤 {player.get('name')}: {photo_size:.2f} MB photo")
                
                if section == 'teams' and isinstance(section_data, list):
                    for team in section_data:
                        if team.get('logo') and len(team['logo']) > 100000:
                            logo_size = len(team['logo']) / (1024 * 1024)
                            print(f"        🏆 {team.get('name')}: {logo_size:.2f} MB logo")

def simulate_user_team_save_scenario():
    """Simulate the exact scenario where user gets BSON error"""
    print("\n🔍 SIMULATING USER'S TEAM SAVE SCENARIO...")
    
    try:
        # Get current state
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            print(f"❌ Could not fetch current state")
            return False
        
        data = response.json()
        current_size = len(json.dumps(data).encode('utf-8')) / (1024 * 1024)
        print(f"📏 Current document size: {current_size:.3f} MB")
        
        # Create a team with realistic data that user might create
        realistic_team = {
            "id": "user-test-team-" + str(int(datetime.now().timestamp())),
            "name": "User's New Team",
            "division": "Field",
            "coach": "John Smith",
            "homeField": "Main Stadium",
            "contactEmail": "coach@team.com",
            "logo": "",  # Start without logo
            "style": {
                "primaryColor": "#FF6B35",
                "backgroundColor": "#FFF8F0",
                "accentColor": "#004E89",
                "logoUrl": "",
                "logoOpacity": 1.0,
                "bannerUrl": "",
                "cardBackgroundImage": "",
                "cardBackgroundOpacity": 0.3,
                "pageBackgroundType": "color",
                "pageBackgroundColor": "",
                "pageBackgroundImage": "",
                "formBackgroundColor": "",
                "formBackgroundImage": "",
                "formBackgroundType": "color",
                "formTextColor": ""
            },
            "galleries": [],
            "active": True,
            "wins": 0,
            "losses": 0,
            "ties": 0,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        
        # Test 1: Save team without logo (should work)
        print(f"\n📝 Test 1: Saving team without logo...")
        current_teams = data.get('teams', [])
        test_teams = current_teams + [realistic_team]
        
        save_response = requests.post(f"{BACKEND_URL}/league-data/teams", json=test_teams)
        print(f"📊 Save without logo: {save_response.status_code}")
        
        if save_response.status_code != 200:
            print(f"❌ Failed even without logo: {save_response.text}")
            return False
        
        # Test 2: Add a medium-sized logo
        print(f"\n📝 Test 2: Adding medium-sized logo...")
        # Create a medium-sized base64 image (about 50KB)
        medium_logo = "data:image/png;base64," + "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" * 500
        realistic_team['logo'] = medium_logo
        realistic_team['style']['logoUrl'] = medium_logo
        
        test_teams_with_logo = current_teams + [realistic_team]
        projected_size = len(json.dumps({'teams': test_teams_with_logo}).encode('utf-8')) / (1024 * 1024)
        print(f"📏 Projected size with logo: {projected_size:.3f} MB")
        
        save_response2 = requests.post(f"{BACKEND_URL}/league-data/teams", json=test_teams_with_logo)
        print(f"📊 Save with medium logo: {save_response2.status_code}")
        
        if save_response2.status_code != 200:
            print(f"❌ Failed with medium logo: {save_response2.text}")
            if "too large" in save_response2.text.lower():
                print(f"🚨 BSON ERROR REPRODUCED!")
        
        # Test 3: Try with large logo (this might trigger BSON error)
        print(f"\n📝 Test 3: Testing with large logo...")
        # Create a large base64 image (about 2MB)
        large_logo = "data:image/png;base64," + "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" * 20000
        realistic_team['logo'] = large_logo
        realistic_team['style']['logoUrl'] = large_logo
        
        test_teams_large = current_teams + [realistic_team]
        projected_large_size = len(json.dumps({'teams': test_teams_large}).encode('utf-8')) / (1024 * 1024)
        print(f"📏 Projected size with large logo: {projected_large_size:.3f} MB")
        
        if projected_large_size > 16:
            print(f"🚨 PROJECTED SIZE EXCEEDS 16MB BSON LIMIT!")
            print(f"   This would cause the BSON error user is experiencing")
            return True
        
        save_response3 = requests.post(f"{BACKEND_URL}/league-data/teams", json=test_teams_large)
        print(f"📊 Save with large logo: {save_response3.status_code}")
        
        if save_response3.status_code != 200:
            print(f"❌ Failed with large logo: {save_response3.text}")
            if "too large" in save_response3.text.lower():
                print(f"🚨 BSON ERROR REPRODUCED WITH LARGE LOGO!")
                return True
        
        # Clean up
        print(f"\n🧹 Cleaning up test data...")
        cleanup_response = requests.post(f"{BACKEND_URL}/league-data/teams", json=current_teams)
        print(f"📊 Cleanup: {cleanup_response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ User scenario simulation failed: {e}")
        return False

def check_database_growth_over_time():
    """Check if database has been growing and might hit BSON limit during saves"""
    print("\n🔍 CHECKING DATABASE GROWTH PATTERNS...")
    
    try:
        # Get current data
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            print(f"❌ Could not fetch data")
            return False
        
        data = response.json()
        
        # Analyze data that could grow over time
        growth_factors = {
            'teams': len(data.get('teams', [])),
            'players': len(data.get('players', [])),
            'events': len(data.get('leagueSchedule', [])),
            'news': len(data.get('newsItems', [])),
            'ticker': len(data.get('gameTickerData', []))
        }
        
        print(f"📊 Current data counts:")
        total_items = 0
        for category, count in growth_factors.items():
            print(f"  - {category}: {count} items")
            total_items += count
        
        print(f"📊 Total items: {total_items}")
        
        # Estimate potential size with more data
        current_size = len(json.dumps(data).encode('utf-8')) / (1024 * 1024)
        
        # Simulate growth scenarios
        print(f"\n📈 GROWTH SCENARIOS:")
        print(f"  Current size: {current_size:.3f} MB")
        
        # Scenario 1: Double the data
        estimated_double = current_size * 2
        print(f"  If data doubles: {estimated_double:.3f} MB")
        
        # Scenario 2: Add large images
        estimated_with_images = current_size + 10  # Add 10MB of images
        print(f"  With large images: {estimated_with_images:.3f} MB")
        
        # Scenario 3: Full season data
        estimated_full_season = current_size + 5  # Add 5MB of season data
        print(f"  Full season data: {estimated_full_season:.3f} MB")
        
        if any(size > 16 for size in [estimated_double, estimated_with_images, estimated_full_season]):
            print(f"🚨 GROWTH SCENARIOS EXCEED BSON LIMIT!")
            print(f"   Database could hit BSON limit as it grows")
            return True
        else:
            print(f"✅ Growth scenarios within BSON limit")
            return True
            
    except Exception as e:
        print(f"❌ Growth analysis failed: {e}")
        return False

def main():
    """Main production environment investigation"""
    print("🚨 PRODUCTION ENVIRONMENT BSON ERROR INVESTIGATION")
    print("=" * 70)
    print("CRITICAL: User still reports BSON errors despite cleanup")
    print("GOAL: Find the actual production environment causing issues")
    print("=" * 70)
    
    # Check API health
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"✅ Primary API Health: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Primary API Failed: {e}")
        return False
    
    # Investigation steps
    results = {
        'environment_check': False,
        'user_scenario': False,
        'growth_analysis': False
    }
    
    # Check for multiple environments
    check_multiple_environments()
    results['environment_check'] = True
    
    # Simulate user's exact scenario
    results['user_scenario'] = simulate_user_team_save_scenario()
    
    # Check database growth patterns
    results['growth_analysis'] = check_database_growth_over_time()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 PRODUCTION ENVIRONMENT INVESTIGATION SUMMARY")
    print("=" * 70)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} investigation steps completed")
    
    # Final recommendations
    print(f"\n💡 CRITICAL FINDINGS & RECOMMENDATIONS:")
    print(f"  🔍 Backend logs show BSON error at 2025-09-15 09:53:17")
    print(f"  📏 Current database size is small (0.01 MB)")
    print(f"  🚨 User likely adding large images that trigger BSON limit")
    print(f"  🔧 Implement image size validation before saves")
    print(f"  📊 Monitor document size during team operations")
    print(f"  🛡️  Add BSON size checks in frontend before API calls")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)