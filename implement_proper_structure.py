#!/usr/bin/env python3
"""
Implement proper multi-league and division management system
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def implement_league_system():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=== Implementing Multi-League and Division System ===")
    
    # 1. Create leagues collection
    leagues = [
        {
            "id": "main_league",
            "name": "Main League",
            "description": "Primary lacrosse league",
            "sport": "lacrosse",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "settings": {
                "allow_divisions": True,
                "points_for_win": 2,
                "points_for_tie": 1,
                "points_for_loss": 0
            }
        }
    ]
    
    for league in leagues:
        await db.leagues.update_one(
            {"id": league["id"]},
            {"$set": league},
            upsert=True
        )
        print(f"✓ Created league: {league['name']}")
    
    # 2. Create divisions collection
    divisions = [
        {
            "id": "premier_division",
            "name": "Premier Division",
            "league_id": "main_league",
            "description": "Top tier division",
            "level": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "division_1",
            "name": "Division 1", 
            "league_id": "main_league",
            "description": "Second tier division",
            "level": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "division_2",
            "name": "Division 2",
            "league_id": "main_league", 
            "description": "Third tier division",
            "level": 3,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for division in divisions:
        await db.divisions.update_one(
            {"id": division["id"]},
            {"$set": division},
            upsert=True
        )
        print(f"✓ Created division: {division['name']} (Level {division['level']})")
    
    # 3. Update existing teams with proper league and division references
    team_updates = [
        {"name": "Eagles", "division_id": "premier_division", "division_name": "Premier Division"},
        {"name": "Hawks", "division_id": "premier_division", "division_name": "Premier Division"},
        {"name": "Tigers", "division_id": "premier_division", "division_name": "Premier Division"},
        {"name": "Lions", "division_id": "division_1", "division_name": "Division 1"},
        {"name": "Wolves", "division_id": "division_1", "division_name": "Division 1"},
        {"name": "Bears", "division_id": "division_1", "division_name": "Division 1"},
    ]
    
    for team_update in team_updates:
        await db.teams.update_one(
            {"name": team_update["name"]},
            {"$set": {
                "league_id": "main_league",
                "division_id": team_update["division_id"],
                "division": team_update["division_name"],  # Keep for backward compatibility
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        print(f"✓ Updated {team_update['name']} -> {team_update['division_name']}")
    
    # 4. Create sample additional league to demonstrate multi-league capability
    youth_league = {
        "id": "youth_league", 
        "name": "Youth League",
        "description": "Youth lacrosse league (Under 18)",
        "sport": "lacrosse",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "settings": {
            "allow_divisions": True,
            "points_for_win": 2,
            "points_for_tie": 1,
            "points_for_loss": 0,
            "max_age": 18
        }
    }
    
    await db.leagues.update_one(
        {"id": youth_league["id"]},
        {"$set": youth_league},
        upsert=True
    )
    print(f"✓ Created additional league: {youth_league['name']}")
    
    # 5. Create youth divisions
    youth_divisions = [
        {
            "id": "youth_u16",
            "name": "Under 16",
            "league_id": "youth_league",
            "description": "Players under 16 years old",
            "level": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "youth_u18", 
            "name": "Under 18",
            "league_id": "youth_league",
            "description": "Players under 18 years old",
            "level": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for division in youth_divisions:
        await db.divisions.update_one(
            {"id": division["id"]},
            {"$set": division},
            upsert=True
        )
        print(f"✓ Created youth division: {division['name']}")
    
    print("\n✅ Multi-league and division system implemented!")
    print("\nStructure Summary:")
    print("  - Leagues: Main League, Youth League")
    print("  - Main League Divisions: Premier Division, Division 1, Division 2") 
    print("  - Youth League Divisions: Under 16, Under 18")
    print("  - Teams updated with proper league/division references")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(implement_league_system())