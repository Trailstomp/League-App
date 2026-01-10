#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://league-hub-4.preview.emergentagent.com/api"

def test_api_health():
    """Test if the API is responding"""
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"✅ API Health Check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ API Health Check Failed: {e}")
        return False

def deep_database_inspection():
    """Deep inspection of all database collections for large data"""
    print("\n🔍 DEEP DATABASE INSPECTION FOR PRODUCTION BSON ISSUE...")
    
    try:
        # Check league-data collection
        print("\n📊 LEAGUE-DATA COLLECTION ANALYSIS:")
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code == 200:
            data = response.json()
            json_str = json.dumps(data)
            doc_size_bytes = len(json_str.encode('utf-8'))
            doc_size_mb = doc_size_bytes / (1024 * 1024)
            
            print(f"  - Document size: {doc_size_mb:.3f} MB ({doc_size_bytes:,} bytes)")
            
            # Check each field for large data
            for key, value in data.items():
                if isinstance(value, (list, dict, str)):
                    field_json = json.dumps(value)
                    field_bytes = len(field_json.encode('utf-8'))
                    field_mb = field_bytes / (1024 * 1024)
                    
                    if field_mb > 0.1:  # Fields over 100KB
                        print(f"  - {key}: {field_mb:.3f} MB ({field_bytes:,} bytes)")
                        
                        # Deep analysis of large fields
                        if isinstance(value, list) and len(value) > 0:
                            print(f"    - Array with {len(value)} items")
                            for i, item in enumerate(value[:5]):  # Check first 5 items
                                if isinstance(item, dict):
                                    item_json = json.dumps(item)
                                    item_bytes = len(item_json.encode('utf-8'))
                                    item_mb = item_bytes / (1024 * 1024)
                                    if item_mb > 0.05:  # Items over 50KB
                                        item_name = item.get('name', item.get('title', f'Item {i}'))
                                        print(f"      - {item_name}: {item_mb:.3f} MB")
                                        
                                        # Check for large string fields
                                        for field_key, field_value in item.items():
                                            if isinstance(field_value, str) and len(field_value) > 10000:
                                                field_size_mb = len(field_value.encode('utf-8')) / (1024 * 1024)
                                                print(f"        - {field_key}: {field_size_mb:.3f} MB")
                                                
                                                # Identify data type
                                                if field_value.startswith('data:image/'):
                                                    print(f"          📸 Base64 image")
                                                elif 'X' * 100 in field_value:
                                                    print(f"          🧪 Test data")
                                                else:
                                                    print(f"          📄 Large text")
        
        # Check individual teams collection
        print("\n📊 TEAMS COLLECTION ANALYSIS:")
        teams_response = requests.get(f"{BACKEND_URL}/teams")
        if teams_response.status_code == 200:
            teams = teams_response.json()
            teams_json = json.dumps(teams)
            teams_size_mb = len(teams_json.encode('utf-8')) / (1024 * 1024)
            print(f"  - Collection size: {teams_size_mb:.3f} MB")
            print(f"  - Team count: {len(teams)}")
            
            for team in teams:
                team_json = json.dumps(team)
                team_size_mb = len(team_json.encode('utf-8')) / (1024 * 1024)
                if team_size_mb > 0.1:  # Teams over 100KB
                    team_name = team.get('name', 'Unknown')
                    print(f"  - Large team: {team_name} - {team_size_mb:.3f} MB")
                    
                    # Check specific fields
                    logo = team.get('logo', '')
                    if logo and len(logo) > 10000:
                        logo_mb = len(logo.encode('utf-8')) / (1024 * 1024)
                        print(f"    - Logo: {logo_mb:.3f} MB")
        
        # Check individual players collection
        print("\n📊 PLAYERS COLLECTION ANALYSIS:")
        players_response = requests.get(f"{BACKEND_URL}/players")
        if players_response.status_code == 200:
            players = players_response.json()
            players_json = json.dumps(players)
            players_size_mb = len(players_json.encode('utf-8')) / (1024 * 1024)
            print(f"  - Collection size: {players_size_mb:.3f} MB")
            print(f"  - Player count: {len(players)}")
            
            for player in players:
                player_json = json.dumps(player)
                player_size_mb = len(player_json.encode('utf-8')) / (1024 * 1024)
                if player_size_mb > 0.1:  # Players over 100KB
                    player_name = player.get('name', 'Unknown')
                    print(f"  - Large player: {player_name} - {player_size_mb:.3f} MB")
                    
                    # Check photo
                    photo = player.get('photoUrl', '')
                    if photo and len(photo) > 10000:
                        photo_mb = len(photo.encode('utf-8')) / (1024 * 1024)
                        print(f"    - Photo: {photo_mb:.3f} MB")
        
        return True
        
    except Exception as e:
        print(f"❌ Deep database inspection failed: {e}")
        return False

