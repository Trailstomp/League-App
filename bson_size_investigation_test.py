#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
import base64

# Backend URL from environment
BACKEND_URL = "https://lacrosse-mgr.preview.emergentagent.com/api"

def calculate_bson_size(data):
    """Calculate approximate BSON size of data"""
    try:
        json_str = json.dumps(data, ensure_ascii=False)
        # BSON is typically 10-20% larger than JSON due to type information
        json_size = len(json_str.encode('utf-8'))
        estimated_bson_size = json_size * 1.15  # 15% overhead estimate
        return json_size, estimated_bson_size
    except Exception as e:
        print(f"❌ Error calculating size: {e}")
        return 0, 0

def format_size(size_bytes):
    """Format size in human readable format"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def test_current_league_data_size():
    """Test current league-data document size - CRITICAL INVESTIGATION"""
    print("\n🔍 INVESTIGATING CURRENT LEAGUE-DATA DOCUMENT SIZE...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 GET /api/league-data Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            json_size, bson_size = calculate_bson_size(data)
            
            print(f"📈 CURRENT DOCUMENT SIZE ANALYSIS:")
            print(f"  - JSON Size: {format_size(json_size)}")
            print(f"  - Estimated BSON Size: {format_size(bson_size)}")
            print(f"  - MongoDB 16MB Limit: {format_size(16 * 1024 * 1024)}")
            print(f"  - Size Status: {'🚨 OVER LIMIT' if bson_size > 16 * 1024 * 1024 else '✅ Within Limit'}")
            
            # Analyze each field
            print(f"\n📊 FIELD-BY-FIELD SIZE BREAKDOWN:")
            for field, value in data.items():
                if isinstance(value, (list, dict)):
                    field_json_size, field_bson_size = calculate_bson_size(value)
                    print(f"  - {field}: {format_size(field_bson_size)} ({len(value) if isinstance(value, list) else 'object'})")
                else:
                    field_size = len(str(value).encode('utf-8'))
                    print(f"  - {field}: {format_size(field_size)} (scalar)")
            
            # Check for large base64 data
            print(f"\n🔍 SEARCHING FOR LARGE BASE64 DATA...")
            large_base64_found = []
            
            def find_base64_data(obj, path=""):
                if isinstance(obj, dict):
                    for key, value in obj.items():
                        find_base64_data(value, f"{path}.{key}" if path else key)
                elif isinstance(obj, list):
                    for i, item in enumerate(obj):
                        find_base64_data(item, f"{path}[{i}]")
                elif isinstance(obj, str) and obj.startswith('data:'):
                    size = len(obj.encode('utf-8'))
                    if size > 100 * 1024:  # Over 100KB
                        large_base64_found.append({
                            'path': path,
                            'size': size,
                            'type': obj.split(';')[0] if ';' in obj else 'unknown'
                        })
            
            find_base64_data(data)
            
            if large_base64_found:
                print(f"🚨 FOUND {len(large_base64_found)} LARGE BASE64 DATA ITEMS:")
                total_base64_size = 0
                for item in large_base64_found:
                    print(f"  - {item['path']}: {format_size(item['size'])} ({item['type']})")
                    total_base64_size += item['size']
                print(f"  - Total Base64 Data: {format_size(total_base64_size)}")
            else:
                print(f"✅ No large base64 data found")
            
            return True, data, bson_size
        else:
            print(f"❌ Failed to fetch league-data: {response.status_code}")
            return False, None, 0
            
    except Exception as e:
        print(f"❌ League-data size test failed: {e}")
        return False, None, 0

def test_teams_with_logos_size():
    """Test teams collection for large logo data"""
    print("\n🔍 INVESTIGATING TEAMS COLLECTION FOR LOGO DATA...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/teams")
        print(f"📊 GET /api/teams Status: {response.status_code}")
        
        if response.status_code == 200:
            teams = response.json()
            json_size, bson_size = calculate_bson_size(teams)
            
            print(f"📈 TEAMS COLLECTION SIZE:")
            print(f"  - Total Teams: {len(teams)}")
            print(f"  - JSON Size: {format_size(json_size)}")
            print(f"  - Estimated BSON Size: {format_size(bson_size)}")
            
            # Analyze each team for logo data
            teams_with_large_logos = []
            total_logo_size = 0
            
            for team in teams:
                team_name = team.get('name', 'Unknown')
                logo = team.get('logo', '')
                
                if logo and logo.startswith('data:'):
                    logo_size = len(logo.encode('utf-8'))
                    total_logo_size += logo_size
                    
                    if logo_size > 50 * 1024:  # Over 50KB
                        teams_with_large_logos.append({
                            'name': team_name,
                            'id': team.get('id', 'No ID'),
                            'logo_size': logo_size,
                            'logo_type': logo.split(';')[0] if ';' in logo else 'unknown'
                        })
                        print(f"  🚨 {team_name}: Logo {format_size(logo_size)} ({logo.split(';')[0] if ';' in logo else 'unknown'})")
                    else:
                        print(f"  ✅ {team_name}: Logo {format_size(logo_size) if logo else 'None'}")
                else:
                    print(f"  ⚪ {team_name}: No logo data")
            
            print(f"\n📊 LOGO SIZE SUMMARY:")
            print(f"  - Teams with large logos (>50KB): {len(teams_with_large_logos)}")
            print(f"  - Total logo data size: {format_size(total_logo_size)}")
            
            return True, teams, teams_with_large_logos
        else:
            print(f"❌ Failed to fetch teams: {response.status_code}")
            return False, [], []
            
    except Exception as e:
        print(f"❌ Teams logo size test failed: {e}")
        return False, [], []

def test_event_save_with_team_data():
    """Test event save process to see what data is included"""
    print("\n🔍 INVESTIGATING EVENT SAVE PROCESS...")
    
    try:
        # First get current league data to see what would be sent
        league_response = requests.get(f"{BACKEND_URL}/league-data")
        if league_response.status_code != 200:
            print(f"❌ Failed to get league data: {league_response.status_code}")
            return False
        
        league_data = league_response.json()
        current_schedule = league_data.get('leagueSchedule', [])
        
        # Create a test event with team data
        test_event = {
            "id": f"bson_test_{int(datetime.now().timestamp())}",
            "title": "BSON Size Test Event",
            "date": "2025-01-20",
            "time": "15:00",
            "location": "Test Field",
            "description": "Testing BSON size limits",
            "type": "practice",
            "teamIds": ["eagles", "test_team_1"],
            "imageUrl": ""  # No image to start
        }
        
        # Test 1: Save event without large data
        print(f"📊 TEST 1: Event save without large data")
        new_schedule = current_schedule + [test_event]
        json_size, bson_size = calculate_bson_size(new_schedule)
        print(f"  - Schedule with new event: {format_size(bson_size)}")
        
        # Test 2: Add a large base64 image to the event
        print(f"📊 TEST 2: Event save with large image data")
        # Create a large base64 image (simulating a high-res team logo)
        large_image_data = "data:image/png;base64," + "A" * (2 * 1024 * 1024)  # 2MB of data
        test_event_with_image = {**test_event, "imageUrl": large_image_data}
        new_schedule_with_image = current_schedule + [test_event_with_image]
        json_size_img, bson_size_img = calculate_bson_size(new_schedule_with_image)
        print(f"  - Schedule with large image: {format_size(bson_size_img)}")
        print(f"  - Image data size: {format_size(len(large_image_data.encode('utf-8')))}")
        
        # Test 3: Check if team data is being embedded in events
        print(f"📊 TEST 3: Checking for embedded team data in events")
        teams_response = requests.get(f"{BACKEND_URL}/teams")
        if teams_response.status_code == 200:
            teams_data = teams_response.json()
            teams_json_size, teams_bson_size = calculate_bson_size(teams_data)
            print(f"  - Teams collection size: {format_size(teams_bson_size)}")
            
            # Simulate if teams data was embedded in each event
            test_event_with_teams = {
                **test_event,
                "teams": teams_data  # This would be problematic
            }
            schedule_with_embedded_teams = current_schedule + [test_event_with_teams]
            json_size_teams, bson_size_teams = calculate_bson_size(schedule_with_embedded_teams)
            print(f"  - Schedule with embedded teams: {format_size(bson_size_teams)}")
            print(f"  - 🚨 This would {'EXCEED' if bson_size_teams > 16 * 1024 * 1024 else 'be within'} MongoDB limit")
        
        # Test actual save (without large data to avoid breaking the system)
        print(f"📊 TEST 4: Actual event save test")
        try:
            save_response = requests.post(
                f"{BACKEND_URL}/league-data/leagueSchedule",
                json=new_schedule,
                headers={'Content-Type': 'application/json'}
            )
            print(f"  - Save response: {save_response.status_code}")
            if save_response.status_code == 200:
                print(f"  ✅ Event save successful")
            else:
                error_text = save_response.text
                print(f"  ❌ Event save failed: {error_text}")
                if "too large" in error_text.lower() or "16mb" in error_text.lower():
                    print(f"  🚨 CONFIRMED: BSON size limit exceeded!")
        except Exception as e:
            print(f"  ❌ Save test error: {e}")
        
        # Cleanup - remove test event
        try:
            cleanup_response = requests.post(
                f"{BACKEND_URL}/league-data/leagueSchedule",
                json=current_schedule,
                headers={'Content-Type': 'application/json'}
            )
            print(f"🧹 Cleanup: {cleanup_response.status_code}")
        except:
            pass
        
        return True
        
    except Exception as e:
        print(f"❌ Event save test failed: {e}")
        return False

def test_document_structure_analysis():
    """Analyze document structure for potential issues"""
    print("\n🔍 ANALYZING DOCUMENT STRUCTURE FOR ISSUES...")
    
    try:
        # Get all data sources
        league_response = requests.get(f"{BACKEND_URL}/league-data")
        teams_response = requests.get(f"{BACKEND_URL}/teams")
        
        if league_response.status_code != 200 or teams_response.status_code != 200:
            print(f"❌ Failed to get data for analysis")
            return False
        
        league_data = league_response.json()
        teams_data = teams_response.json()
        
        print(f"📊 DOCUMENT STRUCTURE ANALYSIS:")
        
        # Check for data duplication
        league_teams = league_data.get('teams', [])
        print(f"  - Teams in league-data: {len(league_teams)}")
        print(f"  - Teams in teams collection: {len(teams_data)}")
        
        # Check for circular references or duplicate data
        if league_teams and teams_data:
            # Compare team data sizes
            league_teams_size = calculate_bson_size(league_teams)[1]
            teams_collection_size = calculate_bson_size(teams_data)[1]
            
            print(f"  - League-data teams size: {format_size(league_teams_size)}")
            print(f"  - Teams collection size: {format_size(teams_collection_size)}")
            
            if league_teams_size > teams_collection_size * 0.8:
                print(f"  🚨 POTENTIAL ISSUE: League-data teams are nearly as large as teams collection")
                print(f"     This suggests data duplication between collections")
        
        # Check events for embedded data
        events = league_data.get('leagueSchedule', [])
        print(f"  - Events in schedule: {len(events)}")
        
        if events:
            largest_event_size = 0
            largest_event = None
            total_events_size = 0
            
            for event in events:
                event_size = calculate_bson_size(event)[1]
                total_events_size += event_size
                if event_size > largest_event_size:
                    largest_event_size = event_size
                    largest_event = event
            
            print(f"  - Total events size: {format_size(total_events_size)}")
            print(f"  - Largest single event: {format_size(largest_event_size)}")
            
            if largest_event and largest_event_size > 100 * 1024:  # Over 100KB
                print(f"  🚨 LARGE EVENT DETECTED:")
                print(f"    - Event ID: {largest_event.get('id', 'Unknown')}")
                print(f"    - Event Title: {largest_event.get('title', 'Unknown')}")
                
                # Check what's making it large
                for key, value in largest_event.items():
                    if isinstance(value, str) and len(value) > 10000:
                        print(f"    - Large field '{key}': {format_size(len(value.encode('utf-8')))}")
        
        return True
        
    except Exception as e:
        print(f"❌ Document structure analysis failed: {e}")
        return False

def test_mongodb_limits_simulation():
    """Simulate MongoDB BSON limits"""
    print("\n🔍 SIMULATING MONGODB BSON LIMITS...")
    
    try:
        # MongoDB BSON document limit is 16MB
        MONGODB_LIMIT = 16 * 1024 * 1024
        
        print(f"📊 MONGODB BSON LIMITS:")
        print(f"  - Maximum document size: {format_size(MONGODB_LIMIT)}")
        
        # Get current league data
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            print(f"❌ Failed to get league data")
            return False
        
        current_data = response.json()
        current_size = calculate_bson_size(current_data)[1]
        
        print(f"  - Current document size: {format_size(current_size)}")
        print(f"  - Remaining capacity: {format_size(MONGODB_LIMIT - current_size)}")
        print(f"  - Usage percentage: {(current_size / MONGODB_LIMIT) * 100:.1f}%")
        
        # Calculate how many more events with images could be added
        avg_event_size = 2 * 1024  # 2KB average event
        large_event_size = 500 * 1024  # 500KB event with image
        
        remaining_space = MONGODB_LIMIT - current_size
        events_without_images = remaining_space // avg_event_size
        events_with_images = remaining_space // large_event_size
        
        print(f"\n📊 CAPACITY ANALYSIS:")
        print(f"  - Events without images that could be added: ~{events_without_images}")
        print(f"  - Events with large images that could be added: ~{events_with_images}")
        
        if current_size > MONGODB_LIMIT * 0.8:
            print(f"  🚨 WARNING: Document is over 80% of MongoDB limit!")
        
        if current_size > MONGODB_LIMIT:
            print(f"  🚨 CRITICAL: Document exceeds MongoDB limit!")
            print(f"  🔧 IMMEDIATE ACTION REQUIRED: Separate large data into different collections")
        
        return True
        
    except Exception as e:
        print(f"❌ MongoDB limits simulation failed: {e}")
        return False

def main():
    """Main BSON size investigation"""
    print("🚨 CRITICAL BSON SIZE INVESTIGATION - 16MB LIMIT EXCEEDED")
    print("=" * 70)
    
    # Test results tracking
    results = {
        'league_data_size': False,
        'teams_logos_size': False,
        'event_save_process': False,
        'document_structure': False,
        'mongodb_limits': False
    }
    
    # Execute tests
    results['league_data_size'], league_data, current_size = test_current_league_data_size()
    results['teams_logos_size'], teams_data, large_logos = test_teams_with_logos_size()
    results['event_save_process'] = test_event_save_with_team_data()
    results['document_structure'] = test_document_structure_analysis()
    results['mongodb_limits'] = test_mongodb_limits_simulation()
    
    # Summary and Recommendations
    print("\n" + "=" * 70)
    print("📊 BSON SIZE INVESTIGATION SUMMARY")
    print("=" * 70)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ COMPLETED" if passed else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nInvestigation: {passed_tests}/{total_tests} tests completed")
    
    # Critical findings and recommendations
    print("\n🔍 CRITICAL FINDINGS:")
    if current_size > 16 * 1024 * 1024:
        print("🚨 CONFIRMED: Document exceeds 16MB MongoDB limit")
        print("🔧 IMMEDIATE ACTIONS REQUIRED:")
        print("   1. Move team logos to separate collection")
        print("   2. Store only team IDs in events, not full team data")
        print("   3. Implement image optimization/compression")
        print("   4. Consider GridFS for large binary data")
    elif current_size > 12 * 1024 * 1024:
        print("⚠️  WARNING: Document approaching 16MB limit")
        print("🔧 PREVENTIVE ACTIONS RECOMMENDED:")
        print("   1. Monitor document growth")
        print("   2. Optimize image sizes")
        print("   3. Plan data separation strategy")
    else:
        print("✅ Document size within acceptable limits")
    
    if large_logos:
        print(f"\n🖼️  LOGO OPTIMIZATION NEEDED:")
        print(f"   - Found {len(large_logos)} teams with large logos")
        print(f"   - Consider image compression or separate storage")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)