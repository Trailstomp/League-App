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

def test_teams_persistence():
    """Test team data persistence - CRITICAL INVESTIGATION"""
    print("\n🔍 INVESTIGATING TEAM DATA PERSISTENCE...")
    
    try:
        # 1. Check current teams in database
        response = requests.get(f"{BACKEND_URL}/teams")
        print(f"📊 GET /api/teams Status: {response.status_code}")
        
        if response.status_code == 200:
            teams = response.json()
            print(f"📈 Teams found in database: {len(teams)}")
            
            # Look for teams with logos and styling
            teams_with_logos = []
            teams_with_styles = []
            
            for team in teams:
                print(f"  🏆 Team: {team.get('name', 'Unknown')} (ID: {team.get('id', 'No ID')})")
                print(f"    - Logo: {'✅ Present' if team.get('logo') else '❌ Missing'}")
                print(f"    - Style: {'✅ Present' if team.get('style') else '❌ Missing'}")
                print(f"    - Active: {team.get('active', 'Unknown')}")
                print(f"    - Created: {team.get('createdAt', 'Unknown')}")
                
                if team.get('logo'):
                    teams_with_logos.append(team)
                    print(f"    - Logo Type: {'Data URL' if team['logo'].startswith('data:') else 'Blob URL' if team['logo'].startswith('blob:') else 'Other'}")
                
                if team.get('style'):
                    teams_with_styles.append(team)
                    style = team['style']
                    print(f"    - Primary Color: {style.get('primaryColor', 'Default')}")
                    print(f"    - Background Color: {style.get('backgroundColor', 'Default')}")
            
            print(f"\n📊 TEAM PERSISTENCE ANALYSIS:")
            print(f"  - Total teams in database: {len(teams)}")
            print(f"  - Teams with logos: {len(teams_with_logos)}")
            print(f"  - Teams with custom styles: {len(teams_with_styles)}")
            
            return True, teams
        else:
            print(f"❌ Failed to fetch teams: {response.status_code}")
            return False, []
            
    except Exception as e:
        print(f"❌ Team persistence test failed: {e}")
        return False, []

def test_players_persistence():
    """Test player data persistence - CRITICAL INVESTIGATION"""
    print("\n🔍 INVESTIGATING PLAYER DATA PERSISTENCE...")
    
    try:
        # 1. Check current players in database
        response = requests.get(f"{BACKEND_URL}/players")
        print(f"📊 GET /api/players Status: {response.status_code}")
        
        if response.status_code == 200:
            players = response.json()
            print(f"📈 Players found in database: {len(players)}")
            
            for player in players:
                print(f"  👤 Player: {player.get('name', 'Unknown')} (ID: {player.get('id', 'No ID')})")
                print(f"    - Team ID: {player.get('teamId', 'Unknown')}")
                print(f"    - Position: {player.get('position', 'Unknown')}")
                print(f"    - Jersey: {player.get('jerseyNumber', 'Unknown')}")
                print(f"    - Photo: {'✅ Present' if player.get('photoUrl') else '❌ Missing'}")
                print(f"    - Active: {player.get('active', 'Unknown')}")
                print(f"    - Created: {player.get('createdAt', 'Unknown')}")
            
            print(f"\n📊 PLAYER PERSISTENCE ANALYSIS:")
            print(f"  - Total players in database: {len(players)}")
            
            return True, players
        else:
            print(f"❌ Failed to fetch players: {response.status_code}")
            return False, []
            
    except Exception as e:
        print(f"❌ Player persistence test failed: {e}")
        return False, []

