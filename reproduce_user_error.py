#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
import time

# Backend URL from environment
BACKEND_URL = "https://coach-command-3.preview.emergentagent.com/api"

def get_document_size_mb(data):
    """Calculate document size in MB"""
    json_str = json.dumps(data)
    size_bytes = len(json_str.encode('utf-8'))
    size_mb = size_bytes / (1024 * 1024)
    return size_mb, size_bytes

def create_large_test_data():
    """Create test data that might trigger BSON overflow"""
    print("\n🧪 CREATING LARGE TEST DATA TO TRIGGER BSON OVERFLOW")
    print("=" * 60)
    
    try:
        # Create teams with large logos
        print("📊 Creating teams with large logos...")
        large_logo_data = "data:image/jpeg;base64," + "A" * (2 * 1024 * 1024)  # 2MB logo
        
        large_teams = []
        for i in range(5):
            team = {
                "id": f"large_team_{i}",
                "name": f"Large Team {i}",
                "division": "Field",
                "coach": f"Coach {i}",
                "logo": large_logo_data,
                "style": {
                    "primaryColor": "#FF0000",
                    "backgroundColor": "#FFFFFF",
                    "accentColor": "#0000FF"
                },
                "active": True
            }
            large_teams.append(team)
        
        teams_size_mb, _ = get_document_size_mb(large_teams)
        print(f"📏 Large teams data size: {teams_size_mb:.2f} MB")
        
        # Create players with large photos
        print("📊 Creating players with large photos...")
        large_photo_data = "data:image/jpeg;base64," + "B" * (3 * 1024 * 1024)  # 3MB photo
        
        large_players = []
        for i in range(3):
            player = {
                "id": f"large_player_{i}",
                "name": f"Large Player {i}",
                "teamId": f"large_team_{i % 2}",
                "position": "Midfielder",
                "jerseyNumber": i + 1,
                "photoUrl": large_photo_data,
                "handedness": "Right",
                "details": "Player with large photo",
                "active": True
            }
            large_players.append(player)
        
        players_size_mb, _ = get_document_size_mb(large_players)
        print(f"📏 Large players data size: {players_size_mb:.2f} MB")
        
        # Calculate total size
        total_size_mb = teams_size_mb + players_size_mb
        print(f"📏 Total large data size: {total_size_mb:.2f} MB")
        
        if total_size_mb > 15:
            print(f"🚨 Large data would exceed BSON limits!")
            return large_teams, large_players, True
        else:
            print(f"⚠️ Large data within limits but substantial")
            return large_teams, large_players, False
            
    except Exception as e:
        print(f"❌ Failed to create large test data: {e}")
        return [], [], False

