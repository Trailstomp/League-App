#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

async def check_db():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.mlbl_database
    
    # List all collections
    collections = await db.list_collection_names()
    print(f"📁 Collections: {collections}")
    
    # Check league_data
    league_data = await db.league_data.find().to_list(length=None)
    print(f"🏈 League data documents: {len(league_data)}")
    
    if league_data:
        doc = league_data[0]
        print(f"🆔 Document ID: {doc.get('id')}")
        print(f"📅 Teams: {len(doc.get('teams', []))}")
        print(f"🗓️ Schedule events: {len(doc.get('leagueSchedule', []))}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())