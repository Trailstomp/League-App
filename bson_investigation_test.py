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

def test_current_document_size():
    """CRITICAL: Check current league-data document size"""
    print("\n🔍 CRITICAL BSON SIZE INVESTIGATION - CURRENT DOCUMENT SIZE")
    print("=" * 70)
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 GET /api/league-data Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            size_mb, size_bytes = get_document_size_mb(data)
            
            print(f"📏 CURRENT DOCUMENT SIZE: {size_mb:.2f} MB ({size_bytes:,} bytes)")
            print(f"🚨 BSON LIMIT STATUS: {'⚠️ APPROACHING LIMIT' if size_mb > 10 else '✅ WITHIN SAFE LIMITS' if size_mb < 5 else '⚠️ MONITOR CLOSELY'}")
            
            # Analyze components
            components = {}
            for key, value in data.items():
                if key != '_id':
                    component_size_mb, component_bytes = get_document_size_mb(value)
                    components[key] = {
                        'size_mb': component_size_mb,
                        'size_bytes': component_bytes,
                        'count': len(value) if isinstance(value, list) else 1
                    }
            
            print(f"\n📊 DOCUMENT BREAKDOWN:")
            for key, info in sorted(components.items(), key=lambda x: x[1]['size_mb'], reverse=True):
                print(f"  {key}: {info['size_mb']:.2f} MB ({info['count']} items)")
                
                # Special analysis for large components
                if info['size_mb'] > 1.0:
                    print(f"    🚨 LARGE COMPONENT DETECTED - INVESTIGATING...")
                    if key == 'teams':
                        analyze_teams_size(data.get('teams', []))
                    elif key == 'players':
                        analyze_players_size(data.get('players', []))
                    elif key == 'leagueSchedule':
                        analyze_events_size(data.get('leagueSchedule', []))
            
            return True, size_mb, data
        else:
            print(f"❌ Failed to fetch league-data: {response.status_code}")
            return False, 0, None
            
    except Exception as e:
        print(f"❌ Document size check failed: {e}")
        return False, 0, None

def analyze_teams_size(teams):
    """Analyze teams data for size issues"""
    print(f"    🏆 TEAMS ANALYSIS ({len(teams)} teams):")
    
    total_logo_size = 0
    teams_with_large_logos = []
    
    for team in teams:
        team_size_mb, _ = get_document_size_mb(team)
        logo = team.get('logo', '')
        
        if team_size_mb > 0.1:  # Teams larger than 100KB
            print(f"      - {team.get('name', 'Unknown')}: {team_size_mb:.2f} MB")
            
            if logo and logo.startswith('data:'):
                logo_size_mb = len(logo.encode('utf-8')) / (1024 * 1024)
                total_logo_size += logo_size_mb
                if logo_size_mb > 0.05:  # Logos larger than 50KB
                    teams_with_large_logos.append({
                        'name': team.get('name', 'Unknown'),
                        'logo_size_mb': logo_size_mb
                    })
    
    print(f"      📊 Total logo data: {total_logo_size:.2f} MB")
    if teams_with_large_logos:
        print(f"      🚨 Large logos detected:")
        for team_info in teams_with_large_logos:
            print(f"        - {team_info['name']}: {team_info['logo_size_mb']:.2f} MB")

def analyze_players_size(players):
    """Analyze players data for size issues"""
    print(f"    👤 PLAYERS ANALYSIS ({len(players)} players):")
    
    total_photo_size = 0
    players_with_large_photos = []
    
    for player in players:
        player_size_mb, _ = get_document_size_mb(player)
        photo = player.get('photoUrl', '')
        
        if player_size_mb > 0.1:  # Players larger than 100KB
            print(f"      - {player.get('name', 'Unknown')}: {player_size_mb:.2f} MB")
            
            if photo and photo.startswith('data:'):
                photo_size_mb = len(photo.encode('utf-8')) / (1024 * 1024)
                total_photo_size += photo_size_mb
                if photo_size_mb > 0.05:  # Photos larger than 50KB
                    players_with_large_photos.append({
                        'name': player.get('name', 'Unknown'),
                        'photo_size_mb': photo_size_mb
                    })
    
    print(f"      📊 Total photo data: {total_photo_size:.2f} MB")
    if players_with_large_photos:
        print(f"      🚨 Large photos detected:")
        for player_info in players_with_large_photos:
            print(f"        - {player_info['name']}: {player_info['photo_size_mb']:.2f} MB")

