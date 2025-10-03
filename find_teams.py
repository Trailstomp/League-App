#!/usr/bin/env python3
"""
Script to find where teams data is stored
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def find_teams_data():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=== Searching for Teams Data ===")
    
    # Check if teams collection exists
    collections = await db.list_collection_names()
    print(f"All collections: {collections}")
    
    if "teams" in collections:
        teams_count = await db.teams.count_documents({})
        print(f"teams collection: {teams_count} documents")
        if teams_count > 0:
            sample_team = await db.teams.find_one({})
            print(f"Sample team: {json.dumps(sample_team, indent=2, default=str)}")
    else:
        print("No 'teams' collection found")
    
    # Check league_data for teams
    league_data = await db.league_data.find_one({"id": "main_league"})
    if league_data and "teams" in league_data:
        teams = league_data["teams"]
        print(f"\nTeams in league_data: {len(teams)}")
        if teams:
            for i, team in enumerate(teams[:3]):
                print(f"Team {i+1}: {json.dumps(team, indent=2, default=str)}")
    else:
        print("\nNo teams found in league_data")
    
    # Search for any documents containing team-related data
    print("\n=== Searching All Collections for Team Data ===")
    for collection_name in collections:
        collection = db[collection_name]
        
        # Search for documents with team-related fields
        team_docs = []
        cursor = collection.find({
            "$or": [
                {"teams": {"$exists": True}},
                {"team": {"$exists": True}},
                {"team_id": {"$exists": True}},
                {"team_name": {"$exists": True}},
                {"teamId": {"$exists": True}},
                {"teamName": {"$exists": True}}
            ]
        })
        
        async for doc in cursor:
            team_docs.append(doc)
        
        if team_docs:
            print(f"\n{collection_name}: Found {len(team_docs)} documents with team data")
            
            # Show sample
            if team_docs:
                sample = team_docs[0]
                team_fields = {k: v for k, v in sample.items() if 'team' in k.lower()}
                if team_fields:
                    print(f"  Team-related fields: {team_fields}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(find_teams_data())