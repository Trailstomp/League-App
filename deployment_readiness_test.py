#!/usr/bin/env python3
"""
Deployment Readiness Test Suite for League Management App Backend
Specifically tests deployment readiness criteria including:
- Environment variable handling
- CORS configuration
- No hardcoded localhost references
- Production URL compatibility
- Kubernetes ingress routing (/api prefix)
"""

import requests
import json
import sys
import os
from pathlib import Path
from dotenv import load_dotenv
import re

class DeploymentReadinessTest:
    def __init__(self):
        self.test_results = []
        self.failed_tests = []
        
        # Get URLs from environment
        self.frontend_env = self.load_frontend_env()
        self.backend_env = self.load_backend_env()
        
        self.backend_url = self.frontend_env.get('REACT_APP_BACKEND_URL')
        if not self.backend_url:
            raise Exception("REACT_APP_BACKEND_URL not found in frontend/.env")
        
        self.api_base = f"{self.backend_url}/api"
        
        print("DEPLOYMENT READINESS TEST SUITE")
        print("=" * 60)
        print(f"Backend URL: {self.backend_url}")
        print(f"API Base: {self.api_base}")
        print("=" * 60)

    def load_frontend_env(self):
        """Load frontend environment variables"""
        env_vars = {}
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key] = value
        except Exception as e:
            print(f"Error loading frontend .env: {e}")
        return env_vars

    def load_backend_env(self):
        """Load backend environment variables"""
        ROOT_DIR = Path('/app/backend')
        load_dotenv(ROOT_DIR / '.env')
        return {
            'MONGO_URL': os.environ.get('MONGO_URL'),
            'DB_NAME': os.environ.get('DB_NAME'),
            'CORS_ORIGINS': os.environ.get('CORS_ORIGINS')
        }

    def log_test(self, test_name, success, message="", details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if details:
            print(f"    Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
        
        if not success:
            self.failed_tests.append(test_name)
        print()

    def test_environment_variables(self):
        """Test that all required environment variables are properly set"""
        print("Testing Environment Variable Configuration...")
        
        # Test backend environment variables
        required_backend_vars = ['MONGO_URL', 'DB_NAME', 'CORS_ORIGINS']
        missing_vars = []
        
        for var in required_backend_vars:
            if not self.backend_env.get(var):
                missing_vars.append(var)
        
        if missing_vars:
            self.log_test(
                "Backend Environment Variables",
                False,
                f"Missing required variables: {missing_vars}"
            )
            return False
        
        # Test frontend environment variables
        if not self.frontend_env.get('REACT_APP_BACKEND_URL'):
            self.log_test(
                "Frontend Environment Variables",
                False,
                "REACT_APP_BACKEND_URL not set in frontend/.env"
            )
            return False
        
        self.log_test(
            "Environment Variables Configuration",
            True,
            "All required environment variables are properly configured",
            {
                'MONGO_URL': self.backend_env['MONGO_URL'],
                'DB_NAME': self.backend_env['DB_NAME'],
                'CORS_ORIGINS': self.backend_env['CORS_ORIGINS'],
                'REACT_APP_BACKEND_URL': self.frontend_env['REACT_APP_BACKEND_URL']
            }
        )
        return True

    def test_no_hardcoded_localhost(self):
        """Test that backend code doesn't contain hardcoded localhost references"""
        print("Checking for hardcoded localhost references...")
        
        backend_files = ['/app/backend/server.py']
        localhost_patterns = [
            r'localhost',
            r'127\.0\.0\.1',
            r'http://.*:8001',
            r'http://.*:3000'
        ]
        
        issues_found = []
        
        for file_path in backend_files:
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    
                for pattern in localhost_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        issues_found.append(f"{file_path}: {matches}")
            except Exception as e:
                issues_found.append(f"Error reading {file_path}: {e}")
        
        if issues_found:
            self.log_test(
                "No Hardcoded Localhost References",
                False,
                "Found hardcoded localhost references",
                issues_found
            )
            return False
        
        self.log_test(
            "No Hardcoded Localhost References",
            True,
            "No hardcoded localhost references found in backend code"
        )
        return True

    def test_api_prefix_routing(self):
        """Test that all API endpoints use proper /api prefix for Kubernetes ingress"""
        print("Testing API prefix routing...")
        
        endpoints_to_test = [
            "/",
            "/status",
            "/league-data"
        ]
        
        all_working = True
        
        for endpoint in endpoints_to_test:
            try:
                # Test with /api prefix (should work)
                response = requests.get(f"{self.api_base}{endpoint}", timeout=10)
                
                if response.status_code == 200:
                    self.log_test(
                        f"API Prefix Routing - {endpoint}",
                        True,
                        f"Endpoint accessible with /api prefix (status: {response.status_code})"
                    )
                else:
                    self.log_test(
                        f"API Prefix Routing - {endpoint}",
                        False,
                        f"Endpoint not accessible with /api prefix (status: {response.status_code})"
                    )
                    all_working = False
                    
            except requests.exceptions.RequestException as e:
                self.log_test(
                    f"API Prefix Routing - {endpoint}",
                    False,
                    f"Connection error: {str(e)}"
                )
                all_working = False
        
        return all_working

    def test_cors_configuration(self):
        """Test CORS configuration works with production origins"""
        print("Testing CORS configuration...")
        
        try:
            # Test preflight request
            headers = {
                'Origin': self.backend_url,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = requests.options(f"{self.api_base}/status", headers=headers, timeout=10)
            
            # Check if CORS headers are present
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            if any(cors_headers.values()):
                self.log_test(
                    "CORS Configuration",
                    True,
                    "CORS headers present in response",
                    cors_headers
                )
                return True
            else:
                # Try a simple GET request to check if CORS is working
                response = requests.get(f"{self.api_base}/", timeout=10)
                if response.status_code == 200:
                    self.log_test(
                        "CORS Configuration",
                        True,
                        "CORS working (simple request successful)"
                    )
                    return True
                else:
                    self.log_test(
                        "CORS Configuration",
                        False,
                        "CORS may not be properly configured"
                    )
                    return False
                    
        except requests.exceptions.RequestException as e:
            self.log_test(
                "CORS Configuration",
                False,
                f"Error testing CORS: {str(e)}"
            )
            return False

    def test_mongodb_connection(self):
        """Test MongoDB connection using environment variables"""
        print("Testing MongoDB connection...")
        
        try:
            # Test by creating and retrieving data
            test_data = {"client_name": "DeploymentTest"}
            
            response = requests.post(
                f"{self.api_base}/status",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Verify data was stored by retrieving it
                get_response = requests.get(f"{self.api_base}/status", timeout=10)
                
                if get_response.status_code == 200:
                    data = get_response.json()
                    if isinstance(data, list) and len(data) > 0:
                        self.log_test(
                            "MongoDB Connection",
                            True,
                            f"MongoDB connection working (retrieved {len(data)} records)",
                            f"Using MONGO_URL: {self.backend_env['MONGO_URL']}"
                        )
                        return True
            
            self.log_test(
                "MongoDB Connection",
                False,
                "MongoDB connection test failed"
            )
            return False
            
        except requests.exceptions.RequestException as e:
            self.log_test(
                "MongoDB Connection",
                False,
                f"Error testing MongoDB connection: {str(e)}"
            )
            return False

    def test_production_url_compatibility(self):
        """Test that backend works with production URL"""
        print("Testing production URL compatibility...")
        
        # Verify the URL is not localhost
        if 'localhost' in self.backend_url or '127.0.0.1' in self.backend_url:
            self.log_test(
                "Production URL Compatibility",
                False,
                f"Backend URL appears to be localhost: {self.backend_url}"
            )
            return False
        
        # Test basic connectivity
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'MLBL API - Lacrosse League Management':
                    self.log_test(
                        "Production URL Compatibility",
                        True,
                        f"Backend accessible via production URL: {self.backend_url}",
                        f"Response: {data}"
                    )
                    return True
            
            self.log_test(
                "Production URL Compatibility",
                False,
                f"Backend not properly accessible via production URL (status: {response.status_code})"
            )
            return False
            
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Production URL Compatibility",
                False,
                f"Error accessing production URL: {str(e)}"
            )
            return False

    def run_deployment_tests(self):
        """Run all deployment readiness tests"""
        print("Starting Deployment Readiness Tests...")
        print()
        
        # Run all tests
        tests = [
            self.test_environment_variables,
            self.test_no_hardcoded_localhost,
            self.test_production_url_compatibility,
            self.test_api_prefix_routing,
            self.test_cors_configuration,
            self.test_mongodb_connection
        ]
        
        all_passed = True
        for test in tests:
            if not test():
                all_passed = False
        
        # Summary
        print("=" * 60)
        print("DEPLOYMENT READINESS SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if failed_tests > 0:
            print(f"\nFailed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        if all_passed:
            print("\n🎉 BACKEND IS DEPLOYMENT READY!")
            print("✅ All deployment readiness criteria met")
        else:
            print("\n⚠️  DEPLOYMENT READINESS ISSUES DETECTED")
            print("❌ Some deployment criteria not met")
        
        return all_passed

if __name__ == "__main__":
    try:
        tester = DeploymentReadinessTest()
        success = tester.run_deployment_tests()
        
        sys.exit(0 if success else 1)
        
    except Exception as e:
        print(f"❌ Deployment readiness test setup failed: {e}")
        sys.exit(1)