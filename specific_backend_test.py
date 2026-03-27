#!/usr/bin/env python3

import requests
import json
from datetime import datetime

def test_specific_endpoints():
    """Test the specific endpoints mentioned in the review request"""
    base_url = "https://code-exec-3.preview.emergentagent.com"
    
    print("🏠 EstateX Backend API - Specific Endpoint Testing")
    print("=" * 60)
    
    # Test 1: GET /api/properties
    print("\n1. Testing GET /api/properties")
    try:
        response = requests.get(f"{base_url}/api/properties")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SUCCESS - Found {len(data)} properties")
            if data:
                print(f"   📊 Sample property ID: {data[0]['property_id']}")
                sample_property_id = data[0]['property_id']
            else:
                sample_property_id = None
        else:
            print(f"   ❌ FAILED - {response.text}")
            sample_property_id = None
    except Exception as e:
        print(f"   💥 ERROR: {e}")
        sample_property_id = None
    
    # Test 2: GET /api/properties/{id}
    print("\n2. Testing GET /api/properties/{id}")
    if sample_property_id:
        try:
            response = requests.get(f"{base_url}/api/properties/{sample_property_id}")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS - Property details retrieved")
                print(f"   📊 Property: {data.get('title', 'N/A')}")
                print(f"   📊 Price: ${data.get('price', 'N/A'):,}")
                print(f"   📊 Type: {data.get('property_type', 'N/A')}")
            else:
                print(f"   ❌ FAILED - {response.text}")
        except Exception as e:
            print(f"   💥 ERROR: {e}")
    else:
        print("   ⚠️  SKIPPED - No property ID available")
    
    # Test 3: POST /api/inquiries
    print("\n3. Testing POST /api/inquiries")
    inquiry_data = {
        "name": "Test User",
        "email": "test@example.com", 
        "phone": "+00000-00000",
        "message": "Test inquiry",
        "inquiry_type": "general"
    }
    try:
        response = requests.post(
            f"{base_url}/api/inquiries",
            json=inquiry_data,
            headers={'Content-Type': 'application/json'}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SUCCESS - Inquiry created")
            print(f"   📊 Inquiry ID: {data.get('inquiry_id', 'N/A')}")
            print(f"   📊 Name: {data.get('name', 'N/A')}")
            print(f"   📊 Type: {data.get('inquiry_type', 'N/A')}")
        else:
            print(f"   ❌ FAILED - {response.text}")
    except Exception as e:
        print(f"   💥 ERROR: {e}")
    
    # Test 4: POST /api/admin/login
    print("\n4. Testing POST /api/admin/login")
    admin_credentials = {
        "email": "admin@estatex.com",
        "password": "admin1234"
    }
    admin_token = None
    try:
        response = requests.post(
            f"{base_url}/api/admin/login",
            json=admin_credentials,
            headers={'Content-Type': 'application/json'}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            admin_token = data.get('access_token')
            print(f"   ✅ SUCCESS - Admin login successful")
            print(f"   📊 Token type: {data.get('token_type', 'N/A')}")
            print(f"   📊 Admin name: {data.get('admin', {}).get('name', 'N/A')}")
            print(f"   🔑 Token: {admin_token[:30]}..." if admin_token else "   🔑 No token")
        else:
            print(f"   ❌ FAILED - {response.text}")
    except Exception as e:
        print(f"   💥 ERROR: {e}")
    
    # Test 5: GET /api/admin/analytics (with Bearer token)
    print("\n5. Testing GET /api/admin/analytics (with Bearer token)")
    if admin_token:
        try:
            headers = {
                'Authorization': f'Bearer {admin_token}',
                'Content-Type': 'application/json'
            }
            response = requests.get(f"{base_url}/api/admin/analytics", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS - Analytics data retrieved")
                print(f"   📊 Total Properties: {data.get('total_properties', 'N/A')}")
                print(f"   📊 Total Inquiries: {data.get('total_inquiries', 'N/A')}")
                print(f"   📊 Unread Inquiries: {data.get('unread_inquiries', 'N/A')}")
                print(f"   📊 Properties by Type: {len(data.get('properties_by_type', []))} types")
                print(f"   📊 Properties by Status: {len(data.get('properties_by_status', []))} statuses")
            else:
                print(f"   ❌ FAILED - {response.text}")
        except Exception as e:
            print(f"   💥 ERROR: {e}")
    else:
        print("   ⚠️  SKIPPED - No admin token available")
    
    print("\n" + "=" * 60)
    print("✅ All specific endpoint tests completed!")
    print("🎯 Backend URL used: https://code-exec-3.preview.emergentagent.com")

if __name__ == "__main__":
    test_specific_endpoints()