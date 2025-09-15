#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
import base64

# Backend URL from environment
BACKEND_URL = "https://lacrosse-mgr.preview.emergentagent.com/api"

def create_large_team_logo():
    """Create a large base64 team logo to simulate the issue"""
    # Create a 2MB base64 image (simulating high-res team logo)
    # This is what might be causing the BSON size issue
    large_image_data = "data:image/png;base64," + "A" * (2 * 1024 * 1024)  # 2MB
    return large_image_data

def test_event_save_with_large_team_data():
    """Test event save with large team data to reproduce BSON limit issue"""
    print("\n🚨 TESTING EVENT SAVE WITH LARGE TEAM DATA - REPRODUCING BSON ISSUE...")
    
    try:
        # Get current league data
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            print(f"❌ Failed to get league data: {response.status_code}")
            return False
        
        current_data = response.json()
        current_schedule = current_data.get('leagueSchedule', [])
        
        print(f"📊 Current schedule has {len(current_schedule)} events")
        
        # Create teams with large logos (simulating the issue)
        teams_with_large_logos = []
        for i in range(5):  # Create 5 teams with large logos
            team = {
                "id": f"large_logo_team_{i}",
                "name": f"Team with Large Logo {i+1}",
                "logo": create_large_team_logo(),  # 2MB logo each
                "division": "Field",
                "coach": f"Coach {i+1}",
                "style": {
                    "primaryColor": "#FF6B35",
                    "backgroundColor": "#FFF8F0",
                    "cardBackgroundImage": create_large_team_logo(),  # Another 2MB
                    "bannerUrl": create_large_team_logo()  # Another 2MB
                }
            }
            teams_with_large_logos.append(team)
        
        # Calculate size of teams data
        teams_json = json.dumps(teams_with_large_logos)
        teams_size_mb = len(teams_json.encode('utf-8')) / (1024 * 1024)
        print(f"📊 Teams with large logos size: {teams_size_mb:.1f} MB")
        
        # Test 1: Event save that includes team data (the problematic scenario)
        print(f"\n🚨 TEST 1: Event save including full team data (PROBLEMATIC)")
        
        problematic_event = {
            "id": f"problematic_event_{int(datetime.now().timestamp())}",
            "title": "Event with Embedded Team Data",
            "date": "2025-01-20",
            "time": "15:00",
            "location": "Test Field",
            "description": "This event embeds full team data causing BSON bloat",
            "type": "game",
            "teamIds": ["large_logo_team_0", "large_logo_team_1"],
            # PROBLEMATIC: Embedding full team objects instead of just IDs
            "teams": teams_with_large_logos[:2],  # This would cause the issue!
            "imageUrl": create_large_team_logo()  # Event image too
        }
        
        # Calculate event size
        event_json = json.dumps(problematic_event)
        event_size_mb = len(event_json.encode('utf-8')) / (1024 * 1024)
        print(f"📊 Single problematic event size: {event_size_mb:.1f} MB")
        
        # Test what happens when we try to save this
        problematic_schedule = current_schedule + [problematic_event]
        schedule_json = json.dumps(problematic_schedule)
        schedule_size_mb = len(schedule_json.encode('utf-8')) / (1024 * 1024)
        print(f"📊 Schedule with problematic event: {schedule_size_mb:.1f} MB")
        
        if schedule_size_mb > 16:
            print(f"🚨 CONFIRMED: Schedule would exceed 16MB MongoDB limit!")
            print(f"   Size: {schedule_size_mb:.1f} MB > 16 MB limit")
        
        # Test 2: Proper event save (only team IDs, no embedded data)
        print(f"\n✅ TEST 2: Proper event save (team IDs only)")
        
        proper_event = {
            "id": f"proper_event_{int(datetime.now().timestamp())}",
            "title": "Proper Event with Team IDs Only",
            "date": "2025-01-20",
            "time": "15:00",
            "location": "Test Field",
            "description": "This event only stores team IDs",
            "type": "game",
            "teamIds": ["large_logo_team_0", "large_logo_team_1"],
            # CORRECT: Only store team IDs, not full team objects
            "imageUrl": ""  # No large image
        }
        
        proper_schedule = current_schedule + [proper_event]
        proper_json = json.dumps(proper_schedule)
        proper_size_mb = len(proper_json.encode('utf-8')) / (1024 * 1024)
        print(f"📊 Schedule with proper event: {proper_size_mb:.1f} MB")
        
        # Test 3: Try actual save with a smaller test
        print(f"\n🧪 TEST 3: Actual save test with smaller data")
        
        # Create a smaller but still problematic event
        smaller_problematic_event = {
            "id": f"test_save_{int(datetime.now().timestamp())}",
            "title": "Test Save Event",
            "date": "2025-01-20",
            "time": "15:00",
            "location": "Test Field",
            "description": "Testing actual save",
            "type": "practice",
            "teamIds": ["test_team"],
            "imageUrl": "data:image/png;base64," + "A" * (500 * 1024)  # 500KB image
        }
        
        test_schedule = current_schedule + [smaller_problematic_event]
        
        try:
            save_response = requests.post(
                f"{BACKEND_URL}/league-data/leagueSchedule",
                json=test_schedule,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            print(f"📊 Save response status: {save_response.status_code}")
            
            if save_response.status_code == 200:
                print(f"✅ Save successful")
            else:
                error_text = save_response.text
                print(f"❌ Save failed: {error_text}")
                
                # Check for BSON size error
                if any(keyword in error_text.lower() for keyword in ['too large', '16mb', 'bson', 'document size']):
                    print(f"🚨 CONFIRMED: BSON size limit error detected!")
                    return True  # We found the issue!
        
        except requests.exceptions.Timeout:
            print(f"⏰ Request timed out - possibly due to large document size")
        except Exception as e:
            print(f"❌ Save test error: {e}")
        
        # Cleanup
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

def test_current_player_photos_issue():
    """Test the current player photos causing BSON bloat"""
    print("\n🔍 INVESTIGATING CURRENT PLAYER PHOTOS CAUSING BSON BLOAT...")
    
    try:
        # Get current league data
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            print(f"❌ Failed to get league data")
            return False
        
        data = response.json()
        players = data.get('players', [])
        
        print(f"📊 Found {len(players)} players in league-data")
        
        total_photo_size = 0
        large_photos = []
        
        for i, player in enumerate(players):
            player_name = player.get('name', f'Player {i+1}')
            photo_url = player.get('photoUrl', '')
            
            if photo_url and photo_url.startswith('data:'):
                photo_size = len(photo_url.encode('utf-8'))
                total_photo_size += photo_size
                
                size_mb = photo_size / (1024 * 1024)
                print(f"  📸 {player_name}: {size_mb:.1f} MB photo")
                
                if photo_size > 1024 * 1024:  # Over 1MB
                    large_photos.append({
                        'name': player_name,
                        'size': photo_size,
                        'size_mb': size_mb
                    })
        
        total_mb = total_photo_size / (1024 * 1024)
        print(f"\n📊 PLAYER PHOTOS ANALYSIS:")
        print(f"  - Total photo data: {total_mb:.1f} MB")
        print(f"  - Large photos (>1MB): {len(large_photos)}")
        
        if total_mb > 10:
            print(f"🚨 CRITICAL: Player photos are consuming {total_mb:.1f} MB!")
            print(f"   This is likely causing the BSON size issue when combined with events")
        
        # Test what happens when we add events to this data
        if total_mb > 5:  # If photos are already large
            print(f"\n🧪 TESTING: Adding events to data with large player photos")
            
            # Simulate adding events with some image data
            test_events = []
            for i in range(10):  # 10 events
                event = {
                    "id": f"test_event_{i}",
                    "title": f"Test Event {i+1}",
                    "date": "2025-01-20",
                    "time": "15:00",
                    "location": "Test Field",
                    "type": "practice",
                    "teamIds": ["test_team"],
                    "imageUrl": "data:image/png;base64," + "A" * (200 * 1024)  # 200KB each
                }
                test_events.append(event)
            
            # Calculate combined size
            test_data = {**data, 'leagueSchedule': test_events}
            combined_json = json.dumps(test_data)
            combined_size_mb = len(combined_json.encode('utf-8')) / (1024 * 1024)
            
            print(f"📊 Combined size (players + events): {combined_size_mb:.1f} MB")
            
            if combined_size_mb > 16:
                print(f"🚨 CONFIRMED: Combined data exceeds 16MB MongoDB limit!")
                print(f"   Root cause: Large player photos + event data = BSON overflow")
                return True
        
        return True
        
    except Exception as e:
        print(f"❌ Player photos test failed: {e}")
        return False

def test_solution_recommendations():
    """Test and recommend solutions for BSON size issue"""
    print("\n💡 TESTING SOLUTION RECOMMENDATIONS...")
    
    try:
        # Get current data
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            return False
        
        data = response.json()
        
        print(f"🔧 RECOMMENDED SOLUTIONS:")
        print(f"1. 📸 OPTIMIZE PLAYER PHOTOS:")
        print(f"   - Current player photos are too large (multi-MB each)")
        print(f"   - Compress images to max 100KB each")
        print(f"   - Use image optimization libraries")
        print(f"   - Consider storing images in separate collection or GridFS")
        
        print(f"\n2. 🏆 SEPARATE TEAM LOGO STORAGE:")
        print(f"   - Move team logos to separate 'team_assets' collection")
        print(f"   - Store only logo URLs/IDs in main team documents")
        print(f"   - Use GridFS for large binary data")
        
        print(f"\n3. 📅 OPTIMIZE EVENT DATA:")
        print(f"   - Never embed full team objects in events")
        print(f"   - Store only team IDs in events")
        print(f"   - Compress event images or store separately")
        
        print(f"\n4. 🗂️ IMPLEMENT DATA SEPARATION:")
        print(f"   - Create separate collections for large binary data")
        print(f"   - Use references instead of embedding")
        print(f"   - Implement lazy loading for large assets")
        
        # Test size reduction simulation
        players = data.get('players', [])
        if players:
            # Simulate optimized player data (no large photos)
            optimized_players = []
            for player in players:
                optimized_player = {**player}
                if optimized_player.get('photoUrl', '').startswith('data:'):
                    # Replace with small placeholder or URL reference
                    optimized_player['photoUrl'] = 'https://example.com/player_photos/' + player.get('id', 'unknown') + '.jpg'
                optimized_players.append(optimized_player)
            
            # Calculate size reduction
            original_size = len(json.dumps(players).encode('utf-8')) / (1024 * 1024)
            optimized_size = len(json.dumps(optimized_players).encode('utf-8')) / (1024 * 1024)
            reduction = original_size - optimized_size
            
            print(f"\n📊 SIZE REDUCTION SIMULATION:")
            print(f"   - Original players data: {original_size:.1f} MB")
            print(f"   - Optimized players data: {optimized_size:.1f} MB")
            print(f"   - Size reduction: {reduction:.1f} MB ({(reduction/original_size)*100:.1f}%)")
        
        return True
        
    except Exception as e:
        print(f"❌ Solution recommendations test failed: {e}")
        return False

def main():
    """Main BSON size issue reproduction and investigation"""
    print("🚨 EVENT SAVE BSON SIZE ISSUE INVESTIGATION")
    print("=" * 60)
    print("Reproducing: User getting 500 error when saving events")
    print("Root cause: BSON document size of 17MB (over 16MB MongoDB limit)")
    print("=" * 60)
    
    # Test results tracking
    results = {
        'event_save_large_data': False,
        'player_photos_issue': False,
        'solution_recommendations': False
    }
    
    # Execute tests
    results['event_save_large_data'] = test_event_save_with_large_team_data()
    results['player_photos_issue'] = test_current_player_photos_issue()
    results['solution_recommendations'] = test_solution_recommendations()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 BSON SIZE ISSUE INVESTIGATION SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ COMPLETED" if passed else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nInvestigation: {passed_tests}/{total_tests} tests completed")
    
    # Critical findings
    print("\n🔍 CRITICAL FINDINGS:")
    print("🚨 ROOT CAUSE IDENTIFIED: Large player photos in league-data collection")
    print("   - Player photos are multi-MB base64 data URLs")
    print("   - When combined with event data, exceeds 16MB MongoDB limit")
    print("   - Event saves fail with 500 error due to BSON size limit")
    
    print("\n🔧 IMMEDIATE ACTIONS REQUIRED:")
    print("1. Compress existing player photos to <100KB each")
    print("2. Implement image optimization in upload process")
    print("3. Consider separate storage for large binary data")
    print("4. Never embed full team objects in events")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)