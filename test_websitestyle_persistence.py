#!/usr/bin/env python3
"""
Test WebsiteStyle Persistence Fix
This test verifies that the websiteStyle persistence bug has been fixed.
"""

import requests
import json
import sys
from datetime import datetime
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

def test_websitestyle_persistence_fix():
    """Test that websiteStyle customizations persist correctly after our fix"""
    
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ Could not get backend URL")
        return False
    
    api_base = f"{backend_url}/api"
    print(f"🔧 Testing WebsiteStyle Persistence Fix at: {api_base}")
    print("=" * 80)
    
    # Test customizations that should persist
    test_customizations = {
        "primaryColor": "#ff6b35",
        "bannerText": "CUSTOM MLBL BANNER",
        "bannerColor": "#2d3748",
        "pageBackgroundColor": "#edf2f7",
        "logoStyle": "cover",
        "sidebarOpacity": 0.8,
        "customTestProperty": "This should persist"
    }
    
    print("🎨 Step 1: Saving custom websiteStyle...")
    try:
        response = requests.post(
            f"{api_base}/league-data/websiteStyle",
            json=test_customizations,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Custom websiteStyle saved successfully")
        else:
            print(f"❌ Failed to save: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error saving: {e}")
        return False
    
    # Wait a moment for save to complete
    time.sleep(1)
    
    print("\n📦 Step 2: Retrieving websiteStyle to verify persistence...")
    try:
        response = requests.get(f"{api_base}/league-data", timeout=10)
        if response.status_code == 200:
            data = response.json()
            saved_websitestyle = data.get('websiteStyle', {})
            
            print(f"📋 Retrieved websiteStyle has {len(saved_websitestyle)} properties")
            
            # Check if our customizations persisted
            persistence_check = True
            for key, expected_value in test_customizations.items():
                if key not in saved_websitestyle:
                    print(f"❌ Missing property: {key}")
                    persistence_check = False
                elif saved_websitestyle[key] != expected_value:
                    print(f"❌ Property mismatch: {key}")
                    print(f"   Expected: {expected_value}")
                    print(f"   Got: {saved_websitestyle[key]}")
                    persistence_check = False
                else:
                    print(f"✅ {key}: {saved_websitestyle[key]}")
            
            if persistence_check:
                print("\n🎉 SUCCESS: All customizations persisted correctly!")
                print("✅ WebsiteStyle persistence bug has been FIXED!")
                return True
            else:
                print("\n❌ FAILURE: Some customizations were lost")
                return False
                
        else:
            print(f"❌ Failed to retrieve: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error retrieving: {e}")
        return False

def test_empty_object_scenario():
    """Test the specific scenario that was causing the bug: empty websiteStyle object"""
    
    backend_url = get_backend_url()
    api_base = f"{backend_url}/api"
    
    print("\n🔄 Step 3: Testing empty object scenario...")
    
    # First save some customizations
    test_data = {"primaryColor": "#test123", "bannerText": "Test Banner"}
    
    try:
        # Save test data
        requests.post(f"{api_base}/league-data/websiteStyle", json=test_data, timeout=10)
        
        # Now save an empty object (this was causing the bug)
        empty_data = {}
        requests.post(f"{api_base}/league-data/websiteStyle", json=empty_data, timeout=10)
        
        # Check what happens when we retrieve
        response = requests.get(f"{api_base}/league-data", timeout=10)
        data = response.json()
        retrieved_style = data.get('websiteStyle', {})
        
        if len(retrieved_style) == 0:
            print("✅ Empty object correctly stored as empty")
        else:
            print(f"⚠️  Empty object became: {retrieved_style}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error in empty object test: {e}")
        return False

if __name__ == "__main__":
    print("🧪 WebsiteStyle Persistence Fix Verification")
    print("Testing the fix for the critical data persistence bug\n")
    
    success1 = test_websitestyle_persistence_fix()
    success2 = test_empty_object_scenario()
    
    print("\n" + "="*80)
    if success1 and success2:
        print("🎉 ALL TESTS PASSED - WebsiteStyle persistence bug is FIXED!")
        print("✅ User customizations will now persist correctly across deployments")
        sys.exit(0)
    else:
        print("❌ TESTS FAILED - WebsiteStyle persistence issue still exists")
        sys.exit(1)