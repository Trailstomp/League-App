#!/usr/bin/env python3
"""
Script to demonstrate tournament bracket integration with the stats system
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def create_tournament_integration():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=== Creating Tournament Integration Example ===")
    
    # Create a sample tournament event with bracket data
    tournament_event = {
        "id": "tournament_fall_championship",
        "title": "Fall Championship Tournament",
        "date": "2025-10-30",
        "type": "tournament",
        "location": "Championship Field",
        "description": "Annual fall tournament with bracket play",
        "bracket": {
            "teams": [
                {"id": "team_eagles", "name": "Eagles"},
                {"id": "team_hawks", "name": "Hawks"}, 
                {"id": "team_lions", "name": "Lions"},
                {"id": "team_tigers", "name": "Tigers"}
            ],
            "format": "single-elimination",
            "rounds": [
                {
                    "name": "Semifinals", 
                    "matches": [
                        {
                            "id": "semi1",
                            "team1": {"id": "team_eagles", "name": "Eagles"},
                            "team2": {"id": "team_hawks", "name": "Hawks"},
                            "score1": 14,
                            "score2": 12,
                            "winner": {"id": "team_eagles", "name": "Eagles"},
                            "status": "completed"
                        },
                        {
                            "id": "semi2", 
                            "team1": {"id": "team_lions", "name": "Lions"},
                            "team2": {"id": "team_tigers", "name": "Tigers"},
                            "score1": 16,
                            "score2": 13,
                            "winner": {"id": "team_lions", "name": "Lions"},
                            "status": "completed"
                        }
                    ]
                },
                {
                    "name": "Finals",
                    "matches": [
                        {
                            "id": "final1",
                            "team1": {"id": "team_eagles", "name": "Eagles"},
                            "team2": {"id": "team_lions", "name": "Lions"},
                            "score1": 18,
                            "score2": 20,
                            "winner": {"id": "team_lions", "name": "Lions"},
                            "status": "completed"
                        }
                    ]
                }
            ]
        }
    }
    
    # Add tournament to league schedule
    league_data = await db.league_data.find_one({"id": "main_league"})
    if league_data:
        current_schedule = league_data.get("leagueSchedule", [])
        
        # Remove existing tournament if it exists
        current_schedule = [e for e in current_schedule if e.get("id") != tournament_event["id"]]
        
        # Add new tournament
        current_schedule.append(tournament_event)
        
        await db.league_data.update_one(
            {"id": "main_league"},
            {"$set": {"leagueSchedule": current_schedule}},
            upsert=True
        )
        
        print("✓ Tournament event added to league schedule")
    
    # Now convert tournament bracket matches to game stats
    print("\nConverting tournament matches to game stats...")
    
    matches_converted = 0
    for round_data in tournament_event["bracket"]["rounds"]:
        for match in round_data["matches"]:
            if match["status"] == "completed" and match.get("score1") is not None and match.get("score2") is not None:
                
                # Create game stats entry for this tournament match
                game_stat = {
                    "id": str(uuid.uuid4()),
                    "event_id": f"{tournament_event['id']}_match_{match['id']}",
                    "tournament_id": tournament_event["id"],
                    "tournament_match_id": match["id"],
                    "season_id": "2025",
                    "status": "final",
                    "date": tournament_event["date"],
                    "location": tournament_event["location"],
                    "match_type": "tournament",
                    "round_name": round_data["name"],
                    "home_team": {
                        "team_id": match["team1"]["id"],
                        "goals_for": match["score1"],
                        "goals_against": match["score2"],
                        "players": [],
                        "goalies": []
                    },
                    "away_team": {
                        "team_id": match["team2"]["id"],
                        "goals_for": match["score2"],
                        "goals_against": match["score1"],
                        "players": [],
                        "goalies": []
                    },
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                
                # Insert the game stat
                await db.game_stats.update_one(
                    {"event_id": game_stat["event_id"]},
                    {"$set": game_stat},
                    upsert=True
                )
                
                matches_converted += 1
                print(f"  ✓ {match['team1']['name']} {match['score1']}-{match['score2']} {match['team2']['name']} ({round_data['name']})")
    
    print(f"\n✅ Tournament integration completed!")
    print(f"  Matches converted: {matches_converted}")
    print(f"  Tournament event: {tournament_event['title']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_tournament_integration())