# BACKEND TESTING SAFETY PROTOCOL

## 🚨 CRITICAL: Prevent Test Data Contamination

### MANDATORY RULES FOR ALL TEST FILES

#### 1. Test Data Endpoints Only
```python
# ✅ SAFE - Uses test-specific endpoint
response = requests.post(f"{api_base}/api/test-league-data", json=test_data)

# ❌ FORBIDDEN - Could overwrite production data  
response = requests.post(f"{api_base}/api/league-data", json=test_data)
```

#### 2. Test Data Identification
```python
# ✅ SAFE - Clearly marked as test data
test_teams = [
    {"id": "test_team_1", "name": "TEST Team Alpha"},
    {"id": "test_team_2", "name": "TEST Team Beta"}
]

# ❌ FORBIDDEN - Could be mistaken for production data
teams = [
    {"id": "oh10-lacrosse", "name": "OH10 Lacrosse"}
]
```

#### 3. Backup Before Testing
```python
def test_with_backup():
    # Create backup before any operations
    backup_response = requests.get(f"{api_base}/api/league-data")
    backup_data = backup_response.json()
    
    try:
        # Perform tests
        run_tests()
    finally:
        # Restore original data
        requests.post(f"{api_base}/api/league-data", json=backup_data)
```

### BACKEND API SAFETY REQUIREMENTS

#### Test-Specific Endpoints
- `/api/test-league-data` - For testing league data operations
- `/api/test-teams` - For testing team operations  
- `/api/test-players` - For testing player operations

#### Production Data Protection
```python
@app.post("/api/league-data")
async def save_league_data(data: dict):
    # SAFETY CHECK: Detect test data contamination
    if contains_test_data(data):
        raise HTTPException(400, "Test data detected in production endpoint")
    
    # SAFETY CHECK: Backup before overwrite
    create_backup_before_save(data)
    
    # Save with validation
    return save_with_validation(data)

def contains_test_data(data):
    """Detect test data patterns that shouldn't be in production"""
    test_patterns = ["TEST", "test_", "backup_data_here", "placeholder"]
    
    def check_recursive(obj):
        if isinstance(obj, dict):
            return any(check_recursive(v) for v in obj.values())
        elif isinstance(obj, list):
            return any(check_recursive(item) for item in obj)
        elif isinstance(obj, str):
            return any(pattern in obj for pattern in test_patterns)
        return False
    
    return check_recursive(data)
```

### TEST FILE REQUIREMENTS

#### Mandatory Safety Headers
```python
"""
SAFETY PROTOCOL: This test file follows BACKEND_TESTING_SAFETY.md
- Uses test-specific endpoints only
- Creates backups before operations
- Uses clearly marked test data
- Restores original state after testing
"""
```

#### Required Safety Checks
```python
class SafetyCheck:
    @staticmethod
    def verify_test_endpoint(url):
        if not ("test-" in url or "/test/" in url):
            raise Exception(f"SAFETY VIOLATION: Using production endpoint {url}")
    
    @staticmethod
    def verify_test_data(data):
        if not any("TEST" in str(v) for v in data.values()):
            raise Exception("SAFETY VIOLATION: Data not clearly marked as test data")
```

### MONITORING & ALERTS

#### Data Change Detection
```python
def monitor_production_data():
    """Monitor for unexpected changes in production data"""
    current_count = get_current_data_count()
    if current_count != expected_count:
        alert_data_change(current_count, expected_count)
```

#### Test Contamination Detection
```python
def detect_test_contamination():
    """Check if production data contains test patterns"""
    production_data = get_production_data()
    if contains_test_data(production_data):
        alert_test_contamination()
```

### RECOVERY PROCEDURES

#### Automatic Rollback
```python
class TestRunner:
    def __init__(self):
        self.original_data = None
    
    def setup(self):
        self.original_data = backup_production_data()
    
    def teardown(self):
        restore_production_data(self.original_data)
    
    def run_test(self, test_func):
        try:
            self.setup()
            test_func()
        finally:
            self.teardown()
```

### VIOLATIONS & PENALTIES

#### Automatic Failure
Any test file that:
- Uses production endpoints with test data
- Doesn't create backups before operations  
- Uses ambiguous test data
- Fails to restore original state

Will automatically fail with SAFETY VIOLATION error.

#### Required Fixes
1. Update to use test endpoints
2. Add proper backup/restore
3. Use clearly marked test data
4. Add safety verification

### IMPLEMENTATION CHECKLIST

- [ ] Test-specific API endpoints created
- [ ] Production endpoint safety checks added
- [ ] Test data contamination detection implemented
- [ ] Automatic backup/restore system
- [ ] All existing test files updated
- [ ] Monitoring and alerting system
- [ ] Emergency recovery procedures

**NO TEST FILE SHOULD EVER TOUCH PRODUCTION DATA WITHOUT EXPLICIT SAFETY MEASURES.**