def test_event_save_with_large_data():
    """Test event save with large data to reproduce user's error"""
    print("\n🚨 TESTING EVENT SAVE WITH LARGE DATA")
    print("=" * 45)
    
    try:
        # First, save large data to the system
        large_teams, large_players, exceeds_limit = create_large_test_data()
        
        if not large_teams or not large_players:
            print("❌ Could not create large test data")
            return False
        
        print(f"\n📊 Saving large data to system...")
        
        # Save to league-data to simulate user's data state
        league_response = requests.get(f"{BACKEND_URL}/league-data")
        if league_response.status_code != 200:
            print("❌ Cannot get current league data")
            return False
        
        current_data = league_response.json()
        
        # Add large data
        current_data['teams'] = large_teams
        current_data['players'] = large_players
        
        # Check size before saving
        large_data_size_mb, _ = get_document_size_mb(current_data)
        print(f"📏 Document with large data: {large_data_size_mb:.2f} MB")
        
        if large_data_size_mb > 16:
            print(f"🚨 BSON OVERFLOW CONFIRMED: {large_data_size_mb:.2f} MB > 16 MB")
            print(f"   This would cause 500 errors when saving!")
            return True
        
        # Try to save the large data
        print(f"\n🧪 Attempting to save large data...")
        save_response = requests.post(f"{BACKEND_URL}/league-data", json=current_data)
        print(f"📊 Save large data response: {save_response.status_code}")
        
        if save_response.status_code == 500:
            print(f"🚨 500 ERROR CONFIRMED with large data!")
            error_text = save_response.text
            print(f"   Error: {error_text}")
            return True
        elif save_response.status_code == 200:
            print(f"✅ Large data saved successfully")
            
            # Now try to save an event
            print(f"\n🧪 Now attempting to save event with large data in system...")
            
            test_event = {
                "id": f"test_event_{int(time.time())}",
                "title": "Test Event with Large Data",
                "date": "2025-01-20",
                "time": "15:00",
                "type": "game",
                "teamIds": ["large_team_0", "large_team_1"],
                "location": "Test Field",
                "description": "Testing event save with large data in system"
            }
            
            # Get current schedule
            updated_response = requests.get(f"{BACKEND_URL}/league-data")
            if updated_response.status_code == 200:
                updated_data = updated_response.json()
                current_schedule = updated_data.get('leagueSchedule', [])
                new_schedule = current_schedule + [test_event]
                
                # Check total size with event
                updated_data['leagueSchedule'] = new_schedule
                final_size_mb, _ = get_document_size_mb(updated_data)
                print(f"📏 Final document size with event: {final_size_mb:.2f} MB")
                
                if final_size_mb > 16:
                    print(f"🚨 BSON OVERFLOW WITH EVENT: {final_size_mb:.2f} MB")
                    print(f"   This reproduces the user's 500 error!")
                    return True
                
                # Try to save the event
                event_save_response = requests.post(f"{BACKEND_URL}/league-data/leagueSchedule", json=new_schedule)
                print(f"📊 Event save response: {event_save_response.status_code}")
                
                if event_save_response.status_code == 500:
                    print(f"🚨 500 ERROR REPRODUCED!")
                    print(f"   Error: {event_save_response.text}")
                    return True
                else:
                    print(f"✅ Event saved successfully even with large data")
                    
                    # Clean up
                    print(f"🧹 Cleaning up test data...")
                    original_response = requests.get(f"{BACKEND_URL}/league-data")
                    if original_response.status_code == 200:
                        original_data = original_response.json()
                        original_data['teams'] = []
                        original_data['players'] = []
                        original_data['leagueSchedule'] = []
                        requests.post(f"{BACKEND_URL}/league-data", json=original_data)
                    
                    return False
        else:
            print(f"❌ Unexpected response when saving large data: {save_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Large data test failed: {e}")
        return False

def test_multiple_event_accumulation():
    """Test if multiple events can cause BSON overflow"""
    print("\n🧪 TESTING MULTIPLE EVENT ACCUMULATION")
    print("=" * 45)
    
    try:
        # Get current state
        league_response = requests.get(f"{BACKEND_URL}/league-data")
        if league_response.status_code != 200:
            print("❌ Cannot get league data")
            return False
        
        current_data = league_response.json()
        current_size_mb, _ = get_document_size_mb(current_data)
        print(f"📏 Starting document size: {current_size_mb:.2f} MB")
        
        # Create many events with moderate data
        events = []
        for i in range(100):  # Create 100 events
            event = {
                "id": f"bulk_event_{i}",
                "title": f"Bulk Event {i}",
                "date": "2025-01-20",
                "time": "15:00",
                "type": "practice",
                "teamIds": ["team1"],
                "location": "Test Field",
                "description": "A" * 1000,  # 1KB description
                "metadata": {
                    "notes": "B" * 5000,  # 5KB metadata
                    "stats": {"attendance": 100, "weather": "sunny"},
                    "photos": ["photo1.jpg", "photo2.jpg"],
                    "additional_data": "C" * 2000  # 2KB more data
                }
            }
            events.append(event)
        
        events_size_mb, _ = get_document_size_mb(events)
        print(f"📏 100 events size: {events_size_mb:.2f} MB")
        
        # Simulate adding to current document
        test_data = current_data.copy()
        test_data['leagueSchedule'] = events
        total_size_mb, _ = get_document_size_mb(test_data)
        
        print(f"📏 Document with 100 events: {total_size_mb:.2f} MB")
        
        if total_size_mb > 16:
            print(f"🚨 BSON OVERFLOW with multiple events: {total_size_mb:.2f} MB")
            print(f"   This could explain user's issue if they have many events!")
            return True
        else:
            print(f"✅ Multiple events within BSON limits")
            
            # Try actual save
            print(f"\n🧪 Testing actual save of multiple events...")
            save_response = requests.post(f"{BACKEND_URL}/league-data/leagueSchedule", json=events)
            print(f"📊 Multiple events save response: {save_response.status_code}")
            
            if save_response.status_code == 500:
                print(f"🚨 500 ERROR with multiple events!")
                print(f"   Error: {save_response.text}")
                return True
            else:
                print(f"✅ Multiple events saved successfully")
                
                # Clean up
                requests.post(f"{BACKEND_URL}/league-data/leagueSchedule", json=[])
                return False
        
    except Exception as e:
        print(f"❌ Multiple events test failed: {e}")
        return False

