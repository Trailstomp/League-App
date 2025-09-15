#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://lacrosse-mgr.preview.emergentagent.com/api"

def test_ticker_filter_bug():
    """Comprehensive test for the ticker filter bug - event type mismatch issue"""
    print("🚨 URGENT: TICKER FILTER BUG - EVENT TYPE MISMATCH")
    print("=" * 60)
    print("USER REPORT: Unchecking 'Other' filter causes games and tournaments to disappear")
    print("=" * 60)
    
    try:
        # Get current events from database
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 GET /api/league-data Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch league data: {response.status_code}")
            return False
            
        data = response.json()
        events = data.get('leagueSchedule', [])
        
        print(f"\n📈 CURRENT DATABASE STATE:")
        print(f"   Total events in database: {len(events)}")
        
        # Analyze actual event types in database
        print(f"\n🔍 ACTUAL EVENT TYPES IN DATABASE:")
        print("=" * 40)
        
        event_types_found = {}
        for i, event in enumerate(events, 1):
            event_type = event.get('type', 'MISSING_TYPE')
            event_title = event.get('title', 'Unknown Event')
            
            print(f"   Event {i}: '{event_title}' -> type: '{event_type}'")
            
            if event_type in event_types_found:
                event_types_found[event_type] += 1
            else:
                event_types_found[event_type] = 1
        
        print(f"\n📊 EVENT TYPE SUMMARY:")
        for event_type, count in event_types_found.items():
            print(f"   '{event_type}': {count} events")
        
        # Check filter configuration vs reality
        print(f"\n🎛️  TICKER FILTER CONFIGURATION:")
        print("=" * 35)
        expected_filters = {
            'games': 'Games & Matches',
            'tournaments': 'Tournaments', 
            'practices': 'Practices',
            'meetings': 'Team Meetings',
            'social': 'Social Events',
            'other': 'Other Events'
        }
        
        for filter_key, filter_label in expected_filters.items():
            print(f"   '{filter_key}': {filter_label}")
        
        # Identify mismatches
        print(f"\n🚨 CRITICAL MISMATCH ANALYSIS:")
        print("=" * 35)
        
        mismatches = []
        for actual_type in event_types_found.keys():
            if actual_type not in expected_filters.keys():
                mismatches.append(actual_type)
                print(f"   ❌ MISMATCH: '{actual_type}' not in filter configuration")
                print(f"      This falls back to 'other' filter!")
        
        if not mismatches:
            print("   ✅ All event types match filter configuration")
        
        # Simulate the problematic filtering logic
        print(f"\n🧪 SIMULATING FILTER LOGIC BUG:")
        print("=" * 35)
        
        print("Current logic: eventFilters[eventType] || eventFilters.other")
        print("Problem: When eventType doesn't match AND 'other' is false")
        print("         -> Valid events get filtered out!")
        
        # Test scenarios
        print(f"\nSCENARIO 1: All filters enabled (including 'other')")
        print("-" * 50)
        
        filters_enabled = {filter_key: True for filter_key in expected_filters.keys()}
        visible_with_other = []
        
        for event in events:
            event_type = event.get('type', '')
            event_title = event.get('title', 'Unknown')
            
            # Simulate: eventFilters[eventType] || eventFilters.other
            type_filter = filters_enabled.get(event_type, False)
            other_filter = filters_enabled.get('other', False)
            is_visible = type_filter or other_filter
            
            if is_visible:
                visible_with_other.append(event_title)
                print(f"   ✅ VISIBLE: '{event_title}' (type: '{event_type}')")
            else:
                print(f"   ❌ HIDDEN: '{event_title}' (type: '{event_type}')")
        
        print(f"\nSCENARIO 2: 'Other' filter disabled (USER'S ISSUE)")
        print("-" * 50)
        
        filters_other_disabled = {filter_key: True for filter_key in expected_filters.keys()}
        filters_other_disabled['other'] = False  # This is the user's scenario
        
        visible_without_other = []
        
        for event in events:
            event_type = event.get('type', '')
            event_title = event.get('title', 'Unknown')
            
            # Simulate: eventFilters[eventType] || eventFilters.other
            type_filter = filters_other_disabled.get(event_type, False)
            other_filter = filters_other_disabled.get('other', False)
            is_visible = type_filter or other_filter
            
            if is_visible:
                visible_without_other.append(event_title)
                print(f"   ✅ VISIBLE: '{event_title}' (type: '{event_type}')")
            else:
                print(f"   ❌ HIDDEN: '{event_title}' (type: '{event_type}') <- BUG!")
        
        # Calculate impact
        disappeared_events = set(visible_with_other) - set(visible_without_other)
        
        print(f"\n🚨 BUG IMPACT ASSESSMENT:")
        print("=" * 25)
        print(f"   Events visible with 'other' enabled: {len(visible_with_other)}")
        print(f"   Events visible with 'other' disabled: {len(visible_without_other)}")
        print(f"   Events that disappear: {len(disappeared_events)}")
        
        if disappeared_events:
            print(f"\n❌ EVENTS THAT DISAPPEAR (USER'S ISSUE):")
            for event_title in disappeared_events:
                print(f"      - '{event_title}'")
        
        # Root cause confirmation
        print(f"\n🎯 ROOT CAUSE CONFIRMED:")
        print("=" * 25)
        
        if mismatches:
            print(f"   ✅ Event type mismatch detected!")
            print(f"   ✅ Database has: {list(event_types_found.keys())}")
            print(f"   ✅ Filters expect: {list(expected_filters.keys())}")
            print(f"   ✅ Mismatched types: {mismatches}")
            print(f"   ✅ These events use 'other' fallback")
            print(f"   ✅ When 'other' is unchecked, they disappear!")
        else:
            print(f"   🤔 No obvious type mismatches found")
            print(f"   🔍 Issue may be in frontend logic or data processing")
        
        # Provide specific fix recommendations
        print(f"\n💡 SPECIFIC FIX RECOMMENDATIONS:")
        print("=" * 35)
        
        print("1. 🔧 IMMEDIATE DATA FIX:")
        if 'game' in event_types_found:
            print("   - Change 'game' events to 'games' (plural)")
        if 'tournament' in event_types_found:
            print("   - Change 'tournament' events to 'tournaments' (plural)")
        if 'event' in event_types_found:
            print("   - Change 'event' events to 'social' or appropriate type")
        
        print("\n2. 🔧 BACKEND DATA MIGRATION:")
        print("   - Update existing events to use correct type values")
        print("   - Add validation to prevent future mismatches")
        
        print("\n3. 🔧 FRONTEND LOGIC IMPROVEMENT:")
        print("   - Current: eventFilters[eventType] || eventFilters.other")
        print("   - Better: eventFilters[eventType] !== false")
        print("   - Or: Add default true for unknown types")
        
        return True, len(disappeared_events) > 0, mismatches, event_types_found
        
    except Exception as e:
        print(f"❌ Ticker filter bug test failed: {e}")
        return False, False, [], {}

