#!/usr/bin/env python3
"""
Clear sample teams and prepare database for real pre-production team data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def prepare_for_real_teams():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=== PREPARING DATABASE FOR REAL TEAM DATA ===")
    
    # Step 1: Clear sample teams
    print("\n1. Clearing sample teams...")
    
    # Clear teams collection
    sample_team_ids = ['team_eagles', 'team_hawks', 'team_lions', 'team_wolves', 'team_tigers', 'team_bears']
    deleted_teams = await db.teams.delete_many({"id": {"$in": sample_team_ids}})
    print(f"   ✓ Deleted {deleted_teams.deleted_count} sample teams from teams collection")
    
    # Clear teams from league_data
    await db.league_data.update_one(
        {"id": "main_league"},
        {"$unset": {"teams": 1}}
    )
    print(f"   ✓ Cleared teams from league_data")
    
    # Clear sample game stats
    sample_events = ['game_eagles_vs_hawks', 'game_lions_vs_wolves', 'game_tigers_vs_bears', 'game_eagles_vs_lions', 'game_hawks_vs_tigers']
    deleted_stats = await db.game_stats.delete_many({"event_id": {"$in": sample_events}})
    print(f"   ✓ Deleted {deleted_stats.deleted_count} sample game stats")
    
    # Clear sample tournament
    await db.league_data.update_one(
        {"id": "main_league"},
        {"$pull": {"leagueSchedule": {"id": {"$in": sample_events + ["tournament_fall_championship"]}}}}
    )
    print(f"   ✓ Cleared sample events from schedule")
    
    print("\n✅ Database prepared for real team data!")
    print("\n" + "="*60)
    print("NEXT: Add your real teams using this format:")
    print("="*60)
    
    # Show example of how to add real teams
    example_code = '''
# Example: Add your real teams
real_teams = [
    {
        "id": "team_your_actual_id_1",
        "name": "Your Actual Team Name 1",
        "league_id": "main_league", 
        "division_id": "premier_division",  # or "division_1"
        "division": "Premier Division",     # Your actual division name
        "color": "#1e40af",                 # Your team color
        "logo": "https://your-logo-url.com", # Your logo URL
        "active": True,
        "created_at": datetime.now(timezone.utc)
    },
    # Add more teams...
]

# Insert teams
for team in real_teams:
    await db.teams.insert_one(team)

# Also add to league_data for compatibility
await db.league_data.update_one(
    {"id": "main_league"},
    {"$set": {"teams": real_teams}}
)
'''
    
    print(example_code)
    print("\n" + "="*60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(prepare_for_real_teams())