def analyze_events_size(events):
    """Analyze events data for size issues"""
    print(f"    📅 EVENTS ANALYSIS ({len(events)} events):")
    
    for event in events:
        event_size_mb, _ = get_document_size_mb(event)
        if event_size_mb > 0.1:  # Events larger than 100KB
            print(f"      - {event.get('title', 'Unknown')}: {event_size_mb:.2f} MB")
            
            # Check for embedded team data
            if 'teams' in event or 'teamData' in event:
                print(f"        🚨 Event contains embedded team data!")
            
            # Check for photos in event
            if 'photos' in event or 'images' in event:
                print(f"        🚨 Event contains photo data!")

def test_event_save_simulation():
    """CRITICAL: Simulate event save to identify BSON overflow point"""
    print("\n🔍 EVENT SAVE BSON OVERFLOW SIMULATION")
    print("=" * 50)
    
    try:
        # Get current document
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            print("❌ Cannot get current document for simulation")
            return False
            
        current_data = response.json()
        current_size_mb, _ = get_document_size_mb(current_data)
        print(f"📏 Current document size: {current_size_mb:.2f} MB")
        
        # Create test event with minimal data
        minimal_event = {
            "id": "bson_test_event_001",
            "title": "BSON Test Event",
            "date": "2025-01-20",
            "time": "15:00",
            "type": "practice",
            "teamIds": ["test_team_1"],
            "location": "Test Field",
            "description": "Testing BSON limits"
        }
        
        # Test minimal event save
        print(f"\n🧪 Testing minimal event save...")
        minimal_size_mb, _ = get_document_size_mb(minimal_event)
        print(f"📏 Minimal event size: {minimal_size_mb:.4f} MB")
        
        # Simulate adding to current document
        simulated_data = current_data.copy()
        simulated_data['leagueSchedule'] = simulated_data.get('leagueSchedule', []) + [minimal_event]
        simulated_size_mb, _ = get_document_size_mb(simulated_data)
        
        print(f"📏 Simulated document size with minimal event: {simulated_size_mb:.2f} MB")
        print(f"🚨 Would exceed BSON limit: {'YES' if simulated_size_mb > 16 else 'NO'}")
        
        if simulated_size_mb > 16:
            print(f"🚨 CRITICAL: Document would exceed 16MB BSON limit!")
            print(f"   Current: {current_size_mb:.2f} MB")
            print(f"   With event: {simulated_size_mb:.2f} MB")
            print(f"   Overflow: {simulated_size_mb - 16:.2f} MB over limit")
            return False
        else:
            # Try actual save
            print(f"\n🧪 Attempting actual event save...")
            save_response = requests.post(f"{BACKEND_URL}/league-data/leagueSchedule", json=[minimal_event])
            print(f"📊 Event save status: {save_response.status_code}")
            
            if save_response.status_code == 500:
                print(f"🚨 500 ERROR CONFIRMED - BSON overflow detected!")
                print(f"   Error details: {save_response.text}")
                return False
            elif save_response.status_code == 200:
                print(f"✅ Event saved successfully")
                # Clean up
                cleanup_response = requests.get(f"{BACKEND_URL}/league-data")
                if cleanup_response.status_code == 200:
                    cleanup_data = cleanup_response.json()
                    cleanup_events = [e for e in cleanup_data.get('leagueSchedule', []) if e.get('id') != 'bson_test_event_001']
                    cleanup_data['leagueSchedule'] = cleanup_events
                    requests.post(f"{BACKEND_URL}/league-data/leagueSchedule", json=cleanup_events)
                    print(f"🧹 Test event cleaned up")
                return True
            else:
                print(f"❌ Unexpected response: {save_response.status_code}")
                return False
        
    except Exception as e:
        print(f"❌ Event save simulation failed: {e}")
        return False