def test_backend_event_type_fix():
    """Test if we can fix the event types in the backend"""
    print(f"\n🔧 TESTING BACKEND EVENT TYPE FIX:")
    print("=" * 40)
    
    try:
        # Get current data
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            print(f"❌ Failed to fetch data for fix test")
            return False
            
        data = response.json()
        events = data.get('leagueSchedule', [])
        
        # Create corrected events
        corrected_events = []
        changes_made = 0
        
        for event in events:
            corrected_event = event.copy()
            original_type = event.get('type', '')
            
            # Apply corrections
            if original_type == 'game':
                corrected_event['type'] = 'games'
                changes_made += 1
                print(f"   🔧 Fixed: '{event.get('title')}' type: 'game' -> 'games'")
            elif original_type == 'tournament':
                corrected_event['type'] = 'tournaments'
                changes_made += 1
                print(f"   🔧 Fixed: '{event.get('title')}' type: 'tournament' -> 'tournaments'")
            elif original_type == 'event':
                corrected_event['type'] = 'social'  # Assume generic events are social
                changes_made += 1
                print(f"   🔧 Fixed: '{event.get('title')}' type: 'event' -> 'social'")
            
            corrected_events.append(corrected_event)
        
        if changes_made > 0:
            print(f"\n✅ PROPOSED FIXES: {changes_made} events would be corrected")
            print("   Note: Not applying fixes in test mode")
            print("   Main agent should implement these corrections")
        else:
            print(f"\n✅ No event type corrections needed")
        
        return True, changes_made
        
    except Exception as e:
        print(f"❌ Backend fix test failed: {e}")
        return False, 0

def main():
    """Main test execution for ticker filter bug investigation"""
    print("🎯 TICKER FILTER BUG INVESTIGATION & TESTING")
    print("=" * 60)
    
    # Execute comprehensive bug test
    success, bug_confirmed, mismatches, event_types = test_ticker_filter_bug()
    
    # Test potential backend fix
    fix_success, fix_count = test_backend_event_type_fix()
    
    # Final summary
    print("\n" + "=" * 60)
    print("📊 TICKER FILTER BUG TEST SUMMARY")
    print("=" * 60)
    
    if success:
        print("✅ Investigation completed successfully")
        
        if bug_confirmed:
            print("🚨 BUG CONFIRMED: Events disappear when 'Other' filter is unchecked")
            print(f"🔍 Root cause: Event type mismatch")
            print(f"   Database types: {list(event_types.keys())}")
            print(f"   Mismatched types: {mismatches}")
            print(f"🔧 Fix needed: Update event types to match filter configuration")
            
            if fix_success and fix_count > 0:
                print(f"💡 Solution ready: {fix_count} events need type corrections")
            
        else:
            print("🤔 No obvious bug detected in current data")
            print("   Issue may be in frontend logic or user-specific data")
    else:
        print("❌ Investigation failed due to errors")
    
    print(f"\nRECOMMENDATION FOR MAIN AGENT:")
    if bug_confirmed and mismatches:
        print("🚨 HIGH PRIORITY: Fix event types in database immediately")
        print("   This is blocking core ticker functionality for users")
    else:
        print("🔍 MEDIUM PRIORITY: Investigate frontend ticker logic")
        print("   Backend data appears correct, issue may be in UI")
    
    return success and bug_confirmed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)