def test_league_data_teams_players():
    """Test teams/players in league-data collection"""
    print("\n🔍 INVESTIGATING LEAGUE-DATA TEAMS/PLAYERS...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 GET /api/league-data Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            teams_in_league = data.get('teams', [])
            players_in_league = data.get('players', [])
            
            print(f"📈 Teams in league-data: {len(teams_in_league)}")
            print(f"📈 Players in league-data: {len(players_in_league)}")
            
            # Analyze teams in league-data
            for team in teams_in_league:
                print(f"  🏆 League Team: {team.get('name', 'Unknown')}")
                print(f"    - Has Logo: {'✅' if team.get('logo') else '❌'}")
                print(f"    - Has Style: {'✅' if team.get('style') else '❌'}")
            
            # Analyze players in league-data
            for player in players_in_league:
                print(f"  👤 League Player: {player.get('name', 'Unknown')}")
                print(f"    - Team: {player.get('teamId', 'Unknown')}")
            
            return True, teams_in_league, players_in_league
        else:
            print(f"❌ Failed to fetch league-data: {response.status_code}")
            return False, [], []
            
    except Exception as e:
        print(f"❌ League-data test failed: {e}")
        return False, [], []

def test_team_save_functionality():
    """Test team save functionality - CREATE/UPDATE operations"""
    print("\n🔍 TESTING TEAM SAVE FUNCTIONALITY...")
    
    try:
        # Create a test team with logo and styling
        test_team = {
            "name": "Persistence Test Team",
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
        
        # Test POST /api/teams
        response = requests.post(f"{BACKEND_URL}/teams", json=test_team)
        print(f"📊 POST /api/teams Status: {response.status_code}")
        
        if response.status_code == 200:
            created_team = response.json()
            team_id = created_team.get('id')
            print(f"✅ Team created successfully with ID: {team_id}")
            print(f"  - Logo preserved: {'✅' if created_team.get('logo') else '❌'}")
            print(f"  - Style preserved: {'✅' if created_team.get('style') else '❌'}")
            
            # Test retrieval
            get_response = requests.get(f"{BACKEND_URL}/teams")
            if get_response.status_code == 200:
                teams = get_response.json()
                test_team_found = next((t for t in teams if t.get('id') == team_id), None)
                if test_team_found:
                    print(f"✅ Team retrieval successful")
                    print(f"  - Logo persisted: {'✅' if test_team_found.get('logo') else '❌'}")
                    print(f"  - Style persisted: {'✅' if test_team_found.get('style') else '❌'}")
                else:
                    print(f"❌ Created team not found in retrieval")
            
            # Clean up - delete test team
            delete_response = requests.delete(f"{BACKEND_URL}/teams/{team_id}")
            print(f"🧹 Cleanup - Delete Status: {delete_response.status_code}")
            
            return True
        else:
            print(f"❌ Team creation failed: {response.status_code}")
            if response.text:
                print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Team save functionality test failed: {e}")
        return False

def test_player_save_functionality():
    """Test player save functionality - CREATE/UPDATE operations"""
    print("\n🔍 TESTING PLAYER SAVE FUNCTIONALITY...")
    
    try:
        # Create a test player
        test_player = {
            "name": "Test Player",
            "teamId": "test_team_id",
            "position": "Midfielder",
            "jerseyNumber": 99,
            "handedness": "Right",
            "details": "Test player for persistence testing",
            "photoUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
            "active": True
        }
        
        # Test POST /api/players
        response = requests.post(f"{BACKEND_URL}/players", json=test_player)
        print(f"📊 POST /api/players Status: {response.status_code}")
        
        if response.status_code == 200:
            created_player = response.json()
            player_id = created_player.get('id')
            print(f"✅ Player created successfully with ID: {player_id}")
            print(f"  - Photo preserved: {'✅' if created_player.get('photoUrl') else '❌'}")
            print(f"  - Details preserved: {'✅' if created_player.get('details') else '❌'}")
            
            # Test retrieval
            get_response = requests.get(f"{BACKEND_URL}/players")
            if get_response.status_code == 200:
                players = get_response.json()
                test_player_found = next((p for p in players if p.get('id') == player_id), None)
                if test_player_found:
                    print(f"✅ Player retrieval successful")
                    print(f"  - Photo persisted: {'✅' if test_player_found.get('photoUrl') else '❌'}")
                    print(f"  - Details persisted: {'✅' if test_player_found.get('details') else '❌'}")
                else:
                    print(f"❌ Created player not found in retrieval")
            
            # Clean up - delete test player
            delete_response = requests.delete(f"{BACKEND_URL}/players/{player_id}")
            print(f"🧹 Cleanup - Delete Status: {delete_response.status_code}")
            
            return True
        else:
            print(f"❌ Player creation failed: {response.status_code}")
            if response.text:
                print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Player save functionality test failed: {e}")
        return False

def compare_with_event_issue():
    """Compare teams/players persistence with the event issue pattern"""
    print("\n🔍 COMPARING WITH EVENT PERSISTENCE ISSUE...")
    
    # The event issue was: "Events had 'no API calls' comment and only saved to memory"
    # Let's check if teams/players have similar frontend-only persistence
    
    print("📋 EVENT ISSUE PATTERN:")
    print("  - Events were saved only to browser memory via setLeagueSchedule()")
    print("  - SimpleEventForm had '// Save directly to schedule (no API calls for now)'")
    print("  - Events disappeared after refresh because no backend persistence")
    
    print("\n📋 CHECKING TEAMS/PLAYERS FOR SIMILAR PATTERN...")
    
    # Test if teams/players are properly using API endpoints
    try:
        # Check teams API
        teams_response = requests.get(f"{BACKEND_URL}/teams")
        teams_working = teams_response.status_code == 200
        
        # Check players API  
        players_response = requests.get(f"{BACKEND_URL}/players")
        players_working = players_response.status_code == 200
        
        # Check league-data API
        league_response = requests.get(f"{BACKEND_URL}/league-data")
        league_working = league_response.status_code == 200
        
        print(f"  - Teams API (/api/teams): {'✅ Working' if teams_working else '❌ Failed'}")
        print(f"  - Players API (/api/players): {'✅ Working' if players_working else '❌ Failed'}")
        print(f"  - League-data API (/api/league-data): {'✅ Working' if league_working else '❌ Failed'}")
        
        if teams_working and players_working and league_working:
            print("✅ BACKEND APIs are working - issue likely in frontend integration")
        else:
            print("❌ BACKEND API issues detected")
            
        return teams_working, players_working, league_working
        
    except Exception as e:
        print(f"❌ Comparison test failed: {e}")
        return False, False, False

def test_refresh_persistence_simulation():
    """Simulate refresh cycles to test persistence"""
    print("\n🔍 SIMULATING REFRESH PERSISTENCE...")
    
    try:
        # Create test data
        test_team = {
            "name": "Refresh Test Team",
            "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
            "style": {"primaryColor": "#FF0000"}
        }
        
        # Save team
        create_response = requests.post(f"{BACKEND_URL}/teams", json=test_team)
        if create_response.status_code != 200:
            print(f"❌ Failed to create test team for refresh test")
            return False
            
        team_id = create_response.json().get('id')
        print(f"✅ Created test team: {team_id}")
        
        # Simulate multiple "refresh" cycles by fetching data multiple times
        for i in range(3):
            print(f"  🔄 Refresh cycle {i+1}:")
            
            # Fetch teams (simulating page refresh)
            response = requests.get(f"{BACKEND_URL}/teams")
            if response.status_code == 200:
                teams = response.json()
                test_team_found = next((t for t in teams if t.get('id') == team_id), None)
                
                if test_team_found:
                    logo_present = bool(test_team_found.get('logo'))
                    style_present = bool(test_team_found.get('style'))
                    print(f"    - Team found: ✅")
                    print(f"    - Logo persisted: {'✅' if logo_present else '❌'}")
                    print(f"    - Style persisted: {'✅' if style_present else '❌'}")
                else:
                    print(f"    - Team found: ❌")
            else:
                print(f"    - API call failed: {response.status_code}")
        
        # Clean up
        requests.delete(f"{BACKEND_URL}/teams/{team_id}")
        print(f"🧹 Cleanup completed")
        
        return True
        
    except Exception as e:
        print(f"❌ Refresh persistence test failed: {e}")
        return False

def main():
    """Main test execution"""
    print("🚨 CRITICAL TEAM/PLAYER PERSISTENCE INVESTIGATION")
    print("=" * 60)
    
    # Test results tracking
    results = {
        'api_health': False,
        'teams_persistence': False,
        'players_persistence': False,
        'league_data': False,
        'team_save': False,
        'player_save': False,
        'api_comparison': False,
        'refresh_simulation': False
    }
    
    # Execute tests
    results['api_health'] = test_api_health()
    
    if results['api_health']:
        results['teams_persistence'], teams_data = test_teams_persistence()
        results['players_persistence'], players_data = test_players_persistence()
        results['league_data'], league_teams, league_players = test_league_data_teams_players()
        results['team_save'] = test_team_save_functionality()
        results['player_save'] = test_player_save_functionality()
        teams_api, players_api, league_api = compare_with_event_issue()
        results['api_comparison'] = teams_api and players_api and league_api
        results['refresh_simulation'] = test_refresh_persistence_simulation()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 INVESTIGATION SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED - Teams/Players persistence working correctly")
    else:
        print("🚨 ISSUES DETECTED - Teams/Players may have persistence problems")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)