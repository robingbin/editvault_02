#!/usr/bin/env python3
"""
Backend API Test Suite for EditVault File Upload Endpoints
Tests the new file upload functionality and verifies existing endpoints still work.
"""

import requests
import io
import os
from pathlib import Path

# Read backend URL from frontend .env
env_path = Path('/app/frontend/.env')
backend_url = None
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                backend_url = line.split('=', 1)[1].strip()
                break

if not backend_url:
    raise ValueError("Could not find REACT_APP_BACKEND_URL in /app/frontend/.env")

API_BASE = f"{backend_url}/api"

print(f"Testing backend at: {API_BASE}")
print("=" * 80)


def test_upload_file():
    """Test 1: POST /api/uploads with a test file"""
    print("\n[TEST 1] POST /api/uploads - Upload a test file")
    print("-" * 80)
    
    # Create a test image file (small PNG)
    test_file_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    files = {
        'file': ('test_image.png', io.BytesIO(test_file_content), 'image/png')
    }
    
    try:
        response = requests.post(f"{API_BASE}/uploads", files=files, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            required_fields = ['id', 'filename', 'original_name', 'content_type', 'size', 'url']
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                print(f"❌ FAILED: Missing fields in response: {missing_fields}")
                return None
            
            # Verify field values
            if data['size'] <= 0:
                print(f"❌ FAILED: File size should be > 0, got {data['size']}")
                return None
            
            if not data['url'].startswith('/api/uploads/'):
                print(f"❌ FAILED: URL should start with '/api/uploads/', got {data['url']}")
                return None
            
            if data['original_name'] != 'test_image.png':
                print(f"❌ FAILED: original_name should be 'test_image.png', got {data['original_name']}")
                return None
            
            print(f"✅ PASSED: File uploaded successfully")
            print(f"   - ID: {data['id']}")
            print(f"   - Filename: {data['filename']}")
            print(f"   - Original Name: {data['original_name']}")
            print(f"   - Content Type: {data['content_type']}")
            print(f"   - Size: {data['size']} bytes")
            print(f"   - URL: {data['url']}")
            return data
        else:
            print(f"❌ FAILED: Expected status 200, got {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {str(e)}")
        return None


def test_download_file(upload_data):
    """Test 2: GET the uploaded file URL"""
    print("\n[TEST 2] GET /api/uploads/{filename} - Download uploaded file")
    print("-" * 80)
    
    if not upload_data:
        print("⚠️  SKIPPED: No upload data from previous test")
        return False
    
    file_url = f"{backend_url}{upload_data['url']}"
    
    try:
        response = requests.get(file_url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type')}")
        print(f"Content-Length: {len(response.content)} bytes")
        
        if response.status_code == 200:
            if len(response.content) == 0:
                print(f"❌ FAILED: Response body is empty")
                return False
            
            # Verify content type matches
            expected_ct = upload_data['content_type']
            actual_ct = response.headers.get('content-type', '')
            
            if not actual_ct.startswith(expected_ct.split(';')[0]):
                print(f"⚠️  WARNING: Content-Type mismatch. Expected: {expected_ct}, Got: {actual_ct}")
            
            print(f"✅ PASSED: File downloaded successfully with non-zero body")
            return True
        else:
            print(f"❌ FAILED: Expected status 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {str(e)}")
        return False


def test_download_with_custom_filename(upload_data):
    """Test 3: GET with ?download=custom.mp4 query parameter"""
    print("\n[TEST 3] GET /api/uploads/{filename}?download=custom.mp4 - Custom filename download")
    print("-" * 80)
    
    if not upload_data:
        print("⚠️  SKIPPED: No upload data from previous test")
        return False
    
    file_url = f"{backend_url}{upload_data['url']}?download=custom.mp4"
    
    try:
        response = requests.get(file_url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Content-Disposition: {response.headers.get('content-disposition')}")
        
        if response.status_code == 200:
            content_disp = response.headers.get('content-disposition', '')
            expected_header = 'attachment; filename="custom.mp4"'
            
            if content_disp == expected_header:
                print(f"✅ PASSED: Custom filename download header is correct")
                return True
            else:
                print(f"❌ FAILED: Content-Disposition header mismatch")
                print(f"   Expected: {expected_header}")
                print(f"   Got: {content_disp}")
                return False
        else:
            print(f"❌ FAILED: Expected status 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {str(e)}")
        return False


def test_404_nonexistent_file():
    """Test 4: GET /api/uploads/does_not_exist.mp4 - Verify 404 for non-existent file"""
    print("\n[TEST 4] GET /api/uploads/does_not_exist.mp4 - Verify 404 response")
    print("-" * 80)
    
    file_url = f"{API_BASE}/uploads/does_not_exist.mp4"
    
    try:
        response = requests.get(file_url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print(f"✅ PASSED: Correctly returns 404 for non-existent file")
            return True
        else:
            print(f"❌ FAILED: Expected status 404, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {str(e)}")
        return False


def test_existing_endpoints():
    """Test 5: Verify existing /api/ and /api/status endpoints still work"""
    print("\n[TEST 5] Verify existing endpoints still work")
    print("-" * 80)
    
    all_passed = True
    
    # Test GET /api/
    print("\n5a) GET /api/ - Root endpoint")
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if 'message' in data:
                print(f"   ✅ PASSED: Root endpoint working")
            else:
                print(f"   ❌ FAILED: Response missing 'message' field")
                all_passed = False
        else:
            print(f"   ❌ FAILED: Expected status 200, got {response.status_code}")
            all_passed = False
    except Exception as e:
        print(f"   ❌ FAILED: Exception occurred: {str(e)}")
        all_passed = False
    
    # Test POST /api/status
    print("\n5b) POST /api/status - Create status check")
    try:
        payload = {"client_name": "test_client"}
        response = requests.post(f"{API_BASE}/status", json=payload, timeout=10)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if 'id' in data and 'client_name' in data and data['client_name'] == 'test_client':
                print(f"   ✅ PASSED: POST /api/status working")
            else:
                print(f"   ❌ FAILED: Response structure incorrect")
                all_passed = False
        else:
            print(f"   ❌ FAILED: Expected status 200, got {response.status_code}")
            all_passed = False
    except Exception as e:
        print(f"   ❌ FAILED: Exception occurred: {str(e)}")
        all_passed = False
    
    # Test GET /api/status
    print("\n5c) GET /api/status - Get status checks")
    try:
        response = requests.get(f"{API_BASE}/status", timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"   Response: List with {len(data)} items")
                print(f"   ✅ PASSED: GET /api/status working")
            else:
                print(f"   ❌ FAILED: Response should be a list")
                all_passed = False
        else:
            print(f"   ❌ FAILED: Expected status 200, got {response.status_code}")
            all_passed = False
    except Exception as e:
        print(f"   ❌ FAILED: Exception occurred: {str(e)}")
        all_passed = False
    
    return all_passed


def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("EDITVAULT FILE UPLOAD ENDPOINTS TEST SUITE")
    print("=" * 80)
    
    results = {
        'test_1_upload': False,
        'test_2_download': False,
        'test_3_custom_filename': False,
        'test_4_404': False,
        'test_5_existing_endpoints': False
    }
    
    # Test 1: Upload file
    upload_data = test_upload_file()
    results['test_1_upload'] = upload_data is not None
    
    # Test 2: Download file
    results['test_2_download'] = test_download_file(upload_data)
    
    # Test 3: Download with custom filename
    results['test_3_custom_filename'] = test_download_with_custom_filename(upload_data)
    
    # Test 4: 404 for non-existent file
    results['test_4_404'] = test_404_nonexistent_file()
    
    # Test 5: Existing endpoints
    results['test_5_existing_endpoints'] = test_existing_endpoints()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    total = len(results)
    passed = sum(results.values())
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit(main())