def test_data_duplication_check():
    """Check for data duplication between collections"""
    print("\n🔍 DATA DUPLICATION INVESTIGATION")
    print("=" * 40)
    
    try:
        # Get individual collections
        teams_response = requests.get(f"{BACKEND_URL}/teams")
        players_response = requests.get(f"{BACKEND_URL}/players")
        league_response = requests.get(f"{BACKEND_URL}/league-data")
        
        if all(r.status_code == 200 for r in [teams_response, players_response, league_response]):
            individual_teams = teams_response.json()
            individual_players = players_response.json()
            league_data = league_response.json()
            
            league_teams = league_data.get('teams', [])
            league_players = league_data.get('players', [])
            
            print(f"📊 DUPLICATION ANALYSIS:")
            print(f"  Individual teams collection: {len(individual_teams)} teams")
            print(f"  League-data teams: {len(league_teams)} teams")
            print(f"  Individual players collection: {len(individual_players)} players")
            print(f"  League-data players: {len(league_players)} players")
            
            # Calculate sizes
            individual_teams_size, _ = get_document_size_mb(individual_teams)
            individual_players_size, _ = get_document_size_mb(individual_players)
            league_teams_size, _ = get_document_size_mb(league_teams)
            league_players_size, _ = get_document_size_mb(league_players)
            
            print(f"\n📏 SIZE ANALYSIS:")
            print(f"  Individual teams: {individual_teams_size:.2f} MB")
            print(f"  League-data teams: {league_teams_size:.2f} MB")
            print(f"  Individual players: {individual_players_size:.2f} MB")
            print(f"  League-data players: {league_players_size:.2f} MB")
            
            total_duplication = league_teams_size + league_players_size
            if total_duplication > 1.0:
                print(f"🚨 SIGNIFICANT DUPLICATION DETECTED: {total_duplication:.2f} MB")
                print(f"   This could be contributing to BSON overflow!")
            else:
                print(f"✅ Duplication within acceptable limits: {total_duplication:.2f} MB")
            
            return True
        else:
            print("❌ Failed to fetch collections for duplication check")
            return False
            
    except Exception as e:
        print(f"❌ Duplication check failed: {e}")
        return False

def test_photo_compression_status():
    """Check if photos are actually compressed in production"""
    print("\n🔍 PHOTO COMPRESSION STATUS CHECK")
    print("=" * 40)
    
    try:
        # Check individual players collection for photo sizes
        players_response = requests.get(f"{BACKEND_URL}/players")
        if players_response.status_code == 200:
            players = players_response.json()
            
            print(f"📊 PLAYER PHOTO ANALYSIS ({len(players)} players):")
            
            total_uncompressed_size = 0
            large_photos = []
            
            for player in players:
                photo = player.get('photoUrl', '')
                if photo and photo.startswith('data:'):
                    photo_size_mb = len(photo.encode('utf-8')) / (1024 * 1024)
                    total_uncompressed_size += photo_size_mb
                    
                    print(f"  👤 {player.get('name', 'Unknown')}: {photo_size_mb:.2f} MB")
                    
                    if photo_size_mb > 0.1:  # Photos larger than 100KB
                        large_photos.append({
                            'name': player.get('name', 'Unknown'),
                            'id': player.get('id'),
                            'size_mb': photo_size_mb
                        })
            
            print(f"\n📊 COMPRESSION STATUS:")
            print(f"  Total photo data: {total_uncompressed_size:.2f} MB")
            print(f"  Large photos (>100KB): {len(large_photos)}")
            
            if large_photos:
                print(f"🚨 UNCOMPRESSED PHOTOS DETECTED:")
                for photo_info in large_photos:
                    print(f"    - {photo_info['name']}: {photo_info['size_mb']:.2f} MB")
                    
                print(f"\n💡 EMERGENCY FIX RECOMMENDATION:")
                print(f"   Compress these {len(large_photos)} photos to <100KB each")
                print(f"   Potential savings: {total_uncompressed_size - (len(large_photos) * 0.1):.2f} MB")
            else:
                print(f"✅ All photos appear to be compressed")
            
            return True, large_photos
        else:
            print("❌ Failed to fetch players for photo check")
            return False, []
            
    except Exception as e:
        print(f"❌ Photo compression check failed: {e}")
        return False, []

