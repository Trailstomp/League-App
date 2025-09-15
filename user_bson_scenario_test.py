#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://lacrosse-mgr.preview.emergentagent.com/api"

def get_document_size_mb(data):
    """Calculate document size in MB"""
    json_str = json.dumps(data)
    size_bytes = len(json_str.encode('utf-8'))
    size_mb = size_bytes / (1024 * 1024)
    return size_mb, size_bytes

def test_user_event_save_scenario():
    """Test the exact scenario user is experiencing"""
    print("\n🚨 USER EVENT SAVE SCENARIO SIMULATION")
    print("=" * 50)
    
    try:
        # Get current state exactly as user would see it
        print("📊 Getting current application state...")
        
        # 1. Get league data (what frontend loads)
        league_response = requests.get(f"{BACKEND_URL}/league-data")
        if league_response.status_code != 200:
            print("❌ Cannot get league data")
            return False
            
        league_data = league_response.json()
        current_size_mb, _ = get_document_size_mb(league_data)
        print(f"📏 Current league-data size: {current_size_mb:.2f} MB")
        
        # 2. Get teams (what event form loads)
        teams_response = requests.get(f"{BACKEND_URL}/teams")
        if teams_response.status_code != 200:
            print("❌ Cannot get teams data")
            return False
            
        teams_data = teams_response.json()
        teams_size_mb, _ = get_document_size_mb(teams_data)
        print(f"📏 Teams data size: {teams_size_mb:.2f} MB")
        
        # 3. Get players (might be embedded in events)
        players_response = requests.get(f"{BACKEND_URL}/players")
        if players_response.status_code != 200:
            print("❌ Cannot get players data")
            return False
            
        players_data = players_response.json()
        players_size_mb, _ = get_document_size_mb(players_data)
        print(f"📏 Players data size: {players_size_mb:.2f} MB")
        
        # 4. Simulate user creating an event (as frontend would)
        print(f"\n🧪 Simulating user event creation...")
        
        # This is what the frontend might send based on the code I saw
        user_event = {
            "id": f"event_{int(datetime.now().timestamp() * 1000)}",
            "title": "User Test Event",
            "date": "2025-01-20",
            "time": "15:00",
            "type": "game",
            "teamIds": [teams_data[0]['id'], teams_data[1]['id']] if len(teams_data) >= 2 else [teams_data[0]['id']],
            "location": "Test Field",
            "description": "User is trying to save this event",
            "season": "",
            "league": "",
            "imageUrl": "",
            "imageStyle": "cover"
        }
        
        event_size_mb, _ = get_document_size_mb(user_event)
        print(f"📏 User event size: {event_size_mb:.4f} MB")
        
        # 5. Check what happens when we add this to current schedule
        current_schedule = league_data.get('leagueSchedule', [])
        print(f"📊 Current schedule has {len(current_schedule)} events")
        
        # Simulate the frontend sending the ENTIRE updated schedule
        updated_schedule = current_schedule + [user_event]
        schedule_size_mb, _ = get_document_size_mb(updated_schedule)
        print(f"📏 Updated schedule size: {schedule_size_mb:.4f} MB")
        
        # 6. Simulate the actual API call that frontend makes
        print(f"\n🔄 Simulating frontend API call...")
        print(f"   Endpoint: POST /api/league-data/leagueSchedule")
        print(f"   Payload size: {schedule_size_mb:.4f} MB")
        
        # Check if this would cause BSON overflow when combined with existing data
        simulated_league_data = league_data.copy()
        simulated_league_data['leagueSchedule'] = updated_schedule
        total_size_mb, _ = get_document_size_mb(simulated_league_data)
        
        print(f"📏 Total document size after save: {total_size_mb:.2f} MB")
        
        if total_size_mb > 16:
            print(f"🚨 BSON OVERFLOW DETECTED!")
            print(f"   Document would be: {total_size_mb:.2f} MB")
            print(f"   Exceeds limit by: {total_size_mb - 16:.2f} MB")
            print(f"   This explains the user's 500 errors!")
            
            # Identify what's causing the bloat
            print(f"\n🔍 BLOAT ANALYSIS:")
            for key, value in simulated_league_data.items():
                if key != '_id':
                    component_size_mb, _ = get_document_size_mb(value)
                    if component_size_mb > 1.0:
                        print(f"   🚨 {key}: {component_size_mb:.2f} MB (LARGE)")
                    else:
                        print(f"   ✅ {key}: {component_size_mb:.4f} MB")
            
            return True  # Found the issue
        else:
            print(f"✅ Document size OK: {total_size_mb:.2f} MB")
            
            # Try the actual save to see if there are other issues
            print(f"\n🧪 Attempting actual save...")
            try:
                save_response = requests.post(f"{BACKEND_URL}/league-data/leagueSchedule", json=updated_schedule)
                print(f"📊 Save response: {save_response.status_code}")
                
                if save_response.status_code == 500:
                    error_text = save_response.text
                    print(f"🚨 500 ERROR CONFIRMED!")
                    print(f"   Error details: {error_text}")
                    
                    # Check if it's BSON related
                    if 'bson' in error_text.lower() or 'document too large' in error_text.lower():
                        print(f"   🎯 BSON error confirmed in response")
                    else:
                        print(f"   ❓ Different error type")
                    
                    return True
                elif save_response.status_code == 200:
                    print(f"✅ Save successful - cleaning up test event")
                    # Clean up
                    cleanup_schedule = [e for e in updated_schedule if e['id'] != user_event['id']]
                    requests.post(f"{BACKEND_URL}/league-data/leagueSchedule", json=cleanup_schedule)
                    return False
                else:
                    print(f"❌ Unexpected response: {save_response.status_code}")
                    return True
                    
            except Exception as e:
                print(f"❌ Save attempt failed: {e}")
                return True
        
    except Exception as e:
        print(f"❌ User scenario test failed: {e}")
        return False

