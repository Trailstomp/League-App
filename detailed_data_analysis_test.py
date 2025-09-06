#!/usr/bin/env python3
"""
Detailed Data Analysis Test - Examine actual team data quality and completeness
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

class DetailedDataAnalyzer:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        
        print("🔍 DETAILED DATA ANALYSIS")
        print("=" * 60)
        print(f"Analyzing data at: {self.api_base}")
        print("=" * 60)

    def analyze_teams_data(self):
        """Analyze teams data in detail"""
        print("📊 TEAMS DATA ANALYSIS")
        print("-" * 40)
        
        # Get teams from individual collection
        try:
            response = requests.get(f"{self.api_base}/teams", timeout=10)
            if response.status_code == 200:
                individual_teams = response.json()
                print(f"✅ Individual Teams Collection: {len(individual_teams)} teams found")
                
                for i, team in enumerate(individual_teams):
                    print(f"\n  Team {i+1}:")
                    print(f"    ID: {team.get('id', 'Missing')}")
                    print(f"    Name: {team.get('name', 'Missing')}")
                    print(f"    Division: {team.get('division', 'Missing')}")
                    print(f"    Coach: {team.get('coach', 'Missing')}")
                    print(f"    Record: {team.get('wins', 0)}-{team.get('losses', 0)}-{team.get('ties', 0)}")
                    print(f"    Active: {team.get('active', 'Unknown')}")
                    
                    # Check team style
                    style = team.get('style', {})
                    if style:
                        print(f"    Style: Primary={style.get('primaryColor', 'None')}, Background={style.get('backgroundColor', 'None')}")
                    else:
                        print(f"    Style: No styling data")
            else:
                print(f"❌ Cannot access individual teams: HTTP {response.status_code}")
                individual_teams = []
        except Exception as e:
            print(f"❌ Error accessing individual teams: {e}")
            individual_teams = []
        
        # Get teams from league data
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code == 200:
                league_data = response.json()
                league_teams = league_data.get('teams', [])
                print(f"\n✅ League Data Teams: {len(league_teams)} teams found")
                
                for i, team in enumerate(league_teams):
                    print(f"\n  League Team {i+1}:")
                    print(f"    ID: {team.get('id', 'Missing')}")
                    print(f"    Name: {team.get('name', 'Missing')}")
                    print(f"    Division: {team.get('division', 'Missing')}")
                    print(f"    Coach: {team.get('coach', 'Missing')}")
                    
                return individual_teams, league_teams
            else:
                print(f"❌ Cannot access league data: HTTP {response.status_code}")
                return individual_teams, []
        except Exception as e:
            print(f"❌ Error accessing league data: {e}")
            return individual_teams, []

    def analyze_website_style(self):
        """Analyze website style customizations"""
        print("\n🎨 WEBSITE STYLE ANALYSIS")
        print("-" * 40)
        
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code == 200:
                league_data = response.json()
                website_style = league_data.get('websiteStyle', {})
                
                print(f"✅ Website Style Data: {len(website_style)} properties found")
                
                if website_style:
                    print("\n  Style Properties:")
                    for key, value in website_style.items():
                        if isinstance(value, str) and len(value) > 50:
                            print(f"    {key}: {value[:50]}... (truncated)")
                        else:
                            print(f"    {key}: {value}")
                else:
                    print("  ❌ No website customizations found")
                
                return website_style
            else:
                print(f"❌ Cannot access website style: HTTP {response.status_code}")
                return {}
        except Exception as e:
            print(f"❌ Error accessing website style: {e}")
            return {}

    def analyze_players_data(self):
        """Analyze players data"""
        print("\n👥 PLAYERS DATA ANALYSIS")
        print("-" * 40)
        
        try:
            response = requests.get(f"{self.api_base}/players", timeout=10)
            if response.status_code == 200:
                players = response.json()
                print(f"✅ Players Collection: {len(players)} players found")
                
                if players:
                    for i, player in enumerate(players):
                        print(f"\n  Player {i+1}:")
                        print(f"    ID: {player.get('id', 'Missing')}")
                        print(f"    Name: {player.get('name', 'Missing')}")
                        print(f"    Team ID: {player.get('teamId', 'Missing')}")
                        print(f"    Position: {player.get('position', 'Missing')}")
                        print(f"    Jersey: #{player.get('jerseyNumber', 'None')}")
                        print(f"    Active: {player.get('active', 'Unknown')}")
                else:
                    print("  ℹ️ No players found in database")
                
                return players
            else:
                print(f"❌ Cannot access players: HTTP {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ Error accessing players: {e}")
            return []

    def analyze_league_schedule(self):
        """Analyze league schedule/events data"""
        print("\n📅 LEAGUE SCHEDULE ANALYSIS")
        print("-" * 40)
        
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code == 200:
                league_data = response.json()
                schedule = league_data.get('leagueSchedule', [])
                
                print(f"✅ League Schedule: {len(schedule)} events found")
                
                if schedule:
                    for i, event in enumerate(schedule):
                        print(f"\n  Event {i+1}:")
                        print(f"    ID: {event.get('id', 'Missing')}")
                        print(f"    Title: {event.get('title', 'Missing')}")
                        print(f"    Date: {event.get('date', 'Missing')}")
                        print(f"    Time: {event.get('time', 'Missing')}")
                        print(f"    Location: {event.get('location', 'Missing')}")
                        print(f"    Type: {event.get('type', 'Missing')}")
                        print(f"    Team IDs: {event.get('teamIds', [])}")
                else:
                    print("  ℹ️ No events found in schedule")
                
                return schedule
            else:
                print(f"❌ Cannot access league schedule: HTTP {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ Error accessing league schedule: {e}")
            return []

    def test_data_recovery_capability(self):
        """Test if we can recover/create proper team data"""
        print("\n🔧 DATA RECOVERY CAPABILITY TEST")
        print("-" * 40)
        
        # Test creating a properly structured team
        recovery_team = {
            "id": f"recovery_test_{int(datetime.utcnow().timestamp())}",
            "name": "MLBL Recovery Test Team",
            "division": "Field",
            "coach": "Recovery Coach",
            "homeField": "Recovery Field",
            "logo": "",
            "contactEmail": "recovery@mlbl.org",
            "active": True,
            "wins": 8,
            "losses": 2,
            "ties": 1,
            "style": {
                "primaryColor": "#FF6B35",
                "backgroundColor": "#FFF5F5",
                "accentColor": "#004E89",
                "logoUrl": "",
                "logoOpacity": 1.0,
                "bannerUrl": ""
            }
        }
        
        try:
            response = requests.post(
                f"{self.api_base}/teams",
                json=recovery_team,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                created_team = response.json()
                print(f"✅ Recovery Team Creation: Successfully created team")
                print(f"    Team ID: {created_team.get('id')}")
                print(f"    Team Name: {created_team.get('name')}")
                print(f"    Style Colors: {created_team.get('style', {}).get('primaryColor', 'None')}")
                
                # Test creating a player for this team
                recovery_player = {
                    "id": f"recovery_player_{int(datetime.utcnow().timestamp())}",
                    "name": "Recovery Test Player",
                    "teamId": created_team.get('id'),
                    "position": "Attack",
                    "jerseyNumber": 99,
                    "email": "player@mlbl.org",
                    "phone": "555-0199",
                    "active": True
                }
                
                player_response = requests.post(
                    f"{self.api_base}/players",
                    json=recovery_player,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if player_response.status_code == 200:
                    created_player = player_response.json()
                    print(f"✅ Recovery Player Creation: Successfully created player")
                    print(f"    Player ID: {created_player.get('id')}")
                    print(f"    Player Name: {created_player.get('name')}")
                    print(f"    Jersey Number: #{created_player.get('jerseyNumber')}")
                else:
                    print(f"❌ Recovery Player Creation Failed: HTTP {player_response.status_code}")
                
                return True
            else:
                print(f"❌ Recovery Team Creation Failed: HTTP {response.status_code}")
                print(f"    Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Recovery Test Error: {e}")
            return False

    def run_analysis(self):
        """Run complete data analysis"""
        print("🔍 STARTING DETAILED DATA ANALYSIS")
        print("=" * 60)
        
        # Analyze all data types
        individual_teams, league_teams = self.analyze_teams_data()
        website_style = self.analyze_website_style()
        players = self.analyze_players_data()
        schedule = self.analyze_league_schedule()
        
        # Test recovery capability
        recovery_works = self.test_data_recovery_capability()
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 DETAILED ANALYSIS SUMMARY")
        print("=" * 60)
        
        print(f"Individual Teams Collection: {len(individual_teams)} teams")
        print(f"League Data Teams: {len(league_teams)} teams")
        print(f"Players: {len(players)} players")
        print(f"Website Style Properties: {len(website_style)} properties")
        print(f"League Schedule Events: {len(schedule)} events")
        print(f"Data Recovery Capability: {'✅ Working' if recovery_works else '❌ Failed'}")
        
        # Data Quality Assessment
        print(f"\n🎯 DATA QUALITY ASSESSMENT:")
        
        # Check for empty/placeholder data
        empty_team_names = sum(1 for team in individual_teams if not team.get('name') or team.get('name').strip() == '')
        if empty_team_names > 0:
            print(f"  ⚠️ Found {empty_team_names} teams with empty names")
        
        # Check for missing team styles
        teams_without_style = sum(1 for team in individual_teams if not team.get('style'))
        if teams_without_style > 0:
            print(f"  ⚠️ Found {teams_without_style} teams without styling data")
        
        # Check data synchronization
        if len(individual_teams) != len(league_teams):
            print(f"  ⚠️ Data synchronization issue: Individual ({len(individual_teams)}) vs League ({len(league_teams)}) teams")
        
        # Overall assessment
        total_data_points = len(individual_teams) + len(players) + len(website_style) + len(schedule)
        
        if total_data_points == 0:
            print(f"\n🚨 CRITICAL: Complete data loss confirmed - no user data found")
        elif total_data_points < 5:
            print(f"\n⚠️ WARNING: Minimal data found - significant data loss likely")
        else:
            print(f"\n✅ GOOD: Substantial data found - system appears functional")
        
        return total_data_points > 0

if __name__ == "__main__":
    try:
        analyzer = DetailedDataAnalyzer()
        success = analyzer.run_analysis()
        
        if success:
            print("\n✅ Data analysis completed - data found in system")
            sys.exit(0)
        else:
            print("\n🚨 Data analysis completed - critical data loss confirmed")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Analysis setup failed: {e}")
        sys.exit(1)