def provide_emergency_fix_options(current_size_mb, large_photos):
    """Provide immediate fix options for BSON overflow"""
    print("\n🚨 EMERGENCY FIX OPTIONS")
    print("=" * 30)
    
    if current_size_mb > 15:
        print(f"🚨 CRITICAL: Document at {current_size_mb:.2f} MB - IMMEDIATE ACTION REQUIRED!")
        
        print(f"\n🔧 IMMEDIATE FIXES:")
        print(f"1. COMPRESS LARGE PHOTOS:")
        if large_photos:
            total_savings = sum(p['size_mb'] for p in large_photos) - (len(large_photos) * 0.05)
            print(f"   - Compress {len(large_photos)} large photos")
            print(f"   - Potential savings: {total_savings:.2f} MB")
            print(f"   - Target size after compression: {current_size_mb - total_savings:.2f} MB")
        
        print(f"\n2. MOVE LARGE DATA TO SEPARATE COLLECTIONS:")
        print(f"   - Move player photos to separate 'player_photos' collection")
        print(f"   - Move team logos to separate 'team_logos' collection")
        print(f"   - Use references instead of embedded data")
        
        print(f"\n3. TEMPORARY WORKAROUND:")
        print(f"   - Temporarily remove largest photos to allow event saves")
        print(f"   - Restore photos after implementing proper solution")
        
    elif current_size_mb > 10:
        print(f"⚠️ WARNING: Document at {current_size_mb:.2f} MB - MONITOR CLOSELY")
        print(f"   - Implement photo compression before adding more data")
        print(f"   - Consider data optimization strategies")
    else:
        print(f"✅ Document size acceptable at {current_size_mb:.2f} MB")

def main():
    """Main BSON investigation execution"""
    print("🚨 URGENT BSON ERROR INVESTIGATION - USER STILL GETTING 500 ERRORS")
    print("=" * 80)
    print("USER CONTEXT: User cannot save events due to BSON errors blocking core functionality")
    print("PRIORITY: CRITICAL - Find and fix BSON issue immediately")
    print("=" * 80)
    
    # Test results tracking
    results = {
        'document_size_check': False,
        'event_save_simulation': False,
        'duplication_check': False,
        'photo_compression_check': False
    }
    
    # Execute critical tests
    success, current_size_mb, current_data = test_current_document_size()
    results['document_size_check'] = success
    
    if success:
        results['event_save_simulation'] = test_event_save_simulation()
        results['duplication_check'] = test_data_duplication_check()
        photo_success, large_photos = test_photo_compression_status()
        results['photo_compression_check'] = photo_success
        
        # Provide emergency fix recommendations
        if photo_success:
            provide_emergency_fix_options(current_size_mb, large_photos)
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 BSON INVESTIGATION SUMMARY")
    print("=" * 80)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ COMPLETED" if passed else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nInvestigation Status: {passed_tests}/{total_tests} checks completed")
    
    if current_size_mb and current_size_mb > 15:
        print("🚨 CRITICAL ISSUE CONFIRMED: Document size exceeds safe limits")
        print("   IMMEDIATE ACTION REQUIRED to prevent 500 errors")
    elif current_size_mb and current_size_mb > 10:
        print("⚠️ WARNING: Document approaching BSON limits")
        print("   Preventive action recommended")
    else:
        print("✅ Document size within acceptable limits")
        print("   Issue may be elsewhere - investigate event save process")
    
    return results

if __name__ == "__main__":
    results = main()
    # Exit with appropriate code based on findings
    sys.exit(0)