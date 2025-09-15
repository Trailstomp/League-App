#!/usr/bin/env python3
"""
DATABASE INSPECTION FOR USER - SHOW PRODUCTION EVENT STORAGE

This script provides comprehensive database inspection specifically for event storage issues.
Shows exactly what's stored in the production database regarding events.
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://lacrosse-mgr.preview.emergentagent.com/api"

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}")

def print_subsection(title):
    """Print a formatted subsection header"""
    print(f"\n{'-'*60}")
    print(f"  {title}")
    print(f"{'-'*60}")

def inspect_league_data():
    """Get and analyze complete league data from database"""
    print_section("COMPLETE DATABASE STATE INSPECTION")
    
    try:
        print(f"🔍 Fetching complete league data from: {BACKEND_URL}/league-data")
        response = requests.get(f"{BACKEND_URL}/league-data", timeout=30)
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            
            print_subsection("COMPLETE RAW DATABASE RESPONSE")
            print(json.dumps(data, indent=2, default=str))
            
            print_subsection("DATABASE DOCUMENT STRUCTURE ANALYSIS")
            print(f"📋 Document ID: {data.get('id', 'NOT FOUND')}")
            print(f"📋 Last Updated: {data.get('lastUpdated', 'NOT FOUND')}")
            
            # Analyze all top-level fields
            print(f"\n🔍 TOP-LEVEL FIELDS IN DATABASE:")
            for key, value in data.items():
                if isinstance(value, list):
                    print(f"  • {key}: Array with {len(value)} items")
                elif isinstance(value, dict):
                    print(f"  • {key}: Object with {len(value)} properties")
                else:
                    print(f"  • {key}: {type(value).__name__} = {value}")
            
            print_subsection("EVENT STORAGE ANALYSIS - LEAGUE SCHEDULE")
            league_schedule = data.get('leagueSchedule', [])
            print(f"📅 leagueSchedule field type: {type(league_schedule)}")
            print(f"📅 leagueSchedule length: {len(league_schedule)}")
            
            if league_schedule:
                print(f"\n🎯 FOUND {len(league_schedule)} EVENTS IN DATABASE:")
                for i, event in enumerate(league_schedule, 1):
                    print(f"\n  EVENT #{i}:")
                    print(f"    Raw Event Data: {json.dumps(event, indent=6, default=str)}")
                    
                    # Analyze event structure
                    print(f"    📋 Event Fields Analysis:")
                    for field, value in event.items():
                        print(f"      • {field}: {type(value).__name__} = {value}")
            else:
                print("❌ NO EVENTS FOUND IN leagueSchedule ARRAY")
            
            print_subsection("OTHER EVENT-RELATED FIELDS ANALYSIS")
            
            # Check gameTickerData
            game_ticker = data.get('gameTickerData', [])
            print(f"🎫 gameTickerData field type: {type(game_ticker)}")
            print(f"🎫 gameTickerData length: {len(game_ticker)}")
            if game_ticker:
                print(f"🎫 gameTickerData contents: {json.dumps(game_ticker, indent=2, default=str)}")
            else:
                print("🎫 gameTickerData is empty")
            
            # Check teams data
            teams = data.get('teams', [])
            print(f"\n👥 teams field type: {type(teams)}")
            print(f"👥 teams length: {len(teams)}")
            if teams:
                print(f"👥 Available teams for events:")
                for team in teams:
                    team_id = team.get('id', 'NO_ID')
                    team_name = team.get('name', 'NO_NAME')
                    print(f"    • {team_id}: {team_name}")
            
            print_subsection("DATABASE INTEGRITY VERIFICATION")
            
            # Verify main_league document exists
            if data.get('id') == 'main_league':
                print("✅ CONFIRMED: 'main_league' document exists with correct ID")
            else:
                print(f"❌ WARNING: Document ID is '{data.get('id')}', expected 'main_league'")
            
            # Verify leagueSchedule is proper array
            if isinstance(league_schedule, list):
                print("✅ CONFIRMED: leagueSchedule is properly formatted as array")
            else:
                print(f"❌ ERROR: leagueSchedule is {type(league_schedule)}, expected list/array")
            
            # Check for required event fields in each event
            if league_schedule:
                print(f"\n🔍 EVENT FIELD VALIDATION:")
                required_fields = ['id', 'title', 'date', 'time', 'type']
                for i, event in enumerate(league_schedule, 1):
                    print(f"  Event #{i} field check:")
                    for field in required_fields:
                        if field in event:
                            print(f"    ✅ {field}: {event[field]}")
                        else:
                            print(f"    ❌ MISSING {field}")
            
            return True
            
        else:
            print(f"❌ ERROR: Failed to fetch league data")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ EXCEPTION: Error inspecting league data: {e}")
        return False

def inspect_individual_collections():
    """Check individual collections for comparison"""
    print_section("INDIVIDUAL COLLECTIONS INSPECTION")
    
    # Check teams collection
    try:
        print_subsection("TEAMS COLLECTION")
        response = requests.get(f"{BACKEND_URL}/teams", timeout=30)
        if response.status_code == 200:
            teams = response.json()
            print(f"📊 Teams collection has {len(teams)} teams")
            for team in teams:
                print(f"  • {team.get('id', 'NO_ID')}: {team.get('name', 'NO_NAME')}")
        else:
            print(f"❌ Failed to fetch teams: {response.status_code}")
    except Exception as e:
        print(f"❌ Error fetching teams: {e}")
    
    # Check players collection
    try:
        print_subsection("PLAYERS COLLECTION")
        response = requests.get(f"{BACKEND_URL}/players", timeout=30)
        if response.status_code == 200:
            players = response.json()
            print(f"📊 Players collection has {len(players)} players")
            for player in players:
                print(f"  • {player.get('id', 'NO_ID')}: {player.get('name', 'NO_NAME')} (Team: {player.get('teamId', 'NO_TEAM')})")
        else:
            print(f"❌ Failed to fetch players: {response.status_code}")
    except Exception as e:
        print(f"❌ Error fetching players: {e}")

def test_event_persistence_endpoints():
    """Test event-specific endpoints"""
    print_section("EVENT PERSISTENCE ENDPOINTS TESTING")
    
    try:
        print_subsection("LEAGUE SCHEDULE ENDPOINT TEST")
        
        # Test creating a diagnostic event
        test_event = {
            "id": f"diagnostic_event_{int(datetime.now().timestamp())}",
            "title": "Database Diagnostic Event",
            "date": "2025-01-20",
            "time": "15:00",
            "type": "diagnostic",
            "location": "Database Inspection",
            "teamIds": [],
            "description": "Event created for database inspection purposes"
        }
        
        print(f"🧪 Creating diagnostic event: {test_event['title']}")
        
        # First get current events
        get_response = requests.get(f"{BACKEND_URL}/league-data", timeout=30)
        if get_response.status_code == 200:
            current_data = get_response.json()
            current_events = current_data.get('leagueSchedule', [])
            print(f"📊 Current events in database: {len(current_events)}")
            
            # Add diagnostic event
            updated_events = current_events + [test_event]
            
            # Save updated events
            post_response = requests.post(
                f"{BACKEND_URL}/league-data/leagueSchedule",
                json=updated_events,
                timeout=30
            )
            
            if post_response.status_code == 200:
                print(f"✅ Diagnostic event saved successfully")
                
                # Verify it was saved
                verify_response = requests.get(f"{BACKEND_URL}/league-data", timeout=30)
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    verify_events = verify_data.get('leagueSchedule', [])
                    
                    print(f"📊 Events after save: {len(verify_events)}")
                    
                    # Find our diagnostic event
                    diagnostic_found = False
                    for event in verify_events:
                        if event.get('id') == test_event['id']:
                            diagnostic_found = True
                            print(f"✅ Diagnostic event found in database:")
                            print(f"    {json.dumps(event, indent=4, default=str)}")
                            break
                    
                    if not diagnostic_found:
                        print(f"❌ Diagnostic event NOT found after save")
                        
                else:
                    print(f"❌ Failed to verify diagnostic event save")
            else:
                print(f"❌ Failed to save diagnostic event: {post_response.status_code}")
                print(f"Response: {post_response.text}")
        else:
            print(f"❌ Failed to get current league data")
            
    except Exception as e:
        print(f"❌ Error testing event persistence: {e}")

def main():
    """Main inspection function"""
    print_section("DATABASE INSPECTION FOR USER - EVENT STORAGE ANALYSIS")
    print(f"🕐 Inspection Time: {datetime.now().isoformat()}")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    
    # 1. Complete database state inspection
    success = inspect_league_data()
    
    # 2. Individual collections for comparison
    inspect_individual_collections()
    
    # 3. Test event persistence
    test_event_persistence_endpoints()
    
    print_section("INSPECTION SUMMARY")
    if success:
        print("✅ Database inspection completed successfully")
        print("📋 Complete database state shown above")
        print("🎯 Focus on 'leagueSchedule' field for event storage")
        print("📊 All event objects displayed with complete field details")
    else:
        print("❌ Database inspection encountered errors")
        print("🔍 Check backend connectivity and API endpoints")
    
    print(f"\n🕐 Inspection completed at: {datetime.now().isoformat()}")

if __name__ == "__main__":
    main()