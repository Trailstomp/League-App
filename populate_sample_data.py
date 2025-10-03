#!/usr/bin/env python3
"""
Script to populate the database with sample teams and game data to demonstrate the standings system
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def populate_sample_data():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=== Populating Sample Data ===")
    
    # Sample teams for a lacrosse league
    sample_teams = [
        {
            "id": "team_eagles",
            "name": "Eagles",
            "division": "Premier",
            "color": "#1e40af",
            "logo": "https://via.placeholder.com/100/1e40af/ffffff?text=E",
            "active": True
        },
        {
            "id": "team_hawks",
            "name": "Hawks", 
            "division": "Premier",
            "color": "#dc2626",
            "logo": "https://via.placeholder.com/100/dc2626/ffffff?text=H",
            "active": True
        },
        {
            "id": "team_lions",
            "name": "Lions",
            "division": "Division 1",
            "color": "#f59e0b",
            "logo": "https://via.placeholder.com/100/f59e0b/ffffff?text=L",
            "active": True
        },
        {
            "id": "team_wolves",
            "name": "Wolves",
            "division": "Division 1", 
            "color": "#374151",
            "logo": "https://via.placeholder.com/100/374151/ffffff?text=W",
            "active": True
        },
        {
            "id": "team_tigers",
            "name": "Tigers",
            "division": "Premier",
            "color": "#ea580c",
            "logo": "https://via.placeholder.com/100/ea580c/ffffff?text=T",
            "active": True
        },
        {
            "id": "team_bears",
            "name": "Bears",
            "division": "Division 1",
            "color": "#7c2d12",
            "logo": "https://via.placeholder.com/100/7c2d12/ffffff?text=B",
            "active": True
        }
    ]
    
    print(f"Creating {len(sample_teams)} teams...")
    
    # Insert teams into the teams collection
    for team in sample_teams:
        await db.teams.update_one(
            {"id": team["id"]},
            {"$set": team},
            upsert=True
        )
        print(f"  ✓ {team['name']} ({team['division']})")
    
    # Also update the league_data document to include teams
    await db.league_data.update_one(
        {"id": "main_league"},
        {"$set": {"teams": sample_teams}},
        upsert=True
    )
    
    # Sample game statistics to populate standings
    sample_game_stats = [
        {
            "id": str(uuid.uuid4()),
            "event_id": "game_eagles_vs_hawks",
            "season_id": "2025",
            "status": "final",
            "date": "2025-09-15",
            "location": "Central Field",
            "home_team": {
                "team_id": "team_eagles",
                "goals_for": 12,
                "goals_against": 8,
                "players": [],
                "goalies": []
            },
            "away_team": {
                "team_id": "team_hawks", 
                "goals_for": 8,
                "goals_against": 12,
                "players": [],
                "goalies": []
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "event_id": "game_lions_vs_wolves",
            "season_id": "2025",
            "status": "final", 
            "date": "2025-09-16",
            "location": "North Field",
            "home_team": {
                "team_id": "team_lions",
                "goals_for": 10,
                "goals_against": 7,
                "players": [],
                "goalies": []
            },
            "away_team": {
                "team_id": "team_wolves",
                "goals_for": 7,
                "goals_against": 10,
                "players": [],
                "goalies": []
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "event_id": "game_tigers_vs_bears",
            "season_id": "2025",
            "status": "final",
            "date": "2025-09-17", 
            "location": "South Field",
            "home_team": {
                "team_id": "team_tigers",
                "goals_for": 15,
                "goals_against": 9,
                "players": [],
                "goalies": []
            },
            "away_team": {
                "team_id": "team_bears",
                "goals_for": 9,
                "goals_against": 15,
                "players": [],
                "goalies": []
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        # Second round of games
        {
            "id": str(uuid.uuid4()),
            "event_id": "game_eagles_vs_lions", 
            "season_id": "2025",
            "status": "final",
            "date": "2025-09-22",
            "location": "Central Field",
            "home_team": {
                "team_id": "team_eagles",
                "goals_for": 9,
                "goals_against": 11,
                "players": [],
                "goalies": []
            },
            "away_team": {
                "team_id": "team_lions",
                "goals_for": 11,
                "goals_against": 9,
                "players": [],
                "goalies": []
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "event_id": "game_hawks_vs_tigers",
            "season_id": "2025", 
            "status": "final",
            "date": "2025-09-23",
            "location": "North Field",
            "home_team": {
                "team_id": "team_hawks",
                "goals_for": 13,
                "goals_against": 10,
                "players": [],
                "goalies": []
            },
            "away_team": {
                "team_id": "team_tigers",
                "goals_for": 10,
                "goals_against": 13,
                "players": [],
                "goalies": []
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    print(f"\nCreating {len(sample_game_stats)} game statistics...")
    
    # Insert game stats
    for game_stat in sample_game_stats:
        await db.game_stats.update_one(
            {"event_id": game_stat["event_id"]},
            {"$set": game_stat},
            upsert=True
        )
        home_team = game_stat["home_team"]
        away_team = game_stat["away_team"] 
        print(f"  ✓ {home_team['goals_for']}-{away_team['goals_for']} game added")
    
    # Add some sample events to match the game stats
    league_data = await db.league_data.find_one({"id": "main_league"})
    if league_data:
        current_schedule = league_data.get("leagueSchedule", [])
        
        sample_events = [
            {
                "id": "game_eagles_vs_hawks",
                "title": "Eagles vs Hawks", 
                "date": "2025-09-15",
                "location": "Central Field",
                "type": "game",
                "homeTeam": "team_eagles",
                "awayTeam": "team_hawks",
                "homeScore": 12,
                "awayScore": 8
            },
            {
                "id": "game_lions_vs_wolves",
                "title": "Lions vs Wolves",
                "date": "2025-09-16", 
                "location": "North Field",
                "type": "game",
                "homeTeam": "team_lions",
                "awayTeam": "team_wolves",
                "homeScore": 10,
                "awayScore": 7
            },
            {
                "id": "game_tigers_vs_bears",
                "title": "Tigers vs Bears",
                "date": "2025-09-17",
                "location": "South Field", 
                "type": "game",
                "homeTeam": "team_tigers",
                "awayTeam": "team_bears",
                "homeScore": 15,
                "awayScore": 9
            },
            {
                "id": "game_eagles_vs_lions",
                "title": "Eagles vs Lions",
                "date": "2025-09-22",
                "location": "Central Field",
                "type": "game", 
                "homeTeam": "team_eagles",
                "awayTeam": "team_lions",
                "homeScore": 9,
                "awayScore": 11
            },
            {
                "id": "game_hawks_vs_tigers", 
                "title": "Hawks vs Tigers",
                "date": "2025-09-23",
                "location": "North Field",
                "type": "game",
                "homeTeam": "team_hawks",
                "awayTeam": "team_tigers", 
                "homeScore": 13,
                "awayScore": 10
            }
        ]
        
        # Add sample events to existing schedule
        for event in sample_events:
            if not any(e.get("id") == event["id"] for e in current_schedule):
                current_schedule.append(event)
        
        await db.league_data.update_one(
            {"id": "main_league"},
            {"$set": {"leagueSchedule": current_schedule}},
            upsert=True
        )
        
        print(f"\nAdded {len(sample_events)} sample events to league schedule")
    
    print("\n✅ Sample data population completed!")
    print("\nData Summary:")
    print(f"  Teams: {len(sample_teams)}")
    print(f"  Game Stats: {len(sample_game_stats)}")
    print(f"  Events: {len(sample_events) if league_data else 0}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_sample_data())