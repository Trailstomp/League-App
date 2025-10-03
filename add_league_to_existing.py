#!/usr/bin/env python3
"""
Add league management to existing division/team structure without disrupting existing data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def add_league_management():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=== Adding League Management to Existing Structure ===")
    
    # 1. Check what currently exists
    print("\n--- Current Structure ---")
    teams = await db.teams.find().to_list(None)
    print(f"Existing teams: {len(teams)}")
    
    # Check for existing divisions in teams
    existing_divisions = set()
    for team in teams:
        if team.get('division'):
            existing_divisions.add(team['division'])
    
    print(f"Existing divisions found in teams: {list(existing_divisions)}")
    
    # Check if divisions collection exists
    divisions_collection_exists = 'divisions' in await db.list_collection_names()
    if divisions_collection_exists:
        divisions = await db.divisions.find().to_list(None)
        print(f"Existing divisions collection: {len(divisions)} divisions")
    else:
        print("No divisions collection found")
    
    # 2. Create leagues collection (this is what's missing)
    print(f"\n--- Adding League Management ---")
    
    # Create main league to organize existing structure
    main_league = {
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
    
    await db.leagues.update_one(
        {"id": main_league["id"]},
        {"$set": main_league},
        upsert=True
    )
    print(f"✓ Created/updated main league")
    
    # 3. If no divisions collection exists, create it from team data
    if not divisions_collection_exists and existing_divisions:
        print(f"\n--- Creating divisions collection from existing team data ---")
        
        for i, division_name in enumerate(sorted(existing_divisions)):
            division = {
                "id": f"division_{division_name.lower().replace(' ', '_')}",
                "name": division_name,
                "league_id": "main_league",
                "description": f"{division_name} teams",
                "level": i + 1,
                "is_active": True,
                "created_at": datetime.now(timezone.utc)
            }
            
            await db.divisions.update_one(
                {"id": division["id"]},
                {"$set": division},
                upsert=True
            )
            print(f"✓ Created division: {division_name}")
    
    # 4. Update existing teams to include league_id (without changing their divisions)
    print(f"\n--- Updating teams with league references ---")
    
    teams_updated = 0
    for team in teams:
        update_data = {
            "league_id": "main_league",
            "updated_at": datetime.now(timezone.utc)
        }
        
        # If team has division but no division_id, add it
        if team.get('division') and not team.get('division_id'):
            division_id = f"division_{team['division'].lower().replace(' ', '_')}"
            update_data["division_id"] = division_id
        
        await db.teams.update_one(
            {"id": team["id"]},
            {"$set": update_data}
        )
        teams_updated += 1
        
        if teams_updated <= 5:  # Show first 5 as examples
            print(f"✓ Updated team: {team.get('name', 'Unknown')} -> Main League")
    
    if teams_updated > 5:
        print(f"✓ Updated {teams_updated - 5} more teams...")
    
    print(f"\n✅ League management added to existing structure!")
    print(f"  - Preserved {len(teams)} existing teams")
    print(f"  - Preserved {len(existing_divisions)} existing divisions")
    print(f"  - Added league organization on top")
    print(f"  - Ready for multi-league expansion")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_league_management())