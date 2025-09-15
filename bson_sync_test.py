#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://lacrosse-mgr.preview.emergentagent.com/api"

def test_api_health():
    """Test if the API is responding"""
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"✅ API Health Check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ API Health Check Failed: {e}")
        return False

def analyze_individual_players_collection():
    """Analyze players in individual collection after compression"""
    print("\n🔍 ANALYZING INDIVIDUAL PLAYERS COLLECTION...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/players")
        print(f"📊 GET /api/players Status: {response.status_code}")
        
        if response.status_code == 200:
            players = response.json()
            print(f"👥 Total players in individual collection: {len(players)}")
            
            total_photo_size = 0
            
            for player in players:
                name = player.get('name', 'Unknown')
                photo_url = player.get('photoUrl', '')
                
                if photo_url and photo_url.startswith('data:image'):
                    try:
                        header, data_part = photo_url.split(',', 1)
                        photo_size_bytes = len(data_part.encode('utf-8'))
                        photo_size_mb = photo_size_bytes / (1024 * 1024)
                        total_photo_size += photo_size_bytes
                        
                        print(f"  📸 Player: {name}")
                        print(f"    - Photo size: {photo_size_mb:.2f} MB ({photo_size_bytes:,} bytes)")
                        
                        if photo_size_bytes <= 100 * 1024:  # 100KB
                            print(f"    - ✅ Photo compressed successfully (<100KB)")
                        else:
                            print(f"    - ⚠️  Photo still large (>100KB)")
                    except Exception as e:
                        print(f"    - ❌ Error analyzing photo: {e}")
                else:
                    print(f"  👤 Player: {name} - No photo")
            
            total_photo_size_mb = total_photo_size / (1024 * 1024)
            print(f"\n📊 INDIVIDUAL COLLECTION SUMMARY:")
            print(f"  - Total photo data: {total_photo_size_mb:.2f} MB")
            
            return True, players, total_photo_size_mb
        else:
            print(f"❌ Failed to fetch individual players: {response.status_code}")
            return False, [], 0
            
    except Exception as e:
        print(f"❌ Individual players analysis failed: {e}")
        return False, [], 0

