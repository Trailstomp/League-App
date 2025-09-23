#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://teamdrive-gallery.preview.emergentagent.com/api"

def investigate_event_types():
    """Investigate actual event types in database vs ticker filter configuration"""
    print("🎯 TICKER FILTER BUG INVESTIGATION")
    print("=" * 60)
    print("ISSUE: Unchecking 'Other' filter causes games and tournaments to disappear")
    print("HYPOTHESIS: Event type mismatch between database and filter configuration")
    print("=" * 60)
    
    try:
        # Get league data to examine events
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 GET /api/league-data Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            events = data.get('leagueSchedule', [])
            
            print(f"\n📈 EVENTS IN DATABASE: {len(events)} events found")
            print("=" * 40)
            
            # Analyze each event's type
            event_types_found = {}
            
            for i, event in enumerate(events, 1):
                event_type = event.get('type', 'MISSING_TYPE')
                event_title = event.get('title', 'Unknown Event')
                event_date = event.get('date', 'Unknown Date')
                
                print(f"🎪 EVENT {i}: {event_title}")
                print(f"   📅 Date: {event_date}")
                print(f"   🏷️  Type: '{event_type}'")
                print(f"   🏟️  Location: {event.get('location', 'Unknown')}")
                print(f"   👥 Teams: {event.get('teamIds', [])}")
                print()
                
                # Count event types
                if event_type in event_types_found:
                    event_types_found[event_type] += 1
                else:
                    event_types_found[event_type] = 1
            
            print("📊 EVENT TYPE ANALYSIS:")
            print("=" * 30)
            for event_type, count in event_types_found.items():
                print(f"   '{event_type}': {count} events")
            
            print("\n🎛️  TICKER FILTER CONFIGURATION (Expected):")
            print("=" * 45)
            expected_filters = ['games', 'tournaments', 'practices', 'meetings', 'social', 'other']
            for filter_type in expected_filters:
                print(f"   '{filter_type}': Filter available")
            
            print("\n🔍 MISMATCH ANALYSIS:")
            print("=" * 25)
            
            # Check for mismatches
            mismatches_found = []
            for actual_type in event_types_found.keys():
                if actual_type not in expected_filters:
                    mismatches_found.append(actual_type)
                    print(f"❌ MISMATCH: Event type '{actual_type}' not in filter configuration")
                    print(f"   This would fall back to 'other' filter")
            
            if not mismatches_found:
                print("✅ All event types match filter configuration")
            else:
                print(f"\n🚨 CRITICAL ISSUE IDENTIFIED:")
                print(f"   {len(mismatches_found)} event type(s) don't match filters")
                print(f"   These events use 'other' filter fallback")
                print(f"   When 'other' is unchecked, these events disappear!")
            
            print("\n🔧 FALLBACK LOGIC ANALYSIS:")
            print("=" * 30)
            print("Current logic: eventFilters[eventType] || eventFilters.other")
            print("Problem: If eventType doesn't match AND 'other' is false,")
            print("         valid events get filtered out incorrectly")
            
            return True, event_types_found, expected_filters, mismatches_found
            
        else:
            print(f"❌ Failed to fetch league data: {response.status_code}")
            return False, {}, [], []
            
    except Exception as e:
        print(f"❌ Investigation failed: {e}")
        return False, {}, [], []

def test_specific_event_examples():
    """Test the 3 events mentioned in the review request"""
    print("\n🎯 TESTING SPECIFIC EVENT EXAMPLES")
    print("=" * 40)
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code == 200:
            data = response.json()
            events = data.get('leagueSchedule', [])
            
            print(f"Examining {len(events)} events for type patterns...")
            
            # Look for games and tournaments specifically
            games_found = []
            tournaments_found = []
            other_types = []
            
            for event in events:
                event_type = event.get('type', '').lower()
                event_title = event.get('title', 'Unknown')
                
                if 'game' in event_type:
                    games_found.append((event_title, event_type))
                elif 'tournament' in event_type:
                    tournaments_found.append((event_title, event_type))
                else:
                    other_types.append((event_title, event_type))
            
            print(f"\n🏈 GAMES FOUND: {len(games_found)}")
            for title, type_val in games_found:
                print(f"   '{title}' -> type: '{type_val}'")
            
            print(f"\n🏆 TOURNAMENTS FOUND: {len(tournaments_found)}")
            for title, type_val in tournaments_found:
                print(f"   '{title}' -> type: '{type_val}'")
            
            print(f"\n📋 OTHER TYPES: {len(other_types)}")
            for title, type_val in other_types:
                print(f"   '{title}' -> type: '{type_val}'")
            
            # Check for exact matches vs expected filter names
            print(f"\n🔍 EXACT MATCH ANALYSIS:")
            print("Expected filter: 'games' vs actual types containing 'game'")
            print("Expected filter: 'tournaments' vs actual types containing 'tournament'")
            
            return True
        else:
            print(f"❌ Failed to fetch events: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Event examples test failed: {e}")
        return False

