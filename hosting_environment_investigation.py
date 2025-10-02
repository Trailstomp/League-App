#!/usr/bin/env python3

import requests
import json
import sys
import socket
import ssl
import time
from datetime import datetime
from urllib.parse import urlparse
import subprocess
import os

# Production and Preview URLs for comparison
PRODUCTION_URL = "https://team-lax-portal.emergent.host"
PREVIEW_URL = "https://lacrosse-league-3.preview.emergentagent.com"

# Google OAuth endpoints to test
GOOGLE_OAUTH_ENDPOINTS = [
    "https://oauth2.googleapis.com",
    "https://accounts.google.com",
    "https://www.googleapis.com"
]

def test_dns_resolution():
    """Test DNS resolution for Google OAuth domains"""
    print("\n🔍 TESTING DNS RESOLUTION...")
    
    domains_to_test = [
        "oauth2.googleapis.com",
        "accounts.google.com",
        "www.googleapis.com",
        "googleapis.com"
    ]
    
    results = {}
    
    for domain in domains_to_test:
        try:
            ip_address = socket.gethostbyname(domain)
            print(f"✅ {domain} → {ip_address}")
            results[domain] = {"status": "success", "ip": ip_address}
        except socket.gaierror as e:
            print(f"❌ {domain} → DNS Resolution Failed: {e}")
            results[domain] = {"status": "failed", "error": str(e)}
        except Exception as e:
            print(f"❌ {domain} → Unexpected Error: {e}")
            results[domain] = {"status": "error", "error": str(e)}
    
    return results

def test_ssl_tls_connectivity():
    """Test SSL/TLS connectivity to Google OAuth servers"""
    print("\n🔍 TESTING SSL/TLS CONNECTIVITY...")
    
    endpoints_to_test = [
        ("oauth2.googleapis.com", 443),
        ("accounts.google.com", 443),
        ("www.googleapis.com", 443)
    ]
    
    results = {}
    
    for hostname, port in endpoints_to_test:
        try:
            # Create SSL context
            context = ssl.create_default_context()
            
            # Test SSL connection
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    cipher = ssock.cipher()
                    
                    print(f"✅ {hostname}:{port}")
                    print(f"   - SSL Version: {ssock.version()}")
                    print(f"   - Cipher: {cipher[0] if cipher else 'Unknown'}")
                    print(f"   - Certificate Subject: {cert.get('subject', 'Unknown')}")
                    print(f"   - Certificate Issuer: {cert.get('issuer', 'Unknown')}")
                    
                    results[hostname] = {
                        "status": "success",
                        "ssl_version": ssock.version(),
                        "cipher": cipher[0] if cipher else None,
                        "cert_subject": cert.get('subject'),
                        "cert_issuer": cert.get('issuer')
                    }
                    
        except ssl.SSLError as e:
            print(f"❌ {hostname}:{port} → SSL Error: {e}")
            results[hostname] = {"status": "ssl_error", "error": str(e)}
        except socket.timeout as e:
            print(f"❌ {hostname}:{port} → Timeout: {e}")
            results[hostname] = {"status": "timeout", "error": str(e)}
        except Exception as e:
            print(f"❌ {hostname}:{port} → Connection Failed: {e}")
            results[hostname] = {"status": "failed", "error": str(e)}
    
    return results

