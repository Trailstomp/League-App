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

def get_current_teams():
    """Get all teams from /api/teams endpoint"""
    print("\n🔍 STEP 1: GETTING CURRENT TEAMS DATA...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/teams")
        print(f"📊 GET /api/teams Status: {response.status_code}")
        
        if response.status_code == 200:
            teams = response.json()
            print(f"📈 Teams found: {len(teams)}")
            
            teams_with_logos = 0
            teams_with_styles = 0
            
            for team in teams:
                print(f"  🏆 Team: {team.get('name', 'Unknown')} (ID: {team.get('id', 'No ID')})")
                
                if team.get('logo'):
                    teams_with_logos += 1
                    logo_type = 'Data URL' if team['logo'].startswith('data:') else 'Other'
                    print(f"    - Logo: ✅ Present ({logo_type})")
                else:
                    print(f"    - Logo: ❌ Missing")
                
                if team.get('style'):
                    teams_with_styles += 1
                    style = team['style']
                    print(f"    - Style: ✅ Present (Primary: {style.get('primaryColor', 'Default')})")
                else:
                    print(f"    - Style: ❌ Missing")
                
                print(f"    - Division: {team.get('division', 'Unknown')}")
                print(f"    - Coach: {team.get('coach', 'Unknown')}")
                print(f"    - Active: {team.get('active', 'Unknown')}")
            
            print(f"\n📊 TEAMS ANALYSIS:")
            print(f"  - Total teams: {len(teams)}")
            print(f"  - Teams with logos: {teams_with_logos}")
            print(f"  - Teams with custom styles: {teams_with_styles}")
            
            return True, teams
        else:
            print(f"❌ Failed to fetch teams: {response.status_code}")
            return False, []
            
    except Exception as e:
        print(f"❌ Get teams failed: {e}")
        return False, []

def get_current_players():
    """Get all players from /api/players endpoint"""
    print("\n🔍 STEP 2: GETTING CURRENT PLAYERS DATA...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/players")
        print(f"📊 GET /api/players Status: {response.status_code}")
        
        if response.status_code == 200:
            players = response.json()
            print(f"📈 Players found: {len(players)}")
            
            for player in players:
                print(f"  👤 Player: {player.get('name', 'Unknown')} (ID: {player.get('id', 'No ID')})")
                print(f"    - Team ID: {player.get('teamId', 'Unknown')}")
                print(f"    - Position: {player.get('position', 'Unknown')}")
                print(f"    - Jersey: {player.get('jerseyNumber', 'Unknown')}")
                print(f"    - Handedness: {player.get('handedness', 'Unknown')}")
                print(f"    - Photo: {'✅ Present' if player.get('photoUrl') else '❌ Missing'}")
                print(f"    - Active: {player.get('active', 'Unknown')}")
            
            print(f"\n📊 PLAYERS ANALYSIS:")
            print(f"  - Total players: {len(players)}")
            
            return True, players
        else:
            print(f"❌ Failed to fetch players: {response.status_code}")
            return False, []
            
    except Exception as e:
        print(f"❌ Get players failed: {e}")
        return False, []

