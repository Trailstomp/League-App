#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://lacrosse-league-3.preview.emergentagent.com/api"

def get_document_size_mb(data):
    """Calculate document size in MB"""
    json_str = json.dumps(data)
    size_bytes = len(json_str.encode('utf-8'))
    size_mb = size_bytes / (1024 * 1024)
    return size_mb, size_bytes

def test_event_save_with_large_data():
    """Test event save with progressively larger data to find BSON breaking point"""
    print("\n🔍 EVENT SAVE WITH LARGE DATA INVESTIGATION")
    print("=" * 60)
    
    try:
        # Get current document
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            print("❌ Cannot get current document")
            return False
            
        current_data = response.json()
        current_size_mb, _ = get_document_size_mb(current_data)
        print(f"📏 Current document size: {current_size_mb:.2f} MB")
        
        # Test 1: Event with embedded team data
        print(f"\n🧪 Test 1: Event with embedded team data...")
        teams_response = requests.get(f"{BACKEND_URL}/teams")
        if teams_response.status_code == 200:
            all_teams = teams_response.json()
            
            event_with_teams = {
                "id": "test_event_with_teams",
                "title": "Event with Embedded Teams",
                "date": "2025-01-20",
                "time": "15:00",
                "type": "tournament",
                "teamIds": [team.get('id') for team in all_teams[:5]],
                "location": "Test Field",
                "description": "Testing with team data",
                "embeddedTeams": all_teams  # This could cause bloat
            }
            
            event_size_mb, _ = get_document_size_mb(event_with_teams)
            print(f"📏 Event with teams size: {event_size_mb:.2f} MB")
            
            # Simulate adding to document
            simulated_data = current_data.copy()
            simulated_data['leagueSchedule'] = simulated_data.get('leagueSchedule', []) + [event_with_teams]
            simulated_size_mb, _ = get_document_size_mb(simulated_data)
            
            print(f"📏 Simulated document size: {simulated_size_mb:.2f} MB")
            
            if simulated_size_mb > 16:
                print(f"🚨 BSON OVERFLOW: Would exceed 16MB limit by {simulated_size_mb - 16:.2f} MB")
                return False
        
        # Test 2: Event with large photo data
        print(f"\n🧪 Test 2: Event with photo data...")
        
        # Create a large base64 image (simulating uncompressed photo)
        large_image_data = "data:image/jpeg;base64," + "A" * (5 * 1024 * 1024)  # 5MB of data
        
        event_with_photos = {
            "id": "test_event_with_photos",
            "title": "Event with Photos",
            "date": "2025-01-20",
            "time": "15:00",
            "type": "game",
            "teamIds": ["team1", "team2"],
            "location": "Test Field",
            "description": "Testing with photo data",
            "photos": [
                {"url": large_image_data, "caption": "Large photo 1"},
                {"url": large_image_data, "caption": "Large photo 2"}
            ]
        }
        
        event_size_mb, _ = get_document_size_mb(event_with_photos)
        print(f"📏 Event with photos size: {event_size_mb:.2f} MB")
        
        # Simulate adding to document
        simulated_data = current_data.copy()
        simulated_data['leagueSchedule'] = simulated_data.get('leagueSchedule', []) + [event_with_photos]
        simulated_size_mb, _ = get_document_size_mb(simulated_data)
        
        print(f"📏 Simulated document size: {simulated_size_mb:.2f} MB")
        
        if simulated_size_mb > 16:
            print(f"🚨 BSON OVERFLOW DETECTED: Would exceed 16MB limit by {simulated_size_mb - 16:.2f} MB")
            print(f"   This could be the cause of user's 500 errors!")
            return True  # Found the issue
        
        # Test 3: Multiple events with moderate data
        print(f"\n🧪 Test 3: Multiple events accumulation...")
        
        moderate_events = []
        for i in range(20):
            moderate_event = {
                "id": f"moderate_event_{i}",
                "title": f"Event {i}",
                "date": "2025-01-20",
                "time": "15:00",
                "type": "practice",
                "teamIds": ["team1"],
                "location": "Test Field",
                "description": "A" * 10000,  # 10KB description
                "metadata": {"data": "B" * 50000}  # 50KB metadata
            }
            moderate_events.append(moderate_event)
        
        # Simulate adding all events
        simulated_data = current_data.copy()
        simulated_data['leagueSchedule'] = simulated_data.get('leagueSchedule', []) + moderate_events
        simulated_size_mb, _ = get_document_size_mb(simulated_data)
        
        print(f"📏 Document with {len(moderate_events)} events: {simulated_size_mb:.2f} MB")
        
        if simulated_size_mb > 16:
            print(f"🚨 BSON OVERFLOW: Multiple events exceed limit by {simulated_size_mb - 16:.2f} MB")
            return True
        
        return False
        
    except Exception as e:
        print(f"❌ Event save investigation failed: {e}")
        return False