def test_http_connectivity():
    """Test HTTP connectivity to Google OAuth endpoints"""
    print("\n🔍 TESTING HTTP CONNECTIVITY TO GOOGLE OAUTH...")
    
    results = {}
    
    for endpoint in GOOGLE_OAUTH_ENDPOINTS:
        try:
            print(f"\n🌐 Testing {endpoint}...")
            
            # Test basic GET request
            response = requests.get(endpoint, timeout=30, allow_redirects=True)
            
            print(f"✅ Status Code: {response.status_code}")
            print(f"   - Response Time: {response.elapsed.total_seconds():.2f}s")
            print(f"   - Final URL: {response.url}")
            print(f"   - Content Length: {len(response.content)} bytes")
            
            # Check response headers
            important_headers = ['server', 'content-type', 'cache-control', 'strict-transport-security']
            print("   - Response Headers:")
            for header in important_headers:
                if header in response.headers:
                    print(f"     {header}: {response.headers[header]}")
            
            results[endpoint] = {
                "status": "success",
                "status_code": response.status_code,
                "response_time": response.elapsed.total_seconds(),
                "final_url": response.url,
                "content_length": len(response.content),
                "headers": dict(response.headers)
            }
            
        except requests.exceptions.Timeout as e:
            print(f"❌ {endpoint} → Timeout: {e}")
            results[endpoint] = {"status": "timeout", "error": str(e)}
        except requests.exceptions.ConnectionError as e:
            print(f"❌ {endpoint} → Connection Error: {e}")
            results[endpoint] = {"status": "connection_error", "error": str(e)}
        except requests.exceptions.SSLError as e:
            print(f"❌ {endpoint} → SSL Error: {e}")
            results[endpoint] = {"status": "ssl_error", "error": str(e)}
        except Exception as e:
            print(f"❌ {endpoint} → Unexpected Error: {e}")
            results[endpoint] = {"status": "error", "error": str(e)}
    
    return results

def test_oauth_token_endpoint():
    """Test specific OAuth token endpoint with mock request"""
    print("\n🔍 TESTING OAUTH TOKEN ENDPOINT...")
    
    token_endpoint = "https://oauth2.googleapis.com/token"
    
    try:
        # Test with invalid but properly formatted request to see if endpoint is reachable
        mock_data = {
            'grant_type': 'authorization_code',
            'code': 'test_code_for_connectivity_check',
            'client_id': 'test_client_id',
            'client_secret': 'test_client_secret',
            'redirect_uri': 'https://example.com'
        }
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'HostingEnvironmentTest/1.0'
        }
        
        print(f"🌐 Testing POST to {token_endpoint}...")
        
        response = requests.post(
            token_endpoint,
            data=mock_data,
            headers=headers,
            timeout=30
        )
        
        print(f"✅ Token Endpoint Reachable")
        print(f"   - Status Code: {response.status_code}")
        print(f"   - Response Time: {response.elapsed.total_seconds():.2f}s")
        print(f"   - Content Type: {response.headers.get('content-type', 'Unknown')}")
        
        # We expect a 400 error with our mock data, which means the endpoint is working
        if response.status_code == 400:
            try:
                error_data = response.json()
                print(f"   - Expected 400 Error: {error_data.get('error', 'Unknown')}")
                print(f"   - Error Description: {error_data.get('error_description', 'None')}")
            except:
                print(f"   - Response Body: {response.text[:200]}...")
        
        return {
            "status": "reachable",
            "status_code": response.status_code,
            "response_time": response.elapsed.total_seconds(),
            "headers": dict(response.headers),
            "expected_400": response.status_code == 400
        }
        
    except requests.exceptions.Timeout as e:
        print(f"❌ Token Endpoint → Timeout: {e}")
        return {"status": "timeout", "error": str(e)}
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Token Endpoint → Connection Error: {e}")
        return {"status": "connection_error", "error": str(e)}
    except Exception as e:
        print(f"❌ Token Endpoint → Error: {e}")
        return {"status": "error", "error": str(e)}

