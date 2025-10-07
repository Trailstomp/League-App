#!/usr/bin/env python3
"""
Script to add sample tournament events and teams to the lacrosse league system
"""
import asyncio
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.lacrosse_league

async def setup_tournament_data():
    """Add sample tournament events and teams to the system"""
    
    # Sample teams data
    sample_teams = [
        {
            "id": "eagles_01",
            "name": "Eagles",
            "division": "Premier Division",
            "style": {
                "logoUrl": "https://drive.google.com/thumbnail?id=1kp03UYRkohLr6uaarm8WyxwVYIslc3s0&sz=w1000",
                "primaryColor": "#1e40af",
                "secondaryColor": "#3b82f6"
            }
        },
        {
            "id": "hawks_01",
            "name": "Hawks", 
            "division": "Premier Division",
            "style": {
                "logoUrl": "https://drive.google.com/thumbnail?id=1abc123def456ghi789&sz=w1000",
                "primaryColor": "#dc2626",
                "secondaryColor": "#f87171"
            }
        },
        {
            "id": "lions_01",
            "name": "Lions",
            "division": "Division 1", 
            "style": {
                "logoUrl": "https://drive.google.com/thumbnail?id=1xyz789abc456def123&sz=w1000",
                "primaryColor": "#f59e0b",
                "secondaryColor": "#fbbf24"
            }
        },
        {
            "id": "tigers_01", 
            "name": "Tigers",
            "division": "Division 1",
            "style": {
                "logoUrl": "https://drive.google.com/thumbnail?id=1qwe456rty789uio123&sz=w1000",
                "primaryColor": "#16a34a",
                "secondaryColor": "#4ade80"
            }
        }
    ]

    # Sample tournament event
    tournament_event = {
        "id": "spring_championship_2025",
        "title": "Spring Championship Tournament",
        "type": "tournament",
        "date": "2025-01-15",
        "time": "9:00 AM",
        "location": "Championship Fields",
        "description": "Annual spring championship tournament featuring all divisions",
        "teams": [
            {"id": "eagles_01", "name": "Eagles"},
            {"id": "hawks_01", "name": "Hawks"},
            {"id": "lions_01", "name": "Lions"},
            {"id": "tigers_01", "name": "Tigers"}
        ],
        "bracket": {
            "format": "single-elimination",
            "teams": [
                {"id": "eagles_01", "name": "Eagles"},
                {"id": "hawks_01", "name": "Hawks"},
                {"id": "lions_01", "name": "Lions"},
                {"id": "tigers_01", "name": "Tigers"}
            ],
            "rounds": [
                {
                    "name": "Semifinals",
                    "matches": [
                        {
                            "id": "match_semi_1",
                            "team1": {"id": "eagles_01", "name": "Eagles"},
                            "team2": {"id": "hawks_01", "name": "Hawks"},
                            "score1": None,
                            "score2": None,
                            "winner": None,
                            "status": "pending"
                        },
                        {
                            "id": "match_semi_2", 
                            "team1": {"id": "lions_01", "name": "Lions"},
                            "team2": {"id": "tigers_01", "name": "Tigers"},
                            "score1": None,
                            "score2": None,
                            "winner": None,
                            "status": "pending"
                        }
                    ]
                },
                {
                    "name": "Finals",
                    "matches": [
                        {
                            "id": "match_final",
                            "team1": None,
                            "team2": None,
                            "score1": None,
                            "score2": None,
                            "winner": None,
                            "status": "pending"
                        }
                    ]
                }
            ]
        }
    }

    try:
        # Get the main league data
        league_data = await db.league_data.find_one({"id": "main_league"})
        if not league_data:
            print("❌ Main league data not found")
            return
            
        # Add teams to the league data
        if "teams" not in league_data:
            league_data["teams"] = []
            
        # Add sample teams (avoid duplicates)
        existing_team_ids = {team.get("id") for team in league_data["teams"]}
        for team in sample_teams:
            if team["id"] not in existing_team_ids:
                league_data["teams"].append(team)
                print(f"✅ Added team: {team['name']}")
            else:
                print(f"⚠️ Team {team['name']} already exists")

        # Add tournament event to league schedule
        if "leagueSchedule" not in league_data:
            league_data["leagueSchedule"] = []
            
        # Check if tournament already exists
        existing_event_ids = {event.get("id") for event in league_data["leagueSchedule"]}
        if tournament_event["id"] not in existing_event_ids:
            league_data["leagueSchedule"].append(tournament_event)
            print(f"✅ Added tournament: {tournament_event['title']}")
        else:
            print(f"⚠️ Tournament {tournament_event['title']} already exists")

        # Update the league data
        await db.league_data.update_one(
            {"id": "main_league"},
            {"$set": league_data}
        )

        # Also create teams in the dedicated teams collection for stats
        for team in sample_teams:
            team_record = {
                **team,
                "stats": {
                    "games_played": 0,
                    "wins": 0,
                    "losses": 0,
                    "ties": 0,
                    "goals_for": 0,
                    "goals_against": 0,
                    "points": 0
                },
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            # Upsert team record
            await db.teams.update_one(
                {"id": team["id"]},
                {"$set": team_record},
                upsert=True
            )
            print(f"✅ Created/updated team record: {team['name']}")

        print("\n🏆 Tournament data setup completed successfully!")
        print(f"📊 Teams added: {len(sample_teams)}")
        print(f"🎯 Tournament events added: 1")
        print(f"🏁 Tournament ID: {tournament_event['id']}")
        
    except Exception as e:
        print(f"❌ Error setting up tournament data: {e}")

if __name__ == "__main__":
    asyncio.run(setup_tournament_data())