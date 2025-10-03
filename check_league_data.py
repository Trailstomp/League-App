#!/usr/bin/env python3
"""
Script to examine the league data structure in detail
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def examine_league_data():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=== Detailed League Data Examination ===")
    
    # Get the main league data
    league_data = await db.league_data.find_one({"id": "main_league"})
    
    if not league_data:
        print("No league data found!")
        client.close()
        return
    
    print(f"League data keys: {list(league_data.keys())}")
    
    # Examine leagueSchedule in detail
    schedule = league_data.get("leagueSchedule", [])
    print(f"\nleagueSchedule: {len(schedule)} events")
    
    if schedule:
        print("\nEvent details:")
        for i, event in enumerate(schedule[:5]):  # Show first 5 events
            print(f"Event {i+1}: {json.dumps(event, indent=2, default=str)}")
    
    # Check for teams data
    if "teams" in league_data:
        teams = league_data["teams"]
        print(f"\nTeams in league_data: {len(teams)}")
        if teams:
            print("Sample team:", json.dumps(teams[0], indent=2, default=str))
    
    # Check seasons
    if "seasons" in league_data:
        seasons = league_data["seasons"]
        print(f"\nSeasons: {len(seasons)}")
        if seasons:
            print("Sample season:", json.dumps(seasons[0], indent=2, default=str))
    
    # Look for any score-related data
    print("\n=== Searching for Score/Game Data ===")
    
    # Check all collections for anything that might contain game results
    collections = await db.list_collection_names()
    for collection_name in collections:
        collection = db[collection_name]
        
        # Search for documents with score-related fields
        score_docs = []
        cursor = collection.find({
            "$or": [
                {"homeScore": {"$exists": True}},
                {"awayScore": {"$exists": True}},
                {"score": {"$exists": True}},
                {"scores": {"$exists": True}},
                {"result": {"$exists": True}},
                {"winner": {"$exists": True}},
                {"bracket": {"$exists": True}},
                {"tournament": {"$exists": True}}
            ]
        })
        
        async for doc in cursor:
            score_docs.append(doc)
        
        if score_docs:
            print(f"\n{collection_name}: Found {len(score_docs)} documents with score/game data")
            if len(score_docs) <= 3:
                for doc in score_docs:
                    print(f"  Sample: {json.dumps(doc, indent=2, default=str)[:500]}...")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(examine_league_data())