def test_production_vs_preview_oauth():
    """Compare OAuth functionality between production and preview environments"""
    print("\n🔍 COMPARING PRODUCTION VS PREVIEW OAUTH...")
    
    environments = {
        "production": PRODUCTION_URL,
        "preview": PREVIEW_URL
    }
    
    results = {}
    
    for env_name, base_url in environments.items():
        print(f"\n🌐 Testing {env_name.upper()} environment: {base_url}")
        
        try:
            # Test basic connectivity
            response = requests.get(f"{base_url}/api/", timeout=15)
            
            if response.status_code == 200:
                print(f"✅ {env_name} API accessible")
                
                # Test cloud storage config endpoint
                try:
                    config_response = requests.get(f"{base_url}/api/cloud-storage", timeout=15)
                    print(f"   - Cloud Storage Config: {config_response.status_code}")
                    
                    if config_response.status_code == 200:
                        config_data = config_response.json()
                        google_drive = config_data.get('googleDrive', {})
                        
                        print(f"   - Google Drive Enabled: {google_drive.get('enabled', False)}")
                        print(f"   - Client ID Present: {'✅' if google_drive.get('clientId') else '❌'}")
                        print(f"   - Redirect URI: {google_drive.get('redirectUri', 'Not set')}")
                        
                        # Test auth URL generation
                        try:
                            auth_url_response = requests.get(f"{base_url}/api/cloud-storage/google-drive/auth-url", timeout=15)
                            print(f"   - Auth URL Generation: {auth_url_response.status_code}")
                            
                            if auth_url_response.status_code == 200:
                                auth_data = auth_url_response.json()
                                auth_url = auth_data.get('authUrl', '')
                                print(f"   - Auth URL Length: {len(auth_url)} chars")
                                print(f"   - Contains Google Domain: {'✅' if 'accounts.google.com' in auth_url else '❌'}")
                            
                        except Exception as e:
                            print(f"   - Auth URL Test Failed: {e}")
                    
                except Exception as e:
                    print(f"   - Cloud Storage Test Failed: {e}")
                
                results[env_name] = {
                    "status": "accessible",
                    "api_status": response.status_code,
                    "response_time": response.elapsed.total_seconds()
                }
                
            else:
                print(f"❌ {env_name} API not accessible: {response.status_code}")
                results[env_name] = {
                    "status": "not_accessible",
                    "api_status": response.status_code
                }
                
        except requests.exceptions.Timeout as e:
            print(f"❌ {env_name} → Timeout: {e}")
            results[env_name] = {"status": "timeout", "error": str(e)}
        except requests.exceptions.ConnectionError as e:
            print(f"❌ {env_name} → Connection Error: {e}")
            results[env_name] = {"status": "connection_error", "error": str(e)}
        except Exception as e:
            print(f"❌ {env_name} → Error: {e}")
            results[env_name] = {"status": "error", "error": str(e)}
    
    return results

def test_network_routing():
    """Test network routing and trace to Google servers"""
    print("\n🔍 TESTING NETWORK ROUTING...")
    
    results = {}
    
    # Test ping to Google OAuth servers
    hosts_to_ping = [
        "oauth2.googleapis.com",
        "accounts.google.com"
    ]
    
    for host in hosts_to_ping:
        try:
            print(f"\n🌐 Testing connectivity to {host}...")
            
            # Use ping command (works in most environments)
            result = subprocess.run(
                ["ping", "-c", "3", host],
                capture_output=True,
                text=True,
                timeout=15
            )
            
            if result.returncode == 0:
                print(f"✅ Ping to {host} successful")
                # Extract average time from ping output
                output_lines = result.stdout.split('\n')
                for line in output_lines:
                    if 'avg' in line or 'average' in line:
                        print(f"   - {line.strip()}")
                        break
                
                results[host] = {"status": "success", "ping_output": result.stdout}
            else:
                print(f"❌ Ping to {host} failed")
                print(f"   - Error: {result.stderr}")
                results[host] = {"status": "failed", "error": result.stderr}
                
        except subprocess.TimeoutExpired:
            print(f"❌ Ping to {host} timed out")
            results[host] = {"status": "timeout"}
        except Exception as e:
            print(f"❌ Ping to {host} error: {e}")
            results[host] = {"status": "error", "error": str(e)}
    
    return results

