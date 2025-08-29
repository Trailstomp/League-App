#!/usr/bin/env python3
"""
Detailed WebsiteStyle Testing - Simulating Real Frontend Usage
Tests the exact scenario that might be causing the websiteStyle persistence bug.
"""

import requests
import json
import sys
from datetime import datetime
import time

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

def test_realistic_websitestyle_scenario():
    """Test with realistic websiteStyle data that frontend would send"""
    
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ Could not get backend URL")
        return False
    
    api_base = f"{backend_url}/api"
    print(f"Testing realistic websiteStyle scenario at: {api_base}")
    print("=" * 80)
    
    # Step 1: Get current league data
    print("📋 STEP 1: Getting current league data...")
    try:
        response = requests.get(f"{api_base}/league-data", timeout=10)
        if response.status_code == 200:
            current_data = response.json()
            current_websitestyle = current_data.get('websiteStyle', {})
            print(f"✅ Current websiteStyle: {json.dumps(current_websitestyle, indent=2)}")
        else:
            print(f"❌ Failed to get league data: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting league data: {e}")
        return False
    
    # Step 2: Create realistic websiteStyle data (like frontend would send)
    print("\n🎨 STEP 2: Creating realistic websiteStyle data...")
    realistic_websitestyle = {
        "primaryColor": "#3b82f6",
        "secondaryColor": "#ef4444", 
        "backgroundColor": "#f8fafc",
        "textColor": "#1f2937",
        "logoUrl": "https://example.com/team-logo.png",
        "logoDisplayStyle": "fit",
        "bannerEnabled": True,
        "bannerColor": "#1e40af",
        "bannerText": "Welcome to MLBL - Major League Box Lacrosse",
        "bannerBackgroundImage": "",
        "sidebarBackgroundColor": "#374151",
        "sidebarBackgroundImage": "",
        "sidebarOpacity": 0.9,
        "navigationStyle": "modern",
        "showNavigationIcons": True,
        "customCSS": "",
        "theme": "custom",
        "lastModified": datetime.utcnow().isoformat()
    }
    
    print(f"📝 Realistic websiteStyle data created with {len(realistic_websitestyle)} properties")
    
    # Step 3: Save using POST /api/league-data/websiteStyle
    print("\n💾 STEP 3: Saving websiteStyle using specific endpoint...")
    try:
        response = requests.post(
            f"{api_base}/league-data/websiteStyle",
            json=realistic_websitestyle,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            save_result = response.json()
            print(f"✅ Save successful: {save_result.get('message')}")
            print(f"📅 Timestamp: {save_result.get('timestamp')}")
        else:
            print(f"❌ Save failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error saving websiteStyle: {e}")
        return False
    
    # Step 4: Wait and retrieve to check persistence
    print("\n⏳ STEP 4: Waiting 3 seconds then checking persistence...")
    time.sleep(3)
    
    try:
        response = requests.get(f"{api_base}/league-data", timeout=10)
        if response.status_code == 200:
            retrieved_data = response.json()
            retrieved_websitestyle = retrieved_data.get('websiteStyle', {})
            
            print(f"📥 Retrieved websiteStyle: {json.dumps(retrieved_websitestyle, indent=2)}")
            
            # Check if it's empty
            if not retrieved_websitestyle or retrieved_websitestyle == {}:
                print("❌ BUG CONFIRMED: websiteStyle returned as empty object!")
                return False
            
            # Check if all saved properties are present
            saved_keys = set(realistic_websitestyle.keys())
            retrieved_keys = set(retrieved_websitestyle.keys())
            missing_keys = saved_keys - retrieved_keys
            extra_keys = retrieved_keys - saved_keys
            
            if missing_keys:
                print(f"⚠️  Missing keys: {missing_keys}")
            if extra_keys:
                print(f"ℹ️  Extra keys: {extra_keys}")
            
            # Check if key values match
            mismatches = []
            for key in saved_keys & retrieved_keys:
                if realistic_websitestyle[key] != retrieved_websitestyle[key]:
                    mismatches.append(f"{key}: saved '{realistic_websitestyle[key]}' != retrieved '{retrieved_websitestyle[key]}'")
            
            if mismatches:
                print(f"⚠️  Value mismatches: {mismatches}")
            
            if not missing_keys and not mismatches:
                print("✅ All websiteStyle data persisted correctly!")
                return True
            else:
                print("❌ websiteStyle data persistence has issues!")
                return False
                
        else:
            print(f"❌ Failed to retrieve league data: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error retrieving league data: {e}")
        return False

def test_edge_cases():
    """Test edge cases that might cause the bug"""
    
    backend_url = get_backend_url()
    api_base = f"{backend_url}/api"
    
    print("\n🔬 TESTING EDGE CASES...")
    print("=" * 50)
    
    edge_cases = [
        # Empty websiteStyle
        {"name": "Empty Object", "data": {}},
        
        # Null/None values
        {"name": "Null Values", "data": {"theme": None, "primaryColor": None}},
        
        # Very large websiteStyle
        {"name": "Large Object", "data": {f"property_{i}": f"value_{i}" for i in range(50)}},
        
        # Special characters
        {"name": "Special Characters", "data": {
            "customCSS": ".test { content: 'Hello \"World\"'; background: url('image.jpg'); }",
            "bannerText": "Welcome! @#$%^&*()_+-=[]{}|;':\",./<>?",
            "theme": "custom-theme-with-dashes"
        }},
        
        # Nested objects
        {"name": "Nested Objects", "data": {
            "logo": {
                "url": "test.jpg",
                "settings": {
                    "size": "large",
                    "position": {"x": 10, "y": 20}
                }
            }
        }}
    ]
    
    results = []
    
    for case in edge_cases:
        print(f"\n🧪 Testing: {case['name']}")
        
        try:
            # Save
            save_response = requests.post(
                f"{api_base}/league-data/websiteStyle",
                json=case['data'],
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if save_response.status_code != 200:
                print(f"❌ Save failed: {save_response.status_code}")
                results.append(False)
                continue
            
            time.sleep(1)
            
            # Retrieve
            get_response = requests.get(f"{api_base}/league-data", timeout=10)
            
            if get_response.status_code == 200:
                data = get_response.json()
                websitestyle = data.get('websiteStyle', {})
                
                if case['name'] == "Empty Object":
                    # For empty object, check if it stays empty or gets default values
                    if websitestyle == {} or websitestyle == case['data']:
                        print("✅ Empty object handled correctly")
                        results.append(True)
                    else:
                        print(f"⚠️  Empty object became: {websitestyle}")
                        results.append(False)
                else:
                    # For other cases, check if data persisted
                    if websitestyle == case['data']:
                        print("✅ Data persisted correctly")
                        results.append(True)
                    elif websitestyle == {}:
                        print("❌ Data lost - returned empty object")
                        results.append(False)
                    else:
                        print(f"⚠️  Data changed: {websitestyle}")
                        results.append(False)
            else:
                print(f"❌ Retrieve failed: {get_response.status_code}")
                results.append(False)
                
        except Exception as e:
            print(f"❌ Error: {e}")
            results.append(False)
    
    success_rate = (sum(results) / len(results)) * 100 if results else 0
    print(f"\n📊 Edge case success rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")
    
    return all(results)

if __name__ == "__main__":
    print("🔍 DETAILED WEBSITESTYLE PERSISTENCE INVESTIGATION")
    print("=" * 80)
    
    # Test realistic scenario
    realistic_success = test_realistic_websitestyle_scenario()
    
    # Test edge cases
    edge_case_success = test_edge_cases()
    
    print("\n" + "=" * 80)
    print("📋 FINAL SUMMARY")
    print("=" * 80)
    
    if realistic_success and edge_case_success:
        print("✅ ALL TESTS PASSED: websiteStyle persistence is working correctly")
        print("   - Realistic frontend scenario works")
        print("   - Edge cases handled properly")
        print("   - Bug may be environment-specific or intermittent")
    elif realistic_success and not edge_case_success:
        print("⚠️  MIXED RESULTS: Basic functionality works but edge cases fail")
        print("   - Normal websiteStyle data persists correctly")
        print("   - Some edge cases cause data loss")
    elif not realistic_success:
        print("❌ BUG CONFIRMED: websiteStyle persistence is failing")
        print("   - Basic save/retrieve cycle fails")
        print("   - This explains user reports of lost customizations")
    
    sys.exit(0 if realistic_success else 1)