def test_actual_event_save_scenarios():
    """Test actual event save scenarios that might cause 500 errors"""
    print("\n🔍 ACTUAL EVENT SAVE SCENARIOS")
    print("=" * 40)
    
    scenarios = [
        {
            "name": "Minimal Event",
            "data": {
                "id": "minimal_test",
                "title": "Minimal Event",
                "date": "2025-01-20",
                "time": "15:00",
                "type": "practice",
                "teamIds": ["team1"],
                "location": "Test Field"
            }
        },
        {
            "name": "Event with Description",
            "data": {
                "id": "description_test",
                "title": "Event with Description",
                "date": "2025-01-20",
                "time": "15:00",
                "type": "game",
                "teamIds": ["team1", "team2"],
                "location": "Test Field",
                "description": "This is a detailed description of the event. " * 100  # ~5KB
            }
        },
        {
            "name": "Event with Team Data",
            "data": {
                "id": "team_data_test",
                "title": "Event with Team Data",
                "date": "2025-01-20",
                "time": "15:00",
                "type": "tournament",
                "teamIds": ["team1", "team2", "team3"],
                "location": "Test Field",
                "teams": []  # Will be populated with actual team data
            }
        }
    ]
    
    try:
        # Get teams data for scenario 3
        teams_response = requests.get(f"{BACKEND_URL}/teams")
        if teams_response.status_code == 200:
            teams_data = teams_response.json()
            scenarios[2]["data"]["teams"] = teams_data
        
        for scenario in scenarios:
            print(f"\n🧪 Testing: {scenario['name']}")
            
            event_data = scenario["data"]
            event_size_mb, _ = get_document_size_mb(event_data)
            print(f"   Event size: {event_size_mb:.4f} MB")
            
            # Try to save the event
            try:
                save_response = requests.post(f"{BACKEND_URL}/league-data/leagueSchedule", json=[event_data])
                print(f"   Save status: {save_response.status_code}")
                
                if save_response.status_code == 500:
                    print(f"   🚨 500 ERROR DETECTED!")
                    print(f"   Error details: {save_response.text}")
                    
                    # This might be the scenario causing user's issues
                    return False, scenario['name']
                elif save_response.status_code == 200:
                    print(f"   ✅ Save successful")
                    
                    # Clean up
                    cleanup_response = requests.get(f"{BACKEND_URL}/league-data")
                    if cleanup_response.status_code == 200:
                        cleanup_data = cleanup_response.json()
                        cleanup_events = [e for e in cleanup_data.get('leagueSchedule', []) if e.get('id') != event_data['id']]
                        cleanup_data['leagueSchedule'] = cleanup_events
                        requests.post(f"{BACKEND_URL}/league-data/leagueSchedule", json=cleanup_events)
                else:
                    print(f"   ❌ Unexpected status: {save_response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Save failed with exception: {e}")
                return False, scenario['name']
        
        return True, None
        
    except Exception as e:
        print(f"❌ Scenario testing failed: {e}")
        return False, "Exception"

def investigate_backend_logs():
    """Check backend logs for BSON errors"""
    print("\n🔍 BACKEND LOGS INVESTIGATION")
    print("=" * 35)
    
    try:
        # Check supervisor backend logs
        import subprocess
        
        print("📋 Checking backend error logs...")
        result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/backend.err.log'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            logs = result.stdout
            if logs.strip():
                print("🚨 Backend Error Logs:")
                print(logs)
                
                # Look for BSON-related errors
                if 'bson' in logs.lower() or 'document too large' in logs.lower() or '16777216' in logs:
                    print("🚨 BSON-related errors found in logs!")
                    return True
                else:
                    print("ℹ️ No BSON-related errors in recent logs")
            else:
                print("✅ No recent error logs")
        else:
            print("❌ Could not read backend logs")
            
        return False
        
    except Exception as e:
        print(f"❌ Log investigation failed: {e}")
        return False