def test_team_save_bson_scenario():
    """Test the specific scenario that causes BSON errors when saving teams"""
    print("\n🔍 TESTING TEAM SAVE BSON SCENARIO...")
    
    try:
        # Get current league-data size
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            print(f"❌ Could not get league-data")
            return False
        
        initial_data = response.json()
        initial_json = json.dumps(initial_data)
        initial_size_mb = len(initial_json.encode('utf-8')) / (1024 * 1024)
        
        print(f"📏 Initial document size: {initial_size_mb:.3f} MB")
        
        # Create a team with realistic data that might cause issues
        test_team = {
            "name": "Production BSON Test Team",
            "division": "Field",
            "coach": "Test Coach",
            "homeField": "Test Field",
            "contactEmail": "test@example.com",
            "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
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
            "wins": 0,
            "losses": 0,
            "ties": 0,
            "active": True
        }
        
        # Try to save the team to individual collection first
        print(f"💾 Saving team to individual collection...")
        teams_response = requests.post(f"{BACKEND_URL}/teams", json=test_team)
        print(f"📊 POST /api/teams Status: {teams_response.status_code}")
        
        if teams_response.status_code == 200:
            created_team = teams_response.json()
            team_id = created_team.get('id')
            print(f"✅ Team created in individual collection: {team_id}")
            
            # Now try the scenario that causes BSON errors - saving to league-data
            print(f"💾 Testing league-data save scenario...")
            
            # Get current teams from league-data
            current_teams = initial_data.get('teams', [])
            print(f"📊 Current teams in league-data: {len(current_teams)}")
            
            # Add the new team
            current_teams.append(created_team)
            
            # Calculate what the document size would be
            test_data = initial_data.copy()
            test_data['teams'] = current_teams
            test_json = json.dumps(test_data)
            test_size_mb = len(test_json.encode('utf-8')) / (1024 * 1024)
            
            print(f"📏 Projected document size with new team: {test_size_mb:.3f} MB")
            
            if test_size_mb > 16:
                print(f"🚨 BSON OVERFLOW DETECTED: Document would exceed 16MB limit!")
                print(f"   This explains the user's 18.6MB error")
                return False
            
            # Try the actual save
            try:
                save_response = requests.post(f"{BACKEND_URL}/league-data/teams", json=current_teams)
                print(f"📊 POST /api/league-data/teams Status: {save_response.status_code}")
                
                if save_response.status_code == 200:
                    print(f"✅ Team saved to league-data successfully")
                    
                    # Verify final document size
                    final_response = requests.get(f"{BACKEND_URL}/league-data")
                    if final_response.status_code == 200:
                        final_data = final_response.json()
                        final_json = json.dumps(final_data)
                        final_size_mb = len(final_json.encode('utf-8')) / (1024 * 1024)
                        print(f"📏 Final document size: {final_size_mb:.3f} MB")
                        
                        if final_size_mb > 16:
                            print(f"🚨 CRITICAL: Document exceeds BSON limit after save!")
                else:
                    print(f"❌ Failed to save to league-data: {save_response.status_code}")
                    if save_response.text:
                        error_text = save_response.text
                        print(f"   Error: {error_text}")
                        if "too large" in error_text.lower() or "bson" in error_text.lower():
                            print(f"🚨 BSON SIZE ERROR CONFIRMED!")
                            return False
                        
            except Exception as save_error:
                print(f"❌ Save operation failed: {save_error}")
            
            # Clean up
            delete_response = requests.delete(f"{BACKEND_URL}/teams/{team_id}")
            print(f"🧹 Cleanup - Delete Status: {delete_response.status_code}")
            
            return True
        else:
            print(f"❌ Failed to create test team: {teams_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Team save BSON scenario test failed: {e}")
        return False