def simulate_filter_logic():
    """Simulate the ticker filter logic to identify the bug"""
    print("\n🧪 SIMULATING TICKER FILTER LOGIC")
    print("=" * 40)
    
    try:
        # Get events
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code == 200:
            data = response.json()
            events = data.get('leagueSchedule', [])
            
            # Simulate filter configuration
            print("🎛️  SIMULATING FILTER STATES:")
            
            # Scenario 1: All filters enabled (including 'other')
            filters_all_enabled = {
                'games': True,
                'tournaments': True, 
                'practices': True,
                'meetings': True,
                'social': True,
                'other': True
            }
            
            # Scenario 2: 'Other' disabled (the problematic scenario)
            filters_other_disabled = {
                'games': True,
                'tournaments': True,
                'practices': True, 
                'meetings': True,
                'social': True,
                'other': False
            }
            
            print("\nSCENARIO 1: All filters enabled (including 'other')")
            print("-" * 50)
            visible_events_1 = []
            for event in events:
                event_type = event.get('type', '')
                event_title = event.get('title', 'Unknown')
                
                # Simulate: eventFilters[eventType] || eventFilters.other
                filter_result = filters_all_enabled.get(event_type, filters_all_enabled['other'])
                
                if filter_result:
                    visible_events_1.append(event_title)
                    print(f"✅ VISIBLE: '{event_title}' (type: '{event_type}')")
                else:
                    print(f"❌ HIDDEN: '{event_title}' (type: '{event_type}')")
            
            print(f"\nVisible events: {len(visible_events_1)}")
            
            print("\nSCENARIO 2: 'Other' filter disabled (PROBLEMATIC)")
            print("-" * 50)
            visible_events_2 = []
            for event in events:
                event_type = event.get('type', '')
                event_title = event.get('title', 'Unknown')
                
                # Simulate: eventFilters[eventType] || eventFilters.other
                filter_result = filters_other_disabled.get(event_type, filters_other_disabled['other'])
                
                if filter_result:
                    visible_events_2.append(event_title)
                    print(f"✅ VISIBLE: '{event_title}' (type: '{event_type}')")
                else:
                    print(f"❌ HIDDEN: '{event_title}' (type: '{event_type}') <- BUG!")
            
            print(f"\nVisible events: {len(visible_events_2)}")
            
            # Compare scenarios
            hidden_events = set(visible_events_1) - set(visible_events_2)
            
            print(f"\n🚨 BUG IMPACT ANALYSIS:")
            print("=" * 25)
            print(f"Events visible with 'other' enabled: {len(visible_events_1)}")
            print(f"Events visible with 'other' disabled: {len(visible_events_2)}")
            print(f"Events that disappear: {len(hidden_events)}")
            
            if hidden_events:
                print(f"\n❌ EVENTS THAT DISAPPEAR WHEN 'OTHER' IS UNCHECKED:")
                for event_title in hidden_events:
                    print(f"   - {event_title}")
            
            return True
        else:
            print(f"❌ Failed to fetch events: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Filter logic simulation failed: {e}")
        return False

def recommend_fixes():
    """Recommend fixes for the ticker filter bug"""
    print("\n💡 RECOMMENDED FIXES")
    print("=" * 25)
    
    print("1. 🔧 EVENT TYPE STANDARDIZATION:")
    print("   - Ensure event types in database match filter keys exactly")
    print("   - 'game' events should use type 'games' (plural)")
    print("   - 'tournament' events should use type 'tournaments' (plural)")
    
    print("\n2. 🔧 FALLBACK LOGIC IMPROVEMENT:")
    print("   - Current: eventFilters[eventType] || eventFilters.other")
    print("   - Better: eventFilters[eventType] !== false")
    print("   - Or: Add default true for unknown types")
    
    print("\n3. 🔧 DATA MIGRATION:")
    print("   - Update existing events to use correct type values")
    print("   - Add validation to prevent future mismatches")
    
    print("\n4. 🔧 FILTER CONFIGURATION:")
    print("   - Add validation that event types match available filters")
    print("   - Consider dynamic filter generation based on actual event types")

def main():
    """Main investigation execution"""
    print("🎯 TICKER FILTER BUG - ROOT CAUSE INVESTIGATION")
    print("=" * 60)
    
    # Execute investigation steps
    success1, event_types, expected_filters, mismatches = investigate_event_types()
    success2 = test_specific_event_examples()
    success3 = simulate_filter_logic()
    
    # Provide recommendations
    recommend_fixes()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 INVESTIGATION SUMMARY")
    print("=" * 60)
    
    if success1 and success2 and success3:
        print("✅ Investigation completed successfully")
        print(f"🔍 Event types found: {list(event_types.keys()) if success1 else 'Unknown'}")
        print(f"🎛️  Expected filters: {expected_filters if success1 else 'Unknown'}")
        print(f"❌ Mismatches detected: {len(mismatches) if success1 else 'Unknown'}")
        
        if mismatches:
            print(f"\n🚨 ROOT CAUSE CONFIRMED:")
            print(f"   Event types {mismatches} don't match filter configuration")
            print(f"   These events fall back to 'other' filter")
            print(f"   When 'other' is unchecked, valid events disappear")
        else:
            print(f"\n🤔 NO OBVIOUS MISMATCHES FOUND:")
            print(f"   Issue may be in frontend filter logic or event processing")
    else:
        print("❌ Investigation encountered errors")
    
    return success1 and success2 and success3

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)