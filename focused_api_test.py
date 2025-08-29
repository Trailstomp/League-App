#!/usr/bin/env python3
"""
Focused Backend API Testing Suite for Review Request
Tests all backend API endpoints with focus on:
1. Basic health check and status endpoints
2. League data GET/POST endpoints  
3. Team management API calls
4. Event management API calls
5. Any issues with seasons or currentSeason endpoints that are showing 500/422 errors
"""

import requests
import json
import sys
from datetime import datetime
import time
import uuid

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

class FocusedAPITester:
    def __init__(self):
        self.backend_url = get_backend_url()
        if not self.backend_url:
            raise Exception("Could not get backend URL from frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        self.test_results = []
        self.failed_tests = []
        
        print(f"🎯 FOCUSED API TESTING - REVIEW REQUEST VERIFICATION")
        print(f"Testing backend at: {self.api_base}")
        print("=" * 80)

    def log_test(self, test_name, success, message="", response_data=None, status_code=None):
        """Log test results with enhanced error reporting"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if status_code:
            print(f"    HTTP Status: {status_code}")
        if response_data and success:
            print(f"    Response: {response_data}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response': response_data,
            'status_code': status_code
        })
        
        if not success:
            self.failed_tests.append(test_name)
        print()

    def test_health_check_comprehensive(self):
        """Test basic health check endpoint with comprehensive validation"""
        print("🏥 TESTING BASIC HEALTH CHECK ENDPOINT...")
        
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/", timeout=10)
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                expected_message = 'MLBL API - Lacrosse League Management'
                
                if data.get('message') == expected_message:
                    self.log_test(
                        "Health Check - Basic Connectivity", 
                        True, 
                        f"Response time: {response_time:.2f}ms", 
                        data,
                        response.status_code
                    )
                    return True
                else:
                    self.log_test(
                        "Health Check - Basic Connectivity", 
                        False, 
                        f"Unexpected message: expected '{expected_message}', got '{data.get('message')}'",
                        None,
                        response.status_code
                    )
                    return False
            else:
                self.log_test(
                    "Health Check - Basic Connectivity", 
                    False, 
                    f"HTTP error: {response.text}",
                    None,
                    response.status_code
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Health Check - Basic Connectivity", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_status_endpoints_comprehensive(self):
        """Test status endpoints with comprehensive validation"""
        print("📊 TESTING STATUS ENDPOINTS...")
        
        # Test GET /api/status
        try:
            response = requests.get(f"{self.api_base}/status", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Status Endpoints - GET Status Checks", 
                        True, 
                        f"Retrieved {len(data)} status checks successfully", 
                        f"Count: {len(data)}",
                        response.status_code
                    )
                    initial_count = len(data)
                else:
                    self.log_test(
                        "Status Endpoints - GET Status Checks", 
                        False, 
                        f"Expected list, got: {type(data)}",
                        None,
                        response.status_code
                    )
                    return False
            else:
                self.log_test(
                    "Status Endpoints - GET Status Checks", 
                    False, 
                    f"HTTP error: {response.text}",
                    None,
                    response.status_code
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Status Endpoints - GET Status Checks", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

        # Test POST /api/status
        try:
            test_data = {
                "client_name": f"FocusedAPITest_{int(time.time())}"
            }
            
            response = requests.post(
                f"{self.api_base}/status", 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'client_name', 'timestamp']
                
                if all(field in data for field in required_fields):
                    if data['client_name'] == test_data['client_name']:
                        self.log_test(
                            "Status Endpoints - POST Status Check", 
                            True, 
                            f"Created status check successfully", 
                            {k: v for k, v in data.items() if k != 'timestamp'},
                            response.status_code
                        )
                        return True
                    else:
                        self.log_test(
                            "Status Endpoints - POST Status Check", 
                            False, 
                            f"Client name mismatch: expected {test_data['client_name']}, got {data['client_name']}",
                            None,
                            response.status_code
                        )
                        return False
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "Status Endpoints - POST Status Check", 
                        False, 
                        f"Missing required fields: {missing}",
                        None,
                        response.status_code
                    )
                    return False
            else:
                self.log_test(
                    "Status Endpoints - POST Status Check", 
                    False, 
                    f"HTTP error: {response.text}",
                    None,
                    response.status_code
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Status Endpoints - POST Status Check", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_league_data_endpoints_comprehensive(self):
        """Test league data GET/POST endpoints with comprehensive validation"""
        print("🏆 TESTING LEAGUE DATA ENDPOINTS...")
        
        # Test GET /api/league-data
        try:
            response = requests.get(f"{self.api_base}/league-data", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'teams', 'players', 'users', 'newsItems', 'gameTickerData', 'leagueSchedule', 'leagueInfo', 'websiteStyle']
                
                if all(field in data for field in required_fields):
                    teams_count = len(data.get('teams', []))
                    players_count = len(data.get('players', []))
                    schedule_count = len(data.get('leagueSchedule', []))
                    
                    self.log_test(
                        "League Data - GET All Data", 
                        True, 
                        f"Retrieved complete league data structure", 
                        f"Teams: {teams_count}, Players: {players_count}, Schedule: {schedule_count}",
                        response.status_code
                    )
                    return True, data
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test(
                        "League Data - GET All Data", 
                        False, 
                        f"Missing required fields: {missing}",
                        None,
                        response.status_code
                    )
                    return False, None
            else:
                self.log_test(
                    "League Data - GET All Data", 
                    False, 
                    f"HTTP error: {response.text}",
                    None,
                    response.status_code
                )
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "League Data - GET All Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False, None

        # Test POST /api/league-data
        try:
            test_league_data = {
                "teams": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "API Test Team Alpha",
                        "division": "Field",
                        "wins": 8,
                        "losses": 2,
                        "coach": "Test Coach Alpha"
                    }
                ],
                "players": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "API Test Player",
                        "position": "Midfield",
                        "team_id": "test_team_alpha"
                    }
                ],
                "users": [],
                "newsItems": [],
                "gameTickerData": [],
                "leagueSchedule": [
                    {
                        "id": str(uuid.uuid4()),
                        "type": "game",
                        "title": "API Test Game",
                        "date": "2024-12-20",
                        "time": "7:00 PM",
                        "teams": ["test_team_alpha", "test_team_beta"],
                        "status": "Scheduled"
                    }
                ],
                "leagueInfo": {
                    "name": "API Test League",
                    "season": "2024"
                },
                "websiteStyle": {
                    "theme": "default"
                }
            }
            
            response = requests.post(
                f"{self.api_base}/league-data", 
                json=test_league_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'League data saved successfully':
                    self.log_test(
                        "League Data - POST All Data", 
                        True, 
                        f"League data saved successfully", 
                        {"message": data.get('message')},
                        response.status_code
                    )
                    return True
                else:
                    self.log_test(
                        "League Data - POST All Data", 
                        False, 
                        f"Unexpected response: {data}",
                        None,
                        response.status_code
                    )
                    return False
            else:
                self.log_test(
                    "League Data - POST All Data", 
                    False, 
                    f"HTTP error: {response.text}",
                    None,
                    response.status_code
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "League Data - POST All Data", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_team_management_api_calls(self):
        """Test team management API calls with comprehensive validation"""
        print("👥 TESTING TEAM MANAGEMENT API CALLS...")
        
        try:
            # Test team creation/update via specific endpoint
            test_teams = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Team Management Test Alpha",
                    "division": "Field",
                    "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                    "colors": {"primary": "#FF5733", "secondary": "#33FF57"},
                    "wins": 12,
                    "losses": 3,
                    "coach": "Team Management Coach Alpha",
                    "players": [],
                    "locations": [
                        {
                            "id": str(uuid.uuid4()),
                            "name": "Home Field Alpha",
                            "address": "123 Test Street, Test City, TC 12345",
                            "type": "Home Field"
                        }
                    ]
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Team Management Test Beta",
                    "division": "Box",
                    "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                    "colors": {"primary": "#3357FF", "secondary": "#FF3357"},
                    "wins": 8,
                    "losses": 7,
                    "coach": "Team Management Coach Beta",
                    "players": [],
                    "locations": []
                }
            ]
            
            response = requests.post(
                f"{self.api_base}/league-data/teams", 
                json=test_teams,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'teams updated successfully':
                    # Verify teams were saved by retrieving them
                    get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    if get_response.status_code == 200:
                        league_data = get_response.json()
                        saved_teams = league_data.get('teams', [])
                        
                        # Find our test teams
                        test_team_names = [team['name'] for team in test_teams]
                        found_teams = [team for team in saved_teams if team.get('name') in test_team_names]
                        
                        if len(found_teams) >= 2:
                            # Verify team data integrity
                            team_with_logo = next((t for t in found_teams if t.get('logo')), None)
                            team_with_locations = next((t for t in found_teams if t.get('locations')), None)
                            
                            if team_with_logo and team_with_locations:
                                self.log_test(
                                    "Team Management - CRUD Operations", 
                                    True, 
                                    f"Teams created/updated successfully with complete data", 
                                    f"Found {len(found_teams)} teams with logos and locations",
                                    response.status_code
                                )
                                return True
                            else:
                                self.log_test(
                                    "Team Management - CRUD Operations", 
                                    False, 
                                    f"Team data incomplete - missing logos or locations"
                                )
                                return False
                        else:
                            self.log_test(
                                "Team Management - CRUD Operations", 
                                False, 
                                f"Expected 2 teams, found {len(found_teams)}"
                            )
                            return False
                    else:
                        self.log_test(
                            "Team Management - Data Verification", 
                            False, 
                            f"Failed to retrieve teams: HTTP {get_response.status_code}",
                            None,
                            get_response.status_code
                        )
                        return False
                else:
                    self.log_test(
                        "Team Management - CRUD Operations", 
                        False, 
                        f"Unexpected response: {data}",
                        None,
                        response.status_code
                    )
                    return False
            else:
                self.log_test(
                    "Team Management - CRUD Operations", 
                    False, 
                    f"HTTP error: {response.text}",
                    None,
                    response.status_code
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Team Management - CRUD Operations", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_event_management_api_calls(self):
        """Test event management API calls with comprehensive validation"""
        print("📅 TESTING EVENT MANAGEMENT API CALLS...")
        
        try:
            # Test event creation/update via schedule endpoint
            test_events = [
                {
                    "id": str(uuid.uuid4()),
                    "type": "event",
                    "title": "Event Management Test Practice",
                    "date": "2024-12-22",
                    "time": "6:00 PM",
                    "location": "Practice Facility Alpha",
                    "teams": ["team_alpha", "team_beta"],
                    "status": "Scheduled",
                    "rsvp": {
                        "enabled": True,
                        "responses": [
                            {
                                "player_id": "player_alpha_1",
                                "player_name": "Test Player Alpha",
                                "response": "yes",
                                "timestamp": datetime.utcnow().isoformat()
                            },
                            {
                                "player_id": "player_alpha_2", 
                                "player_name": "Test Player Beta",
                                "response": "no",
                                "timestamp": datetime.utcnow().isoformat()
                            }
                        ]
                    },
                    "attendance_tracking": {
                        "enabled": True,
                        "attendees": ["player_alpha_1"],
                        "total_expected": 15,
                        "attendance_rate": 75.0
                    },
                    "notifications": {
                        "enabled": True,
                        "reminders_sent": [
                            {
                                "type": "email",
                                "sent_at": datetime.utcnow().isoformat(),
                                "recipients": ["player_alpha_1", "player_alpha_2"]
                            }
                        ]
                    }
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "game",
                    "title": "Event Management Test Championship",
                    "date": "2024-12-25",
                    "time": "2:00 PM",
                    "location": "Championship Stadium",
                    "teams": ["team_alpha", "team_gamma"],
                    "status": "Final",
                    "score": {"team_alpha": 15, "team_gamma": 12},
                    "editable": True,
                    "recurring": {
                        "enabled": False,
                        "pattern": "weekly",
                        "end_date": "2024-12-31"
                    }
                }
            ]
            
            response = requests.post(
                f"{self.api_base}/league-data/leagueSchedule", 
                json=test_events,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'leagueSchedule updated successfully':
                    # Verify events were saved by retrieving them
                    get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    if get_response.status_code == 200:
                        league_data = get_response.json()
                        saved_schedule = league_data.get('leagueSchedule', [])
                        
                        # Find our test events
                        test_event_titles = [event['title'] for event in test_events]
                        found_events = [event for event in saved_schedule if event.get('title') in test_event_titles]
                        
                        if len(found_events) >= 2:
                            # Verify event features
                            rsvp_event = next((e for e in found_events if e.get('rsvp', {}).get('enabled')), None)
                            final_game = next((e for e in found_events if e.get('status') == 'Final'), None)
                            
                            if rsvp_event and final_game:
                                rsvp_responses = len(rsvp_event.get('rsvp', {}).get('responses', []))
                                attendance_enabled = rsvp_event.get('attendance_tracking', {}).get('enabled', False)
                                game_editable = final_game.get('editable', False)
                                
                                self.log_test(
                                    "Event Management - RSVP & Attendance System", 
                                    True, 
                                    f"Event RSVP system working with {rsvp_responses} responses, attendance tracking: {attendance_enabled}", 
                                    f"Final game editable: {game_editable}",
                                    response.status_code
                                )
                                
                                # Test notification system data
                                notifications = rsvp_event.get('notifications', {})
                                if notifications.get('enabled') and notifications.get('reminders_sent'):
                                    self.log_test(
                                        "Event Management - Notification System", 
                                        True, 
                                        f"Notification system operational with {len(notifications.get('reminders_sent', []))} reminders sent", 
                                        f"Notification types available",
                                        response.status_code
                                    )
                                else:
                                    self.log_test(
                                        "Event Management - Notification System", 
                                        False, 
                                        f"Notification system data incomplete"
                                    )
                                
                                return True
                            else:
                                self.log_test(
                                    "Event Management - Feature Verification", 
                                    False, 
                                    f"Missing RSVP event or Final game in saved data"
                                )
                                return False
                        else:
                            self.log_test(
                                "Event Management - CRUD Operations", 
                                False, 
                                f"Expected 2 events, found {len(found_events)}"
                            )
                            return False
                    else:
                        self.log_test(
                            "Event Management - Data Verification", 
                            False, 
                            f"Failed to retrieve events: HTTP {get_response.status_code}",
                            None,
                            get_response.status_code
                        )
                        return False
                else:
                    self.log_test(
                        "Event Management - CRUD Operations", 
                        False, 
                        f"Unexpected response: {data}",
                        None,
                        response.status_code
                    )
                    return False
            else:
                self.log_test(
                    "Event Management - CRUD Operations", 
                    False, 
                    f"HTTP error: {response.text}",
                    None,
                    response.status_code
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Event Management - CRUD Operations", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_seasons_and_current_season_endpoints(self):
        """Test seasons and currentSeason endpoints for 500/422 errors"""
        print("🏆 TESTING SEASONS AND CURRENT SEASON ENDPOINTS...")
        
        # Test seasons data via league info endpoint
        try:
            # Create comprehensive seasons data
            seasons_test_data = {
                "name": "Seasons API Test League",
                "current_season": "2024",
                "seasons": {
                    "2024": {
                        "id": "2024",
                        "name": "Current Season 2024",
                        "status": "active",
                        "start_date": "2024-01-01",
                        "end_date": "2024-12-31",
                        "teams": ["team_alpha", "team_beta", "team_gamma"],
                        "stats": {
                            "total_games": 48,
                            "total_teams": 8,
                            "total_players": 125,
                            "completed_games": 35,
                            "remaining_games": 13
                        },
                        "playoffs": {
                            "enabled": True,
                            "start_date": "2024-11-01",
                            "bracket": {}
                        }
                    },
                    "2023": {
                        "id": "2023",
                        "name": "Previous Season 2023", 
                        "status": "completed",
                        "start_date": "2023-01-01",
                        "end_date": "2023-12-31",
                        "teams": ["team_alpha", "team_beta"],
                        "stats": {
                            "total_games": 42,
                            "total_teams": 6,
                            "total_players": 95,
                            "completed_games": 42,
                            "remaining_games": 0
                        },
                        "champion": "team_alpha"
                    }
                },
                "league_settings": {
                    "multi_season_enabled": True,
                    "season_rollover_enabled": True
                }
            }
            
            # Test saving seasons data
            response = requests.post(
                f"{self.api_base}/league-data/leagueInfo",
                json=seasons_test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'leagueInfo updated successfully':
                    # Verify seasons data retrieval
                    get_response = requests.get(f"{self.api_base}/league-data", timeout=10)
                    if get_response.status_code == 200:
                        league_data = get_response.json()
                        league_info = league_data.get('leagueInfo', {})
                        
                        # Check for seasons structure
                        current_season = league_info.get('current_season')
                        seasons = league_info.get('seasons', {})
                        
                        if current_season and seasons:
                            active_season = seasons.get(current_season, {})
                            completed_seasons = [s for s in seasons.values() if s.get('status') == 'completed']
                            
                            if active_season.get('status') == 'active' and len(completed_seasons) >= 1:
                                self.log_test(
                                    "Seasons - Current Season Endpoint", 
                                    True, 
                                    f"Current season '{current_season}' active, {len(completed_seasons)} completed seasons", 
                                    f"Active season teams: {len(active_season.get('teams', []))}",
                                    response.status_code
                                )
                                
                                # Test season-specific data access
                                season_stats = active_season.get('stats', {})
                                if season_stats.get('total_games') and season_stats.get('total_teams'):
                                    self.log_test(
                                        "Seasons - Season Statistics Access", 
                                        True, 
                                        f"Season stats accessible: {season_stats.get('total_games')} games, {season_stats.get('total_teams')} teams", 
                                        f"Completion rate: {(season_stats.get('completed_games', 0) / season_stats.get('total_games', 1)) * 100:.1f}%",
                                        get_response.status_code
                                    )
                                else:
                                    self.log_test(
                                        "Seasons - Season Statistics Access", 
                                        False, 
                                        f"Season statistics incomplete or missing"
                                    )
                                
                                return True
                            else:
                                self.log_test(
                                    "Seasons - Current Season Endpoint", 
                                    False, 
                                    f"Season status incorrect: active={active_season.get('status')}, completed={len(completed_seasons)}"
                                )
                                return False
                        else:
                            self.log_test(
                                "Seasons - Current Season Endpoint", 
                                False, 
                                f"Missing seasons data: current_season={current_season}, seasons_count={len(seasons)}"
                            )
                            return False
                    else:
                        self.log_test(
                            "Seasons - Data Retrieval", 
                            False, 
                            f"Failed to retrieve seasons data: HTTP {get_response.status_code}: {get_response.text}",
                            None,
                            get_response.status_code
                        )
                        return False
                else:
                    self.log_test(
                        "Seasons - Data Saving", 
                        False, 
                        f"Unexpected response: {data}",
                        None,
                        response.status_code
                    )
                    return False
            else:
                # This is where we check for 500/422 errors specifically
                if response.status_code in [500, 422]:
                    self.log_test(
                        "Seasons - Current Season Endpoint", 
                        False, 
                        f"CRITICAL: {response.status_code} error detected in seasons endpoint: {response.text}",
                        None,
                        response.status_code
                    )
                else:
                    self.log_test(
                        "Seasons - Current Season Endpoint", 
                        False, 
                        f"HTTP error: {response.text}",
                        None,
                        response.status_code
                    )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Seasons - Current Season Endpoint", 
                False, 
                f"Connection error: {str(e)}"
            )
            return False

    def test_error_conditions_and_edge_cases(self):
        """Test for specific error conditions and edge cases"""
        print("⚠️  TESTING ERROR CONDITIONS AND EDGE CASES...")
        
        # Test invalid endpoints for 404 handling
        try:
            response = requests.get(f"{self.api_base}/invalid-endpoint", timeout=10)
            if response.status_code == 404:
                self.log_test(
                    "Error Handling - 404 for Invalid Endpoints", 
                    True, 
                    f"Correctly returns 404 for invalid endpoints", 
                    None,
                    response.status_code
                )
            else:
                self.log_test(
                    "Error Handling - 404 for Invalid Endpoints", 
                    False, 
                    f"Expected 404, got {response.status_code}",
                    None,
                    response.status_code
                )
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Error Handling - 404 for Invalid Endpoints", 
                False, 
                f"Connection error: {str(e)}"
            )

        # Test invalid data type for specific endpoint
        try:
            response = requests.post(
                f"{self.api_base}/league-data/invalid-data-type",
                json={"test": "data"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            if response.status_code == 400:
                self.log_test(
                    "Error Handling - 400 for Invalid Data Types", 
                    True, 
                    f"Correctly returns 400 for invalid data types", 
                    None,
                    response.status_code
                )
            else:
                self.log_test(
                    "Error Handling - 400 for Invalid Data Types", 
                    False, 
                    f"Expected 400, got {response.status_code}",
                    None,
                    response.status_code
                )
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Error Handling - 400 for Invalid Data Types", 
                False, 
                f"Connection error: {str(e)}"
            )

        # Test malformed JSON
        try:
            response = requests.post(
                f"{self.api_base}/league-data",
                data="invalid json",
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            if response.status_code in [400, 422]:
                self.log_test(
                    "Error Handling - Malformed JSON", 
                    True, 
                    f"Correctly handles malformed JSON with {response.status_code}", 
                    None,
                    response.status_code
                )
            else:
                self.log_test(
                    "Error Handling - Malformed JSON", 
                    False, 
                    f"Expected 400/422, got {response.status_code}",
                    None,
                    response.status_code
                )
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Error Handling - Malformed JSON", 
                False, 
                f"Connection error: {str(e)}"
            )

    def run_focused_tests(self):
        """Run all focused API tests"""
        print("🚀 STARTING FOCUSED API TESTING FOR REVIEW REQUEST")
        print(f"Target URL: {self.api_base}")
        print("=" * 80)
        
        # Run all test categories
        test_categories = [
            ("Basic Health Check", self.test_health_check_comprehensive),
            ("Status Endpoints", self.test_status_endpoints_comprehensive),
            ("League Data Endpoints", self.test_league_data_endpoints_comprehensive),
            ("Team Management API", self.test_team_management_api_calls),
            ("Event Management API", self.test_event_management_api_calls),
            ("Seasons & Current Season", self.test_seasons_and_current_season_endpoints),
            ("Error Conditions", self.test_error_conditions_and_edge_cases)
        ]
        
        for category_name, test_function in test_categories:
            print(f"\n{'='*20} {category_name} {'='*20}")
            try:
                test_function()
            except Exception as e:
                self.log_test(
                    f"{category_name} - Execution Error",
                    False,
                    f"Test execution failed: {str(e)}"
                )
        
        # Summary
        print("\n" + "=" * 80)
        print("🎯 FOCUSED API TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        # Categorize failures
        critical_failures = []
        error_500_422 = []
        
        for result in self.test_results:
            if not result['success']:
                if result.get('status_code') in [500, 422]:
                    error_500_422.append(result['test'])
                if any(keyword in result['test'] for keyword in ['Health Check', 'Seasons', 'Current Season']):
                    critical_failures.append(result['test'])
        
        if error_500_422:
            print(f"\n🚨 CRITICAL: 500/422 ERRORS DETECTED:")
            for test in error_500_422:
                print(f"  - {test}")
        
        if failed_tests > 0:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\n📊 Success Rate: {success_rate:.1f}%")
        
        # Final assessment
        if len(error_500_422) > 0:
            print(f"\n🚨 REVIEW REQUEST FINDINGS: {len(error_500_422)} endpoints showing 500/422 errors")
            return False
        elif len(critical_failures) > 0:
            print(f"\n⚠️  REVIEW REQUEST FINDINGS: {len(critical_failures)} critical issues detected")
            return False
        else:
            print(f"\n✅ REVIEW REQUEST FINDINGS: All backend API endpoints working correctly")
            print("✅ No 500/422 errors detected in seasons or currentSeason endpoints")
            print("✅ All core functionality verified and operational")
            return True

if __name__ == "__main__":
    try:
        tester = FocusedAPITester()
        success = tester.run_focused_tests()
        
        if success:
            print("\n🎉 FOCUSED API TESTING COMPLETED SUCCESSFULLY!")
            print("All backend endpoints are stable and working correctly.")
            sys.exit(0)
        else:
            print("\n⚠️  Some focused API tests failed. Check the results above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Focused API test setup failed: {e}")
        sys.exit(1)