def check_for_circular_references():
    """Check for circular references in data that could cause issues"""
    print("\n🔍 CIRCULAR REFERENCE CHECK")
    print("=" * 35)
    
    try:
        # Get all data sources
        league_response = requests.get(f"{BACKEND_URL}/league-data")
        teams_response = requests.get(f"{BACKEND_URL}/teams")
        players_response = requests.get(f"{BACKEND_URL}/players")
        
        if all(r.status_code == 200 for r in [league_response, teams_response, players_response]):
            league_data = league_response.json()
            teams_data = teams_response.json()
            players_data = players_response.json()
            
            print("📊 Checking for circular references...")
            
            # Check if teams contain player data that contains team data
            circular_found = False
            
            for team in teams_data:
                if 'players' in team:
                    print(f"🔄 Team '{team.get('name')}' contains embedded players")
                    circular_found = True
                    
                    for player in team.get('players', []):
                        if 'team' in player or 'teamData' in player:
                            print(f"   🚨 Player contains team data - CIRCULAR REFERENCE!")
                            circular_found = True
            
            for player in players_data:
                if 'team' in player and isinstance(player['team'], dict):
                    print(f"🔄 Player '{player.get('name')}' contains embedded team data")
                    circular_found = True
                    
                    if 'players' in player['team']:
                        print(f"   🚨 Team data contains players - CIRCULAR REFERENCE!")
                        circular_found = True
            
            # Check events for embedded data
            events = league_data.get('leagueSchedule', [])
            for event in events:
                if 'teams' in event or 'teamData' in event:
                    print(f"🔄 Event '{event.get('title')}' contains embedded team data")
                    circular_found = True
                    
                if 'players' in event or 'playerData' in event:
                    print(f"🔄 Event '{event.get('title')}' contains embedded player data")
                    circular_found = True
            
            if not circular_found:
                print("✅ No circular references detected")
            else:
                print("🚨 Circular references found - this could cause BSON bloat!")
            
            return circular_found
        else:
            print("❌ Failed to fetch data for circular reference check")
            return False
            
    except Exception as e:
        print(f"❌ Circular reference check failed: {e}")
        return False