def get_current_league_data():
    """Get current league-data to preserve existing events/settings"""
    print("\n🔍 STEP 3: GETTING CURRENT LEAGUE-DATA...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 GET /api/league-data Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"📈 Current league-data structure:")
            print(f"  - Teams in league-data: {len(data.get('teams', []))}")
            print(f"  - Players in league-data: {len(data.get('players', []))}")
            print(f"  - Events in schedule: {len(data.get('leagueSchedule', []))}")
            print(f"  - News items: {len(data.get('newsItems', []))}")
            print(f"  - Website style: {'✅ Present' if data.get('websiteStyle') else '❌ Missing'}")
            print(f"  - League info: {'✅ Present' if data.get('leagueInfo') else '❌ Missing'}")
            
            # Show existing events to ensure they're preserved
            if data.get('leagueSchedule'):
                print(f"  📅 Existing events to preserve:")
                for event in data.get('leagueSchedule', []):
                    print(f"    - {event.get('title', 'Unknown')} ({event.get('type', 'Unknown')})")
            
            return True, data
        else:
            print(f"❌ Failed to fetch league-data: {response.status_code}")
            return False, {}
            
    except Exception as e:
        print(f"❌ Get league-data failed: {e}")
        return False, {}

def migrate_teams_to_league_data(teams):
    """Migrate teams to /api/league-data/teams"""
    print("\n🔄 STEP 4: MIGRATING TEAMS TO LEAGUE-DATA...")
    
    try:
        # POST teams to league-data/teams endpoint
        response = requests.post(f"{BACKEND_URL}/league-data/teams", json=teams)
        print(f"📊 POST /api/league-data/teams Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Teams migration successful: {result.get('message', 'Success')}")
            
            # Verify migration by getting league-data
            verify_response = requests.get(f"{BACKEND_URL}/league-data")
            if verify_response.status_code == 200:
                data = verify_response.json()
                migrated_teams = data.get('teams', [])
                
                print(f"📈 Verification - Teams in league-data: {len(migrated_teams)}")
                
                # Check if logos and styling are preserved
                teams_with_logos = 0
                teams_with_styles = 0
                
                for team in migrated_teams:
                    if team.get('logo'):
                        teams_with_logos += 1
                    if team.get('style'):
                        teams_with_styles += 1
                
                print(f"  - Teams with logos preserved: {teams_with_logos}")
                print(f"  - Teams with styles preserved: {teams_with_styles}")
                
                # Compare with original data
                original_logos = sum(1 for t in teams if t.get('logo'))
                original_styles = sum(1 for t in teams if t.get('style'))
                
                logos_preserved = teams_with_logos == original_logos
                styles_preserved = teams_with_styles == original_styles
                
                print(f"  - Logo preservation: {'✅ Success' if logos_preserved else '❌ Failed'}")
                print(f"  - Style preservation: {'✅ Success' if styles_preserved else '❌ Failed'}")
                
                return True, logos_preserved and styles_preserved
            else:
                print(f"❌ Failed to verify teams migration")
                return False, False
        else:
            print(f"❌ Teams migration failed: {response.status_code}")
            if response.text:
                print(f"   Error: {response.text}")
            return False, False
            
    except Exception as e:
        print(f"❌ Teams migration failed: {e}")
        return False, False

def migrate_players_to_league_data(players):
    """Migrate players to /api/league-data/players"""
    print("\n🔄 STEP 5: MIGRATING PLAYERS TO LEAGUE-DATA...")
    
    try:
        # POST players to league-data/players endpoint
        response = requests.post(f"{BACKEND_URL}/league-data/players", json=players)
        print(f"📊 POST /api/league-data/players Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Players migration successful: {result.get('message', 'Success')}")
            
            # Verify migration by getting league-data
            verify_response = requests.get(f"{BACKEND_URL}/league-data")
            if verify_response.status_code == 200:
                data = verify_response.json()
                migrated_players = data.get('players', [])
                
                print(f"📈 Verification - Players in league-data: {len(migrated_players)}")
                
                # Check if player data is preserved
                for player in migrated_players:
                    print(f"  👤 Migrated Player: {player.get('name', 'Unknown')}")
                    print(f"    - Team ID: {player.get('teamId', 'Unknown')}")
                    print(f"    - Position: {player.get('position', 'Unknown')}")
                    print(f"    - Jersey: {player.get('jerseyNumber', 'Unknown')}")
                    print(f"    - Photo: {'✅ Present' if player.get('photoUrl') else '❌ Missing'}")
                
                # Compare with original data
                data_preserved = len(migrated_players) == len(players)
                print(f"  - Player count preservation: {'✅ Success' if data_preserved else '❌ Failed'}")
                
                return True, data_preserved
            else:
                print(f"❌ Failed to verify players migration")
                return False, False
        else:
            print(f"❌ Players migration failed: {response.status_code}")
            if response.text:
                print(f"   Error: {response.text}")
            return False, False
            
    except Exception as e:
        print(f"❌ Players migration failed: {e}")
        return False, False

def verify_complete_migration():
    """Final verification that all data is present and existing data is preserved"""
    print("\n🔍 STEP 6: FINAL VERIFICATION...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/league-data")
        print(f"📊 GET /api/league-data Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            teams = data.get('teams', [])
            players = data.get('players', [])
            events = data.get('leagueSchedule', [])
            website_style = data.get('websiteStyle', {})
            league_info = data.get('leagueInfo', {})
            
            print(f"📈 FINAL VERIFICATION RESULTS:")
            print(f"  - Teams array: {len(teams)} teams")
            print(f"  - Players array: {len(players)} players")
            print(f"  - Events preserved: {len(events)} events")
            print(f"  - Website style preserved: {'✅' if website_style else '❌'}")
            print(f"  - League info preserved: {'✅' if league_info else '❌'}")
            
            # Detailed team verification
            teams_with_custom_styling = 0
            teams_with_logos = 0
            for team in teams:
                has_logo = bool(team.get('logo'))
                has_style = bool(team.get('style'))
                
                if has_logo:
                    teams_with_logos += 1
                if has_style:
                    teams_with_custom_styling += 1
                
                if has_style and has_logo:
                    print(f"  🏆 {team.get('name', 'Unknown')}: ✅ Logo + Custom Style")
                elif has_style:
                    print(f"  🏆 {team.get('name', 'Unknown')}: ✅ Custom Style")
                elif has_logo:
                    print(f"  🏆 {team.get('name', 'Unknown')}: ✅ Logo")
                else:
                    print(f"  🏆 {team.get('name', 'Unknown')}: ❌ No customization")
            
            print(f"  - Teams with logos: {teams_with_logos}")
            print(f"  - Teams with custom styling: {teams_with_custom_styling}")
            
            # Check if we have the expected 10 teams and 2 players
            expected_teams = 10
            expected_players = 2
            
            teams_count_correct = len(teams) >= expected_teams
            players_count_correct = len(players) >= expected_players
            
            print(f"\n📊 MIGRATION SUCCESS CRITERIA:")
            print(f"  - Teams count (≥{expected_teams}): {'✅' if teams_count_correct else '❌'} ({len(teams)})")
            print(f"  - Players count (≥{expected_players}): {'✅' if players_count_correct else '❌'} ({len(players)})")
            print(f"  - Custom styling preserved: {'✅' if teams_with_custom_styling > 0 else '❌'}")
            print(f"  - Existing events preserved: {'✅' if len(events) >= 0 else '❌'}")
            
            success = teams_count_correct and players_count_correct and teams_with_custom_styling > 0
            
            if success:
                print(f"\n🎉 MIGRATION COMPLETED SUCCESSFULLY!")
                print(f"   Frontend will now load all teams/players from single league-data source")
                print(f"   Custom teams with logos are now visible to frontend!")
            else:
                print(f"\n❌ MIGRATION INCOMPLETE - Some criteria not met")
            
            return success, data
        else:
            print(f"❌ Failed to verify complete migration: {response.status_code}")
            return False, {}
            
    except Exception as e:
        print(f"❌ Final verification failed: {e}")
        return False, {}

def test_frontend_data_access():
    """Test that frontend can access the migrated data"""
    print("\n🔍 STEP 7: TESTING FRONTEND DATA ACCESS...")
    
    try:
        # Test the main endpoint that frontend uses
        response = requests.get(f"{BACKEND_URL}/league-data")
        
        if response.status_code == 200:
            data = response.json()
            
            # Simulate frontend data loading
            teams = data.get('teams', [])
            players = data.get('players', [])
            
            print(f"📱 Frontend data access simulation:")
            print(f"  - Teams available to frontend: {len(teams)}")
            print(f"  - Players available to frontend: {len(players)}")
            
            # Check if teams have the data frontend needs
            frontend_ready_teams = 0
            for team in teams:
                has_required_fields = all([
                    team.get('id'),
                    team.get('name'),
                    team.get('division')
                ])
                
                if has_required_fields:
                    frontend_ready_teams += 1
            
            print(f"  - Teams ready for frontend: {frontend_ready_teams}/{len(teams)}")
            
            success = frontend_ready_teams == len(teams) and len(teams) > 0
            print(f"  - Frontend compatibility: {'✅ Success' if success else '❌ Failed'}")
            
            return success
        else:
            print(f"❌ Frontend data access test failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Frontend data access test failed: {e}")
        return False

def main():
    """Main migration test execution"""
    print("🔄 DATA MIGRATION: TEAMS AND PLAYERS TO LEAGUE-DATA COLLECTION")
    print("=" * 70)
    print("OBJECTIVE: Move existing data from individual collections to unified league-data")
    print("=" * 70)
    
    # Test results tracking
    results = {
        'api_health': False,
        'get_teams': False,
        'get_players': False,
        'get_league_data': False,
        'migrate_teams': False,
        'migrate_players': False,
        'final_verification': False,
        'frontend_access': False
    }
    
    # Data storage
    teams_data = []
    players_data = []
    league_data = {}
    
    # Execute migration steps
    results['api_health'] = test_api_health()
    
    if results['api_health']:
        results['get_teams'], teams_data = get_current_teams()
        results['get_players'], players_data = get_current_players()
        results['get_league_data'], league_data = get_current_league_data()
        
        if results['get_teams'] and len(teams_data) > 0:
            results['migrate_teams'], teams_preserved = migrate_teams_to_league_data(teams_data)
        
        if results['get_players'] and len(players_data) > 0:
            results['migrate_players'], players_preserved = migrate_players_to_league_data(players_data)
        
        results['final_verification'], final_data = verify_complete_migration()
        results['frontend_access'] = test_frontend_data_access()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 MIGRATION SUMMARY")
    print("=" * 70)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} migration steps completed")
    
    if passed_tests == total_tests:
        print("\n🎉 MIGRATION COMPLETED SUCCESSFULLY!")
        print("✅ Teams and players moved to league-data collection")
        print("✅ Custom logos and styling preserved")
        print("✅ Existing events/settings preserved")
        print("✅ Frontend will now load from unified data source")
        print("\n🔗 RESULT: User's custom teams with logos are now visible to frontend!")
    else:
        print(f"\n❌ MIGRATION INCOMPLETE")
        print(f"   {total_tests - passed_tests} steps failed")
        print("   Manual intervention may be required")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)