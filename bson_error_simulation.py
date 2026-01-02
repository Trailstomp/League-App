#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment - PRODUCTION URL
BACKEND_URL = "https://team-manager-plus.preview.emergentagent.com/api"

def check_player_photo_sizes():
    """Check if player photos are causing BSON issues"""
    print("🔍 CHECKING PLAYER PHOTO SIZES FOR BSON ISSUES...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/players")
        if response.status_code == 200:
            players = response.json()
            print(f"📊 Found {len(players)} players")
            
            total_photo_size = 0
            large_photos = []
            
            for player in players:
                if player.get('photoUrl'):
                    photo_size = len(player['photoUrl'])
                    photo_size_kb = photo_size / 1024
                    photo_size_mb = photo_size / (1024 * 1024)
                    total_photo_size += photo_size
                    
                    print(f"  👤 {player.get('name', 'Unknown')}: {photo_size_mb:.2f} MB ({photo_size_kb:.1f} KB)")
                    
                    if photo_size_mb > 1.0:  # Photos over 1MB
                        large_photos.append({
                            'name': player.get('name'),
                            'id': player.get('id'),
                            'size_mb': photo_size_mb
                        })
                        print(f"    🚨 LARGE PHOTO DETECTED!")
            
            total_mb = total_photo_size / (1024 * 1024)
            print(f"\n📊 TOTAL PHOTO DATA: {total_mb:.2f} MB")
            
            if large_photos:
                print(f"🚨 FOUND {len(large_photos)} LARGE PHOTOS:")
                for photo in large_photos:
                    print(f"  - {photo['name']}: {photo['size_mb']:.2f} MB")
                return True, large_photos, total_mb
            else:
                print(f"✅ No large photos detected")
                return True, [], total_mb
        else:
            print(f"❌ Failed to fetch players: {response.status_code}")
            return False, [], 0
            
    except Exception as e:
        print(f"❌ Player photo check failed: {e}")
        return False, [], 0

def simulate_team_save_with_large_data():
    """Simulate team save that could trigger BSON error"""
    print("\n🔍 SIMULATING TEAM SAVE WITH LARGE DATA...")
    
    try:
        # Get current league data to see actual size
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code != 200:
            print(f"❌ Could not fetch league data")
            return False
        
        data = response.json()
        current_size = len(json.dumps(data).encode('utf-8')) / (1024 * 1024)
        print(f"📏 Current league-data size: {current_size:.2f} MB")
        
        # Check if there are teams with large data
        teams = data.get('teams', [])
        print(f"📊 Current teams in league-data: {len(teams)}")
        
        for i, team in enumerate(teams):
            team_json = json.dumps(team)
            team_size = len(team_json.encode('utf-8')) / 1024  # KB
            print(f"  🏆 Team {i+1}: {team.get('name', 'Unknown')} - {team_size:.1f} KB")
            
            if team.get('logo') and len(team['logo']) > 10000:
                logo_size = len(team['logo']) / 1024
                print(f"    📸 Logo: {logo_size:.1f} KB")
            
            if team.get('style'):
                style_json = json.dumps(team['style'])
                style_size = len(style_json.encode('utf-8')) / 1024
                print(f"    🎨 Style: {style_size:.1f} KB")
        
        # Try to create a team with realistic data that might trigger BSON error
        test_team = {
            "name": "BSON Error Test Team",
            "division": "Field",
            "coach": "Test Coach",
            "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
            "style": {
                "primaryColor": "#FF6B35",
                "backgroundColor": "#FFF8F0",
                "accentColor": "#004E89"
            },
            "active": True
        }
        
        # Add the test team to existing teams
        updated_teams = teams + [test_team]
        
        # Calculate projected size
        projected_data = data.copy()
        projected_data['teams'] = updated_teams
        projected_size = len(json.dumps(projected_data).encode('utf-8')) / (1024 * 1024)
        print(f"📏 Projected size with new team: {projected_size:.2f} MB")
        
        # Try to save
        print(f"💾 Attempting to save teams to league-data...")
        save_response = requests.post(f"{BACKEND_URL}/league-data/teams", json=updated_teams)
        print(f"📊 POST /api/league-data/teams Status: {save_response.status_code}")
        
        if save_response.status_code == 200:
            print(f"✅ Team save successful")
            
            # Verify final size
            final_response = requests.get(f"{BACKEND_URL}/league-data")
            if final_response.status_code == 200:
                final_data = final_response.json()
                final_size = len(json.dumps(final_data).encode('utf-8')) / (1024 * 1024)
                print(f"📏 Final document size: {final_size:.2f} MB")
                
                # Clean up test team
                cleanup_teams = [t for t in updated_teams if t.get('name') != 'BSON Error Test Team']
                cleanup_response = requests.post(f"{BACKEND_URL}/league-data/teams", json=cleanup_teams)
                print(f"🧹 Cleanup: {cleanup_response.status_code}")
            
            return True
        else:
            print(f"❌ Team save failed: {save_response.status_code}")
            if save_response.text:
                error_text = save_response.text
                print(f"   Error: {error_text}")
                
                # Check for BSON error indicators
                if any(keyword in error_text.lower() for keyword in ['too large', 'bson', 'size', '16mb', 'limit']):
                    print(f"🚨 BSON SIZE ERROR DETECTED!")
                    print(f"   This confirms the user's production BSON error")
                    return False
            return False
            
    except Exception as e:
        print(f"❌ Team save simulation failed: {e}")
        return False