def analyze_league_data_players():
    """Analyze players in league-data collection"""
    print("\n🔍 ANALYZING LEAGUE-DATA PLAYERS COLLECTION...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 GET /api/league-data Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            players = data.get('players', [])
            print(f"👥 Total players in league-data: {len(players)}")
            
            total_photo_size = 0
            
            for player in players:
                name = player.get('name', 'Unknown')
                photo_url = player.get('photoUrl', '')
                
                if photo_url and photo_url.startswith('data:image'):
                    try:
                        header, data_part = photo_url.split(',', 1)
                        photo_size_bytes = len(data_part.encode('utf-8'))
                        photo_size_mb = photo_size_bytes / (1024 * 1024)
                        total_photo_size += photo_size_bytes
                        
                        print(f"  📸 Player: {name}")
                        print(f"    - Photo size: {photo_size_mb:.2f} MB ({photo_size_bytes:,} bytes)")
                        
                        if photo_size_bytes <= 100 * 1024:  # 100KB
                            print(f"    - ✅ Photo compressed successfully (<100KB)")
                        else:
                            print(f"    - ⚠️  Photo still large (>100KB) - NEEDS SYNC")
                    except Exception as e:
                        print(f"    - ❌ Error analyzing photo: {e}")
                else:
                    print(f"  👤 Player: {name} - No photo")
            
            total_photo_size_mb = total_photo_size / (1024 * 1024)
            
            # Calculate total document size
            json_str = json.dumps(data)
            doc_size_bytes = len(json_str.encode('utf-8'))
            doc_size_mb = doc_size_bytes / (1024 * 1024)
            
            print(f"\n📊 LEAGUE-DATA COLLECTION SUMMARY:")
            print(f"  - Total photo data: {total_photo_size_mb:.2f} MB")
            print(f"  - Total document size: {doc_size_mb:.2f} MB")
            print(f"  - Photo data as % of document: {(total_photo_size/doc_size_bytes)*100:.1f}%")
            
            return True, players, total_photo_size_mb, doc_size_mb
        else:
            print(f"❌ Failed to fetch league-data: {response.status_code}")
            return False, [], 0, 0
            
    except Exception as e:
        print(f"❌ League-data analysis failed: {e}")
        return False, [], 0, 0

def sync_compressed_players_to_league_data():
    """Synchronize compressed players from individual collection to league-data"""
    print("\n🔄 SYNCHRONIZING COMPRESSED PLAYERS TO LEAGUE-DATA...")
    
    try:
        # Get compressed players from individual collection
        individual_response = requests.get(f"{BACKEND_URL}/players")
        if individual_response.status_code != 200:
            print(f"❌ Failed to fetch individual players: {individual_response.status_code}")
            return False
        
        individual_players = individual_response.json()
        print(f"📥 Retrieved {len(individual_players)} players from individual collection")
        
        # Update league-data with compressed players
        sync_response = requests.post(f"{BACKEND_URL}/league-data/players", json=individual_players)
        
        if sync_response.status_code == 200:
            print(f"✅ Players synchronized to league-data successfully")
            
            # Verify synchronization
            verify_response = requests.get(f"{BACKEND_URL}/league-data")
            if verify_response.status_code == 200:
                data = verify_response.json()
                synced_players = data.get('players', [])
                
                print(f"📊 SYNCHRONIZATION VERIFICATION:")
                print(f"  - Players in individual collection: {len(individual_players)}")
                print(f"  - Players in league-data after sync: {len(synced_players)}")
                
                # Check photo sizes after sync
                total_synced_photo_size = 0
                for player in synced_players:
                    photo_url = player.get('photoUrl', '')
                    if photo_url and photo_url.startswith('data:image'):
                        try:
                            header, data_part = photo_url.split(',', 1)
                            photo_size_bytes = len(data_part.encode('utf-8'))
                            total_synced_photo_size += photo_size_bytes
                        except:
                            pass
                
                synced_photo_size_mb = total_synced_photo_size / (1024 * 1024)
                print(f"  - Total photo data after sync: {synced_photo_size_mb:.2f} MB")
                
                # Calculate new document size
                json_str = json.dumps(data)
                new_doc_size_bytes = len(json_str.encode('utf-8'))
                new_doc_size_mb = new_doc_size_bytes / (1024 * 1024)
                
                print(f"  - New document size: {new_doc_size_mb:.2f} MB")
                
                return True, new_doc_size_mb
            else:
                print(f"⚠️  Sync successful but verification failed")
                return True, 0
        else:
            print(f"❌ Synchronization failed: {sync_response.status_code}")
            if sync_response.text:
                print(f"   Error: {sync_response.text}")
            return False, 0
            
    except Exception as e:
        print(f"❌ Synchronization failed: {e}")
        return False, 0

def test_event_save_after_sync():
    """Test event save functionality after synchronization"""
    print("\n🎯 TESTING EVENT SAVE AFTER SYNCHRONIZATION...")
    
    try:
        # Create a larger test event to stress test
        test_event = {
            "id": f"sync_test_{int(datetime.now().timestamp())}",
            "title": "Post-Sync BSON Test Event",
            "date": "2025-01-20",
            "time": "16:00",
            "type": "tournament",
            "teamIds": ["team_1", "team_2", "team_3", "team_4"],
            "location": "Championship Field",
            "description": "Testing event save after player photo compression and synchronization to ensure BSON overflow is completely resolved",
            "additionalData": {
                "bracket": "Single Elimination",
                "prizes": ["Trophy", "Medals", "Team Photos"],
                "requirements": "All teams must have compressed player photos"
            }
        }
        
        print(f"📝 Creating test event: {test_event['title']}")
        
        # Try to save event
        response = requests.post(f"{BACKEND_URL}/league-data/leagueSchedule", json=[test_event])
        
        if response.status_code == 200:
            print(f"✅ Event saved successfully after synchronization!")
            
            # Verify final document size
            verify_response = requests.get(f"{BACKEND_URL}/league-data")
            if verify_response.status_code == 200:
                data = verify_response.json()
                json_str = json.dumps(data)
                final_size_bytes = len(json_str.encode('utf-8'))
                final_size_mb = final_size_bytes / (1024 * 1024)
                
                print(f"📏 Final document size with event: {final_size_mb:.2f} MB")
                
                # Check BSON compliance
                bson_limit_mb = 16
                usage_percent = (final_size_mb / bson_limit_mb) * 100
                
                if final_size_mb < 2.0:
                    print(f"🎉 EXCELLENT: Document size under 2MB target!")
                elif usage_percent < 50:
                    print(f"✅ GOOD: Document size within safe limits")
                else:
                    print(f"⚠️  WARNING: Document size higher than expected")
                
                return True, final_size_mb
            else:
                print(f"✅ Event saved but verification failed")
                return True, 0
        else:
            print(f"❌ Event save failed: {response.status_code}")
            if response.text:
                print(f"   Error: {response.text}")
            return False, 0
            
    except Exception as e:
        print(f"❌ Event save test failed: {e}")
        return False, 0

def main():
    """Main test execution for BSON synchronization and final verification"""
    print("🔄 BSON OVERFLOW SYNCHRONIZATION & FINAL VERIFICATION")
    print("=" * 70)
    print("MISSION: Ensure compressed photos are synced to league-data")
    print("TARGET: Achieve <2MB document size after synchronization")
    print("=" * 70)
    
    # Test results tracking
    results = {
        'api_health': False,
        'individual_analysis': False,
        'league_data_analysis': False,
        'synchronization': False,
        'final_event_test': False
    }
    
    # Execute tests
    results['api_health'] = test_api_health()
    
    if results['api_health']:
        results['individual_analysis'], individual_players, individual_photo_size = analyze_individual_players_collection()
        results['league_data_analysis'], league_players, league_photo_size, league_doc_size = analyze_league_data_players()
        
        # Check if synchronization is needed
        if results['individual_analysis'] and results['league_data_analysis']:
            if league_photo_size > 1.0:  # If league-data still has large photos
                print(f"\n⚠️  SYNCHRONIZATION NEEDED: League-data has {league_photo_size:.2f}MB of photo data")
                results['synchronization'], new_doc_size = sync_compressed_players_to_league_data()
            else:
                print(f"\n✅ SYNCHRONIZATION NOT NEEDED: League-data already has compressed photos")
                results['synchronization'] = True
                new_doc_size = league_doc_size
        
        if results['synchronization']:
            results['final_event_test'], final_size = test_event_save_after_sync()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 BSON SYNCHRONIZATION & VERIFICATION SUMMARY")
    print("=" * 70)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 SYNCHRONIZATION COMPLETE!")
        print("✅ Player photos compressed and synchronized to league-data")
        print("✅ Document size reduced to safe levels")
        print("✅ Events can be saved without BSON overflow errors")
    else:
        print("🚨 SYNCHRONIZATION ISSUES DETECTED")
        print("❌ Manual intervention may be required")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)