def analyze_photo_data_in_depth():
    """Deep analysis of photo data that might be causing issues"""
    print("\n🔍 DEEP PHOTO DATA ANALYSIS")
    print("=" * 35)
    
    try:
        # Check all possible sources of photo data
        sources = [
            ("Teams", f"{BACKEND_URL}/teams"),
            ("Players", f"{BACKEND_URL}/players"),
            ("League Data", f"{BACKEND_URL}/league-data")
        ]
        
        total_photo_data = 0
        large_photos = []
        
        for source_name, url in sources:
            print(f"\n📊 Analyzing {source_name}...")
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                
                if source_name == "League Data":
                    # Check teams in league data
                    teams = data.get('teams', [])
                    players = data.get('players', [])
                    
                    for team in teams:
                        logo = team.get('logo', '')
                        if logo and logo.startswith('data:'):
                            size_mb = len(logo.encode('utf-8')) / (1024 * 1024)
                            total_photo_data += size_mb
                            if size_mb > 0.1:
                                large_photos.append(f"Team {team.get('name')}: {size_mb:.2f} MB")
                    
                    for player in players:
                        photo = player.get('photoUrl', '')
                        if photo and photo.startswith('data:'):
                            size_mb = len(photo.encode('utf-8')) / (1024 * 1024)
                            total_photo_data += size_mb
                            if size_mb > 0.1:
                                large_photos.append(f"Player {player.get('name')}: {size_mb:.2f} MB")
                
                elif source_name == "Teams":
                    for team in data:
                        logo = team.get('logo', '')
                        if logo and logo.startswith('data:'):
                            size_mb = len(logo.encode('utf-8')) / (1024 * 1024)
                            total_photo_data += size_mb
                            if size_mb > 0.1:
                                large_photos.append(f"Individual Team {team.get('name')}: {size_mb:.2f} MB")
                
                elif source_name == "Players":
                    for player in data:
                        photo = player.get('photoUrl', '')
                        if photo and photo.startswith('data:'):
                            size_mb = len(photo.encode('utf-8')) / (1024 * 1024)
                            total_photo_data += size_mb
                            if size_mb > 0.1:
                                large_photos.append(f"Individual Player {player.get('name')}: {size_mb:.2f} MB")
        
        print(f"\n📊 PHOTO DATA SUMMARY:")
        print(f"   Total photo data across all sources: {total_photo_data:.2f} MB")
        print(f"   Large photos (>100KB): {len(large_photos)}")
        
        if large_photos:
            print(f"\n🚨 LARGE PHOTOS DETECTED:")
            for photo in large_photos:
                print(f"     {photo}")
        
        if total_photo_data > 10:
            print(f"\n🚨 CRITICAL: Total photo data ({total_photo_data:.2f} MB) could cause BSON overflow!")
            return True
        elif total_photo_data > 5:
            print(f"\n⚠️ WARNING: Photo data ({total_photo_data:.2f} MB) approaching limits")
            return True
        else:
            print(f"\n✅ Photo data within acceptable limits")
            return False
            
    except Exception as e:
        print(f"❌ Photo analysis failed: {e}")
        return False

def main():
    """Main user scenario investigation"""
    print("🚨 USER SCENARIO INVESTIGATION - FINDING EXACT CAUSE OF 500 ERRORS")
    print("=" * 80)
    print("CONTEXT: User reports 500 errors when saving events despite photo compression")
    print("GOAL: Find the exact data causing BSON overflow in user's scenario")
    print("=" * 80)
    
    results = {
        'user_scenario': False,
        'circular_references': False,
        'photo_analysis': False
    }
    
    # Execute investigations
    results['user_scenario'] = test_user_event_save_scenario()
    results['circular_references'] = check_for_circular_references()
    results['photo_analysis'] = analyze_photo_data_in_depth()
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 USER SCENARIO INVESTIGATION SUMMARY")
    print("=" * 80)
    
    issues_found = sum(results.values())
    
    for test_name, issue_found in results.items():
        status = "🚨 ISSUE FOUND" if issue_found else "✅ NO ISSUES"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nIssues detected: {issues_found}/3")
    
    if issues_found > 0:
        print(f"\n💡 EMERGENCY RECOMMENDATIONS:")
        if results['user_scenario']:
            print(f"1. 🚨 IMMEDIATE: Document size exceeds BSON limit during event save")
            print(f"   - Implement size validation before save")
            print(f"   - Compress or remove large data immediately")
        
        if results['circular_references']:
            print(f"2. 🔧 FIX: Remove circular references in data structure")
            print(f"   - Use IDs instead of embedded objects")
            print(f"   - Separate large data into different collections")
        
        if results['photo_analysis']:
            print(f"3. 📸 COMPRESS: Large photo data detected")
            print(f"   - Compress all photos to <100KB")
            print(f"   - Consider external image storage")
        
        print(f"\n🚨 USER CAN'T SAVE EVENTS - IMMEDIATE ACTION REQUIRED!")
    else:
        print(f"\n✅ No obvious BSON issues detected")
        print(f"   Issue may be intermittent or related to specific user actions")
    
    return results

if __name__ == "__main__":
    results = main()
    sys.exit(0)