#!/usr/bin/env python3
"""
User Scenario Simulation Test
Simulates the exact scenario reported by the user:
- Events show correctly in ticker
- After refresh, "Active Events" counter changes from 1 to 0
- Events appear to be overwritten/lost
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import time

def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

class UserScenarioTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        
        print(f"🔍 USER SCENARIO SIMULATION TEST")
        print(f"Testing the exact issue reported by user:")
        print(f"- Events show correctly initially")
        print(f"- After refresh, Active Events counter changes from 1 to 0")
        print(f"- Events appear to be overwritten")
        print(f"Backend URL: {self.api_base}")
        print("=" * 80)

    def create_realistic_event(self):
        """Create a realistic event similar to what user would create"""
        future_date = datetime.now() + timedelta(days=3)
        return {
            "id": f"user_event_{int(time.time())}",
            "title": "Eagles vs American Dads",
            "date": future_date.strftime("%Y-%m-%d"),
            "time": "19:00",
            "location": "Main Lacrosse Field",
            "type": "game",
            "teamIds": ["eagles", "american_dads"],
            "description": "Regular season game",
            "status": "scheduled",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }

    def get_current_events(self):
        """Get current events from API"""
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            if response.status_code == 200:
                data = response.json()
                events = data.get('leagueSchedule', [])
                return True, events, data
            else:
                return False, None, None
        except Exception as e:
            print(f"Error getting events: {e}")
            return False, None, None

    def save_event(self, event):
        """Save a single event using the leagueSchedule endpoint"""
        try:
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=[event],
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            return response.status_code == 200, response
        except Exception as e:
            print(f"Error saving event: {e}")
            return False, None

    def count_active_events(self, events):
        """Count active events (future events that are scheduled)"""
        now = datetime.now()
        active_count = 0
        
        for event in events:
            try:
                event_date = datetime.strptime(event.get('date', ''), '%Y-%m-%d')
                if event_date >= now.replace(hour=0, minute=0, second=0, microsecond=0):
                    if event.get('status', 'scheduled') != 'cancelled':
                        active_count += 1
            except (ValueError, TypeError):
                continue
        
        return active_count

    def simulate_user_scenario(self):
        """Simulate the exact user scenario"""
        print("🎬 SIMULATING USER SCENARIO...")
        
        # Step 1: Clear existing events and create a fresh event
        print("\n1️⃣ Creating fresh event (simulating user creating an event)...")
        user_event = self.create_realistic_event()
        
        success, response = self.save_event(user_event)
        if not success:
            print("❌ Failed to create initial event")
            return False
        
        print(f"✅ Created event: {user_event['title']}")
        
        # Step 2: Verify event appears correctly (initial state)
        print("\n2️⃣ Verifying event appears correctly (initial state)...")
        time.sleep(2)  # Wait for database write
        
        success, events, league_data = self.get_current_events()
        if not success:
            print("❌ Failed to retrieve events")
            return False
        
        initial_count = len(events)
        initial_active_count = self.count_active_events(events)
        
        print(f"✅ Initial state: {initial_count} total events, {initial_active_count} active events")
        
        if initial_active_count == 0:
            print("❌ No active events found - this matches user's problem!")
            return False
        
        # Step 3: Simulate multiple page refreshes (like user refreshing browser)
        print(f"\n3️⃣ Simulating page refreshes (user refreshing browser)...")
        
        refresh_results = []
        for i in range(5):
            print(f"   Refresh #{i+1}...")
            time.sleep(1)
            
            success, events, league_data = self.get_current_events()
            if success:
                total_count = len(events)
                active_count = self.count_active_events(events)
                refresh_results.append({
                    'refresh': i+1,
                    'total': total_count,
                    'active': active_count,
                    'event_ids': [e.get('id') for e in events]
                })
                print(f"      Total: {total_count}, Active: {active_count}")
            else:
                print(f"      ❌ Failed to get data on refresh #{i+1}")
                return False
        
        # Step 4: Analyze results for the user's reported issue
        print(f"\n4️⃣ ANALYZING RESULTS FOR USER'S REPORTED ISSUE...")
        
        # Check if active count changes (user's main complaint)
        active_counts = [r['active'] for r in refresh_results]
        total_counts = [r['total'] for r in refresh_results]
        
        print(f"Active event counts across refreshes: {active_counts}")
        print(f"Total event counts across refreshes: {total_counts}")
        
        # Check for the specific issue: counter going from 1 to 0
        has_count_drop = False
        for i in range(1, len(active_counts)):
            if active_counts[i-1] > 0 and active_counts[i] == 0:
                has_count_drop = True
                print(f"🚨 FOUND USER'S ISSUE: Active count dropped from {active_counts[i-1]} to {active_counts[i]} between refresh #{i} and #{i+1}")
                break
        
        # Check for event ID consistency
        first_event_ids = set(refresh_results[0]['event_ids'])
        event_id_consistent = all(set(r['event_ids']) == first_event_ids for r in refresh_results)
        
        print(f"Event IDs consistent across refreshes: {event_id_consistent}")
        
        # Step 5: Check for potential causes
        print(f"\n5️⃣ INVESTIGATING POTENTIAL CAUSES...")
        
        # Check if there are multiple API calls that might be interfering
        print("Checking for potential API interference...")
        
        # Make rapid successive calls to see if there's a race condition
        rapid_results = []
        for i in range(3):
            success, events, league_data = self.get_current_events()
            if success:
                rapid_results.append(len(events))
            time.sleep(0.1)  # Very short delay
        
        print(f"Rapid successive API calls returned: {rapid_results} events")
        
        # Check if gameTickerData or other fields might be interfering
        if league_data:
            ticker_data = league_data.get('gameTickerData', [])
            other_event_fields = {
                'gameTickerData': len(ticker_data),
                'newsItems': len(league_data.get('newsItems', [])),
            }
            print(f"Other potential event sources: {other_event_fields}")
        
        # Final assessment
        print(f"\n📊 FINAL ASSESSMENT:")
        
        if has_count_drop:
            print("🚨 REPRODUCED USER'S ISSUE: Active Events counter drops to 0 after refresh")
            print("   This explains why user sees events disappear from ticker")
            return False
        elif not event_id_consistent:
            print("🚨 EVENT INCONSISTENCY DETECTED: Event IDs change between refreshes")
            print("   This could cause events to appear/disappear unpredictably")
            return False
        elif len(set(active_counts)) > 1:
            print("🚨 ACTIVE COUNT INCONSISTENCY: Active event count varies between refreshes")
            print("   This matches user's report of counter changing")
            return False
        else:
            print("✅ NO ISSUES DETECTED: Events persist consistently across refreshes")
            print("   User's issue may be frontend-related or timing-dependent")
            return True

if __name__ == "__main__":
    try:
        tester = UserScenarioTester()
        success = tester.simulate_user_scenario()
        
        if success:
            print("\n🎉 User scenario test completed - NO BACKEND ISSUES DETECTED")
            print("✅ Events persist correctly, counters remain consistent")
            print("💡 User's issue may be frontend-related or caused by timing/race conditions")
        else:
            print("\n⚠️  User scenario test REPRODUCED THE ISSUE")
            print("❌ Backend has problems with event persistence or consistency")
            print("🔧 This explains the user's reported refresh problems")
        
        sys.exit(0 if success else 1)
        
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        sys.exit(1)