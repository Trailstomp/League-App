#!/usr/bin/env python3
"""
Script to check the database structure and find where existing game data is stored
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def check_database_structure():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=== MongoDB Database Structure ===")
    
    # List all collections
    collections = await db.list_collection_names()
    print(f"\nCollections found: {collections}")
    
    # Check each collection for content
    for collection_name in collections:
        collection = db[collection_name]
        count = await collection.count_documents({})
        print(f"\n{collection_name}: {count} documents")
        
        # Show sample document if exists
        if count > 0:
            sample = await collection.find_one({})
            if sample:
                print(f"  Sample structure: {list(sample.keys())}")
                
                # Special handling for league_data (main data store)
                if collection_name == "league_data":
                    league_schedule = sample.get("leagueSchedule", [])
                    print(f"  - leagueSchedule: {len(league_schedule)} events")
                    if league_schedule:
                        event_keys = list(league_schedule[0].keys()) if league_schedule else []
                        print(f"    Event structure: {event_keys}")
                        
                        # Check for scores in events
                        events_with_scores = [e for e in league_schedule if 'homeScore' in e or 'awayScore' in e or 'score' in e]
                        print(f"    Events with scores: {len(events_with_scores)}")
                        
                        if events_with_scores:
                            print(f"    Sample scored event: {events_with_scores[0]}")
                
                # Check teams collection
                if collection_name == "teams":
                    team_sample = sample
                    print(f"    Team structure: {list(team_sample.keys())}")
    
    # Check specific collections for game data
    print("\n=== Checking for Game/Stats Data ===")
    
    # Check game_stats collection (new system)
    game_stats_count = await db.game_stats.count_documents({})
    print(f"game_stats collection: {game_stats_count} documents")
    
    # Check if there are events with scores in leagueSchedule
    league_data = await db.league_data.find_one({"id": "main_league"})
    if league_data and "leagueSchedule" in league_data:
        events = league_data["leagueSchedule"]
        scored_events = [e for e in events if any(key in e for key in ['homeScore', 'awayScore', 'score', 'result'])]
        print(f"leagueSchedule events with scores: {len(scored_events)}")
        
        if scored_events:
            print("Sample scored event from leagueSchedule:")
            for i, event in enumerate(scored_events[:3]):
                print(f"  Event {i+1}: {event}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(check_database_structure())