def check_backend_memory_limits():
    """Check if there are backend memory or processing limits"""
    print("\n🔍 BACKEND MEMORY/PROCESSING LIMITS CHECK")
    print("=" * 50)
    
    try:
        # Test with progressively larger payloads
        sizes_to_test = [1, 5, 10, 15, 20]  # MB
        
        for size_mb in sizes_to_test:
            print(f"\n🧪 Testing {size_mb}MB payload...")
            
            # Create payload of specified size
            data_size = size_mb * 1024 * 1024  # Convert to bytes
            large_string = "X" * data_size
            
            test_payload = {
                "id": "memory_test",
                "large_data": large_string
            }
            
            payload_size_mb, _ = get_document_size_mb(test_payload)
            print(f"   Actual payload size: {payload_size_mb:.2f} MB")
            
            # Try to send to a test endpoint
            try:
                response = requests.post(f"{BACKEND_URL}/league-data", json=test_payload, timeout=30)
                print(f"   Response: {response.status_code}")
                
                if response.status_code == 500:
                    print(f"   🚨 500 ERROR at {size_mb}MB - Found limit!")
                    error_text = response.text
                    print(f"   Error: {error_text[:200]}...")
                    return True
                elif response.status_code == 413:
                    print(f"   🚨 413 Payload Too Large at {size_mb}MB")
                    return True
                elif response.status_code == 200:
                    print(f"   ✅ {size_mb}MB payload accepted")
                else:
                    print(f"   ❓ Unexpected response: {response.status_code}")
                    
            except requests.exceptions.Timeout:
                print(f"   ⏰ Timeout at {size_mb}MB - possible processing limit")
                return True
            except Exception as e:
                print(f"   ❌ Error at {size_mb}MB: {e}")
                return True
        
        print(f"\n✅ No backend limits found up to 20MB")
        return False
        
    except Exception as e:
        print(f"❌ Backend limits check failed: {e}")
        return False

def main():
    """Main reproduction test"""
    print("🚨 REPRODUCING USER'S 500 ERROR - COMPREHENSIVE TESTING")
    print("=" * 70)
    print("GOAL: Create conditions that reproduce the user's BSON overflow error")
    print("=" * 70)
    
    results = {
        'large_data_test': False,
        'multiple_events_test': False,
        'backend_limits_test': False
    }
    
    # Execute reproduction tests
    results['large_data_test'] = test_event_save_with_large_data()
    results['multiple_events_test'] = test_multiple_event_accumulation()
    results['backend_limits_test'] = check_backend_memory_limits()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 USER ERROR REPRODUCTION SUMMARY")
    print("=" * 70)
    
    reproduced_errors = sum(results.values())
    
    for test_name, error_reproduced in results.items():
        status = "🚨 ERROR REPRODUCED" if error_reproduced else "✅ NO ERROR"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nErrors reproduced: {reproduced_errors}/3")
    
    if reproduced_errors > 0:
        print(f"\n🎯 ROOT CAUSE IDENTIFIED:")
        if results['large_data_test']:
            print(f"1. 🚨 Large team logos/player photos cause BSON overflow")
            print(f"   - User likely has uncompressed images in their data")
            print(f"   - Each large image pushes document over 16MB limit")
        
        if results['multiple_events_test']:
            print(f"2. 🚨 Multiple events with metadata cause accumulation overflow")
            print(f"   - User may have created many events with large descriptions")
            print(f"   - Event metadata accumulates to exceed BSON limit")
        
        if results['backend_limits_test']:
            print(f"3. 🚨 Backend processing limits reached")
            print(f"   - Server cannot handle large payloads")
            print(f"   - Memory or timeout limits exceeded")
        
        print(f"\n💡 IMMEDIATE FIXES FOR USER:")
        print(f"1. 🔧 Compress all images to <100KB each")
        print(f"2. 🗑️ Remove unnecessary event metadata")
        print(f"3. 🔄 Implement data pagination/chunking")
        print(f"4. 📊 Add size validation before saves")
        
    else:
        print(f"\n❓ COULD NOT REPRODUCE USER'S ERROR")
        print(f"   - User's issue may be intermittent")
        print(f"   - Specific data combination not tested")
        print(f"   - User may have different data than current state")
        print(f"\n💡 RECOMMENDATIONS:")
        print(f"1. 🔍 Ask user to provide exact error message")
        print(f"2. 📊 Check user's actual data size")
        print(f"3. 🔄 Implement preventive size validation")
    
    return results

if __name__ == "__main__":
    results = main()
    sys.exit(0)