#!/usr/bin/env python3
"""
Script to help migrate real pre-production team and tournament data
This should be run in your pre-production environment to replace sample data with real data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def migrate_real_data():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=== MIGRATE REAL PRE-PRODUCTION DATA ===")
    print("This script helps you replace sample data with your real team/tournament data")
    print()
    
    # Step 1: Clear sample teams and add real teams
    print("Step 1: Replace sample teams with your real teams")
    print("Current teams in database:")
    
    current_teams = await db.teams.find().to_list(None)
    for team in current_teams:
        print(f"  - {team.get('name', 'Unknown')}")
    
    print()
    print("To replace with your real teams, you need to:")
    print("1. Delete current sample teams")
    print("2. Add your real teams with proper structure")
    print()
    
    # Example of what real teams should look like
    example_real_teams = [
        {
            "id": "your_team_1_id",  # Use your actual team IDs
            "name": "Your Team Name 1",  # Your actual team names
            "league_id": "main_league",
            "division_id": "premier_division",  # or "division_1" based on your divisions
            "division": "Premier Division",  # Your actual division names
            "color": "#your_team_color",
            "logo": "https://your-team-logo-url.com",
            "active": True,
            "created_at": datetime.now(timezone.utc)
        }
        # Add more teams as needed
    ]
    
    print("Example real team structure:")
    print("```python")
    for team in example_real_teams:
        print(f"  {team}")
    print("```")
    print()
    
    # Step 2: Check for tournament/game data with scores
    print("Step 2: Tournament/Game Data Analysis")
    league_data = await db.league_data.find_one({"id": "main_league"})
    
    if league_data and "leagueSchedule" in league_data:
        events = league_data["leagueSchedule"]
        
        # Find events with scores (tournaments/games)
        scored_events = []
        tournament_events = []
        
        for event in events:
            if event.get("type") == "tournament" and "bracket" in event:
                tournament_events.append(event)
            elif "homeScore" in event or "awayScore" in event:
                scored_events.append(event)
        
        print(f"Found {len(scored_events)} games with scores")
        print(f"Found {len(tournament_events)} tournaments with brackets")
        print()
        
        if scored_events:
            print("Sample scored game:")
            sample = scored_events[0]
            print(f"  {sample.get('title', 'Unknown')}: {sample.get('homeScore', 0)}-{sample.get('awayScore', 0)}")
            print(f"  Teams: {sample.get('homeTeam', 'Unknown')} vs {sample.get('awayTeam', 'Unknown')}")
            print()
        
        if tournament_events:
            print("Sample tournament:")
            tournament = tournament_events[0]
            bracket = tournament.get('bracket', {})
            rounds = bracket.get('rounds', [])
            print(f"  {tournament.get('title', 'Unknown')}")
            print(f"  Teams: {len(bracket.get('teams', []))}")
            print(f"  Rounds: {len(rounds)}")
            print()
        
        # Step 3: Instructions for data migration
        print("Step 3: Data Migration Instructions")
        print("=" * 50)
        print()
        print("TO MIGRATE YOUR REAL DATA:")
        print()
        print("1. TEAMS MIGRATION:")
        print("   - Export your real team data from your current system")
        print("   - Use this format for each team:")
        print("   ```")
        print("   {")
        print("     'id': 'unique_team_id',")
        print("     'name': 'Team Name',")
        print("     'league_id': 'main_league',")
        print("     'division_id': 'premier_division' or 'division_1',")
        print("     'division': 'Premier Division' or 'Division 1',")
        print("     'color': '#team_color',")
        print("     'logo': 'team_logo_url',")
        print("     'active': True")
        print("   }")
        print("   ```")
        print()
        print("2. TOURNAMENT SCORES MIGRATION:")
        print("   - If you have tournaments with bracket data, use:")
        print("   curl -X POST {BACKEND_URL}/api/tournaments/{tournament_id}/sync-bracket-scores")
        print()
        print("3. GAME SCORES MIGRATION:")
        print("   - Your existing games with homeScore/awayScore will automatically")
        print("     be converted to game stats when teams are properly linked")
        print()
        print("4. VERIFY STANDINGS:")
        print("   - After migration, check /api/league/standings")
        print("   - Verify teams appear in correct divisions")
        print("   - Confirm tournament/game scores populate standings")
        print()
        
        # Step 4: Automated conversion for existing scored games
        print("Step 4: Auto-convert existing scored games")
        print("=" * 40)
        
        games_converted = 0
        for event in scored_events:
            if "homeScore" in event and "awayScore" in event:
                # Check if game stats already exist
                existing = await db.game_stats.find_one({"event_id": event["id"]})
                
                if not existing:
                    game_stat = {
                        "id": str(uuid.uuid4()),
                        "event_id": event["id"],
                        "season_id": "2025",
                        "status": "final",
                        "date": event.get("date", datetime.now().strftime("%Y-%m-%d")),
                        "location": event.get("location", "Unknown"),
                        "home_team": {
                            "team_id": event.get("homeTeam", "unknown"),
                            "goals_for": event.get("homeScore", 0),
                            "goals_against": event.get("awayScore", 0),
                            "players": [],
                            "goalies": []
                        },
                        "away_team": {
                            "team_id": event.get("awayTeam", "unknown"),
                            "goals_for": event.get("awayScore", 0),
                            "goals_against": event.get("homeScore", 0),
                            "players": [],
                            "goalies": []
                        },
                        "created_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    }
                    
                    await db.game_stats.insert_one(game_stat)
                    games_converted += 1
                    print(f"  ✓ Converted: {event.get('title', 'Unknown')}")
        
        if games_converted > 0:
            print(f"\n✅ Converted {games_converted} games to stats system")
        else:
            print("\n📝 No new games to convert (already converted)")
    
    print("\n" + "=" * 60)
    print("NEXT STEPS FOR YOU:")
    print("1. Replace the sample teams with your real team data")
    print("2. Run tournament sync for any tournaments with brackets") 
    print("3. Test the standings page to see your real data")
    print("4. Verify ticker is scrolling with your events")
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_real_data())