def check_for_hidden_large_data():
    """Check for any hidden large data that might not be obvious"""
    print("\n🔍 CHECKING FOR HIDDEN LARGE DATA...")
    
    try:
        # Check if there are any unknown fields with large data
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            return False
        
        data = response.json()
        
        # Look for any field that might contain large binary data
        suspicious_fields = []
        
        def check_object_recursively(obj, path=""):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    current_path = f"{path}.{key}" if path else key
                    if isinstance(value, str) and len(value) > 50000:  # Strings over 50KB
                        size_mb = len(value.encode('utf-8')) / (1024 * 1024)
                        suspicious_fields.append({
                            'path': current_path,
                            'size_mb': size_mb,
                            'type': 'large_string',
                            'preview': value[:100] + "..." if len(value) > 100 else value
                        })
                    elif isinstance(value, (dict, list)):
                        check_object_recursively(value, current_path)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    current_path = f"{path}[{i}]"
                    check_object_recursively(item, current_path)
        
        check_object_recursively(data)
        
        print(f"🔍 Found {len(suspicious_fields)} suspicious large fields:")
        for field in suspicious_fields:
            print(f"  - {field['path']}: {field['size_mb']:.3f} MB")
            print(f"    Preview: {field['preview']}")
            
            # Try to identify the type of data
            preview = field['preview'].lower()
            if 'data:image/' in preview:
                print(f"    🔍 Type: Base64 image data")
            elif 'x' * 50 in preview:
                print(f"    🔍 Type: Test data (repeated characters)")
            elif 'blob:' in preview:
                print(f"    🔍 Type: Blob URL (should be cleaned)")
            else:
                print(f"    🔍 Type: Unknown large text data")
        
        return len(suspicious_fields) == 0
        
    except Exception as e:
        print(f"❌ Hidden data check failed: {e}")
        return False

def main():
    """Main test execution for production BSON investigation"""
    print("🚨 PRODUCTION BSON SIZE INVESTIGATION")
    print("=" * 60)
    print("USER ISSUE: BSONObj size: 18629190 (18.6MB) exceeds 16MB limit")
    print("GOAL: Find the exact cause of production BSON overflow")
    print("=" * 60)
    
    # Test results tracking
    results = {
        'api_health': False,
        'deep_inspection': False,
        'team_save_scenario': False,
        'hidden_data_check': False
    }
    
    # Execute tests
    results['api_health'] = test_api_health()
    
    if results['api_health']:
        results['deep_inspection'] = deep_database_inspection()
        results['team_save_scenario'] = test_team_save_bson_scenario()
        results['hidden_data_check'] = check_for_hidden_large_data()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 PRODUCTION BSON INVESTIGATION SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests completed")
    
    # Critical findings
    print("\n🎯 CRITICAL FINDINGS:")
    if not results['hidden_data_check']:
        print(f"🚨 LARGE DATA DETECTED: Hidden large data found in database")
        print(f"   This could be causing the 18.6MB BSON overflow")
    elif not results['team_save_scenario']:
        print(f"🚨 TEAM SAVE ISSUE: Team save scenario failed")
        print(f"   This could be the source of BSON errors")
    else:
        print(f"✅ No obvious BSON issues detected in current state")
        print(f"   The 18.6MB error may be intermittent or environment-specific")
    
    print(f"\n💡 RECOMMENDATIONS:")
    print(f"   1. Monitor document size during team save operations")
    print(f"   2. Implement size validation before saves")
    print(f"   3. Compress any large images found")
    print(f"   4. Remove any test data or temporary large fields")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)