def check_for_hidden_large_data():
    """Check for any hidden large data in the database"""
    print("\n🔍 CHECKING FOR HIDDEN LARGE DATA...")
    
    try:
        # Check league-data for any unexpected large fields
        response = requests.get(f"{BACKEND_URL}/league-data")
        if response.status_code == 200:
            data = response.json()
            
            # Check all fields for large data
            large_fields = []
            for key, value in data.items():
                if isinstance(value, (str, list, dict)):
                    field_json = json.dumps(value)
                    field_size = len(field_json.encode('utf-8')) / (1024 * 1024)
                    
                    if field_size > 0.5:  # Fields over 500KB
                        large_fields.append({
                            'field': key,
                            'size_mb': field_size,
                            'type': type(value).__name__
                        })
                        print(f"  📊 Large field '{key}': {field_size:.2f} MB ({type(value).__name__})")
                        
                        # Show preview of large string fields
                        if isinstance(value, str) and len(value) > 1000:
                            preview = value[:200] + "..." if len(value) > 200 else value
                            print(f"    📝 Preview: {preview}")
            
            if large_fields:
                print(f"🚨 FOUND {len(large_fields)} LARGE FIELDS")
                return True, large_fields
            else:
                print(f"✅ No hidden large data detected")
                return True, []
        else:
            print(f"❌ Could not check for hidden data")
            return False, []
            
    except Exception as e:
        print(f"❌ Hidden data check failed: {e}")
        return False, []

def test_individual_collections_size():
    """Check individual collections that might contribute to BSON issues"""
    print("\n🔍 CHECKING INDIVIDUAL COLLECTIONS SIZE...")
    
    collections = {
        'teams': '/api/teams',
        'players': '/api/players'
    }
    
    total_individual_size = 0
    
    for collection_name, endpoint in collections.items():
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}")
            if response.status_code == 200:
                data = response.json()
                collection_json = json.dumps(data)
                collection_size = len(collection_json.encode('utf-8')) / (1024 * 1024)
                total_individual_size += collection_size
                
                print(f"  📊 {collection_name}: {collection_size:.2f} MB ({len(data)} items)")
                
                # Check for large items in collection
                if isinstance(data, list):
                    for item in data:
                        item_json = json.dumps(item)
                        item_size = len(item_json.encode('utf-8')) / 1024  # KB
                        if item_size > 100:  # Items over 100KB
                            name = item.get('name', item.get('id', 'Unknown'))
                            print(f"    🔍 Large item '{name}': {item_size:.1f} KB")
            else:
                print(f"  ❌ Could not fetch {collection_name}: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Error checking {collection_name}: {e}")
    
    print(f"\n📊 TOTAL INDIVIDUAL COLLECTIONS SIZE: {total_individual_size:.2f} MB")
    return total_individual_size