def test_curl_to_google_oauth():
    """Test direct curl requests to Google OAuth endpoints"""
    print("\n🔍 TESTING DIRECT CURL TO GOOGLE OAUTH...")
    
    results = {}
    
    # Test curl to OAuth endpoints
    curl_tests = [
        {
            "name": "OAuth2 Token Endpoint",
            "url": "https://oauth2.googleapis.com/token",
            "method": "POST",
            "data": "grant_type=test&client_id=test"
        },
        {
            "name": "OAuth2 Base",
            "url": "https://oauth2.googleapis.com",
            "method": "GET"
        },
        {
            "name": "Google Accounts",
            "url": "https://accounts.google.com",
            "method": "GET"
        }
    ]
    
    for test in curl_tests:
        try:
            print(f"\n🌐 Testing {test['name']}: {test['url']}")
            
            if test['method'] == 'POST':
                cmd = [
                    "curl", "-X", "POST",
                    "-H", "Content-Type: application/x-www-form-urlencoded",
                    "-H", "User-Agent: HostingEnvironmentTest/1.0",
                    "-d", test['data'],
                    "--connect-timeout", "15",
                    "--max-time", "30",
                    "-w", "HTTP_CODE:%{http_code};TIME:%{time_total};SIZE:%{size_download}",
                    "-s", "-S",
                    test['url']
                ]
            else:
                cmd = [
                    "curl", "-X", "GET",
                    "-H", "User-Agent: HostingEnvironmentTest/1.0",
                    "--connect-timeout", "15",
                    "--max-time", "30",
                    "-w", "HTTP_CODE:%{http_code};TIME:%{time_total};SIZE:%{size_download}",
                    "-s", "-S",
                    test['url']
                ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
            
            if result.returncode == 0:
                output = result.stdout
                # Extract metrics from curl output
                if "HTTP_CODE:" in output:
                    metrics_line = output.split('\n')[-1]
                    print(f"✅ {test['name']} accessible")
                    print(f"   - Metrics: {metrics_line}")
                else:
                    print(f"✅ {test['name']} accessible")
                    print(f"   - Response length: {len(output)} chars")
                
                results[test['name']] = {
                    "status": "success",
                    "output": output[:500] + "..." if len(output) > 500 else output
                }
            else:
                print(f"❌ {test['name']} failed")
                print(f"   - Error: {result.stderr}")
                results[test['name']] = {"status": "failed", "error": result.stderr}
                
        except subprocess.TimeoutExpired:
            print(f"❌ {test['name']} timed out")
            results[test['name']] = {"status": "timeout"}
        except Exception as e:
            print(f"❌ {test['name']} error: {e}")
            results[test['name']] = {"status": "error", "error": str(e)}
    
    return results

def test_production_oauth_with_real_credentials():
    """Test production OAuth with real credentials from database"""
    print("\n🔍 TESTING PRODUCTION OAUTH WITH REAL CREDENTIALS...")
    
    try:
        # Get cloud storage config from production
        response = requests.get(f"{PRODUCTION_URL}/api/cloud-storage", timeout=15)
        
        if response.status_code != 200:
            print(f"❌ Cannot access production cloud storage config: {response.status_code}")
            return {"status": "config_not_accessible"}
        
        config = response.json()
        google_drive = config.get('googleDrive', {})
        
        print(f"✅ Production config retrieved")
        print(f"   - Google Drive Enabled: {google_drive.get('enabled', False)}")
        print(f"   - Client ID Present: {'✅' if google_drive.get('clientId') else '❌'}")
        print(f"   - Client Secret Present: {'✅' if google_drive.get('clientSecret') else '❌'}")
        print(f"   - Redirect URI: {google_drive.get('redirectUri', 'Not set')}")
        
        if not google_drive.get('clientId') or not google_drive.get('clientSecret'):
            print("❌ Missing OAuth credentials in production")
            return {"status": "missing_credentials"}
        
        # Test OAuth URL generation
        try:
            auth_url_response = requests.get(f"{PRODUCTION_URL}/api/cloud-storage/google-drive/auth-url", timeout=15)
            print(f"   - Auth URL Generation: {auth_url_response.status_code}")
            
            if auth_url_response.status_code == 200:
                auth_data = auth_url_response.json()
                auth_url = auth_data.get('authUrl', '')
                
                print(f"   - Auth URL Generated: ✅")
                print(f"   - URL Length: {len(auth_url)} chars")
                print(f"   - Contains Google Domain: {'✅' if 'accounts.google.com' in auth_url else '❌'}")
                print(f"   - Contains Client ID: {'✅' if google_drive.get('clientId') in auth_url else '❌'}")
                print(f"   - Contains Redirect URI: {'✅' if google_drive.get('redirectUri') in auth_url else '❌'}")
                
                # Test if the generated URL is accessible
                try:
                    url_test_response = requests.get(auth_url, timeout=15, allow_redirects=False)
                    print(f"   - Auth URL Accessible: {url_test_response.status_code}")
                    
                    if url_test_response.status_code in [200, 302, 400]:
                        print(f"   - Google OAuth Server Responding: ✅")
                    else:
                        print(f"   - Google OAuth Server Issue: ❌")
                        
                except Exception as e:
                    print(f"   - Auth URL Test Failed: {e}")
                
            else:
                print(f"   - Auth URL Generation Failed: {auth_url_response.status_code}")
                if auth_url_response.text:
                    print(f"   - Error: {auth_url_response.text[:200]}...")
        
        except Exception as e:
            print(f"   - Auth URL Test Error: {e}")
        
        # Test connection test endpoint
        try:
            test_data = {"provider": "google-drive"}
            test_response = requests.post(
                f"{PRODUCTION_URL}/api/cloud-storage/test-connection",
                json=test_data,
                timeout=15
            )
            
            print(f"   - Connection Test: {test_response.status_code}")
            
            if test_response.status_code == 200:
                test_result = test_response.json()
                print(f"   - Test Status: {test_result.get('status', 'Unknown')}")
                print(f"   - Test Message: {test_result.get('message', 'No message')}")
            
        except Exception as e:
            print(f"   - Connection Test Error: {e}")
        
        return {
            "status": "tested",
            "config_accessible": True,
            "credentials_present": bool(google_drive.get('clientId') and google_drive.get('clientSecret')),
            "google_drive_config": google_drive
        }
        
    except Exception as e:
        print(f"❌ Production OAuth test failed: {e}")
        return {"status": "error", "error": str(e)}

def main():
    """Main investigation execution"""
    print("🚨 EMERGENT.HOST PRODUCTION HOSTING ENVIRONMENT INVESTIGATION")
    print("🔍 Investigating Google OAuth Request Blocking")
    print("=" * 80)
    
    # Test results tracking
    results = {
        'dns_resolution': {},
        'ssl_tls_connectivity': {},
        'http_connectivity': {},
        'oauth_token_endpoint': {},
        'production_vs_preview': {},
        'network_routing': {},
        'curl_tests': {},
        'production_oauth_real': {}
    }
    
    # Execute comprehensive tests
    print(f"\n🕐 Starting investigation at {datetime.now().isoformat()}")
    
    try:
        results['dns_resolution'] = test_dns_resolution()
        results['ssl_tls_connectivity'] = test_ssl_tls_connectivity()
        results['http_connectivity'] = test_http_connectivity()
        results['oauth_token_endpoint'] = test_oauth_token_endpoint()
        results['production_vs_preview'] = test_production_vs_preview_oauth()
        results['network_routing'] = test_network_routing()
        results['curl_tests'] = test_curl_to_google_oauth()
        results['production_oauth_real'] = test_production_oauth_with_real_credentials()
        
    except KeyboardInterrupt:
        print("\n⚠️ Investigation interrupted by user")
        return False
    except Exception as e:
        print(f"\n❌ Investigation failed with error: {e}")
        return False
    
    # Analysis and Summary
    print("\n" + "=" * 80)
    print("📊 HOSTING ENVIRONMENT INVESTIGATION SUMMARY")
    print("=" * 80)
    
    # DNS Analysis
    dns_success = sum(1 for r in results['dns_resolution'].values() if r.get('status') == 'success')
    dns_total = len(results['dns_resolution'])
    print(f"\n🌐 DNS Resolution: {dns_success}/{dns_total} domains resolved")
    
    # SSL Analysis
    ssl_success = sum(1 for r in results['ssl_tls_connectivity'].values() if r.get('status') == 'success')
    ssl_total = len(results['ssl_tls_connectivity'])
    print(f"🔒 SSL/TLS Connectivity: {ssl_success}/{ssl_total} endpoints accessible")
    
    # HTTP Analysis
    http_success = sum(1 for r in results['http_connectivity'].values() if r.get('status') == 'success')
    http_total = len(results['http_connectivity'])
    print(f"🌍 HTTP Connectivity: {http_success}/{http_total} endpoints accessible")
    
    # OAuth Token Endpoint
    oauth_status = results['oauth_token_endpoint'].get('status', 'unknown')
    print(f"🔑 OAuth Token Endpoint: {'✅ Reachable' if oauth_status == 'reachable' else '❌ Not Reachable'}")
    
    # Environment Comparison
    prod_status = results['production_vs_preview'].get('production', {}).get('status', 'unknown')
    preview_status = results['production_vs_preview'].get('preview', {}).get('status', 'unknown')
    print(f"🏭 Production Environment: {'✅ Accessible' if prod_status == 'accessible' else '❌ Issues'}")
    print(f"🔬 Preview Environment: {'✅ Accessible' if preview_status == 'accessible' else '❌ Issues'}")
    
    # Network Routing
    ping_success = sum(1 for r in results['network_routing'].values() if r.get('status') == 'success')
    ping_total = len(results['network_routing'])
    print(f"📡 Network Routing: {ping_success}/{ping_total} hosts reachable")
    
    # Curl Tests
    curl_success = sum(1 for r in results['curl_tests'].values() if r.get('status') == 'success')
    curl_total = len(results['curl_tests'])
    print(f"🔧 Direct Curl Tests: {curl_success}/{curl_total} requests successful")
    
    # Production OAuth
    prod_oauth_status = results['production_oauth_real'].get('status', 'unknown')
    print(f"🔐 Production OAuth Config: {'✅ Working' if prod_oauth_status == 'tested' else '❌ Issues'}")
    
    # Overall Assessment
    print(f"\n" + "=" * 80)
    print("🎯 CRITICAL FINDINGS:")
    
    # Check for blocking patterns
    blocking_indicators = []
    
    if dns_success < dns_total:
        blocking_indicators.append("DNS resolution failures detected")
    
    if ssl_success < ssl_total:
        blocking_indicators.append("SSL/TLS connection issues detected")
    
    if http_success < http_total:
        blocking_indicators.append("HTTP connectivity problems detected")
    
    if oauth_status != 'reachable':
        blocking_indicators.append("OAuth token endpoint not reachable")
    
    if prod_status != 'accessible':
        blocking_indicators.append("Production environment access issues")
    
    if ping_success < ping_total:
        blocking_indicators.append("Network routing problems detected")
    
    if curl_success < curl_total:
        blocking_indicators.append("Direct curl requests failing")
    
    if blocking_indicators:
        print("❌ POTENTIAL BLOCKING DETECTED:")
        for indicator in blocking_indicators:
            print(f"   • {indicator}")
        
        print(f"\n🔍 RECOMMENDED ACTIONS:")
        print(f"   • Check firewall rules for Google OAuth domains")
        print(f"   • Verify proxy server configurations")
        print(f"   • Test from different network locations")
        print(f"   • Contact hosting provider about OAuth restrictions")
        
    else:
        print("✅ NO OBVIOUS BLOCKING DETECTED")
        print("   • All network tests passed")
        print("   • Google OAuth servers are reachable")
        print("   • Issue may be in application configuration")
    
    # Save detailed results
    try:
        with open('/app/hosting_investigation_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"\n💾 Detailed results saved to: /app/hosting_investigation_results.json")
    except Exception as e:
        print(f"\n⚠️ Could not save results file: {e}")
    
    print(f"\n🕐 Investigation completed at {datetime.now().isoformat()}")
    
    # Return success if no major blocking detected
    return len(blocking_indicators) == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)