def test_event_save_with_current_data():
    """Test event save using current production data patterns"""
    print("\n🔍 EVENT SAVE WITH CURRENT DATA PATTERNS")
    print("=" * 50)
    
    try:
        # Get current teams and players to simulate realistic event data
        teams_response = requests.get(f"{BACKEND_URL}/teams")
        players_response = requests.get(f"{BACKEND_URL}/players")
        
        if teams_response.status_code == 200 and players_response.status_code == 200:
            teams = teams_response.json()
            players = players_response.json()
            
            print(f"📊 Current data: {len(teams)} teams, {len(players)} players")
            
            # Create realistic event that might cause issues
            realistic_event = {
                "id": "realistic_test_event",
                "title": "Championship Game",
                "date": "2025-01-20",
                "time": "15:00",
                "type": "game",
                "teamIds": [team.get('id') for team in teams[:2]],
                "location": "Championship Field",
                "description": "Championship game between top teams",
                "teams": teams,  # Embedding full team data
                "players": players,  # Embedding full player data
                "metadata": {
                    "weather": "Sunny",
                    "temperature": "75F",
                    "attendance": 500,
                    "notes": "Special championship event with full team rosters and statistics"
                }
            }
            
            event_size_mb, _ = get_document_size_mb(realistic_event)
            print(f"📏 Realistic event size: {event_size_mb:.2f} MB")
            
            # Get current document size
            league_response = requests.get(f"{BACKEND_URL}/league-data")
            if league_response.status_code == 200:
                current_data = league_response.json()
                current_size_mb, _ = get_document_size_mb(current_data)
                
                # Simulate adding this event
                simulated_data = current_data.copy()
                simulated_data['leagueSchedule'] = simulated_data.get('leagueSchedule', []) + [realistic_event]
                simulated_size_mb, _ = get_document_size_mb(simulated_data)
                
                print(f"📏 Current document: {current_size_mb:.2f} MB")
                print(f"📏 With realistic event: {simulated_size_mb:.2f} MB")
                
                if simulated_size_mb > 16:
                    print(f"🚨 BSON OVERFLOW CONFIRMED!")
                    print(f"   Overflow amount: {simulated_size_mb - 16:.2f} MB")
                    print(f"   This explains the user's 500 errors!")
                    
                    # Identify the culprit
                    if event_size_mb > 10:
                        print(f"🎯 ROOT CAUSE: Event with embedded team/player data too large")
                        print(f"   Event alone: {event_size_mb:.2f} MB")
                        print(f"   Teams data in event: {get_document_size_mb(teams)[0]:.2f} MB")
                        print(f"   Players data in event: {get_document_size_mb(players)[0]:.2f} MB")
                    
                    return True
                else:
                    print(f"✅ Would not exceed BSON limit")
                    return False
            
        return False
        
    except Exception as e:
        print(f"❌ Current data pattern test failed: {e}")
        return False

def main():
    """Main event save investigation"""
    print("🚨 EVENT SAVE BSON INVESTIGATION - FINDING ROOT CAUSE OF 500 ERRORS")
    print("=" * 80)
    
    results = {
        'large_data_test': False,
        'scenario_test': False,
        'log_investigation': False,
        'current_data_test': False
    }
    
    # Execute investigations
    results['large_data_test'] = test_event_save_with_large_data()
    success, failed_scenario = test_actual_event_save_scenarios()
    results['scenario_test'] = success
    results['log_investigation'] = investigate_backend_logs()
    results['current_data_test'] = test_event_save_with_current_data()
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 EVENT SAVE INVESTIGATION SUMMARY")
    print("=" * 80)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ ISSUE DETECTED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    if not success and failed_scenario:
        print(f"\n🚨 CRITICAL: Event save failed at scenario: {failed_scenario}")
    
    # Provide recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    if any(not result for result in results.values()):
        print(f"1. 🚨 IMMEDIATE: Check if events are embedding full team/player data")
        print(f"2. 🔧 FIX: Use team/player IDs only, not full objects in events")
        print(f"3. 🛡️ PREVENT: Implement size validation before event save")
        print(f"4. 🔍 MONITOR: Add logging for document size during saves")
    else:
        print(f"✅ Event save process appears to be working correctly")
        print(f"   Issue may be intermittent or related to specific data patterns")
    
    return results

if __name__ == "__main__":
    results = main()
    sys.exit(0)