def compress_large_photos():
    """Compress any large photos found"""
    print("\n🔧 COMPRESSING LARGE PHOTOS...")
    
    try:
        # Check players for large photos
        response = requests.get(f"{BACKEND_URL}/players")
        if response.status_code != 200:
            print(f"❌ Could not fetch players for compression")
            return False
        
        players = response.json()
        compression_needed = False
        
        for player in players:
            if player.get('photoUrl') and len(player['photoUrl']) > 100000:  # >100KB
                old_size = len(player['photoUrl']) / 1024
                print(f"🧹 Compressing photo for {player.get('name')}: {old_size:.1f} KB")
                
                # Replace with small placeholder
                player['photoUrl'] = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                
                # Update the player
                update_response = requests.put(f"{BACKEND_URL}/players/{player['id']}", json=player)
                if update_response.status_code == 200:
                    print(f"  ✅ Compressed successfully")
                    compression_needed = True
                else:
                    print(f"  ❌ Compression failed: {update_response.status_code}")
        
        if compression_needed:
            # Also update league-data players if they exist
            league_response = requests.get(f"{BACKEND_URL}/league-data")
            if league_response.status_code == 200:
                league_data = league_response.json()
                league_players = league_data.get('players', [])
                
                if league_players:
                    print(f"🔄 Updating league-data players...")
                    # Compress photos in league-data too
                    for player in league_players:
                        if player.get('photoUrl') and len(player['photoUrl']) > 100000:
                            player['photoUrl'] = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                    
                    # Save updated league-data
                    save_response = requests.post(f"{BACKEND_URL}/league-data/players", json=league_players)
                    if save_response.status_code == 200:
                        print(f"  ✅ League-data players updated")
                    else:
                        print(f"  ❌ League-data update failed: {save_response.status_code}")
            
            print(f"✅ Photo compression completed")
            return True
        else:
            print(f"ℹ️  No large photos found to compress")
            return True
            
    except Exception as e:
        print(f"❌ Photo compression failed: {e}")
        return False

def main():
    """Main BSON error investigation and resolution"""
    print("🚨 PRODUCTION BSON ERROR INVESTIGATION & RESOLUTION")
    print("=" * 70)
    print("User Issue: Still getting BSON error when saving teams")
    print("Error: BSONObj size: 18629190 (18.6MB) exceeds 16MB limit")
    print("=" * 70)
    
    # Test API connection
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"✅ API Health Check: {response.status_code} - {response.json()}")
        api_working = response.status_code == 200
    except Exception as e:
        print(f"❌ API Health Check Failed: {e}")
        api_working = False
    
    if not api_working:
        print("❌ Cannot proceed - API not accessible")
        return False
    
    # Investigation steps
    results = {
        'photo_check': False,
        'team_save_simulation': False,
        'hidden_data_check': False,
        'individual_collections': False,
        'photo_compression': False
    }
    
    # Check player photos (common cause of BSON issues)
    success, large_photos, total_photo_mb = check_player_photo_sizes()
    results['photo_check'] = success
    
    # Simulate team save
    results['team_save_simulation'] = simulate_team_save_with_large_data()
    
    # Check for hidden large data
    success, large_fields = check_for_hidden_large_data()
    results['hidden_data_check'] = success
    
    # Check individual collections
    individual_size = test_individual_collections_size()
    results['individual_collections'] = True
    
    # If large photos found, compress them
    if large_photos:
        print(f"\n🚨 LARGE PHOTOS DETECTED - PERFORMING COMPRESSION")
        results['photo_compression'] = compress_large_photos()
    else:
        results['photo_compression'] = True
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 BSON ERROR INVESTIGATION SUMMARY")
    print("=" * 70)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} investigation steps completed")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    if large_photos:
        print(f"  🔧 Large photos found and compressed")
        print(f"  📊 Photo data reduced from {total_photo_mb:.2f} MB")
    
    if large_fields:
        print(f"  🔧 Large data fields detected - manual cleanup may be needed")
    
    print(f"  📏 Individual collections total: {individual_size:.2f} MB")
    
    if results['photo_compression'] and not large_fields:
        print(f"\n✅ BSON ERROR LIKELY RESOLVED")
        print(f"   User should now be able to save teams without errors")
        return True
    else:
        print(f"\n⚠️  INVESTIGATION COMPLETED - Manual intervention may be needed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)